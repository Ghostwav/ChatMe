import { Router } from "express";
import { db, usersTable, conversationsTable, conversationMembersTable, messagesTable, messageReactionsTable, messageReadsTable } from "@workspace/db";
import { eq, and, lt, desc, ilike, or, sql } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth-middleware";
import { formatMessage } from "./conversations";

const router = Router();

// GET /conversations/:conversationId/messages
router.get("/conversations/:conversationId/messages", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const convId = parseInt(String(req.params.conversationId));
  const before = req.query.before ? parseInt(req.query.before as string) : undefined;
  const limit = Math.min(parseInt(req.query.limit as string || "50"), 100);

  const [member] = await db.select().from(conversationMembersTable)
    .where(and(eq(conversationMembersTable.conversationId, convId), eq(conversationMembersTable.userId, me.id)));
  if (!member) { res.status(403).json({ error: "Not a member" }); return; }

  let query = db.select().from(messagesTable)
    .where(and(
      eq(messagesTable.conversationId, convId),
      ...(before ? [lt(messagesTable.id, before)] : [])
    ))
    .orderBy(desc(messagesTable.createdAt))
    .limit(limit);

  const msgs = await query;
  const formatted = await Promise.all(msgs.reverse().map(m => formatMessage(m, me.id)));
  res.json(formatted);
});

// POST /conversations/:conversationId/messages
router.post("/conversations/:conversationId/messages", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const convId = parseInt(String(req.params.conversationId));
  const { type, content, mediaUrl, mediaType, mediaSize, fileName, replyToId } = req.body;

  const [member] = await db.select().from(conversationMembersTable)
    .where(and(eq(conversationMembersTable.conversationId, convId), eq(conversationMembersTable.userId, me.id)));
  if (!member) { res.status(403).json({ error: "Not a member" }); return; }

  const [msg] = await db.insert(messagesTable).values({
    conversationId: convId,
    senderId: me.id,
    type: type || "text",
    content: content ?? null,
    mediaUrl: mediaUrl ?? null,
    mediaType: mediaType ?? null,
    mediaSize: mediaSize ?? null,
    fileName: fileName ?? null,
    replyToId: replyToId ?? null,
  }).returning();

  const formatted = await formatMessage(msg, me.id);

  // Emit to socket room
  const io = (req as any).io;
  if (io) {
    io.to(`conversation:${convId}`).emit("new_message", formatted);
  }

  res.status(201).json(formatted);
});

// DELETE /messages/:messageId
router.delete("/messages/:messageId", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const msgId = parseInt(String(req.params.messageId));

  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, msgId));
  if (!msg) { res.status(404).json({ error: "Not found" }); return; }
  if (msg.senderId !== me.id) { res.status(403).json({ error: "Forbidden" }); return; }

  await db.update(messagesTable).set({ isDeleted: true, content: null }).where(eq(messagesTable.id, msgId));

  const io = (req as any).io;
  if (io) {
    io.to(`conversation:${msg.conversationId}`).emit("message_deleted", { messageId: msgId, conversationId: msg.conversationId });
  }

  res.json({ success: true });
});

// POST /messages/:messageId/react
router.post("/messages/:messageId/react", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const msgId = parseInt(String(req.params.messageId));
  const { emoji } = req.body;

  const existing = await db.select().from(messageReactionsTable)
    .where(and(eq(messageReactionsTable.messageId, msgId), eq(messageReactionsTable.userId, me.id), eq(messageReactionsTable.emoji, emoji)));

  if (existing.length) {
    await db.delete(messageReactionsTable)
      .where(and(eq(messageReactionsTable.messageId, msgId), eq(messageReactionsTable.userId, me.id), eq(messageReactionsTable.emoji, emoji)));
  } else {
    await db.insert(messageReactionsTable).values({ messageId: msgId, userId: me.id, emoji });
  }

  const io = (req as any).io;
  const [msg] = await db.select().from(messagesTable).where(eq(messagesTable.id, msgId));
  if (io && msg) {
    io.to(`conversation:${msg.conversationId}`).emit("message_reaction", {
      messageId: msgId,
      conversationId: msg.conversationId,
      userId: me.id,
      emoji,
      removed: existing.length > 0,
    });
  }

  res.json({ success: true });
});

// GET /messages/search  — must come before /:messageId routes
router.get("/messages/search", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const q = req.query.q as string;
  const convIdParam = req.query.conversationId ? parseInt(req.query.conversationId as string) : undefined;

  if (!q) { res.status(400).json({ error: "q required" }); return; }

  const myConvIds = await db.select({ conversationId: conversationMembersTable.conversationId })
    .from(conversationMembersTable).where(eq(conversationMembersTable.userId, me.id));

  const convIds = myConvIds.map(c => c.conversationId);
  if (!convIds.length) { res.json([]); return; }

  let msgs;
  if (convIdParam && convIds.includes(convIdParam)) {
    msgs = await db.select().from(messagesTable)
      .where(and(eq(messagesTable.conversationId, convIdParam), ilike(messagesTable.content, `%${q}%`)))
      .orderBy(desc(messagesTable.createdAt)).limit(50);
  } else {
    msgs = await db.select().from(messagesTable)
      .where(and(
        sql`${messagesTable.conversationId} = ANY(${sql`ARRAY[${sql.join(convIds.map(id => sql`${id}`), sql`, `)}]`})`,
        ilike(messagesTable.content, `%${q}%`)
      ))
      .orderBy(desc(messagesTable.createdAt)).limit(50);
  }

  const formatted = await Promise.all(msgs.map(m => formatMessage(m, me.id)));
  res.json(formatted);
});

export default router;
