import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Participant from './models/Participant.js';
import Certificate from './models/Certificate.js';
import Event from './models/Event.js';
import Attendance from './models/Attendance.js';

dotenv.config();

async function testCertificates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected');

    // Test with some common email patterns
    const testEmails = [
      'participant@alphabyte.com',
      'test@test.com',
      'user@example.com'
    ];

    for (const email of testEmails) {
      console.log(`\n\n📧 Testing email: ${email}`);
      console.log('='.repeat(60));

      // Find participants
      const participants = await Participant.find({ 
        email: { $regex: new RegExp(`^${email}$`, 'i') } 
      }).populate('event');

      console.log(`\n👥 Found ${participants.length} participant records:`);
      participants.forEach((p, i) => {
        console.log(`  ${i + 1}. Event: ${p.event?.title || p.event?.name || 'Unknown'}`);
        console.log(`     Registration: ${p.registrationStatus}`);
        console.log(`     Attendance: ${p.attendanceStatus || 'Not marked'}`);
        console.log(`     Event Status: ${p.event?.status || 'Unknown'}`);
      });

      // Check QR attendance
      const attendanceRecords = await Attendance.find({
        participantId: { $in: participants.map(p => p._id) }
      });
      console.log(`\n📱 Found ${attendanceRecords.length} QR attendance records`);

      // Check certificates
      const certificates = await Certificate.find({
        participantId: { $in: participants.map(p => p._id) }
      });
      console.log(`\n🏆 Found ${certificates.length} certificates`);
      certificates.forEach((c, i) => {
        console.log(`  ${i + 1}. Certificate ID: ${c.certificateId}`);
        console.log(`     Status: ${c.status}`);
        console.log(`     URL: ${c.cloudinaryUrl || c.certificateUrl || 'N/A'}`);
      });

      // Check completed events
      const completedEvents = await Event.find({ status: { $regex: /completed/i } });
      console.log(`\n✅ Total completed events in DB: ${completedEvents.length}`);
      if (completedEvents.length > 0) {
        completedEvents.slice(0, 3).forEach((e, i) => {
          console.log(`  ${i + 1}. ${e.title || e.name} - Status: ${e.status}`);
        });
      }
    }

    // Show all participants
    console.log('\n\n' + '='.repeat(60));
    console.log('📊 ALL PARTICIPANTS IN DATABASE:');
    console.log('='.repeat(60));
    const allParticipants = await Participant.find().populate('event').limit(10);
    console.log(`Total: ${await Participant.countDocuments()} participants\n`);
    
    allParticipants.forEach((p, i) => {
      console.log(`${i + 1}. Email: ${p.email}`);
      console.log(`   Event: ${p.event?.title || p.event?.name || 'Unknown'}`);
      console.log(`   Registration: ${p.registrationStatus}, Attendance: ${p.attendanceStatus || 'None'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  }
}

testCertificates();
