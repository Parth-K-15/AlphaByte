import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ParticipantAuth from '../models/ParticipantAuth.js';

const router = express.Router();

// JWT Secret (use environment variable in production)
const JWT_SECRET = process.env.JWT_SECRET || 'alphabyte_jwt_secret_key_2026';
const JWT_EXPIRES_IN = '7d';

// @desc    Participant Signup
// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, phone, college, branch, year } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long',
      });
    }

    // Check if participant already exists
    const existingParticipant = await ParticipantAuth.findOne({ email: email.toLowerCase() });
    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'An account with this email already exists',
      });
    }

    // Also check User collection (admin/staff can't signup as participant)
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'This email is already registered as a staff member. Please login instead.',
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new participant in ParticipantAuth collection
    const participant = await ParticipantAuth.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      college,
      branch,
      year,
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: participant._id, role: 'PARTICIPANT', isParticipant: true },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      data: {
        token,
        user: {
          id: participant._id,
          name: participant.name,
          email: participant.email,
          role: 'PARTICIPANT',
        },
      },
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating account',
      error: error.message,
    });
  }
});

// @desc    Login for all roles
// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    // First check User collection (Admin, Team Lead, Event Staff)
    let user = await User.findOne({ email: email.toLowerCase() });
    let isParticipant = false;
    let role = null;

    if (!user) {
      // Check ParticipantAuth collection
      user = await ParticipantAuth.findOne({ email: email.toLowerCase() });
      if (user) {
        isParticipant = true;
        role = 'PARTICIPANT';
      }
    } else {
      role = user.role;
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Check if account is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account suspended: ${user.suspensionReason || 'Contact admin for more information'}`,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Contact admin for assistance.',
      });
    }

    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: role, isParticipant },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // Determine redirect path based on role
    let redirectPath = '/participant';
    switch (role) {
      case 'ADMIN':
        redirectPath = '/admin/dashboard';
        break;
      case 'TEAM_LEAD':
        redirectPath = '/organizer';
        break;
      case 'EVENT_STAFF':
        redirectPath = '/organizer';
        break;
      case 'PARTICIPANT':
        redirectPath = '/participant';
        break;
    }

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: role,
          phone: user.phone,
          college: user.college,
          branch: user.branch,
          year: user.year,
        },
        redirectPath,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message,
    });
  }
});

// @desc    Logout (frontend clears token)
// @route   POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.json({
    success: true,
    message: 'Logged out successfully',
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
router.get('/me', async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No token provided',
      });
    }

    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Get user from appropriate collection
    let user;
    if (decoded.isParticipant) {
      user = await ParticipantAuth.findById(decoded.id).select('-password');
      if (user) {
        user = { ...user.toObject(), role: 'PARTICIPANT' };
      }
    } else {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    res.json({
      success: true,
      data: user,
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error fetching user',
      error: error.message,
    });
  }
});

export default router;
