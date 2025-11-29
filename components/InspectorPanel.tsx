


import React from 'react';
import { InspectableEntity, Unit, StatsBreakdown } from '../types';
import { Sword, Wind, Target, Activity, Crosshair, Heart } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { CELL_SIZE, CANVAS_WIDTH, GRID_COLS } from '../constants';

interface InspectorPanelProps {
  entity: InspectableEntity;
}

const ATTACK_PATTERN_MAP: Record<string, string> = {
    SHOOT: '定点射击',
    THRUST: '近战突刺',
    SWING: '扇形挥砍',
    STREAM: '持续喷射',
    NONE: '被动/无'
};

const StatRow = ({ icon: Icon, label, value, tooltip, color, tooltipOnRight }: any) => (
    <div className="group relative flex justify-between items-center py-2 border-b border-slate-100 last:border-0 pointer-events-auto">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-400">
            <Icon size={14} className={color}/>
            <span className="cursor-help decoration-dotted underline underline-offset-2 decoration-slate-300">{label}</span>
        </div>
        <div className="font-mono font-bold text-sm text-slate-700">{value}</div>
        
        {/* Tooltip */}
        <div className={`
            hidden group-hover:block absolute top-0 w-52 bg-slate-800 text-white p-3 rounded-xl shadow-xl z-50 text-xs pointer-events-none whitespace-pre-wrap leading-relaxed
            ${tooltipOnRight ? 'left-full ml-4' : 'right-full mr-4'}
        `}>
            {tooltip}
        </div>
    </div>
);

