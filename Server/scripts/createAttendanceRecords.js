import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Import models
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import User from '../models/User.js';

const createAttendanceRecords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find the badminton event
    const event = await Event.findOne({ 
      title: 'Badminton Championship 2026' 
    });

    if (!event) {
      console.log('❌ Badminton Championship 2026 event not found!');
      process.exit(1);
    }

    console.log(`📋 Event: ${event.title}`);
    console.log(`   Event ID: ${event._id}\n`);

    // Get admin user to use as markedBy
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (!adminUser) {
      console.error('❌ No admin user found.');
      process.exit(1);
    }

    // Find all dummy participants
    const dummyParticipants = await Participant.find({
      email: { $regex: /dummy@test.com/i },
      event: event._id
    });

    console.log(`👥 Found ${dummyParticipants.length} dummy participants\n`);

    let created = 0;
    let skipped = 0;

    for (const participant of dummyParticipants) {
      // Check if attendance record already exists
      const existingAttendance = await Attendance.findOne({
        event: event._id,
        participant: participant._id
      });

      if (existingAttendance) {
        console.log(`   ⏭️  ${participant.name} - Attendance already exists`);
        skipped++;
        continue;
      }

      // Create attendance record
      await Attendance.create({
        event: event._id,
        participant: participant._id,
        scannedAt: new Date(),
        markedBy: adminUser._id,
        status: 'PRESENT',
        isValid: true
      });

      console.log(`   ✅ ${participant.name} - Attendance record created`);
      created++;
    }

    console.log(`\n📊 Summary:`);
    console.log(`   Created: ${created} attendance records`);
    console.log(`   Skipped: ${skipped} (already exist)`);
    console.log('\n💡 Now refresh your Certificates page - participants should appear!');

  } catch (error) {
    console.error('❌ Error creating attendance records:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n✅ Disconnected from MongoDB');
  }
};

createAttendanceRecords();
