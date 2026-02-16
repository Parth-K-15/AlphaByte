import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

import SpeakerAuth from '../models/SpeakerAuth.js';
import Event from '../models/Event.js';
import { getRecommendedSpeakers } from '../utils/speakerRecommendation.js';

async function test() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected\n');

    // Find an event to test with
    const events = await Event.find({ status: { $in: ['upcoming', 'ongoing'] } })
      .select('title category tags type')
      .limit(5);

    if (events.length === 0) {
      console.log('❌ No events found. Seed events first.');
      process.exit(1);
    }

    console.log('📋 Available Events:');
    events.forEach((e, i) => {
      console.log(`  ${i + 1}. ${e.title} [${e.category || 'No category'}] tags: [${(e.tags || []).join(', ')}]`);
    });

    // Test recommendations for each event
    for (const event of events) {
      console.log(`\n${'═'.repeat(60)}`);
      console.log(`🎯 Recommendations for: ${event.title}`);
      console.log(`   Category: ${event.category || 'None'} | Tags: ${(event.tags || []).join(', ')}`);
      console.log('═'.repeat(60));

      const recs = await getRecommendedSpeakers(event._id.toString(), { limit: 5 });

      if (recs.length === 0) {
        console.log('   No recommendations found.');
      } else {
        recs.forEach((r) => {
          console.log(`   #${r.rank} ${r.speaker.name} — ${r.matchScore}% match`);
          console.log(`      Specializations: [${r.speaker.specializations.join(', ')}]`);
          console.log(`      Rating: ${r.avgRating || 'N/A'} (${r.totalReviews} reviews) | Sessions: ${r.completedSessions}/${r.totalSessions}`);
          const bd = r.breakdown;
          console.log(`      Breakdown: Spec=${bd.specializationMatch.score}/${bd.specializationMatch.max} | Past=${bd.pastRecordRelevance.score}/${bd.pastRecordRelevance.max} | Rating=${bd.rating.score}/${bd.rating.max} | Exp=${bd.sessionExperience.score}/${bd.sessionExperience.max} | Rel=${bd.reliability.score}/${bd.reliability.max} | Rec=${bd.recency.score}/${bd.recency.max} | Bio=${bd.bioKeywordMatch.score}/${bd.bioKeywordMatch.max}`);
        });
      }
    }

    console.log('\n✅ Test complete!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

test();
