import { useState } from "react";
import { Outlet } from "react-router-dom";
import OrganizerSidebar from "../components/organizer/Sidebar";
import OrganizerHeader from "../components/organizer/Header";
import { PermissionProvider } from "../context/PermissionContext";

const OrganizerLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <PermissionProvider>
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

      <OrganizerSidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />
      <div className="flex-1 flex flex-col overflow-hidden relative z-0 w-full min-w-0">
        <OrganizerHeader
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
    </PermissionProvider>
  );
};

export default OrganizerLayout;
