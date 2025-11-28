
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

export default function App() {
  const { phase, setPhase, initGame, stats, startNextWave, applyDraft, setInspectedEntity, buyBrotatoItem, endWaveAndGoToShop } = useGameStore();
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
    Log.i('App', 'Component mounted, audio loaded, log UI initialized.');
  }, []);

  useEffect(() => {
    if (canvasRef.current && !engineRef.current) {
      Log.i('EngineInit', 'Canvas is ready, creating GameEngine instance.');
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
                  Log.i('AppCallback', `Level Up! New level: ${newLevel}`);
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
                  Log.i('AppCallback', 'Level up detected. Pausing engine and showing level up modal.');
              }
          },
          onWaveEnd: () => {
              Log.i('EngineCallback', 'onWaveEnd triggered. Calling endWaveAndGoToShop.');
              endWaveAndGoToShop();
          },
          onGameOver: () => {
              Log.i('EngineCallback', 'onGameOver triggered. Setting phase to GAME_OVER.');
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
        Log.i('EngineInit', 'App unmounting, cleaning up engine.');
        engineRef.current?.cleanup();
    };
  }, []);

  useEffect(() => {
    Log.i('PhaseLogic', `Phase changed to: ${phase}`);
    if (phase === GamePhase.SHOP) {
        setShopVisible(true);
        const nextWaveNumber = stats.wave + 1;
        const config = WAVE_DATA.find(w => w.wave === nextWaveNumber) || WAVE_DATA[WAVE_DATA.length - 1];
        setTimeLeft(config.duration);
        Log.i('PhaseLogic', `Entered SHOP. Pre-set timer for next wave (${nextWaveNumber}) to ${config.duration}s.`);
    }
  }, [phase]);

  useEffect(() => {
    if (phase === GamePhase.COMBAT && !showLevelUp) {
        audioManager.play('music', { loop: true, volume: 0.2 });
        // If wave has already started, we are resuming from pause.
        if (waveStartedRef.current === stats.wave) {
             Log.i('EngineControl', `Resuming combat phase. Starting engine.`);
             engineRef.current?.start();
        } else {
             Log.i('EngineControl', `New wave detected. Deferring engine start to WaveSync.`);
        }
    } else if (phase === GamePhase.SHOP && !showLevelUp) {
        Log.i('EngineControl', `Phase is SHOP. Ensuring engine is RUNNING for UI.`);
        engineRef.current?.start();
        audioManager.stopMusic();
    } else {
        Log.i('EngineControl', `Phase is ${phase} or level up is shown. Ensuring engine is STOPPED.`);
        audioManager.stopMusic();
        engineRef.current?.stop();
    }
  }, [phase, showLevelUp, stats.wave]);
  
  useEffect(() => {
    Log.i('WaveSync', `Checking if wave should start. Phase: ${phase}, ShowLevelUp: ${showLevelUp}, WaveRef: ${waveStartedRef.current}, StoreWave: ${stats.wave}`);
    if (phase === GamePhase.COMBAT && !showLevelUp && waveStartedRef.current !== stats.wave) {
        Log.i('WaveSync', `CONDITION MET. Starting wave ${stats.wave}. Updating ref to ${stats.wave}.`);
        waveStartedRef.current = stats.wave;
        const config = WAVE_DATA.find(w => w.wave === stats.wave) || WAVE_DATA[WAVE_DATA.length-1];
        engineRef.current?.startWave(config.duration, stats.wave);
    }
  }, [phase, showLevelUp, stats.wave]);

  const handleStartGame = () => {
    Log.i('App', '--- NEW GAME STARTED ---');
    engineRef.current?.reset();
    waveStartedRef.current = 0;
    
    initGame();
    
    const wave1Config = WAVE_DATA.find(w => w.wave === 1) || WAVE_DATA[0];
    setTimeLeft(wave1Config.duration);
    Log.i('App', `handleStartGame: Set timer for wave 1 to ${wave1Config.duration}s.`);

    setShowLevelUp(false);
    setInspectedEntity(null);
  };

  const handleRestart = () => {
    Log.i('App', 'Restart button clicked.');
    handleStartGame();
  };

  const handleDraftSelect = (option: DraftOption) => {
      Log.i('App', `Draft selected: ${option.name}. Resuming combat.`);
      applyDraft(option);
      setShowLevelUp(false);
  };

  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-950 text-white font-sans relative overflow-hidden">
      
      <div 
        className="relative shadow-2xl border border-slate-800 bg-slate-900 rounded-lg overflow-hidden"
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
        
        {phase === GamePhase.SHOP && (
            <Shop 
              onBuyItem={buyBrotatoItem} 
              onNextWave={startNextWave}
              isVisible={isShopVisible}
              onVisibilityChange={setShopVisible}
            />
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
