import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import ParticipantAuth from './models/ParticipantAuth.js';

dotenv.config();

async function listAllParticipants() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const participants = await ParticipantAuth.find({});
    console.log(`Found ${participants.length} participants:\n`);

    for (const p of participants) {
      console.log('-----------------------------------');
      console.log('ID:', p._id);
      console.log('Name:', p.name);
      console.log('Email:', p.email);
      console.log('Active:', p.isActive);
      console.log('Suspended:', p.isSuspended);
      console.log('Password hash (first 20 chars):', p.password.substring(0, 20));
      
      // Test password
      const testPasswords = ['part123', '12345678', 'password'];
      for (const pwd of testPasswords) {
        const isMatch = await bcrypt.compare(pwd, p.password);
        if (isMatch) {
          console.log(`✅ Password is: ${pwd}`);
        }
      }
      console.log('');
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('✅ Database connection closed');
  }
}

listAllParticipants();
