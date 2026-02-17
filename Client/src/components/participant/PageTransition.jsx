import { motion as Motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

/**
 * Green-shade page transition overlay that sweeps in and fades out
 * on every route change inside the participant layout.
 */
const PageTransition = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Motion.div key={location.pathname} className="relative w-full">
        {/* ── Green sweep overlay ── */}
        <Motion.div
          className="fixed inset-0 z-[9999] pointer-events-none bg-lime"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          exit={{ scaleY: 1 }}
          transition={{ duration: 0.45, ease: [0.76, 0, 0.24, 1] }}
          style={{ transformOrigin: "top" }}
        />

        {/* ── Page content fade-in ── */}
        <Motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.35, ease: "easeOut", delay: 0.15 }}
        >
          {children}
        </Motion.div>
      </Motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
