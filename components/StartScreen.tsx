
import React from 'react';
import { Keyboard, MousePointer2, Zap } from 'lucide-react';

interface StartScreenProps {
  onStart: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onStart }) => {
  return (
    <div className="absolute inset-0 bg-sky-200/95 z-[100] flex flex-col items-center justify-center overflow-hidden">
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
         <div className="absolute top-10 left-10 text-9xl animate-spin-slow text-blue-500">⚙️</div>
         <div className="absolute bottom-10 right-10 text-9xl animate-bounce text-yellow-500">👾</div>
         <div className="absolute top-1/2 left-1/4 text-8xl opacity-30 text-green-500">🛡️</div>
      </div>

      <div className="relative z-10 text-center flex flex-col items-center">
        <div className="mb-4 flex items-center gap-3 animate-in slide-in-from-top duration-700">
            <span className="p-4 bg-white rounded-2xl shadow-lg border-2 border-blue-200 text-blue-500">
                <Keyboard size={40} />
            </span>
            <span className="p-4 bg-white rounded-2xl shadow-lg border-2 border-red-200 text-red-500">
                <Zap size={40} />
            </span>
        </div>

        <h1 className="text-7xl md:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-500 to-purple-600 mb-2 tracking-tight drop-shadow-sm text-stroke">
          动物键盘侠
        </h1>
        
        <h2 className="text-3xl md:text-5xl font-black text-slate-700 mb-8 tracking-widest uppercase">
           GRID TACTICS
        </h2>

        <div className="inline-block bg-white/80 backdrop-blur px-6 py-2 rounded-full text-sm font-bold text-slate-500 mb-12 shadow-sm border border-white">
            PvZ 改编版 v3.0 • 卡通版
        </div>

        <button 
          onClick={onStart}
          className="group relative px-12 py-6 bg-gradient-to-b from-yellow-400 to-orange-500 rounded-3xl font-black text-2xl md:text-3xl text-white shadow-[0_8px_0_rgb(217,119,6)] hover:shadow-[0_4px_0_rgb(217,119,6)] hover:translate-y-1 active:shadow-none active:translate-y-2 transition-all"
        >
          <span className="flex items-center gap-3 drop-shadow-md">
             开始防御 <MousePointer2 className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
          </span>
        </button>

        <p className="mt-12 text-slate-500 font-bold text-sm uppercase tracking-widest">
           招募单位 • 坚守阵地 • 保护核心
        </p>
      </div>
    </div>
  );
};