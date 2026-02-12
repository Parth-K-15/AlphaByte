import mongoose from 'mongoose';
import User from './models/User.js';
import ParticipantAuth from './models/ParticipantAuth.js';
import dotenv from 'dotenv';

dotenv.config();

async function checkAdminUsers() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check all users in User collection
    const users = await User.find({});
    console.log('=== Users in User collection ===');
    console.log('Total users:', users.length);
    users.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Role: ${user.role}`);
      console.log(`Active: ${user.isActive}`);
      console.log(`Suspended: ${user.isSuspended}`);
      console.log(`Password hash: ${user.password.substring(0, 20)}...`);
    });

    // Check participants
    const participants = await ParticipantAuth.find({});
    console.log('\n\n=== Users in ParticipantAuth collection ===');
    console.log('Total participants:', participants.length);
    participants.forEach(user => {
      console.log(`\nEmail: ${user.email}`);
      console.log(`Name: ${user.name}`);
      console.log(`Active: ${user.isActive}`);
      console.log(`Suspended: ${user.isSuspended}`);
      console.log(`Password hash: ${user.password.substring(0, 20)}...`);
    });

    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminUsers();
