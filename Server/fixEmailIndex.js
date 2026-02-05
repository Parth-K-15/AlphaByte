import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AlphaByte';

async function fixEmailIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('participants');

    // Get existing indexes
    const indexes = await collection.indexes();
    console.log('\n📋 Current indexes:', indexes);

    // Drop the unique email index if it exists
    const emailIndex = indexes.find(idx => 
      idx.key.email === 1 && idx.unique === true && !idx.key.event
    );

    if (emailIndex) {
      console.log('\n🗑️  Dropping unique email index:', emailIndex.name);
      await collection.dropIndex(emailIndex.name);
      console.log('✅ Unique email index dropped');
    } else {
      console.log('\n⚠️  No unique email index found (might already be fixed)');
    }

    // Create compound unique index on email + event
    const compoundIndex = indexes.find(idx => 
      idx.key.email === 1 && idx.key.event === 1 && idx.unique === true
    );

    if (!compoundIndex) {
      console.log('\n📝 Creating compound unique index on (email, event)...');
      await collection.createIndex(
        { email: 1, event: 1 },
        { unique: true, name: 'email_event_unique' }
      );
      console.log('✅ Compound unique index created');
    } else {
      console.log('\n✅ Compound unique index already exists');
    }

    console.log('\n🎉 Database indexes fixed!');
    console.log('Now participants can register for multiple events with the same email.');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

fixEmailIndex();
