import { Router } from 'express';
import { 
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByType
} from '../controllers/eventController';
import { checkAdmin, authenticateUser } from '../utils/auth';

const router = Router();

router.get('/', getAllEvents);
router.get('/type/:type', getEventsByType);
router.get('/:id', getEventById);

// CHANGE THIS LINE - Add authenticateUser middleware before checkAdmin
router.post('/', authenticateUser, checkAdmin, createEvent);

// Also update these routes for consistency
router.put('/:id', authenticateUser, checkAdmin, updateEvent);
router.delete('/:id', authenticateUser, checkAdmin, deleteEvent);

export default router;