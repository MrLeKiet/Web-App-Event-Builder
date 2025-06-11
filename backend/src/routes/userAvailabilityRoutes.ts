import express from 'express';
import { submitAvailability, getUserAvailability, getEventAvailability } from '../controllers/userAvailabilityController';
import { authenticateUser, checkAdmin, checkSameUser } from '../utils/auth';

const router = express.Router();

// Submit availability for an event
router.post('/users/:userId', authenticateUser, checkSameUser, submitAvailability);

// Get user's availability for an event
router.get('/users/:userId/events/:eventId', authenticateUser, checkSameUser, getUserAvailability);

// Get all users' availability for an event (admin only)
router.get('/events/:eventId', authenticateUser, checkAdmin, getEventAvailability);

export default router;