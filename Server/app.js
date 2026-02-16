import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get current directory in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env variables with explicit path
dotenv.config({ path: join(__dirname, '.env') });

// Debug: Verify env variables are loaded
console.log('🔍 Environment Check:');
console.log('   REDIS_HOST:', process.env.REDIS_HOST || 'NOT SET');
console.log('   CACHE_ENABLED:', process.env.CACHE_ENABLED || 'NOT SET');
console.log('   PORT:', process.env.PORT || 'NOT SET');

// Import routes
import dashboardRoutes from './routes/dashboard.js';
import eventRoutes from './routes/events.js';
import teamRoutes from './routes/teams.js';
import userRoutes from './routes/users.js';
import accessControlRoutes from './routes/accessControl.js';
import organizerRoutes from './routes/organizer.js';
import speakerRoutes from './routes/speaker.js';
import participantRoutes from './routes/participants.js';
import participantProfileRoutes from './routes/participantProfile.js';
import authRoutes from './routes/auth.js';
import reportsRoutes from './routes/reports.js';
import logsRoutes from './routes/logs.js';
import transcriptRoutes from './routes/transcript.js';
import chatbotRoutes from './routes/chatbot.js';

// Import email service
import { testEmailConnection } from "./utils/emailService.js";
import financeRoutes from "./routes/finance.js";

// Import Redis
import { initRedis, closeRedis } from "./config/redis.js";

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  process.env.CLIENT_URL, // Add your Vercel frontend URL here
].filter(Boolean); // Remove undefined values

// CORS configuration
app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      if (allowedOrigins.indexOf(origin) === -1) {
        const msg =
          "The CORS policy for this site does not allow access from the specified Origin.";
        return callback(new Error(msg), false);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Content-Range", "X-Content-Range"],
    maxAge: 600, // Cache preflight request for 10 minutes
  }),
);

// Increase payload size limit for base64 image uploads
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Serve static files (for certificates)
app.use("/certificates", express.static("public/certificates"));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB Connected Successfully");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
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
app.use('/api/speaker', speakerRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/participant', participantProfileRoutes); // Must be before participantRoutes
app.use('/api/participant', participantRoutes);
app.use('/api/transcript', transcriptRoutes);
app.use("/api/finance", financeRoutes);

// Health check route
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: "Something went wrong!",
    error: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

// Connect to database on startup
connectDB();

// Start server (only in development/local environment)
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);

    // Initialize Redis
    console.log("\n🔄 Initializing Redis...");
    await initRedis();

    // Test email configuration
    console.log("\n📧 Testing email configuration...");
    await testEmailConnection();
  });
}

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n⚠️  Shutting down gracefully...");
  await closeRedis();
  await mongoose.connection.close();
  process.exit(0);
});

export default app;
