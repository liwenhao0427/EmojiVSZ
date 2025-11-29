
import React from 'react';

interface GameOverScreenProps {
  currentWave: number;
  onRestart: () => void;
}

export const GameOverScreen: React.FC<GameOverScreenProps> = ({ currentWave, onRestart }) => {
  return (
    <div className="absolute inset-0 bg-red-50/95 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-1000 backdrop-blur-md">
      <div className="text-9xl mb-4 animate-bounce">😭</div>
      <h1 className="text-8xl font-black text-red-500 mb-2 tracking-tighter text-stroke drop-shadow-sm">防线崩溃</h1>
      <p className="text-3xl mb-12 text-slate-600 font-bold">最终波次: <span className="text-red-500">{currentWave}</span></p>
      <button 
        onClick={onRestart} 
        className="px-12 py-5 bg-white border-2 border-slate-200 text-slate-800 font-black text-xl rounded-2xl hover:bg-slate-50 hover:scale-105 transition-all uppercase tracking-widest shadow-xl shadow-red-200"
      >
        重新挑战
      </button>
    </div>
  );
};