import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import Event from '../models/Event.js';

dotenv.config();

const dummyEmails = [
  'aarav.sharma.dummy@test.com',
  'diya.patel.dummy@test.com',
  'ishaan.kumar.dummy@test.com',
  'ananya.reddy.dummy@test.com',
  'vihaan.singh.dummy@test.com',
  'saanvi.iyer.dummy@test.com',
  'aditya.mehta.dummy@test.com',
  'aadhya.nair.dummy@test.com',
  'arjun.gupta.dummy@test.com',
  'kiara.desai.dummy@test.com'
];

async function removeDummyParticipants() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find dummy participants
    const dummyParticipants = await Participant.find({
      email: { $in: dummyEmails }
    });

    if (dummyParticipants.length === 0) {
      console.log('ℹ️  No dummy participants found.');
      return;
    }

    console.log(`Found ${dummyParticipants.length} dummy participants:\n`);
    dummyParticipants.forEach((p, i) => {
      console.log(`${i + 1}. ${p.name} (${p.email}) - Event: ${p.event}`);
    });

    const participantIds = dummyParticipants.map(p => p._id);
    const eventIds = [...new Set(dummyParticipants.map(p => p.event.toString()))];

    // Delete attendance records
    const attendanceResult = await Attendance.deleteMany({
      participant: { $in: participantIds }
    });
    console.log(`\n✅ Deleted ${attendanceResult.deletedCount} attendance records`);

    // Delete certificates
    const certificateResult = await Certificate.deleteMany({
      participant: { $in: participantIds }
    });
    console.log(`✅ Deleted ${certificateResult.deletedCount} certificates`);

    // Remove participants from events
    for (const eventId of eventIds) {
      await Event.updateOne(
        { _id: eventId },
        { $pull: { participants: { $in: participantIds } } }
      );
    }
    console.log(`✅ Removed participants from ${eventIds.length} event(s)`);

    // Delete participants
    const participantResult = await Participant.deleteMany({
      _id: { $in: participantIds }
    });
    console.log(`✅ Deleted ${participantResult.deletedCount} participants\n`);

    console.log('🎉 Successfully cleaned up all dummy participant data!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

removeDummyParticipants();
