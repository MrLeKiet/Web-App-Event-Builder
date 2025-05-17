import { Router } from 'express';
import {
    registerUser,
    loginUser,
    getUserProfile,
    getAllUsers,
    updateUserRole
} from '../controllers/userController';
import { checkAdmin, authenticateUser } from '../utils/auth';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/:id', getUserProfile);

// Admin-only routes
router.get('/', authenticateUser, checkAdmin, getAllUsers);
router.put('/:id/role', authenticateUser, checkAdmin, updateUserRole);

export default router;