import { Router } from 'express';
import {
    getEventRoles,
    createEventRole,
    updateEventRole,
    deleteEventRole,
    getRoleRegistrations
} from '../controllers/eventRolesController';
import { checkAdmin } from '../utils/auth';

const router = Router();

// Event roles endpoints
router.get('/events/:eventId/roles', getEventRoles);
router.post('/events/:eventId/roles', checkAdmin, createEventRole);
router.put('/events/:eventId/roles/:roleId', checkAdmin, updateEventRole);
router.delete('/events/:eventId/roles/:roleId', checkAdmin, deleteEventRole);
router.get('/events/:eventId/roles/:roleId/users', getRoleRegistrations);

export default router;