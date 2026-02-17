import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ParticipantAuth from '../models/ParticipantAuth.js';
import SpeakerAuth from '../models/SpeakerAuth.js';
import { cache } from "../middleware/cache.js";
import { CacheKeys, CacheTTL } from "../utils/cacheKeys.js";
import { tokenBucketRateLimit } from "../middleware/rateLimit.js";
import { isEncryptedPii, maybeDecryptPii, maybeEncryptPii } from "../utils/piiCrypto.js";
//

const router = express.Router();

// JWT Secret - read at runtime to ensure dotenv has loaded
const getJwtSecret = () => process.env.JWT_SECRET || 'alphabyte_jwt_secret_key_2026';
const JWT_EXPIRES_IN = "7d";

const authIpEmailKey = (req) => {
  const xff = req.headers["x-forwarded-for"];
  const ip = typeof xff === "string" && xff.trim() ? xff.split(",")[0].trim() : (req.ip || "unknown");
  const email = (req.body?.email || "").toString().trim().toLowerCase();
  return `${ip}:${email || "noemail"}`;
};

const loginLimiter = tokenBucketRateLimit({
  name: "auth:login",
  capacity: 10,
  refillTokens: 10,
  refillIntervalMs: 60_000,
  identifier: authIpEmailKey,
});

const signupLimiter = tokenBucketRateLimit({
  name: "auth:signup",
  capacity: 5,
  refillTokens: 5,
  refillIntervalMs: 60_000,
  identifier: authIpEmailKey,
});

