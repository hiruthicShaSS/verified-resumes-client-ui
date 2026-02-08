import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, ShieldCheck, Zap, Users, FileSearch } from 'lucide-react';

interface FeaturesShowcaseProps {
  onClose: () => void;
}

const features = [
  {
    title: "AI-Powered Parsing",
    description: "Gemini AI instantly extracts skills, experience, and education from any resume format with human-level accuracy.",
    icon: Sparkles,
    color: "from-blue-500 to-indigo-500"
  },
  {
    title: "Automated Verification",
    description: "Our system automatically contacts past employers to verify work history, ensuring every candidate is authentic.",
    icon: ShieldCheck,
    color: "from-emerald-500 to-teal-500"
  },
  {
    title: "Smart Matching",
    description: "Intelligent algorithms match verified skills against job requirements to highlight the perfect candidates for your role.",
    icon: Zap,
    color: "from-amber-500 to-orange-500"
  },
  {
    title: "Collaborative Hiring",
    description: "Invite your team, share notes, and rate candidates together in a unified, transparent hiring dashboard.",
    icon: Users,
    color: "from-purple-500 to-pink-500"
  },
  {
    title: "Deep Insights",
    description: "Go beyond the resume with AI-generated summaries and behavioral insights derived from verified data.",
    icon: FileSearch,
    color: "from-cyan-500 to-blue-500"
  }
];

export const FeaturesShowcase: React.FC<FeaturesShowcaseProps> = ({ onClose }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleNext = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev + 1) % features.length);
  };

  const handlePrev = () => {
    setIsAutoPlaying(false);
    setActiveIndex((prev) => (prev - 1 + features.length) % features.length);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/90 backdrop-blur-md" onClick={onClose}>
        <style>{`
            .feature-3d-container {
                perspective: 1000px;
                transform-style: preserve-3d;
            }
        `}</style>
        
        {/* Close Button */}
        <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors z-50 backdrop-blur-sm"
        >
            <X size={24} />
        </button>

        <div className="w-full max-w-6xl flex flex-col items-center justify-center h-full relative" onClick={e => e.stopPropagation()}>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-16 text-center tracking-tight animate-[fadeIn_0.5s_ease-out]">
                Powerful Features
            </h2>

            {/* 3D Carousel Container */}
            <div className="feature-3d-container relative w-full h-[500px] flex items-center justify-center">
                {features.map((feature, index) => {
                    const total = features.length;
                    
                    // Find shortest distance in circle
                    let dist = (index - activeIndex + total) % total;
                    if (dist > total / 2) dist -= total;
                    
                    const isActive = dist === 0;
                    
                    // Determine styles based on distance
                    let transform = '';
                    let opacity = 0;
                    let zIndex = 0;
                    
                    if (isActive) {
                        transform = 'translateX(0) translateZ(200px) rotateY(0deg)';
                        opacity = 1;
                        zIndex = 10;
                    } else if (dist === -1) {
                         transform = 'translateX(-350px) translateZ(0px) rotateY(25deg)';
                         opacity = 0.6;
                         zIndex = 5;
                    } else if (dist === 1) {
                        transform = 'translateX(350px) translateZ(0px) rotateY(-25deg)';
                        opacity = 0.6;
                        zIndex = 5;
                    } else if (dist === -2 || dist < -2) { // Far left
                        transform = 'translateX(-600px) translateZ(-200px) rotateY(45deg)';
                        opacity = 0; // Hide distant ones for cleanliness
                        zIndex = 1;
                    } else { // Far right
                        transform = 'translateX(600px) translateZ(-200px) rotateY(-45deg)';
                        opacity = 0;
                        zIndex = 1;
                    }
                    
                    // Mobile adjustments handled by CSS media queries mostly, but JS logic keeps it simple here.
                    // For mobile, simply stacking or hiding non-active cards is often better, 
                    // but we will use the same transform logic as it scales down reasonably well with responsive width.

                    return (
                        <div 
                            key={index}
                            className={`absolute w-[300px] md:w-[380px] h-[450px] bg-white dark:bg-slate-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.25,0.8,0.25,1)] border border-slate-100 dark:border-slate-700 ${opacity === 0 ? 'pointer-events-none' : ''}`}
                            style={{
                                transform: transform,
                                opacity: opacity,
                                zIndex: zIndex,
                            }}
                        >
                           <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-8 shadow-lg transform transition-transform hover:scale-110 duration-300`}>
                                <feature.icon size={40} />
                           </div>
                           
                           <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                                {feature.title}
                           </h3>
                           
                           <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg">
                                {feature.description}
                           </p>
                           
                           {/* Decorative progress element */}
                           <div className="mt-auto w-full">
                                <div className="flex justify-between text-xs text-slate-400 mb-2 uppercase tracking-wider font-semibold">
                                    <span>Learn more</span>
                                    <span>0{index + 1}</span>
                                </div>
                                <div className="w-full h-1 rounded-full bg-slate-100 dark:bg-slate-700 overflow-hidden">
                                     <div className={`h-full w-full bg-gradient-to-r ${feature.color} origin-left transform scale-x-0 transition-transform duration-1000 ${isActive ? 'scale-x-100' : ''}`}></div>
                                </div>
                           </div>
                        </div>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-8 mt-8 z-50">
                <button 
                    onClick={handlePrev}
                    className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all backdrop-blur-sm"
                >
                    <ChevronLeft size={32} />
                </button>
                
                {/* Dots */}
                <div className="flex gap-3">
                    {features.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => { setIsAutoPlaying(false); setActiveIndex(i); }}
                            className={`h-3 rounded-full transition-all duration-300 ${i === activeIndex ? 'bg-white w-8' : 'bg-white/30 hover:bg-white/50 w-3'}`}
                        />
                    ))}
                </div>

                <button 
                    onClick={handleNext}
                    className="p-4 rounded-full bg-white/10 text-white hover:bg-white/20 hover:scale-110 transition-all backdrop-blur-sm"
                >
                    <ChevronRight size={32} />
                </button>
            </div>
        </div>
    </div>
  );
};