export const InspectorPanel: React.FC<InspectorPanelProps> = ({ entity }) => {
  if (!entity) return null;

  const isUnit = entity.type === 'UNIT';
  const { data, statsBreakdown } = entity;

  let finalDamage = Math.round(
      (statsBreakdown.damage.base + statsBreakdown.damage.bonus) * statsBreakdown.damage.multiplier
  );
  let finalCooldown = (statsBreakdown.cooldown.base / statsBreakdown.cooldown.multiplier).toFixed(2);
  
  if (!isUnit) {
      finalDamage = data.damage;
      finalCooldown = statsBreakdown.cooldown.base.toFixed(2);
  }

  // Build the tooltip strings.
  let dmgTooltip = `基础: ${statsBreakdown.damage.base}\n加成: +${statsBreakdown.damage.bonus}`;
  let cdTooltip = `基础: ${statsBreakdown.cooldown.base}s`;
  let hpTooltip = '计算中...';

  if (isUnit) {
      if (statsBreakdown.damage.breakdown) {
          const db = statsBreakdown.damage.breakdown;
          const cb = statsBreakdown.cooldown.breakdown;

          const dmgMultiplierParts = [
              `全局: x${(1 + db.globalPct).toFixed(2)}`,
              db.heroPct > 0 ? `英雄: x${(1 + db.heroPct).toFixed(2)}` : null,
              db.tempPct > 0 ? `临时: x${(1 + db.tempPct).toFixed(2)}` : null
          ].filter(Boolean).join('\n');
          dmgTooltip += `\n---\n${dmgMultiplierParts}\n总倍率: x${statsBreakdown.damage.multiplier.toFixed(2)}`;
          
          const cdMultiplierParts = [
              `全局: x${(1 + cb.globalPct).toFixed(2)}`,
              cb.heroPct > 0 ? `英雄: x${(1 + cb.heroPct).toFixed(2)}` : null,
              cb.tempPct > 0 ? `临时: x${(1 + cb.tempPct).toFixed(2)}` : null
          ].filter(Boolean).join('\n');
          cdTooltip += `\n---\n${cdMultiplierParts}\n总倍率: x${statsBreakdown.cooldown.multiplier.toFixed(2)}`;
      } else {
          dmgTooltip += `\n倍率: x${statsBreakdown.damage.multiplier.toFixed(2)}`;
          cdTooltip += `\n倍率: /${statsBreakdown.cooldown.multiplier.toFixed(2)}`;
      }
      if (statsBreakdown.hp) {
          const hpb = statsBreakdown.hp;
          hpTooltip = `基础: ${hpb.base}\n加成: +${hpb.bonus}\n倍率: x${hpb.multiplier.toFixed(2)}`;
      }
  }


  const hpPct = Math.max(0, data.hp / data.maxHp) * 100;

  const rangeInPixels = 'range' in data ? (data as Unit).range * CELL_SIZE : 0;
  const rangeInCells = 'range' in data ? (data as Unit).range : 0;
  const displayRange = rangeInPixels >= 2000 ? "全屏" : `${rangeInCells} 格`;
  
  const attackPatternDisplay = isUnit && 'attackPattern' in data 
      ? ATTACK_PATTERN_MAP[(data as Unit).attackPattern || 'NONE'] 
      : null;

  const entityIsOnRight = isUnit 
      ? (data as Unit).col >= GRID_COLS / 2 
      : (data as any).x > CANVAS_WIDTH / 2;
  
  const panelPositionClass = entityIsOnRight ? 'left-4' : 'right-4';
  const tooltipOnRight = entityIsOnRight;

  return (
    <div className={`absolute ${panelPositionClass} top-24 w-64 glass-panel p-5 animate-in slide-in-from-${entityIsOnRight ? 'left' : 'right'} duration-300 pointer-events-none shadow-2xl shadow-blue-900/10 transition-all`}>
        
        <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-slate-100">
                {data.emoji}
            </div>
            <div>
                <h3 className="font-black text-slate-800 text-lg leading-tight mb-1">
                    {('name' in data ? data.name : 'Unknown')}
                </h3>
                <span className={`text-[10px] px-2 py-1 rounded-lg font-bold uppercase tracking-wider ${isUnit ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    {isUnit ? (data as any).type : (data as any).type}
                </span>
            </div>
        </div>
        
        {data.description && (
            <div className="text-xs font-bold text-slate-500 mb-4 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-normal">
                {data.description}
            </div>
        )}

        <div className="group relative mb-5 bg-slate-50 p-3 rounded-xl border border-slate-100 pointer-events-auto cursor-help">
            <div className="flex justify-between text-[10px] text-slate-400 mb-1.5 font-bold">
                <span>HP</span>
                <span className="font-mono text-slate-600">{Math.ceil(data.hp)} / {data.maxHp}</span>
            </div>
            <div className="h-3 bg-slate-200 rounded-full overflow-hidden">
                <div 
                    className={`h-full transition-all duration-200 ${isUnit ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${hpPct}%` }}
                />
            </div>
            {isUnit && (
                <div className={`
                    hidden group-hover:block absolute top-full mt-2 w-52 bg-slate-800 text-white p-3 rounded-xl shadow-xl z-50 text-xs pointer-events-none whitespace-pre-wrap leading-relaxed
                    ${tooltipOnRight ? 'left-0' : 'right-0'}
                `}>
                    {hpTooltip}
                </div>
            )}
        </div>

        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm pointer-events-auto">
             <StatRow 
                icon={Sword} 
                label="伤害" 
                value={finalDamage} 
                color="text-red-500"
                tooltip={dmgTooltip}
                tooltipOnRight={tooltipOnRight}
             />
             <StatRow 
                icon={Wind} 
                label="冷却" 
                value={`${finalCooldown}s`} 
                color="text-yellow-500"
                tooltip={cdTooltip}
                tooltipOnRight={tooltipOnRight}
             />
             {'range' in data && (
                 <StatRow 
                    icon={Target} 
                    label="射程" 
                    value={displayRange}
                    color="text-blue-500"
                    tooltip={`实际像素: ${rangeInPixels} px`}
                    tooltipOnRight={tooltipOnRight}
                 />
             )}
             {attackPatternDisplay && (
                 <StatRow 
                    icon={Crosshair} 
                    label="模式" 
                    value={attackPatternDisplay.split(' ')[0]} 
                    color="text-purple-500"
                    tooltip={attackPatternDisplay}
                    tooltipOnRight={tooltipOnRight}
                 />
             )}
             {'speed' in data && (
                 <StatRow 
                    icon={Activity} 
                    label="速度" 
                    value={(data as any).speed} 
                    color="text-orange-500"
                    tooltip="移动速度 (像素/秒)"
                    tooltipOnRight={tooltipOnRight}
                 />
             )}
        </div>

        <div className="mt-4 text-[10px] text-slate-400 text-center font-bold">
            点击实体锁定视图
        </div>
    </div>
  );
};