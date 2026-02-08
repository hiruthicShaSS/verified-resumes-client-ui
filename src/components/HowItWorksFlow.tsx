import React, { useEffect, useState } from 'react';
import { FileText, Sparkles, ShieldCheck, Building2, X, ArrowRight, CheckCircle } from 'lucide-react';

interface HowItWorksFlowProps {
  onClose: () => void;
}

export const HowItWorksFlow: React.FC<HowItWorksFlowProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  useEffect(() => {
    // Reset step to 0 on mount
    setStep(0);
    
    const timeouts: ReturnType<typeof setTimeout>[] = [];
    
    // Sequence
    // 0: Initial
    // 1: Upload -> AI (0.5s)
    // 2: AI Parsing (2s)
    // 3: AI -> Verification (4s)
    // 4: Verification Done / Send to Employer (6s)
    
    timeouts.push(setTimeout(() => setStep(1), 500));
    timeouts.push(setTimeout(() => setStep(2), 2000));
    timeouts.push(setTimeout(() => setStep(3), 4500));
    timeouts.push(setTimeout(() => setStep(4), 7000));
    
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-5xl p-6 md:p-12 relative overflow-hidden flex flex-col" 
        onClick={e => e.stopPropagation()}
      >
        <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors z-10"
        >
            <X size={24} />
        </button>

        <h2 className="text-3xl font-bold text-center mb-16 text-slate-900 dark:text-white">
            How Verified Resumes Works
        </h2>

        {/* Flow Visualization */}
        <div className="relative flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0 px-2 md:px-4 py-8 mb-8">
            
            {/* Step 1: Upload */}
            <div className={`relative z-10 flex flex-col items-center gap-4 transition-all duration-700 ${step >= 1 ? 'opacity-100 transform translate-y-0' : 'opacity-100 transform translate-y-0'}`}>
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-2 transition-all duration-500 ${step >= 1 ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]' : 'border-slate-200 dark:border-slate-700'}`}>
                    <FileText size={32} className={`transition-colors duration-500 ${step >= 1 ? 'text-blue-500' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <div className="text-center w-32">
                    <p className={`font-bold transition-colors duration-500 ${step >= 1 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>Upload Resume</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Candidate uploads PDF</p>
                </div>
            </div>

            {/* Connecting Line 1 */}
            <div className="flex-1 w-1 h-12 md:w-auto md:h-1 bg-slate-200 dark:bg-slate-800 relative rounded-full overflow-hidden mx-2">
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-1000 ease-linear ${step >= 2 ? 'translate-y-0 md:translate-x-0 opacity-100' : '-translate-y-full md:-translate-x-full opacity-50'}`}></div>
            </div>

            {/* Step 2: Gemini AI */}
            <div className={`relative z-10 flex flex-col items-center gap-4 transition-all duration-700 delay-100`}>
                <div className={`w-24 h-24 md:w-28 md:h-28 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-2 transition-all duration-500 relative ${step >= 2 ? 'border-indigo-500 shadow-[0_0_30px_rgba(99,102,241,0.4)] scale-110' : 'border-slate-200 dark:border-slate-700'}`}>
                    <Sparkles size={40} className={`transition-all duration-500 ${step >= 2 ? 'text-indigo-500' : 'text-slate-400 dark:text-slate-500'}`} />
                    
                    {/* Pulsing Rings for AI */}
                    {step === 2 && (
                        <>
                            <div className="absolute inset-0 rounded-full border border-indigo-500/50 animate-[ping_1.5s_ease-in-out_infinite]"></div>
                            <div className="absolute -inset-2 rounded-full border border-indigo-400/30 animate-[ping_2s_ease-in-out_infinite]"></div>
                        </>
                    )}
                </div>
                <div className="text-center w-32">
                    <p className={`font-bold transition-colors duration-500 ${step >= 2 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>Gemini AI</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Parses & Verifies Data</p>
                </div>
            </div>

             {/* Connecting Line 2 */}
             <div className="flex-1 w-1 h-12 md:w-auto md:h-1 bg-slate-200 dark:bg-slate-800 relative rounded-full overflow-hidden mx-2">
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-500 to-sky-500 transition-all duration-1000 ease-linear ${step >= 3 ? 'translate-y-0 md:translate-x-0 opacity-100' : '-translate-y-full md:-translate-x-full opacity-50'}`}></div>
            </div>

             {/* Step 3: Verification */}
             <div className={`relative z-10 flex flex-col items-center gap-4 transition-all duration-700 delay-200`}>
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-2 transition-all duration-500 ${step >= 3 ? 'border-sky-500 shadow-[0_0_20px_rgba(14,165,233,0.3)]' : 'border-slate-200 dark:border-slate-700'}`}>
                    <ShieldCheck size={32} className={`transition-colors duration-500 ${step >= 3 ? 'text-sky-500' : 'text-slate-400 dark:text-slate-500'}`} />
                </div>
                <div className="text-center w-36">
                    <p className={`font-bold transition-colors duration-500 ${step >= 3 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>Verification</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Checks Past Employers</p>
                </div>
            </div>

            {/* Connecting Line 3 */}
            <div className="flex-1 w-1 h-12 md:w-auto md:h-1 bg-slate-200 dark:bg-slate-800 relative rounded-full overflow-hidden mx-2">
                <div className={`absolute top-0 left-0 w-full h-full bg-gradient-to-r from-sky-500 to-green-500 transition-all duration-1000 ease-linear ${step >= 4 ? 'translate-y-0 md:translate-x-0 opacity-100' : '-translate-y-full md:-translate-x-full opacity-50'}`}></div>
            </div>

            {/* Step 4: Hiring Company */}
             <div className={`relative z-10 flex flex-col items-center gap-4 transition-all duration-700 delay-300`}>
                <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center border-2 transition-all duration-500 ${step >= 4 ? 'border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.3)]' : 'border-slate-200 dark:border-slate-700'}`}>
                    <Building2 size={32} className={`transition-colors duration-500 ${step >= 4 ? 'text-green-500' : 'text-slate-400 dark:text-slate-500'}`} />
                     <div className={`absolute -bottom-2 -right-2 bg-white dark:bg-slate-900 rounded-full p-1 transition-all duration-500 ${step >= 4 ? 'opacity-100 scale-100' : 'opacity-0 scale-0'}`}>
                        <CheckCircle size={20} className="text-green-500 fill-current" />
                    </div>
                </div>
                <div className="text-center w-32">
                    <p className={`font-bold transition-colors duration-500 ${step >= 4 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-600'}`}>Applied Company</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Receives Verified Profile</p>
                </div>
            </div>
        </div>

        <div className="mt-auto text-center h-16">
            <p className="text-lg font-medium text-slate-700 dark:text-slate-300 animate-[fadeIn_0.5s_ease-out]">
                {step === 0 && "Initiating secure upload..."}
                {step === 1 && "Resume is securely uploaded..."}
                {step === 2 && "Gemini AI parses skills and extracts work history..."}
                {step === 3 && "System automatically contacts employers for verification..."}
                {step >= 4 && "Success! Verified profile sent to the hiring company."}
            </p>
        </div>

        {step >= 4 && (
             <div className="mt-8 flex justify-center animate-[bounce_1s_infinite]">
                <button onClick={onClose} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-blue-500/25">
                    Start Your Verification
                </button>
             </div>
        )}
      </div>
    </div>
  );
};
