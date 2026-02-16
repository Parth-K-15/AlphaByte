import dotenv from 'dotenv';
dotenv.config();
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import ParticipantAuth from '../models/ParticipantAuth.js';

const BASE = 'http://localhost:5000/api/chatbot';

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to DB');

  const user = await ParticipantAuth.findOne();
  if (!user) { console.log('❌ No participant found'); process.exit(1); }
  console.log('✅ Participant:', user.name, '-', user.email);

  const secret = process.env.JWT_SECRET || 'alphabyte_jwt_secret_key_2026';
  const token = jwt.sign({ id: user._id, isParticipant: true }, secret, { expiresIn: '1h' });
  console.log('✅ JWT token created');

  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };

  // Test 1: GET /context
  console.log('\n--- Test 1: GET /context ---');
  const ctxRes = await fetch(`${BASE}/context`, { headers });
  const ctxData = await ctxRes.json();
  console.log('Status:', ctxRes.status);
  console.log('Events loaded:', ctxData.data?.eventsCount);
  console.log('User name:', ctxData.data?.participantName);

  // Test 2: GET /suggestions
  console.log('\n--- Test 2: GET /suggestions ---');
  const sugRes = await fetch(`${BASE}/suggestions`, { headers });
  const sugData = await sugRes.json();
  console.log('Status:', sugRes.status);
  console.log('Suggestions:', sugData.data?.suggestions?.slice(0, 3));

  // Test 3: POST /chat - general question
  console.log('\n--- Test 3: POST /chat (general) ---');
  const chatRes = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: 'What events are available?' })
  });
  const chatData = await chatRes.json();
  console.log('Status:', chatRes.status);
  console.log('Success:', chatData.success);
  if (chatData.data) {
    console.log('Response (first 400 chars):', chatData.data.response?.substring(0, 400));
    console.log('Sources:', chatData.data.sources?.map(s => s.section));
  } else {
    console.log('Error:', chatData.message);
  }

  // Test 4: POST /chat - personal question  
  console.log('\n--- Test 4: POST /chat (personal) ---');
  const personalRes = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: 'What events have I registered for?' })
  });
  const personalData = await personalRes.json();
  console.log('Status:', personalRes.status);
  console.log('Success:', personalData.success);
  if (personalData.data) {
    console.log('Response (first 400 chars):', personalData.data.response?.substring(0, 400));
    console.log('Sources:', personalData.data.sources?.map(s => s.section));
  } else {
    console.log('Error:', personalData.message);
  }

  // Test 5: POST /chat - rulebook question
  console.log('\n--- Test 5: POST /chat (rulebook) ---');
  const rbRes = await fetch(`${BASE}/chat`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: 'Tell me the rules of Among Us Championship' })
  });
  const rbData = await rbRes.json();
  console.log('Status:', rbRes.status);
  console.log('Success:', rbData.success);
  if (rbData.data) {
    console.log('Response (first 400 chars):', rbData.data.response?.substring(0, 400));
    console.log('Sources:', rbData.data.sources?.map(s => s.section));
  } else {
    console.log('Error:', rbData.message);
  }

  await mongoose.disconnect();
  console.log('\n✅ All tests complete');
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
