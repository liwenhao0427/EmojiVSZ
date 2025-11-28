
import React from 'react';
import { Keyboard, MousePointer2, Zap } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 bg-slate-950 z-[100] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
         <div className="absolute top-10 left-10 text-9xl animate-spin-slow">⚙️</div>
         <div className="absolute bottom-10 right-10 text-9xl animate-bounce">👾</div>
         <div className="absolute top-1/2 left-1/4 text-8xl opacity-50">🛡️</div>
      </div>

      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="mb-2 flex items-center gap-3 animate-in slide-in-from-top duration-700">
            <span className="p-3 bg-blue-600/20 rounded-xl border border-blue-500/50 text-blue-400">
                <Keyboard size={32} />
            </span>
            <span className="p-3 bg-red-600/20 rounded-xl border border-red-500/50 text-red-400">
                <Zap size={32} />
            </span>
        </div>

        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 mb-2 tracking-tight filter drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]">
          键盘侠<br/>大战水军
        </h1>
        
        <h2 className="text-3xl md:text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500 mb-8 tracking-widest uppercase">
           GRID TACTICS
        </h2>

        <div className="inline-block bg-slate-900/80 backdrop-blur border border-white/10 px-4 py-1 rounded-full text-xs font-mono text-gray-400 mb-12">
            PvZ 改编版 v3.0
        </div>

        <button 
          onClick={onStart}
          className="group relative px-12 py-5 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-2xl font-black text-xl md:text-2xl text-white shadow-[0_0_40px_rgba(234,179,8,0.4)] hover:shadow-[0_0_60px_rgba(234,179,8,0.6)] hover:scale-105 transition-all duration-300"
        >
          <span className="flex items-center gap-3">
             开始防御 <MousePointer2 className="group-hover:translate-x-1 transition-transform" />
          </span>
          <div className="absolute inset-0 rounded-2xl ring-2 ring-white/50 group-hover:ring-offset-2 transition-all"></div>
        </button>

        <p className="mt-8 text-gray-500 font-mono text-xs uppercase tracking-widest">
           招募单位 • 坚守阵地 • 保护核心
        </p>
      </div>
    </div>
  );
};
