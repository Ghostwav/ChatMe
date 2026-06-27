import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq, ilike, or, ne } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth-middleware";

const router = Router();

const formatUser = (u: typeof usersTable.$inferSelect) => ({
  ...u,
  createdAt: u.createdAt.toISOString(),
  lastSeen: u.lastSeen?.toISOString() ?? null,
});

// GET /users
router.get("/users", requireAuth, async (req, res) => {
  const search = req.query.search as string | undefined;
  const me = getCurrentUser(req);

  let users;
  if (search) {
    users = await db.select().from(usersTable)
      .where(or(
        ilike(usersTable.username, `%${search}%`),
        ilike(usersTable.displayName, `%${search}%`)
      ));
  } else {
    users = await db.select().from(usersTable).where(ne(usersTable.id, me.id));
  }

  res.json(users.map(formatUser));
});

// GET /users/profile  — must come before /users/:userId
router.put("/users/profile", requireAuth, async (req, res) => {
  const me = getCurrentUser(req);
  const { displayName, avatarUrl, statusText } = req.body;

  const updates: Partial<typeof usersTable.$inferSelect> = {};
  if (displayName !== undefined) updates.displayName = displayName;
  if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;
  if (statusText !== undefined) updates.statusText = statusText;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, me.id)).returning();
  res.json(formatUser(updated));
});

// GET /users/:userId
router.get("/users/:userId", requireAuth, async (req, res) => {
  const userId = parseInt(String(req.params.userId));
  if (isNaN(userId)) { res.status(400).json({ error: "Invalid userId" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  res.json(formatUser(user));
});

export default router;
