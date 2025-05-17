import { Router } from 'express';
import {
    registerForEvent,
    cancelRegistration,
    getUserRegistrations,
    getEventRegistrations
} from '../controllers/registrationController';
import { authenticateUser, checkSameUser } from '../utils/auth';

const router = Router();

// User registrations
router.post('/users/:userId/register', authenticateUser, checkSameUser, registerForEvent);
router.delete('/users/:userId/events/:eventId', authenticateUser, checkSameUser, cancelRegistration);
router.get('/users/:userId/events', authenticateUser, checkSameUser, getUserRegistrations);

// Event registrations
router.get('/events/:eventId/users', getEventRegistrations);

export default router;