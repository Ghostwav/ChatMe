import { Router } from "express";
import { db, usersTable, conversationsTable, conversationMembersTable, messagesTable, messageReactionsTable, messageReadsTable } from "@workspace/db";
import { eq, and, inArray, desc, sql, ne } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth-middleware";

const router = Router();

const formatUser = (u: typeof usersTable.$inferSelect) => ({
  ...u,
  createdAt: u.createdAt.toISOString(),
  lastSeen: u.lastSeen?.toISOString() ?? null,
});

async function formatMessage(msg: typeof messagesTable.$inferSelect, currentUserId: number) {
  const sender = (await db.select().from(usersTable).where(eq(usersTable.id, msg.senderId)))[0];
  const reactions = await db.select({
    emoji: messageReactionsTable.emoji,
    userId: messageReactionsTable.userId,
    userName: usersTable.displayName,
  }).from(messageReactionsTable)
    .leftJoin(usersTable, eq(messageReactionsTable.userId, usersTable.id))
    .where(eq(messageReactionsTable.messageId, msg.id));

  const reads = await db.select({ userId: messageReadsTable.userId })
    .from(messageReadsTable).where(eq(messageReadsTable.messageId, msg.id));

  let replyTo = null;
  if (msg.replyToId) {
    const [reply] = await db.select().from(messagesTable).where(eq(messagesTable.id, msg.replyToId));
    if (reply) {
      const replySender = (await db.select().from(usersTable).where(eq(usersTable.id, reply.senderId)))[0];
      replyTo = {
        id: reply.id,
        content: reply.content,
        senderId: reply.senderId,
        senderName: replySender?.displayName ?? "Unknown",
        type: reply.type,
      };
    }
  }

  return {
    ...msg,
    sender: sender ? formatUser(sender) : null,
    reactions: reactions.map(r => ({ emoji: r.emoji, userId: r.userId, userName: r.userName ?? "" })),
    readBy: reads.map(r => r.userId),
    replyTo,
    createdAt: msg.createdAt.toISOString(),
    updatedAt: msg.updatedAt.toISOString(),
  };
}

async function getConversationWithMembers(convId: number) {
  const [conv] = await db.select().from(conversationsTable).where(eq(conversationsTable.id, convId));
  if (!conv) return null;

  const members = await db.select({
    userId: conversationMembersTable.userId,
    role: conversationMembersTable.role,
    joinedAt: conversationMembersTable.joinedAt,
    user: usersTable,
  }).from(conversationMembersTable)
    .leftJoin(usersTable, eq(conversationMembersTable.userId, usersTable.id))
    .where(eq(conversationMembersTable.conversationId, convId));

  return {
    ...conv,
    createdAt: conv.createdAt.toISOString(),
    members: members.map(m => ({
      userId: m.userId,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      user: m.user ? formatUser(m.user) : null,
    })),
  };
}

