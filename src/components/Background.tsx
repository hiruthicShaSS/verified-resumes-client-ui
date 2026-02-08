import React from 'react';
import { motion } from 'framer-motion';

/**
 * Background component matching the landing page design
 * Use this on all pages for consistent theming
 */
export const Background: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
      {/* Base background */}
      <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-500" />
      
      {/* Gradients for atmosphere - matching landing page */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/20 dark:bg-blue-700/10 rounded-full blur-[120px]"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/20 dark:bg-indigo-800/10 rounded-full blur-[120px]"></div>
      
      {/* Abstract floating shapes */}
      <motion.div
        animate={{
          x: [0, 100, 0],
          y: [0, -50, 0],
          scale: [1, 1.2, 1],
          rotate: [0, 90, 0],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 dark:bg-blue-700/10 rounded-full blur-[100px]"
      />
      
      <motion.div
        animate={{
          x: [0, -100, 0],
          y: [0, 100, 0],
          scale: [1, 1.5, 1],
          rotate: [0, -60, 0],
        }}
        transition={{
          duration: 25,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-purple-400/10 dark:bg-purple-800/10 rounded-full blur-[120px]"
      />

      <motion.div
        animate={{
          x: [0, 50, -50, 0],
          y: [0, 50, 50, 0],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 5
        }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-300/5 dark:bg-indigo-800/5 rounded-full blur-[80px]"
      />
    </div>
  );
};
