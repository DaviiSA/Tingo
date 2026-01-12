
import React from 'react';

interface StatsBarProps {
  label: string;
  value: number;
  color: string;
  icon: string;
}

const StatsBar: React.FC<StatsBarProps> = ({ label, value, color, icon }) => {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="w-8 h-8 bg-white/80 backdrop-blur rounded-xl shadow-sm flex items-center justify-center border border-white/50">
        <span className="text-sm">{icon}</span>
      </div>
      <div className="w-full h-2 bg-slate-200/50 rounded-full overflow-hidden border border-white/20">
        <div 
          className={`h-full transition-all duration-1000 ease-out ${color} shadow-sm`}
          style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
        />
      </div>
    </div>
  );
};

export default StatsBar;
