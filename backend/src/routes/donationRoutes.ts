import { Router } from 'express';
import {
    createDonation,
    getEventDonations,
    getUserDonations,
    updateDonationStatus,
    getDonationTypes,
    getEventDonationTotal
} from '../controllers/donationController';
import { authenticateUser, checkSameUser, checkAdmin } from '../utils/auth';

const router = Router();

// Donation endpoints
router.post('/donations', createDonation);
router.get('/donations/types', getDonationTypes);
router.get('/events/:eventId/donations', getEventDonations);
router.get('/events/:eventId/donations/total', getEventDonationTotal);
router.get('/users/:userId/donations', authenticateUser, checkSameUser, getUserDonations);
router.put('/donations/:donationId/status', checkAdmin, updateDonationStatus);

export default router;