import { useState } from "react";
import { Outlet } from "react-router-dom";
import ParticipantSidebar from "../components/participant/Sidebar";
import ParticipantHeader from "../components/participant/Header";
import ChatWidget from "../components/ChatWidget";
import { MessageCircle, X } from "lucide-react";

const ParticipantLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-blue-50 via-purple-50/30 to-pink-50/40 dark:from-[#0f0f14] dark:via-[#12121c] dark:to-[#161622] relative overflow-hidden transition-colors duration-300">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-1/4 w-64 h-64 lg:w-96 lg:h-96 bg-blue-400/10 dark:bg-lime/5 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-0 right-1/4 w-64 h-64 lg:w-96 lg:h-96 bg-purple-400/10 dark:bg-indigo-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-64 h-64 lg:w-96 lg:h-96 bg-pink-400/10 dark:bg-purple-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <ParticipantSidebar
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative z-0 w-full min-w-0">
        <ParticipantHeader
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>

      {/* AI Chatbot Widget */}
      <ChatWidget isOpen={chatOpen} />

      {/* Floating Chat Toggle Button */}
      <button
        onClick={() => setChatOpen(!chatOpen)}
        className={`fixed bottom-24 right-6 z-[60] p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 ${
          chatOpen
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-xl"
        }`}
        title={chatOpen ? "Close chat" : "Chat with Planix AI"}
      >
        {chatOpen ? <X size={24} /> : <MessageCircle size={24} />}
      </button>
    </div>
  );
};

export default ParticipantLayout;
