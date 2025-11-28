
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
    damagePercent: { label: '伤害加成', icon: Swords, color: 'text-red-400', isPercent: true },
    attackSpeed: { label: '攻击速度', icon: Wind, color: 'text-yellow-400', isPercent: true },
    critChance: { label: '暴击率', icon: Crosshair, color: 'text-orange-400', isPercent: true, isFloat: true },
    luck: { label: '幸运', icon: Clover, color: 'text-green-400' },
    xpGain: { label: '经验加成', icon: GraduationCap, color: 'text-purple-400', isPercent: true, isFloat: true },
    meleeDmg: { label: '近战伤害', icon: Swords, color: 'text-red-300' },
    rangedDmg: { label: '远程伤害', icon: Swords, color: 'text-blue-300' },
    elementalDmg: { label: '元素伤害', icon: Swords, color: 'text-purple-300' },
    engineering: { label: '工程学', icon: Swords, color: 'text-gray-300' },
    enemy_count: { label: '敌人数量', icon: Zap, color: 'text-pink-400', isPercent: true },
    explosion_dmg: { label: '爆炸伤害', icon: Zap, color: 'text-orange-500', isPercent: true},
    burn_chance: { label: '燃烧几率', icon: Zap, color: 'text-red-500', isPercent: true},
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
        <div className="flex justify-between items-center text-xs py-1 border-b border-white/5 last:border-0">
            <span className="flex items-center gap-2 text-gray-400"><config.icon size={12} className={config.color}/> {config.label}</span>
            <span className={`font-mono font-bold ${config.color}`}>{displayValue}</span>
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
                 <div className="text-xs font-black text-gray-500 tracking-[0.2em] uppercase">第 {displayWave} 波</div>
                 <div className={`text-4xl font-mono font-black drop-shadow-lg ${timerIsUrgent ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                    {displayTime}
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
                     <h3 className="text-xs font-bold text-gray-500 uppercase mb-2 tracking-widest border-b border-white/10 pb-1">战斗属性</h3>
                     {displayedStats.map(key => (
                        <StatRow key={key} statKey={key} value={stats[key]!} />
                     ))}
                     {displayedStats.length === 0 && <p className="text-xs text-gray-500 text-center py-2">暂无生效增益</p>}
                </div>
            </div>
        </div>
    </div>
  );
};