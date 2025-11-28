

import React from 'react';
import { InspectableEntity } from '../types';
import { Sword, Wind, Target, Activity, Shield, Crosshair } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

interface InspectorPanelProps {
  entity: InspectableEntity;
}

const StatRow = ({ icon: Icon, label, value, tooltip, color }: any) => (
    <div className="group relative flex justify-between items-center py-2 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-2 text-xs text-gray-400">
            <Icon size={14} className={color}/>
            <span className="cursor-help decoration-dotted underline underline-offset-2">{label}</span>
        </div>
        <div className="font-mono font-bold text-sm">{value}</div>
        
        {/* Tooltip */}
        <div className="hidden group-hover:block absolute right-full top-0 mr-2 w-48 bg-black/90 p-2 rounded border border-white/20 z-50 text-[10px] text-gray-300 pointer-events-none">
            {tooltip}
        </div>
    </div>
);

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ entity }) => {
  const { stats } = useGameStore();

  if (!entity) return null;

  const isUnit = entity.type === 'UNIT';
  const data = entity.data;

  // Calculate dynamic stats for Units based on global player stats
  let finalDamage = data.damage;
  let finalCooldown = 'attackTimer' in data ? (data as any).attackTimer : (data as any).maxCooldown;
  
  // Formulas (Visual Only)
  let dmgTooltip = `Base: ${data.damage}`;
  let cdTooltip = `Base: ${finalCooldown}s`;

  if (isUnit) {
      const u = data as any;
      const typeBonus = 
        u.type === 'MELEE' ? stats.meleeDmg : 
        u.type === 'RANGED' ? stats.rangedDmg : 
        u.type === 'MAGIC' ? stats.elementalDmg : stats.engineering;
      
      finalDamage = Math.round((u.damage + typeBonus) * (1 + stats.damagePercent/100));
      dmgTooltip = `Base: ${u.damage}\nType Bonus: +${typeBonus}\nGlobal: +${stats.damagePercent}%`;

      finalCooldown = (u.maxCooldown / (1 + stats.attackSpeed/100)).toFixed(2);
      cdTooltip = `Base: ${u.maxCooldown}s\nAtk Spd: +${stats.attackSpeed}%`;
  }

  const hpPct = Math.max(0, data.hp / data.maxHp) * 100;

  return (
    <div className="absolute right-4 top-24 w-64 glass-panel rounded-xl p-4 border border-white/10 animate-in slide-in-from-right duration-300 pointer-events-none">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-4">
            <div className="w-14 h-14 bg-slate-800 rounded-lg flex items-center justify-center text-4xl shadow-inner border border-white/5">
                {data.emoji}
            </div>
            <div>
                <h3 className="font-bold text-white leading-tight">
                    {('name' in data ? data.name : 'Unknown')}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${isUnit ? 'bg-blue-900 text-blue-300' : 'bg-red-900 text-red-300'}`}>
                    {isUnit ? (data as any).type : (data as any).type}
                </span>
            </div>
        </div>

        {/* Health Bar */}
        <div className="mb-4">
            <div className="flex justify-between text-[10px] text-gray-400 mb-1 font-mono">
                <span>HP</span>
                <span>{Math.ceil(data.hp)} / {data.maxHp}</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-200 ${isUnit ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${hpPct}%` }}
                />
            </div>
        </div>

        {/* Stats Grid */}
        <div className="bg-black/20 rounded-lg p-3">
             <StatRow 
                icon={Sword} 
                label="Damage" 
                value={finalDamage} 
                color="text-red-400"
                tooltip={dmgTooltip}
             />
             <StatRow 
                icon={Wind} 
                label="Cooldown" 
                value={`${finalCooldown}s`} 
                color="text-yellow-400"
                tooltip={cdTooltip}
             />
             {'range' in data && (
                 <StatRow 
                    icon={Target} 
                    label="Range" 
                    value={(data as any).range} 
                    color="text-cyan-400"
                    tooltip="Max attack distance in pixels"
                 />
             )}
             {'speed' in data && (
                 <StatRow 
                    icon={Activity} 
                    label="Speed" 
                    value={(data as any).speed} 
                    color="text-orange-400"
                    tooltip="Movement speed pixels/sec"
                 />
             )}
        </div>

        <div className="mt-4 text-[10px] text-gray-500 text-center italic">
            {isUnit ? "Click unit to lock view" : "Enemy unit"}
        </div>
    </div>
  );
};
