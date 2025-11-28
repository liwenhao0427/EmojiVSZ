
import React from 'react';

interface GameOverScreenProps {
  currentWave: number;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ currentWave, onRestart }) => {
  return (
    <div className="absolute inset-0 bg-red-950/90 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-1000">
      <h1 className="text-8xl font-black text-red-500 mb-4 tracking-tighter drop-shadow-[0_10px_10px_rgba(0,0,0,0.8)]">防线崩溃</h1>
      <p className="text-2xl mb-8 text-red-200 font-mono">最终波次: {currentWave}</p>
      <button 
        onClick={onRestart} 
        className="px-8 py-3 bg-white text-black font-bold rounded hover:bg-gray-200 transition-colors uppercase tracking-widest"
      >
        重新挑战
      </button>
    </div>
  );
};
