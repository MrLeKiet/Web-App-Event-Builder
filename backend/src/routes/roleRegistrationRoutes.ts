import { Router } from 'express';
import {
    registerForRole,
    unregisterFromRole,
    getUserRoleRegistrations,
    updateRoleRegistrationStatus
} from '../controllers/roleRegistrationController';
import { authenticateUser, checkSameUser, checkAdmin } from '../utils/auth';

const router = Router();

// Role registration endpoints
router.post('/users/:userId/roles', authenticateUser, checkSameUser, registerForRole);
router.delete('/users/:userId/events/:eventId/roles/:roleId', authenticateUser, checkSameUser, unregisterFromRole);
router.get('/users/:userId/roles', authenticateUser, checkSameUser, getUserRoleRegistrations);
router.put('/registrations/:registrationId/status', checkAdmin, updateRoleRegistrationStatus);

export default router;