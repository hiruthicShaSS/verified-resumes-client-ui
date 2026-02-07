import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.tsx';
import { useUserRole } from '../hooks/useUserRole.ts';
import Header from './Header.tsx';
import AdminRegistrationModal from './AdminRegistrationModal.tsx';
import HRRegistrationModal from './HRRegistrationModal.tsx';
import './common.css';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { isAdmin, isCompanyMember, canViewApplicants } = useUserRole();
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showHRModal, setShowHRModal] = useState(false);

  const handleGetStarted = () => {
    navigate('/upload');
  };

  return (
    <div className={`landing-page theme-${theme}`}>
      <Header />

      <div className="landing-container">
        {/* Hero Section */}
        <div className="hero-section">
          <h1 className="hero-title">Verified Resumes</h1>
          <p className="hero-subtitle">Streamline your hiring process with verified candidate profiles and comprehensive resume management</p>
          <button className="primary-action-btn" onClick={handleGetStarted}>
            Get Started
          </button>
        </div>

        {/* Action Cards Grid */}
        <div className="action-cards-grid">
          {/* Show Post Job only for Admin or Company Members */}
          {(isAdmin || isCompanyMember) && (
            <div className="action-card" onClick={() => navigate('/post-job')}>
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <h3 className="card-title">Post Job</h3>
              <p className="card-description">Create and publish job openings to attract top talent</p>
            </div>
          )}

          {/* Show Applicants only for specific roles */}
          {canViewApplicants && (
            <div className="action-card" onClick={() => navigate('/applicants')}>
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="8.5" cy="7" r="4" />
                  <path d="M20 8v6M23 11h-6" />
                </svg>
              </div>
              <h3 className="card-title">Applicants</h3>
              <p className="card-description">View and manage job applicants for your company</p>
            </div>
          )}

          <div className="action-card" onClick={() => navigate('/job-listings')}>
            <div className="card-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                <path d="M9 14h6M9 10h6M9 18h6" />
              </svg>
            </div>
            <h3 className="card-title">Job Listings</h3>
            <p className="card-description">Browse and manage all active job postings</p>
          </div>

          {/* Show Team only for Admin or Company Members */}
          {(isAdmin || isCompanyMember) && (
            <div className="action-card" onClick={() => navigate('/team')}>
              <div className="card-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <h3 className="card-title">Team</h3>
              <p className="card-description">Manage your team members and permissions</p>
            </div>
          )}
        </div>

        {/* Registration Footer */}
        <div className="registration-footer">
          <p className="footer-label">Administration</p>
          <div className="registration-links">
            <button 
              className="text-link" 
              onClick={() => setShowAdminModal(true)}
            >
              Register Admin
            </button>
            <span className="separator">|</span>
            <button 
              className="text-link" 
              onClick={() => setShowHRModal(true)}
            >
              Register User
            </button>
          </div>
        </div>
      </div>

      {showAdminModal && (
        <AdminRegistrationModal onClose={() => setShowAdminModal(false)} />
      )}
      {showHRModal && (
        <HRRegistrationModal onClose={() => setShowHRModal(false)} />
      )}
    </div>
  );
};

export default LandingPage;

