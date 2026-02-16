import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';

dotenv.config();

const dummyParticipants = [
  {
    fullName: 'Aarav Sharma',
    name: 'Aarav Sharma',
    email: 'aarav.sharma.dummy@test.com',
    phone: '9876543210',
    college: 'Indian Institute of Technology, Delhi',
    year: '3rd Year',
    branch: 'Computer Science',
    registrationStatus: 'CONFIRMED',
    registrationType: 'ONLINE',
    attendanceStatus: 'ATTENDED'
  },
  {
    fullName: 'Diya Patel',
    name: 'Diya Patel',
    email: 'diya.patel.dummy@test.com',
    phone: '9876543211',
    college: 'National Institute of Technology, Trichy',
    year: '2nd Year',
    branch: 'Electronics',
    registrationStatus: 'CONFIRMED',
    registrationType: 'ONLINE',
    attendanceStatus: 'ATTENDED'
  },
  {
    fullName: 'Ishaan Kumar',
    name: 'Ishaan Kumar',
    email: 'ishaan.kumar.dummy@test.com',
    phone: '9876543212',
    college: 'BITS Pilani',
    year: '4th Year',
    branch: 'Mechanical',
    registrationStatus: 'CONFIRMED',
    registrationType: 'WALK_IN',
    attendanceStatus: 'ATTENDED'
  },
  {
    fullName: 'Ananya Reddy',
    name: 'Ananya Reddy',
    email: 'ananya.reddy.dummy@test.com',
    phone: '9876543213',
    college: 'VIT Vellore',
    year: '1st Year',
    branch: 'Information Technology',
    registrationStatus: 'CONFIRMED',
    registrationType: 'ONLINE',
    attendanceStatus: 'ATTENDED'
  },
  {
    fullName: 'Vihaan Singh',
    name: 'Vihaan Singh',
    email: 'vihaan.singh.dummy@test.com',
    phone: '9876543214',
    college: 'Delhi Technological University',
    year: '3rd Year',
    branch: 'Computer Science',
    registrationStatus: 'CONFIRMED',
    registrationType: 'ONLINE',
    attendanceStatus: 'ATTENDED'
  },
  {
    fullName: 'Saanvi Iyer',
    name: 'Saanvi Iyer',
    email: 'saanvi.iyer.dummy@test.com',
    phone: '9876543215',
    college: 'Anna University',
    year: '2nd Year',
    branch: 'Civil Engineering',
    registrationStatus: 'CONFIRMED',
    registrationType: 'WALK_IN',
    attendanceStatus: 'ATTENDED'
  },
  {
    fullName: 'Aditya Mehta',
    name: 'Aditya Mehta',
    email: 'aditya.mehta.dummy@test.com',
    phone: '9876543216',
    college: 'Mumbai University',
    year: '4th Year',
    branch: 'Electrical Engineering',
    registrationStatus: 'CONFIRMED',
    registrationType: 'ONLINE',
    attendanceStatus: 'ATTENDED'
  },
  {
    fullName: 'Aadhya Nair',
    name: 'Aadhya Nair',
    email: 'aadhya.nair.dummy@test.com',
    phone: '9876543217',
    college: 'PES University',
    year: '1st Year',
    branch: 'Computer Science',
    registrationStatus: 'CONFIRMED',
    registrationType: 'ONLINE',
    attendanceStatus: 'ATTENDED'
  },
  {
    fullName: 'Arjun Gupta',
    name: 'Arjun Gupta',
    email: 'arjun.gupta.dummy@test.com',
    phone: '9876543218',
    college: 'College of Engineering Pune',
    year: '3rd Year',
    branch: 'Information Technology',
    registrationStatus: 'CONFIRMED',
    registrationType: 'WALK_IN',
    attendanceStatus: 'ATTENDED'
  },
  {
    fullName: 'Kiara Desai',
    name: 'Kiara Desai',
    email: 'kiara.desai.dummy@test.com',
    phone: '9876543219',
    college: 'Manipal Institute of Technology',
    year: '2nd Year',
    branch: 'Electronics and Communication',
    registrationStatus: 'CONFIRMED',
    registrationType: 'ONLINE',
    attendanceStatus: 'ATTENDED'
  }
];

async function addDummyParticipants() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a badminton event or any sports event
    let event = await Event.findOne({
      $or: [
        { title: { $regex: /badminton/i } },
        { title: { $regex: /sports/i } },
        { category: { $regex: /sports/i } }
      ]
    });

    if (!event) {
      // If no badminton event found, find the first available event
      event = await Event.findOne({ status: { $ne: 'cancelled' } }).sort({ createdAt: -1 });
      
      if (!event) {
        console.log('❌ No events found in database. Please create an event first.');
        return;
      }
    }

    console.log(`📌 Using event: "${event.title}" (ID: ${event._id})\n`);

    // Check if dummy participants already exist
    const existingDummies = await Participant.find({
      email: { $in: dummyParticipants.map(p => p.email) }
    });

    const existingEmails = new Set(existingDummies.map(p => p.email));
    const newParticipants = dummyParticipants.filter(p => !existingEmails.has(p.email));

    if (existingDummies.length > 0) {
      console.log('⚠️  Some dummy participants already exist (skipping):');
      existingDummies.forEach(p => console.log(`   - ${p.name} (${p.email})`));
      console.log('');
    }

    if (newParticipants.length === 0) {
      console.log('ℹ️  All participants already exist. No new participants to add.\n');
      return;
    }

    console.log(`📝 Adding ${newParticipants.length} new participant(s)...\n`);

    // Create participants
    const createdParticipants = [];
    
    for (const dummyData of newParticipants) {
      const participant = await Participant.create({
        ...dummyData,
        event: event._id
      });
      
      createdParticipants.push(participant);
      
      // Create attendance record
      await Attendance.create({
        event: event._id,
        participant: participant._id,
        scannedAt: new Date(),
        status: 'PRESENT'
      });
      
      // Add participant to event's participants array
      event.participants.push(participant._id);
      
      console.log(`✅ Created: ${participant.name} - ${participant.email}`);
    }

    await event.save();
    
    console.log(`\n🎉 Successfully added ${createdParticipants.length} dummy participants to event "${event.title}"`);
    console.log('\n📋 Participant Details:');
    console.log('─────────────────────────────────────────────────────────');
    createdParticipants.forEach((p, index) => {
      console.log(`${index + 1}. ${p.fullName}`);
      console.log(`   Email: ${p.email}`);
      console.log(`   College: ${p.college}`);
      console.log(`   Year: ${p.year} | Branch: ${p.branch}`);
      console.log(`   ID: ${p._id}`);
      console.log('');
    });
    
    console.log('💡 You can now test certificate generation with these participants!');
    console.log('💡 To remove these dummy participants later, run: node scripts/removeDummyParticipants.js\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

addDummyParticipants();
