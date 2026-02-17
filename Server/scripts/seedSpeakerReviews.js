import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import SpeakerAuth from '../models/SpeakerAuth.js';
import SpeakerReview from '../models/SpeakerReview.js';
import User from '../models/User.js';
import Event from '../models/Event.js';

// Review text templates by rating range
const reviewTexts = {
  high: [
    'Excellent speaker! Very knowledgeable and engaging presentation.',
    'Outstanding session. The audience was captivated throughout.',
    'Brilliant delivery and deep expertise. Highly recommend.',
    'One of the best speakers we have had. Very professional.',
    'Amazing content and great interaction with the audience.',
    'Superb technical depth and communication skills.',
    'Fantastic session, students loved every minute of it.',
  ],
  mid: [
    'Good speaker with solid knowledge of the subject.',
    'Decent session overall. Content was relevant and useful.',
    'Well prepared and communicated key concepts clearly.',
    'Satisfactory session. Could improve audience engagement.',
    'Good content delivery but pacing could be better.',
    'Knowledgeable speaker, the Q&A session was helpful.',
  ],
  low: [
    'Average session. Content was surface-level.',
    'Session was okay but lacked depth in certain areas.',
    'Needs improvement in engagement and delivery style.',
    'Content was relevant but presentation could be more polished.',
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getReviewText(rating) {
  if (rating >= 4) return pickRandom(reviewTexts.high);
  if (rating >= 3) return pickRandom(reviewTexts.mid);
  return pickRandom(reviewTexts.low);
}

// Generate a weighted random rating (skewed toward 3-5 for realism)
function randomRating() {
  const weights = [
    { rating: 5, weight: 30 },
    { rating: 4, weight: 35 },
    { rating: 3, weight: 20 },
    { rating: 2, weight: 10 },
    { rating: 1, weight: 5 },
  ];
  const total = weights.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const w of weights) {
    r -= w.weight;
    if (r <= 0) return w.rating;
  }
  return 4;
}

async function seedReviews() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    const speakers = await SpeakerAuth.find({ isActive: true }).select('_id name');
    const organizers = await User.find({ isActive: true }).select('_id name');
    const events = await Event.find({}).select('_id title');

    if (organizers.length === 0) {
      console.log('❌ No organizer users found. Need at least one User in DB.');
      process.exit(1);
    }
    if (events.length === 0) {
      console.log('❌ No events found. Need at least one Event in DB.');
      process.exit(1);
    }

    console.log(`📋 Found ${speakers.length} speakers, ${organizers.length} organizers, ${events.length} events\n`);

    let created = 0;
    let skipped = 0;

    for (const speaker of speakers) {
      // Each speaker gets 2-5 random reviews from different organizers
      const reviewCount = 2 + Math.floor(Math.random() * 4); // 2 to 5

      for (let i = 0; i < reviewCount; i++) {
        const organizer = organizers[i % organizers.length]; // cycle through organizers
        const event = events[Math.floor(Math.random() * events.length)];
        const rating = randomRating();

        // Use unique fake session IDs to avoid the unique index conflict
        // (organizer + session must be unique)
        const fakeSessionId = new mongoose.Types.ObjectId();

        try {
          await SpeakerReview.create({
            speaker: speaker._id,
            organizer: organizer._id,
            event: event._id,
            session: fakeSessionId,
            rating,
            review: getReviewText(rating),
          });
          created++;
        } catch (err) {
          if (err.code === 11000) {
            skipped++; // duplicate, skip
          } else {
            console.error(`  Error for ${speaker.name}:`, err.message);
          }
        }
      }

      // Compute avg for display
      const reviews = await SpeakerReview.find({ speaker: speaker._id });
      const avg = reviews.length > 0
        ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
        : 'N/A';
      console.log(`✅ ${speaker.name} — ${reviews.length} reviews, avg rating: ${avg}`);
    }

    console.log('\n──────────────────────────────────────────');
    console.log(`📊 Summary: ${created} reviews created, ${skipped} skipped (duplicates)`);
    console.log(`📋 Total reviews in DB: ${await SpeakerReview.countDocuments()}`);
    console.log('──────────────────────────────────────────\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

seedReviews();
