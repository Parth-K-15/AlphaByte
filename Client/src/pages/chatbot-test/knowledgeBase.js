/**
 * Knowledge Base for RAG Chatbot (Dummy Data)
 * This simulates the vector database content that would be retrieved
 * In production, this would be stored in ChromaDB/Pinecone with embeddings
 */

// Rulebook sections
export const rulebook = [
  {
    id: 'rule_001',
    section: 'Registration',
    content: `To register for an event:
1. Browse available events in the Events section
2. Click on the event you're interested in
3. Click the "Register" button
4. Fill in any additional required information
5. Submit your registration
You will receive a confirmation email once registered.`,
    keywords: ['register', 'registration', 'how to register', 'sign up', 'enroll']
  },
  {
    id: 'rule_002',
    section: 'Attendance',
    content: `Attendance is marked in two ways:
1. QR Code Scanning: Scan the QR code provided at the event venue using the mobile app
2. Manual Check-in: Event organizers may manually mark attendance
You must attend at least 80% of the event duration to be marked as present.`,
    keywords: ['attendance', 'present', 'check-in', 'qr code', 'scan', 'mark attendance']
  },
  {
    id: 'rule_003',
    section: 'Certificates',
    content: `Certificate Eligibility Criteria:
- Attend the complete event (80%+ attendance)
- Complete any post-event assignments or surveys
- Meet event-specific requirements (e.g., project submission for hackathons)
Certificates are typically issued within 7-10 working days after the event.
You can download certificates from the "My Certificates" section.`,
    keywords: ['certificate', 'certification', 'download certificate', 'eligible', 'receive certificate']
  },
  {
    id: 'rule_004',
    section: 'Cancellation',
    content: `Cancellation Policy:
- Free cancellation up to 48 hours before the event
- Cancellations within 48 hours may incur a penalty
- No-shows without prior cancellation may affect future registration priority
To cancel: Go to My Registrations → Select Event → Click Cancel Registration`,
    keywords: ['cancel', 'cancellation', 'unregister', 'withdraw', 'cancel registration']
  },
  {
    id: 'rule_005',
    section: 'Code of Conduct',
    content: `All participants must adhere to the following:
- Respect all participants, organizers, and speakers
- No harassment, discrimination, or inappropriate behavior
- Maintain confidentiality of any proprietary information shared
- No plagiarism or cheating in competitions
- Dress code: Business casual or as specified by event
Violations may result in removal from the event and suspension from future events.`,
    keywords: ['code of conduct', 'rules', 'behavior', 'discipline', 'respect', 'harassment']
  },
  {
    id: 'rule_006',
    section: 'Technical Requirements',
    content: `For online/hybrid events:
- Stable internet connection (minimum 5 Mbps)
- Working webcam and microphone
- Latest version of Zoom/Google Meet/Microsoft Teams
- For coding events: Laptop with required development tools installed
Technical support is available 30 minutes before and during the event.`,
    keywords: ['technical', 'requirements', 'internet', 'laptop', 'software', 'tools', 'zoom']
  },
  {
    id: 'rule_007',
    section: 'Refund Policy',
    content: `For Paid Events:
- Full refund if event is cancelled by organizers
- 80% refund if you cancel 7+ days before event
- 50% refund if you cancel 3-7 days before event
- No refund if you cancel within 3 days of event
- Refunds processed within 10-15 business days
Free events have no refund policy as there are no fees.`,
    keywords: ['refund', 'payment', 'money back', 'paid event', 'fee']
  },
  {
    id: 'rule_008',
    section: 'Event Availability and Registration',
    content: `Registration Guidelines:
- Registration opens 30 days before each event
- Registration closes 24 hours before event start time or when seats are full
- First-come-first-served basis for all events
- Some events require prerequisite completion before registration
- Premium members get early access (48 hours before public registration)
- You can register for multiple events unless they have time conflicts
- Check event status: Open for Registration, Seats Full, Registration Closed, Event Completed
Current month events have priority display on the events page.`,
    keywords: ['available events', 'registration open', 'when to register', 'event availability', 'seats available', 'registration period', 'registration window', 'which events']
  },
  {
    id: 'rule_009',
    section: 'Fee Structure and Payment',
    content: `Event Fee Categories:
1. Free Events: No payment required, just register and attend (Workshops, Webinars, Seminars)
2. Paid Individual Events: Fixed fee per participant (Rs. 200-1000 depending on event)
3. Team-based Events: Fee per team (Hackathons: Rs. 500-1500 per team of 2-4 members)
4. Workshop Series: Discounted bundle pricing (Save 20% when registering for complete series)

Payment Methods:
- UPI (Google Pay, PhonePe, Paytm)
- Credit/Debit Cards
- Net Banking
- Campus Wallet (for students)

Payment Notes:
- Payment must be completed within 30 minutes of registration
- Failed payments will auto-cancel registration
- Event fees are non-transferable to other events
- Group discounts available for 5+ participants from same department`,
    keywords: ['fee', 'payment', 'cost', 'price', 'how much', 'fees', 'paid events', 'free events', 'payment method', 'upi', 'card', 'fee structure']
  },
  {
    id: 'rule_010',
    section: 'Event Types and Formats',
    content: `1. Workshops (Duration: 4-8 hours)
   - Hands-on practical learning sessions
   - Topics: Programming, Design, Marketing, Leadership
   - Usually Free or Rs. 200-500
   - Certificate provided upon completion

2. Seminars (Duration: 2-3 hours)
   - Expert talks and panel discussions
   - Industry insights and career guidance
   - Always Free
   - Attendance certificate provided

3. Hackathons (Duration: 12-48 hours)
   - Coding competitions with prizes
   - Team-based (2-4 members)
   - Fee: Rs. 500-1500 per team
   - Prizes for top 3 teams + participation certificates

4. Webinars (Duration: 1-2 hours)
   - Online sessions via Zoom/Google Meet
   - Always Free
   - Can attend from anywhere
   - Recording available for 7 days

5. Conferences (Duration: 1-3 days)
   - Multi-track events with multiple speakers
   - Networking opportunities
   - Fee: Rs. 500-2000 (includes meals and materials)
   - Premium certificate and event kit

6. Competitions (Duration: Varies)
   - Skill-based contests (Coding, Design, Presentation)
   - Individual or team-based
   - Free to Rs. 300 per participant
   - Prizes and certificates for winners`,
    keywords: ['event types', 'workshop', 'seminar', 'hackathon', 'webinar', 'conference', 'competition', 'types of events', 'event formats', 'what events', 'types available', 'kinds of events', 'event categories', 'what kind', 'different types']
  }
];

