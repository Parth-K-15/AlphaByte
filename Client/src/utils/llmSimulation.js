/**
 * LLM Response Simulation
 * Simulates GPT-4/LLM responses using template-based generation
 * In production, this would call OpenAI/Gemini/Llama API
 */

import { retrieveContext } from '../utils/ragSimulation';

/**
 * Generate response using retrieved context (simulated LLM)
 * This simulates what GPT-4 would do: take context + query and generate coherent response
 */
export const generateResponse = async (userQuery) => {
  // Simulate API delay (realistic experience)
  await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 400));
  
  // Step 1: Retrieve context using RAG
  const context = retrieveContext(userQuery);
  
  console.log('🔍 RAG Retrieved:', {
    query: userQuery,
    hasRelevantDocs: context.hasRelevantDocs,
    isPersonalQuery: context.isPersonalQuery,
    docsFound: context.relevantDocs?.length || 0,
    topDocs: context.relevantDocs?.map(d => ({ section: d.section, score: d.score }))
  });
  
  // Step 2: Handle greetings directly
  if (context.isGreeting) {
    return {
      response: context.response,
      sources: [],
      isFromKnowledgeBase: false
    };
  }
  
  // Step 3: Generate response based on context
  const response = generateContextualResponse(userQuery, context);
  
  return {
    response,
    sources: context.topSources || [],
    isFromKnowledgeBase: context.hasRelevantDocs
  };
};

/**
 * Generate contextual response (simulates LLM's natural language generation)
 */
const generateContextualResponse = (query, context) => {
  // No relevant context found
  if (!context.hasRelevantDocs && !context.isPersonalQuery) {
    return `I don't have specific information about that in my knowledge base. However, I can help you with:

• Event registration and details
• Attendance and QR code scanning
• Certificate queries
• Rules and policies
• Your personal participation history

Could you rephrase your question or ask about one of these topics?`;
  }
  
  // Personal query with user context
  if (context.isPersonalQuery && context.userContext) {
    return generatePersonalResponse(query, context);
  }
  
  // General query with knowledge base context - USE THE RETRIEVED DOCS
  if (context.hasRelevantDocs && context.relevantDocs && context.relevantDocs.length > 0) {
    return generateKnowledgeBasedResponse(query, context);
  }
  
  // Fallback
  return "I'm not sure how to answer that. Could you please rephrase your question?";
};

/**
 * Generate response for personal queries
 */
const generatePersonalResponse = (query, context) => {
  const queryLower = query.toLowerCase();
  
  // Certificate queries
  if (queryLower.includes('certificate')) {
    if (queryLower.includes('how many') || queryLower.includes('total')) {
      return `Based on your profile, you have earned **2 certificates** so far! 🎉

Here are your certificates:
1. **Python Workshop** - Issued on February 15, 2026
2. **Git & GitHub Session** - Issued on February 1, 2026

You can download these certificates anytime from the "My Certificates" section in your profile. Keep participating in events to earn more! 🏆`;
    }
    
    if (queryLower.includes('where') || queryLower.includes('download')) {
      return `You can download your certificates from the **"My Certificates"** section. Here's how:

1. Click on your profile icon
2. Navigate to "My Certificates"
3. Find the certificate you want
4. Click the "Download" button

You currently have 2 certificates available:
• Python Workshop
• Git & GitHub Session

Certificates are typically issued within 7-10 working days after event completion. ✅`;
    }
    
    return `You have **2 certificates** in your account:

1. Python Workshop (Issued: Feb 15, 2026)
2. Git & GitHub Session (Issued: Feb 1, 2026)

To earn more certificates:
• Register for upcoming events
• Attend at least 80% of the event duration
• Complete any post-event requirements
• Download from "My Certificates" section after 7-10 days

Keep up the great work! 🎓`;
  }
  
  // Registration queries
  if (queryLower.includes('registered') || queryLower.includes('registration')) {
    return `You are currently registered for **2 upcoming events**: 📅

1. **React Fundamentals Workshop** - Status: Upcoming
2. **AI & Machine Learning Seminar** - Status: Upcoming

You've attended **2 events** in the past:
• Python Workshop (Feb 10, 2026)
• Git & GitHub Session (Jan 25, 2026)

Your attendance rate is **85%** - excellent commitment! 🌟

To view more details or cancel a registration, go to "My Registrations" in your profile.`;
  }
  
  // Attendance queries
  if (queryLower.includes('attendance') || queryLower.includes('attended')) {
    return `Your participation record looks great! 📊

**Attendance Rate**: 85% ✅

**Recently Attended Events**:
1. Python Workshop - February 10, 2026
2. Git & GitHub Session - January 25, 2026

**Total Events Participated**: 4

Keep maintaining this excellent attendance rate! Remember:
• Scan QR codes when you arrive at events
• 80%+ attendance required for certificates
• Consistent attendance improves your priority for future events

Great job! 🎯`;
  }
  
  // Default personal response
  return `Here's your participation summary:

**Profile**: ${context.userContext}

Need specific information? Try asking:
• "How many certificates do I have?"
• "Which events am I registered for?"
• "What's my attendance rate?"

I'm here to help! 😊`;
};

