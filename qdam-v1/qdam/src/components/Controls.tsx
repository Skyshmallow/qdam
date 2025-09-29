import React from 'react';

interface ControlsProps {
  isWalking: boolean;
  onStart: () => void;
  onStop: () => void;
  todayDistance: number;
}

const Controls: React.FC<ControlsProps> = ({ isWalking, onStart, onStop, todayDistance }) => {
  const dailyLimit = 5000; // 5km in meters
  const progress = Math.min(todayDistance / dailyLimit, 1);
  const circumference = 2 * Math.PI * 60; // r=60
  const offset = circumference - progress * circumference;

  const buttonClass = isWalking
    ? 'bg-red-500 shadow-red-500/30'
    : 'bg-blue-500 shadow-blue-500/30';

  return (
    <button
      onClick={isWalking ? onStop : onStart}
      className={`relative w-32 h-32 rounded-full border-none text-white text-lg font-bold cursor-pointer transition-all duration-300 ease-in-out shadow-lg flex flex-col items-center justify-center gap-1 hover:scale-105 active:scale-95 ${buttonClass}`}
    >
      <svg className="absolute top-[-10px] left-[-10px] w-36 h-36 -rotate-90">
        <circle
          className="stroke-white/30"
          strokeWidth="6"
          fill="transparent"
          r="60"
          cx="72"
          cy="72"
        />
        <circle
          className="stroke-green-500 transition-all duration-300 ease-linear"
          strokeWidth="6"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
          r="60"
          cx="72"
          cy="72"
        />
      </svg>
      <span className="z-10">{isWalking ? 'STOP' : 'START'}</span>
      {isWalking && (
        <span className="z-10 text-xs opacity-80 font-mono">
          {(todayDistance / 1000).toFixed(1)} km
        </span>
      )}
    </button>
  );
};

export default Controls;
