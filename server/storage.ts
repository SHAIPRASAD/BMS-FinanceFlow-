import {
  users,
  beneficiaries,
  transactions,
  fxRates,
  type User,
  type InsertUser,
  type Beneficiary,
  type InsertBeneficiary,
  type Transaction,
  type InsertTransaction,
  type FxRate,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or, ilike, gte, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUserById(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Beneficiary operations
  getBeneficiariesByUserId(userId: string): Promise<Beneficiary[]>;
  getBeneficiaryById(id: string): Promise<Beneficiary | undefined>;
  createBeneficiary(beneficiary: InsertBeneficiary & { userId: string }): Promise<Beneficiary>;
  updateBeneficiary(id: string, beneficiary: Partial<InsertBeneficiary>): Promise<Beneficiary | undefined>;
  deleteBeneficiary(id: string): Promise<boolean>;
  
  // Transaction operations
  getTransactionsByUserId(userId: string, limit?: number): Promise<Transaction[]>;
  getTransactionById(id: string): Promise<Transaction | undefined>;
  createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction>;
  updateTransactionStatus(id: string, status: string, adminNotes?: string): Promise<Transaction | undefined>;
  getAllTransactions(limit?: number): Promise<Transaction[]>;
  getHighRiskTransactions(): Promise<Transaction[]>;
  searchTransactions(userId: string, query: string, dateRange?: string): Promise<Transaction[]>;
  
  // FX Rate operations
  getLatestFxRates(): Promise<FxRate | undefined>;
  updateFxRates(rates: Record<string, number>): Promise<FxRate>;
  
  // Admin operations
  getAllUsers(): Promise<User[]>;
  getUserCount(): Promise<number>;
  getTransactionCount(): Promise<number>;
  getTotalVolume(): Promise<string>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUserById(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 12);
    const accountNumber = `ACC-${randomUUID()}`;
    
    const [user] = await db
      .insert(users)
      .values({
        ...insertUser,
        password: hashedPassword,
        accountNumber,
      })
      .returning();
    return user;
  }

  // Beneficiary operations
  async getBeneficiariesByUserId(userId: string): Promise<Beneficiary[]> {
    return await db
      .select()
      .from(beneficiaries)
      .where(eq(beneficiaries.userId, userId))
      .orderBy(desc(beneficiaries.createdAt));
  }

  async getBeneficiaryById(id: string): Promise<Beneficiary | undefined> {
    const [beneficiary] = await db.select().from(beneficiaries).where(eq(beneficiaries.id, id));
    return beneficiary;
  }

  async createBeneficiary(beneficiary: InsertBeneficiary & { userId: string }): Promise<Beneficiary> {
    const [newBeneficiary] = await db
      .insert(beneficiaries)
      .values(beneficiary)
      .returning();
    return newBeneficiary;
  }

  async updateBeneficiary(id: string, beneficiary: Partial<InsertBeneficiary>): Promise<Beneficiary | undefined> {
    const [updated] = await db
      .update(beneficiaries)
      .set({ ...beneficiary, updatedAt: new Date() })
      .where(eq(beneficiaries.id, id))
      .returning();
    return updated;
  }

  async deleteBeneficiary(id: string): Promise<boolean> {
    const result = await db.delete(beneficiaries).where(eq(beneficiaries.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Transaction operations
  async getTransactionsByUserId(userId: string, limit = 50): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getTransactionById(id: string): Promise<Transaction | undefined> {
    const [transaction] = await db.select().from(transactions).where(eq(transactions.id, id));
    return transaction;
  }

  async createTransaction(transaction: InsertTransaction & { userId: string }): Promise<Transaction> {
    // Calculate if transaction is high risk (>$10,000 equivalent)
    const sourceAmount = Number(transaction.sourceAmount);
    const isHighRisk = sourceAmount > 10000;
    
    const [newTransaction] = await db
      .insert(transactions)
      .values({
        ...transaction,
        isHighRisk,
        status: sourceAmount > 10000?'pending':'completed',
      })
      .returning();
    return newTransaction;
  }

  async updateTransactionStatus(id: string, status: string, adminNotes?: string): Promise<Transaction | undefined> {
    const [updated] = await db
      .update(transactions)
      .set({ 
        status, 
        adminNotes,
        updatedAt: new Date() 
      })
      .where(eq(transactions.id, id))
      .returning();
    return updated;
  }

  async getAllTransactions(limit = 100): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .orderBy(desc(transactions.createdAt))
      .limit(limit);
  }

  async getHighRiskTransactions(): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.isHighRisk, true))
      .orderBy(desc(transactions.createdAt));
  }

  async searchTransactions(userId: string, query: string, dateRange?: string): Promise<Transaction[]> {
    let whereClause = eq(transactions.userId, userId);
    
    if (query) {
      // Join with beneficiaries to search by name
      const results = await db
        .select({
          id: transactions.id,
          userId: transactions.userId,
          beneficiaryId: transactions.beneficiaryId,
          sourceAmount: transactions.sourceAmount,
          sourceCurrency: transactions.sourceCurrency,
          targetAmount: transactions.targetAmount,
          targetCurrency: transactions.targetCurrency,
          exchangeRate: transactions.exchangeRate,
          baseFee: transactions.baseFee,
          exchangeFee: transactions.exchangeFee,
          totalFee: transactions.totalFee,
          purpose: transactions.purpose,
          status: transactions.status,
          isHighRisk: transactions.isHighRisk,
          adminNotes: transactions.adminNotes,
          createdAt: transactions.createdAt,
          updatedAt: transactions.updatedAt,
        })
        .from(transactions)
        .innerJoin(beneficiaries, eq(transactions.beneficiaryId, beneficiaries.id))
        .where(
          and(
            eq(transactions.userId, userId),
            ilike(beneficiaries.name, `%${query}%`)
          )
        )
        .orderBy(desc(transactions.createdAt));
      
      return results;
    }
    
    if (dateRange) {
      const now = new Date();
      let dateThreshold: Date;
      
      switch (dateRange) {
        case '30days':
          dateThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90days':
          dateThreshold = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          dateThreshold = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          dateThreshold = new Date(0);
      }
      
      whereClause = and(whereClause, gte(transactions.createdAt, dateThreshold)) ?? eq(transactions.userId, userId);
    }
    
    return await db
      .select()
      .from(transactions)
      .where(whereClause)
      .orderBy(desc(transactions.createdAt));
  }

  // FX Rate operations
  async getLatestFxRates(): Promise<FxRate | undefined> {
    const [rates] = await db
      .select()
      .from(fxRates)
      .orderBy(desc(fxRates.lastUpdated))
      .limit(1);
    return rates;
  }

  async updateFxRates(rates: Record<string, number>): Promise<FxRate> {
    const [updated] = await db
      .insert(fxRates)
      .values({
        rates,
        lastUpdated: new Date(),
      })
      .returning();
    return updated;
  }

  // Admin operations
  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .orderBy(desc(users.createdAt));
  }

  async getUserCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(users);
    return Number(result.count);
  }

  async getTransactionCount(): Promise<number> {
    const [result] = await db
      .select({ count: sql`count(*)` })
      .from(transactions);
    return Number(result.count);
  }

  async getTotalVolume(): Promise<string> {
    const [result] = await db
      .select({ total: sql`sum(${transactions.sourceAmount})` })
      .from(transactions)
      .where(eq(transactions.status, 'completed'));
    return String(result.total || 0);
  }
}

export const storage = new DatabaseStorage();
