

import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './services/engine';
import { LevelUpModal } from './components/LevelUpModal';
import { GameOverScreen } from './components/GameOverScreen';
import { Shop } from './components/Shop';
import { useGameStore } from './store/useGameStore';
import { GamePhase, DraftOption, InspectableEntity, BrotatoItem } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, INITIAL_STATS } from './constants';
import { WAVE_DATA } from './data/waves';
import { HUD } from './components/HUD';
import { InspectorPanel } from './components/InspectorPanel';
import { InventoryPanel } from './components/InventoryPanel';

export default function App() {
  const { phase, setPhase, initGame, stats, startNextWave, applyDraft, setInspectedEntity, buyBrotatoItem } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const waveStartedRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Subscribe to inspected entity changes from the store
  const inspectedEntity = useGameStore(state => state.inspectedEntity);

  // Initial load
  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      engineRef.current = new GameEngine(
        canvasRef.current,
        {
          onTimeUpdate: (t) => setTimeLeft(t),
          onGainLoot: (xp, gold) => {
              const store = useGameStore.getState();
              
              let newXp = store.stats.xp + xp * (store.stats.xpGain || 1.0);
              let newMaxXp = store.stats.maxXp;
              let newLevel = store.stats.level;
              let didLevelUp = false;

              if (newXp >= newMaxXp) {
                  newXp -= newMaxXp;
                  newLevel += 1;
                  newMaxXp = INITIAL_STATS.maxXp + (newLevel - 1) * 25; // Linear XP Scaling
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
        const config = WAVE_DATA.find(w => w.wave === stats.wave) || WAVE_DATA[WAVE_DATA.length-1];
        engineRef.current?.startWave(config.duration, stats.wave);
    }
    
    return () => {
        // On unmount, ensure engine is cleaned up.
        // This is more of a safety net for strict mode.
        // engineRef.current?.cleanup(); 
    }
  }, [phase, stats.wave, showLevelUp, initGame, setPhase, setInspectedEntity]);

  const handleRestart = () => {
    initGame();
    setShowLevelUp(false);
    setInspectedEntity(null);
    waveStartedRef.current = 0;
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
            
             {phase === GamePhase.SHOP && <InventoryPanel />}
          </>
        )}

        {/* Modals & Screens */}
        
        {/* Level Up Overlay (Triggers on XP Threshold) */}
        {showLevelUp && (
            <LevelUpModal 
                level={stats.level} 
                onSelect={handleDraftSelect} 
            />
        )}
        
        {phase === GamePhase.SHOP && (
            <Shop 
                onNextWave={startNextWave}
                onBuyItem={(item) => buyBrotatoItem(item)}
            />
        )}
        
        {phase === GamePhase.GAME_OVER && (
          <GameOverScreen currentWave={stats.wave} onRestart={handleRestart} />
        )}
      </div>
    </div>
  );
}