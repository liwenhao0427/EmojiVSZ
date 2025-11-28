
import { GamePhase, InspectableEntity } from '../../types';
import { useGameStore } from '../../store/useGameStore';
import { GameState } from './GameState';
import { RenderingSystem } from './systems/RenderingSystem';
import { InputSystem } from './systems/InputSystem';
import { EnemySystem } from './systems/EnemySystem';
import { UnitSystem } from './systems/UnitSystem';
import { ProjectileSystem } from './systems/ProjectileSystem';
import { FloatingTextSystem } from './systems/FloatingTextSystem';
import { InspectionSystem } from './systems/InspectionSystem';

export interface EngineCallbacks {
  onGainLoot?: (xp: number, gold: number) => void;
  onWaveEnd?: () => void;
  onTimeUpdate?: (timeLeft: number) => void;
  onGameOver?: () => void;
  onInspect?: (entity: InspectableEntity) => void;
  onUnitDamaged?: (unitId: string) => void;
  onAddFloatingText?: (gameState: GameState, text: string, color: string, x: number, y: number) => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number = 0;
  private lastTime: number = 0;
  public isRunning: boolean = false;

  // State & Systems
  private gameState: GameState;
  private callbacks: EngineCallbacks;
  
  // Systems
  private renderingSystem: RenderingSystem;
  private inputSystem: InputSystem;
  private enemySystem: EnemySystem;
  private unitSystem: UnitSystem;
  private projectileSystem: ProjectileSystem;
  private floatingTextSystem: FloatingTextSystem;
  private inspectionSystem: InspectionSystem;

  private lastTimerUpdate: number = 0;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.gameState = new GameState();
    
    // --- Initialize systems in correct dependency order ---

    // 1. Systems with no or simple dependencies
    this.floatingTextSystem = new FloatingTextSystem();
    this.projectileSystem = new ProjectileSystem(this.floatingTextSystem);
    this.enemySystem = new EnemySystem();
    this.unitSystem = new UnitSystem();

    // 2. Resolve circular dependency between Input and Inspection systems
    this.inputSystem = new InputSystem(this.canvas);
    this.inspectionSystem = new InspectionSystem(this.inputSystem);
    this.inputSystem.setInspectionSystem(this.inspectionSystem);

    // 3. Systems that depend on the above
    this.renderingSystem = new RenderingSystem(this.ctx, this.inputSystem);

    // 4. Define callbacks object now that all required systems are initialized
    this.callbacks = {
        ...callbacks,
        onUnitDamaged: (unitId: string) => this.renderingSystem.setUnitHitFlash(unitId),
        onAddFloatingText: (gs, text, color, x, y) => this.floatingTextSystem.addText(gs, x, y, text, color),
    };
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
  }

  public startWave(duration: number, wave: number) {
    this.lastTime = performance.now(); // FIX: Reset timer to prevent massive DT on wave start
    this.gameState.reset();
    this.gameState.waveTime = duration > 0 ? duration : 30;
    this.gameState.waveDuration = this.gameState.waveTime;
    this.unitSystem.reset();
    
    // Prepare enemy spawn queue and pacing for the new wave
    this.enemySystem.prepareWave(wave);

    this.callbacks.onTimeUpdate?.(this.gameState.waveTime);

    if (!this.isRunning) {
      this.start();
    }
  }

  public cleanup() {
    this.stop();
    this.inputSystem.cleanup();
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;
    
    const dtRaw = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const dt = Math.min(dtRaw, 0.1);

    this.update(dt, timestamp);
    this.draw();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number, timestamp: number) {
    const store = useGameStore.getState();
    
    // Visual updates can happen even when paused (for dragging)
    this.renderingSystem.update(dt);
    this.inspectionSystem.update(dt, this.gameState, this.callbacks);

    if (store.phase !== GamePhase.COMBAT) return;

    // Game Logic updates
    this.gameState.waveTime -= dt;

    if (this.gameState.waveTime <= 0) {
      this.gameState.waveTime = 0;
      useGameStore.getState().resetWaveState();
      this.callbacks.onWaveEnd?.();
      return; 
    }
    
    // Run systems in order
    this.enemySystem.update(dt, this.gameState, this.callbacks);
    this.unitSystem.update(dt, this.gameState, this.callbacks);
    this.projectileSystem.update(dt, this.gameState, this.callbacks);
    this.floatingTextSystem.update(dt, this.gameState, this.callbacks);

    if (timestamp - this.lastTimerUpdate > 1000) {
      this.callbacks.onTimeUpdate?.(Math.ceil(Math.max(0, this.gameState.waveTime)));
      this.lastTimerUpdate = timestamp;
    }
  }

  private draw() {
    const inspectedEntity = useGameStore.getState().inspectedEntity;
    this.renderingSystem.draw(this.gameState, inspectedEntity);
  }
}