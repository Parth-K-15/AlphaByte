import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import routes
import dashboardRoutes from './routes/dashboard.js';
import eventRoutes from './routes/events.js';
import teamRoutes from './routes/teams.js';
import userRoutes from './routes/users.js';
import accessControlRoutes from './routes/accessControl.js';
import organizerRoutes from './routes/organizer.js';
import participantRoutes from './routes/participants.js';
import participantProfileRoutes from './routes/participantProfile.js';
import authRoutes from './routes/auth.js';

// Import email service
import { testEmailConnection } from './utils/emailService.js';

// Load env variables
dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:5173', 
  'http://localhost:5174', 
  'http://localhost:5175',
  process.env.CLIENT_URL // Add your Vercel frontend URL here
].filter(Boolean); // Remove undefined values

app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/teams', teamRoutes);
app.use('/api/users', userRoutes);
app.use('/api/access-control', accessControlRoutes);
app.use('/api/organizer', organizerRoutes);
app.use('/api/participant', participantProfileRoutes); // Must be before participantRoutes
app.use('/api/participant', participantRoutes);

// Health check route
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Connect to database on startup
connectDB();

// Start server (only in development/local environment)
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    
    // Test email configuration
    console.log('\n📧 Testing email configuration...');
    await testEmailConnection();
  });
}

export default app;
