import React, { useRef, useEffect, useLayoutEffect } from 'react';
// FIX: The import path for GameEngine was incorrect. It should point to the 'engine' directory which exports the GameEngine class.
import { GameEngine } from '../services/engine';
import { PlayerStats, AmmoBayState, GamePhase } from '../types';
import { INITIAL_STATS } from '../constants';

interface GameCanvasProps {
  stats: PlayerStats;
  ammoState: AmmoBayState;
  phase: GamePhase;
  currentWave: number;
  waveDuration: number;
  onDamagePlayer: (amount: number) => void;
  onGainLoot: (xp: number, gold: number) => void;
  onWaveEnd: () => void;
  onLootGoblinKill: () => void;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  stats,
  ammoState,
  phase,
  currentWave,
  waveDuration,
  onDamagePlayer,
  onGainLoot,
  onWaveEnd,
  onLootGoblinKill
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<GameEngine | null>(null);

  // --- Initialization & Lifecycle ---
  useEffect(() => {
    if (!canvasRef.current) return;

    // Instantiate Engine
    engineRef.current = new GameEngine(
      canvasRef.current,
      // FIX: The GameEngine constructor signature has changed. It now takes callbacks as the second argument.
      // The engine now pulls state from the global store instead of having it passed in.
      // Invalid callbacks for the new engine are not passed.
      {
        onGainLoot,
        onWaveEnd,
      }
    );

    // Initial Start logic if needed, though usually triggered by wave change
    // If we mount in Combat phase (e.g. restart), start immediately
    if (phase === GamePhase.COMBAT) {
        engineRef.current.startWave(waveDuration, currentWave);
    }
    
    // FIX: The new InputSystem handles its own event listeners.

    return () => {
      engineRef.current?.cleanup();
    };
  }, []); // Run once on mount

  // FIX: These effects are deprecated as the engine now reads state directly from the global store.

  // --- Resize Handling ---
  useLayoutEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const updateSize = () => {
        if (!containerRef.current || !canvasRef.current) return;
        const { clientWidth, clientHeight } = containerRef.current;
        canvasRef.current.width = clientWidth;
        canvasRef.current.height = clientHeight;
        // FIX: The new GameEngine does not have a `resize` method and is designed for a fixed-size canvas.
    };
    const observer = new ResizeObserver(updateSize);
    observer.observe(containerRef.current);
    updateSize(); 
    return () => observer.disconnect();
  }, []);

  // --- Phase & Wave Control ---
  useEffect(() => {
    if (phase === GamePhase.COMBAT) {
        // Only start wave if engine is idle or we are syncing wave start
        // We rely on the parent to pass the correct duration when wave changes
        if (!engineRef.current?.isRunning) {
            engineRef.current?.startWave(waveDuration, currentWave);
        }
    } else {
        engineRef.current?.stop();
    }
  }, [phase, currentWave, waveDuration]);

  return (
    <div className="w-full h-full relative" ref={containerRef}>
      <canvas 
        ref={canvasRef}
        className={`w-full h-full block cursor-none ${phase !== GamePhase.COMBAT ? 'filter blur-md brightness-50' : ''}`} 
      />
    </div>
  );
};
