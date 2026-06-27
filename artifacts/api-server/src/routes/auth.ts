import { Router } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, getCurrentUser } from "../lib/auth-middleware";

const router = Router();

// POST /auth/login
router.post("/auth/login", async (req, res) => {
  const { username, displayName } = req.body;
  if (!username || typeof username !== "string") {
    res.status(400).json({ error: "Username required" });
    return;
  }

  const clean = username.trim().toLowerCase();
  if (clean.length < 2) {
    res.status(400).json({ error: "Username too short" });
    return;
  }

  let user = (await db.select().from(usersTable).where(eq(usersTable.username, clean)))[0];

  if (!user) {
    const [created] = await db.insert(usersTable).values({
      username: clean,
      displayName: (displayName || username).trim(),
    }).returning();
    user = created;
  }

  // Mark online
  await db.update(usersTable).set({ isOnline: true, lastSeen: new Date() }).where(eq(usersTable.id, user.id));
  user.isOnline = true;

  req.session.userId = user.id;

  res.json({
    user: {
      ...user,
      createdAt: user.createdAt.toISOString(),
      lastSeen: user.lastSeen?.toISOString() ?? null,
    },
    token: String(user.id),
  });
});

// POST /auth/logout
router.post("/auth/logout", requireAuth, async (req, res) => {
  const user = getCurrentUser(req);
  await db.update(usersTable).set({ isOnline: false, lastSeen: new Date() }).where(eq(usersTable.id, user.id));
  req.session.destroy(() => {});
  res.json({ success: true });
});

// GET /auth/me
router.get("/auth/me", requireAuth, (req, res) => {
  const user = getCurrentUser(req);
  res.json({
    ...user,
    createdAt: user.createdAt.toISOString(),
    lastSeen: user.lastSeen?.toISOString() ?? null,
  });
});

export default router;
