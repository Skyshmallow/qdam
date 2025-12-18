// src/components/IconButton.tsx
import React from 'react';

interface IconButtonProps {
  icon: React.ReactNode;
  tooltip: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  tooltipPosition?: 'left' | 'right';
}

export const IconButton: React.FC<IconButtonProps> = ({ icon, tooltip, active = false, onClick, className = '', tooltipPosition = 'right' }) => {
  const tooltipPositionClasses = tooltipPosition === 'left' ? 'right-full mr-3' : 'left-full ml-3';
  
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={`icon-button ${active ? 'icon-button--active' : ''} ${className}`}
      >
        {icon}
      </button>
      <div className={`tooltip ${tooltipPositionClasses}`}>
        {tooltip}
      </div>
    </div>
  );
};