// GET /conversations
router.get("/conversations", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);

  const myConvIds = await db.select({ conversationId: conversationMembersTable.conversationId })
    .from(conversationMembersTable).where(eq(conversationMembersTable.userId, me.id));

  if (!myConvIds.length) { res.json([]); return; }

  const ids = myConvIds.map(c => c.conversationId);
  const convs = await db.select().from(conversationsTable).where(inArray(conversationsTable.id, ids));

  const result = await Promise.all(convs.map(async (conv) => {
    const members = await db.select({
      userId: conversationMembersTable.userId,
      role: conversationMembersTable.role,
      joinedAt: conversationMembersTable.joinedAt,
      user: usersTable,
    }).from(conversationMembersTable)
      .leftJoin(usersTable, eq(conversationMembersTable.userId, usersTable.id))
      .where(eq(conversationMembersTable.conversationId, conv.id));

    const [lastMsg] = await db.select().from(messagesTable)
      .where(eq(messagesTable.conversationId, conv.id))
      .orderBy(desc(messagesTable.createdAt)).limit(1);

    const unreadCount = await db.select({ count: sql<number>`count(*)` })
      .from(messagesTable)
      .where(and(
        eq(messagesTable.conversationId, conv.id),
        ne(messagesTable.senderId, me.id),
        sql`${messagesTable.id} not in (select message_id from message_reads where user_id = ${me.id})`
      ));

    let otherUser = null;
    if (conv.type === "direct") {
      const other = members.find(m => m.userId !== me.id);
      if (other?.user) otherUser = formatUser(other.user);
    }

    return {
      id: conv.id,
      type: conv.type,
      name: conv.name,
      description: conv.description,
      avatarUrl: conv.avatarUrl,
      createdBy: conv.createdBy,
      createdAt: conv.createdAt.toISOString(),
      lastMessage: lastMsg ? await formatMessage(lastMsg, me.id) : null,
      unreadCount: Number(unreadCount[0]?.count ?? 0),
      otherUser,
      memberCount: members.length,
    };
  }));

  result.sort((a, b) => {
    const aTime = a.lastMessage?.createdAt ?? a.createdAt;
    const bTime = b.lastMessage?.createdAt ?? b.createdAt;
    return bTime.localeCompare(aTime);
  });

  res.json(result);
});

// POST /conversations
router.post("/conversations", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const { type, memberIds, name, description, avatarUrl } = req.body;

  if (type === "direct") {
    const otherId = memberIds?.[0];
    if (!otherId) { res.status(400).json({ error: "Provide memberIds for direct chat" }); return; }

    // Check if direct conv already exists
    const existing = await db.execute(sql`
      SELECT c.id FROM conversations c
      JOIN conversation_members cm1 ON cm1.conversation_id = c.id AND cm1.user_id = ${me.id}
      JOIN conversation_members cm2 ON cm2.conversation_id = c.id AND cm2.user_id = ${otherId}
      WHERE c.type = 'direct'
      LIMIT 1
    `);
    if (existing.rows.length > 0) {
      const existing2 = await getConversationWithMembers(Number(existing.rows[0].id));
      res.status(201).json(existing2);
      return;
    }
  }

  const [conv] = await db.insert(conversationsTable).values({
    type,
    name: name ?? null,
    description: description ?? null,
    avatarUrl: avatarUrl ?? null,
    createdBy: me.id,
  }).returning();

  const allMemberIds = Array.from(new Set([me.id, ...(memberIds ?? [])]));
  await db.insert(conversationMembersTable).values(
    allMemberIds.map((uid: number) => ({
      conversationId: conv.id,
      userId: uid,
      role: (uid === me.id ? "admin" : "member") as "admin" | "member",
    }))
  );

  const full = await getConversationWithMembers(conv.id);
  res.status(201).json(full);
});

// GET /conversations/:conversationId
router.get("/conversations/:conversationId", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const convId = parseInt(String(req.params.conversationId));
  if (isNaN(convId)) { res.status(400).json({ error: "Invalid conversationId" }); return; }

  const member = await db.select().from(conversationMembersTable)
    .where(and(eq(conversationMembersTable.conversationId, convId), eq(conversationMembersTable.userId, me.id)));
  if (!member.length) { res.status(403).json({ error: "Not a member" }); return; }

  const full = await getConversationWithMembers(convId);
  if (!full) { res.status(404).json({ error: "Not found" }); return; }
  res.json(full);
});

// PUT /conversations/:conversationId
router.put("/conversations/:conversationId", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const convId = parseInt(String(req.params.conversationId));
  const { name, description, avatarUrl } = req.body;

  const [member] = await db.select().from(conversationMembersTable)
    .where(and(eq(conversationMembersTable.conversationId, convId), eq(conversationMembersTable.userId, me.id)));
  if (!member) { res.status(403).json({ error: "Not a member" }); return; }

  const updates: any = {};
  if (name !== undefined) updates.name = name;
  if (description !== undefined) updates.description = description;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

  await db.update(conversationsTable).set(updates).where(eq(conversationsTable.id, convId));
  const full = await getConversationWithMembers(convId);
  res.json(full);
});

