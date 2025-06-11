import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import eventRoutes from './routes/eventRoutes';
import userRoutes from './routes/userRoutes';
import registrationRoutes from './routes/registrationRoutes';
import roleRoutes from './routes/roleRoutes';
import roleRegistrationRoutes from './routes/roleRegistrationRoutes';
import donationRoutes from './routes/donationRoutes';
import availabilityRoutes from './routes/userAvailabilityRoutes';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/events', eventRoutes);
app.use('/api/users', userRoutes);
app.use('/api/registrations', registrationRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/role-registrations', roleRegistrationRoutes);
app.use('/api', donationRoutes);
app.use('/api/availability', availabilityRoutes);
// Basic route
app.get('/', (req, res) => {
  res.send('Volunteer Event Management API');
});

// Start server
app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});