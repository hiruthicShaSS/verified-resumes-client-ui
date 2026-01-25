import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../contexts/ThemeContext.tsx';
import Header from './Header.tsx';
import './common.css';
import './LandingPage.css';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useTheme();

  const handleGetStarted = () => {
    navigate('/upload');
  };

  return (
    <div className={`landing-page theme-${theme}`}>
      <Header />

      {/* Hanging Job Listings Badge */}
      <div className="badge-container" onClick={() => navigate('/job-listings')}>
        <div className="lanyard-strap"></div>
        <div className="lanyard-clip">
            <div className="clip-inner"></div>
        </div>
        <div className="id-card">
          <div className="hole-punch"></div>
          <div className="card-content">
            <div className="card-logo">
               <span className="logo-icon">💼</span>
            </div>
            <div className="card-details">
              <h3>OPEN ROLES</h3>
              <p>Join the Team</p>
              <div className="social-row">
                <span>→ Apply Now</span>
              </div>
            </div>
          </div>
          <div className="card-footer">
            JOB LISTINGS
          </div>
        </div>
      </div>

      {/* Hanging Job Post Badge */}
      <div className="badge-container badge-container-left" onClick={() => navigate('/post-job')}>
        <div className="lanyard-strap"></div>
        <div className="lanyard-clip">
            <div className="clip-inner"></div>
        </div>
        <div className="id-card">
          <div className="hole-punch"></div>
          <div className="card-content">
            <div className="card-logo">
               <span className="logo-icon">📝</span>
            </div>
            <div className="card-details">
              <h3>POST JOB</h3>
              <p>Hire Talent</p>
              <div className="social-row">
                <span>→ Create Post</span>
              </div>
            </div>
          </div>
          <div className="card-footer">
            POST JOB
          </div>
        </div>
      </div>

      <div className="landing-content">
        <h1 className="landing-title">Verified Resumes</h1>
        <p className="landing-subtitle">Upload and verify your resume files</p>
        <button className="get-started-btn" onClick={handleGetStarted}>
          Get Started
        </button>
      </div>
    </div>
  );
};

export default LandingPage;

