import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase/config.ts';
import { LoginCard } from './LoginCard';
import './LoginPage.css';
import { ThemeToggle } from './ThemeToggle';
import { HowItWorksFlow } from './HowItWorksFlow';
import { FeaturesShowcase } from './FeaturesShowcase';
import { FileText, ShieldCheck, CheckCircle2, Users } from 'lucide-react';

interface LandingPageProps {
  onLogin?: () => void;
}

// Helper component for background 3D resumes
const FloatingResume = ({ className, delay = "0s" }: { className?: string, delay?: string }) => (
    <div 
        className={`absolute bg-white dark:bg-slate-800 w-64 h-80 rounded-lg shadow-xl border border-slate-100 dark:border-slate-700 p-6 flex flex-col gap-4 select-none pointer-events-none opacity-40 transition-colors duration-300 ${className}`}
        style={{ animation: `float 6s ease-in-out infinite ${delay}` }}
    >
        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 pb-4">
            <div className="w-10 h-10 rounded-full bg-slate-200/50 dark:bg-slate-700/50"></div>
            <div className="flex flex-col gap-1.5 w-full">
                <div className="w-2/3 h-3 bg-slate-200/50 dark:bg-slate-700/50 rounded-full"></div>
                <div className="w-1/2 h-2 bg-slate-100 dark:bg-slate-700/30 rounded-full"></div>
            </div>
        </div>
        <div className="space-y-2">
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/30 rounded-full"></div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/30 rounded-full"></div>
            <div className="w-3/4 h-2 bg-slate-100 dark:bg-slate-700/30 rounded-full"></div>
        </div>
        <div className="mt-2 space-y-2">
             <div className="w-1/3 h-3 bg-slate-200/50 dark:bg-slate-700/50 rounded-full mb-2"></div>
            <div className="w-full h-2 bg-slate-100 dark:bg-slate-700/30 rounded-full"></div>
            <div className="w-5/6 h-2 bg-slate-100 dark:bg-slate-700/30 rounded-full"></div>
        </div>
         <div className="mt-auto flex gap-2">
            <div className="w-8 h-2 bg-blue-100 dark:bg-blue-900/50 rounded-full"></div>
            <div className="w-8 h-2 bg-blue-100 dark:bg-blue-900/50 rounded-full"></div>
         </div>
    </div>
);

