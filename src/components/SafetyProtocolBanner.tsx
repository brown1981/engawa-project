import React from 'react';

interface SafetyProtocolBannerProps {
  fallbackCount: number;
}

const SafetyProtocolBanner: React.FC<SafetyProtocolBannerProps> = ({ fallbackCount }) => {
  const isHalted = fallbackCount >= 2;

  return (
    <div className={`w-full p-4 rounded-xl border-l-4 transition-all duration-500 flex items-center justify-between ${
      isHalted 
        ? 'bg-red-500/10 border-red-500 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.2)]' 
        : fallbackCount === 1 
          ? 'bg-yellow-500/10 border-yellow-500 text-yellow-500' 
          : 'bg-green-500/10 border-green-500 text-green-500'
    }`}>
      <div className="flex items-center gap-3">
        <span className="text-2xl">
          {isHalted ? '⚠️' : fallbackCount === 1 ? '⚡' : '🛡️'}
        </span>
        <div>
          <h4 className="font-bold text-sm tracking-widest uppercase">Safety Protocol Status</h4>
          <p className="text-xs opacity-80 mt-1">
            {isHalted 
              ? 'EMERGENCY HALT: 2+ agents in fallback mode. All autonomous operations suspended.' 
              : fallbackCount === 1 
                ? 'CAUTION: 1 agent in fallback mode. Monitoring team stability.' 
                : 'STABLE: All agent systems operating within primary parameters.'}
          </p>
        </div>
      </div>
      
      <div className="flex flex-col items-center">
        <div className="text-2xl font-black">{fallbackCount}/5</div>
        <div className="text-[10px] uppercase font-bold opacity-60">Fallback</div>
      </div>
    </div>
  );
};

export default SafetyProtocolBanner;
