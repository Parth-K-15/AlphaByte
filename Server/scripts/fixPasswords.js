import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';

dotenv.config();

const fixPasswords = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    // Find all users with plain-text password '12345678'
    const usersCollection = mongoose.connection.collection('users');
    
    // Hash the password
    const hashedPassword = await bcrypt.hash('12345678', 10);
    
    // Update all users with plain-text password
    const result = await usersCollection.updateMany(
      { password: '12345678' },
      { $set: { password: hashedPassword } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} user(s) with hashed password`);
    
    // List affected users
    const users = await usersCollection.find({}).toArray();
    console.log('\n📋 All users in database:');
    users.forEach(u => {
      const isHashed = u.password.startsWith('$2');
      console.log(`  - ${u.email} (${u.role}) - Password ${isHashed ? '✅ hashed' : '❌ plain text'}`);
    });

    await mongoose.disconnect();
    console.log('\n✅ Done');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
};

fixPasswords();