// FAQs
export const faqs = [
  {
    id: 'faq_001',
    category: 'General',
    question: 'How do I register for an event?',
    answer: `Registration is simple! Navigate to the Events page, browse available events, click on the event you want to attend, and click the "Register" button. You'll receive a confirmation email once registered.`,
    keywords: ['register', 'how to register', 'sign up', 'registration process']
  },
  {
    id: 'faq_002',
    category: 'Certificates',
    question: 'When will I receive my certificate?',
    answer: `Certificates are typically issued within 7-10 working days after the event ends. You must have attended at least 80% of the event and completed all required activities. You can download your certificates from the "My Certificates" section once they're ready.`,
    keywords: ['certificate', 'when certificate', 'get certificate', 'download certificate']
  },
  {
    id: 'faq_003',
    category: 'Attendance',
    question: 'How is attendance marked?',
    answer: `Attendance is marked by scanning a QR code at the event venue using your mobile device, or through manual check-in by event organizers. Make sure to scan the QR code when you arrive at the event.`,
    keywords: ['attendance', 'qr code', 'check-in', 'mark attendance', 'scan']
  },
  {
    id: 'faq_004',
    category: 'General',
    question: 'Can I cancel my registration?',
    answer: `Yes, you can cancel your registration from the "My Registrations" page. Free cancellation is available up to 48 hours before the event. Cancellations within 48 hours may incur penalties for paid events.`,
    keywords: ['cancel', 'cancel registration', 'unregister', 'withdraw']
  },
  {
    id: 'faq_005',
    category: 'Events',
    question: 'What types of events are available?',
    answer: `We organize various types of events including Workshops, Seminars, Hackathons, Conferences, Webinars, and Competitions. Each event type offers unique learning and networking opportunities. Check the Events page to see current offerings.`,
    keywords: ['event types', 'types of events', 'what events', 'categories', 'kinds of events', 'types available', 'event formats', 'different types', 'what kind']
  },
  {
    id: 'faq_006',
    category: 'Support',
    question: 'How do I contact support?',
    answer: `You can contact support through:
- Email: support@planix.com
- Phone: +91-XXX-XXX-XXXX
- Live Chat: Available on the platform (Mon-Fri, 9 AM - 6 PM)
- Help Center: Visit our Help section for instant answers`,
    keywords: ['contact', 'support', 'help', 'contact support', 'email', 'phone']
  },
  {
    id: 'faq_007',
    category: 'Profile',
    question: 'How do I update my profile?',
    answer: `Go to the Profile section from the navigation menu. You can update your personal information, profile picture, contact details, and preferences. Remember to click "Save Changes" after making updates.`,
    keywords: ['profile', 'update profile', 'edit profile', 'change details']
  },
  {
    id: 'faq_008',
    category: 'Events',
    question: 'Can I attend multiple events at the same time?',
    answer: `You can register for multiple events, but if they overlap in time, you'll need to choose which one to attend. The system will show you a warning if you try to register for overlapping events.`,
    keywords: ['multiple events', 'overlap', 'same time', 'conflict']
  },
  {
    id: 'faq_009',
    category: 'Events',
    question: 'Which events are currently available for registration?',
    answer: `We have 12+ events available for March-April 2026 including:
- Free Events: React Workshop, AI Seminar, Cloud Webinar, DevOps Webinar, Cybersecurity Seminar
- Paid Events: Full Stack Bootcamp (Rs. 800), Blockchain Workshop (Rs. 600), Mobile App Workshop (Rs. 700), Data Science Workshop (Rs. 400)
- Competitions: UI/UX Design (Rs. 200), Hackathon (Rs. 500 per team)
- Career Fair Conference (Rs. 300)
Check the Events page for complete details, available seats, and registration status.`,
    keywords: ['available events', 'which events', 'current events', 'upcoming events', 'event list', 'what events to register', 'show events', 'list events', 'all events', 'give me events', 'events available', 'list of events', 'show me all events']
  },
  {
    id: 'faq_010',
    category: 'Payment',
    question: 'What is the fee structure for events?',
    answer: `Event fees vary by type:
- Free Events: Webinars, most Seminars (0 rupees)
- Workshops: Rs. 200 - Rs. 800 (includes materials and certificate)
- Competitions: Rs. 200 - Rs. 300 per person
- Hackathons: Rs. 500 - Rs. 1500 per team (2-4 members)
- Conferences: Rs. 300 - Rs. 2000 (includes meals and kit)
Payment can be made via UPI, Cards, Net Banking, or Campus Wallet. All paid events include certificates and study materials.`,
    keywords: ['fee', 'cost', 'price', 'how much', 'event fee', 'payment', 'fees', 'fee structure', 'pricing']
  },
  {
    id: 'faq_011',
    category: 'Events',
    question: 'Are there any free events available?',
    answer: `Yes! We have several free events:
1. React Fundamentals Workshop (March 15)
2. AI & Machine Learning Seminar (March 20)
3. Cloud Computing Webinar (March 10)
4. Cybersecurity Awareness Seminar (March 12)
5. DevOps and CI/CD Webinar (March 16)
All free events provide attendance certificates. Just register and attend!`,
    keywords: ['free events', 'free', 'no cost', 'zero fee', 'free workshops', 'free seminars']
  },
  {
    id: 'faq_012',
    category: 'Events',
    question: 'How do I know if seats are still available for an event?',
    answer: `Each event page shows:
- Total Seats: Maximum capacity
- Available Seats: Number of seats remaining
- Registration Status: Open, Seats Full, or Registration Closed
Events with "Seats Full" status cannot accept new registrations. Register early for popular events! Some events like Mobile App Workshop have only 5 seats remaining.`,
    keywords: ['seats available', 'seats remaining', 'full', 'capacity', 'availability', 'how many seats']
  },
  {
    id: 'faq_013',
    category: 'Payment',
    question: 'What payment methods do you accept?',
    answer: `We accept multiple payment methods:
1. UPI: Google Pay, PhonePe, Paytm, BHIM
2. Credit/Debit Cards: Visa, Mastercard, RuPay
3. Net Banking: All major banks
4. Campus Wallet: For enrolled students
Payment must be completed within 30 minutes of registration. Failed payments will auto-cancel your registration.`,
    keywords: ['payment method', 'how to pay', 'upi', 'card', 'net banking', 'payment options']
  },
  {
    id: 'faq_014',
    category: 'Events',
    question: 'Do paid events include any additional benefits?',
    answer: `Yes! Paid events include:
- Completion Certificate (verified)
- Study Materials/Resources
- Lunch (for full-day events)
- Project Source Code (workshop events)
- Event Kit (conferences)
- Competition prizes (for competitive events)
For example, Full Stack Bootcamp (Rs. 800) includes lunch, certificate, study materials, and complete project source code.`,
    keywords: ['benefits', 'includes', 'what included', 'paid event benefits', 'perks', 'additional']
  }
];

