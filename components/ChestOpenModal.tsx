import React, { useEffect, useState } from 'react';
import { AmmoItem } from '../types';
import { RARITY_COLORS } from '../constants';

interface ChestOpenModalProps {
  onComplete: () => void;
  rewards: AmmoItem[];
}

export const ChestOpenModal: React.FC<ChestOpenModalProps> = ({ onComplete, rewards }) => {
  const [phase, setPhase] = useState<'IDLE' | 'SHAKE' | 'OPEN' | 'REVEAL' | 'DONE'>('IDLE');
  
  // Animation Sequence
  useEffect(() => {
    let t1: ReturnType<typeof setTimeout>, t2: ReturnType<typeof setTimeout>;
    
    // Start shaking immediately
    setPhase('SHAKE');
    
    t1 = setTimeout(() => {
        setPhase('OPEN'); // Flash and Open
    }, 1500);

    t2 = setTimeout(() => {
        setPhase('REVEAL'); // Show items
    }, 2000);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const handleCollect = () => {
    if (phase === 'REVEAL') {
        onComplete();
    }
  };

  return (
    <div className="absolute inset-0 bg-black/95 z-50 flex flex-col items-center justify-center overflow-hidden cursor-pointer" onClick={handleCollect}>
        
        {/* Background Rays */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-1000 ${phase === 'REVEAL' ? 'opacity-100' : 'opacity-0'}`}>
             <div className="w-[200vw] h-[200vw] bg-[conic-gradient(at_center,_var(--tw-gradient-stops))] from-yellow-500/10 via-slate-900 to-yellow-500/10 animate-spin-slow" />
        </div>

        {/* Title */}
        <div className={`text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-yellow-100 to-yellow-600 mb-16 tracking-[0.2em] transition-all duration-500 transform ${phase === 'REVEAL' ? 'scale-100 opacity-100 translate-y-0' : 'scale-50 opacity-0 translate-y-10'}`}>
            ELITE DROP
        </div>

        {/* Chest Animation */}
        <div className="relative mb-8">
            <div className={`text-9xl transition-transform duration-100 select-none
                ${phase === 'SHAKE' ? 'animate-shake' : ''}
                ${phase === 'OPEN' || phase === 'REVEAL' ? 'scale-0 opacity-0' : 'scale-100'}
            `}>
                📦
            </div>
            
            {/* Explosion Flash */}
            {phase === 'OPEN' && (
                <div className="absolute inset-0 -top-40 -left-40 w-96 h-96 bg-white rounded-full animate-ping opacity-90" />
            )}
        </div>

        {/* Rewards */}
        {phase === 'REVEAL' && (
            <div className="flex gap-8 z-10 animate-in zoom-in slide-in-from-bottom-10 duration-500">
                {rewards.map((item, idx) => (
                    <div 
                        key={idx} 
                        className="flex flex-col items-center p-8 bg-slate-900/80 backdrop-blur-md border-2 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] transform hover:scale-110 transition-transform group"
                        style={{ borderColor: RARITY_COLORS[item.rarity || 'COMMON'] }}
                    >
                        {/* Glow behind emoji */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                        
                        <div className="text-7xl mb-6 animate-bounce drop-shadow-2xl" style={{ animationDelay: `${idx * 0.15}s` }}>
                            {item.emoji}
                        </div>
                        <div className="text-xl font-bold mb-2 tracking-widest" style={{ color: RARITY_COLORS[item.rarity || 'COMMON'] }}>
                            {item.rarity}
                        </div>
                        <div className="text-sm font-mono text-gray-400 text-center">
                            DMG: <span className="text-white">{Math.round(item.damage)}</span> <br/> 
                            SPD: <span className="text-white">{item.speed}</span>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* CTA */}
        {phase === 'REVEAL' && (
            <div className="absolute bottom-20 text-gray-500 animate-pulse text-sm tracking-widest uppercase">
                [ Click anywhere to collect ]
            </div>
        )}
    </div>
  );
};