/**
 * Generate response based on knowledge base
 * This function ACTUALLY USES the retrieved documents from RAG
 * It intelligently extracts and formats content based on the query
 */
const generateKnowledgeBasedResponse = (query, context) => {
  const queryLower = query.toLowerCase();
  const relevantDocs = context.relevantDocs || [];
  
  if (relevantDocs.length === 0) {
    return "I couldn't find specific information about that in my knowledge base. Could you please rephrase your question?";
  }
  
  // Check if this is an event list query with multiple event documents
  const eventDocs = relevantDocs.filter(doc => doc.section && doc.section.startsWith('Event:'));
  
  // If asking for event list and we have multiple event documents, format as list
  if (context.isEventListQuery && eventDocs.length > 1) {
    console.log(`📋 Formatting ${eventDocs.length} events as list`);
    return generateEventListResponse(eventDocs, query);
  }
  
  // Get top document (highest RAG score)
  const topDoc = relevantDocs[0];
  
  console.log(`📄 Using document: ${topDoc.section} (RAG score: ${topDoc.score})`);
  
  // Extract and analyze content from the retrieved document
  const extractedInfo = extractRelevantContent(topDoc.content, queryLower);
  
  // Generate natural response using the extracted content
  let response = generateNaturalAnswer(query, topDoc.section, extractedInfo);
  
  // Add related information from other retrieved documents
  if (relevantDocs.length > 1) {
    const relatedSections = relevantDocs
      .slice(1, 3)
      .map(doc => doc.section)
      .filter(section => section !== topDoc.section);
    
    if (relatedSections.length > 0) {
      response += `\n\n**📚 Related Topics**: ${relatedSections.join(', ')}`;
    }
  }
  
  response += `\n\n💬 Ask me anything else about events, registration, certificates, or attendance!`;
  
  return response;
};

/**
 * Generate formatted list of events
 * Used when user asks for "all events" or "list of events"
 */
