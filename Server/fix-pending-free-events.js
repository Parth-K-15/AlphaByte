import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Participant from './models/Participant.js';
import Event from './models/Event.js';

dotenv.config();

async function autoConfirmFreeEvents() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // Find all participants with PENDING status
    const pendingParticipants = await Participant.find({ 
      registrationStatus: 'PENDING' 
    }).populate('event');

    console.log(`📋 Found ${pendingParticipants.length} PENDING registrations\n`);

    let updated = 0;
    for (const participant of pendingParticipants) {
      if (participant.event && participant.event.registrationFee === 0) {
        // Update using findByIdAndUpdate to avoid validation issues with existing data
        await Participant.findByIdAndUpdate(
          participant._id,
          { registrationStatus: 'CONFIRMED' },
          { runValidators: false }
        );
        console.log(`✅ Auto-confirmed: ${participant.email} for ${participant.event.title || participant.event.name} (FREE event)`);
        updated++;
      }
    }

    console.log(`\n✅ Updated ${updated} free event registrations to CONFIRMED`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
}

autoConfirmFreeEvents();
