import mongoose from 'mongoose';
import EventRole from '../models/EventRole.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/alphabyte';

async function removeDuplicates() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Find all EventRoles grouped by email (case-insensitive), event, and role
    const allRoles = await EventRole.find({}).sort({ createdAt: 1 });
    
    const uniqueMap = new Map();
    const duplicatesToDelete = [];
    
    for (const role of allRoles) {
      const key = `${role.email.toLowerCase()}_${role.event}_${role.role}`;
      
      if (uniqueMap.has(key)) {
        // This is a duplicate - mark for deletion
        duplicatesToDelete.push(role._id);
        console.log(`Found duplicate: ${role.email} - ${role.role} - Event: ${role.event}`);
      } else {
        // This is the first occurrence - keep it
        uniqueMap.set(key, role._id);
      }
    }
    
    if (duplicatesToDelete.length > 0) {
      const result = await EventRole.deleteMany({ _id: { $in: duplicatesToDelete } });
      console.log(`\n✅ Removed ${result.deletedCount} duplicate EventRole records`);
    } else {
      console.log('\n✅ No duplicates found!');
    }
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

removeDuplicates();
