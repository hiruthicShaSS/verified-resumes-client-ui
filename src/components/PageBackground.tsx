import React from 'react';

/**
 * Reusable background component that matches the landing page design
 * Use this on all pages for consistent theming
 */
export const PageBackground: React.FC = () => {
  return (
    <>
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-slate-50 dark:bg-slate-950 transition-colors duration-500" />
        
        {/* Gradients for atmosphere - matching landing page */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/20 dark:bg-blue-700/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/20 dark:bg-indigo-800/10 rounded-full blur-[120px]"></div>
      </div>
    </>
  );
};
