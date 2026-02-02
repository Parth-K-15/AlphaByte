import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

// User Schema (inline to avoid import issues)
const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["ADMIN", "TEAM_LEAD", "EVENT_STAFF", "PARTICIPANT"],
      default: "PARTICIPANT",
    },
    college: { type: String },
    branch: { type: String },
    year: { type: String },
    assignedEvent: { type: mongoose.Schema.Types.ObjectId, ref: "Event" },
    teamLead: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    isActive: { type: Boolean, default: true },
    restrictionReason: { type: String },
    restrictedAt: { type: Date },
    isSuspended: { type: Boolean, default: false },
    suspensionReason: { type: String },
    suspendedAt: { type: Date },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Test users to create
    const users = [
      {
        name: 'Admin User',
        email: 'admin@alphabyte.com',
        password: 'admin123',
        role: 'ADMIN',
      },
      {
        name: 'Team Lead',
        email: 'lead@alphabyte.com',
        password: 'lead123',
        role: 'TEAM_LEAD',
      },
      {
        name: 'Event Staff',
        email: 'staff@alphabyte.com',
        password: 'staff123',
        role: 'EVENT_STAFF',
      },
      {
        name: 'Test Participant',
        email: 'participant@alphabyte.com',
        password: 'part123',
        role: 'PARTICIPANT',
        college: 'Test University',
        branch: 'Computer Science',
        year: '3rd Year',
      },
    ];

    for (const userData of users) {
      // Check if user exists
      const existingUser = await User.findOne({ email: userData.email });
      
      if (existingUser) {
        // Update password hash
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.updateOne(
          { email: userData.email },
          { password: hashedPassword }
        );
        console.log(`🔄 Updated password for: ${userData.email}`);
      } else {
        // Create new user
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        await User.create({
          ...userData,
          password: hashedPassword,
        });
        console.log(`✅ Created user: ${userData.email}`);
      }
    }

    console.log('\n📋 Test Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Admin:       admin@alphabyte.com / admin123');
    console.log('Team Lead:   lead@alphabyte.com / lead123');
    console.log('Event Staff: staff@alphabyte.com / staff123');
    console.log('Participant: participant@alphabyte.com / part123');
    console.log('─────────────────────────────────────\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
};

seedUsers();
