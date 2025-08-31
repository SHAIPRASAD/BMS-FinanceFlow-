import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    isAdmin: boolean;
  };
}

export function generateToken(user: { id: string; email: string; isAdmin: boolean }): string {
  return jwt.sign(
    { 
      id: user.id, 
      email: user.email, 
      isAdmin: user.isAdmin 
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyToken(token: string): { id: string; email: string; isAdmin: boolean } {
  return jwt.verify(token, JWT_SECRET) as { id: string; email: string; isAdmin: boolean };
}

export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    
    // Verify user still exists
    const user = await storage.getUserById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'Invalid token - user not found' });
    }

    req.user = {
      id: user.id,
      email: user.email,
      isAdmin: user.isAdmin,
    };
    
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

export async function requireAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (!req.user?.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
}
