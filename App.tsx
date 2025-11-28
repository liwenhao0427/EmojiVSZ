
import React, { useEffect, useRef, useState } from 'react';
import { GameEngine } from './services/engine';
import { LevelUpModal } from './components/LevelUpModal';
import { GameOverScreen } from './components/GameOverScreen';
import { StartScreen } from './components/StartScreen';
import { Shop } from './components/Shop';
import { useGameStore } from './store/useGameStore';
import { GamePhase, DraftOption, InspectableEntity, BrotatoItem } from './types';
import { CANVAS_WIDTH, CANVAS_HEIGHT, INITIAL_STATS } from './constants';
import { WAVE_DATA } from './data/waves';
import { HUD } from './components/HUD';
import { InspectorPanel } from './components/InspectorPanel';
import { InventoryPanel } from './components/InventoryPanel';
import { audioManager, SOUND_MAP } from './services/audioManager';
import { PreparingWaveScreen } from './components/PreparingWaveScreen';

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
    // 预加载所有音效
    audioManager.load(SOUND_MAP);
  }, []);

  // Engine Initialization
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
                  // Harder scaling for levels: +50% requirement per level
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
    
    return () => {
        engineRef.current?.cleanup();
    };
  }, []);

  // Logic 1: Handle Phase Transitions (Prepare -> Combat)
  useEffect(() => {
    if (phase === GamePhase.PREPARING_WAVE) {
        // Stop engine visual updates during static screens if needed, 
        // but keeping it stopped ensures we don't have game logic running.
        // We rely on the PreparingScreen overlay.
        const timer = setTimeout(() => {
            setPhase(GamePhase.COMBAT);
        }, 1200); // Increased slightly for better UX
        return () => clearTimeout(timer);
    }
  }, [phase, setPhase]);

  // Logic 2: Engine Start/Stop Control
  useEffect(() => {
    if (phase === GamePhase.COMBAT) {
        audioManager.play('music', { loop: true, volume: 0.2 });
        if (!showLevelUp) {
          engineRef.current?.start();
        }
    } else {
        audioManager.stopMusic();
        engineRef.current?.stop();
    }
  }, [phase, showLevelUp]);
  
  // Logic 3: Wave Synchronization (The Critical Fix)
  useEffect(() => {
    // Only trigger wave start if we are in combat, not leveling up, and the wave number has changed
    // since the last time we started the engine.
    if (phase === GamePhase.COMBAT && !showLevelUp && waveStartedRef.current !== stats.wave) {
        waveStartedRef.current = stats.wave;
        const config = WAVE_DATA.find(w => w.wave === stats.wave) || WAVE_DATA[WAVE_DATA.length-1];
        engineRef.current?.startWave(config.duration, stats.wave);
    }
  }, [phase, showLevelUp, stats.wave]);

  const handleStartGame = () => {
    // 关键修复：彻底重置引擎状态，防止上一局的敌人残留导致判定死亡
    engineRef.current?.reset();
    
    waveStartedRef.current = 0; // Reset ref so Logic 3 triggers for Wave 1
    
    initGame(); // Reset Zustand Store
    setShowLevelUp(false);
    setInspectedEntity(null);
  };

  const handleRestart = () => {
    handleStartGame();
  };

  const handleDraftSelect = (option: DraftOption) => {
      applyDraft(option);
      setShowLevelUp(false);
      // Engine will auto-resume due to Logic 2
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

        {/* Start Screen */}
        {phase === GamePhase.START && (
            <StartScreen onStart={handleStartGame} />
        )}
        
        {phase === GamePhase.PREPARING_WAVE && <PreparingWaveScreen />}

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
