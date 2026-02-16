import React, { useState, useRef, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://eventsync-blue.vercel.app/api';

/**
 * ChatWidget Component
 * Floating chat widget powered by RAG + Gemini LLM
 */
const ChatWidget = ({ isOpen }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi! 👋 I'm Planix AI Assistant powered by Gemini AI. I can help you with:\n\n• Event details & registration\n• Attendance & QR codes\n• Certificates\n• Event rules & policies\n• Your participation history\n\nWhat would you like to know?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [contextInfo, setContextInfo] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch initial suggestions and context info
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [suggestionsRes, contextRes] = await Promise.all([
          fetch(`${API_BASE_URL}/chatbot/suggestions`, { headers: { ...getAuthHeader() } }),
          fetch(`${API_BASE_URL}/chatbot/context`, { headers: { ...getAuthHeader() } }),
        ]);

        const suggestionsData = await suggestionsRes.json();
        const contextData = await contextRes.json();

        if (suggestionsData.success) {
          setSuggestedQuestions(suggestionsData.data.suggestions);
        }
        if (contextData.success) {
          setContextInfo(contextData.data);
        }
      } catch (error) {
        console.error('Error fetching chatbot initial data:', error);
        setSuggestedQuestions([
          'What events are available?',
          'How do I register for events?',
          'Tell me about event rules',
        ]);
      }
    };

    fetchInitialData();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const sendMessage = async (messageText = null) => {
    const textToSend = messageText || input.trim();
    if (!textToSend || isLoading) return;

    const userMessage = {
      role: 'user',
      content: textToSend,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history (last 6 messages for context)
      const recentMessages = [...messages, userMessage]
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch(`${API_BASE_URL}/chatbot/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          message: textToSend,
          conversationHistory: recentMessages,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const assistantMessage = {
          role: 'assistant',
          content: data.data.response,
          sources: data.data.sources,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMessage]);

        // Update suggestions based on the query topic
        updateSuggestions(textToSend);
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      const errorMessage = {
        role: 'assistant',
        content:
          "Sorry, I encountered an error processing your request. Please make sure you're logged in and try again! 😅",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSuggestions = (query) => {
    const q = query.toLowerCase();
    if (q.includes('register') || q.includes('registration')) {
      setSuggestedQuestions([
        'How do I cancel my registration?',
        'What events are available?',
        'What are the event rules?',
      ]);
    } else if (q.includes('certificate')) {
      setSuggestedQuestions([
        'How many certificates do I have?',
        'When will I receive my certificate?',
        "What's my attendance rate?",
      ]);
    } else if (q.includes('attendance')) {
      setSuggestedQuestions([
        'How do I scan QR codes?',
        'Which events have I attended?',
        'Do I need 100% attendance for certificates?',
      ]);
    } else if (q.includes('event')) {
      setSuggestedQuestions([
        'Are there any free events?',
        'Tell me about the hackathon',
        'What workshops are available?',
      ]);
    } else if (q.includes('rule') || q.includes('rulebook')) {
      setSuggestedQuestions([
        'What is the code of conduct?',
        'What are the scoring rules?',
        'What are the technical requirements?',
      ]);
    } else {
      setSuggestedQuestions([
        'What events are available?',
        'Show my participation history',
        'Tell me about event rules',
      ]);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (question) => {
    sendMessage(question);
  };

  const clearChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: 'Chat cleared! What would you like to know? 😊',
        timestamp: new Date(),
      },
    ]);
    setSuggestedQuestions([
      'What events are available?',
      'How do I register for events?',
      'Tell me about event rules',
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-24 right-6 w-full max-w-md h-[600px] bg-white rounded-lg shadow-2xl flex flex-col z-50 border border-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg flex items-center gap-2">
            🤖 Planix AI Assistant
          </h3>
          <p className="text-sm opacity-90">Powered by RAG + Gemini AI</p>
        </div>
        <button
          onClick={clearChat}
          className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded transition-colors"
          title="Clear chat"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      {/* Context Info Bar */}
      {contextInfo && (
        <div className="px-4 py-2 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 flex items-center gap-2">
          <span className="inline-block w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          Connected to database • {contextInfo.eventsCount} events loaded
          {contextInfo.hasParticipantData && ` • Hi, ${contextInfo.participantName}`}
        </div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] ${
                msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-lg rounded-br-none'
                  : 'bg-white text-gray-800 rounded-lg rounded-bl-none shadow-sm border border-gray-200'
              } p-3`}
            >
              <p className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </p>
              
              {/* Show sources if available */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Sources:</p>
                  <div className="flex flex-wrap gap-1">
                    {msg.sources.map((source, i) => (
                      <span
                        key={i}
                        className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded"
                      >
                        {source.section}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <p className="text-xs opacity-70 mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
                <span className="text-xs text-gray-400 ml-2">Thinking with Gemini AI...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      {!isLoading && suggestedQuestions.length > 0 && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-2">Suggested questions:</p>
          <div className="flex flex-wrap gap-2">
            {suggestedQuestions.map((question, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestedQuestion(question)}
                className="text-xs bg-white border border-gray-300 text-gray-700 px-3 py-1.5 rounded-full hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700 transition-colors"
              >
                {question}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 bg-white border-t border-gray-200 rounded-b-lg">
        <div className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            disabled={isLoading}
            maxLength={500}
          />
          <button
            onClick={() => sendMessage()}
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 text-white px-4 py-2.5 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            title="Send message"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        
        {/* Character count */}
        <div className="flex justify-between items-center mt-2">
          <p className="text-xs text-gray-400">
            Press Enter to send
          </p>
          <p className="text-xs text-gray-400">
            {input.length}/500
          </p>
        </div>
      </div>
    </div>
  );
};

export default ChatWidget;