// Event details (sample)
export const eventDetails = [
  {
    id: 'evt_001',
    name: 'React Fundamentals Workshop',
    type: 'Workshop',
    date: '2026-03-15',
    time: '10:00 AM - 4:00 PM',
    venue: 'Computer Lab 101',
    description: 'Learn the fundamentals of React including components, hooks, state management, and routing.',
    requirements: 'Basic JavaScript knowledge, laptop with Node.js installed',
    prerequisites: 'HTML, CSS, JavaScript basics',
    duration: '6 hours',
    instructor: 'Dr. Amit Kumar',
    seats: 40,
    availableSeats: 15,
    registrationStatus: 'Open',
    fee: 'Free',
    feeAmount: 0,
    keywords: ['react', 'workshop', 'javascript', 'frontend', 'web development', 'free']
  },
  {
    id: 'evt_002',
    name: 'AI & Machine Learning Seminar',
    type: 'Seminar',
    date: '2026-03-20',
    time: '2:00 PM - 5:00 PM',
    venue: 'Auditorium Hall',
    description: 'Explore the latest trends in AI and ML, with guest speakers from top tech companies.',
    requirements: 'No prerequisites',
    prerequisites: 'None',
    duration: '3 hours',
    instructor: 'Industry Experts',
    seats: 150,
    availableSeats: 80,
    registrationStatus: 'Open',
    fee: 'Free',
    feeAmount: 0,
    keywords: ['ai', 'machine learning', 'seminar', 'artificial intelligence', 'ml', 'free']
  },
  {
    id: 'evt_003',
    name: '24-Hour Hackathon',
    type: 'Hackathon',
    date: '2026-04-01',
    time: '9:00 AM (Day 1) - 9:00 AM (Day 2)',
    venue: 'Innovation Center',
    description: 'Build innovative solutions in 24 hours. Teams of 2-4 members. Prizes for top 3 teams.',
    requirements: 'Laptop, development environment, team registration',
    prerequisites: 'Programming experience in any language',
    duration: '24 hours',
    instructor: 'Multiple Mentors',
    seats: 100,
    availableSeats: 45,
    registrationStatus: 'Open',
    fee: 'Rs. 500 per team',
    feeAmount: 500,
    prizes: 'First Prize: Rs. 50,000 | Second Prize: Rs. 30,000 | Third Prize: Rs. 20,000',
    keywords: ['hackathon', 'coding', 'competition', 'programming', '24 hour', 'innovation', 'paid', 'team']
  },
  {
    id: 'evt_004',
    name: 'Cloud Computing Webinar',
    type: 'Webinar',
    date: '2026-03-10',
    time: '4:00 PM - 5:30 PM',
    venue: 'Online (Zoom)',
    description: 'Introduction to cloud platforms (AWS, Azure, GCP) and cloud-native architecture.',
    requirements: 'Internet connection, Zoom app',
    prerequisites: 'Basic computing knowledge',
    duration: '1.5 hours',
    instructor: 'Dr. Priya Sharma',
    seats: 200,
    availableSeats: 120,
    registrationStatus: 'Open',
    fee: 'Free',
    feeAmount: 0,
    keywords: ['cloud', 'webinar', 'aws', 'azure', 'gcp', 'online', 'free']
  },
  {
    id: 'evt_005',
    name: 'Full Stack Development Bootcamp',
    type: 'Workshop',
    date: '2026-03-25',
    time: '9:00 AM - 6:00 PM',
    venue: 'Technology Block - Room 301',
    description: 'Comprehensive bootcamp covering MERN stack (MongoDB, Express, React, Node.js) with hands-on projects.',
    requirements: 'Laptop with 8GB RAM, code editor installed',
    prerequisites: 'JavaScript fundamentals, HTML/CSS knowledge',
    duration: '9 hours (with breaks)',
    instructor: 'Mr. Vikram Singh (Senior Full Stack Developer)',
    seats: 30,
    availableSeats: 8,
    registrationStatus: 'Open',
    fee: 'Rs. 800',
    feeAmount: 800,
    includes: 'Lunch, study materials, certificate, project source code',
    keywords: ['full stack', 'mern', 'mongodb', 'express', 'node', 'bootcamp', 'paid', 'workshop']
  },
  {
    id: 'evt_006',
    name: 'Data Science with Python Workshop',
    type: 'Workshop',
    date: '2026-03-18',
    time: '10:00 AM - 5:00 PM',
    venue: 'Computer Lab 205',
    description: 'Learn data analysis, visualization, and basic ML using Python libraries (Pandas, NumPy, Matplotlib).',
    requirements: 'Laptop with Python 3.8+ and Jupyter Notebook installed',
    prerequisites: 'Basic Python programming',
    duration: '7 hours',
    instructor: 'Dr. Sneha Gupta',
    seats: 35,
    availableSeats: 22,
    registrationStatus: 'Open',
    fee: 'Rs. 400',
    feeAmount: 400,
    includes: 'Dataset access, certificate, study materials',
    keywords: ['data science', 'python', 'pandas', 'numpy', 'ml', 'workshop', 'paid']
  },
  {
    id: 'evt_007',
    name: 'UI/UX Design Competition',
    type: 'Competition',
    date: '2026-03-28',
    time: '11:00 AM - 4:00 PM',
    venue: 'Design Studio',
    description: 'Design a mobile app interface based on given problem statement. Individual competition.',
    requirements: 'Laptop with design tools (Figma/Adobe XD/Sketch)',
    prerequisites: 'Basic design principles knowledge',
    duration: '5 hours',
    instructor: 'Panel of Judges',
    seats: 50,
    availableSeats: 18,
    registrationStatus: 'Open',
    fee: 'Rs. 200',
    feeAmount: 200,
    prizes: 'Winner: Rs. 10,000 | Runner-up: Rs. 5,000 | 3rd Place: Rs. 3,000',
    keywords: ['design', 'ui', 'ux', 'competition', 'figma', 'adobe xd', 'paid']
  },
  {
    id: 'evt_008',
    name: 'Cybersecurity Awareness Seminar',
    type: 'Seminar',
    date: '2026-03-12',
    time: '3:00 PM - 5:00 PM',
    venue: 'Main Auditorium',
    description: 'Learn about latest cyber threats, best practices for online safety, and ethical hacking basics.',
    requirements: 'None',
    prerequisites: 'None',
    duration: '2 hours',
    instructor: 'Cybersecurity Expert from National Cyber Agency',
    seats: 200,
    availableSeats: 150,
    registrationStatus: 'Open',
    fee: 'Free',
    feeAmount: 0,
    keywords: ['cybersecurity', 'security', 'hacking', 'ethical hacking', 'seminar', 'free']
  },
  {
    id: 'evt_009',
    name: 'Blockchain & Cryptocurrency Workshop',
    type: 'Workshop',
    date: '2026-04-05',
    time: '1:00 PM - 6:00 PM',
    venue: 'Tech Hub - Hall B',
    description: 'Understanding blockchain technology, smart contracts, and cryptocurrency fundamentals.',
    requirements: 'Laptop, internet connection',
    prerequisites: 'Basic programming knowledge',
    duration: '5 hours',
    instructor: 'Ms. Anjali Mehta (Blockchain Developer)',
    seats: 40,
    availableSeats: 30,
    registrationStatus: 'Open',
    fee: 'Rs. 600',
    feeAmount: 600,
    includes: 'Certificate, blockchain development resources, demo project',
    keywords: ['blockchain', 'cryptocurrency', 'bitcoin', 'ethereum', 'smart contracts', 'paid', 'workshop']
  },
  {
    id: 'evt_010',
    name: 'Tech Career Fair 2026',
    type: 'Conference',
    date: '2026-04-10',
    time: '10:00 AM - 6:00 PM',
    venue: 'Convention Center',
    description: 'Meet recruiters from top tech companies. Multiple seminars on resume building, interview preparation, and industry trends.',
    requirements: 'Updated resume, professional attire',
    prerequisites: 'None - Open to all students',
    duration: '8 hours',
    instructor: 'Multiple speakers and recruiters',
    seats: 500,
    availableSeats: 320,
    registrationStatus: 'Open',
    fee: 'Rs. 300',
    feeAmount: 300,
    includes: 'Entry pass, lunch, networking session access, event kit with company brochures',
    keywords: ['career fair', 'conference', 'job', 'placement', 'recruitment', 'companies', 'paid']
  },
  {
    id: 'evt_011',
    name: 'Mobile App Development Workshop',
    type: 'Workshop',
    date: '2026-03-22',
    time: '10:00 AM - 5:00 PM',
    venue: 'Mobile Lab 102',
    description: 'Build Android and iOS apps using React Native. Create your first cross-platform mobile app.',
    requirements: 'Laptop with Android Studio or Xcode installed',
    prerequisites: 'JavaScript and React basics',
    duration: '7 hours',
    instructor: 'Mr. Arjun Reddy (Mobile Developer)',
    seats: 25,
    availableSeats: 5,
    registrationStatus: 'Open',
    fee: 'Rs. 700',
    feeAmount: 700,
    includes: 'Lunch, certificate, app source code, deployment guide',
    keywords: ['mobile', 'react native', 'android', 'ios', 'app development', 'paid', 'workshop']
  },
  {
    id: 'evt_012',
    name: 'DevOps and CI/CD Webinar',
    type: 'Webinar',
    date: '2026-03-16',
    time: '5:00 PM - 6:30 PM',
    venue: 'Online (Google Meet)',
    description: 'Introduction to DevOps practices, Docker, Kubernetes, Jenkins, and CI/CD pipelines.',
    requirements: 'Internet connection',
    prerequisites: 'Basic knowledge of software development',
    duration: '1.5 hours',
    instructor: 'DevOps Engineer from leading tech company',
    seats: 300,
    availableSeats: 255,
    registrationStatus: 'Open',
    fee: 'Free',
    feeAmount: 0,
    keywords: ['devops', 'docker', 'kubernetes', 'cicd', 'jenkins', 'webinar', 'free', 'online']
  }
];

