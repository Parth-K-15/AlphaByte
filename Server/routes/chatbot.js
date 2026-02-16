import express from 'express';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Event from '../models/Event.js';
import Participant from '../models/Participant.js';
import Attendance from '../models/Attendance.js';
import Certificate from '../models/Certificate.js';
import ParticipantAuth from '../models/ParticipantAuth.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

// ─────────────────────────────────────────────
// RAG: Retrieve context from MongoDB
// ─────────────────────────────────────────────

/**
 * Fetch all events from DB and format as context documents
 */
const getEventsContext = async () => {
  try {
    const events = await Event.find({ status: { $in: ['upcoming', 'ongoing', 'completed'] } })
      .select('title description location venue startDate endDate time category type status registrationFee maxParticipants registrationDeadline tags rulebook')
      .lean();

    const participantCounts = await Promise.all(
      events.map(e => Participant.countDocuments({ event: e._id }))
    );

    return events.map((event, i) => {
      const seatsLeft = event.maxParticipants ? event.maxParticipants - participantCounts[i] : 'Unlimited';
      return {
        section: `Event: ${event.title}`,
        content: [
          `Title: ${event.title}`,
          event.description ? `Description: ${event.description}` : '',
          `Category: ${event.category || 'General'}`,
          `Type: ${event.type || 'Offline'}`,
          `Status: ${event.status}`,
          event.startDate ? `Start Date: ${new Date(event.startDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : '',
          event.endDate ? `End Date: ${new Date(event.endDate).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : '',
          event.time ? `Time: ${event.time}` : '',
          event.location ? `Location: ${event.location}` : '',
          event.venue ? `Venue: ${event.venue}` : '',
          `Registration Fee: ${event.registrationFee === 0 ? 'Free' : `₹${event.registrationFee}`}`,
          event.maxParticipants ? `Max Participants: ${event.maxParticipants}` : 'Max Participants: Unlimited',
          `Seats Available: ${seatsLeft}`,
          `Registered Participants: ${participantCounts[i]}`,
          event.registrationDeadline ? `Registration Deadline: ${new Date(event.registrationDeadline).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : '',
          event.tags?.length ? `Tags: ${event.tags.join(', ')}` : '',
          event.rulebook ? `\nRulebook:\n${event.rulebook}` : '',
        ].filter(Boolean).join('\n'),
      };
    });
  } catch (error) {
    console.error('Error fetching events context:', error);
    return [];
  }
};

/**
 * Fetch participant-specific data (registrations, attendance, certificates)
 */
const getParticipantContext = async (participantEmail) => {
  if (!participantEmail) return null;

  try {
    // Get participant auth profile
    const profile = await ParticipantAuth.findOne({ email: participantEmail }).select('-password').lean();
    if (!profile) return null;

    // Get all registrations for this participant
    const registrations = await Participant.find({ email: participantEmail })
      .populate('event', 'title startDate endDate status category type location registrationFee')
      .lean();

    // Get attendance records
    const participantIds = registrations.map(r => r._id);
    const attendanceRecords = await Attendance.find({ participant: { $in: participantIds } })
      .populate('event', 'title startDate')
      .lean();

    // Get certificates
    const certificates = await Certificate.find({ participant: { $in: participantIds } })
      .populate('event', 'title')
      .lean();

    // Build context
    const upcomingRegs = registrations.filter(r => r.event && r.event.status === 'upcoming');
    const completedRegs = registrations.filter(r => r.event && r.event.status === 'completed');
    const totalAttended = attendanceRecords.length;
    const totalRegistered = registrations.length;
    const attendanceRate = totalRegistered > 0 ? ((totalAttended / totalRegistered) * 100).toFixed(1) : 0;

    const lines = [
      `Participant Name: ${profile.name}`,
      `Email: ${profile.email}`,
      profile.college ? `College: ${profile.college}` : '',
      profile.branch ? `Branch: ${profile.branch}` : '',
      profile.year ? `Year: ${profile.year}` : '',
      '',
      `--- Registration Summary ---`,
      `Total Registrations: ${totalRegistered}`,
      `Upcoming Events: ${upcomingRegs.length}`,
      `Completed Events: ${completedRegs.length}`,
      '',
    ];

    if (upcomingRegs.length > 0) {
      lines.push('--- Upcoming Registered Events ---');
      upcomingRegs.forEach((r, i) => {
        lines.push(`${i + 1}. ${r.event.title} - ${new Date(r.event.startDate).toLocaleDateString('en-IN')} | Status: ${r.registrationStatus} | Fee: ${r.event.registrationFee === 0 ? 'Free' : `₹${r.event.registrationFee}`}`);
      });
      lines.push('');
    }

    if (completedRegs.length > 0) {
      lines.push('--- Past Events ---');
      completedRegs.forEach((r, i) => {
        lines.push(`${i + 1}. ${r.event.title} - Attendance: ${r.attendanceStatus} | Certificate: ${r.certificateStatus}`);
      });
      lines.push('');
    }

    lines.push('--- Attendance ---');
    lines.push(`Attendance Rate: ${attendanceRate}%`);
    lines.push(`Events Attended: ${totalAttended} out of ${totalRegistered}`);

    if (attendanceRecords.length > 0) {
      lines.push('');
      lines.push('Recent Attendance:');
      attendanceRecords.slice(-5).forEach((a, i) => {
        lines.push(`${i + 1}. ${a.event?.title || 'Unknown'} - ${new Date(a.scannedAt).toLocaleDateString('en-IN')} - ${a.status}`);
      });
    }

    lines.push('');
    lines.push('--- Certificates ---');
    lines.push(`Total Certificates: ${certificates.length}`);

    if (certificates.length > 0) {
      certificates.forEach((c, i) => {
        lines.push(`${i + 1}. ${c.event?.title || 'Unknown'} - ${c.achievement} - Issued: ${new Date(c.issuedAt).toLocaleDateString('en-IN')} - Status: ${c.status}`);
      });
    }

    return {
      section: `Participant Profile: ${profile.name}`,
      content: lines.filter(l => l !== undefined).join('\n'),
    };
  } catch (error) {
    console.error('Error fetching participant context:', error);
    return null;
  }
};

// ─────────────────────────────────────────────
// RAG: Simple relevance scoring
// ─────────────────────────────────────────────

const scoreRelevance = (query, doc) => {
  const queryLower = query.toLowerCase();
  const contentLower = doc.content.toLowerCase();
  const sectionLower = doc.section.toLowerCase();
  const queryWords = queryLower.replace(/[?,.!'"]/g, '').split(/\s+/).filter(w => w.length > 2);

  let score = 0;

  // Section name match
  queryWords.forEach(word => {
    if (sectionLower.includes(word)) score += 5;
  });

  // Content keyword match
  queryWords.forEach(word => {
    const regex = new RegExp(word, 'gi');
    const matches = contentLower.match(regex);
    if (matches) score += matches.length;
  });

  return score;
};

/**
 * Retrieve top-K relevant documents for a query
 */
const retrieveContext = async (query, participantEmail) => {
  // Fetch all context from DB
  const eventDocs = await getEventsContext();
  const participantDoc = await getParticipantContext(participantEmail);

  const allDocs = [...eventDocs];
  if (participantDoc) allDocs.push(participantDoc);

  // Score and rank
  const scored = allDocs.map(doc => ({
    ...doc,
    score: scoreRelevance(query, doc),
  }));

  // Check if it's an event list query
  const queryLower = query.toLowerCase();
  const isListQuery = ['all events', 'list events', 'available events', 'show events', 'upcoming events', 'what events', 'which events'].some(p => queryLower.includes(p));

  if (isListQuery) {
    // Return all event docs for list queries
    const eventResults = scored.filter(d => d.section.startsWith('Event:'));
    if (participantDoc) eventResults.push({ ...participantDoc, score: 1 });
    return eventResults;
  }

  // Check if personal query — always include participant context
  const isPersonal = ['my', 'i ', 'i\'m', 'i\'ve', 'my events', 'my registration', 'my certificate', 'my attendance', 'how many', 'am i'].some(p => queryLower.includes(p));

  let topDocs = scored.filter(d => d.score > 0).sort((a, b) => b.score - a.score).slice(0, 5);

  if (isPersonal && participantDoc && !topDocs.find(d => d.section === participantDoc.section)) {
    topDocs.unshift({ ...participantDoc, score: 100 });
  }

  // If nothing relevant found, return all event summaries as fallback
  if (topDocs.length === 0) {
    topDocs = scored.sort((a, b) => b.score - a.score).slice(0, 3);
  }

  return topDocs;
};

// ─────────────────────────────────────────────
// LLM: Send context + query to Gemini
// ─────────────────────────────────────────────

const buildPrompt = (query, contextDocs, conversationHistory = []) => {
  const contextText = contextDocs.map(doc => `--- ${doc.section} ---\n${doc.content}`).join('\n\n');

  const historyText = conversationHistory.length > 0
    ? conversationHistory.map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`).join('\n')
    : '';

  return `You are Planix AI Assistant, a helpful and friendly chatbot for the Planix event management platform. You help participants with event information, registration queries, attendance, certificates, and their personal participation history.

INSTRUCTIONS:
- Answer based ONLY on the provided context below. Do not make up information.
- If the context doesn't contain enough info to answer, say so politely and suggest what topics you can help with.
- Be concise but informative. Use bullet points and formatting for clarity.
- For personal queries (about "my" registrations, certificates, attendance), use the Participant Profile data from context.
- For event queries, use the Event data from context.
- If the user asks about event rules, refer to the rulebook content in the event data.
- Include relevant emojis sparingly to be friendly.
- When listing events, include key details like date, fee, type, and available seats.
- If a user greets you (hi, hello, etc.), respond warmly and briefly mention what you can help with.
- For follow-up questions, use the conversation history for context.

${historyText ? `CONVERSATION HISTORY:\n${historyText}\n` : ''}
CONTEXT FROM DATABASE:
${contextText}

USER QUERY: ${query}

Respond helpfully and naturally:`;
};

const generateGeminiResponse = async (query, contextDocs, conversationHistory = []) => {
  try {
    const prompt = buildPrompt(query, contextDocs, conversationHistory);

    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    return {
      success: true,
      response: text,
      sources: contextDocs.slice(0, 3).map(d => ({ section: d.section, score: d.score })),
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    return {
      success: false,
      response: "I'm sorry, I encountered an error processing your request. Please try again in a moment. 😅",
      sources: [],
    };
  }
};

// ─────────────────────────────────────────────
// API ROUTES
// ─────────────────────────────────────────────

/**
 * @desc    Chat with AI assistant (RAG + Gemini)
 * @route   POST /api/chatbot/chat
 * @access  Authenticated participants
 */
router.post('/chat', verifyToken, async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }

    const participantEmail = req.user?.email || null;

    console.log(`🤖 Chatbot query from ${participantEmail || 'anonymous'}: "${message}"`);

    // RAG: Retrieve relevant context
    const contextDocs = await retrieveContext(message, participantEmail);

    console.log(`🔍 RAG retrieved ${contextDocs.length} documents:`, contextDocs.map(d => `${d.section} (score: ${d.score})`));

    // LLM: Generate response via Gemini  
    const result = await generateGeminiResponse(message, contextDocs, conversationHistory);

    res.json({
      success: true,
      data: {
        response: result.response,
        sources: result.sources,
      },
    });
  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing chat request',
      error: error.message,
    });
  }
});

/**
 * @desc    Get context data for chatbot (events summary)
 * @route   GET /api/chatbot/context
 * @access  Authenticated participants
 */
router.get('/context', verifyToken, async (req, res) => {
  try {
    const participantEmail = req.user?.email || null;

    const eventDocs = await getEventsContext();
    const participantDoc = await getParticipantContext(participantEmail);

    res.json({
      success: true,
      data: {
        eventsCount: eventDocs.length,
        hasParticipantData: !!participantDoc,
        participantName: participantDoc ? req.user.name : null,
      },
    });
  } catch (error) {
    console.error('Context fetch error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching context',
    });
  }
});

/**
 * @desc    Get suggested questions based on user context
 * @route   GET /api/chatbot/suggestions
 * @access  Authenticated participants
 */
router.get('/suggestions', verifyToken, async (req, res) => {
  try {
    const participantEmail = req.user?.email || null;

    const baseQuestions = [
      "What events are available for registration?",
      "How do I register for an event?",
      "Tell me about the event rules",
    ];

    if (participantEmail) {
      const registrations = await Participant.find({ email: participantEmail });
      if (registrations.length > 0) {
        baseQuestions.push("What's my attendance rate?");
        baseQuestions.push("How many certificates do I have?");
      } else {
        baseQuestions.push("What free events are available?");
        baseQuestions.push("Which workshops can I join?");
      }
    }

    res.json({
      success: true,
      data: { suggestions: baseQuestions.slice(0, 5) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching suggestions' });
  }
});

export default router;
