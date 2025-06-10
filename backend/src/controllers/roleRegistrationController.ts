import { Request, Response } from 'express';
import pool from '../db';
import { RoleRegistrationInput } from '../types';

// Register for a specific role
export const registerForRole = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const { event_id, role_id }: RoleRegistrationInput = req.body;

        // Validation
        if (!event_id || !role_id) {
            return res.status(400).json({ error: 'Event ID and Role ID are required' });
        }

        // Check if user exists
        const [user]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if event exists
        const [event]: any = await pool.query('SELECT * FROM events WHERE id = ?', [event_id]);
        if (event.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if role exists for this event
        const [role]: any = await pool.query(
            'SELECT * FROM event_roles WHERE id = ? AND event_id = ?',
            [role_id, event_id]
        );

        if (role.length === 0) {
            return res.status(404).json({ error: 'Role not found for this event' });
        }

        // Check if already registered for this role
        const [existingRegistration]: any = await pool.query(
            'SELECT * FROM role_registrations WHERE user_id = ? AND event_id = ? AND role_id = ?',
            [userId, event_id, role_id]
        );

        if (existingRegistration.length > 0) {
            return res.status(400).json({ error: 'Already registered for this role' });
        }

        // Check if role has available capacity
        const [registrationCount]: any = await pool.query(
            'SELECT COUNT(*) as count FROM role_registrations WHERE event_id = ? AND role_id = ? AND status IN ("pending", "approved")',
            [event_id, role_id]
        );

        if (registrationCount[0].count >= role[0].capacity) {
            return res.status(400).json({ error: 'This role is already at full capacity' });
        }

        // Register for the role
        const [result]: any = await pool.query(
            'INSERT INTO role_registrations (user_id, event_id, role_id) VALUES (?, ?, ?)',
            [userId, event_id, role_id]
        );

        const registrationId = result.insertId;
        const [newRegistration]: any = await pool.query(
            'SELECT * FROM role_registrations WHERE id = ?',
            [registrationId]
        );

        res.status(201).json(newRegistration[0]);
    } catch (error) {
        console.error('Error registering for role:', error);
        res.status(500).json({ error: 'Failed to register for role' });
    }
};

// Unregister from a role
export const unregisterFromRole = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;
        const roleId = req.params.roleId;
        const eventId = req.params.eventId;

        // Check if registration exists
        const [registration]: any = await pool.query(
            'SELECT * FROM role_registrations WHERE user_id = ? AND event_id = ? AND role_id = ?',
            [userId, eventId, roleId]
        );

        if (registration.length === 0) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        // Delete registration
        await pool.query(
            'DELETE FROM role_registrations WHERE user_id = ? AND event_id = ? AND role_id = ?',
            [userId, eventId, roleId]
        );

        res.json({ message: 'Successfully unregistered from role' });
    } catch (error) {
        console.error('Error unregistering from role:', error);
        res.status(500).json({ error: 'Failed to unregister from role' });
    }
};

// Get user's role registrations
export const getUserRoleRegistrations = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        // Check if user exists
        const [user]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [registrations]: any = await pool.query(
            `SELECT rr.id as registration_id, rr.status, rr.registration_date, 
             e.id as event_id, e.name as event_name, e.start_date, e.end_date,
             r.id as role_id, r.name as role_name, r.description as role_description
             FROM role_registrations rr
             JOIN events e ON rr.event_id = e.id
             JOIN event_roles r ON rr.role_id = r.id
             WHERE rr.user_id = ?
             ORDER BY e.start_date, r.name`,
            [userId]
        );

        res.json(registrations);
    } catch (error) {
        console.error('Error fetching user role registrations:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
};

// Update registration status (for admins/moderators)
export const updateRoleRegistrationStatus = async (req: Request, res: Response) => {
    try {
        const registrationId = req.params.registrationId;
        const { status } = req.body;

        // Validation
        if (!status || !['pending', 'approved', 'declined', 'completed'].includes(status)) {
            return res.status(400).json({ error: 'Valid status is required' });
        }

        // Check if registration exists
        const [registration]: any = await pool.query(
            'SELECT * FROM role_registrations WHERE id = ?',
            [registrationId]
        );

        if (registration.length === 0) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        // Update status
        await pool.query(
            'UPDATE role_registrations SET status = ? WHERE id = ?',
            [status, registrationId]
        );

        const [updatedRegistration]: any = await pool.query(
            'SELECT * FROM role_registrations WHERE id = ?',
            [registrationId]
        );

        res.json(updatedRegistration[0]);
    } catch (error) {
        console.error('Error updating registration status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

// Get user's role for a specific event
export const getUserRoleForEvent = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const eventId = req.params.eventId;
    
    // Check if user exists
    const [user]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Check if event exists
    const [event]: any = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (event.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const [roleRegistration]: any = await pool.query(
      `SELECT rr.*, r.name as role_name, r.description as role_description
       FROM role_registrations rr
       JOIN event_roles r ON rr.role_id = r.id
       WHERE rr.user_id = ? AND rr.event_id = ?`,
      [userId, eventId]
    );
    
    if (roleRegistration.length === 0) {
      return res.status(404).json({ error: 'No role registration found for this user and event' });
    }
    
    res.json(roleRegistration[0]);
  } catch (error) {
    console.error('Error fetching user role for event:', error);
    res.status(500).json({ error: 'Failed to fetch role' });
  }
};