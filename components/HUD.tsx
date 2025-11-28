

import React, { useState } from 'react';
import { PlayerStats } from '../types';
import { Zap, Shield, Swords, Crosshair, Wind, Clover, Menu, Magnet, GraduationCap, Coins } from 'lucide-react';

interface HUDProps {
  stats: PlayerStats;
  waveTime: number;
  currentWave: number;
}

const StatRow = ({ icon: Icon, label, value, color }: any) => (
    <div className="flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0">
        <span className="flex items-center gap-2 text-gray-400"><Icon size={12} className={color}/> {label}</span>
        <span className={`font-mono font-bold ${color}`}>{value}</span>
    </div>
);

export const HUD: React.FC<HUDProps> = ({ stats, waveTime, currentWave }) => {
  const xpPct = (stats.xp / stats.maxXp) * 100;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
        
        {/* Top Bar - Compact Layout */}
        <div className="flex justify-between items-center pointer-events-auto w-full max-w-7xl mx-auto">
            
            {/* Left: Progression & Resources */}
            <div className="flex items-center gap-2 bg-slate-900/90 backdrop-blur border border-white/10 rounded-full p-1 pr-6 shadow-lg">
                {/* Level Badge */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner ring-2 ring-slate-800 z-10">
                    {stats.level}
                </div>
                
                {/* XP Bar */}
                <div className="flex flex-col w-32 md:w-48 mr-4">
                    <div className="flex justify-between text-[10px] text-gray-400 font-mono mb-0.5 px-1">
                        <span>EXP</span>
                        <span>{Math.floor(stats.xp)}/{Math.floor(stats.maxXp)}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                        <div className="h-full bg-cyan-400 transition-all duration-300" style={{ width: `${Math.max(0, xpPct)}%` }}></div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="h-8 w-px bg-white/10 mx-1"></div>

                {/* Gold */}
                <div className="flex items-center gap-2 text-yellow-400 pl-2">
                    <Coins size={16} />
                    <span className="font-mono font-bold text-lg">{stats.gold}</span>
                </div>
            </div>

            {/* Center: Timer */}
            <div className="flex flex-col items-center justify-center -mt-2">
                 <div className="text-xs font-black text-gray-500 tracking-[0.2em] uppercase">Wave {currentWave}</div>
                 <div className={`text-4xl font-mono font-black drop-shadow-lg ${waveTime < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {Math.ceil(waveTime)}
                 </div>
            </div>

            {/* Right: Expandable Stats Panel */}
            <div 
                className="group relative flex flex-col items-end pointer-events-auto"
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                <div className="bg-slate-900/90 backdrop-blur border border-white/10 p-2.5 rounded-full cursor-pointer hover:bg-slate-800 transition-colors shadow-lg">
                    <Menu size={20} className="text-gray-300"/>
                </div>

                <div className={`
                    absolute top-14 right-0 glass-panel p-3 rounded-xl w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 origin-top-right z-50
                    ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                `}>
                     <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest border-b border-white/10 pb-1">Combat Attributes</h3>
                     <StatRow icon={Swords} label="Damage" value={`+${stats.damagePercent}%`} color="text-red-400" />
                     <StatRow icon={Wind} label="Atk Spd" value={`+${stats.attackSpeed}%`} color="text-yellow-400" />
                     <StatRow icon={Crosshair} label="Crit" value={`${(stats.critChance*100).toFixed(0)}%`} color="text-orange-400" />
                     <StatRow icon={Wind} label="Speed" value={`${stats.speed}%`} color="text-cyan-400" />
                     <StatRow icon={Clover} label="Luck" value={stats.luck} color="text-green-400" />
                     <StatRow icon={Magnet} label="Pickup" value={`+${(stats.pickupRange*100).toFixed(0)}%`} color="text-indigo-400" />
                     <StatRow icon={GraduationCap} label="XP Gain" value={`+${(stats.xpGain*100).toFixed(0)}%`} color="text-purple-400" />
                </div>
            </div>
        </div>
    </div>
  );
};
