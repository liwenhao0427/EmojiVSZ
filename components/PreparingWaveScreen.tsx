
import React from 'react';
import { useGameStore } from '../store/useGameStore';
import { Loader } from 'lucide-react';

export const PreparingWaveScreen: React.FC = () => {
  const { wave } = useGameStore(state => state.stats);

  return (
    <div className="absolute inset-0 bg-slate-950/90 z-[100] flex flex-col items-center justify-center animate-in fade-in duration-500">
      <Loader size={64} className="text-cyan-400 animate-spin mb-8" />
      <h1 className="text-4xl font-black text-white mb-2 tracking-wider">
        正在准备
      </h1>
      <p className="text-2xl text-cyan-300 font-mono">
        第 {wave} 波
      </p>
    </div>
  );
};
