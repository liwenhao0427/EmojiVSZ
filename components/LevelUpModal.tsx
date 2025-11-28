

import React from 'react';
import { PlayerStats, DraftOption, Unit, WeaponClass, UnitData } from '../types';
import { Sparkles, Sword, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { UNIT_DATA } from '../data/units';

interface LevelUpModalProps {
  onSelect: (option: DraftOption) => void;
  level: number;
}

// Convert UnitData to a partial Unit for drafting
const unitDataToDraftUnit = (w: UnitData): Partial<Unit> => ({
    name: w.name,
    emoji: w.emoji,
    type: w.type,
    damage: w.damage,
    maxCooldown: w.cd,
    hp: w.maxHp,
    maxHp: w.maxHp,
    range: w.range,
    description: `一个临时的 ${w.name}，仅在本波次生效。`,
    effects: w.effect,
});


export const LevelUpModal: React.FC<LevelUpModalProps> = ({ onSelect, level }) => {
  const [options, setOptions] = React.useState<DraftOption[]>([]);

  React.useEffect(() => {
    // 1. Create a combined pool of units for draft
    const allUnitOptions: Partial<Unit>[] = [
      ...Object.values(UNIT_DATA).map(unitDataToDraftUnit)
    ];

    const heroUpgrades: Omit<DraftOption, 'id'>[] = [
        { type: 'TEMP_BUFF', name: 'Tri-Shot', emoji: '🔱', description: '英雄发射3枚弹射物，覆盖相邻行。', data: { heroAttackType: 'TRI_SHOT' } },
        { type: 'TEMP_BUFF', name: 'Penta-Shot', emoji: '🖐️', description: '英雄发射5枚弹射物，覆盖所有行。', data: { heroAttackType: 'PENTA_SHOT' } },
        { type: 'TEMP_BUFF', name: 'Seeking Shots', emoji: '🎯', description: '英雄的弹射物现在会追踪敌人。', data: { heroAttackType: 'TRACKING' } },
        { type: 'TEMP_BUFF', name: 'Focused Energy', emoji: '🧘', description: '终极技能所需能量减少20点。', data: { heroMaxEnergy: -20 } },
        { type: 'TEMP_BUFF', name: 'Rapid Charge', emoji: '⚡️', description: '终极技能能量充能速度提高50%。', data: { heroEnergyGainRate: 0.5 } },
    ];
    
    // Existing base options
    const baseBuffOptions: Omit<DraftOption, 'id'>[] = [
        { type: 'TEMP_BUFF', name: 'Hero Overdrive', emoji: '🚀', description: '本波次英雄攻击速度提高100%。', data: { heroAttackSpeed: 1.0 } },
        { type: 'TEMP_BUFF', name: 'Battle Cry', emoji: '🗣️', description: '本波次所有单位伤害提高20%。', data: { damage: 0.2 } }
    ];

    const availableOptions: Omit<DraftOption, 'id'>[] = [];
    
    // Add a temp unit option
    const unitTemplate = allUnitOptions[Math.floor(Math.random() * allUnitOptions.length)];
    availableOptions.push({
        type: 'TEMP_UNIT',
        name: `雇佣兵: ${unitTemplate.name}`,
        emoji: unitTemplate.emoji || '❓',
        description: unitTemplate.description || '部署一个强大的单位，仅限本波次使用。',
        data: unitTemplate
    });
    
    // Add two buff options from the combined pool of buffs
    const allBuffs = [...heroUpgrades, ...baseBuffOptions];
    // Shuffle and pick 2 unique buffs
    const shuffledBuffs = allBuffs.sort(() => 0.5 - Math.random());
    availableOptions.push(...shuffledBuffs.slice(0, 2));

    const finalOptions = availableOptions.sort(() => 0.5 - Math.random());
    const newOptions = finalOptions.map(opt => ({...opt, id: uuidv4() }));

    setOptions(newOptions);
  }, [level]);

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-700">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse">
                升级！
            </h2>
            <p className="text-gray-400 mt-2">选择一个升级以继续战斗</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(opt)}
              className="group relative bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 hover:border-cyan-500 rounded-xl p-6 transition-all duration-200 hover:-translate-y-2 flex flex-col items-center text-center h-80 justify-between"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                 <Sparkles className="text-cyan-400" />
              </div>

              <div className="bg-gray-900 w-20 h-20 rounded-full flex items-center justify-center text-4xl mb-4 group-hover:scale-110 transition-transform shadow-lg ring-2 ring-gray-600 group-hover:ring-cyan-400">
                {opt.emoji}
              </div>

              <div>
                <div className={`text-xs font-bold uppercase mb-1 px-2 py-1 rounded inline-block ${opt.type === 'TEMP_UNIT' ? 'bg-blue-900 text-blue-300' : 'bg-orange-900 text-orange-300'}`}>
                    {opt.type === 'TEMP_UNIT' ? '雇佣兵' : '波次增益'}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{opt.name}</h3>
                <p className="text-gray-300 text-sm">{opt.description}</p>
              </div>

              <div className="w-full mt-4 py-3 bg-gray-800 rounded group-hover:bg-cyan-600/20 text-xs font-mono text-gray-400 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">
                 选择
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};