import { createInsertSchema } from "drizzle-zod";
import {
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const advisoryRequestsTable = pgTable("advisory_requests", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id),
  advisoryType: varchar("advisory_type", { length: 50 }).notNull(),
  inputPayload: jsonb("input_payload").$type<Record<string, unknown>>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const aiResponsesTable = pgTable("ai_responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  requestId: uuid("request_id")
    .notNull()
    .references(() => advisoryRequestsTable.id, { onDelete: "cascade" }),
  structuredData: jsonb("structured_data")
    .$type<Record<string, unknown>>()
    .notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

export const insertAdvisoryRequestSchema = createInsertSchema(
  advisoryRequestsTable,
).omit({ id: true, createdAt: true });
export type InsertAdvisoryRequest = z.infer<typeof insertAdvisoryRequestSchema>;
export type AdvisoryRequest = typeof advisoryRequestsTable.$inferSelect;

export const insertAiResponseSchema = createInsertSchema(aiResponsesTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAiResponse = z.infer<typeof insertAiResponseSchema>;
export type AiResponse = typeof aiResponsesTable.$inferSelect;