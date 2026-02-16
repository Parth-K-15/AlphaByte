import { useState } from "react";
import { Outlet } from "react-router-dom";
import SpeakerSidebar from "../components/speaker/Sidebar";
import SpeakerHeader from "../components/speaker/Header";

const SpeakerLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gradient-to-br from-emerald-50 via-teal-50/30 to-cyan-50/40 dark:from-[#0f0f14] dark:via-[#12121c] dark:to-[#161622] relative overflow-hidden transition-colors duration-300">
      {/* Animated background orbs */}
      <div className="absolute top-0 left-1/4 w-64 h-64 lg:w-96 lg:h-96 bg-emerald-400/10 dark:bg-emerald-500/5 rounded-full blur-3xl animate-pulse"></div>
      <div
        className="absolute bottom-0 right-1/4 w-64 h-64 lg:w-96 lg:h-96 bg-teal-400/10 dark:bg-teal-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 w-64 h-64 lg:w-96 lg:h-96 bg-cyan-400/10 dark:bg-cyan-500/5 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "2s" }}
      ></div>

      <SpeakerSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col overflow-hidden relative z-0 w-full min-w-0">
        <SpeakerHeader
          mobileOpen={mobileOpen}
          setMobileOpen={setMobileOpen}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default SpeakerLayout;
