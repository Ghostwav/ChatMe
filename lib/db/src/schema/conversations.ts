import { pgTable, serial, text, integer, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const conversationTypeEnum = pgEnum("conversation_type", ["direct", "group"]);

export const conversationsTable = pgTable("conversations", {
  id: serial("id").primaryKey(),
  type: conversationTypeEnum("type").notNull(),
  name: text("name"),
  description: text("description"),
  avatarUrl: text("avatar_url"),
  createdBy: integer("created_by").references(() => usersTable.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversationMembersTable = pgTable("conversation_members", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversationsTable.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  role: text("role", { enum: ["admin", "member"] }).default("member").notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const insertConversationSchema = createInsertSchema(conversationsTable).omit({ id: true, createdAt: true });
export type InsertConversation = z.infer<typeof insertConversationSchema>;
export type Conversation = typeof conversationsTable.$inferSelect;

export const insertConversationMemberSchema = createInsertSchema(conversationMembersTable).omit({ id: true, joinedAt: true });
export type InsertConversationMember = z.infer<typeof insertConversationMemberSchema>;
export type ConversationMember = typeof conversationMembersTable.$inferSelect;
