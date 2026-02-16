import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import CertificateRequest from '../models/CertificateRequest.js';
import Log from '../models/Log.js';

dotenv.config();

async function cleanupTestData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    console.log('🧹 Starting cleanup of test/dummy data...\n');

    // Find all test/dummy participants (with .test or .dummy email addresses)
    const testParticipants = await Participant.find({
      email: { $regex: /\.(test|dummy)@/i }
    });

    if (testParticipants.length === 0) {
      console.log('ℹ️  No test/dummy participants found by email pattern. Checking for orphaned certificate records...\n');
    }

    if (testParticipants.length > 0) {
      console.log(`📋 Found ${testParticipants.length} test/dummy participants:\n`);
    }
    
    if (testParticipants.length > 0) {
      // Group by event for better reporting
      const eventGroups = {};
      for (const participant of testParticipants) {
        const eventId = participant.event?.toString();
        if (!eventGroups[eventId]) {
          eventGroups[eventId] = [];
        }
        eventGroups[eventId].push(participant);
      }

      // Display participants by event
      for (const [eventId, participants] of Object.entries(eventGroups)) {
        const event = await Event.findById(eventId);
        console.log(`  Event: ${event?.title || 'Unknown Event'} (${participants.length} test participants)`);
        participants.forEach(p => {
          console.log(`    - ${p.name} (${p.email})`);
        });
        console.log('');
      }

      // Get all test participant IDs
      const testParticipantIds = testParticipants.map(p => p._id);

      // Delete attendance records
      const attendanceResult = await Attendance.deleteMany({
        participant: { $in: testParticipantIds }
      });
      console.log(`🗑️  Deleted ${attendanceResult.deletedCount} attendance records`);

      // Remove participants from events
      for (const [eventId, participants] of Object.entries(eventGroups)) {
        const event = await Event.findById(eventId);
        if (event) {
          const participantIds = participants.map(p => p._id);
          event.participants = event.participants.filter(
            id => !participantIds.some(testId => testId.equals(id))
          );
          await event.save();
          console.log(`📝 Removed ${participants.length} test participants from event: ${event.title}`);
        }
      }

      // Delete certificates/requests explicitly tied to these participants (prevents orphans)
      const certDelete = await Certificate.deleteMany({ participant: { $in: testParticipantIds } });
      console.log(`🗑️  Deleted ${certDelete.deletedCount} certificates tied to test participants`);
      const reqDelete = await CertificateRequest.deleteMany({ participant: { $in: testParticipantIds } });
      console.log(`🗑️  Deleted ${reqDelete.deletedCount} certificate requests tied to test participants`);

      // Delete logs tied to test participants (if logged)
      const logDelete = await Log.deleteMany({ participantEmail: { $regex: /\.(test|dummy)@/i } });
      console.log(`🗑️  Deleted ${logDelete.deletedCount} logs with test/dummy emails`);

      // Delete participants
      const participantResult = await Participant.deleteMany({
        _id: { $in: testParticipantIds }
      });
      console.log(`🗑️  Deleted ${participantResult.deletedCount} test/dummy participants`);
    }

    // Remove orphaned certificates (participant was deleted but certificate remains)
    const orphanCertificates = await Certificate.aggregate([
      {
        $lookup: {
          from: 'participants',
          localField: 'participant',
          foreignField: '_id',
          as: 'participantDoc'
        }
      },
      { $match: { participantDoc: { $size: 0 } } },
      { $project: { _id: 1 } }
    ]);
    const orphanCertificateIds = orphanCertificates.map(d => d._id);
    if (orphanCertificateIds.length > 0) {
      const orphanCertDelete = await Certificate.deleteMany({ _id: { $in: orphanCertificateIds } });
      console.log(`🗑️  Deleted ${orphanCertDelete.deletedCount} orphaned certificates (missing participant)`);
    } else {
      console.log('✅ No orphaned certificates found');
    }

    // Remove orphaned certificate requests (participant was deleted but request remains)
    const orphanRequests = await CertificateRequest.aggregate([
      {
        $lookup: {
          from: 'participants',
          localField: 'participant',
          foreignField: '_id',
          as: 'participantDoc'
        }
      },
      { $match: { participantDoc: { $size: 0 } } },
      { $project: { _id: 1 } }
    ]);
    const orphanRequestIds = orphanRequests.map(d => d._id);
    if (orphanRequestIds.length > 0) {
      const orphanReqDelete = await CertificateRequest.deleteMany({ _id: { $in: orphanRequestIds } });
      console.log(`🗑️  Deleted ${orphanReqDelete.deletedCount} orphaned certificate requests (missing participant)`);
    } else {
      console.log('✅ No orphaned certificate requests found');
    }

    // Remove orphaned CERTIFICATE logs that point to missing participants
    const orphanCertLogs = await Log.aggregate([
      { $match: { entityType: 'CERTIFICATE', participantId: { $type: 'objectId' } } },
      {
        $lookup: {
          from: 'participants',
          localField: 'participantId',
          foreignField: '_id',
          as: 'participantDoc'
        }
      },
      { $match: { participantDoc: { $size: 0 } } },
      { $project: { _id: 1 } }
    ]);
    const orphanLogIds = orphanCertLogs.map(d => d._id);
    if (orphanLogIds.length > 0) {
      const orphanLogDelete = await Log.deleteMany({ _id: { $in: orphanLogIds } });
      console.log(`🗑️  Deleted ${orphanLogDelete.deletedCount} orphaned CERTIFICATE logs (missing participant)`);
    } else {
      console.log('✅ No orphaned CERTIFICATE logs found');
    }

    console.log('\n✅ Cleanup completed successfully!\n');

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  }
}

// Run the cleanup
cleanupTestData();
