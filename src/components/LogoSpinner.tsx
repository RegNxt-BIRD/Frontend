import React from 'react';

const LogoSpinner: React.FC = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50 z-50">
      <div className="relative w-32 h-32 animate-spin">
        <svg width="100%" height="100%" viewBox="0 0 300 420" xmlns="http://www.w3.org/2000/svg">
          {/* Atomic symbol */}
          <g transform="translate(150, 150) scale(1.2)" stroke="white" fill="none">
            {/* Outer circles */}
            <ellipse rx="100" ry="50" strokeWidth="3" />
            <ellipse rx="100" ry="50" transform="rotate(60)" strokeWidth="3" />
            <ellipse rx="100" ry="50" transform="rotate(-60)" strokeWidth="3" />
            
            {/* Inner dotted circle */}
            <circle r="30" strokeWidth="1" strokeDasharray="2,4" />
            
            {/* Outer dots */}
            <circle cx="0" cy="-50" r="5" fill="white" />
            <circle cx="43.3" cy="25" r="5" fill="white" />
            <circle cx="-43.3" cy="25" r="5" fill="white" />
            <circle cx="0" cy="50" r="5" fill="white" />
            <circle cx="43.3" cy="-25" r="5" fill="white" />
            <circle cx="-43.3" cy="-25" r="5" fill="white" />
            
            {/* Inner dots */}
            <circle cx="0" cy="-30" r="3" fill="white" />
            <circle cx="26" cy="15" r="3" fill="white" />
            <circle cx="-26" cy="15" r="3" fill="white" />
            
            {/* Center dot */}
            <circle r="5" fill="white" />
          </g>
        </svg>
      </div>
      <div className="absolute mt-32 text-white text-xl font-bold">Loading...</div>
    </div>
  );
};

export default LogoSpinner;