const generateEventListResponse = (eventDocs, query) => {
  const queryLower = query.toLowerCase();
  
  // Parse event information from documents
  const events = eventDocs.map(doc => {
    const lines = doc.content.split('\n');
    const eventInfo = {};
    
    lines.forEach(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('Type:')) eventInfo.type = trimmed.replace('Type:', '').trim();
      if (trimmed.startsWith('Date:')) eventInfo.date = trimmed.replace('Date:', '').trim();
      if (trimmed.startsWith('Fee:')) eventInfo.fee = trimmed.replace('Fee:', '').trim();
      if (trimmed.startsWith('Available Seats:')) eventInfo.seats = trimmed.replace('Available Seats:', '').trim();
      if (trimmed.startsWith('Registration Status:')) eventInfo.status = trimmed.replace('Registration Status:', '').trim();
    });
    
    // Extract event name from section
    const eventName = doc.section.replace('Event:', '').trim();
    
    return {
      name: eventName,
      ...eventInfo,
      score: doc.score
    };
  });
  
  // Determine filter based on query
  let filteredEvents = events;
  const isFreeQuery = queryLower.includes('free') || queryLower.includes('no cost') || queryLower.includes('zero fee');
  const isPaidQuery = queryLower.includes('paid') || queryLower.includes('fee') && !isFreeQuery;
  const isWorkshopQuery = queryLower.includes('workshop');
  const isSeminarQuery = queryLower.includes('seminar');
  const isHackathonQuery = queryLower.includes('hackathon');
  
  if (isFreeQuery) {
    filteredEvents = events.filter(e => e.fee && e.fee.toLowerCase().includes('free'));
  } else if (isPaidQuery) {
    filteredEvents = events.filter(e => e.fee && !e.fee.toLowerCase().includes('free'));
  } else if (isWorkshopQuery) {
    filteredEvents = events.filter(e => e.type && e.type.toLowerCase().includes('workshop'));
  } else if (isSeminarQuery) {
    filteredEvents = events.filter(e => e.type && e.type.toLowerCase().includes('seminar'));
  } else if (isHackathonQuery) {
    filteredEvents = events.filter(e => e.type && e.type.toLowerCase().includes('hackathon'));
  }
  
  // Build response
  let response = '';
  
  if (filteredEvents.length === 0) {
    return `I found ${events.length} events in total, but none match your specific criteria. Try asking about "all available events" to see the complete list!`;
  }
  
  // Opening line
  if (isFreeQuery) {
    response = `Here are all the **FREE events** currently available (${filteredEvents.length} events):\n\n`;
  } else if (isPaidQuery) {
    response = `Here are all the **PAID events** currently available (${filteredEvents.length} events):\n\n`;
  } else if (isWorkshopQuery) {
    response = `Here are all the **WORKSHOPS** currently available (${filteredEvents.length} events):\n\n`;
  } else {
    response = `Here are all **${filteredEvents.length} events** currently available for registration:\n\n`;
  }
  
  // Format each event
  filteredEvents.forEach((event, index) => {
    response += `**${index + 1}. ${event.name}**\n`;
    if (event.type) response += `   📌 Type: ${event.type}\n`;
    if (event.date) response += `   📅 Date: ${event.date}\n`;
    if (event.fee) response += `   💰 Fee: ${event.fee}\n`;
    if (event.seats) response += `   🪑 Seats: ${event.seats}\n`;
    if (event.status) response += `   ✅ Status: ${event.status}\n`;
    response += '\n';
  });
  
  // Add helpful footer
  response += `---\n\n`;
  
  // Categorize by type
  const types = [...new Set(filteredEvents.map(e => e.type).filter(Boolean))];
  if (types.length > 1) {
    response += `**Event Types Available**: ${types.join(', ')}\n\n`;
  }
  
  // Categorize by fee
  const freeCount = filteredEvents.filter(e => e.fee && e.fee.toLowerCase().includes('free')).length;
  const paidCount = filteredEvents.length - freeCount;
  if (freeCount > 0 && paidCount > 0) {
    response += `**Fee Structure**: ${freeCount} Free, ${paidCount} Paid\n\n`;
  }
  
  response += `💡 **Want details about a specific event?** Just ask: "Tell me about [event name]"\n`;
  response += `📝 **Ready to register?** Visit the Events page to sign up!`;
  
  return response;
};

/**
 * Extract relevant content from document based on query
 * This simulates what an LLM does: understanding which parts are most relevant
 */
const extractRelevantContent = (content, queryLower) => {
  // Parse the content structure
  const lines = content.split('\n').filter(line => line.trim());
  
  // Identify query keywords
  const queryKeywords = queryLower
    .replace(/[?,.!]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3); // Filter short words
  
  // Score each line based on keyword matches
  const scoredLines = lines.map(line => {
    const lineLower = line.toLowerCase();
    let score = 0;
    
    queryKeywords.forEach(keyword => {
      if (lineLower.includes(keyword)) {
        score += 5;
      }
    });
    
    // Bonus for numbered items (usually important steps)
    if (/^\d+\./.test(line.trim())) {
      score += 2;
    }
    
    // Bonus for bullet points
    if (/^[-•]/.test(line.trim())) {
      score += 1;
    }
    
    return { line, score };
  });
  
  // Get all lines with score > 0, or all lines if none scored
  let relevantLines = scoredLines.filter(item => item.score > 0);
  
  if (relevantLines.length === 0) {
    // If no specific matches, use all content
    relevantLines = scoredLines;
  }
  
  // Sort by score and get content
  relevantLines.sort((a, b) => b.score - a.score);
  
  // Group content intelligently
  const steps = [];
  const bullets = [];
  const sentences = [];
  
  relevantLines.forEach(item => {
    const line = item.line.trim();
    if (/^\d+\./.test(line)) {
      steps.push(line);
    } else if (/^[-•]/.test(line)) {
      bullets.push(line.replace(/^[-•]\s*/, ''));
    } else if (line.length > 10) {
      sentences.push(line);
    }
  });
  
  return {
    steps: steps.slice(0, 10), // Limit to 10 steps
    bullets: bullets.slice(0, 8), // Limit to 8 bullets
    sentences: sentences.slice(0, 5), // Limit to 5 sentences
    hasSteps: steps.length > 0,
    hasBullets: bullets.length > 0,
    rawContent: relevantLines.map(item => item.line).join('\n')
  };
};

