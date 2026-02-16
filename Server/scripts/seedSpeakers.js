import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env') });

// ---- Inline schemas to avoid import issues ----

const speakerAuthSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  bio: { type: String, default: '' },
  specializations: [{ type: String }],
  socialLinks: {
    linkedin: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' },
    github: { type: String, default: '' },
  },
  headshot: { type: String },
  headshotPublicId: { type: String },
  pastSpeakingRecords: [{
    eventName: { type: String },
    date: { type: Date },
    topic: { type: String },
    organizer: { type: String },
  }],
  isActive: { type: Boolean, default: true },
  isSuspended: { type: Boolean, default: false },
  suspensionReason: { type: String },
  suspendedAt: { type: Date },
  avatar: { type: String },
  avatarPublicId: { type: String },
}, { timestamps: true });

const SpeakerAuth = mongoose.model('SpeakerAuth', speakerAuthSchema);

// ---- Speaker Data ----

const speakers = [
  {
    name: 'Dr. Ananya Sharma',
    email: 'ananya.sharma@techtalks.in',
    phone: '9876543201',
    bio: 'AI/ML researcher with 10+ years of experience in deep learning, NLP, and computer vision. Former lead data scientist at Google Brain India. Published 25+ papers in top-tier conferences like NeurIPS and ICML.',
    specializations: ['Artificial Intelligence', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/ananyasharma-ai',
      twitter: 'https://twitter.com/ananya_ml',
      website: 'https://ananyasharma.dev',
      github: 'https://github.com/ananyasharma-ai',
    },
    pastSpeakingRecords: [
      { eventName: 'AI Summit India 2025', date: new Date('2025-09-15'), topic: 'Transformers in Production', organizer: 'TechConf India' },
      { eventName: 'PyData Delhi 2025', date: new Date('2025-07-20'), topic: 'Building Scalable ML Pipelines', organizer: 'NumFOCUS' },
      { eventName: 'NeurIPS Workshop 2024', date: new Date('2024-12-10'), topic: 'Attention Mechanisms in Vision', organizer: 'NeurIPS Foundation' },
      { eventName: 'Google DevFest 2024', date: new Date('2024-11-05'), topic: 'TensorFlow for Edge Devices', organizer: 'Google Developers' },
    ],
  },
  {
    name: 'Rajesh Gupta',
    email: 'rajesh.gupta@cloudpro.io',
    phone: '9876543202',
    bio: 'Cloud architect and DevOps evangelist with expertise in AWS, Azure, and GCP. Certified AWS Solutions Architect Professional and Kubernetes Administrator. Led cloud migration for 50+ enterprises.',
    specializations: ['Cloud Computing', 'DevOps', 'AWS', 'Docker', 'Kubernetes', 'CI/CD'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/rajeshgupta-cloud',
      twitter: 'https://twitter.com/rajesh_devops',
      website: 'https://rajeshgupta.cloud',
      github: 'https://github.com/rajeshgupta-devops',
    },
    pastSpeakingRecords: [
      { eventName: 'AWS re:Invent India 2025', date: new Date('2025-10-12'), topic: 'Serverless at Scale', organizer: 'Amazon Web Services' },
      { eventName: 'DockerCon 2025', date: new Date('2025-06-18'), topic: 'Container Orchestration Best Practices', organizer: 'Docker Inc.' },
      { eventName: 'KubeCon India 2024', date: new Date('2024-08-22'), topic: 'Kubernetes Security Hardening', organizer: 'CNCF' },
    ],
  },
  {
    name: 'Priya Menon',
    email: 'priya.menon@fullstackdev.com',
    phone: '9876543203',
    bio: 'Full stack developer and educator specializing in React, Node.js, and modern JavaScript. Creator of popular Udemy courses with 100K+ students. Open source contributor to Next.js and Express.',
    specializations: ['Web Development', 'React', 'Node.js', 'JavaScript', 'MongoDB', 'Full Stack'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/priyamenon-dev',
      twitter: 'https://twitter.com/priya_fullstack',
      website: 'https://priyamenon.dev',
      github: 'https://github.com/priyamenon-js',
    },
    pastSpeakingRecords: [
      { eventName: 'ReactConf India 2025', date: new Date('2025-08-15'), topic: 'Server Components in Production', organizer: 'React India Community' },
      { eventName: 'NodeConf India 2025', date: new Date('2025-05-20'), topic: 'Building Real-time APIs with Node.js', organizer: 'NodeConf' },
      { eventName: 'JSConf Asia 2024', date: new Date('2024-11-10'), topic: 'Modern State Management in React', organizer: 'JSConf' },
      { eventName: 'MongoDB World 2024', date: new Date('2024-06-15'), topic: 'Schema Design Patterns for MongoDB', organizer: 'MongoDB Inc.' },
      { eventName: 'Full Stack Bootcamp 2024', date: new Date('2024-03-10'), topic: 'MERN Stack from Zero to Hero', organizer: 'CodeCamp India' },
    ],
  },
  {
    name: 'Vikram Singh',
    email: 'vikram.singh@cybersafe.net',
    phone: '9876543204',
    bio: 'Cybersecurity expert and certified ethical hacker (CEH, OSCP). Specializes in penetration testing, network security, and incident response. Former security consultant at Deloitte.',
    specializations: ['Cybersecurity', 'Ethical Hacking', 'Penetration Testing', 'Network Security', 'Security'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/vikramsingh-sec',
      twitter: 'https://twitter.com/vikram_hacker',
      website: 'https://vikramsecurity.com',
      github: 'https://github.com/vikram-sec',
    },
    pastSpeakingRecords: [
      { eventName: 'DefCon India 2025', date: new Date('2025-08-05'), topic: 'Red Team Operations', organizer: 'DEF CON Groups' },
      { eventName: 'OWASP India 2025', date: new Date('2025-04-18'), topic: 'Web Application Security Testing', organizer: 'OWASP Foundation' },
      { eventName: 'CyberSec Summit 2024', date: new Date('2024-10-20'), topic: 'Zero Trust Architecture', organizer: 'CyberSec India' },
    ],
  },
  {
    name: 'Neha Patel',
    email: 'neha.patel@dataworld.in',
    phone: '9876543205',
    bio: 'Data scientist and analytics expert with 8 years of experience in data visualization, statistical modeling, and business intelligence. Expertise in Python, R, Tableau, and Power BI.',
    specializations: ['Data Science', 'Data Analytics', 'Machine Learning', 'Python', 'Tableau', 'Statistics'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/nehapatel-data',
      twitter: 'https://twitter.com/neha_datascience',
      website: 'https://nehapatel.data',
      github: 'https://github.com/nehapatel-ds',
    },
    pastSpeakingRecords: [
      { eventName: 'DataHack Summit 2025', date: new Date('2025-11-08'), topic: 'Feature Engineering for ML', organizer: 'Analytics Vidhya' },
      { eventName: 'PyCon India 2025', date: new Date('2025-09-25'), topic: 'Data Pipelines with Python', organizer: 'PyCon India' },
      { eventName: 'Tableau Conference 2024', date: new Date('2024-10-15'), topic: 'Building Interactive Dashboards', organizer: 'Salesforce' },
    ],
  },
  {
    name: 'Arjun Reddy',
    email: 'arjun.reddy@gamedevstudio.com',
    phone: '9876543206',
    bio: 'Game developer and Unity expert with 6 years of experience. Developed 10+ published mobile and PC games. Passionate about game design, 3D modeling, and interactive storytelling.',
    specializations: ['Game Development', 'Unity', 'C#', '3D Modeling', 'Game Design', 'AR/VR'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/arjunreddy-gamedev',
      twitter: 'https://twitter.com/arjun_gamedev',
      website: 'https://arjungames.dev',
      github: 'https://github.com/arjunreddy-games',
    },
    pastSpeakingRecords: [
      { eventName: 'India Game Developer Conference 2025', date: new Date('2025-07-12'), topic: 'Mobile Game Optimization', organizer: 'NASSCOM Gaming' },
      { eventName: 'Unity Dev Day India 2024', date: new Date('2024-09-20'), topic: 'Building Multiplayer Games', organizer: 'Unity Technologies' },
    ],
  },
  {
    name: 'Sanya Kapoor',
    email: 'sanya.kapoor@blockchain.io',
    phone: '9876543207',
    bio: 'Blockchain developer and Web3 advocate. Specializes in Solidity, smart contracts, DeFi protocols, and Ethereum ecosystem. Built multiple DApps with TVL exceeding $10M.',
    specializations: ['Blockchain', 'Web3', 'Solidity', 'Ethereum', 'Smart Contracts', 'DeFi'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sanyakapoor-web3',
      twitter: 'https://twitter.com/sanya_web3',
      website: 'https://sanyaweb3.dev',
      github: 'https://github.com/sanya-blockchain',
    },
    pastSpeakingRecords: [
      { eventName: 'ETHIndia 2025', date: new Date('2025-12-01'), topic: 'DeFi Protocol Design', organizer: 'ETHGlobal' },
      { eventName: 'Web3Conf India 2025', date: new Date('2025-06-10'), topic: 'Smart Contract Security Auditing', organizer: 'Web3 India' },
      { eventName: 'Blockchain Summit 2024', date: new Date('2024-08-15'), topic: 'Building on Ethereum L2s', organizer: 'CoinDesk India' },
    ],
  },
  {
    name: 'Karthik Nair',
    email: 'karthik.nair@mobiledev.io',
    phone: '9876543208',
    bio: 'Mobile app developer with expertise in React Native, Flutter, and native Android/iOS development. Delivered 30+ apps on Play Store and App Store. Google Developer Expert for Android.',
    specializations: ['Mobile Development', 'React Native', 'Flutter', 'Android', 'iOS', 'Kotlin'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/karthiknair-mobile',
      twitter: 'https://twitter.com/karthik_mobile',
      website: 'https://karthiknair.dev',
      github: 'https://github.com/karthik-mobile',
    },
    pastSpeakingRecords: [
      { eventName: 'Google I/O Extended India 2025', date: new Date('2025-05-15'), topic: 'Jetpack Compose Masterclass', organizer: 'Google Developers' },
      { eventName: 'Flutter Forward India 2025', date: new Date('2025-03-20'), topic: 'Cross-Platform App Architecture', organizer: 'Flutter Community' },
      { eventName: 'Droidcon India 2024', date: new Date('2024-11-08'), topic: 'Kotlin Multiplatform in Production', organizer: 'Droidcon' },
      { eventName: 'React Native EU 2024', date: new Date('2024-09-05'), topic: 'Performance Optimization in RN', organizer: 'Callstack' },
    ],
  },
  {
    name: 'Meera Joshi',
    email: 'meera.joshi@designlab.in',
    phone: '9876543209',
    bio: 'UX/UI designer and design thinking practitioner with 9 years of industry experience. Former design lead at Flipkart. Expert in Figma, user research, accessibility, and design systems.',
    specializations: ['UI/UX Design', 'Figma', 'Design Thinking', 'User Research', 'Accessibility', 'Design Systems'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/meerajoshi-design',
      twitter: 'https://twitter.com/meera_ux',
      website: 'https://meeradesigns.in',
      github: '',
    },
    pastSpeakingRecords: [
      { eventName: 'DesignUp 2025', date: new Date('2025-10-08'), topic: 'Building Scalable Design Systems', organizer: 'DesignUp India' },
      { eventName: 'UX India Conference 2025', date: new Date('2025-07-22'), topic: 'Inclusive Design for Indian Users', organizer: 'UX India' },
      { eventName: 'Figma Config India 2024', date: new Date('2024-06-20'), topic: 'Auto Layout & Component Variants', organizer: 'Figma' },
    ],
  },
  {
    name: 'Rohit Verma',
    email: 'rohit.verma@iotworks.com',
    phone: '9876543210',
    bio: 'IoT and embedded systems engineer with expertise in Arduino, Raspberry Pi, ESP32, and industrial IoT platforms. Built smart campus solutions for 5+ universities.',
    specializations: ['IoT', 'Embedded Systems', 'Arduino', 'Raspberry Pi', 'Edge Computing', 'Sensors'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/rohitverma-iot',
      twitter: 'https://twitter.com/rohit_iot',
      website: 'https://rohitiot.tech',
      github: 'https://github.com/rohit-iot',
    },
    pastSpeakingRecords: [
      { eventName: 'IoT India Congress 2025', date: new Date('2025-09-10'), topic: 'Smart Campus with IoT', organizer: 'NASSCOM IoT' },
      { eventName: 'Maker Faire India 2025', date: new Date('2025-04-05'), topic: 'Building with ESP32 and MQTT', organizer: 'Maker Media' },
    ],
  },
  {
    name: 'Aisha Khan',
    email: 'aisha.khan@startupguru.in',
    phone: '9876543211',
    bio: 'Startup mentor and entrepreneur who has founded 3 successful tech startups. Angel investor and advisor to 20+ early-stage companies. Expertise in product management, growth hacking, and fundraising.',
    specializations: ['Entrepreneurship', 'Startup', 'Product Management', 'Growth Hacking', 'Fundraising', 'Business'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/aishakhan-startup',
      twitter: 'https://twitter.com/aisha_startup',
      website: 'https://aishakhan.in',
      github: '',
    },
    pastSpeakingRecords: [
      { eventName: 'TiE Global Summit 2025', date: new Date('2025-12-05'), topic: 'From Idea to IPO', organizer: 'TiE' },
      { eventName: 'Startup India Conclave 2025', date: new Date('2025-08-20'), topic: 'Building Products that Scale', organizer: 'Startup India' },
      { eventName: 'YC India Meetup 2024', date: new Date('2024-10-10'), topic: 'Fundraising Masterclass', organizer: 'Y Combinator Alumni' },
      { eventName: 'Product Hunt Makers Festival 2024', date: new Date('2024-07-15'), topic: 'Growth Hacking for Early Stage', organizer: 'Product Hunt' },
    ],
  },
  {
    name: 'Suresh Iyer',
    email: 'suresh.iyer@datapipeline.tech',
    phone: '9876543212',
    bio: 'Big data engineer and Apache Spark specialist. 7 years of experience building data lakes, ETL pipelines, and real-time streaming systems. Expertise in Kafka, Spark, Hadoop, and Airflow.',
    specializations: ['Big Data', 'Apache Spark', 'Kafka', 'Data Engineering', 'ETL', 'Hadoop'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/sureshiyer-data',
      twitter: 'https://twitter.com/suresh_bigdata',
      website: 'https://sureshiyer.tech',
      github: 'https://github.com/suresh-data',
    },
    pastSpeakingRecords: [
      { eventName: 'Spark Summit India 2025', date: new Date('2025-06-25'), topic: 'Real-time Streaming with Spark', organizer: 'Databricks' },
      { eventName: 'Data Engineering Summit 2024', date: new Date('2024-09-15'), topic: 'Building Data Lakes on AWS', organizer: 'Rising Odisha' },
    ],
  },
  {
    name: 'Divya Raghavan',
    email: 'divya.raghavan@roboticslab.in',
    phone: '9876543213',
    bio: 'Robotics engineer and AI researcher. PhD from IIT Madras in autonomous systems. Expertise in ROS, computer vision for robotics, and drone technology. Winner of RoboCup 2023.',
    specializations: ['Robotics', 'Autonomous Systems', 'Computer Vision', 'Drones', 'ROS', 'AI'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/divyaraghavan-robotics',
      twitter: 'https://twitter.com/divya_robotics',
      website: 'https://divyarobotics.in',
      github: 'https://github.com/divya-ros',
    },
    pastSpeakingRecords: [
      { eventName: 'RoboCon India 2025', date: new Date('2025-10-18'), topic: 'Autonomous Navigation with ROS2', organizer: 'IEEE India' },
      { eventName: 'AI for Good Summit 2025', date: new Date('2025-05-10'), topic: 'Drones for Agriculture Monitoring', organizer: 'United Nations ITU' },
      { eventName: 'IIT Research Symposium 2024', date: new Date('2024-08-12'), topic: 'Computer Vision in Robotics', organizer: 'IIT Madras' },
    ],
  },
  {
    name: 'Amit Choudhary',
    email: 'amit.choudhary@opensourcedev.org',
    phone: '9876543214',
    bio: 'Open source evangelist and Linux kernel contributor. Core maintainer of 3 popular open source projects. Advocate for developer tools, Git workflows, and collaborative software development.',
    specializations: ['Open Source', 'Linux', 'Git', 'Developer Tools', 'DevOps', 'System Programming'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/amitchoudhary-oss',
      twitter: 'https://twitter.com/amit_opensource',
      website: 'https://amitoss.dev',
      github: 'https://github.com/amit-opensource',
    },
    pastSpeakingRecords: [
      { eventName: 'FOSDEM India 2025', date: new Date('2025-02-08'), topic: 'Contributing to the Linux Kernel', organizer: 'FOSDEM' },
      { eventName: 'GitKon 2024', date: new Date('2024-10-05'), topic: 'Advanced Git Workflows for Teams', organizer: 'GitKraken' },
      { eventName: 'Open Source India 2024', date: new Date('2024-07-20'), topic: 'Building Developer Communities', organizer: 'EFY Group' },
    ],
  },
  {
    name: 'Tanvi Bhatt',
    email: 'tanvi.bhatt@techwrite.in',
    phone: '9876543215',
    bio: 'Technical writer and developer advocate with experience at Microsoft and Atlassian. Specializes in API documentation, developer experience, and technical communication. Runs a popular dev blog.',
    specializations: ['Technical Writing', 'Developer Advocacy', 'API Documentation', 'Developer Experience', 'Communication'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/tanvibhatt-devrel',
      twitter: 'https://twitter.com/tanvi_devrel',
      website: 'https://tanviwrites.tech',
      github: 'https://github.com/tanvi-devrel',
    },
    pastSpeakingRecords: [
      { eventName: 'Write the Docs India 2025', date: new Date('2025-08-10'), topic: 'API Documentation Best Practices', organizer: 'Write the Docs' },
      { eventName: 'DevRelCon India 2024', date: new Date('2024-11-15'), topic: 'Building Developer Advocacy Programs', organizer: 'DevRelCon' },
    ],
  },
  {
    name: 'Harsh Trivedi',
    email: 'harsh.trivedi@quantumtech.in',
    phone: '9876543216',
    bio: 'Quantum computing researcher at IBM Quantum Network. PhD in Quantum Information Science. Expert in Qiskit, quantum algorithms, and quantum machine learning. TEDx speaker.',
    specializations: ['Quantum Computing', 'Qiskit', 'Quantum Algorithms', 'AI', 'Physics', 'Research'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/harshtrivedi-quantum',
      twitter: 'https://twitter.com/harsh_quantum',
      website: 'https://harshquantum.com',
      github: 'https://github.com/harsh-quantum',
    },
    pastSpeakingRecords: [
      { eventName: 'IBM Quantum Summit India 2025', date: new Date('2025-11-20'), topic: 'Quantum ML Applications', organizer: 'IBM' },
      { eventName: 'TEDx IISc 2025', date: new Date('2025-03-15'), topic: 'Quantum Computing for Everyone', organizer: 'TEDx' },
      { eventName: 'QHack 2024', date: new Date('2024-02-20'), topic: 'Variational Quantum Algorithms', organizer: 'Xanadu' },
    ],
  },
  {
    name: 'Pooja Saxena',
    email: 'pooja.saxena@mlops.dev',
    phone: '9876543217',
    bio: 'MLOps engineer and data platform architect. Expert in model deployment, monitoring, and scaling ML systems. Proficient in MLflow, Kubeflow, and cloud-based ML pipelines.',
    specializations: ['MLOps', 'Machine Learning', 'Model Deployment', 'Kubernetes', 'Cloud Computing', 'Python'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/poojasaxena-mlops',
      twitter: 'https://twitter.com/pooja_mlops',
      website: 'https://poojasaxena.dev',
      github: 'https://github.com/pooja-mlops',
    },
    pastSpeakingRecords: [
      { eventName: 'MLOps World India 2025', date: new Date('2025-07-05'), topic: 'CI/CD for Machine Learning', organizer: 'MLOps Community' },
      { eventName: 'KubeflowCon 2025', date: new Date('2025-04-22'), topic: 'Scaling ML Pipelines with Kubeflow', organizer: 'CNCF' },
      { eventName: 'PyCon India 2024', date: new Date('2024-09-30'), topic: 'MLflow for Experiment Tracking', organizer: 'PyCon India' },
    ],
  },
  {
    name: 'Nikhil Das',
    email: 'nikhil.das@esportsarena.in',
    phone: '9876543218',
    bio: 'Esports commentator, gaming community manager, and tournament organizer. Has organized 50+ competitive gaming events. Expert in competitive gaming strategy, event production, and streaming.',
    specializations: ['Esports', 'Gaming', 'Tournament Organization', 'Streaming', 'Community Management', 'Event Production'],
    socialLinks: {
      linkedin: 'https://linkedin.com/in/nikhildas-esports',
      twitter: 'https://twitter.com/nikhil_esports',
      website: 'https://nikhilesports.in',
      github: '',
    },
    pastSpeakingRecords: [
      { eventName: 'India Gaming Show 2025', date: new Date('2025-09-28'), topic: 'Building Esports Ecosystems in Colleges', organizer: 'NASSCOM Gaming' },
      { eventName: 'GameCon India 2025', date: new Date('2025-06-15'), topic: 'Professional Gaming Careers in India', organizer: 'GameCon' },
      { eventName: 'Among Us Community Meetup 2024', date: new Date('2024-12-20'), topic: 'Competitive Among Us Strategy', organizer: 'InnerSloth Community' },
      { eventName: 'Esports Summit 2024', date: new Date('2024-08-10'), topic: 'Running Large-Scale Online Tournaments', organizer: 'ESFI' },
    ],
  },
];

const seedSpeakers = async () => {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB\n');

    const hashedPassword = await bcrypt.hash('12345678', 10);

    let created = 0;
    let skipped = 0;

    for (const speakerData of speakers) {
      const existing = await SpeakerAuth.findOne({ email: speakerData.email });
      if (existing) {
        console.log(`⏭️  Already exists: ${speakerData.name} (${speakerData.email})`);
        skipped++;
        continue;
      }

      await SpeakerAuth.create({
        ...speakerData,
        password: hashedPassword,
      });
      console.log(`✅ Created: ${speakerData.name} — [${speakerData.specializations.join(', ')}]`);
      created++;
    }

    console.log('\n──────────────────────────────────────────');
    console.log(`📊 Summary: ${created} created, ${skipped} skipped (already existed)`);
    console.log(`📋 Total speakers in DB: ${await SpeakerAuth.countDocuments()}`);
    console.log('──────────────────────────────────────────');
    console.log('\n🔑 Default password for all speakers: 12345678\n');

    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding speakers:', error);
    process.exit(1);
  }
};

seedSpeakers();
