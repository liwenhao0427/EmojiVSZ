
import React, { useState } from 'react';
import { PlayerStats, GamePhase } from '../types';
import { Zap, Shield, Swords, Crosshair, Wind, Clover, Menu, Magnet, GraduationCap, Coins } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

interface HUDProps {
  stats: PlayerStats;
  waveTime: number;
  currentWave: number;
}

const STAT_DISPLAY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string; isPercent?: boolean, isFloat?: boolean }> = {
    damagePercent: { label: '伤害加成', icon: Swords, color: 'text-red-500', isPercent: true },
    attackSpeed: { label: '攻击速度', icon: Wind, color: 'text-yellow-500', isPercent: true },
    critChance: { label: '暴击率', icon: Crosshair, color: 'text-orange-500', isPercent: true, isFloat: true },
    luck: { label: '幸运', icon: Clover, color: 'text-green-500' },
    xpGain: { label: '经验加成', icon: GraduationCap, color: 'text-purple-500', isPercent: true, isFloat: true },
    meleeDmg: { label: '近战伤害', icon: Swords, color: 'text-red-600' },
    rangedDmg: { label: '远程伤害', icon: Swords, color: 'text-blue-600' },
    elementalDmg: { label: '元素伤害', icon: Swords, color: 'text-purple-600' },
    enemy_count: { label: '敌人数量', icon: Zap, color: 'text-pink-500', isPercent: true },
    explosion_dmg: { label: '爆炸伤害', icon: Zap, color: 'text-orange-600', isPercent: true},
    burn_chance: { label: '燃烧几率', icon: Zap, color: 'text-red-600', isPercent: true},
};


const StatRow: React.FC<{ statKey: string; value: number }> = ({ statKey, value }) => {
    const config = STAT_DISPLAY_CONFIG[statKey];
    if (!config) return null;

    let displayValue: string;
    if (config.isPercent) {
        const displayVal = config.isFloat ? value * 100 : value;
        displayValue = `${displayVal >= 0 ? '+' : ''}${displayVal.toFixed(0)}%`;
    } else {
        displayValue = `${value >= 0 ? '+' : ''}${value.toFixed(0)}`;
    }

    return (
        <div className="flex justify-between items-center text-xs py-1.5 border-b border-slate-200 last:border-0 font-bold">
            <span className="flex items-center gap-2 text-slate-500"><config.icon size={14} className={config.color}/> {config.label}</span>
            <span className={`font-mono text-sm ${config.color}`}>{displayValue}</span>
        </div>
    );
};

export const HUD: React.FC<HUDProps> = ({ stats, waveTime, currentWave }) => {
  const xpPct = (stats.xp / stats.maxXp) * 100;
  const [isExpanded, setIsExpanded] = useState(false);
  const { phase } = useGameStore();

  const displayedStats = Object.keys(STAT_DISPLAY_CONFIG).filter(key => stats[key] && stats[key] !== 0);

  const isShopPhase = phase === GamePhase.SHOP;
  const displayWave = isShopPhase ? currentWave + 1 : currentWave;
  const displayTime = Math.ceil(waveTime);
  const timerIsUrgent = !isShopPhase && waveTime > 0 && waveTime < 10;

  return (
    <div className="absolute inset-0 pointer-events-none p-4 flex flex-col justify-between z-50">
        
        {/* Top Bar - Light Glass */}
        <div className="flex justify-between items-center pointer-events-auto w-full max-w-7xl mx-auto">
            
            {/* Left: Progression & Resources */}
            <div className="flex items-center gap-3 bg-white/90 backdrop-blur-md border border-white rounded-full p-1.5 pr-6 shadow-lg shadow-slate-200/50">
                {/* Level Badge */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md border-2 border-white">
                    {stats.level}
                </div>
                
                {/* XP Bar */}
                <div className="flex flex-col w-32 md:w-48 mr-2">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-0.5 px-1">
                        <span>{isShopPhase ? 'HERO XP' : 'EXP'}</span>
                        <span>{Math.floor(stats.xp)}/{Math.floor(stats.maxXp)}</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                        <div className={`h-full transition-all duration-300 rounded-full ${isShopPhase ? 'bg-purple-500' : 'bg-blue-400'}`} style={{ width: `${Math.max(0, xpPct)}%` }}></div>
                    </div>
                </div>

                {/* Vertical Divider */}
                <div className="h-6 w-px bg-slate-200 mx-1"></div>

                {/* Gold */}
                <div className="flex items-center gap-2 text-yellow-500 pl-1">
                    <div className="bg-yellow-100 p-1 rounded-full"><Coins size={16} /></div>
                    <span className="font-mono font-black text-xl text-slate-700">{stats.gold}</span>
                </div>
            </div>

            {/* Center: Timer */}
            <div className="flex flex-col items-center justify-center -mt-2">
                 <div className="px-3 py-1 bg-white/80 rounded-full border border-white shadow-sm mb-1">
                    <div className="text-[10px] font-black text-slate-400 tracking-[0.2em] uppercase">第 {displayWave} 波</div>
                 </div>
                 <div className={`text-5xl font-mono font-black drop-shadow-sm text-stroke ${timerIsUrgent ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {displayTime}
                 </div>
            </div>

            {/* Right: Expandable Stats Panel */}
            <div 
                className="group relative flex flex-col items-end pointer-events-auto"
                onMouseEnter={() => setIsExpanded(true)}
                onMouseLeave={() => setIsExpanded(false)}
            >
                <div className="bg-white/90 backdrop-blur border border-white p-2.5 rounded-full cursor-pointer hover:bg-slate-50 transition-colors shadow-lg shadow-slate-200/50 text-slate-600">
                    <Menu size={24} />
                </div>

                <div className={`
                    absolute top-16 right-0 glass-panel p-4 rounded-3xl w-72 bg-white/95 backdrop-blur-xl border-2 border-white shadow-xl transition-all duration-300 origin-top-right z-50
                    ${isExpanded ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
                `}>
                     <h3 className="text-xs font-black text-slate-400 uppercase mb-3 tracking-widest border-b border-slate-100 pb-2">战斗属性</h3>
                     {displayedStats.map(key => (
                        <StatRow key={key} statKey={key} value={stats[key]!} />
                     ))}
                     {displayedStats.length === 0 && <p className="text-xs text-slate-400 text-center py-4 font-bold">暂无生效增益</p>}
                </div>
            </div>
        </div>
    </div>
  );
};