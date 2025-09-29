import React from 'react';

interface StatsProps {
  todayDistance: number; // in meters
  totalArea: number;     // in square meters
}

const Stats: React.FC<StatsProps> = ({ todayDistance, totalArea }) => {
  const distanceInKm = (todayDistance / 1000).toFixed(1);
  const dailyLimitKm = 5;

  const areaFormatted =
    totalArea > 10000
      ? `${(totalArea / 1000000).toFixed(2)} km²`
      : `${Math.round(totalArea)} m²`;

  return (
    <div className="bg-black/70 backdrop-blur-sm text-white py-2 px-4 rounded-xl text-sm w-60 shadow-lg">
      <div className="flex justify-between">
        <span>Today:</span>
        <span className="font-mono">{distanceInKm} km</span>
      </div>
      <div className="flex justify-between">
        <span>Limit:</span>
        <span className="font-mono">{dailyLimitKm.toFixed(1)} km</span>
      </div>
      <div className="flex justify-between">
        <span>Total Area:</span>
        <span className="font-mono">{areaFormatted}</span>
      </div>
    </div>
  );
};

export default Stats;