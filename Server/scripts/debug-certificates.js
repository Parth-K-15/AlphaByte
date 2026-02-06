import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Certificate from './models/Certificate.js';
import Participant from './models/Participant.js';
import Attendance from './models/Attendance.js';
import Event from './models/Event.js';

dotenv.config();

async function debugCertificates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    const email = 'participant@alphabyte.com';
    
    console.log('='.repeat(70));
    console.log('🔍 DEBUGGING CERTIFICATE FETCHING FOR:', email);
    console.log('='.repeat(70));
    
    // Step 1: Find Participant records by email
    console.log('\n📋 STEP 1: Finding Participant records by email...');
    const participantRecords = await Participant.find({ 
      email: email.toLowerCase() 
    }).populate('event', 'title status');
    
    console.log(`Found ${participantRecords.length} participant records:\n`);
    participantRecords.forEach((p, i) => {
      console.log(`  ${i + 1}. Participant ID: ${p._id}`);
      console.log(`     Email: ${p.email}`);
      console.log(`     Event: ${p.event?.title || 'N/A'}`);
      console.log(`     Attendance: ${p.attendanceStatus}`);
      console.log('');
    });
    
    const participantIds = participantRecords.map(p => p._id.toString());
    
    // Step 2: Find ALL certificates in database
    console.log('\n🏆 STEP 2: Finding ALL certificates in database...');
    const allCertificates = await Certificate.find()
      .populate('event', 'title')
      .populate('participant', 'email name fullName');
    
    console.log(`Found ${allCertificates.length} total certificates in database:\n`);
    allCertificates.forEach((cert, i) => {
      console.log(`  ${i + 1}. Certificate ID: ${cert._id}`);
      console.log(`     Event: ${cert.event?.title || 'N/A'}`);
      console.log(`     Participant ID: ${cert.participant?._id}`);
      console.log(`     Participant Email: ${cert.participant?.email || 'N/A'}`);
      console.log(`     Participant Name: ${cert.participant?.name || cert.participant?.fullName || 'N/A'}`);
      console.log(`     Certificate #: ${cert.certificateId}`);
      console.log(`     Cloudinary: ${cert.cloudinaryUrl ? 'YES ☁️' : 'NO'}`);
      console.log('');
    });
    
    // Step 3: Find certificates matching our participant IDs
    console.log('\n🔍 STEP 3: Finding certificates for our participant IDs...');
    console.log(`Searching with participant IDs: ${participantIds.join(', ')}\n`);
    
    const matchingCertificates = await Certificate.find({ 
      participant: { $in: participantRecords.map(p => p._id) } 
    }).populate('event').populate('participant');
    
    console.log(`Found ${matchingCertificates.length} matching certificates\n`);
    matchingCertificates.forEach((cert, i) => {
      console.log(`  ${i + 1}. Certificate ID: ${cert._id}`);
      console.log(`     Event: ${cert.event?.title || 'N/A'}`);
      console.log(`     Participant Email: ${cert.participant?.email}`);
      console.log('');
    });
    
    // Step 4: Check Attendance records
    console.log('\n📱 STEP 4: Checking Attendance (QR) records...');
    const attendanceRecords = await Attendance.find({
      participant: { $in: participantRecords.map(p => p._id) }
    }).populate('event', 'title').populate('participant', 'email name');
    
    console.log(`Found ${attendanceRecords.length} attendance records:\n`);
    attendanceRecords.forEach((att, i) => {
      console.log(`  ${i + 1}. Event: ${att.event?.title || 'N/A'}`);
      console.log(`     Participant ID: ${att.participant?._id}`);
      console.log(`     Participant Email: ${att.participant?.email}`);
      console.log(`     Scanned At: ${att.scannedAt}`);
      console.log('');
    });
    
    // Step 5: Check if there are certificates for different participant IDs with same email
    console.log('\n🔎 STEP 5: Looking for certificates with same email but different ID...');
    const certsWithEmail = await Certificate.find().populate('participant');
    const certsMatchingEmail = certsWithEmail.filter(c => 
      c.participant && c.participant.email && 
      c.participant.email.toLowerCase() === email.toLowerCase()
    );
    
    console.log(`Found ${certsMatchingEmail.length} certificates for email ${email}:\n`);
    certsMatchingEmail.forEach((cert, i) => {
      console.log(`  ${i + 1}. Certificate ID: ${cert._id}`);
      console.log(`     Participant ID: ${cert.participant._id}`);
      console.log(`     Is in participantIds list: ${participantIds.includes(cert.participant._id.toString())}`);
      console.log(`     Event: ${cert.event || 'N/A'}`);
      console.log('');
    });
    
    console.log('\n' + '='.repeat(70));
    console.log('💡 DIAGNOSIS:');
    console.log('='.repeat(70));
    console.log(`- Participant records found: ${participantRecords.length}`);
    console.log(`- Certificates in DB: ${allCertificates.length}`);
    console.log(`- Certificates matching participant IDs: ${matchingCertificates.length}`);
    console.log(`- Certificates with matching email: ${certsMatchingEmail.length}`);
    console.log(`- Attendance records: ${attendanceRecords.length}`);
    
    if (certsMatchingEmail.length > 0 && matchingCertificates.length === 0) {
      console.log('\n❌ ISSUE FOUND: Certificates exist for this email but participant IDs do not match!');
      console.log('   This means the Attendance.participant field points to a different Participant record.');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  }
}

debugCertificates();
