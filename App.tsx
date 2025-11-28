

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './services/GameEngine';
import { StartScreen } from './components/StartScreen';
import { LevelUpModal } from './components/LevelUpModal';
import { GameOverScreen } from './components/GameOverScreen';
import { Shop } from './components/Shop';
import { useGameStore } from './store/useGameStore';
import { GamePhase, DraftOption, InspectableEntity } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, WAVE_CONFIG } from './constants';
import { HUD } from './components/HUD';
import { InspectorPanel } from './components/InspectorPanel';

export default function App() {
  const { phase, setPhase, initGame, stats, startNextWave, applyDraft } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const waveStartedRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [inspectedEntity, setInspectedEntity] = useState<InspectableEntity>(null);

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
              const store = useGameStore.getState();
              
              let newXp = store.stats.xp + xp;
              let newMaxXp = store.stats.maxXp;
              let newLevel = store.stats.level;
              let didLevelUp = false;

              // Check Level Up Logic
              if (newXp >= newMaxXp) {
                  newXp -= newMaxXp;
                  newLevel += 1;
                  newMaxXp = Math.floor(newMaxXp * 1.5);
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

              if (didLevelUp) {
                  engineRef.current?.stop();
                  setShowLevelUp(true);
              }
          },
          onDamagePlayer: (amount) => {
               // Visual shake only
          },
          onWaveEnd: () => {
              setPhase(GamePhase.SHOP);
          },
          onGameOver: () => {
              engineRef.current?.stop();
              setPhase(GamePhase.GAME_OVER);
          },
          onInspect: (entity) => {
              setInspectedEntity(entity);
          }
        }
      );
    }
    
    // Engine Control
    if (phase === GamePhase.COMBAT || phase === GamePhase.SHOP) {
      if (!showLevelUp) {
        engineRef.current?.start();
      }
    } else {
      engineRef.current?.stop();
    }
    
    // Wave Start
    if (phase === GamePhase.COMBAT && !showLevelUp && waveStartedRef.current !== stats.wave) {
        waveStartedRef.current = stats.wave;
        const config = WAVE_CONFIG.find(w => w.wave === stats.wave) || WAVE_CONFIG[WAVE_CONFIG.length-1];
        engineRef.current?.startWave(config.duration, stats.wave);
    }
  }, [phase, stats.wave, showLevelUp]);

  const handleRestart = () => {
    initGame();
    setShowLevelUp(false);
    setInspectedEntity(null);
    waveStartedRef.current = 0;
  };

  const handleStartGame = () => {
    startNextWave();
  };

  const handleDraftSelect = (option: DraftOption) => {
      applyDraft(option);
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
            <InspectorPanel entity={inspectedEntity} />
            
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
                onSelect={handleDraftSelect} 
            />
        )}
        
        {phase === GamePhase.SHOP && (
            <Shop 
                stats={stats} 
                currentWave={stats.wave}
                onNextWave={startNextWave}
                onBuyWeapon={() => {}} // Deprecated by addUnit inside Shop
                onBuyItem={(item) => {
                     // Apply permanent item stats
                     const store = useGameStore.getState();
                     const newStats = { ...store.stats };
                     Object.entries(item.stats).forEach(([k, v]) => {
                         (newStats as any)[k] += v;
                     });
                     useGameStore.setState({ stats: newStats });
                }}
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
