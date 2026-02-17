/**
 * Test Script for Participation Reconciliation Intelligence Engine
 * 
 * This script tests the reconciliation functionality by creating
 * test data and verifying the reconciliation logic works correctly.
 * 
 * Usage: node scripts/test-reconciliation.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import ParticipationRecord from '../models/ParticipationRecord.js';
import Event from '../models/Event.js';
import User from '../models/User.js';
import ReconciliationEngine from '../utils/reconciliationEngine.js';

// Test data
const TEST_EMAIL = 'test-reconciliation@example.com';
let testEventId;
let testUserId;
let testParticipantId;

// Connect to database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error.message);
    process.exit(1);
  }
};

// Cleanup test data
const cleanup = async () => {
  console.log('🧹 Cleaning up test data...');
  
  if (testParticipantId) {
    await Participant.deleteOne({ _id: testParticipantId });
    await Attendance.deleteMany({ participant: testParticipantId });
    await Certificate.deleteMany({ participant: testParticipantId });
  }
  
  await ParticipationRecord.deleteMany({ email: TEST_EMAIL });
  
  console.log('✅ Cleaned up\n');
};

// Test 1: Registration Only
const testRegistrationOnly = async () => {
  console.log('📝 TEST 1: REGISTERED_ONLY Status');
  console.log('Creating participant without attendance or certificate...');
  
  const participant = await Participant.create({
    fullName: 'Test Student',
    name: 'Test',
    email: TEST_EMAIL,
    event: testEventId,
    registrationStatus: 'CONFIRMED',
    registrationType: 'ONLINE'
  });
  
  testParticipantId = participant._id;
  
  // Wait for auto-reconciliation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const record = await ParticipationRecord.findOne({ email: TEST_EMAIL, event: testEventId });
  
  console.log('Result:');
  console.log('  Canonical Status:', record.canonicalStatus);
  console.log('  Confidence Score:', record.reconciliation.confidenceScore);
  console.log('  Signals Count:', record.signals.length);
  console.log('  Has Conflicts:', record.flags.hasConflicts);
  
  if (record.canonicalStatus === 'REGISTERED_ONLY') {
    console.log('✅ TEST 1 PASSED\n');
    return true;
  } else {
    console.log('❌ TEST 1 FAILED: Expected REGISTERED_ONLY, got', record.canonicalStatus, '\n');
    return false;
  }
};

// Test 2: Attended but No Certificate
const testAttendedNoCertificate = async () => {
  console.log('📝 TEST 2: ATTENDED_NO_CERTIFICATE Status');
  console.log('Marking attendance without certificate...');
  
  const attendance = await Attendance.create({
    event: testEventId,
    participant: testParticipantId,
    status: 'PRESENT'
  });
  
  // Wait for auto-reconciliation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const record = await ParticipationRecord.findOne({ email: TEST_EMAIL, event: testEventId });
  
  console.log('Result:');
  console.log('  Canonical Status:', record.canonicalStatus);
  console.log('  Confidence Score:', record.reconciliation.confidenceScore);
  console.log('  Signals Count:', record.signals.length);
  console.log('  Status Breakdown:', record.statusBreakdown);
  
  if (record.canonicalStatus === 'ATTENDED_NO_CERTIFICATE') {
    console.log('✅ TEST 2 PASSED\n');
    return true;
  } else {
    console.log('❌ TEST 2 FAILED: Expected ATTENDED_NO_CERTIFICATE, got', record.canonicalStatus, '\n');
    return false;
  }
};

// Test 3: Fully Certified
const testCertified = async () => {
  console.log('📝 TEST 3: CERTIFIED Status');
  console.log('Issuing certificate...');
  
  const certificate = await Certificate.create({
    event: testEventId,
    participant: testParticipantId,
    certificateId: `TEST-CERT-${Date.now()}`,
    issuedBy: testUserId,
    status: 'GENERATED'
  });
  
  // Wait for auto-reconciliation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const record = await ParticipationRecord.findOne({ email: TEST_EMAIL, event: testEventId });
  
  console.log('Result:');
  console.log('  Canonical Status:', record.canonicalStatus);
  console.log('  Confidence Score:', record.reconciliation.confidenceScore);
  console.log('  Signals Count:', record.signals.length);
  console.log('  Is Verified:', record.flags.isVerified);
  console.log('  Status Breakdown:', record.statusBreakdown);
  
  if (record.canonicalStatus === 'CERTIFIED') {
    console.log('✅ TEST 3 PASSED\n');
    return true;
  } else {
    console.log('❌ TEST 3 FAILED: Expected CERTIFIED, got', record.canonicalStatus, '\n');
    return false;
  }
};

// Test 4: Conflict Detection - Certificate Without Attendance
const testConflictDetection = async () => {
  console.log('📝 TEST 4: Conflict Detection (Certificate Without Attendance)');
  console.log('Creating scenario: certificate issued but no attendance...');
  
  // Cleanup previous test data
  await cleanup();
  
  // Create participant
  const participant = await Participant.create({
    fullName: 'Test Student 2',
    name: 'Test',
    email: TEST_EMAIL,
    event: testEventId,
    registrationStatus: 'CONFIRMED',
    attendanceStatus: 'ABSENT' // Explicitly absent
  });
  
  testParticipantId = participant._id;
  
  // Issue certificate WITHOUT attendance
  const certificate = await Certificate.create({
    event: testEventId,
    participant: testParticipantId,
    certificateId: `TEST-CERT-CONFLICT-${Date.now()}`,
    issuedBy: testUserId,
    status: 'GENERATED'
  });
  
  // Wait for auto-reconciliation
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const record = await ParticipationRecord.findOne({ email: TEST_EMAIL, event: testEventId });
  
  console.log('Result:');
  console.log('  Canonical Status:', record.canonicalStatus);
  console.log('  Has Conflicts:', record.flags.hasConflicts);
  console.log('  Conflicts:', record.reconciliation.conflicts);
  console.log('  Is Suspicious:', record.flags.isSuspicious);
  console.log('  Requires Manual Review:', record.flags.requiresManualReview);
  
  if (record.flags.hasConflicts && record.flags.isSuspicious && record.canonicalStatus === 'INVALIDATED') {
    console.log('✅ TEST 4 PASSED\n');
    return true;
  } else {
    console.log('❌ TEST 4 FAILED: Conflict not properly detected\n');
    return false;
  }
};

// Test 5: Manual Override
const testManualOverride = async () => {
  console.log('📝 TEST 5: Manual Override');
  console.log('Overriding status manually...');
  
  const result = await ReconciliationEngine.manualOverride(
    TEST_EMAIL,
    testEventId,
    'CERTIFIED',
    testUserId,
    'Attendance was recorded offline, certificate is valid'
  );
  
  console.log('Result:');
  console.log('  Success:', result.success);
  console.log('  New Status:', result.record.canonicalStatus);
  console.log('  Override Info:', result.record.manualOverride);
  
  if (result.success && result.record.canonicalStatus === 'CERTIFIED') {
    console.log('✅ TEST 5 PASSED\n');
    return true;
  } else {
    console.log('❌ TEST 5 FAILED\n');
    return false;
  }
};

// Test 6: Event-Wide Reconciliation
const testEventReconciliation = async () => {
  console.log('📝 TEST 6: Event-Wide Reconciliation');
  console.log('Reconciling entire event...');
  
  const result = await ReconciliationEngine.reconcileEvent(testEventId);
  
  console.log('Result:');
  console.log('  Success:', result.success);
  console.log('  Total Participants:', result.results?.total);
  console.log('  Reconciled:', result.results?.reconciled);
  console.log('  Conflicts:', result.results?.conflicts);
  console.log('  Requires Review:', result.results?.requiresReview);
  
  if (result.success) {
    console.log('✅ TEST 6 PASSED\n');
    return true;
  } else {
    console.log('❌ TEST 6 FAILED\n');
    return false;
  }
};

// Test 7: Statistics
const testStatistics = async () => {
  console.log('📝 TEST 7: Event Statistics');
  
  const stats = await ParticipationRecord.getEventStats(testEventId);
  
  console.log('Result:');
  console.log('  Stats:', stats);
  
  if (stats.total > 0) {
    console.log('✅ TEST 7 PASSED\n');
    return true;
  } else {
    console.log('❌ TEST 7 FAILED\n');
    return false;
  }
};

// Main test runner
const runTests = async () => {
  console.log('\n🧪 PARTICIPATION RECONCILIATION ENGINE - TEST SUITE\n');
  console.log('='.repeat(60));
  console.log('\n');
  
  await connectDB();
  
  try {
    // Setup: Find or create test event and user
    console.log('⚙️  Setting up test environment...');
    
    let testEvent = await Event.findOne({});
    if (!testEvent) {
      console.log('⚠️  No events found. Please create an event first.');
      process.exit(1);
    }
    testEventId = testEvent._id;
    console.log('  Using event:', testEvent.name);
    
    let testUser = await User.findOne({ role: 'ADMIN' });
    if (!testUser) {
      testUser = await User.findOne({});
    }
    if (!testUser) {
      console.log('⚠️  No users found. Please create a user first.');
      process.exit(1);
    }
    testUserId = testUser._id;
    console.log('  Using user:', testUser.name);
    console.log('✅ Setup complete\n');
    
    // Run tests
    const results = [];
    
    results.push(await testRegistrationOnly());
    results.push(await testAttendedNoCertificate());
    results.push(await testCertified());
    results.push(await testConflictDetection());
    results.push(await testManualOverride());
    results.push(await testEventReconciliation());
    results.push(await testStatistics());
    
    // Cleanup
    await cleanup();
    
    // Summary
    console.log('='.repeat(60));
    console.log('\n📊 TEST SUMMARY\n');
    const passed = results.filter(r => r).length;
    const failed = results.filter(r => !r).length;
    console.log(`  Passed: ${passed}`);
    console.log(`  Failed: ${failed}`);
    console.log(`  Total:  ${results.length}`);
    
    if (failed === 0) {
      console.log('\n✅ ALL TESTS PASSED! 🎉\n');
    } else {
      console.log('\n❌ SOME TESTS FAILED\n');
    }
    
  } catch (error) {
    console.error('\n❌ TEST ERROR:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from database\n');
    process.exit(0);
  }
};

// Run tests
runTests().catch(console.error);
