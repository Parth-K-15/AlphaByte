import React, { useState, useEffect } from 'react';
import ChatWidget from '../../components/ChatWidget';
import { useAuth } from '../../context/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://eventsync-blue.vercel.app/api';

/**
 * ChatbotTest Page Component
 * Demo page for RAG + Gemini AI Chatbot functionality
 */
const ChatbotTest = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showTechDetails, setShowTechDetails] = useState(false);
  const { user } = useAuth();
  const [contextInfo, setContextInfo] = useState(null);

  useEffect(() => {
    const fetchContext = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/chatbot/context`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await res.json();
        if (data.success) setContextInfo(data.data);
      } catch (e) {
        console.error('Error fetching context:', e);
      }
    };
    fetchContext();
  }, []);

  const sampleQueries = [
    {
      category: 'Event Availability',
      icon: '📅',
      queries: [
        'What events are available for registration?',
        'Are there any free events?',
        'Which paid workshops are available?'
      ]
    },
    {
      category: 'Event Details',
      icon: '🎯',
      queries: [
        'Tell me about the React workshop',
        'What is the Full Stack Bootcamp about?',
        'When is the hackathon?'
      ]
    },
    {
      category: 'Fee Structure',
      icon: '💰',
      queries: [
        'What is the fee structure for events?',
        'How much does the hackathon cost?',
        'What payment methods do you accept?'
      ]
    },
    {
      category: 'Registration',
      icon: '📝',
      queries: [
        'How do I register for events?',
        'Can I cancel my registration?',
        'How many seats are available?'
      ]
    },
    {
      category: 'Certificates',
      icon: '🎓',
      queries: [
        'How many certificates do I have?',
        'When will I receive my certificate?',
        'What are the requirements for certificates?'
      ]
    },
    {
      category: 'Attendance',
      icon: '✅',
      queries: [
        'How is attendance marked?',
        "What's my attendance rate?",
        'How do I scan QR codes?'
      ]
    },
    {
      category: 'Personal',
      icon: '👤',
      queries: [
        'Which events am I registered for?',
        'Show my participation history',
        'How many events have I attended?'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="max-w-6xl mx-auto mb-8">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-6 text-white">
          <h1 className="text-3xl font-bold mb-2">
            🤖 AI Chatbot Assistant - Test Page
          </h1>
          <p className="text-blue-100">
            RAG (Retrieval-Augmented Generation) + Google Gemini AI powered intelligent assistant
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              🚀 Live Mode - Powered by Gemini AI
            </span>
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              📚 Knowledge Base: Real Database + Event Rulebooks
            </span>
            <span className="bg-white bg-opacity-20 px-3 py-1 rounded-full">
              💬 Context-Aware Responses
            </span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Introduction Card */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Welcome to the AI Chatbot Demo! 👋
          </h2>
          <p className="text-gray-600 mb-4">
            This intelligent assistant uses <strong>RAG (Retrieval-Augmented Generation)</strong> 
            combined with <strong>Google Gemini AI</strong> to answer your questions about:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
              <span className="text-2xl">📘</span>
              <div>
                <h3 className="font-semibold text-gray-800">Rulebook & Policies</h3>
                <p className="text-sm text-gray-600">Registration, attendance, certificates, cancellation</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
              <span className="text-2xl">📅</span>
              <div>
                <h3 className="font-semibold text-gray-800">Event Details</h3>
                <p className="text-sm text-gray-600">Schedules, venues, requirements, event types</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
              <span className="text-2xl">👤</span>
              <div>
                <h3 className="font-semibold text-gray-800">Personal History</h3>
                <p className="text-sm text-gray-600">Your registrations, certificates, attendance</p>
              </div>
            </div>
            
            <div className="flex items-start gap-3 p-4 bg-yellow-50 rounded-lg">
              <span className="text-2xl">❓</span>
              <div>
                <h3 className="font-semibold text-gray-800">General FAQs</h3>
                <p className="text-sm text-gray-600">Common questions and quick answers</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Click the floating chat button in the bottom-right corner to start chatting!
              The AI will understand your questions in natural language and provide contextual, personalized answers.
            </p>
          </div>
        </div>

        {/* Current User Context */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            👤 Your Profile Context
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            The chatbot uses your real profile and participation data from the database to answer personal questions:
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600">Name:</p>
                <p className="font-semibold text-gray-800">{user?.name || 'Not logged in'}</p>
              </div>
              <div>
                <p className="text-gray-600">Email:</p>
                <p className="font-semibold text-gray-800">{user?.email || 'N/A'}</p>
              </div>
              <div>
                <p className="text-gray-600">Events in Database:</p>
                <p className="font-semibold text-gray-800">{contextInfo?.eventsCount || 'Loading...'}</p>
              </div>
              <div>
                <p className="text-gray-600">Personal Data Available:</p>
                <p className="font-semibold text-gray-800">{contextInfo?.hasParticipantData ? '✅ Yes' : '❌ No registrations found'}</p>
              </div>
            </div>
          </div>

          <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-3 rounded text-sm text-green-800">
            <strong>✅ Live Data:</strong> The chatbot fetches real event details, your registrations, attendance records, and certificates directly from the MongoDB database on every query.
          </div>
        </div>

        {/* Sample Queries */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            💬 Try These Sample Queries
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Click any question below to test the chatbot's understanding and response quality:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sampleQueries.map((category, idx) => (
              <div key={idx} className="border border-gray-200 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <span className="text-2xl">{category.icon}</span>
                  {category.category}
                </h3>
                <div className="space-y-2">
                  {category.queries.map((query, qIdx) => (
                    <button
                      key={qIdx}
                      onClick={() => {
                        setIsChatOpen(true);
                        // The chat widget will need to handle this via a prop or state management
                      }}
                      className="w-full text-left px-3 py-2 text-sm bg-gray-50 hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded border border-gray-200 hover:border-blue-300 transition-colors"
                    >
                      "{query}"
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical Implementation Details */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <button
            onClick={() => setShowTechDetails(!showTechDetails)}
            className="w-full flex items-center justify-between text-left"
          >
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              🔧 Technical Implementation Details
            </h2>
            <span className="text-gray-500">
              {showTechDetails ? '▲' : '▼'}
            </span>
          </button>
          
          {showTechDetails && (
            <div className="mt-4 space-y-4 text-sm text-gray-600">
              <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border-l-4 border-green-600">
                <h3 className="font-semibold text-green-900 mb-2 flex items-center gap-2">
                  ✅ How It Works (Real RAG + Gemini Pipeline)
                </h3>
                <p className="text-green-800 text-sm mb-2">
                  This chatbot uses a <strong>real RAG pipeline</strong> with <strong>Google Gemini AI</strong> for natural language generation.
                  Data is fetched live from your MongoDB database.
                </p>
                <ol className="list-decimal list-inside space-y-2 ml-4 text-green-900">
                  <li><strong>User sends query</strong> via the chat widget to the backend API</li>
                  <li><strong>RAG Retrieval:</strong> Backend fetches events, participant registrations, attendance & certificates from MongoDB</li>
                  <li><strong>Relevance Scoring:</strong> Documents are scored against the query using keyword matching</li>
                  <li><strong>Context Building:</strong> Top relevant documents + participant profile are assembled as context</li>
                  <li><strong>Gemini Generation:</strong> Query + context + conversation history sent to Google Gemini 2.0 Flash API</li>
                  <li><strong>Response returned</strong> with source citations to the chat widget</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">🔍 RAG (Retrieval) Pipeline:</h3>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>User sends a query (e.g., "How do I register?")</li>
                  <li>Backend fetches all events from MongoDB with real-time participant counts</li>
                  <li>If user is authenticated, their registrations, attendance & certificates are fetched</li>
                  <li>Each document is scored for relevance against the query</li>
                  <li>Top 5 most relevant documents are selected as context</li>
                  <li>For event list queries, all event documents are included</li>
                  <li>Personal queries always include the participant's profile context</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">🧠 LLM (Generation) via Gemini:</h3>
                <ol className="list-decimal list-inside space-y-1 ml-4">
                  <li>A structured prompt is built with system instructions</li>
                  <li>Retrieved context documents are embedded in the prompt</li>
                  <li>Last 6 messages of conversation history are included for multi-turn context</li>
                  <li>The complete prompt is sent to Google Gemini 2.0 Flash API</li>
                  <li>Gemini generates a natural, context-aware response</li>
                  <li>Response is returned with source citations (which DB documents were used)</li>
                </ol>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">📚 Data Sources (Live from MongoDB):</h3>
                <div className="bg-gray-50 p-3 rounded font-mono text-xs">
                  <p>• <strong>Events Collection:</strong> All upcoming/ongoing/completed events with descriptions, dates, fees, seats, and rulebooks</p>
                  <p>• <strong>Participants Collection:</strong> User registrations per event, registration status</p>
                  <p>• <strong>Attendance Collection:</strong> QR scan records, attendance status per event</p>
                  <p>• <strong>Certificates Collection:</strong> Issued certificates, status, achievement type</p>
                  <p>• <strong>ParticipantAuth Collection:</strong> User profile (name, college, branch, year)</p>
                  <p className="mt-2 font-bold text-green-700">• All data is fetched in real-time on every query — no stale cache!</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">🔧 Architecture Components:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="font-semibold text-blue-900">Backend API</p>
                    <p className="text-xs text-blue-700">Express.js routes: POST /api/chatbot/chat, GET /api/chatbot/context, GET /api/chatbot/suggestions</p>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <p className="font-semibold text-purple-900">LLM Engine</p>
                    <p className="text-xs text-purple-700">Google Gemini 2.0 Flash via @google/generative-ai SDK</p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="font-semibold text-green-900">RAG Pipeline</p>
                    <p className="text-xs text-green-700">MongoDB → Document Scoring → Context Assembly → Gemini Prompt</p>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded">
                    <p className="font-semibold text-yellow-900">Authentication</p>
                    <p className="text-xs text-yellow-700">JWT token-based auth — chatbot uses logged-in participant's identity</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-800 mb-2">✨ Key Features:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Real-time database context</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Personalized answers from your data</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Source citations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Multi-turn conversation memory</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Event rulebook awareness</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-green-600">✅</span>
                    <span>Google Gemini AI generation</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Architecture Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            🏗️ System Architecture
          </h2>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b-2 border-gray-200">
                  <th className="text-left py-3 px-4">Component</th>
                  <th className="text-left py-3 px-4">Technology</th>
                  <th className="text-left py-3 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                <tr>
                  <td className="py-3 px-4 font-semibold">LLM</td>
                  <td className="py-3 px-4">Google Gemini 2.0 Flash</td>
                  <td className="py-3 px-4">Natural language generation via @google/generative-ai SDK</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">RAG Pipeline</td>
                  <td className="py-3 px-4">Custom Node.js</td>
                  <td className="py-3 px-4">MongoDB queries → relevance scoring → context assembly</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Data Source</td>
                  <td className="py-3 px-4">MongoDB Atlas</td>
                  <td className="py-3 px-4">Events, Participants, Attendance, Certificates — real-time</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Backend API</td>
                  <td className="py-3 px-4">Express.js</td>
                  <td className="py-3 px-4">/api/chatbot/chat, /context, /suggestions</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Authentication</td>
                  <td className="py-3 px-4">JWT</td>
                  <td className="py-3 px-4">User identity for personalized responses</td>
                </tr>
                <tr>
                  <td className="py-3 px-4 font-semibold">Frontend</td>
                  <td className="py-3 px-4">React + Tailwind</td>
                  <td className="py-3 px-4">Chat widget with conversation history & suggestions</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all z-40 animate-pulse"
        title="Open AI Chat"
      >
        {isChatOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* Chat Widget */}
      <ChatWidget isOpen={isChatOpen} onToggle={() => setIsChatOpen(!isChatOpen)} />
    </div>
  );
};

export default ChatbotTest;
