
import React, { useEffect, useRef } from 'react';
import { GameEngine } from './services/GameEngine';
import { StartScreen } from './components/StartScreen';
import { DraftModal } from './components/DraftModal';
import { GameOverScreen } from './components/GameOverScreen';
import { Shop } from './components/Shop';
import { useGameStore } from './store/useGameStore';
import { GamePhase } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from './constants';
import { HUD } from './components/HUD';

export default function App() {
  const { phase, initGame, stats, startNextWave } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // Initial load
  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(canvasRef.current);
    }
    
    // We keep the engine running during SHOP and DRAFT phases so the grid continues to render 
    // and interactions (like dragging units) still work, even if game logic (enemies) is paused.
    if (phase === GamePhase.COMBAT || phase === GamePhase.SHOP || phase === GamePhase.DRAFT) {
      engineRef.current?.start();
    } else {
      engineRef.current?.stop();
    }
  }, [phase]);

  const handleRestart = () => {
    initGame(); // Reset to Start Screen
  };

  const handleStartGame = () => {
    startNextWave(); // Wave 0 -> 1, Phase -> COMBAT
  };

  const handleShopAction = (type: 'WEAPON' | 'ITEM', data: any) => {
      // Logic for buying could be moved to store, but for now simple state update
      // This part assumes we might want to update store from here
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white font-sans relative overflow-hidden">
      
      {/* Main Game Container */}
      <div 
        className="relative shadow-2xl border border-slate-800 bg-slate-900 rounded-lg overflow-hidden"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <canvas 
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="block w-full h-full cursor-pointer"
        />

        {/* HUD Overlay */}
        {(phase === GamePhase.COMBAT || phase === GamePhase.SHOP) && (
          <>
            <HUD stats={stats} waveTime={0} currentWave={stats.wave} />
            
            {/* Moved Drag Hint to Bottom Left to avoid UI overlap */}
            <div className="absolute bottom-4 left-4 pointer-events-none z-10">
                 <div className="bg-slate-900/80 backdrop-blur border border-white/10 px-4 py-2 rounded-lg text-xs text-gray-400">
                   Drag units to swap positions
                </div>
            </div>
          </>
        )}

        {/* Modals & Screens */}
        {phase === GamePhase.START && <StartScreen onStart={handleStartGame} />}
        
        {phase === GamePhase.DRAFT && <DraftModal />}
        
        {phase === GamePhase.SHOP && (
            <Shop 
                stats={stats} 
                currentWave={stats.wave}
                onNextWave={startNextWave}
                onBuyWeapon={(w) => { /* Add to AmmoBay/Grid logic if needed, but grid is separate currently. Assume shop just adds to inventory? Current logic implies grid. */ }}
                onBuyItem={(i) => { /* Update stats logic */ }}
                updateGold={(amount) => { useGameStore.setState(s => ({ stats: { ...s.stats, gold: s.stats.gold + amount } })) }}
            />
        )}
        
        {phase === GamePhase.GAME_OVER && (
          <GameOverScreen currentWave={stats.wave} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}