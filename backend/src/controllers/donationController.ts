import { Request, Response } from 'express';
import pool from '../db';
import { DonationInput } from '../types';

// Create a new donation
export const createDonation = async (req: Request, res: Response) => {
    try {
        const {
            event_id,
            user_id,
            donation_type_id,
            amount,
            quantity,
            item_description
        }: DonationInput = req.body;

        // Validation
        if (!event_id || !donation_type_id) {
            return res.status(400).json({ error: 'Event ID and donation type are required' });
        }

        // Check if event exists
        const [event]: any = await pool.query('SELECT * FROM events WHERE id = ?', [event_id]);
        if (event.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Check if donation type exists
        const [donationType]: any = await pool.query(
            'SELECT * FROM donation_types WHERE id = ?',
            [donation_type_id]
        );

        if (donationType.length === 0) {
            return res.status(404).json({ error: 'Donation type not found' });
        }

        // For money donations, amount is required
        if (donation_type_id === 1 && (!amount || amount <= 0)) {
            return res.status(400).json({ error: 'Amount is required for monetary donations' });
        }

        // For other donations, quantity is required
        if (donation_type_id !== 1 && (!quantity || quantity <= 0)) {
            return res.status(400).json({ error: 'Quantity is required for non-monetary donations' });
        }

        // Create donation record
        const [result]: any = await pool.query(
            `INSERT INTO donations 
            (event_id, user_id, donation_type_id, amount, quantity, item_description)
            VALUES (?, ?, ?, ?, ?, ?)`,
            [event_id, user_id, donation_type_id, amount, quantity, item_description]
        );

        const donationId = result.insertId;
        const [newDonation]: any = await pool.query(
            'SELECT * FROM donations WHERE id = ?',
            [donationId]
        );

        res.status(201).json(newDonation[0]);
    } catch (error) {
        console.error('Error creating donation:', error);
        res.status(500).json({ error: 'Failed to create donation' });
    }
};

// Get all donations for an event
export const getEventDonations = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.eventId;

        // Check if event exists
        const [event]: any = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
        if (event.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        const [donations]: any = await pool.query(
            `SELECT d.*, dt.name as donation_type, dt.unit_of_measure,
             u.username, u.full_name
             FROM donations d
             JOIN donation_types dt ON d.donation_type_id = dt.id
             LEFT JOIN users u ON d.user_id = u.id
             WHERE d.event_id = ?
             ORDER BY d.donation_date DESC`,
            [eventId]
        );

        // Get summary of donations
        const [summary]: any = await pool.query(
            `SELECT dt.name as type, dt.unit_of_measure,
             SUM(CASE WHEN dt.id = 1 THEN d.amount ELSE 0 END) as total_amount,
             SUM(d.quantity) as total_quantity,
             COUNT(d.id) as donation_count
             FROM donations d
             JOIN donation_types dt ON d.donation_type_id = dt.id
             WHERE d.event_id = ?
             GROUP BY dt.id`,
            [eventId]
        );

        res.json({
            donations,
            summary
        });
    } catch (error) {
        console.error('Error fetching event donations:', error);
        res.status(500).json({ error: 'Failed to fetch donations' });
    }
};

// Get all donations by a user
export const getUserDonations = async (req: Request, res: Response) => {
    try {
        const userId = req.params.userId;

        // Check if user exists
        const [user]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (user.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const [donations]: any = await pool.query(
            `SELECT d.*, dt.name as donation_type, dt.unit_of_measure,
             e.name as event_name
             FROM donations d
             JOIN donation_types dt ON d.donation_type_id = dt.id
             JOIN events e ON d.event_id = e.id
             WHERE d.user_id = ?
             ORDER BY d.donation_date DESC`,
            [userId]
        );

        res.json(donations);
    } catch (error) {
        console.error('Error fetching user donations:', error);
        res.status(500).json({ error: 'Failed to fetch donations' });
    }
};

// Update donation status
export const updateDonationStatus = async (req: Request, res: Response) => {
    try {
        const donationId = req.params.donationId;
        const { status } = req.body;

        // Validation
        if (!status || !['pending', 'received', 'distributed'].includes(status)) {
            return res.status(400).json({ error: 'Valid status is required' });
        }

        // Check if donation exists
        const [donation]: any = await pool.query('SELECT * FROM donations WHERE id = ?', [donationId]);
        if (donation.length === 0) {
            return res.status(404).json({ error: 'Donation not found' });
        }

        // Update status
        await pool.query(
            'UPDATE donations SET status = ? WHERE id = ?',
            [status, donationId]
        );

        const [updatedDonation]: any = await pool.query(
            'SELECT * FROM donations WHERE id = ?',
            [donationId]
        );

        res.json(updatedDonation[0]);
    } catch (error) {
        console.error('Error updating donation status:', error);
        res.status(500).json({ error: 'Failed to update status' });
    }
};

// Get donation types
export const getDonationTypes = async (req: Request, res: Response) => {
    try {
        const [types]: any = await pool.query('SELECT * FROM donation_types ORDER BY id');
        res.json(types);
    } catch (error) {
        console.error('Error fetching donation types:', error);
        res.status(500).json({ error: 'Failed to fetch donation types' });
    }
};

// Get donation total for an event
export const getEventDonationTotal = async (req: Request, res: Response) => {
    try {
        const eventId = req.params.eventId;

        // Check if event exists
        const [event]: any = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
        if (event.length === 0) {
            return res.status(404).json({ error: 'Event not found' });
        }

        // Get event goals
        const [eventInfo]: any = await pool.query(
            'SELECT donation_goal FROM events WHERE id = ?',
            [eventId]
        );

        // Get total monetary donations
        const [monetaryTotal]: any = await pool.query(
            `SELECT SUM(amount) as total_amount
             FROM donations 
             WHERE event_id = ? AND donation_type_id = 1 AND status IN ('received', 'distributed')`,
            [eventId]
        );

        // Get counts by donation type
        const [typeCounts]: any = await pool.query(
            `SELECT dt.name, 
             SUM(d.quantity) as total_quantity,
             COUNT(d.id) as donation_count
             FROM donations d
             JOIN donation_types dt ON d.donation_type_id = dt.id
             WHERE d.event_id = ? AND d.status IN ('received', 'distributed')
             GROUP BY dt.id`,
            [eventId]
        );

        const donationGoal = eventInfo[0].donation_goal || 0;
        const totalAmount = monetaryTotal[0].total_amount || 0;
        const progressPercentage = donationGoal > 0 ? Math.min(Math.round((totalAmount / donationGoal) * 100), 100) : 0;

        res.json({
            goal: donationGoal,
            total_amount: totalAmount,
            progress_percentage: progressPercentage,
            donation_counts: typeCounts
        });
    } catch (error) {
        console.error('Error calculating donation totals:', error);
        res.status(500).json({ error: 'Failed to calculate donation totals' });
    }
};