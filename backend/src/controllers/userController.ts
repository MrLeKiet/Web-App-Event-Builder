import { Request, Response } from 'express';
import pool from '../db';
import { User, UserInput, UserLogin } from '../types';

// Register a new user
export const registerUser = async (req: Request, res: Response) => {
    try {
        const { username, email, password, full_name, role = 'member' }: UserInput = req.body;

        // Validation
        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if username or email already exists
        const [existingUsers]: any = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username or email already in use' });
        }

        // Prevent non-admin users from creating admin accounts
        let finalRole = role;
        
        // Check if there's an authenticated admin user making this request
        const adminAuth = req.headers['admin-password'] === process.env.ADMIN_PASSWORD;
        const adminUser = (req as any).user?.role === 'admin';
        
        // If not authenticated as admin, force role to be member
        if (!adminAuth && !adminUser) {
            finalRole = 'member';
        }

        // In a real application, you would hash the password here
        const [result]: any = await pool.query(
            'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, password, full_name, finalRole]
        );

        const userId = result.insertId;
        const [newUser]: any = await pool.query(
            'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        res.status(201).json(newUser[0]);
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Failed to register user' });
    }
};

// Login
export const loginUser = async (req: Request, res: Response) => {
    try {
        const { username, password }: UserLogin = req.body;

        // Validation
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [users]: any = await pool.query(
            'SELECT * FROM users WHERE username = ?',
            [username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // In a real application, you would compare hashed passwords
        if (user.password !== password) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Return user without password
        const { password: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        console.error('Error logging in:', error);
        res.status(500).json({ error: 'Failed to log in' });
    }
};

// Get user profile
export const getUserProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;

        const [users]: any = await pool.query(
            'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ error: 'Failed to fetch user profile' });
    }
};

// New endpoint to get all users (admin only)
export const getAllUsers = async (req: Request, res: Response) => {
    try {
        const [users]: any = await pool.query(
            'SELECT id, username, email, full_name, role, created_at FROM users ORDER BY id'
        );
        
        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
};

// New endpoint to update user role (admin only)
export const updateUserRole = async (req: Request, res: Response) => {
    try {
        const userId = req.params.id;
        const { role } = req.body;
        
        if (!role || !['admin', 'member'].includes(role)) {
            return res.status(400).json({ error: 'Valid role is required (admin or member)' });
        }
        
        // Check if user exists
        const [users]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        
        // Update role
        await pool.query('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
        
        const [updatedUser]: any = await pool.query(
            'SELECT id, username, email, full_name, role, created_at FROM users WHERE id = ?',
            [userId]
        );
        
        res.json(updatedUser[0]);
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
};