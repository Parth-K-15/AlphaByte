/**
 * RAG (Retrieval-Augmented Generation) Simulation
 * Simulates vector similarity search without actual embeddings
 * Uses simple keyword matching and TF-IDF-like scoring
 */

import { combinedKnowledgeBase, dummyUserData, greetingResponses } from '../pages/chatbot-test/knowledgeBase';

/**
 * Simple text preprocessing
 */
const preprocessText = (text) => {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
};

/**
 * Calculate similarity score between query and document
 * Simulates cosine similarity using keyword matching
 */
const calculateSimilarity = (query, document) => {
  const queryWords = preprocessText(query).split(' ');
  const docWords = preprocessText(document.content).split(' ');
  const docKeywords = document.keywords || [];
  
  let score = 0;
  
  // Check keyword matches (high weight)
  for (const keyword of docKeywords) {
    if (query.toLowerCase().includes(keyword.toLowerCase())) {
      score += 5; // Keywords get high weight
    }
  }
  
  // Check content word matches (medium weight)
  for (const word of queryWords) {
    if (word.length > 3) { // Ignore short words
      if (docWords.includes(word)) {
        score += 1;
      }
      // Partial matches
      if (docKeywords.some(kw => kw.includes(word) || word.includes(kw))) {
        score += 2;
      }
    }
  }
  
  // Boost score if section name matches query
  if (document.section && query.toLowerCase().includes(document.section.toLowerCase())) {
    score += 3;
  }
  
  return score;
};

/**
 * Check if query is a greeting or common phrase
 */
const checkGreeting = (query) => {
  const normalizedQuery = preprocessText(query);
  
  for (const greetingSet of greetingResponses) {
    for (const pattern of greetingSet.patterns) {
      if (normalizedQuery.includes(pattern)) {
        // Return random response from the set
        const responses = greetingSet.responses;
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }
  }
  
  return null;
};

/**
 * Check if query is about personal/user-specific information
 */
const isPersonalQuery = (query) => {
  const personalKeywords = [
    'my', 'i ', 'i\'m', 'i\'ve', 'my events', 'my registrations',
    'my certificates', 'my attendance', 'how many', 'which events'
  ];
  
  return personalKeywords.some(keyword => 
    query.toLowerCase().includes(keyword)
  );
};

/**
 * Generate user context for personal queries
 */
const getUserContext = (query) => {
  const userData = dummyUserData;
  
  // Determine what type of personal info is needed
  if (query.toLowerCase().includes('certificate')) {
    return `
User: ${userData.name}
Total Certificates Earned: ${userData.totalCertificates}
Certificates:
${userData.certificates.map(cert => `- ${cert.eventName} (Issued: ${cert.issuedDate})`).join('\n')}
You can download your certificates from the "My Certificates" section.`;
  }
  
  if (query.toLowerCase().includes('registered') || query.toLowerCase().includes('registration')) {
    return `
User: ${userData.name}
Current Registrations:
${userData.registeredEvents.map(evt => `- ${evt.name} (${evt.status})`).join('\n')}
Total Events Attended: ${userData.attendedEvents.length}`;
  }
  
  if (query.toLowerCase().includes('attended') || query.toLowerCase().includes('attendance')) {
    return `
User: ${userData.name}
Attendance Rate: ${(userData.attendanceRate * 100).toFixed(0)}%
Recently Attended Events:
${userData.attendedEvents.map(evt => `- ${evt.name} (${evt.date})`).join('\n')}
Total Events Attended: ${userData.attendedEvents.length}`;
  }
  
  // General user info
  return `
User: ${userData.name}
Department: ${userData.department}, Year ${userData.year}
Total Events Participated: ${userData.totalEvents}
Total Certificates: ${userData.totalCertificates}
Attendance Rate: ${(userData.attendanceRate * 100).toFixed(0)}%`;
};

/**
 * Check if query is asking for a list of events
 */
const isEventListQuery = (query) => {
  const listPatterns = [
    'all events', 'list events', 'events list', 'available events',
    'show events', 'give me events', 'what events', 'which events are available',
    'upcoming events', 'current events', 'event list', 'list of events',
    'all the events', 'show me all', 'give me all', 'types of events available'
  ];
  
  const queryLower = query.toLowerCase();
  return listPatterns.some(pattern => queryLower.includes(pattern));
};

/**
 * Retrieve relevant documents (simulates vector search)
 * @param {string} query - User's question
 * @param {number} topK - Number of documents to retrieve
 * @returns {Array} Relevant documents with scores
 */
export const retrieveRelevantDocs = (query, topK = 3) => {
  // Check if this is a "list all events" type query
  const wantsEventList = isEventListQuery(query);
  
  // Calculate similarity for all documents
  const scoredDocs = combinedKnowledgeBase.map(doc => ({
    ...doc,
    score: calculateSimilarity(query, doc)
  }));
  
  // If asking for event list, retrieve ALL event documents
  if (wantsEventList) {
    const eventDocs = scoredDocs
      .filter(doc => doc.section && doc.section.startsWith('Event:'))
      .sort((a, b) => b.score - a.score);
    
    // If we found event documents, return all of them
    if (eventDocs.length > 0) {
      return eventDocs;
    }
  }
  
  // Regular query: Sort by score (descending) and take top K
  const relevantDocs = scoredDocs
    .filter(doc => doc.score > 0) // Only include docs with some relevance
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
  
  return relevantDocs;
};

/**
 * Build context for LLM from retrieved documents
 * @param {Array} documents - Retrieved documents
 * @param {string} query - User's query
 * @returns {Object} Context object with general and user-specific info
 */
export const buildContext = (documents, query) => {
  // Check if it's a personal query
  const includeUserContext = isPersonalQuery(query);
  
  // Build general knowledge context
  const generalContext = documents.length > 0
    ? documents.map((doc, idx) => 
        `[Document ${idx + 1}] (Relevance: ${doc.score})\n${doc.content}`
      ).join('\n\n---\n\n')
    : 'No specific information found in knowledge base.';
  
  // Build user context if needed
  const userContext = includeUserContext 
    ? getUserContext(query)
    : '';
  
  return {
    generalContext,
    userContext,
    hasRelevantDocs: documents.length > 0,
    isPersonalQuery: includeUserContext,
    topSources: documents.slice(0, 3).map(doc => ({
      section: doc.section,
      id: doc.id
    }))
  };
};

/**
 * Main RAG retrieval function
 * @param {string} query - User's question
 * @returns {Object} Context and metadata for LLM
 */
export const retrieveContext = (query) => {
  // Check for greetings first
  const greetingResponse = checkGreeting(query);
  if (greetingResponse) {
    return {
      isGreeting: true,
      response: greetingResponse,
      generalContext: '',
      userContext: '',
      topSources: []
    };
  }
  
  // Check if this is an event list query
  const isListQuery = isEventListQuery(query);
  
  // Retrieve relevant documents (more if it's a list query)
  const topK = isListQuery ? 15 : 3;
  const relevantDocs = retrieveRelevantDocs(query, topK);
  
  // Build context
  const context = buildContext(relevantDocs, query);
  
  return {
    isGreeting: false,
    isEventListQuery: isListQuery,
    ...context,
    relevantDocs
  };
};

export default {
  retrieveContext,
  retrieveRelevantDocs,
  buildContext,
  isPersonalQuery,
  getUserContext
};
