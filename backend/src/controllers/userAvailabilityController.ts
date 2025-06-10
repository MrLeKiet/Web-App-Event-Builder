import { Request, Response } from 'express';
import pool from '../db';

// Submit availability for an event
export const submitAvailability = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const { event_id, availability_slots } = req.body;
    
    // Validate input
    if (!event_id || !availability_slots || !availability_slots.length) {
      return res.status(400).json({ error: 'Event ID and at least one availability slot are required' });
    }
    
    // Verify user exists
    const [users]: any = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (users.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Verify event exists and is active
    const [events]: any = await pool.query(
      'SELECT * FROM events WHERE id = ? AND is_active = true', 
      [event_id]
    );
    if (events.length === 0) {
      return res.status(404).json({ error: 'Event not found or not active' });
    }
    
    const event = events[0];
    const eventStartDate = new Date(event.start_date);
    const eventEndDate = new Date(event.end_date);
    
    // Validate each availability slot is within the event timeframe
    for (const slot of availability_slots) {
      const slotDate = new Date(slot.availability_date);
      const startTime = new Date(`${slot.availability_date}T${slot.start_time}`);
      const endTime = new Date(`${slot.availability_date}T${slot.end_time}`);
      
      if (slotDate < eventStartDate || slotDate > eventEndDate) {
        return res.status(400).json({ 
          error: 'Selected date is outside the event timeframe' 
        });
      }
      
      if (startTime >= endTime) {
        return res.status(400).json({ 
          error: 'End time must be after start time' 
        });
      }
    }
    
    // Begin transaction
    await pool.query('START TRANSACTION');
    
    try {
      // Delete existing availability entries for this user and event
      await pool.query(
        'DELETE FROM user_availability WHERE user_id = ? AND event_id = ?',
        [userId, event_id]
      );
      
      // Insert new availability entries
      for (const slot of availability_slots) {
        await pool.query(
          `INSERT INTO user_availability 
           (user_id, event_id, availability_date, start_time, end_time) 
           VALUES (?, ?, ?, ?, ?)`,
          [
            userId, 
            event_id, 
            slot.availability_date, 
            slot.start_time, 
            slot.end_time
          ]
        );
      }
      
      await pool.query('COMMIT');
      
      // Get inserted availability data
      const [availabilityData]: any = await pool.query(
        'SELECT * FROM user_availability WHERE user_id = ? AND event_id = ?',
        [userId, event_id]
      );
      
      res.status(201).json(availabilityData);
    } catch (err) {
      await pool.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error submitting availability:', error);
    res.status(500).json({ error: 'Failed to submit availability' });
  }
};

// Get user's availability for an event
export const getUserAvailability = async (req: Request, res: Response) => {
  try {
    const userId = req.params.userId;
    const eventId = req.params.eventId;
    
    const [availability]: any = await pool.query(
      `SELECT * FROM user_availability 
       WHERE user_id = ? AND event_id = ?
       ORDER BY availability_date, start_time`,
      [userId, eventId]
    );
    
    res.json(availability);
  } catch (error) {
    console.error('Error fetching user availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

// Get all users' availability for an event (admin only)
export const getEventAvailability = async (req: Request, res: Response) => {
  try {
    const eventId = req.params.eventId;
    
    const [availability]: any = await pool.query(
      `SELECT ua.*, u.username, u.full_name 
       FROM user_availability ua
       JOIN users u ON ua.user_id = u.id
       WHERE ua.event_id = ?
       ORDER BY ua.availability_date, ua.start_time, u.full_name`,
      [eventId]
    );
    
    res.json(availability);
  } catch (error) {
    console.error('Error fetching event availability:', error);
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};