export default function NewLandingPage({ onLogin }: LandingPageProps) {
  const navigate = useNavigate();
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [showFeatures, setShowFeatures] = useState(false);

  useEffect(() => {
    // Check if user is already logged in via Firebase
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/home', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  return (
    <div className="login-page-wrapper min-h-screen bg-slate-50 dark:bg-slate-950 relative overflow-hidden flex flex-col transition-colors duration-300">
      {/* Modal for How It Works */}
      {showHowItWorks && <HowItWorksFlow onClose={() => setShowHowItWorks(false)} />}
      
      {/* Modal for Features */}
      {showFeatures && <FeaturesShowcase onClose={() => setShowFeatures(false)} />}
      
      <style>{`
        @keyframes float {
            0% { transform: translateY(0px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) rotateZ(var(--rz, 0deg)); }
            50% { transform: translateY(-20px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) rotateZ(var(--rz, 0deg)); }
            100% { transform: translateY(0px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg)) rotateZ(var(--rz, 0deg)); }
        }
      `}</style>
      
      {/* 3D Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
          {/* Top Left - Far */}
          <div style={{ '--rx': '10deg', '--ry': '-10deg', '--rz': '-5deg' } as any}>
            <FloatingResume className="top-[10%] left-[5%] scale-75 blur-[2px] opacity-20 origin-center" delay="0s" />
          </div>

          {/* Bottom Left - Close */}
          <div style={{ '--rx': '20deg', '--ry': '15deg', '--rz': '10deg' } as any}>
            <FloatingResume className="bottom-[10%] left-[10%] scale-110 -rotate-12 z-0 opacity-60" delay="1s" />
          </div>

          {/* Top Right - Close */}
          <div style={{ '--rx': '-10deg', '--ry': '-20deg', '--rz': '15deg' } as any}>
            <FloatingResume className="top-[15%] right-[8%] scale-90 rotate-6 blur-[1px] opacity-40" delay="2s" />
          </div>

          {/* Bottom Right - Far */}
          <div style={{ '--rx': '5deg', '--ry': '20deg', '--rz': '-10deg' } as any}>
            <FloatingResume className="bottom-[5%] right-[20%] scale-75 blur-[2px] opacity-30 -rotate-3" delay="3s" />
          </div>

           {/* Center Background - Very Far */}
           <div style={{ '--rx': '40deg', '--ry': '0deg', '--rz': '0deg' } as any}>
            <FloatingResume className="top-[40%] left-[40%] scale-50 blur-[4px] opacity-10" delay="4s" />
          </div>

        {/* Gradients for atmosphere */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/20 dark:bg-blue-700/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/20 dark:bg-indigo-800/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Navbar */}
      <nav className="relative z-20 px-6 py-6 flex justify-between items-center max-w-7xl mx-auto w-full">
        <div className="flex items-center gap-2 backdrop-blur-md bg-white/30 dark:bg-slate-900/30 px-3 py-1.5 rounded-2xl border border-white/40 dark:border-slate-700/40 shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-md">
                VR
            </div>
            <span className="font-bold text-slate-800 dark:text-slate-100 text-lg">Verified Resumes</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="hidden md:flex gap-2">
                <button 
                  onClick={() => setShowHowItWorks(true)} 
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-full transition-all"
                >
                  How it works
                </button>
                <button 
                  onClick={() => setShowFeatures(true)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-slate-800/50 rounded-full transition-all"
                >
                  Features
                </button>
            </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow flex flex-col lg:flex-row items-center justify-center relative z-10 max-w-7xl mx-auto w-full px-6 py-8 lg:gap-16">
        
        {/* Left Side: 3D Typography & Content */}
        <div className="flex flex-col max-w-xl text-left lg:pr-8 mb-12 lg:mb-0 transform transition-all duration-700 hover:scale-[1.01]">
             <div className="inline-flex items-center gap-2 bg-blue-50/80 dark:bg-blue-900/30 backdrop-blur-sm border border-blue-100 dark:border-blue-800/50 rounded-full px-4 py-1.5 w-fit mb-6 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span className="text-xs font-semibold text-blue-800 dark:text-blue-400 uppercase tracking-wider">AI-Powered Verification</span>
            </div>

            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 dark:text-white leading-[1.1] mb-8 tracking-tight drop-shadow-sm">
                The Future of <br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-sky-500 to-indigo-600 dark:from-blue-400 dark:via-sky-400 dark:to-indigo-400">
                    Hiring
                </span> is Here.
            </h1>
            
            <p className="text-xl text-slate-700 dark:text-slate-300 mb-10 leading-relaxed font-light">
                Experience the next dimension of recruitment. AI-powered resume verification that helps teams hire faster and with confidence.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex items-center gap-3 p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all">
                    <div className="p-2.5 bg-blue-500/10 dark:bg-blue-500/20 rounded-xl text-blue-600 dark:text-blue-400">
                        <FileText size={24} />
                    </div>
                    <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">Smart Resume</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Parsing & Analysis</div>
                    </div>
                </div>
                 <div className="flex items-center gap-3 p-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all">
                    <div className="p-2.5 bg-sky-500/10 dark:bg-sky-500/20 rounded-xl text-sky-600 dark:text-sky-400">
                        <ShieldCheck size={24} />
                    </div>
                     <div>
                        <div className="font-bold text-slate-800 dark:text-slate-100">Identity</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">Verified & Secure</div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Side: 3D Card */}
        <div className="w-full max-w-md perspective-[1000px]">
            <div className="transform rotate-y-[-5deg] rotate-x-[5deg] hover:rotate-y-0 hover:rotate-x-0 transition-transform duration-500 ease-out preserve-3d">
                 <LoginCard onLogin={onLogin} />
            </div>
        </div>
      </main>
      
      <footer className="relative z-10 py-6 text-center text-slate-400 text-sm bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm">
        &copy; {new Date().getFullYear()} Verified Resumes Inc.
      </footer>
    </div>
  );
}
