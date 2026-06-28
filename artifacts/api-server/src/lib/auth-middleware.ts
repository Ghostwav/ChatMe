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
  let userId: number | undefined = req.session?.userId;

  if (!userId) {
    const authHeader = req.headers["authorization"];
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const parsed = parseInt(authHeader.slice(7).trim(), 10);
      if (!isNaN(parsed) && parsed > 0) userId = parsed;
    }
  }

  if (!userId) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (!user[0]) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  (req as any).currentUser = user[0];
  next();
}

export function getCurrentUser(req: Request) {
  return (req as any).currentUser as typeof usersTable.$inferSelect;
}
