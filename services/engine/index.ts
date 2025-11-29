
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
import { Log } from '../Log';
import { GRID_COLS, GRID_ROWS } from '../../constants';

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
    this.inputSystem = new InputSystem(this.canvas, this);
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

  public reset() {
    Log.i('Engine', 'Resetting engine state completely.');
    this.stop();
    this.gameState.reset();
    this.unitSystem.reset();
    this.renderingSystem.draw(this.gameState, null);
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
    Log.i('Engine', `startWave called with duration=${duration}, wave=${wave}.`);
    this.lastTime = performance.now();
    this.gameState.reset();
    this.gameState.waveTime = duration > 0 ? duration : 30;
    this.gameState.waveDuration = this.gameState.waveTime;
    this.unitSystem.reset();
    
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
  
  public handleRightClick(x: number, y: number) {
      const store = useGameStore.getState();
      if (store.phase !== GamePhase.SHOP) return;

      const { c, r } = this.inputSystem.getGridPosFromCoords(x, y);
      if (c < 0 || c >= GRID_COLS || r < 0 || r >= GRID_ROWS) return;

      const unit = store.gridUnits.find(u => u.row === r && u.col === c);
      if (unit) {
        const result = store.sellUnit(unit.id);
        if (result) {
          this.floatingTextSystem.addText(this.gameState, result.x, result.y - 20, `+${result.refund}G`, 'yellow');
        }
      }
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
    
    this.renderingSystem.update(dt);
    this.inspectionSystem.update(dt, this.gameState, this.callbacks);
    
    // Always update floating text, even in shop
    this.floatingTextSystem.update(dt, this.gameState, this.callbacks);

    if (store.phase !== GamePhase.COMBAT) return;

    this.gameState.waveTime -= dt;

    if (this.gameState.waveTime <= 0) {
      this.gameState.waveTime = 0;
      this.gameState.enemies = [];
      this.gameState.projectiles = [];
      this.gameState.floatingTexts = [];
      this.callbacks.onWaveEnd?.();
      return; 
    }
    
    this.enemySystem.update(dt, this.gameState, this.callbacks);
    this.unitSystem.update(dt, this.gameState, this.callbacks, this.projectileSystem);
    this.projectileSystem.update(dt, this.gameState, this.callbacks);

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