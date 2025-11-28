

import React, { useState } from 'react';
import { useGameStore } from '../store/useGameStore';
import { Shield, Sword, Zap } from 'lucide-react';

export const DraftModal = () => {
  const { draftOptions, applyDraft, stats } = useGameStore();
  const [hasSelected, setHasSelected] = useState(false);

  const handleSelect = (option: any) => {
      if (hasSelected) return;
      setHasSelected(true);
      // Small delay to show visual feedback
      setTimeout(() => {
          applyDraft(option);
      }, 200);
  };

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-10">
      <h2 className="text-4xl font-black text-white mb-2">WAVE {stats.wave} COMPLETE</h2>
      <p className="text-gray-400 mb-10">Choose tactical support for the next wave</p>

      <div className="grid grid-cols-3 gap-8 w-full max-w-5xl">
        {draftOptions.map(option => (
          <button
            key={option.id}
            onClick={() => handleSelect(option)}
            disabled={hasSelected}
            className={`
                group relative bg-slate-800 border-2 border-slate-700 hover:border-yellow-400 rounded-xl p-8 transition-all hover:-translate-y-2 text-left
                ${hasSelected ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <div className="text-6xl mb-6">{option.emoji}</div>
            
            <div className="flex items-center gap-2 mb-2">
              <span className={`px-2 py-1 rounded text-xs font-bold ${option.type === 'TEMP_UNIT' ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                {option.type === 'TEMP_UNIT' ? 'MERCENARY' : 'HERO BUFF'}
              </span>
            </div>

            <h3 className="text-2xl font-bold text-white mb-2">{option.name}</h3>
            <p className="text-gray-300 mb-6 min-h-[3rem]">{option.description}</p>
            
            <div className="w-full py-3 bg-slate-900 rounded text-center text-gray-500 font-mono text-sm group-hover:bg-yellow-500 group-hover:text-black transition-colors">
              {hasSelected ? 'PROCESSING...' : 'SELECT'}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};