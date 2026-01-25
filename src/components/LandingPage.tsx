import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './common.css';
import './LandingPage.css';
import { SunIcon, MoonIcon } from './Icons.tsx';

type ThemeType = 'dark' | 'light';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeType>('dark');

  useEffect(() => {
    document.body.className = theme === 'dark' ? '' : 'theme-light';
  }, [theme]);

  const toggleTheme = (): void => {
    setTheme(prevTheme => prevTheme === 'dark' ? 'light' : 'dark');
  };

  const handleGetStarted = () => {
    navigate('/upload');
  };

  return (
    <div className={`landing-page theme-${theme}`}>
      <button 
        className="landing-theme-toggle" 
        onClick={toggleTheme} 
        aria-label="Toggle theme"
        title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? <SunIcon size={20} /> : <MoonIcon size={20} />}
      </button>

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

