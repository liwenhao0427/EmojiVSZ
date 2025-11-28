
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './services/GameEngine';
import { StartScreen } from './components/StartScreen';
import { LevelUpModal } from './components/LevelUpModal';
import { GameOverScreen } from './components/GameOverScreen';
import { Shop } from './components/Shop';
import { useGameStore } from './store/useGameStore';
import { GamePhase } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, WAVE_CONFIG } from './constants';
import { HUD } from './components/HUD';

export default function App() {
  const { phase, setPhase, initGame, stats, startNextWave } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Initial load
  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(
        canvasRef.current,
        undefined,
        {
          onTimeUpdate: (t) => setTimeLeft(t),
          onGainLoot: (xp, gold) => {
              // 1. Update State
              const store = useGameStore.getState();
              
              let newXp = store.stats.xp + xp;
              let newMaxXp = store.stats.maxXp;
              let newLevel = store.stats.level;
              let didLevelUp = false;

              // Check Level Up Logic
              if (newXp >= newMaxXp) {
                  newXp -= newMaxXp;
                  newLevel += 1;
                  newMaxXp = Math.floor(newMaxXp * 1.2);
                  didLevelUp = true;
              }

              useGameStore.setState(s => ({ 
                  stats: { 
                      ...s.stats, 
                      gold: s.stats.gold + gold,
                      xp: newXp,
                      maxXp: newMaxXp,
                      level: newLevel
                  } 
              }));

              // 2. Trigger Level Up UI if needed
              if (didLevelUp) {
                  engineRef.current?.stop();
                  setShowLevelUp(true);
              }
          },
          onDamagePlayer: (amount) => {
               // Logic handled in store damageUnit usually, but can trigger sound/shake here
          },
          onWaveEnd: () => {
              // Strict Wave End Transition -> Shop
              setPhase(GamePhase.SHOP);
          }
        }
      );
    }
    
    // We keep the engine running during SHOP so grid rendering works
    // Pause during LEVEL UP (handled by manual start/stop in logic above) or START
    if (phase === GamePhase.COMBAT || phase === GamePhase.SHOP) {
      if (!showLevelUp) {
        engineRef.current?.start();
      }
    } else {
      engineRef.current?.stop();
    }
    
    // Explicitly start the wave timer and logic when entering COMBAT
    if (phase === GamePhase.COMBAT && !showLevelUp) {
        const config = WAVE_CONFIG.find(w => w.wave === stats.wave) || WAVE_CONFIG[WAVE_CONFIG.length-1];
        engineRef.current?.startWave(config.duration, stats.wave);
    }
  }, [phase, stats.wave, showLevelUp]);

  const handleRestart = () => {
    initGame();
    setShowLevelUp(false);
  };

  const handleStartGame = () => {
    startNextWave();
  };

  const handleLevelUpSelect = (upgrade: any) => {
      // Apply Upgrade Logic
      const store = useGameStore.getState();
      
      if (upgrade.type === 'STAT') {
          // Simplistic Stat Application
          if (upgrade.label === "Max HP Up") {
             useGameStore.setState(s => ({ stats: { ...s.stats, maxHp: s.stats.maxHp + upgrade.value, hp: s.stats.hp + upgrade.value } }));
          } else if (upgrade.label === "Damage Up") {
             useGameStore.setState(s => ({ stats: { ...s.stats, damagePercent: s.stats.damagePercent + upgrade.value } }));
          }
      }

      setShowLevelUp(false);
      engineRef.current?.start(); // Resume
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
            <HUD stats={stats} waveTime={timeLeft} currentWave={stats.wave} />
            
            <div className="absolute bottom-4 left-4 pointer-events-none z-10">
                 <div className="bg-slate-900/80 backdrop-blur border border-white/10 px-4 py-2 rounded-lg text-xs text-gray-400">
                   Drag units to swap positions
                </div>
            </div>
          </>
        )}

        {/* Modals & Screens */}
        {phase === GamePhase.START && <StartScreen onStart={handleStartGame} />}
        
        {/* Level Up Overlay (Triggers on XP Threshold) */}
        {showLevelUp && (
            <LevelUpModal 
                level={stats.level} 
                onSelect={handleLevelUpSelect} 
            />
        )}
        
        {phase === GamePhase.SHOP && (
            <Shop 
                stats={stats} 
                currentWave={stats.wave}
                onNextWave={startNextWave}
                onBuyWeapon={(w) => { /* Add logic */ }}
                onBuyItem={(i) => { /* Add logic */ }}
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
