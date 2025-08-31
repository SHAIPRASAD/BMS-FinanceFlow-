import { sql, relations } from 'drizzle-orm';
import {
  pgTable,
  varchar,
  text,
  timestamp,
  decimal,
  uuid,
  boolean,
  integer,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email", { length: 255 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 255 }).notNull().unique(),
  isAdmin: boolean("is_admin").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Beneficiaries table
export const beneficiaries = pgTable("beneficiaries", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: varchar("name", { length: 255 }).notNull(),
  accountNumber: varchar("account_number", { length: 255 }).notNull(),
  country: varchar("country", { length: 2 }).notNull(), // ISO country code
  currency: varchar("currency", { length: 3 }).notNull(), // ISO currency code
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  beneficiaryId: uuid("beneficiary_id").notNull().references(() => beneficiaries.id),
  sourceAmount: decimal("source_amount", { precision: 10, scale: 2 }).notNull(),
  sourceCurrency: varchar("source_currency", { length: 3 }).notNull().default('USD'),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  targetCurrency: varchar("target_currency", { length: 3 }).notNull(),
  exchangeRate: decimal("exchange_rate", { precision: 10, scale: 6 }).notNull(),
  baseFee: decimal("base_fee", { precision: 8, scale: 2 }).notNull(),
  exchangeFee: decimal("exchange_fee", { precision: 8, scale: 2 }).notNull(),
  totalFee: decimal("total_fee", { precision: 8, scale: 2 }).notNull(),
  purpose: varchar("purpose", { length: 100 }).notNull(),
  status: varchar("status", { length: 20 }).notNull().default('completed'), // pending, processing, completed, failed
  isHighRisk: boolean("is_high_risk").default(false).notNull(),
  adminNotes: text("admin_notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// FX rates cache table
export const fxRates = pgTable("fx_rates", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  baseCurrency: varchar("base_currency", { length: 3 }).notNull().default('USD'),
  rates: jsonb("rates").notNull(), // JSON object with currency rates
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  beneficiaries: many(beneficiaries),
  transactions: many(transactions),
}));

export const beneficiariesRelations = relations(beneficiaries, ({ one, many }) => ({
  user: one(users, {
    fields: [beneficiaries.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  beneficiary: one(beneficiaries, {
    fields: [transactions.beneficiaryId],
    references: [beneficiaries.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  accountNumber: true,
  isAdmin: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  password: z.string().min(8, "Password must be at least 8 characters"),
  email: z.string().email("Invalid email address"),
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const insertBeneficiarySchema = createInsertSchema(beneficiaries).omit({
  id: true,
  userId: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  accountNumber: z.string().min(5, "Account number must be at least 5 characters"),
  country: z.string().length(2, "Country must be 2-letter ISO code"),
  currency: z.string().length(3, "Currency must be 3-letter ISO code"),
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  userId: true,
  status: true,
  isHighRisk: true,
  adminNotes: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  sourceAmount: z.string().refine((val) => !isNaN(Number(val)) && Number(val) > 0, "Amount must be a positive number"),
  purpose: z.string().min(1, "Purpose is required"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginCredentials = z.infer<typeof loginSchema>;

export type Beneficiary = typeof beneficiaries.$inferSelect;
export type InsertBeneficiary = z.infer<typeof insertBeneficiarySchema>;

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

export type FxRate = typeof fxRates.$inferSelect;