// @desc    Participant Signup
// @route   POST /api/auth/signup
router.post("/signup", signupLimiter, async (req, res) => {
  try {
    const { name, email, password, phone, college, branch, year } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Validate password length
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Check if participant already exists in ParticipantAuth collection
    // Note: Same email can exist in other role collections (User, SpeakerAuth)
    const existingParticipant = await ParticipantAuth.findOne({ email: email.toLowerCase() });
    if (existingParticipant) {
      return res.status(400).json({
        success: false,
        message: 'You already have a participant account with this email',
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
      { id: participant._id, role: "PARTICIPANT", isParticipant: true },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN },
    );

    res.status(201).json({
      success: true,
      message: "Account created successfully",
      data: {
        token,
        user: {
          id: participant._id,
          name: participant.name,
          email: participant.email,
          role: "PARTICIPANT",
        },
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Error creating account",
      error: error.message,
    });
  }
});

// @desc    Speaker Signup
// @route   POST /api/auth/speaker/signup
router.post('/speaker/signup', signupLimiter, async (req, res) => {
  try {
    const { name, email, password, phone, bio, specializations } = req.body;

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

    // Check if speaker already exists in SpeakerAuth collection
    // Note: Same email can exist in other role collections (User, ParticipantAuth)
    const existingSpeaker = await SpeakerAuth.findOne({ email: email.toLowerCase() });
    if (existingSpeaker) {
      return res.status(400).json({
        success: false,
        message: 'You already have a speaker account with this email',
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new speaker
    const speaker = await SpeakerAuth.create({
      name,
      email: email.toLowerCase(),
      password: hashedPassword,
      phone,
      bio: bio || '',
      specializations: specializations || [],
    });

    // Generate JWT token
    const token = jwt.sign(
      { id: speaker._id, role: 'SPEAKER', isSpeaker: true },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      message: 'Speaker account created successfully',
      data: {
        token,
        user: {
          id: speaker._id,
          name: speaker.name,
          email: speaker.email,
          role: 'SPEAKER',
        },
        redirectPath: '/speaker',
      },
    });
  } catch (error) {
    console.error('Speaker signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating speaker account',
      error: error.message,
    });
  }
});

// @desc    Login for all roles (supports multiple roles per email)
// @route   POST /api/auth/login
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    console.log('Login attempt for:', email.toLowerCase());

    // Collect all accounts with this email across all collections
    const accounts = [];

    // Check User collection (Admin, Team Lead, Event Staff)
    const userAccount = await User.findOne({ email: email.toLowerCase() });
    if (userAccount) {
      accounts.push({
        user: userAccount,
        isParticipant: false,
        isSpeaker: false,
        role: userAccount.role,
        collection: 'User'
      });
    }

    // Check SpeakerAuth collection
    const speakerAccount = await SpeakerAuth.findOne({ email: email.toLowerCase() });
    if (speakerAccount) {
      accounts.push({
        user: speakerAccount,
        isParticipant: false,
        isSpeaker: true,
        role: 'SPEAKER',
        collection: 'SpeakerAuth'
      });
    }

    // Check ParticipantAuth collection
    const participantAccount = await ParticipantAuth.findOne({ email: email.toLowerCase() });
    if (participantAccount) {
      accounts.push({
        user: participantAccount,
        isParticipant: true,
        isSpeaker: false,
        role: 'PARTICIPANT',
        collection: 'ParticipantAuth'
      });
    }

    if (accounts.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    console.log(`Found ${accounts.length} account(s) for this email:`, accounts.map(a => a.collection));

    // Try password against all accounts and find the matching one
    let matchedAccount = null;
    for (const account of accounts) {
      const isPasswordValid = await bcrypt.compare(password, account.user.password);
      console.log(`Password check for ${account.collection}:`, isPasswordValid);
      if (isPasswordValid) {
        matchedAccount = account;
        break;
      }
    }

    if (!matchedAccount) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const user = matchedAccount.user;
    const isParticipant = matchedAccount.isParticipant;
    const isSpeaker = matchedAccount.isSpeaker;
    const role = matchedAccount.role;

    console.log(`Successful login as ${role} from ${matchedAccount.collection}`);

    // Check if account is suspended
    if (user.isSuspended) {
      return res.status(403).json({
        success: false,
        message: `Account suspended: ${user.suspensionReason || "Contact admin for more information"}`,
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Account is deactivated. Contact admin for assistance.",
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: role, isParticipant, isSpeaker },
      getJwtSecret(),
      { expiresIn: JWT_EXPIRES_IN },
    );

    // Determine redirect path based on role
    let redirectPath = "/participant";
    switch (role) {
      case "ADMIN":
        redirectPath = "/admin/dashboard";
        break;
      case "TEAM_LEAD":
        redirectPath = "/organizer";
        break;
      case "EVENT_STAFF":
        redirectPath = "/organizer";
        break;
      case 'SPEAKER':
        redirectPath = '/speaker';
        break;
      case 'PARTICIPANT':
        redirectPath = '/participant';
        break;
    }

    res.json({
      success: true,
      message: "Login successful",
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: role,
          phone: (() => {
            const v = maybeDecryptPii(user.phone);
            return isEncryptedPii(v) ? null : v;
          })(),
          college: user.college,
          branch: user.branch,
          year: user.year,
        },
        redirectPath,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Error logging in",
      error: error.message,
    });
  }
});

// @desc    Logout (frontend clears token)
// @route   POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
});

// @desc    Get current user profile
// @route   GET /api/auth/me
router.get(
  "/me",
  cache(CacheTTL.VERY_LONG, (req) => {
    // Extract user ID from JWT for cache key
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, getJwtSecret());
        return CacheKeys.user(decoded.id);
      }
    } catch (err) {
      // If token is invalid, use a generic key that won't match any cache
      return `auth:me:invalid:${Date.now()}`;
    }
    return `auth:me:notoken:${Date.now()}`;
  }),
  async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];

    // Verify token
    const decoded = jwt.verify(token, getJwtSecret());

    // Get user from appropriate collection
    let user;
    if (decoded.isParticipant) {
      user = await ParticipantAuth.findById(decoded.id).select("-password");
      if (user) {
        user = { ...user.toObject(), role: "PARTICIPANT" };
      }
    } else if (decoded.isSpeaker) {
      user = await SpeakerAuth.findById(decoded.id).select('-password');
      if (user) {
        user = { ...user.toObject(), role: 'SPEAKER' };
      }
    } else {
      user = await User.findById(decoded.id).select("-password");
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userObj = user && typeof user.toObject === 'function' ? user.toObject() : user;

    res.json({
      success: true,
      data: userObj
        ? {
            ...userObj,
            phone: (() => {
              const v = maybeDecryptPii(userObj.phone);
              return isEncryptedPii(v) ? null : v;
            })(),
          }
        : userObj,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error fetching user",
      error: error.message,
    });
  }
});

