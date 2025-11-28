

import React from 'react';
import { TEMP_UNIT_POOL } from '../constants';
import { PlayerStats, DraftOption, Unit } from '../types';
import { Sparkles, Sword, Zap } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

interface LevelUpModalProps {
  onSelect: (option: DraftOption) => void;
  level: number;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ onSelect, level }) => {
  const [options, setOptions] = React.useState<DraftOption[]>([]);

  React.useEffect(() => {
    // Generate 3 random Draft Options (Temp Unit or Hero Buff)
    const newOptions: DraftOption[] = [];
    
    for (let i = 0; i < 3; i++) {
        const isUnit = Math.random() > 0.5;
        
        if (isUnit) {
            const template = TEMP_UNIT_POOL[Math.floor(Math.random() * TEMP_UNIT_POOL.length)];
            newOptions.push({
                id: uuidv4(),
                type: 'TEMP_UNIT',
                name: `Merc: ${template.name}`,
                emoji: template.emoji || '❓',
                description: 'Deploys a powerful unit for ONE wave only.',
                data: template
            });
        } else {
            // Hero Buff
            const isDmg = Math.random() > 0.5;
            if (isDmg) {
                newOptions.push({
                    id: uuidv4(),
                    type: 'TEMP_BUFF',
                    name: 'Hero Rage',
                    emoji: '😡',
                    description: 'Hero deals +50% Damage this wave.',
                    data: { damage: 0.5 }
                });
            } else {
                 newOptions.push({
                    id: uuidv4(),
                    type: 'TEMP_BUFF',
                    name: 'Hyper Speed',
                    emoji: '⚡',
                    description: 'Hero attacks +50% Faster this wave.',
                    data: { attackSpeed: 0.5 }
                });
            }
        }
    }
    setOptions(newOptions);
  }, [level]);

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-700">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 animate-pulse">
                REINFORCEMENTS!
            </h2>
            <p className="text-gray-400 mt-2">Draft temporary support for the next battle</p>
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
                    {opt.type === 'TEMP_UNIT' ? 'MERCENARY' : 'HERO BUFF'}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{opt.name}</h3>
                <p className="text-gray-300 text-sm">{opt.description}</p>
              </div>

              <div className="w-full mt-4 py-3 bg-gray-800 rounded group-hover:bg-cyan-600/20 text-xs font-mono text-gray-400 group-hover:text-cyan-400 transition-colors uppercase tracking-widest">
                 DRAFT
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};