/**
 * Generate natural answer from extracted content
 * This simulates LLM's ability to format information naturally
 */
const generateNaturalAnswer = (query, section, extractedInfo) => {
  const queryLower = query.toLowerCase();
  
  // Detect query type to adjust tone
  const isHowTo = /^(how|what|where|when|can i|do i)/i.test(query.trim());
  const isYesNo = /^(is|are|does|do|can|will)/i.test(query.trim());
  
  let response = '';
  
  // Opening based on section
  if (isHowTo) {
    response = `Here's what you need to know about **${section}**:\n\n`;
  } else {
    response = `Based on our **${section}** guidelines:\n\n`;
  }
  
  // Format steps if present (procedural content)
  if (extractedInfo.hasSteps && extractedInfo.steps.length > 0) {
    extractedInfo.steps.forEach(step => {
      response += `${step}\n`;
    });
    response += '\n';
  }
  
  // Format bullets if present (criteria/requirements)
  if (extractedInfo.hasBullets && extractedInfo.bullets.length > 0) {
    extractedInfo.bullets.forEach(bullet => {
      response += `• ${bullet}\n`;
    });
    response += '\n';
  }
  
  // Add sentences (additional information)
  if (extractedInfo.sentences.length > 0) {
    extractedInfo.sentences.forEach(sentence => {
      if (sentence.length > 10 && !extractedInfo.steps.includes(sentence)) {
        response += `${sentence}\n`;
      }
    });
  }
  
  // If no structured content, use raw content
  if (!extractedInfo.hasSteps && !extractedInfo.hasBullets && extractedInfo.sentences.length === 0) {
    response += extractedInfo.rawContent + '\n';
  }
  
  // Add emoji based on section type
  const sectionLower = section.toLowerCase();
  if (sectionLower.includes('certificate')) {
    response += '\n🎓 **Remember**: Meet all eligibility criteria to earn your certificate!';
  } else if (sectionLower.includes('registration')) {
    response += '\n✅ **Quick Tip**: Register early to secure your spot!';
  } else if (sectionLower.includes('attendance')) {
    response += '\n📱 **Pro Tip**: Keep your QR code ready before entering the venue!';
  } else if (sectionLower.includes('cancel')) {
    response += '\n⚠️ **Note**: Cancel as early as possible to avoid penalties!';
  } else if (sectionLower.includes('refund')) {
    response += '\n💰 **Important**: Earlier cancellations get higher refunds!';
  }
  
  return response.trim();
};

/**
 * Get suggested follow-up questions based on query
 */
export const getSuggestedQuestions = (query) => {
  const queryLower = query.toLowerCase();
  
  if (queryLower.includes('register')) {
    return [
      "How do I cancel my registration?",
      "What types of events are available?",
      "How is attendance marked?"
    ];
  }
  
  if (queryLower.includes('certificate')) {
    return [
      "How many certificates do I have?",
      "What are the requirements for certificates?",
      "When will I receive my certificate?"
    ];
  }
  
  if (queryLower.includes('attendance')) {
    return [
      "How do I scan QR codes?",
      "What's my attendance rate?",
      "Do I need 100% attendance for certificates?"
    ];
  }
  
  // Default suggestions
  return [
    "How do I register for events?",
    "How can I get certificates?",
    "What types of events are available?"
  ];
};

export default {
  generateResponse,
  getSuggestedQuestions
};