// User-specific dummy data (simulated personal context)
export const dummyUserData = {
  userId: 'user_123',
  name: 'Rahul Sharma',
  email: 'rahul.sharma@example.com',
  department: 'Computer Science',
  year: 3,
  registeredEvents: [
    { id: 'evt_001', name: 'React Fundamentals Workshop', status: 'upcoming' },
    { id: 'evt_002', name: 'AI & Machine Learning Seminar', status: 'upcoming' }
  ],
  attendedEvents: [
    { id: 'evt_005', name: 'Python Workshop', date: '2026-02-10', attended: true },
    { id: 'evt_006', name: 'Git & GitHub Session', date: '2026-01-25', attended: true }
  ],
  certificates: [
    { id: 'cert_001', eventName: 'Python Workshop', issuedDate: '2026-02-15' },
    { id: 'cert_002', eventName: 'Git & GitHub Session', issuedDate: '2026-02-01' }
  ],
  totalEvents: 4,
  totalCertificates: 2,
  attendanceRate: 0.85
};

// Quick responses for common greetings
export const greetingResponses = [
  {
    patterns: ['hi', 'hello', 'hey', 'greetings', 'good morning', 'good afternoon', 'good evening'],
    responses: [
      "Hello! 👋 I'm Planix AI Assistant. I can help you with event information, registration guidance, certificates, and more. What would you like to know?",
      "Hi there! 👋 How can I assist you today? I can answer questions about events, rules, certifications, or your participation history.",
      "Hey! 👋 Welcome to Planix. I'm here to help with any questions about events, registration, attendance, or certificates. What can I help you with?"
    ]
  },
  {
    patterns: ['thanks', 'thank you', 'appreciate', 'grateful'],
    responses: [
      "You're welcome! 😊 Let me know if you need anything else.",
      "Happy to help! 😊 Feel free to ask if you have more questions.",
      "Glad I could assist! 😊 Don't hesitate to reach out if you need more help."
    ]
  },
  {
    patterns: ['bye', 'goodbye', 'see you', 'exit'],
    responses: [
      "Goodbye! 👋 Have a great day and see you at the next event!",
      "See you later! 👋 Feel free to come back anytime you need help.",
      "Take care! 👋 Good luck with your events!"
    ]
  }
];

