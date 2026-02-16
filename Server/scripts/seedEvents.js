import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

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
      },
    ],
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Participant' }],
  },
  { timestamps: true }
);

const Event = mongoose.model('Event', eventSchema);

const amongUsRulebook = `AMONG US TOURNAMENT - OFFICIAL RULEBOOK

1. GENERAL RULES
   1.1 All participants must register before the tournament deadline.
   1.2 Each team must have a minimum of 5 and a maximum of 10 players.
   1.3 Players must use their registered in-game names during all matches.
   1.4 Any form of cheating, hacking, or exploiting bugs will result in immediate disqualification.
   1.5 All participants must join the official Discord server for communication and match scheduling.
   1.6 Tournament organizers' decisions are final and binding.

2. MATCH FORMAT
   2.1 Each match will be played with 10 players (2 Impostors, 8 Crewmates).
   2.2 The map for each round will be announced 10 minutes before the match.
   2.3 Available maps: The Skeld, Polus, Mira HQ, and The Airship.
   2.4 Match settings will be standardized and shared before each round.
   2.5 Each round will have a discussion time of 30 seconds and voting time of 120 seconds.
   2.6 Player speed: 1.25x | Crewmate vision: 0.75x | Impostor vision: 1.5x.
   2.7 Kill cooldown: 25 seconds | Kill distance: Medium.
   2.8 Visual tasks: OFF | Task bar updates: Meetings.
   2.9 Number of emergency meetings: 1 per player.
   2.10 Confirm ejects: OFF.

3. SCORING SYSTEM
   3.1 Crewmates earn 10 points for completing all tasks.
   3.2 Crewmates earn 15 points for voting out an Impostor.
   3.3 Crewmates earn 20 points for winning the round (tasks completed or all Impostors ejected).
   3.4 Impostors earn 15 points per kill.
   3.5 Impostors earn 25 points for winning the round (sabotage or kills).
   3.6 Bonus 5 points for surviving until the end of the round as a Crewmate.
   3.7 Individual scores are accumulated across all rounds.
   3.8 Team ranking is based on cumulative individual scores.

4. CODE OF CONDUCT
   4.1 No teaming or sharing information outside the game (ghosting).
   4.2 Dead players must NOT communicate with alive players through any external channel.
   4.3 Screen sharing or stream sniping is strictly prohibited.
   4.4 Players must not leave the game intentionally; doing so may result in a penalty.
   4.5 Respect all players and organizers. Toxic behavior, slurs, or harassment will lead to a ban.
   4.6 Camera/security camping for extended periods may be flagged by referees.

5. DISPUTE RESOLUTION
   5.1 Any disputes must be reported to the tournament referee within 5 minutes of the match ending.
   5.2 Screenshot or video evidence is required for all disputes.
   5.3 The referee panel will review and give a decision within 30 minutes.
   5.4 In case of a tie, a tiebreaker round will be played.
   5.5 The organizing committee reserves the right to modify rules if necessary.

6. PRIZES & CERTIFICATES
   6.1 Top 3 teams will receive prizes as announced before the tournament.
   6.2 All participants will receive participation certificates.
   6.3 Winners will receive winner certificates and trophies.
   6.4 Certificates will be distributed within 7-10 working days after the event.
   6.5 Prize money (if applicable) will be transferred within 15 working days.

7. TECHNICAL REQUIREMENTS
   7.1 All players must have a stable internet connection (minimum 5 Mbps).
   7.2 Players must have the latest version of Among Us installed.
   7.3 A working microphone is mandatory for voice chat during discussions.
   7.4 Players must be available on Discord for the entire duration of scheduled matches.
   7.5 In case of disconnection, the player has 2 minutes to rejoin. Otherwise, the match continues.`;

