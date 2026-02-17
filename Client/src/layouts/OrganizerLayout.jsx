import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import OrganizerSidebar from "../components/organizer/Sidebar";
import OrganizerHeader from "../components/organizer/Header";
import { PermissionProvider } from "../context/PermissionContext";

const OrganizerLayout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [routeLoading, setRouteLoading] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setRouteLoading(true);
    const timer = setTimeout(() => setRouteLoading(false), 450);
    return () => clearTimeout(timer);
  }, [location.pathname]);

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
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={"organizer-sweep-" + location.pathname}
              className="fixed inset-0 z-[100] pointer-events-none origin-top bg-dark"
              initial={{ scaleY: 1 }}
              animate={{ scaleY: 0 }}
              transition={{ duration: 0.5, ease: [0.76, 0, 0.24, 1] }}
            />
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              className="max-w-full"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: "easeOut", delay: 0.16 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>

          <AnimatePresence>
            {routeLoading && (
              <motion.div
                className="absolute inset-0 z-[90] pointer-events-none bg-dark/10 backdrop-blur-[1px]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="h-full w-full flex items-center justify-center">
                  <motion.div
                    className="w-10 h-10 border-2 border-dark/20 border-t-dark rounded-full"
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
    </PermissionProvider>
  );
};

export default OrganizerLayout;
