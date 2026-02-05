import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/AlphaByte';

async function listCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    console.log('\n📋 Collections in database:');
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // Find the participants collection
    const participantsCol = collections.find(c => 
      c.name === 'participants'
    );
    
    if (participantsCol) {
      console.log(`\n🎯 Found: ${participantsCol.name}`);
      
      const collection = db.collection(participantsCol.name);
      const indexes = await collection.indexes();
      
      console.log('\n📋 Indexes on', participantsCol.name);
      indexes.forEach(idx => {
        console.log(`  - ${idx.name}:`, idx.key, idx.unique ? '(UNIQUE)' : '');
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
}

listCollections();
