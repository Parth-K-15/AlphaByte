import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const migrateParticipants = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const usersCollection = mongoose.connection.collection('users');
    const participantAuthCollection = mongoose.connection.collection('participantauth');

    // Find all users with PARTICIPANT role
    const participants = await usersCollection.find({ role: 'PARTICIPANT' }).toArray();
    console.log(`Found ${participants.length} participant(s) to migrate`);

    if (participants.length > 0) {
      // Insert participants into the new participantauth collection
      for (const participant of participants) {
        // Check if already exists in participantauth
        const exists = await participantAuthCollection.findOne({ email: participant.email });
        if (!exists) {
          await participantAuthCollection.insertOne({
            ...participant,
            migratedFrom: 'users',
            migratedAt: new Date()
          });
          console.log(`  ✅ Migrated: ${participant.email}`);
        } else {
          console.log(`  ⏭️ Skipped (already exists): ${participant.email}`);
        }
      }

      // Remove participants from users collection
      const deleteResult = await usersCollection.deleteMany({ role: 'PARTICIPANT' });
      console.log(`\n✅ Removed ${deleteResult.deletedCount} participant(s) from users collection`);
    }

    // Show remaining users
    const remainingUsers = await usersCollection.find({}).toArray();
    console.log('\n📋 Users collection now contains:');
    remainingUsers.forEach(u => {
      console.log(`  - ${u.email} (${u.role})`);
    });

    // Show participant auth collection
    const participantAuths = await participantAuthCollection.find({}).toArray();
    console.log('\n📋 ParticipantAuth collection contains:');
    participantAuths.forEach(p => {
      console.log(`  - ${p.email}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Migration complete');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

migrateParticipants();
