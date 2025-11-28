import React from 'react';
import { AVAILABLE_UPGRADES } from '../constants';
import { PlayerStats, AmmoItem } from '../types';
import { Sparkles, ArrowUp, Plus } from 'lucide-react';

interface LevelUpModalProps {
  onSelect: (upgrade: any) => void;
  level: number;
}

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ onSelect, level }) => {
  // Pick 3 random upgrades
  const [options, setOptions] = React.useState<any[]>([]);

  React.useEffect(() => {
    const shuffled = [...AVAILABLE_UPGRADES].sort(() => 0.5 - Math.random());
    setOptions(shuffled.slice(0, 3));
  }, [level]); // Re-roll on level change

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-4xl w-full border border-gray-700">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 animate-pulse">
                LEVEL UP!
            </h2>
            <p className="text-gray-400 mt-2">Choose your upgrade</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => onSelect(opt)}
              className="group relative bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 hover:border-yellow-500 rounded-xl p-6 transition-all duration-200 hover:-translate-y-2 flex flex-col items-center text-center h-64 justify-between"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                 <Sparkles className="text-yellow-400" />
              </div>

              <div className="bg-gray-900 w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-4 group-hover:scale-110 transition-transform">
                {opt.type === 'AMMO' ? opt.data.emoji : (opt.value > 0 ? <ArrowUp className="text-green-400"/> : <Plus className="text-blue-400"/>)}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white mb-2">{opt.label}</h3>
                <p className="text-gray-300 text-sm">{opt.detail}</p>
              </div>

              <div className="w-full mt-4 py-2 bg-gray-800 rounded group-hover:bg-yellow-600/20 text-xs font-mono text-gray-400 group-hover:text-yellow-400 transition-colors">
                 SELECT
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};