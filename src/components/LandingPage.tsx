import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './common.css';
import './LandingPage.css';
import { SunIcon, MoonIcon } from './Icons.tsx';

type ThemeType = 'dark' | 'light';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<ThemeType>('dark');

  // Apply theme to body element for global background gradient
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

