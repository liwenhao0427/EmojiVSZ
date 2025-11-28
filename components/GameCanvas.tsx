import React, { useRef, useEffect, useLayoutEffect } from 'react';
import { GameEngine } from '../services/GameEngine';
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
      stats, // Initial stats
      {
        onDamagePlayer,
        onGainLoot,
        onWaveEnd,
        onLootGoblinKill
      }
    );

    // Initial Start logic if needed, though usually triggered by wave change
    // If we mount in Combat phase (e.g. restart), start immediately
    if (phase === GamePhase.COMBAT) {
        engineRef.current.startWave(waveDuration, currentWave);
        engineRef.current.updateAmmo(ammoState);
    }

    // Input Handling
    const handleMouseMove = (e: MouseEvent) => engineRef.current?.updateMouse(e.clientX, e.clientY);
    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      engineRef.current?.cleanup();
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []); // Run once on mount (key change in parent triggers remount)

  // --- Sync Data ---
  useEffect(() => {
    engineRef.current?.updateStats(stats);
  }, [stats]);

  useEffect(() => {
    engineRef.current?.updateAmmo(ammoState);
  }, [ammoState]);

  // --- Resize Handling ---
  useLayoutEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;
    const updateSize = () => {
        if (!containerRef.current || !canvasRef.current) return;
        const { clientWidth, clientHeight } = containerRef.current;
        canvasRef.current.width = clientWidth;
        canvasRef.current.height = clientHeight;
        engineRef.current?.resize(clientWidth, clientHeight);
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