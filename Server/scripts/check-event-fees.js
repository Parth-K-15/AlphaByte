import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './models/Event.js';

dotenv.config();

async function checkEventFees() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    const events = await Event.find({
      title: { $in: ['Hackmatrix 4.0', 'Future of Web Development', 'Houdini Heist'] }
    });

    console.log('📋 Event Details:\n');
    events.forEach(e => {
      console.log(`Event: ${e.title || e.name}`);
      console.log(`  Registration Fee: ₹${e.registrationFee || 0}`);
      console.log(`  Status: ${e.status}`);
      console.log(`  Type: ${e.registrationFee === 0 ? 'FREE' : 'PAID'}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
  }
}

checkEventFees();
