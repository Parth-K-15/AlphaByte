import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import ParticipantAuth from './models/ParticipantAuth.js';

dotenv.config();

async function checkAndFixParticipant() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const email = 'participant@alphabyte.com';
    const password = 'part123';

    // Check if participant exists
    let participant = await ParticipantAuth.findOne({ email });

    if (!participant) {
      console.log('❌ Participant not found. Creating...');
      
      const hashedPassword = await bcrypt.hash(password, 10);
      participant = await ParticipantAuth.create({
        name: 'Test Participant',
        email: email,
        password: hashedPassword,
        phone: '1234567890',
        college: 'Test College',
        branch: 'CSE',
        year: '3rd Year',
        isActive: true,
        isSuspended: false
      });
      
      console.log('✅ Participant created successfully');
    } else {
      console.log('✅ Participant found');
      console.log('Name:', participant.name);
      console.log('Email:', participant.email);
      console.log('Active:', participant.isActive);
      console.log('Suspended:', participant.isSuspended);
      
      // Test password
      const isMatch = await bcrypt.compare(password, participant.password);
      console.log('\nPassword test (part123):', isMatch ? '✅ CORRECT' : '❌ WRONG');
      
      if (!isMatch) {
        console.log('\n🔧 Fixing password...');
        const hashedPassword = await bcrypt.hash(password, 10);
        participant.password = hashedPassword;
        await participant.save();
        console.log('✅ Password updated successfully');
      }
    }

    console.log('\n✅ Participant is ready to login with:');
    console.log('Email:', email);
    console.log('Password:', password);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

checkAndFixParticipant();
