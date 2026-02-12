import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Certificate from './models/Certificate.js';

dotenv.config();

async function cleanupOldCertificates() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');

    // Delete all certificates (they will be regenerated as JPG)
    const result = await Certificate.deleteMany({});
    console.log(`🗑️ Deleted ${result.deletedCount} old certificate records`);
    console.log('✅ Ready to regenerate certificates as JPG format');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Connection closed');
  }
}

cleanupOldCertificates();