const events = [
  {
    title: 'Among Us Championship 2026',
    description: 'The ultimate Among Us tournament! Form your crew, strategize, and find the impostors. Compete in multiple rounds across different maps with standardized competitive settings. Top teams win exciting prizes and all participants receive certificates.',
    location: 'Online',
    venue: 'Discord + Among Us',
    address: 'Online Event',
    startDate: new Date('2026-03-15T10:00:00'),
    endDate: new Date('2026-03-16T18:00:00'),
    time: '10:00 AM - 6:00 PM',
    category: 'Competition',
    type: 'Online',
    status: 'upcoming',
    registrationFee: 0,
    maxParticipants: 100,
    registrationDeadline: new Date('2026-03-10T23:59:00'),
    tags: ['gaming', 'among-us', 'tournament', 'esports', 'online'],
    rulebook: amongUsRulebook,
    teamMembers: [],
    participants: [],
  },
  {
    title: 'Full Stack Web Development Bootcamp',
    description: 'An intensive 2-day bootcamp covering React, Node.js, Express, and MongoDB. Build a complete project from scratch with hands-on guidance from industry mentors. Ideal for students who want to strengthen their full-stack development skills.',
    location: 'Seminar Hall A, Main Building',
    venue: 'Seminar Hall A',
    address: 'Main Building, Ground Floor',
    startDate: new Date('2026-03-20T09:00:00'),
    endDate: new Date('2026-03-21T17:00:00'),
    time: '9:00 AM - 5:00 PM',
    category: 'Workshop',
    type: 'Offline',
    status: 'upcoming',
    registrationFee: 200,
    maxParticipants: 60,
    registrationDeadline: new Date('2026-03-18T23:59:00'),
    tags: ['web-development', 'react', 'nodejs', 'mongodb', 'fullstack'],
    rulebook: `FULL STACK WEB DEVELOPMENT BOOTCAMP - RULES & GUIDELINES

1. REGISTRATION & ELIGIBILITY
   1.1 Open to all students from any branch and year.
   1.2 Registration fee of ₹200 must be paid before the deadline.
   1.3 Limited to 60 participants on a first-come-first-served basis.
   1.4 Participants must carry their college ID on both days.

2. ATTENDANCE POLICY
   2.1 Minimum 80% attendance is required for certificate eligibility.
   2.2 Attendance will be recorded via QR code scanning at the start of each session.
   2.3 Late arrivals (more than 15 minutes) will be marked as half-attendance.
   2.4 Leaving early without prior permission counts as absent for that session.

3. TECHNICAL REQUIREMENTS
   3.1 Bring your own laptop with a working charger.
   3.2 Pre-install Node.js (v18+), VS Code, Git, and MongoDB Compass.
   3.3 A stable internet connection (personal hotspot as backup).
   3.4 Create accounts on GitHub, MongoDB Atlas, and Vercel beforehand.

4. CODE OF CONDUCT
   4.1 Maintain discipline and silence during instructor sessions.
   4.2 No plagiarism — code written must be your own work during exercises.
   4.3 Respect fellow participants and mentors.
   4.4 Mobile phones must be on silent mode during sessions.
   4.5 Food and beverages are not allowed inside the lab.

5. PROJECT SUBMISSION
   5.1 Each participant must submit a final project by end of Day 2.
   5.2 Project must be pushed to a public GitHub repository.
   5.3 Deployed link on Vercel must be submitted via the event portal.
   5.4 Top 3 projects will receive special recognition.

6. CERTIFICATES
   6.1 Participation certificates for all eligible attendees.
   6.2 Excellence certificates for top 3 project submissions.
   6.3 Certificates issued within 7 working days via email.`,
    teamMembers: [],
    participants: [],
  },
  {
    title: 'AI & Machine Learning Seminar',
    description: 'Join us for an insightful seminar on the latest advancements in AI and Machine Learning. Industry experts will cover topics including neural networks, NLP, computer vision, and real-world AI applications. Q&A session included.',
    location: 'Auditorium, Block C',
    venue: 'College Auditorium',
    address: 'Block C, 1st Floor',
    startDate: new Date('2026-04-05T10:00:00'),
    endDate: new Date('2026-04-05T16:00:00'),
    time: '10:00 AM - 4:00 PM',
    category: 'Seminar',
    type: 'Hybrid',
    status: 'upcoming',
    registrationFee: 0,
    maxParticipants: 200,
    registrationDeadline: new Date('2026-04-03T23:59:00'),
    tags: ['ai', 'machine-learning', 'deep-learning', 'nlp', 'seminar'],
    rulebook: `AI & MACHINE LEARNING SEMINAR - RULES & GUIDELINES

1. REGISTRATION
   1.1 Free registration — open to all students and faculty.
   1.2 Online participants must register separately for the virtual link.
   1.3 Registration closes 2 days before the event.
   1.4 Confirmation email with joining details will be sent 24 hours before the event.

2. ATTENDANCE
   2.1 Offline participants must scan QR code at entry for attendance.
   2.2 Online participants must keep their cameras ON during the session for attendance verification.
   2.3 Minimum 70% session attendance required for certificate.
   2.4 Q&A participation earns bonus engagement points.

3. GUIDELINES FOR PARTICIPANTS
   3.1 Arrive at least 15 minutes before the session starts.
   3.2 Questions should be asked during the designated Q&A slot.
   3.3 Recording of sessions is not permitted without prior approval.
   3.4 Maintain decorum — mute microphones when not speaking (online).
   3.5 Respect speakers and fellow attendees.

4. CERTIFICATES
   4.1 Attendance-based participation certificates will be issued.
   4.2 Certificates will be sent via email within 5-7 working days.
   4.3 Queries regarding certificates can be raised within 15 days of the event.`,
    teamMembers: [],
    participants: [],
  },
  {
    title: 'Code Sprint Hackathon 2026',
    description: 'A 24-hour coding hackathon where teams of 3-4 members build innovative solutions to real-world problem statements. Mentors from top tech companies will guide you. Amazing prizes worth ₹50,000 for the top teams!',
    location: 'Innovation Lab, IT Building',
    venue: 'Innovation Lab',
    address: 'IT Building, 2nd Floor',
    startDate: new Date('2026-04-12T09:00:00'),
    endDate: new Date('2026-04-13T09:00:00'),
    time: '9:00 AM (Day 1) - 9:00 AM (Day 2)',
    category: 'Hackathon',
    type: 'Offline',
    status: 'upcoming',
    registrationFee: 150,
    maxParticipants: 120,
    registrationDeadline: new Date('2026-04-08T23:59:00'),
    tags: ['hackathon', 'coding', 'innovation', 'teamwork', 'prizes'],
    rulebook: `CODE SPRINT HACKATHON 2026 - OFFICIAL RULEBOOK

1. TEAM FORMATION
   1.1 Each team must have 3-4 members.
   1.2 Cross-college teams are allowed.
   1.3 One member must be designated as the Team Leader.
   1.4 Team leader is responsible for all submissions and communications.
   1.5 Individual participation is NOT allowed.

2. PROBLEM STATEMENTS
   2.1 Problem statements will be released at the start of the hackathon (9:00 AM, Day 1).
   2.2 Teams must choose one problem statement from the given list.
   2.3 No switching of problem statements after the first 2 hours.
   2.4 Problem domains: HealthTech, EdTech, FinTech, Sustainability.

3. DEVELOPMENT RULES
   3.1 All code must be written during the hackathon. Pre-written code is NOT allowed.
   3.2 Use of open-source libraries and frameworks is permitted.
   3.3 Teams must use Git for version control — GitHub repo required.
   3.4 AI code generation tools (Copilot, ChatGPT) are allowed but must be disclosed.
   3.5 No use of previously built or published projects.
   3.6 All team members must contribute to the codebase.

4. SUBMISSION & JUDGING
   4.1 Final submission deadline: 8:00 AM, Day 2 (1 hour before closing).
   4.2 Submit: GitHub repo link, deployed app link, and a 2-minute demo video.
   4.3 Judging criteria:
       - Innovation & Creativity: 30%
       - Technical Complexity: 25%
       - UI/UX Design: 20%
       - Functionality & Completeness: 15%
       - Presentation & Demo: 10%
   4.4 Top 10 teams will present to the judges in person.
   4.5 Judges' decision is final and cannot be contested.

5. CODE OF CONDUCT
   5.1 Maintain a respectful environment — no harassment or discrimination.
   5.2 Teams must stay within the venue for the full 24 hours.
   5.3 Overnight stay arrangements will be provided by the organizers.
   5.4 Food and refreshments will be provided at scheduled intervals.
   5.5 Damaging lab equipment or property will result in disqualification and fine.

6. PRIZES
   6.1 1st Place: ₹25,000 + Trophies + Certificates
   6.2 2nd Place: ₹15,000 + Trophies + Certificates
   6.3 3rd Place: ₹10,000 + Trophies + Certificates
   6.4 Best UI/UX Award: Special recognition + Certificate
   6.5 All participants receive participation certificates.`,
    teamMembers: [],
    participants: [],
  },
  {
    title: 'Cybersecurity Awareness Workshop',
    description: 'Learn about ethical hacking, penetration testing, network security, and how to protect yourself from cyber threats. Hands-on lab sessions on Kali Linux and Wireshark included. Suitable for beginners and intermediate learners.',
    location: 'Computer Lab 3, IT Building',
    venue: 'Computer Lab 3',
    address: 'IT Building, 3rd Floor',
    startDate: new Date('2026-04-20T10:00:00'),
    endDate: new Date('2026-04-20T17:00:00'),
    time: '10:00 AM - 5:00 PM',
    category: 'Workshop',
    type: 'Offline',
    status: 'upcoming',
    registrationFee: 100,
    maxParticipants: 40,
    registrationDeadline: new Date('2026-04-17T23:59:00'),
    tags: ['cybersecurity', 'ethical-hacking', 'workshop', 'networking', 'security'],
    rulebook: `CYBERSECURITY AWARENESS WORKSHOP - RULES & GUIDELINES

1. ELIGIBILITY & REGISTRATION
   1.1 Open to all students with basic computer knowledge.
   1.2 Registration fee: ₹100 (non-refundable).
   1.3 Limited to 40 seats — register early to confirm your spot.
   1.4 No prior cybersecurity experience required.

2. WHAT TO BRING
   2.1 Your own laptop with minimum 8GB RAM.
   2.2 Pre-install VirtualBox and Kali Linux VM (instructions will be emailed).
   2.3 Wireshark (latest version) pre-installed.
   2.4 A working internet connection (Wi-Fi will be provided).
   2.5 Notebook and pen for taking notes.

3. SESSION RULES
   3.1 All hacking demonstrations are for educational purposes ONLY.
   3.2 Do NOT attempt to hack any systems outside the lab environment.
   3.3 Tools and techniques learned must be used ethically and legally.
   3.4 Participants violating ethical guidelines will be removed immediately.
   3.5 Follow the instructor's commands precisely during hands-on labs.

4. ATTENDANCE & CERTIFICATES
   4.1 Full-day attendance is mandatory for the certificate.
   4.2 Two breaks will be provided (tea break + lunch break).
   4.3 Certificates will be issued to eligible participants within 7 days.
   4.4 A feedback form must be filled to receive the certificate.

5. CODE OF CONDUCT
   5.1 No unauthorized access to networks or systems.
   5.2 Do not install unauthorized software on lab computers.
   5.3 Respectful behavior towards instructors and participants.
   5.4 Lab equipment must be returned in the same condition.`,
    teamMembers: [],
    participants: [],
  },
  {
    title: 'Cloud Computing & DevOps Webinar',
    description: 'An online webinar covering cloud platforms (AWS, Azure, GCP), containerization with Docker, CI/CD pipelines, and Kubernetes orchestration. Industry professionals from top MNCs will share their real-world experiences and career guidance.',
    location: 'Online',
    venue: 'Google Meet + YouTube Live',
    address: 'Online Event',
    startDate: new Date('2026-05-02T14:00:00'),
    endDate: new Date('2026-05-02T17:00:00'),
    time: '2:00 PM - 5:00 PM',
    category: 'Webinar',
    type: 'Online',
    status: 'upcoming',
    registrationFee: 0,
    maxParticipants: 500,
    registrationDeadline: new Date('2026-05-01T23:59:00'),
    tags: ['cloud', 'devops', 'aws', 'docker', 'kubernetes', 'webinar'],
    rulebook: `CLOUD COMPUTING & DEVOPS WEBINAR - RULES & GUIDELINES

1. REGISTRATION & ACCESS
   1.1 Free registration — open to all students, faculty, and professionals.
   1.2 Google Meet link will be shared 1 hour before the webinar.
   1.3 YouTube Live link will be available for overflow participants.
   1.4 Maximum 500 participants on Google Meet; unlimited on YouTube Live.
   1.5 Registered participants get priority for Google Meet access.

2. PARTICIPATION GUIDELINES
   2.1 Join the session at least 5 minutes before the scheduled time.
   2.2 Keep your microphone muted unless asked to speak.
   2.3 Use the chat feature for questions during the session.
   2.4 Dedicated Q&A slots will be provided after each speaker session.
   2.5 Raising hands feature should be used to ask questions verbally.

3. RECORDING & SHARING
   3.1 The webinar will be recorded and shared with registered participants.
   3.2 Personal recording or screen capture is not allowed.
   3.3 Sharing of the Meet link with unregistered persons is prohibited.
   3.4 Presentation slides will be shared via email after the event.

4. ATTENDANCE & CERTIFICATES
   4.1 Attendance will be tracked via Google Meet join time.
   4.2 Minimum 80% of the total webinar duration must be attended.
   4.3 YouTube Live viewers are NOT eligible for certificates.
   4.4 Participation certificates will be emailed within 5 working days.
   4.5 Fill the post-webinar feedback form to claim your certificate.

5. CODE OF CONDUCT
   5.1 Maintain professional behavior throughout the session.
   5.2 No spamming in the chat section.
   5.3 Inappropriate behavior will result in removal from the session.
   5.4 Respect all speakers, moderators, and fellow participants.`,
    teamMembers: [],
    participants: [],
  },
];

const seedEvents = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    for (const eventData of events) {
      const existing = await Event.findOne({ title: eventData.title });
      if (existing) {
        console.log(`⏭️  Event already exists: ${eventData.title}`);
      } else {
        await Event.create(eventData);
        console.log(`✅ Created event: ${eventData.title}`);
      }
    }

    console.log('\n📋 Events seeded:');
    console.log('──────────────────────────────────────────');
    events.forEach((e, i) => {
      console.log(`${i + 1}. ${e.title} (${e.category} | ${e.type} | ${e.status})`);
    });
    console.log('──────────────────────────────────────────\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding events:', error);
    process.exit(1);
  }
};

seedEvents();
