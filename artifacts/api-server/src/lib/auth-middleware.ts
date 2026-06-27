import { Request, Response, NextFunction } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user[0]) {
    req.session.destroy(() => {});
    res.status(401).json({ error: "User not found" });
    return;
  }

  (req as any).currentUser = user[0];
  next();
}

export function getCurrentUser(req: Request) {
  return (req as any).currentUser as typeof usersTable.$inferSelect;
}
