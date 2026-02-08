import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import { 
  Upload, 
  ClipboardList, 
  PenSquare, 
  UserPlus, 
  Users, 
  ShieldCheck,
  LogOut
} from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { Background } from './Background.tsx';
import { TiltCard } from './TiltCard.tsx';
import AdminRegistrationModal from './AdminRegistrationModal.tsx';
import HRRegistrationModal from './HRRegistrationModal.tsx';
import ProfileModal from './ProfileModal.tsx';
import './common.css';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { isAdmin, isCompanyMember, canViewApplicants, canVerifyApplicants, isLoading: roleLoading } = useUserRole();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showHRModal, setShowHRModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const { scrollY } = useScroll();
  
  // Parallax text effect
  const yText = useTransform(scrollY, [0, 300], [0, 100]);
  const opacityText = useTransform(scrollY, [0, 300], [1, 0]);


  const handleLogout = async () => {
    try {
      await logout();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Build cards array based on user roles
  const cards = [
    {
      title: "Upload Resume",
      description: "Upload and manage your resume files for job applications",
      icon: Upload,
      color: "bg-blue-500",
      onClick: () => navigate('/upload'),
    },
    {
      title: "Job Listings",
      description: "Browse and apply to all active job postings",
      icon: ClipboardList,
      color: "bg-indigo-500",
      onClick: () => navigate('/job-listings'),
    },
    ...(isAdmin || isCompanyMember ? [{
      title: "Post Job",
      description: "Create and publish job openings to attract top talent",
      icon: PenSquare,
      color: "bg-violet-500",
      onClick: () => navigate('/post-job'),
    }] : []),
    ...(canViewApplicants ? [{
      title: "Applicants",
      description: "View and manage job applicants for your company",
      icon: UserPlus,
      color: "bg-cyan-500",
      onClick: () => navigate('/applicants'),
    }] : []),
    ...(isAdmin || isCompanyMember ? [{
      title: "Team",
      description: "Manage your team members and permissions",
      icon: Users,
      color: "bg-teal-500",
      onClick: () => navigate('/team'),
    }] : []),
    ...(canVerifyApplicants ? [{
      title: "Verify Applicants",
      description: "Verify applicants based on company name provided during application",
      icon: ShieldCheck,
      color: "bg-sky-500",
      onClick: () => navigate('/previous-company/verifications'),
    }] : []),
  ];



  return (
    <div className="landing-page min-h-screen bg-slate-50 dark:bg-slate-950 relative text-slate-800 dark:text-slate-100 transition-colors duration-500 selection:bg-blue-500/30 flex flex-col perspective-container">
      {/* Same background gradients as NewLandingPage */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        {/* Gradients for atmosphere */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-200/20 dark:bg-blue-700/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/20 dark:bg-indigo-800/10 rounded-full blur-[120px]"></div>
      </div>
      <Background />
      
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 py-4 flex justify-between items-center backdrop-blur-md bg-white/50 dark:bg-slate-900/50 border-b border-white/20 dark:border-slate-800/50">
        <div className="flex items-center gap-4">
          {user && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl shadow-lg shadow-red-500/30 font-semibold text-sm transition-colors flex items-center gap-2"
            >
              <LogOut size={16} />
              Logout
            </motion.button>
          )}
        </div>
        
        <div className="flex items-center gap-6">
          {user && (
            <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-slate-700">
              <div 
                className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 p-0.5 cursor-pointer"
                onClick={() => setShowProfileModal(true)}
              >
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || 'Profile'} 
                    className="w-full h-full rounded-full object-cover border-2 border-white dark:border-slate-900"
                  />
                ) : (
                  <div className="w-full h-full rounded-full bg-white dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-xs font-bold text-blue-600 dark:text-blue-400">
                    {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <span className="font-medium hidden sm:block">{user.displayName || user.email}</span>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 container mx-auto px-4 pt-32 pb-20 max-w-7xl">
        
        {/* Header Section with Parallax */}
        <motion.div 
          style={{ y: yText, opacity: opacityText }}
          className="text-center mb-20 relative z-10"
        >
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl md:text-7xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-slate-800 via-blue-800 to-slate-800 dark:from-white dark:via-blue-200 dark:to-white tracking-tight"
          >
            Verified Resumes
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed"
          >
            Streamline your hiring process with verified candidate profiles and comprehensive resume management
          </motion.p>
        </motion.div>

        {/* Flex Grid for Better Centering */}
        <div className="flex flex-wrap justify-center gap-8 px-4 max-w-7xl mx-auto w-full">
          {cards.map((card, index) => (
            <div key={index} className="h-80 w-full sm:w-[calc(50%-1rem)] lg:w-[calc(33.333%-1.5rem)] max-w-sm">
              <TiltCard 
                title={card.title}
                description={card.description}
                icon={card.icon}
                color={card.color}
                delay={index * 0.1 + 0.4}
                onClick={card.onClick}
              />
            </div>
          ))}
        </div>

        {/* Administration Footer */}
        {isAdmin && !roleLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-32 text-center"
          >
            <div className="h-px w-full max-w-md mx-auto bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent mb-8" />
            <h4 className="text-xs font-bold tracking-[0.2em] text-slate-400 uppercase mb-4">Administration</h4>
            <div className="flex justify-center items-center gap-4 text-sm text-blue-600 dark:text-blue-400 font-medium">
              <button 
                onClick={() => setShowAdminModal(true)}
                className="hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-all"
              >
                Register Admin
              </button>
              <span className="text-slate-300 dark:text-slate-700">|</span>
              <button 
                onClick={() => setShowHRModal(true)}
                className="hover:text-blue-700 dark:hover:text-blue-300 hover:underline transition-all"
              >
                Register User
              </button>
            </div>
          </motion.div>
        )}
      </main>

      {showAdminModal && (
        <AdminRegistrationModal onClose={() => setShowAdminModal(false)} />
      )}
      {showHRModal && (
        <HRRegistrationModal onClose={() => setShowHRModal(false)} />
      )}
      {showProfileModal && user && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default LandingPage;

