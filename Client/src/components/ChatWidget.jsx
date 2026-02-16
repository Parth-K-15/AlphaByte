import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  RefreshCw,
  Loader2,
  Sparkles,
  MessageSquare,
  Minimize2,
} from 'lucide-react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://eventsync-blue.vercel.app/api';

/**
 * ChatWidget Component
 * Floating chat widget powered by RAG + Gemini LLM
 */
const ChatWidget = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hi there! 👋 I'm your AlphaByte AI Assistant. \n\nI can help you with:\n• Finding event details & rules\n• Checking your registration status\n• Downloading certificates\n• Scanning QR codes\n\nHow can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (isOpen) {
      if (suggestedQuestions.length === 0) fetchInitialData();
      // Scroll to bottom when opening
      setTimeout(scrollToBottom, 100);
    }
  }, [isOpen]);

  const fetchInitialData = async () => {
    try {
      const suggestionsRes = await fetch(`${API_BASE_URL}/chatbot/suggestions`, {
        headers: { ...getAuthHeader() },
      });
      const suggestionsData = await suggestionsRes.json();

      if (suggestionsData.success) {
        setSuggestedQuestions(suggestionsData.data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestedQuestions([
        'What events are upcoming?',
        'How do I earn certificates?',
        'Show my registrations',
      ]);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

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
      // Build conversation history (last 6 messages)
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
        
        // Update suggestions if provided in response, else generate locally
        if (data.data.suggestions) {
            setSuggestedQuestions(data.data.suggestions);
        } else {
            updateSuggestions(textToSend);
        }
      } else {
        throw new Error(data.message || 'Failed to get response');
      }
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: "I'm having trouble connecting right now. Please try again later! 🔌",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSuggestions = (query) => {
    const q = query.toLowerCase();
    if (q.includes('event')) {
      setSuggestedQuestions(['Show me upcoming events', 'Is there any hackathon?', 'Event rules']);
    } else if (q.includes('certificate')) {
        setSuggestedQuestions(['How to download certificate?', 'My generated certificates']);
    } else {
      setSuggestedQuestions(['Upcoming events', 'My profile', 'Contact support']);
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
        content: "Chat cleared! How can I help you with AlphaByte events today?",
        timestamp: new Date(),
      },
    ]);
    fetchInitialData();
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed bottom-24 right-6 w-full max-w-[400px] bg-white dark:bg-dark-600 rounded-3xl shadow-2xl flex flex-col z-50 border border-light-400 dark:border-white/10 transition-all duration-300 overflow-hidden ${
        isMinimized ? 'h-[70px]' : 'h-[600px]'
      }`}
    >
      {/* Header */}
      <div className="bg-dark text-white p-4 flex items-center justify-between shrink-0 relative overflow-hidden">
         {/* Decorative gradient blur */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-lime/20 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none"></div>

        <div className="flex items-center gap-3 relative z-10">
          <div className="p-2 bg-lime/20 rounded-xl">
            <Bot size={20} className="text-lime" />
          </div>
          <div>
            <h3 className="font-bold text-base leading-tight">AlphaByte AI</h3>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-lime animate-pulse"></span>
              <p className="text-xs text-lime/80 font-medium">Online</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 relative z-10">
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white"
            title={isMinimized ? "Maximize" : "Minimize"}
          >
            {isMinimized ? <MessageSquare size={18} /> : <Minimize2 size={18} />}
          </button>
          {!isMinimized && (
            <button
                onClick={clearChat}
                className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/70 hover:text-white"
                title="Clear chat"
            >
                <RefreshCw size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-light-100/50 dark:bg-dark-800/50 scrollbar-thin scrollbar-thumb-light-400 dark:scrollbar-thumb-white/10">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] p-3.5 relative group ${
                    msg.role === 'user'
                      ? 'bg-lime text-dark rounded-2xl rounded-tr-none shadow-sm'
                      : 'bg-white dark:bg-white/5 text-dark dark:text-white rounded-2xl rounded-tl-none shadow-sm border border-light-400/50 dark:border-white/5'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                  </p>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-black/5 dark:border-white/10">
                      <div className="flex items-center gap-1 mb-1.5">
                        <Sparkles size={10} className="text-dark/40 dark:text-white/40" />
                        <span className="text-[10px] uppercase font-bold text-dark/40 dark:text-white/40 tracking-wider">
                          Sources
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {msg.sources.map((source, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-black/5 dark:bg-white/10 text-dark/70 dark:text-white/70 px-2 py-0.5 rounded-full font-medium"
                          >
                            {source.section.replace('Event: ', '')}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <span className={`text-[10px] absolute bottom-1 right-2 opacity-0 group-hover:opacity-100 transition-opacity ${
                      msg.role === 'user' ? 'text-dark/40' : 'text-dark/30 dark:text-white/30'
                  }`}>
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white dark:bg-white/5 p-3 rounded-2xl rounded-tl-none border border-light-400/50 dark:border-white/5 shadow-sm flex items-center gap-2">
                  <Loader2 size={16} className="text-lime animate-spin" />
                  <span className="text-xs text-dark/50 dark:text-white/50 font-medium">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Suggestions & Input */}
          <div className="p-4 bg-white dark:bg-dark-600 border-t border-light-400 dark:border-white/5">
            {/* Suggested Questions Chips */}
            {suggestedQuestions.length > 0 && !isLoading && (
              <div className="mb-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {suggestedQuestions.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleSuggestedQuestion(q)}
                    className="whitespace-nowrap flex-shrink-0 px-3 py-1.5 bg-light-200 dark:bg-white/5 hover:bg-lime/20 dark:hover:bg-lime/10 hover:text-dark dark:hover:text-lime border border-transparent hover:border-lime/30 rounded-xl text-xs font-medium text-dark-300 dark:text-white/60 transition-all duration-200"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}

            {/* Input Area */}
            <div className="relative flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Ask about events, rules..."
                disabled={isLoading}
                className="flex-1 bg-light-200 dark:bg-black/20 text-dark dark:text-white placeholder:text-dark-300 dark:placeholder:text-white/30 text-sm rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-lime/50 transition-all"
              />
              <button
                onClick={() => sendMessage()}
                disabled={!input.trim() || isLoading}
                className={`p-3 rounded-xl transition-all duration-300 ${
                  input.trim() && !isLoading
                    ? 'bg-lime text-dark hover:shadow-lg hover:shadow-lime/20 transform hover:scale-105'
                    : 'bg-light-300 dark:bg-white/10 text-dark-300 dark:text-white/20 cursor-not-allowed'
                }`}
              >
                <Send size={18} className={input.trim() && !isLoading ? 'ml-0.5' : ''} />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};


export default ChatWidget;
