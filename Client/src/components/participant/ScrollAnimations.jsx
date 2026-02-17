import { motion as Motion, useInView } from "framer-motion";
import { useRef } from "react";

/* ─────────────────────────────────────────────
   Reusable scroll-triggered animation wrappers
   for the Participant side of the app.
   ───────────────────────────────────────────── */

// ── Fade-up on scroll ──
export const FadeUp = ({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
  amount = 0.15,
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount });

  return (
    <Motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </Motion.div>
  );
};

// ── Fade-in from left ──
export const FadeLeft = ({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount: 0.15 });

  return (
    <Motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: -40 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: -40 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </Motion.div>
  );
};

// ── Fade-in from right ──
export const FadeRight = ({
  children,
  delay = 0,
  duration = 0.5,
  className = "",
  once = true,
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount: 0.15 });

  return (
    <Motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, x: 40 }}
      animate={inView ? { opacity: 1, x: 0 } : { opacity: 0, x: 40 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </Motion.div>
  );
};

// ── Scale-up pop ──
export const ScaleUp = ({
  children,
  delay = 0,
  duration = 0.45,
  className = "",
  once = true,
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount: 0.15 });

  return (
    <Motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, scale: 0.85 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.85 }}
      transition={{ duration, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    >
      {children}
    </Motion.div>
  );
};

// ── Stagger children — wraps a list and staggers them ──
export const StaggerContainer = ({
  children,
  className = "",
  stagger = 0.08,
  once = true,
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount: 0.1 });

  return (
    <Motion.div
      ref={ref}
      className={className}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </Motion.div>
  );
};

// ── Individual stagger item — use inside StaggerContainer ──
export const StaggerItem = ({
  children,
  className = "",
  duration = 0.45,
}) => (
  <Motion.div
    className={className}
    variants={{
      hidden: { opacity: 0, y: 30 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration, ease: [0.25, 0.46, 0.45, 0.94] },
      },
    }}
  >
    {children}
  </Motion.div>
);

// ── Welcome text typing style reveal ──
export const TextReveal = ({
  children,
  delay = 0,
  duration = 0.6,
  className = "",
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });

  return (
    <Motion.div
      ref={ref}
      className={className}
      style={{ overflow: "hidden" }}
    >
      <Motion.div
        initial={{ y: "100%" }}
        animate={inView ? { y: 0 } : { y: "100%" }}
        transition={{ duration, delay, ease: [0.76, 0, 0.24, 1] }}
      >
        {children}
      </Motion.div>
    </Motion.div>
  );
};

// ── Blur-in effect ──
export const BlurIn = ({
  children,
  delay = 0,
  duration = 0.6,
  className = "",
  once = true,
}) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once, amount: 0.15 });

  return (
    <Motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, filter: "blur(10px)" }}
      animate={
        inView
          ? { opacity: 1, filter: "blur(0px)" }
          : { opacity: 0, filter: "blur(10px)" }
      }
      transition={{ duration, delay, ease: "easeOut" }}
    >
      {children}
    </Motion.div>
  );
};
