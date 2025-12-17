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
        className={`p-3 rounded-md transition-colors duration-200 ${
          active ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'
        } ${className}`}
      >
        {icon}
      </button>
      <div className={`absolute px-2 py-1 bg-black bg-opacity-80 text-white text-xs rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none -translate-y-1/2 top-1/2 ${tooltipPositionClasses}`}>
        {tooltip}
      </div>
    </div>
  );
};