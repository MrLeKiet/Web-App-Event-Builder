import { Router } from 'express';
import { 
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getEventsByType
} from '../controllers/eventController';
import { checkAdmin } from '../utils/auth';

const router = Router();

router.get('/', getAllEvents);
router.get('/type/:type', getEventsByType);
router.get('/:id', getEventById);
router.post('/', checkAdmin, createEvent);
router.put('/:id', checkAdmin, updateEvent);
router.delete('/:id', checkAdmin, deleteEvent);

export default router;