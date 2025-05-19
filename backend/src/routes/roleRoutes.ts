import { Router } from 'express';
import {
    getEventRoles,
    createEventRole,
    updateEventRole,
    deleteEventRole,
    getRoleRegistrations
} from '../controllers/eventRolesController';
import { checkAdmin, authenticateUser } from '../utils/auth';

const router = Router();

// Event roles endpoints
router.get('/events/:eventId/roles', getEventRoles);

// Add authenticateUser middleware to these admin routes:
router.post('/events/:eventId/roles', authenticateUser, checkAdmin, createEventRole);
router.put('/events/:eventId/roles/:roleId', authenticateUser, checkAdmin, updateEventRole);
router.delete('/events/:eventId/roles/:roleId', authenticateUser, checkAdmin, deleteEventRole);

router.get('/events/:eventId/roles/:roleId/users', getRoleRegistrations);

export default router;