// DELETE /conversations/:conversationId
router.delete("/conversations/:conversationId", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const convId = parseInt(String(req.params.conversationId));

  await db.delete(conversationMembersTable)
    .where(and(eq(conversationMembersTable.conversationId, convId), eq(conversationMembersTable.userId, me.id)));

  res.json({ success: true });
});

// GET /conversations/:conversationId/members
router.get("/conversations/:conversationId/members", requireAuth, async (req, res) => {
  const convId = parseInt(String(req.params.conversationId));
  const members = await db.select({
    userId: conversationMembersTable.userId,
    role: conversationMembersTable.role,
    joinedAt: conversationMembersTable.joinedAt,
    user: usersTable,
  }).from(conversationMembersTable)
    .leftJoin(usersTable, eq(conversationMembersTable.userId, usersTable.id))
    .where(eq(conversationMembersTable.conversationId, convId));

  res.json(members.map(m => ({
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    user: m.user ? formatUser(m.user) : null,
  })));
});

// POST /conversations/:conversationId/members
router.post("/conversations/:conversationId/members", requireAuth, async (req, res) => {
  const convId = parseInt(String(req.params.conversationId));
  const { userIds } = req.body;

  const existing = await db.select({ userId: conversationMembersTable.userId })
    .from(conversationMembersTable).where(eq(conversationMembersTable.conversationId, convId));
  const existingIds = new Set(existing.map(e => e.userId));

  const newIds = (userIds as number[]).filter(id => !existingIds.has(id));
  if (newIds.length) {
    await db.insert(conversationMembersTable).values(
      newIds.map(uid => ({ conversationId: convId, userId: uid, role: "member" as const }))
    );
  }
  res.json({ success: true });
});

// DELETE /conversations/:conversationId/members/:userId
router.delete("/conversations/:conversationId/members/:userId", requireAuth, async (req, res) => {
  const convId = parseInt(String(req.params.conversationId));
  const userId = parseInt(String(req.params.userId));
  await db.delete(conversationMembersTable)
    .where(and(eq(conversationMembersTable.conversationId, convId), eq(conversationMembersTable.userId, userId)));
  res.json({ success: true });
});

// POST /conversations/:conversationId/read
router.post("/conversations/:conversationId/read", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const convId = parseInt(String(req.params.conversationId));

  const unread = await db.select({ id: messagesTable.id }).from(messagesTable)
    .where(and(
      eq(messagesTable.conversationId, convId),
      ne(messagesTable.senderId, me.id),
      sql`${messagesTable.id} not in (select message_id from message_reads where user_id = ${me.id})`
    ));

  if (unread.length) {
    await db.insert(messageReadsTable).values(
      unread.map(m => ({ messageId: m.id, userId: me.id }))
    ).onConflictDoNothing();
  }

  res.json({ success: true });
});

// GET /conversations/unread-counts
router.get("/conversations/unread-counts", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);

  const myConvIds = await db.select({ conversationId: conversationMembersTable.conversationId })
    .from(conversationMembersTable).where(eq(conversationMembersTable.userId, me.id));

  const counts = await Promise.all(myConvIds.map(async ({ conversationId }) => {
    const [row] = await db.select({ count: sql<number>`count(*)` })
      .from(messagesTable)
      .where(and(
        eq(messagesTable.conversationId, conversationId),
        ne(messagesTable.senderId, me.id),
        sql`${messagesTable.id} not in (select message_id from message_reads where user_id = ${me.id})`
      ));
    return { conversationId, count: Number(row?.count ?? 0) };
  }));

  res.json(counts);
});

export { getConversationWithMembers, formatMessage };
export default router;
