

import React, { useState } from 'react';
import { PlayerStats } from '../types';
import { Heart, Zap, Shield, Swords, Crosshair, Wind, Clover, ChevronLeft, Menu, Magnet, GraduationCap } from 'lucide-react';

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
  const hpPct = (stats.hp / stats.maxHp) * 100;
  const xpPct = (stats.xp / stats.maxXp) * 100;
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start pointer-events-auto">
            {/* Left: Health & XP */}
            <div className="glass-panel p-3 rounded-lg w-80">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-red-400 flex items-center gap-1"><Heart size={12}/> HP</span>
                    <span className="text-xs text-gray-400 font-mono">{Math.ceil(stats.hp)}/{Math.ceil(stats.maxHp)}</span>
                </div>
                <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden mb-3 border border-slate-700">
                    <div className="h-full bg-red-500 transition-all duration-300" style={{ width: `${Math.max(0, hpPct)}%` }}></div>
                </div>

                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-yellow-400 flex items-center gap-1"><Zap size={12}/> LVL {stats.level}</span>
                    <span className="text-xs text-gray-400 font-mono">{Math.floor(stats.xp)}/{Math.floor(stats.maxXp)}</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                    <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${Math.max(0, xpPct)}%` }}></div>
                </div>
            </div>

            {/* Center: Timer */}
            <div className="flex flex-col items-center">
                 <div className="text-4xl font-black italic text-white drop-shadow-lg tracking-widest">
                    WAVE {currentWave}
                 </div>
                 <div className={`text-3xl font-mono mt-1 ${waveTime < 10 ? 'text-red-500 animate-pulse' : 'text-blue-300'}`}>
                    {Math.ceil(waveTime)}s
                 </div>
            </div>

            {/* Right: Expandable Stats Panel */}
            <div 
                className="group relative flex flex-col items-end pointer-events-auto"
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                <div className="glass-panel p-2 rounded-lg bg-slate-900/90 flex items-center gap-2 cursor-pointer transition-all hover:bg-slate-800">
                    <Menu size={20} className="text-gray-400"/>
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">STATS</span>
                </div>

                <div className={`
                    absolute top-12 right-0 glass-panel p-3 rounded-lg w-64 bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-300 origin-top-right
                    ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                `}>
                     <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest border-b border-white/10 pb-1">Combat Attributes</h3>
                     <StatRow icon={Swords} label="Damage" value={`+${stats.damagePercent}%`} color="text-red-400" />
                     <StatRow icon={Wind} label="Atk Spd" value={`+${stats.attackSpeed}%`} color="text-yellow-400" />
                     <StatRow icon={Crosshair} label="Crit" value={`${(stats.critChance*100).toFixed(0)}%`} color="text-orange-400" />
                     <StatRow icon={Shield} label="Armor" value={stats.armor} color="text-blue-400" />
                     <StatRow icon={Wind} label="Speed" value={`${stats.speed}%`} color="text-cyan-400" />
                     <StatRow icon={Clover} label="Luck" value={stats.luck} color="text-green-400" />
                     <StatRow icon={Heart} label="Regen" value={`${stats.hpRegen}/5s`} color="text-pink-400" />
                     <StatRow icon={Magnet} label="Pickup" value={`+${(stats.pickupRange*100).toFixed(0)}%`} color="text-indigo-400" />
                     <StatRow icon={GraduationCap} label="XP Gain" value={`+${(stats.xpGain*100).toFixed(0)}%`} color="text-purple-400" />
                </div>
            </div>
        </div>
    </div>
  );
};