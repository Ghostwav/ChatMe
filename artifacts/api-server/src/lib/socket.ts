import { Server as SocketServer } from "socket.io";
import { Server as HttpServer } from "http";
import { db, usersTable, conversationMembersTable, messagesTable, messageReadsTable } from "@workspace/db";
import { eq, and, ne, sql } from "drizzle-orm";
import { sessionMiddleware } from "./session";

export function createSocketServer(httpServer: HttpServer) {
  const io = new SocketServer(httpServer, {
    path: "/api/socket.io",
    cors: { origin: "*", credentials: true },
  });

  // Share express session with socket.io
  io.use((socket, next) => {
    (sessionMiddleware as any)(socket.request, {} as any, next);
  });

  io.use(async (socket, next) => {
    const session = (socket.request as any).session;
    const userId = session?.userId;
    if (!userId) {
      next(new Error("Unauthorized"));
      return;
    }
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
    if (!user) { next(new Error("User not found")); return; }

    socket.data.userId = userId;
    socket.data.user = user;
    next();
  });

  io.on("connection", async (socket) => {
    const userId = socket.data.userId as number;

    // Mark user online
    await db.update(usersTable).set({ isOnline: true, lastSeen: new Date() }).where(eq(usersTable.id, userId));
    socket.broadcast.emit("user_online", { userId });

    // Join all user's conversation rooms
    const myConvs = await db.select({ conversationId: conversationMembersTable.conversationId })
      .from(conversationMembersTable).where(eq(conversationMembersTable.userId, userId));
    for (const { conversationId } of myConvs) {
      socket.join(`conversation:${conversationId}`);
    }

    // Join conversation room
    socket.on("join_conversation", (conversationId: number) => {
      socket.join(`conversation:${conversationId}`);
    });

    // Leave conversation room
    socket.on("leave_conversation", (conversationId: number) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // Typing indicators
    socket.on("typing_start", ({ conversationId }: { conversationId: number }) => {
      socket.to(`conversation:${conversationId}`).emit("typing", {
        conversationId,
        userId,
        displayName: socket.data.user?.displayName,
        isTyping: true,
      });
    });

    socket.on("typing_stop", ({ conversationId }: { conversationId: number }) => {
      socket.to(`conversation:${conversationId}`).emit("typing", {
        conversationId,
        userId,
        isTyping: false,
      });
    });

    // Mark read
    socket.on("mark_read", async ({ conversationId }: { conversationId: number }) => {
      const unread = await db.select({ id: messagesTable.id })
        .from(messagesTable)
        .where(and(
          eq(messagesTable.conversationId, conversationId),
          ne(messagesTable.senderId, userId),
          sql`${messagesTable.id} not in (select message_id from message_reads where user_id = ${userId})`
        ));

      if (unread.length) {
        await db.insert(messageReadsTable).values(
          unread.map(m => ({ messageId: m.id, userId }))
        ).onConflictDoNothing();

        io.to(`conversation:${conversationId}`).emit("messages_read", {
          conversationId,
          userId,
          messageIds: unread.map(m => m.id),
        });
      }
    });

    // Disconnect
    socket.on("disconnect", async () => {
      const lastSeen = new Date();
      await db.update(usersTable).set({ isOnline: false, lastSeen }).where(eq(usersTable.id, userId));
      socket.broadcast.emit("user_offline", {
        userId,
        lastSeen: lastSeen.toISOString(),
      });
    });
  });

  return io;
}
