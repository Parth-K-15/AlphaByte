import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

// Event Schema (inline to avoid import issues)
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: String,
    location: String,
    venue: String,
    address: String,
    startDate: Date,
    endDate: Date,
    time: String,
    category: String,
    type: { type: String, enum: ['Online', 'Offline', 'Hybrid'], default: 'Offline' },
    status: { type: String, enum: ['draft', 'upcoming', 'ongoing', 'completed', 'cancelled'], default: 'draft' },
    registrationFee: { type: Number, default: 0 },
    maxParticipants: Number,
    registrationDeadline: Date,
    website: String,
    bannerImage: String,
    tags: [String],
    rulebook: { type: String, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teamLead: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    teamMembers: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['TEAM_LEAD', 'TEAM_MEMBER'], default: 'TEAM_MEMBER' },
        permissions: {
          canViewParticipants: { type: Boolean, default: true },
          canManageAttendance: { type: Boolean, default: true },
          canSendEmails: { type: Boolean, default: false },
          canGenerateCertificates: { type: Boolean, default: false },
          canEditEvent: { type: Boolean, default: false },
        },
        addedAt: { type: Date, default: Date.now },
        startTime: { type: Date, default: null },
        endTime: { type: Date, default: null },
        status: { type: String, enum: ['active', 'completed', 'removed'], default: 'active' },
        removalReason: { type: String, default: '' },
        removedAt: { type: Date, default: null },
      },
    ],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
    enableCertificates: { type: Boolean, default: false },
    certificateTemplate: { type: String, enum: ['default', 'modern', 'classic'], default: 'default' },
    certificateSettings: {
      autoGenerate: { type: Boolean, default: false },
      autoSend: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

// ─── Event Lead ────────────────────────────────────────────────
const TEAM_LEAD_ID = '698e16ab0bd530aea42070af'; // Parth Kathane

// ─── Rulebook Content ──────────────────────────────────────────

const PROMPT_RELAY_RULEBOOK = `PROMPT-RELAY

Team Guidelines:
• Team size must be 3 members (mandatory).
• All participants must carry a valid Student ID Card.
• Intercollege teams are allowed.
• No individual may participate in multiple teams.
• Team composition is final after registration.
• Participants must maintain confidentiality regarding challenge images until competition concludes.
• Teams must designate roles: Player 1 (Observer), Player 2 (Interpreter), Player 3 (Finalizer) before the round begins.

ROUND 1 (Online): Prompt Upgrade Challenge
Overview: Enhance prompt engineering skills by decoding pirate-themed riddles and upgrading a weak prompt into a detailed, visually rich AI-ready prompt. Teams decode five riddles to reveal hidden keywords, integrate with sustainable development themes, and generate a meaningful image.

Content Provided:
• Weak Base Prompt related to SDGs provided to all teams
• Five complex pirate-themed riddles with hidden keywords
• Reference Guidelines on SDG integration and prompt engineering

Submission Requirements:
1. Enhanced Prompt — detailed, structured AI prompt with all five decoded riddle elements, SDG themes, cinematic language
2. Generated Image — AI-generated image from the final prompt reflecting all decoded elements

Evaluation (100 Points):
• Riddle Interpretation Accuracy — 20 pts
• Prompt Quality — 30 pts (Detail 6, Structure 6, Creativity 6, Clarity 6, Integration 6)
• Image Quality — 30 pts (Visual Richness 10, Relevance 10, Required Elements 5, Theme Clarity 5)
• Creativity & Storytelling — 20 pts

Rules:
• All prompts must be original work
• All five riddle elements must appear in prompt and image
• Prompts as plain text; images in PNG/JPG/WebP
• Top 10 teams qualify for Round 2

Timeline Round 1:
• Submission Start: 18 Mar 2026, 12:00 PM
• Submission End: 18 Mar 2026, 11:59 PM
• Results: 20 Mar 2026

ROUND 2 (Offline): Prompt Relay Challenge — 24 Mar 2026
Teams of three work sequentially to recreate a complex image using only prompts and verbal descriptions.
• Player 1 (Observer): Views image 3 min, writes prompt 4 min, verbal relay 3 min
• Player 2 (Interpreter): Listens, refines prompt 7 min, verbal relay 3 min
• Player 3 (Finalizer): Listens, final prompt 10 min, generates AI image

Evaluation (100 Points):
• Accuracy to Original Image — 75 pts (15 elements × 5 pts)
• Prompt Quality — 25 pts

Rules: Strict sequencing, verbal communication only, no pre-written prompts, no Pro AI tools, no cross-team collaboration.`;

const PIXEL_PERFECT_RULEBOOK = `PIXEL PERFECT — Photography Competition

Participation: Individual only | Mode: Online

Rules:
1. Two themes with two separate winners (one per theme)
2. Duration: 17 Mar 2026, 9:00 AM – 22 Mar 2026, 9:00 PM
3. Themes released 17 Mar at 9:00 AM
4. One submission per participant only
5. Must mention photo location
6. Photo must be taken within the time slot
7. NSFW/inappropriate content strictly prohibited
8. Basic editing (brightness, contrast, cropping) allowed; no photoshopping
9. If edited, submit: original with metadata + edited version
10. Files renamed with participant's name
11. Provide brief explanation/story behind the photograph
12. Submit via Google Form by 22 Mar 2026, 9:00 PM — no late submissions
13. Winners based on creativity, composition, uniqueness
14. Organizers may use submitted images for promotional purposes
15. Photos must not violate privacy or copyright laws`;

const HACK_MATRIX_RULEBOOK = `HACK MATRIX 4.0 — Hackathon

Team: 3-4 members | Valid Student ID required | Intercollege allowed

ROUND 01 (Online):
• Submit Proof of Concept (50%+ working prototype)
• Solution must be AI & ML compatible and scalable
• GitHub: Leader creates repo, members as collaborators, initially private
• No zip files, compilation outputs, or videos in repo
• All members must contribute; meaningful commits only

Timeline Round 1:
• Problem Statements: 17 Mar 2026, 11:00 AM
• Submission: 17 Mar 2:00 PM – 18 Mar 11:00 AM

Submissions: Video demo (max 6 min) + GitHub repo with README + Solution overview

Evaluation (100 pts): Innovativeness 10 | UI/UX 15 | Completion 10 | GitHub 20 | Tech Stack 15 | Documentation 10 | Presentation 10 | Social Impact 10

Top 4 teams per track advance to finals.

ROUND 02 (Offline):
• All members present • Working prototype required
• PPT per provided template • All work during hackathon
• Must integrate AI & ML

Timeline Round 2:
• 23 Mar: 9 AM Breakfast → 10 AM Kick-off → 1 PM Lunch → 2 PM Mentoring → 8 PM Dinner → 9 PM Overnight Coding
• 24 Mar: 9 AM Breakfast → 11 AM Final Evaluation

Evaluation: Innovativeness, Tech Stack, Presentation, UI/UX, AI & ML Integration
One winner per domain. Judges' decisions final.`;

const DATATHON_RULEBOOK = `DATATHON — Data Science Competition

Team: 1-2 members | Valid Student ID | Intercollege allowed
Max 3 submissions per team per day | No unauthorized dataset use

ROUND 1 (Online):
Develop ML models using Train.csv, submit predictions for Test.csv via Kaggle.
Evaluated by accuracy metrics with real-time leaderboard.

Data: Train.csv, Test.csv, SampleSubmission.csv

Timeline Round 1:
• Start: 15 Mar 2026, 6:00 PM
• End: 17 Mar 2026, 6:00 PM

Submit: Submission.csv + Code file (.py or .ipynb)
Ensure requirements.txt and README included.
Top 15 teams qualify for Round 2.

Rules: Reproducible code, original work, correct format, no result manipulation.

ROUND 02 (Offline — 23 Mar 2026):
On-site with dynamic datasets and surprise tasks.

Timeline:
• 9:00 AM: Reporting & ID Verification
• 9:30 AM: Final call (latecomers disqualified)
• 10:00 AM: Datathon begins with task & twist
• 4:45 PM: Submission deadline + Evaluation
• 5:00 PM: Datathon ends

Rules: All members present, no substitutions, code written on-site, bring laptop, restricted internet, no pre-built code, zero plagiarism tolerance. Judges' decisions final.`;

const AMONG_US_RULEBOOK = `AMONG US IN REAL LIFE

Individual participation only | 3 rounds | Bring pen and paper

Round 1 — Knowledge & Aptitude (23 Mar 2026, Offline):
• Tests knowledge, general awareness, aptitude, logical reasoning
• 1 mark per question
• Submission time noted for tiebreakers
• Top 16 proceed to Round 2

Round 2 — Surprise Round (23 Mar 2026, Offline):
• 16 players form 8 random teams of 2 (assigned by organizers)
• Teams compete in a surprise game
• Team that identifies all words first or has most correct guesses wins
• Tie-breaker for ties
• Top 4 teams (8 players) proceed to Round 3

Round 3 — Among Us Game (23 Mar 2026, Offline, 1 hour):
• 8 participants play individually
• Roles assigned randomly: Impostors & Sheriffs
• Impostors must eliminate all Sheriffs
• Sheriffs must vote out impostors or complete all tasks
• No damage to college property
• Winners awarded cash prizes and rewards

General: Fairness ensured strictly. Organizers may disqualify violators.`;

// ─── Events Data ───────────────────────────────────────────────

const events = [
  {
    title: 'Prompt Relay',
    description: 'A multi-round AI prompt engineering competition where teams decode pirate-themed riddles, upgrade weak prompts into cinematic AI-ready prompts, and relay visual descriptions to recreate complex images. Tests creativity, communication, and prompt craftsmanship.',
    location: 'PCCOE, Pune',
    venue: 'PCCOE Campus',
    address: 'Pimpri-Chinchwad College of Engineering, Pune',
    startDate: new Date('2026-03-18T06:30:00.000Z'),
    endDate: new Date('2026-03-24T18:30:00.000Z'),
    time: '12:00 PM - 6:00 PM',
    category: 'Competition',
    type: 'Hybrid',
    status: 'upcoming',
    registrationFee: 0,
    maxParticipants: 100,
    registrationDeadline: new Date('2026-03-17T18:30:00.000Z'),
    tags: ['AI', 'Prompt Engineering', 'SDG', 'Creativity', 'Teamwork'],
    rulebook: PROMPT_RELAY_RULEBOOK,
    teamLead: new mongoose.Types.ObjectId(TEAM_LEAD_ID),
    enableCertificates: true,
    certificateTemplate: 'modern',
  },
  {
    title: 'Pixel Perfect',
    description: 'An online photography competition with two themes and two winners. Capture stunning photographs within the event timeframe, showcasing creativity, composition, and uniqueness. Basic editing allowed — no heavy manipulation.',
    location: 'Online',
    venue: 'Online (Submission via Google Form)',
    startDate: new Date('2026-03-17T03:30:00.000Z'),
    endDate: new Date('2026-03-22T15:30:00.000Z'),
    time: '9:00 AM - 9:00 PM',
    category: 'Competition',
    type: 'Online',
    status: 'upcoming',
    registrationFee: 0,
    maxParticipants: 200,
    registrationDeadline: new Date('2026-03-22T15:30:00.000Z'),
    tags: ['Photography', 'Art', 'Creativity', 'Online'],
    rulebook: PIXEL_PERFECT_RULEBOOK,
    teamLead: new mongoose.Types.ObjectId(TEAM_LEAD_ID),
    enableCertificates: true,
    certificateTemplate: 'default',
  },
  {
    title: 'Hack Matrix 4.0',
    description: 'A two-round hackathon challenging teams of 3-4 to build innovative, AI/ML-powered solutions. Round 1 (Online): Submit a 50%+ working prototype with video demo. Round 2 (Offline): 24-hour on-site hackathon with mentoring, overnight coding, and final evaluation by experts.',
    location: 'PCCOE, Pune',
    venue: 'PCCOE Campus — Hackathon Hall',
    address: 'Pimpri-Chinchwad College of Engineering, Pune',
    startDate: new Date('2026-03-17T05:30:00.000Z'),
    endDate: new Date('2026-03-24T05:30:00.000Z'),
    time: '11:00 AM onwards',
    category: 'Hackathon',
    type: 'Hybrid',
    status: 'upcoming',
    registrationFee: 0,
    maxParticipants: 120,
    registrationDeadline: new Date('2026-03-16T18:30:00.000Z'),
    tags: ['Hackathon', 'AI', 'ML', 'Full Stack', 'Innovation'],
    rulebook: HACK_MATRIX_RULEBOOK,
    teamLead: new mongoose.Types.ObjectId(TEAM_LEAD_ID),
    enableCertificates: true,
    certificateTemplate: 'modern',
  },
  {
    title: 'Datathon',
    description: 'A data science competition where teams of 1-2 develop ML models on provided datasets and submit predictions via Kaggle. Round 1 is online with leaderboard ranking. Round 2 is an intense offline challenge with evolving tasks, surprise twists, and live coding under time pressure.',
    location: 'PCCOE, Pune',
    venue: 'PCCOE Campus — Data Lab',
    address: 'Pimpri-Chinchwad College of Engineering, Pune',
    startDate: new Date('2026-03-15T12:30:00.000Z'),
    endDate: new Date('2026-03-23T11:30:00.000Z'),
    time: '6:00 PM onwards',
    category: 'Competition',
    type: 'Hybrid',
    status: 'upcoming',
    registrationFee: 0,
    maxParticipants: 150,
    registrationDeadline: new Date('2026-03-15T12:30:00.000Z'),
    tags: ['Data Science', 'Machine Learning', 'Kaggle', 'Python', 'AI'],
    rulebook: DATATHON_RULEBOOK,
    teamLead: new mongoose.Types.ObjectId(TEAM_LEAD_ID),
    enableCertificates: true,
    certificateTemplate: 'default',
  },
  {
    title: 'Among Us in Real Life',
    description: 'A thrilling 3-round live event inspired by Among Us! Round 1 tests knowledge and aptitude. Round 2 is a surprise team challenge. Round 3 is the real-life Among Us game with assigned roles — Impostors vs Sheriffs — in a 1-hour campus-wide showdown. Cash prizes for winners!',
    location: 'PCCOE, Pune',
    venue: 'PCCOE Campus',
    address: 'Pimpri-Chinchwad College of Engineering, Pune',
    startDate: new Date('2026-03-23T03:30:00.000Z'),
    endDate: new Date('2026-03-23T12:30:00.000Z'),
    time: '9:00 AM - 6:00 PM',
    category: 'Competition',
    type: 'Offline',
    status: 'upcoming',
    registrationFee: 0,
    maxParticipants: 50,
    registrationDeadline: new Date('2026-03-22T18:30:00.000Z'),
    tags: ['Gaming', 'Fun', 'Strategy', 'Aptitude', 'Offline'],
    rulebook: AMONG_US_RULEBOOK,
    teamLead: new mongoose.Types.ObjectId(TEAM_LEAD_ID),
    enableCertificates: true,
    certificateTemplate: 'default',
  },
];

// ─── Seed Function ─────────────────────────────────────────────

const seedEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    for (const eventData of events) {
      const existing = await Event.findOne({ title: eventData.title });
      if (existing) {
        console.log(`⏭️  Event "${eventData.title}" already exists — updating...`);
        existing.description = eventData.description;
        existing.location = eventData.location;
        existing.venue = eventData.venue;
        existing.address = eventData.address;
        existing.startDate = eventData.startDate;
        existing.endDate = eventData.endDate;
        existing.time = eventData.time;
        existing.category = eventData.category;
        existing.type = eventData.type;
        existing.status = eventData.status;
        existing.registrationFee = eventData.registrationFee;
        existing.maxParticipants = eventData.maxParticipants;
        existing.registrationDeadline = eventData.registrationDeadline;
        existing.tags = eventData.tags;
        existing.rulebook = eventData.rulebook;
        existing.teamLead = eventData.teamLead;
        existing.enableCertificates = eventData.enableCertificates;
        existing.certificateTemplate = eventData.certificateTemplate;
        await existing.save();
        console.log(`   ✅ Updated: ${existing.title} (ID: ${existing._id})`);
      } else {
        const event = await Event.create(eventData);
        console.log(`   🆕 Created: ${event.title} (ID: ${event._id})`);
      }
    }

    console.log('\n🎉 All events seeded successfully!');
    console.log(`   Team Lead ID: ${TEAM_LEAD_ID} (Parth Kathane)`);
    console.log(`   Total events: ${events.length}`);

    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    process.exit(1);
  }
};

seedEvents();
