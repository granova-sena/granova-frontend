import { useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function MagneticChip({ children, activo, onClick, className = "" }) {
  const ref = useRef(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 300, damping: 20 });
  const springY = useSpring(y, { stiffness: 300, damping: 20 });

  const scale = useMotionValue(1);
  const springScale = useSpring(scale, { stiffness: 300, damping: 20 });

  function manejarMouse(e) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) * 0.25);
    y.set((e.clientY - centerY) * 0.25);
    scale.set(1.08);
  }

  function salir() {
    x.set(0);
    y.set(0);
    scale.set(1);
  }

  return (
    <motion.button
      type="button"
      ref={ref}
      onClick={onClick}
      onMouseMove={manejarMouse}
      onMouseLeave={salir}
      style={{ x: springX, y: springY, scale: springScale }}
      className={`h-8 px-3.5 rounded-full text-xs font-medium border transition-colors shrink-0 whitespace-nowrap ${
        activo
          ? "bg-[#6FA98C] text-white border-[#6FA98C] shadow-lg shadow-[#6FA98C]/20"
          : "bg-transparent text-white/55 border-white/15 hover:border-white/40 hover:text-white"
      } ${className}`}
    >
      {children}
    </motion.button>
  );
}