// @desc    Update user profile
// @route   PUT /api/auth/profile
router.put("/profile", async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, getJwtSecret());

    const { name, email, phone, avatar, upiId, payoutQrUrl } = req.body;

    // Load current user to support partial updates
    let currentUser;
    if (decoded.isParticipant) {
      currentUser = await ParticipantAuth.findById(decoded.id).select("-password");
    } else if (decoded.isSpeaker) {
      currentUser = await SpeakerAuth.findById(decoded.id).select("-password");
    } else {
      currentUser = await User.findById(decoded.id).select("-password");
    }

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const nextName = (typeof name === "string" ? name : currentUser.name)?.trim();
    const nextEmail = (
      typeof email === "string" ? email.toLowerCase() : currentUser.email
    )?.trim();

    if (!nextName || !nextEmail) {
      return res.status(400).json({
        success: false,
        message: "Name and email are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(nextEmail)) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid email address",
      });
    }

    // Check if email is already taken by another user
    let existingUser;
    if (decoded.isParticipant) {
      existingUser = await ParticipantAuth.findOne({
        email: nextEmail,
        _id: { $ne: decoded.id },
      });
    } else if (decoded.isSpeaker) {
      existingUser = await SpeakerAuth.findOne({
        email: nextEmail,
        _id: { $ne: decoded.id }
      });
    } else {
      existingUser = await User.findOne({
        email: nextEmail,
        _id: { $ne: decoded.id },
      });
    }

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email is already taken",
      });
    }

    // Update user in appropriate collection
    let updatedUser;
    const updateData = {
      name,
      email: email.toLowerCase(),
      ...(phone !== undefined ? { phone: maybeEncryptPii(phone || "") } : {}),
    };

    // Add avatar if provided
    if (avatar) {
      updateData.avatar = avatar;
    }

    // Payout details are applicable for internal User collection (admin/team lead/staff)
    if (!decoded.isParticipant && !decoded.isSpeaker) {
      if (typeof upiId === "string") {
        updateData.upiId = upiId.trim();
      }
      if (typeof payoutQrUrl === "string") {
        updateData.payoutQrUrl = payoutQrUrl;
      }
    }

    if (decoded.isParticipant) {
      updatedUser = await ParticipantAuth.findByIdAndUpdate(
        decoded.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
    } else if (decoded.isSpeaker) {
      updatedUser = await SpeakerAuth.findByIdAndUpdate(
        decoded.id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
    } else {
      updatedUser = await User.findByIdAndUpdate(decoded.id, updateData, {
        new: true,
        runValidators: true,
      }).select("-password");
    }

    if (!updatedUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser
        ? {
            ...updatedUser.toObject(),
            phone: (() => {
              const v = maybeDecryptPii(updatedUser.phone);
              return isEncryptedPii(v) ? null : v;
            })(),
          }
        : updatedUser,
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: error.message,
    });
  }
});

// @desc    Change password
// @route   PUT /api/auth/password
router.put("/password", async (req, res) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, getJwtSecret());

    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    // Validate new password length
    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Get user from appropriate collection (with password)
    let user;
    if (decoded.isParticipant) {
      user = await ParticipantAuth.findById(decoded.id);
    } else if (decoded.isSpeaker) {
      user = await SpeakerAuth.findById(decoded.id);
    } else {
      user = await User.findById(decoded.id);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired",
      });
    }
    res.status(500).json({
      success: false,
      message: "Error changing password",
      error: error.message,
    });
  }
});

export default router;
