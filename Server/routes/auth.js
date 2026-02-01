import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Participant from '../models/Participant.js';

const router = express.Router();

// JWT Secret (should be in .env)
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Sign Up
router.post('/signup', async (req, res) => {
  try {
    const { name, email, phone, password, role } = req.body;

    // Validate input
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (role !== 'admin' && role !== 'participant') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    if (role === 'admin') {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists with this email' });
      }
    } else {
      const existingParticipant = await Participant.findOne({ email });
      if (existingParticipant) {
        return res.status(400).json({ message: 'Participant already exists with this email' });
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user/participant
    let newUser;
    if (role === 'admin') {
      newUser = await User.create({
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'ADMIN',
      });
    } else {
      newUser = await Participant.create({
        fullName: name,
        name,
        email,
        phone,
        password: hashedPassword,
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: newUser._id, 
        email: newUser.email, 
        role: role === 'admin' ? 'ADMIN' : 'PARTICIPANT' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      id: newUser._id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: role === 'admin' ? 'ADMIN' : 'PARTICIPANT',
    };

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    // Validate input
    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    if (role !== 'admin' && role !== 'participant') {
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Find user based on role
    let user;
    if (role === 'admin') {
      user = await User.findOne({ email });
    } else {
      user = await Participant.findOne({ email });
    }

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if user is active (for admin users)
    if (role === 'admin' && user.isActive === false) {
      return res.status(403).json({ message: 'Your account has been deactivated' });
    }

    // Check if user is suspended
    if (user.isSuspended) {
      return res.status(403).json({ message: 'Your account has been suspended' });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: user._id, 
        email: user.email, 
        role: role === 'admin' ? user.role : 'PARTICIPANT' 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Return user data (without password)
    const userData = {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: role === 'admin' ? user.role : 'PARTICIPANT',
    };

    res.json({
      message: 'Login successful',
      token,
      user: userData,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify Token (optional - for checking if user is still logged in)
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Find user based on role
    let user;
    if (decoded.role === 'PARTICIPANT') {
      user = await Participant.findById(decoded.id).select('-password');
    } else {
      user = await User.findById(decoded.id).select('-password');
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
});

export default router;
