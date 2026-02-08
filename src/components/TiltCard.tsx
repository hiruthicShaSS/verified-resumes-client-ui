import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { DashboardCardProps } from '../types';

export const TiltCard: React.FC<DashboardCardProps & { onClick?: () => void }> = ({ title, description, icon: Icon, color, delay = 0, onClick }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  // Smooth out the mouse movement
  const mouseX = useSpring(x, { stiffness: 500, damping: 30 });
  const mouseY = useSpring(y, { stiffness: 500, damping: 30 });

  // Calculate rotation based on mouse position relative to card center
  const rotateX = useTransform(mouseY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(mouseX, [-0.5, 0.5], [-15, 15]);
  
  // Parallax effect for the icon inside the card
  const iconZ = useSpring(isHovered ? 50 : 0, { stiffness: 300, damping: 20 });
  const contentZ = useSpring(isHovered ? 30 : 0, { stiffness: 300, damping: 20 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;

    const rect = ref.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;

    const mouseXPos = e.clientX - rect.left;
    const mouseYPos = e.clientY - rect.top;

    // Normalize values between -0.5 and 0.5
    const xPct = (mouseXPos / width) - 0.5;
    const yPct = (mouseYPos / height) - 0.5;

    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="perspective-container h-full"
    >
      <motion.div
        ref={ref}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onMouseEnter={handleMouseEnter}
        onClick={onClick}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
        }}
        className="relative h-full w-full cursor-pointer rounded-2xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-xl border border-white/20 shadow-xl transition-shadow duration-300 hover:shadow-2xl hover:shadow-blue-500/20 p-8 flex flex-col items-center text-center group"
      >
        {/* Shine effect */}
        <div 
          className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
          style={{
            background: `radial-gradient(circle at 50% 0%, rgba(255,255,255,0.4) 0%, transparent 60%)`,
            mixBlendMode: 'overlay',
            zIndex: 10
          }}
        />

        <motion.div
          style={{ translateZ: iconZ }}
          className={`mb-6 p-4 rounded-2xl ${color} text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
        >
          <Icon size={32} strokeWidth={2} />
        </motion.div>

        <motion.div style={{ translateZ: contentZ }} className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">{title}</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            {description}
          </p>
        </motion.div>

        {/* Decorative corner accents */}
        <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 opacity-50" />
        <div className="absolute bottom-4 left-4 w-2 h-2 rounded-full bg-slate-200 dark:bg-slate-700 opacity-50" />
      </motion.div>
    </motion.div>
  );
};
