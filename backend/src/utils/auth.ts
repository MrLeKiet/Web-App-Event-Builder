import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import pool from '../db';

dotenv.config();

// Check if user is admin based on their role
export const checkAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First, check if admin password is provided (maintain backward compatibility)
    const adminPassword = req.headers['admin-password'];
    if (adminPassword === process.env.ADMIN_PASSWORD) {
      return next();
    }
    
    // Otherwise, check if the request has an authenticated user
    const user = (req as any).user;
    
    if (!user) {
      // If there's no authenticated user and no valid admin password, require authentication
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if the authenticated user has admin role
    if (user.role === 'admin') {
      return next();
    }
    
    // If user doesn't have admin role, deny access
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  } catch (error) {
    console.error('Error checking admin role:', error);
    return res.status(500).json({ error: 'Authorization check failed' });
  }
};

// Authenticate user
export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get user credentials from headers
    const username = req.headers['username'] as string;
    const password = req.headers['password'] as string;
    
    if (!username || !password) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    // Check if user exists with matching password
    const [users]: any = await pool.query(
      'SELECT * FROM users WHERE username = ? AND password = ?',
      [username, password]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Attach user to request object for use in route handlers
    (req as any).user = users[0];
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Check if the authenticated user matches the requested user ID
export const checkSameUser = (req: Request, res: Response, next: NextFunction) => {
  const authenticatedUser = (req as any).user;
  const requestedUserId = req.params.userId;
  
  // Allow admins to access any user's data
  if (authenticatedUser.role === 'admin') {
    return next();
  }
  
  if (authenticatedUser.id.toString() === requestedUserId) {
    next();
  } else {
    res.status(403).json({ error: 'Forbidden: You can only access your own data' });
  }
};