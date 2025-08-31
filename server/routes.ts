import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { fxService } from "./services/fxService";
import { authenticateToken, requireAdmin, generateToken, type AuthRequest } from "./middleware/auth";
import { 
  insertUserSchema, 
  loginSchema, 
  insertBeneficiarySchema, 
  insertTransactionSchema 
} from "@shared/schema";
import bcrypt from "bcryptjs";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post('/api/auth/register', async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
      
      const user = await storage.createUser(userData);
      const token = generateToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
      
      res.status(201).json({
        message: 'User created successfully',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          accountNumber: user.accountNumber,
          isAdmin: user.isAdmin,
        }
      });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(400).json({ 
        message: 'Registration failed', 
        error: error.message || 'Invalid input data'
      });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const credentials = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(credentials.email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }
      
      const token = generateToken({ id: user.id, email: user.email, isAdmin: user.isAdmin });
      
      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          accountNumber: user.accountNumber,
          isAdmin: user.isAdmin,
        }
      });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(400).json({ 
        message: 'Login failed', 
        error: error.message || 'Invalid credentials'
      });
    }
  });

  app.get('/api/auth/user', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
      
      res.json({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        accountNumber: user.accountNumber,
        isAdmin: user.isAdmin,
      });
    } catch (error) {
      console.error('Get user error:', error);
      res.status(500).json({ message: 'Failed to fetch user data' });
    }
  });

  // FX Rates routes
  app.get('/api/fx/rates', async (req, res) => {
    try {
      const rates = await fxService.getCurrentRates();
      res.json({ rates, lastUpdated: new Date() });
    } catch (error) {
      console.error('FX rates error:', error);
      res.status(500).json({ message: 'Failed to fetch exchange rates' });
    }
  });

  app.get('/api/fx/convert', async (req, res) => {
    try {
      const { amount, from, to } = req.query;
      
      if (!amount || !from || !to) {
        return res.status(400).json({ message: 'Missing required parameters: amount, from, to' });
      }
      
      const convertedAmount = await fxService.convertAmount(
        Number(amount),
        from as string,
        to as string
      );
      
      const exchangeRate = await fxService.getExchangeRate(from as string, to as string);
      const fees = fxService.calculateFees(Number(amount));
      
      res.json({
        sourceAmount: Number(amount),
        sourceCurrency: from,
        targetAmount: convertedAmount,
        targetCurrency: to,
        exchangeRate,
        fees,
        totalCost: Number(amount) + fees.totalFee,
      });
    } catch (error: any) {
      console.error('Currency conversion error:', error);
      res.status(400).json({ message: error.message || 'Conversion failed' });
    }
  });

  // Beneficiary routes
  app.get('/api/beneficiaries', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const beneficiaries = await storage.getBeneficiariesByUserId(req.user!.id);
      res.json(beneficiaries);
    } catch (error) {
      console.error('Get beneficiaries error:', error);
      res.status(500).json({ message: 'Failed to fetch beneficiaries' });
    }
  });

  app.post('/api/beneficiaries', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const beneficiaryData = insertBeneficiarySchema.parse(req.body);
      const beneficiary = await storage.createBeneficiary({
        ...beneficiaryData,
        userId: req.user!.id,
      });
      res.status(201).json(beneficiary);
    } catch (error: any) {
      console.error('Create beneficiary error:', error);
      res.status(400).json({ 
        message: 'Failed to create beneficiary', 
        error: error.message || 'Invalid input data'
      });
    }
  });

  app.put('/api/beneficiaries/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const beneficiaryData = insertBeneficiarySchema.partial().parse(req.body);
      
      // Verify beneficiary belongs to user
      const existingBeneficiary = await storage.getBeneficiaryById(id);
      if (!existingBeneficiary || existingBeneficiary.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Beneficiary not found' });
      }
      
      const updatedBeneficiary = await storage.updateBeneficiary(id, beneficiaryData);
      res.json(updatedBeneficiary);
    } catch (error: any) {
      console.error('Update beneficiary error:', error);
      res.status(400).json({ 
        message: 'Failed to update beneficiary', 
        error: error.message || 'Invalid input data'
      });
    }
  });

  app.delete('/api/beneficiaries/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      
      // Verify beneficiary belongs to user
      const existingBeneficiary = await storage.getBeneficiaryById(id);
      if (!existingBeneficiary || existingBeneficiary.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Beneficiary not found' });
      }
      
      const deleted = await storage.deleteBeneficiary(id);
      if (deleted) {
        res.json({ message: 'Beneficiary deleted successfully' });
      } else {
        res.status(404).json({ message: 'Beneficiary not found' });
      }
    } catch (error) {
      console.error('Delete beneficiary error:', error);
      res.status(500).json({ message: 'Failed to delete beneficiary' });
    }
  });

  // Transaction routes
  app.get('/api/transactions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { search, dateRange, limit } = req.query;
      
      let transactions;
      if (search || dateRange) {
        transactions = await storage.searchTransactions(
          req.user!.id,
          search as string || '',
          dateRange as string
        );
      } else {
        transactions = await storage.getTransactionsByUserId(
          req.user!.id,
          limit ? Number(limit) : undefined
        );
      }
      
      res.json(transactions);
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  app.post('/api/transactions', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const transactionData = insertTransactionSchema.parse(req.body);
      
      // Verify beneficiary belongs to user
      const beneficiary = await storage.getBeneficiaryById(transactionData.beneficiaryId);
      if (!beneficiary || beneficiary.userId !== req.user!.id) {
        return res.status(400).json({ message: 'Invalid beneficiary' });
      }
      
      // Get exchange rate and calculate amounts
      const exchangeRate = await fxService.getExchangeRate(
        transactionData.sourceCurrency,
        beneficiary.currency || 'USD'
      );
      
      const targetAmount = await fxService.convertAmount(
        Number(transactionData.sourceAmount),
        transactionData.sourceCurrency,
        beneficiary.currency || 'USD'
      );
      
      const fees = fxService.calculateFees(Number(transactionData.sourceAmount));
      
      const transaction = await storage.createTransaction({
        ...transactionData,
        userId: req.user!.id,
        targetCurrency: beneficiary.currency,
        targetAmount: targetAmount.toString(),
        exchangeRate: exchangeRate.toString(),
        baseFee: fees.baseFee.toString(),
        exchangeFee: fees.exchangeFee.toString(),
        totalFee: fees.totalFee.toString(),
      });
      
      res.status(201).json(transaction);
    } catch (error: any) {
      console.error('Create transaction error:', error);
      res.status(400).json({ 
        message: 'Failed to create transaction', 
        error: error.message || 'Invalid input data'
      });
    }
  });

  app.get('/api/transactions/:id', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const transaction = await storage.getTransactionById(id);
      
      if (!transaction || transaction.userId !== req.user!.id) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ message: 'Failed to fetch transaction' });
    }
  });

  // Dashboard stats
  app.get('/api/dashboard/stats', authenticateToken, async (req: AuthRequest, res) => {
    try {
      const transactions = await storage.getTransactionsByUserId(req.user!.id);
      const beneficiaries = await storage.getBeneficiariesByUserId(req.user!.id);
      
      const totalSent = transactions
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + Number(t.sourceAmount), 0);
      
      const stats = {
        totalSent: totalSent.toFixed(2),
        transactionCount: transactions.length,
        beneficiaryCount: beneficiaries.length,
        recentTransactions: transactions.slice(0, 5),
      };
      
      res.json(stats);
    } catch (error) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({ message: 'Failed to fetch dashboard stats' });
    }
  });

  // Admin routes
  app.get('/api/admin/stats', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const [userCount, transactionCount, totalVolume, highRiskTransactions] = await Promise.all([
        storage.getUserCount(),
        storage.getTransactionCount(),
        storage.getTotalVolume(),
        storage.getHighRiskTransactions(),
      ]);
      
      res.json({
        totalUsers: userCount,
        totalTransactions: transactionCount,
        totalVolume: `$${Number(totalVolume).toLocaleString()}`,
        highRiskCount: highRiskTransactions.length,
        highRiskTransactions: highRiskTransactions.slice(0, 10),
      });
    } catch (error) {
      console.error('Admin stats error:', error);
      res.status(500).json({ message: 'Failed to fetch admin stats' });
    }
  });

  app.get('/api/admin/transactions', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { limit } = req.query;
      const transactions = await storage.getAllTransactions(limit ? Number(limit) : undefined);
      res.json(transactions);
    } catch (error) {
      console.error('Admin transactions error:', error);
      res.status(500).json({ message: 'Failed to fetch transactions' });
    }
  });

  app.get('/api/admin/users', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove sensitive data
      const safeUsers = users.map(user => ({
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        accountNumber: user.accountNumber,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt,
      }));
      res.json(safeUsers);
    } catch (error) {
      console.error('Admin users error:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.put('/api/admin/transactions/:id/status', authenticateToken, requireAdmin, async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const { status, adminNotes } = req.body;
      
      if (!['pending', 'processing', 'completed', 'failed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
      }
      
      const transaction = await storage.updateTransactionStatus(id, status, adminNotes);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }
      
      res.json(transaction);
    } catch (error) {
      console.error('Update transaction status error:', error);
      res.status(500).json({ message: 'Failed to update transaction status' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
