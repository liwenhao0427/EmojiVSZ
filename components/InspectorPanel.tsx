
import React from 'react';
import { InspectableEntity, Unit } from '../types';
import { Sword, Wind, Target, Activity, Crosshair } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { CELL_SIZE } from '../constants';

interface InspectorPanelProps {
  entity: InspectableEntity;
}

const ATTACK_PATTERN_MAP: Record<string, string> = {
    SHOOT: '定点射击 (Shoot)',
    THRUST: '近战突刺 (Thrust)',
    SWING: '扇形挥砍 (Swing)',
    STREAM: '持续喷射 (Stream)',
    NONE: '被动/无 (Passive)'
};

const StatRow = ({ icon: Icon, label, value, tooltip, color }: any) => (
    <div className="group relative flex justify-between items-center py-2 border-b border-white/5 last:border-0">
        <div className="flex items-center gap-2 text-xs text-gray-400">
            <Icon size={14} className={color}/>
            <span className="cursor-help decoration-dotted underline underline-offset-2">{label}</span>
        </div>
        <div className="font-mono font-bold text-sm">{value}</div>
        
        {/* Tooltip */}
        <div className="hidden group-hover:block absolute right-full top-0 mr-2 w-48 bg-black/90 p-2 rounded border border-white/20 z-50 text-[10px] text-gray-300 pointer-events-none whitespace-pre-wrap">
            {tooltip}
        </div>
    </div>
);

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ entity }) => {
  if (!entity) return null;

  const isUnit = entity.type === 'UNIT';
  const { data, statsBreakdown } = entity;

  // Calculate dynamic stats for Units based on global player stats
  let finalDamage = Math.round(
      (statsBreakdown.damage.base + statsBreakdown.damage.bonus) * statsBreakdown.damage.multiplier
  );
  let finalCooldown = (statsBreakdown.cooldown.base / statsBreakdown.cooldown.multiplier).toFixed(2);
  
  if (!isUnit) {
      finalDamage = data.damage;
      finalCooldown = statsBreakdown.cooldown.base.toFixed(2);
  }

  let dmgTooltip = `基础: ${statsBreakdown.damage.base}\n加成: +${statsBreakdown.damage.bonus}\n倍率: x${statsBreakdown.damage.multiplier.toFixed(2)}`;
  let cdTooltip = `基础: ${statsBreakdown.cooldown.base}s\n倍率: /${statsBreakdown.cooldown.multiplier.toFixed(2)}`;

  const hpPct = Math.max(0, data.hp / data.maxHp) * 100;

  const rangeInPixels = 'range' in data ? (data as Unit).range : 0;
  const rangeInCells = Math.floor(rangeInPixels / CELL_SIZE);
  const displayRange = rangeInPixels >= 2000 ? "全屏" : `${rangeInCells} 格`;
  
  const attackPatternDisplay = isUnit && 'attackPattern' in data 
      ? ATTACK_PATTERN_MAP[(data as Unit).attackPattern || 'NONE'] 
      : null;

  return (
    <div className="absolute right-4 top-24 w-64 glass-panel rounded-xl p-4 border border-white/10 animate-in slide-in-from-right duration-300 pointer-events-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-3">
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
        
        {/* Description */}
        {data.description && (
            <p className="text-xs text-gray-300 mb-3 bg-black/20 p-2 rounded border border-white/5 leading-normal">
                {data.description}
            </p>
        )}

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
                label="伤害" 
                value={finalDamage} 
                color="text-red-400"
                tooltip={dmgTooltip}
             />
             <StatRow 
                icon={Wind} 
                label="冷却" 
                value={`${finalCooldown}s`} 
                color="text-yellow-400"
                tooltip={cdTooltip}
             />
             {'range' in data && (
                 <StatRow 
                    icon={Target} 
                    label="射程" 
                    value={displayRange}
                    color="text-cyan-400"
                    tooltip={`实际像素: ${rangeInPixels} px`}
                 />
             )}
             {attackPatternDisplay && (
                 <StatRow 
                    icon={Crosshair} 
                    label="攻击模式" 
                    value={attackPatternDisplay.split(' ')[0]} 
                    color="text-purple-400"
                    tooltip={attackPatternDisplay}
                 />
             )}
             {'speed' in data && (
                 <StatRow 
                    icon={Activity} 
                    label="速度" 
                    value={(data as any).speed} 
                    color="text-orange-400"
                    tooltip="移动速度 (像素/秒)"
                 />
             )}
        </div>

        <div className="mt-4 text-[10px] text-gray-500 text-center italic">
            点击实体可锁定/解锁视图
        </div>
    </div>
  );
};
