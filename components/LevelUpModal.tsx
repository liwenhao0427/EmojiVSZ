

import React from 'react';
import { TEMP_UNIT_POOL, WEAPON_POOL } from '../constants';
// FIX: Import WeaponClass to use for type casting.
import { PlayerStats, DraftOption, Unit, WeaponClass } from '../types';
import { Sparkles, Sword, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface LevelUpModalProps {
  onSelect: (option: DraftOption) => void;
  level: number;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ onSelect, level }) => {
  const [options, setOptions] = React.useState<DraftOption[]>([]);

  React.useEffect(() => {
    // 1. Create a combined pool of units for draft
    const allUnitOptions: Partial<Unit>[] = [
      // Higher chance for dedicated temp units
      ...TEMP_UNIT_POOL,
      ...TEMP_UNIT_POOL,
      // Add all buyable weapons as potential temp units
      ...WEAPON_POOL.map(w => ({
        name: w.name,
        emoji: w.emoji,
        // FIX: Cast weaponClass to WeaponClass to match the Unit type.
        type: w.weaponClass as WeaponClass,
        damage: w.damage,
        maxCooldown: w.cooldown,
        hp: 100,
        maxHp: 100,
        range: 1200, // A standard range for drafted units
        description: `A temporary ${w.name} for this wave only.`
      }))
    ];

    const heroUpgrades: Omit<DraftOption, 'id'>[] = [
        { type: 'TEMP_BUFF', name: 'Tri-Shot', emoji: '🔱', description: 'Hero fires 3 projectiles, covering adjacent rows.', data: { heroAttackType: 'TRI_SHOT' } },
        { type: 'TEMP_BUFF', name: 'Penta-Shot', emoji: '🖐️', description: 'Hero fires 5 projectiles, covering all rows.', data: { heroAttackType: 'PENTA_SHOT' } },
        { type: 'TEMP_BUFF', name: 'Seeking Shots', emoji: '🎯', description: 'Hero projectiles now track enemies.', data: { heroAttackType: 'TRACKING' } },
        { type: 'TEMP_BUFF', name: 'Focused Energy', emoji: '🧘', description: 'Ultimate requires 20 less energy to cast.', data: { heroMaxEnergy: -20 } },
        { type: 'TEMP_BUFF', name: 'Rapid Charge', emoji: '⚡️', description: 'Ultimate energy charges 50% faster.', data: { heroEnergyGainRate: 0.5 } },
    ];
    
    // Existing base options
    const baseBuffOptions: Omit<DraftOption, 'id'>[] = [
        { type: 'TEMP_BUFF', name: 'Hero Overdrive', emoji: '🚀', description: 'Hero attacks 100% faster for this wave.', data: { heroAttackSpeed: 1.0 } },
        { type: 'TEMP_BUFF', name: 'Battle Cry', emoji: '🗣️', description: 'All units deal +20% damage for this wave.', data: { damage: 0.2 } }
    ];

    const availableOptions: Omit<DraftOption, 'id'>[] = [];
    
    // Add a temp unit option
    const unitTemplate = allUnitOptions[Math.floor(Math.random() * allUnitOptions.length)];
    availableOptions.push({
        type: 'TEMP_UNIT',
        name: `Merc: ${unitTemplate.name}`,
        emoji: unitTemplate.emoji || '❓',
        description: unitTemplate.description || 'Deploys a powerful unit for ONE wave only.',
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
                LEVEL UP!
            </h2>
            <p className="text-gray-400 mt-2">Choose an upgrade to continue the fight</p>
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
                    {opt.type === 'TEMP_UNIT' ? 'MERCENARY' : 'WAVE BUFF'}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{opt.name}</h3>
                <p className="text-gray-300 text-sm">{opt.description}</p>
              </div>

              <div className="w-full mt-4 py-3 bg-gray-800 rounded group-hover:bg-cyan-600/20 text-xs font-mono text-gray-400 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">
                 SELECT
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};