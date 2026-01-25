import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext.tsx';
import './Ghost.css';

const Ghost: React.FC = () => {
  const { theme } = useTheme();
  const [position, setPosition] = useState({ x: 100, y: 100 });
  const [mousePosition, setMousePosition] = useState({ x: 100, y: 100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    const updatePosition = () => {
      const dx = mousePosition.x - position.x;
      const dy = mousePosition.y - position.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 2) {
        // More responsive following with less lag
        const speed = Math.min(distance * 0.3, 15);
        const angle = Math.atan2(dy, dx);
        const newX = position.x + Math.cos(angle) * speed;
        const newY = position.y + Math.sin(angle) * speed;

        setPosition({ x: newX, y: newY });
      }
    };

    const interval = setInterval(updatePosition, 8); // Higher frequency for smoother movement
    return () => clearInterval(interval);
  }, [mousePosition, position]);

  return (
    <div 
      className={`ghost-container theme-${theme}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -50%)'
      }}
    >
      <div className="ghost-body">
        {/* Ghost head */}
        <div className="ghost-head">
          {/* Eyes */}
          <div className="ghost-eye ghost-eye-left">
            <div className="ghost-pupil"></div>
          </div>
          <div className="ghost-eye ghost-eye-right">
            <div className="ghost-pupil"></div>
          </div>
          
          {/* Mouth */}
          <div className="ghost-mouth"></div>
        </div>
        
        {/* Ghost body with wavy bottom */}
        <div className="ghost-body-main">
          <div className="ghost-wave"></div>
          <div className="ghost-wave"></div>
          <div className="ghost-wave"></div>
        </div>
      </div>
    </div>
  );
};

export default Ghost;

