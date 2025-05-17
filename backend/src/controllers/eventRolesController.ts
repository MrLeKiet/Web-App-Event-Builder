import { Request, Response } from 'express';
import pool from '../db';
import { EventRoleInput } from '../types';

// Get all roles for an event
export const getEventRoles = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.eventId;

        // Check if event exists
        const [event]: any = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
        if (event.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const [roles]: any = await pool.query(
            `SELECT r.*, 
             COUNT(rr.id) as filled_spots,
             (r.capacity - COUNT(rr.id)) as available_spots
             FROM event_roles r
             LEFT JOIN role_registrations rr ON r.id = rr.role_id AND rr.status IN ('pending', 'approved')
             WHERE r.event_id = ?
             GROUP BY r.id
             ORDER BY r.name`,
            [eventId]
        );

        res.json(roles);
    } catch (error) {
        console.error('Error fetching event roles:', error);
        res.status(500).json({ error: 'Failed to fetch roles' });
    }
};

// Create a new role for an event
export const createEventRole = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.eventId;
        const { name, description, capacity, skills_required }: EventRoleInput = req.body;

        // Validation
        if (!name || !capacity) {
            return res.status(400).json({ error: 'Role name and capacity are required' });
        }

        // Check if event exists
        const [event]: any = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
        if (event.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const [result]: any = await pool.query(
            'INSERT INTO event_roles (event_id, name, description, capacity, skills_required) VALUES (?, ?, ?, ?, ?)',
            [eventId, name, description, capacity, skills_required]
        );

        const roleId = result.insertId;
        const [newRole]: any = await pool.query('SELECT * FROM event_roles WHERE id = ?', [roleId]);

        res.status(201).json(newRole[0]);
    } catch (error) {
        console.error('Error creating event role:', error);
        res.status(500).json({ error: 'Failed to create role' });
    }
};

// Update a role for an event
export const updateEventRole = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.eventId;
        const roleId = req.params.roleId;
        const { name, description, capacity, skills_required }: EventRoleInput = req.body;

        // Validation
        if (!name || !capacity) {
            return res.status(400).json({ error: 'Role name and capacity are required' });
        }

        // Check if role exists for this event
        const [role]: any = await pool.query(
            'SELECT * FROM event_roles WHERE id = ? AND event_id = ?',
            [roleId, eventId]
        );

        if (role.length === 0) {
            return res.status(404).json({ error: 'Role not found for this event' });
        }

        await pool.query(
            'UPDATE event_roles SET name = ?, description = ?, capacity = ?, skills_required = ? WHERE id = ?',
            [name, description, capacity, skills_required, roleId]
        );

        const [updatedRole]: any = await pool.query('SELECT * FROM event_roles WHERE id = ?', [roleId]);

        res.json(updatedRole[0]);
    } catch (error) {
        console.error('Error updating event role:', error);
        res.status(500).json({ error: 'Failed to update role' });
    }
};

// Delete a role
export const deleteEventRole = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.eventId;
        const roleId = req.params.roleId;

        // Check if role exists for this event
        const [role]: any = await pool.query(
            'SELECT * FROM event_roles WHERE id = ? AND event_id = ?',
            [roleId, eventId]
        );

        if (role.length === 0) {
            return res.status(404).json({ error: 'Role not found for this event' });
        }

        // Check if anyone is registered for this role
        const [registrations]: any = await pool.query(
            'SELECT COUNT(*) as count FROM role_registrations WHERE role_id = ?',
            [roleId]
        );

        if (registrations[0].count > 0) {
            return res.status(400).json({
                error: 'Cannot delete role as users are already registered. Consider updating it instead.'
            });
        }

        await pool.query('DELETE FROM event_roles WHERE id = ?', [roleId]);

        res.json({ message: 'Role deleted successfully' });
    } catch (error) {
        console.error('Error deleting event role:', error);
        res.status(500).json({ error: 'Failed to delete role' });
    }
};

// Get users registered for a specific role
export const getRoleRegistrations = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.eventId;
        const roleId = req.params.roleId;

        const [registrations]: any = await pool.query(
            `SELECT u.id, u.username, u.full_name, u.email, rr.status, rr.registration_date
             FROM users u
             JOIN role_registrations rr ON u.id = rr.user_id
             WHERE rr.event_id = ? AND rr.role_id = ?
             ORDER BY rr.registration_date`,
            [eventId, roleId]
        );

        res.json(registrations);
    } catch (error) {
        console.error('Error fetching role registrations:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
};