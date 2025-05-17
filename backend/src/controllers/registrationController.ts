import { Request, Response } from 'express';
import pool from '../db';
import { EventRegistrationInput } from '../types';

// Register for an event
export const registerForEvent = async (req: Request, res: Response) => {
    try {
        const { event_id }: EventRegistrationInput = req.body;
        const user_id = req.params.userId;

        // Validation
        if (!event_id) {
            return res.status(400).json({ error: 'Event ID is required' });
        }

        // Check if user exists
        const [users]: any = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if event exists
        const [events]: any = await pool.query('SELECT * FROM events WHERE id = ?', [event_id]);
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if already registered
        const [existingRegistrations]: any = await pool.query(
            'SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [user_id, event_id]
        );

        if (existingRegistrations.length > 0) {
            return res.status(400).json({ error: 'User already registered for this event' });
        }

        // Register for the event
        const [result]: any = await pool.query(
            'INSERT INTO event_registrations (user_id, event_id) VALUES (?, ?)',
            [user_id, event_id]
        );

        const registrationId = result.insertId;
        const [newRegistration]: any = await pool.query(
            'SELECT * FROM event_registrations WHERE id = ?',
            [registrationId]
        );

        res.status(201).json(newRegistration[0]);
    } catch (error) {
        console.error('Error registering for event:', error);
        res.status(500).json({ error: 'Failed to register for event' });
    }
};

// Cancel registration
export const cancelRegistration = async (req: Request, res: Response) => {
    try {
        const user_id = req.params.userId;
        const event_id = req.params.eventId;

        // Check if registration exists
        const [registrations]: any = await pool.query(
            'SELECT * FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [user_id, event_id]
        );

        if (registrations.length === 0) {
            return res.status(404).json({ error: 'Registration not found' });
        }

        // Delete registration
        await pool.query(
            'DELETE FROM event_registrations WHERE user_id = ? AND event_id = ?',
            [user_id, event_id]
        );

        res.json({ message: 'Registration canceled successfully' });
    } catch (error) {
        console.error('Error canceling registration:', error);
        res.status(500).json({ error: 'Failed to cancel registration' });
    }
};

// Get user's registered events
export const getUserRegistrations = async (req: Request, res: Response) => {
    try {
        const user_id = req.params.userId;

        // Check if user exists
        const [users]: any = await pool.query('SELECT * FROM users WHERE id = ?', [user_id]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [registrations]: any = await pool.query(
            `SELECT e.*
            FROM events e
            JOIN event_registrations er ON e.id = er.event_id
            WHERE er.user_id = ?
            ORDER BY e.start_date`,
            [user_id]
        );

        res.json(registrations);
    } catch (error) {
        console.error('Error fetching user registrations:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
};

// Get event's registered users
export const getEventRegistrations = async (req: Request, res: Response) => {
    try {
        const event_id = req.params.eventId;

        // Check if event exists
        const [events]: any = await pool.query('SELECT * FROM events WHERE id = ?', [event_id]);
        if (events.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const [registrations]: any = await pool.query(
            `SELECT u.id, u.username, u.email, u.full_name, er.registration_date
       FROM users u
       JOIN event_registrations er ON u.id = er.user_id
       WHERE er.event_id = ?
       ORDER BY er.registration_date`,
            [event_id]
        );

        res.json(registrations);
    } catch (error) {
        console.error('Error fetching event registrations:', error);
        res.status(500).json({ error: 'Failed to fetch registrations' });
    }
};