// Combined knowledge base for search
export const combinedKnowledgeBase = [
  ...rulebook,
  ...faqs.map(faq => ({
    id: faq.id,
    section: `FAQ - ${faq.category}`,
    content: `Q: ${faq.question}\n\nA: ${faq.answer}`,
    keywords: faq.keywords
  })),
  ...eventDetails.map(event => ({
    id: event.id,
    section: `Event: ${event.name}`,
    content: `${event.name}
Type: ${event.type}
Date: ${event.date}
Time: ${event.time}
Venue: ${event.venue}
Fee: ${event.fee}${event.feeAmount > 0 ? ` (Rs. ${event.feeAmount})` : ''}
Available Seats: ${event.availableSeats} / ${event.seats}
Registration Status: ${event.registrationStatus}

Description: ${event.description}

Duration: ${event.duration}
Instructor: ${event.instructor}
Prerequisites: ${event.prerequisites}
Requirements: ${event.requirements}${event.includes ? `\nIncludes: ${event.includes}` : ''}${event.prizes ? `\nPrizes: ${event.prizes}` : ''}`,
    keywords: [...event.keywords, event.name.toLowerCase(), 'event', 'available']
  }))
];

export default {
  rulebook,
  faqs,
  eventDetails,
  dummyUserData,
  greetingResponses,
  combinedKnowledgeBase
};
