

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
import { audioManager, SOUND_MAP } from './services/audioManager';
import { Log } from './services/Log';
import { ShoppingBag, Swords } from 'lucide-react';

export default function App() {
  const { phase, setPhase, initGame, stats, startNextWave, applyDraft, setInspectedEntity, buyBrotatoItem, endWaveAndGoToShop, showPermanentLevelUp } = useGameStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const waveStartedRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [isShopVisible, setShopVisible] = useState(true);

  const inspectedEntity = useGameStore(state => state.inspectedEntity);

  useEffect(() => {
    audioManager.load(SOUND_MAP);
    Log.displayLogsUI();
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
    Log.log('App', 'Component mounted, audio loaded, log UI initialized.');
  }, []);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
      Log.log('EngineInit', 'Canvas is ready, creating GameEngine instance.');
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
                  newMaxXp = Math.floor(newMaxXp * 1.5); 
                  didLevelUp = true;
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
                  Log.log('AppCallback', `Level Up! New level: ${newLevel}`);
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
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
                  Log.log('AppCallback', 'Level up detected. Pausing engine and showing level up modal.');
              }
          },
          onWaveEnd: () => {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
              Log.log('EngineCallback', 'onWaveEnd triggered. Calling endWaveAndGoToShop.');
              endWaveAndGoToShop();
          },
          onGameOver: () => {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
              Log.log('EngineCallback', 'onGameOver triggered. Setting phase to GAME_OVER.');
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
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
        Log.log('EngineInit', 'App unmounting, cleaning up engine.');
        engineRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
    Log.log('PhaseLogic', `Phase changed to: ${phase}`);
    if (phase === GamePhase.SHOP) {
        setShopVisible(true);
        const nextWaveNumber = stats.wave + 1;
        const config = WAVE_DATA.find(w => w.wave === nextWaveNumber) || WAVE_DATA[WAVE_DATA.length - 1];
        setTimeLeft(config.duration);
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
        Log.log('PhaseLogic', `Entered SHOP. Pre-set timer for next wave (${nextWaveNumber}) to ${config.duration}s.`);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === GamePhase.COMBAT && !showLevelUp) {
        audioManager.play('music', { loop: true, volume: 0.2 });
        // If wave has already started, we are resuming from pause.
        if (waveStartedRef.current === stats.wave) {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
             Log.log('EngineControl', `Resuming combat phase. Starting engine.`);
             engineRef.current?.start();
        } else {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
             Log.log('EngineControl', `New wave detected. Deferring engine start to WaveSync.`);
        }
    } else if (phase === GamePhase.SHOP && !showLevelUp && !showPermanentLevelUp) {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
        Log.log('EngineControl', `Phase is SHOP. Ensuring engine is RUNNING for UI.`);
        engineRef.current?.start();
        audioManager.stopMusic();
    } else {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
        Log.log('EngineControl', `Phase is ${phase} or level up is shown. Ensuring engine is STOPPED.`);
        audioManager.stopMusic();
        engineRef.current?.stop();
    }
  }, [phase, showLevelUp, showPermanentLevelUp, stats.wave]);
  
  useEffect(() => {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
    Log.log('WaveSync', `Checking if wave should start. Phase: ${phase}, ShowLevelUp: ${showLevelUp}, WaveRef: ${waveStartedRef.current}, StoreWave: ${stats.wave}`);
    if (phase === GamePhase.COMBAT && !showLevelUp && waveStartedRef.current !== stats.wave) {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
        Log.log('WaveSync', `CONDITION MET. Starting wave ${stats.wave}. Updating ref to ${stats.wave}.`);
        waveStartedRef.current = stats.wave;
        const config = WAVE_DATA.find(w => w.wave === stats.wave) || WAVE_DATA[WAVE_DATA.length-1];
        engineRef.current?.startWave(config.duration, stats.wave);
    }
  }, [phase, showLevelUp, stats.wave]);

  const handleStartGame = () => {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
    Log.log('App', '--- NEW GAME STARTED ---');
    engineRef.current?.reset();
    waveStartedRef.current = 0;
    
    initGame();
    
    const wave1Config = WAVE_DATA.find(w => w.wave === 1) || WAVE_DATA[0];
    setTimeLeft(wave1Config.duration);
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
    Log.log('App', `handleStartGame: Set timer for wave 1 to ${wave1Config.duration}s.`);

    setShowLevelUp(false);
    setInspectedEntity(null);
  };

  const handleRestart = () => {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
    Log.log('App', 'Restart button clicked.');
    handleStartGame();
  };

  const handleDraftSelect = (option: DraftOption) => {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
      Log.log('App', `Draft selected: ${option.name}. Resuming combat.`);
      applyDraft(option, false);
      setShowLevelUp(false);
  };

  const handlePermanentDraftSelect = (option: DraftOption) => {
// FIX: Changed Log.i to Log.log as 'i' method does not exist.
      Log.log('App', `Permanent Draft selected: ${option.name}.`);
      applyDraft(option, true);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-sky-200 text-slate-800 font-sans relative overflow-hidden">
      
      <div 
        className="relative shadow-2xl border-4 border-white bg-sky-300 rounded-3xl overflow-hidden"
        style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT }}
      >
        <canvas 
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="w-full h-full block"
        />

        {/* Full-screen overlays */}
        {phase === GamePhase.START && <StartScreen onStart={handleStartGame} />}
        {phase === GamePhase.GAME_OVER && <GameOverScreen currentWave={stats.wave} onRestart={handleRestart} />}
        {showLevelUp && <LevelUpModal onSelect={handleDraftSelect} level={stats.level} />}
        
        {/* Permanent Level Up Modal (From Shop) */}
        {showPermanentLevelUp && <LevelUpModal onSelect={handlePermanentDraftSelect} level={stats.heroLevel} isPermanent={true} />}
        
        {phase === GamePhase.SHOP && (
            <Shop 
              isVisible={isShopVisible}
              onVisibilityChange={setShopVisible}
            />
        )}
        
        {phase === GamePhase.SHOP && !isShopVisible && (
            <div className="absolute bottom-8 right-8 z-[60] pointer-events-auto flex items-center gap-4">
                <button 
                    onClick={() => setShopVisible(true)}
                    className="flex items-center gap-3 px-6 py-4 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black rounded-full shadow-lg hover:scale-105 transition-all animate-bounce"
                >
                    <ShoppingBag size={24} />
                    打开商店
                </button>
                <button 
                    onClick={startNextWave}
                    className="flex items-center gap-3 px-8 py-4 bg-red-500 hover:bg-red-400 text-white font-black rounded-full shadow-lg hover:scale-105 transition-all"
                >
                    <Swords size={24} />
                    开始战斗
                </button>
            </div>
        )}

        {/* HUD and side panels, visible during combat and shop phases */}
        {(phase === GamePhase.COMBAT || phase === GamePhase.SHOP) && (
          <>
            <HUD stats={stats} waveTime={timeLeft} currentWave={stats.wave} />
            <InspectorPanel entity={inspectedEntity} />
          </>
        )}
      </div>
    </div>
  );
}