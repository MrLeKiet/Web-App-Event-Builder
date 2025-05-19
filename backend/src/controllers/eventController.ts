import { Request, Response } from 'express';
import pool from '../db';
import { Event, EventInput } from '../types';

export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const [rows] = await pool.query('SELECT * FROM events ORDER BY start_date');
    res.json(rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};

export const getEventById = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;

    // Get the event details
    const [eventRows]: any = await pool.query(
      'SELECT * FROM events WHERE id = ?',
      [eventId]
    );
    
    if (eventRows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const event = eventRows[0];

    // Get role information if available
    const [roles]: any = await pool.query(
      `SELECT r.*, 
       COUNT(rr.id) as filled_spots,
       (r.capacity - COUNT(rr.id)) as available_spots
       FROM event_roles r
       LEFT JOIN role_registrations rr ON r.id = rr.role_id AND rr.status IN ('pending', 'approved')
       WHERE r.event_id = ?
       GROUP BY r.id`,
      [eventId]
    );

    // Get donation summary if it's a donation event
    let donationSummary = null;
    if (event.event_type === 'donation' || event.event_type === 'mixed') {
      // Get total monetary donations
      const [monetaryTotal]: any = await pool.query(
        `SELECT SUM(amount) as total_amount
         FROM donations 
         WHERE event_id = ? AND donation_type_id = 1 AND status IN ('received', 'distributed')`,
        [eventId]
      );
      
      const donationGoal = event.donation_goal || 0;
      const totalAmount = monetaryTotal[0].total_amount || 0;
      const progressPercentage = donationGoal > 0 ? Math.min(Math.round((totalAmount / donationGoal) * 100), 100) : 0;
      
      donationSummary = {
        goal: donationGoal,
        total_amount: totalAmount,
        progress_percentage: progressPercentage
      };
    }
    
    // Return combined data
    res.json({
      ...event,
      roles: roles,
      donation_summary: donationSummary
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Failed to fetch event' });
  }
};

export const createEvent = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      host, 
      category, 
      description, 
      start_date, 
      end_date,
      event_type,
      donation_goal,
      donation_goal_description,
      is_active
    }: EventInput = req.body;
    
    console.log('Received event data:', {
      name, host, category, description, start_date, end_date,
      event_type, donation_goal, donation_goal_description, is_active
    });
    
    // Validation
    if (!name || !host || !category || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Format dates properly for MySQL
    const formattedStartDate = new Date(start_date).toISOString().slice(0, 19).replace('T', ' ');
    const formattedEndDate = new Date(end_date).toISOString().slice(0, 19).replace('T', ' ');
    
    // Handle null values properly
    const finalDonationGoal = donation_goal !== undefined ? donation_goal : null;
    const finalDonationDesc = donation_goal_description || null;
    
    console.log('Executing SQL with values:', [
      name, host, category, description, formattedStartDate, formattedEndDate, 
      event_type || 'volunteer', finalDonationGoal, finalDonationDesc, is_active ?? true
    ]);
    
    const [result]: any = await pool.query(
      `INSERT INTO events 
       (name, host, category, description, start_date, end_date, event_type, donation_goal, donation_goal_description, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, host, category, description, formattedStartDate, formattedEndDate, 
       event_type || 'volunteer', finalDonationGoal, finalDonationDesc, is_active ?? true]
    );
    
    const newEventId = result.insertId;
    const [newEvent]: any = await pool.query('SELECT * FROM events WHERE id = ?', [newEventId]);
    
    res.status(201).json(newEvent[0]);
  } catch (error) {
    console.error('Error creating event:', error);
    // Provide more details about the error
    if (error instanceof Error) {
      console.error('Error details:', error.message);
    }
    res.status(500).json({ error: 'Failed to create event. Please check server logs.' });
  }
};

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const { 
      name, 
      host, 
      category, 
      description, 
      start_date, 
      end_date,
      event_type,
      donation_goal,
      donation_goal_description,
      is_active
    }: EventInput = req.body;
    const eventId = req.params.id;
    
    // Validation
    if (!name || !host || !category || !start_date || !end_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    // Check if event exists
    const [existingEvent]: any = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (existingEvent.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    await pool.query(
      `UPDATE events SET 
       name = ?, 
       host = ?, 
       category = ?, 
       description = ?, 
       start_date = ?, 
       end_date = ?, 
       event_type = ?,
       donation_goal = ?,
       donation_goal_description = ?,
       is_active = ?
       WHERE id = ?`,
      [name, host, category, description, start_date, end_date, event_type || 'volunteer', 
       donation_goal, donation_goal_description, is_active ?? true, eventId]
    );
    
    const [updatedEvent]: any = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    res.json(updatedEvent[0]);
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
};

export const deleteEvent = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.id;
    
    // Check if event exists
    const [existingEvent]: any = await pool.query('SELECT * FROM events WHERE id = ?', [eventId]);
    if (existingEvent.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Due to cascading delete constraints, this will also delete all roles, registrations, and donations
    await pool.query('DELETE FROM events WHERE id = ?', [eventId]);
    
    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
};

// Get events by type (volunteer, donation, teaching, mixed)
export const getEventsByType = async (req: Request, res: Response) => {
  try {
    const eventType = req.params.type;
    
    // Validate the event type
    if (!['volunteer', 'donation', 'teaching', 'mixed'].includes(eventType)) {
      return res.status(400).json({ error: 'Invalid event type' });
    }
    
    const [events]: any = await pool.query(
      'SELECT * FROM events WHERE event_type = ? ORDER BY start_date',
      [eventType]
    );
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events by type:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
};