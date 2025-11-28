
import { GameState } from '../GameState';
import { System } from '../System';
import { EngineCallbacks } from '../index';
import { GRID_ROWS, GRID_OFFSET_Y, CANVAS_WIDTH, CELL_SIZE, GRID_OFFSET_X } from '../../../constants';
import { useGameStore } from '../../../store/useGameStore';
import { GamePhase } from '../../../types';
import { ENEMY_DATA } from '../../../data/enemies';
import { WAVE_DATA } from '../../../data/waves';

export class EnemySystem implements System {
  // New state for wave management
  private waveElapsedTime: number = 0;
  private trickleQueue: string[] = [];
  private burstSchedule: { time: number; enemies: string[] }[] = [];
  private nextBurstIndex: number = 0;
  private trickleSpawnTimer: number = 0;
  private trickleInterval: number = 0;

  update(dt: number, gameState: GameState, callbacks: EngineCallbacks) {
    this.spawnEnemies(dt, gameState);
    this.updateEnemies(dt, gameState, callbacks);
  }

  public prepareWave(waveNumber: number) {
    // Reset state for the new wave
    this.burstSchedule = [];
    this.trickleQueue = [];
    this.waveElapsedTime = 0;
    this.nextBurstIndex = 0;
    this.trickleSpawnTimer = 0;
    this.trickleInterval = 0;

    const config = WAVE_DATA.find(w => w.wave === waveNumber) || WAVE_DATA[WAVE_DATA.length - 1];
    if (!config) return;

    const store = useGameStore.getState();
    const enemyCountModifier = 1 + ((store.stats.enemy_count || 0) / 100);
    
    // 1. Generate the total list of enemies for the wave
    let totalSpawnQueue: string[] = [];
    for (const id in config.composition) {
        const count = Math.round(config.totalCount * config.composition[id] * enemyCountModifier);
        for (let i = 0; i < count; i++) {
            totalSpawnQueue.push(id);
        }
    }
    
    // 2. Shuffle queue for randomness in enemy types
    for (let i = totalSpawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [totalSpawnQueue[i], totalSpawnQueue[j]] = [totalSpawnQueue[j], totalSpawnQueue[i]];
    }
    
    const totalToSpawn = totalSpawnQueue.length;
    
    // 3. Dynamically schedule bursts based on wave duration
    const BURST_INTERVAL = 10;
    const TOTAL_BURST_PERCENTAGE = 0.90;
    const SLOPE_MODIFIER = 0.05; // Controls the steepness of the ramp (e.g., 0.05 means +/- 5% from the average)

    const numBursts = Math.floor(config.duration / BURST_INTERVAL);

    if (numBursts > 0) {
        const basePercentPerBurst = TOTAL_BURST_PERCENTAGE / numBursts;
        
        for (let i = 0; i < numBursts; i++) {
            // Create a ramp from -1 to 1 to make spawn rates increase over time
            const ramp = (numBursts > 1) ? (i / (numBursts - 1)) * 2 - 1 : 0;
            const percentForThisBurst = basePercentPerBurst + (ramp * SLOPE_MODIFIER);
            const countForThisBurst = Math.floor(totalToSpawn * percentForThisBurst);

            this.burstSchedule.push({
                time: i * BURST_INTERVAL,
                enemies: totalSpawnQueue.splice(0, countForThisBurst)
            });
        }
    } else {
        // Fallback for very short waves: put 90% in an immediate burst
        const burstCount = Math.floor(totalToSpawn * TOTAL_BURST_PERCENTAGE);
        this.burstSchedule.push({
            time: 0,
            enemies: totalSpawnQueue.splice(0, burstCount)
        });
    }

    // 4. Anything left in the queue is for trickling
    this.trickleQueue = totalSpawnQueue;
    if (this.trickleQueue.length > 0) {
        this.trickleInterval = config.duration / this.trickleQueue.length;
        this.trickleSpawnTimer = Math.random() * this.trickleInterval;
    }
  }

  private spawnEnemies(dt: number, gameState: GameState) {
    this.waveElapsedTime += dt;

    // Check for and execute scheduled bursts
    if (this.nextBurstIndex < this.burstSchedule.length && this.waveElapsedTime >= this.burstSchedule[this.nextBurstIndex].time) {
        const burst = this.burstSchedule[this.nextBurstIndex];
        burst.enemies.forEach(enemyId => this.spawnSingleEnemy(enemyId, gameState));
        this.nextBurstIndex++;
    }

    // Handle the continuous trickle of remaining enemies
    if (this.trickleQueue.length > 0) {
        this.trickleSpawnTimer -= dt;
        if (this.trickleSpawnTimer <= 0) {
            const enemyId = this.trickleQueue.shift(); // Use shift for FIFO trickle
            if (enemyId) this.spawnSingleEnemy(enemyId, gameState);
            this.trickleSpawnTimer += this.trickleInterval;
        }
    }
  }
  
  private spawnSingleEnemy(enemyId: string, gameState: GameState) {
    if (!enemyId) return;
    const typeData = ENEMY_DATA[enemyId];
    if (!typeData) return;
    
    const wave = useGameStore.getState().stats.wave;
    
    gameState.enemies.push({
      id: Math.random(),
      x: CANVAS_WIDTH + 50,
      y: GRID_OFFSET_Y + (Math.floor(Math.random() * GRID_ROWS) * CELL_SIZE) + (CELL_SIZE / 2),
      radius: 24 * typeData.scale,
      markedForDeletion: false,
      hp: typeData.baseHp + typeData.hpPerWave * (wave - 1),
      maxHp: typeData.baseHp + typeData.hpPerWave * (wave - 1),
      speed: typeData.speed,
      emoji: typeData.emoji,
      description: typeData.name,
      type: typeData.type as any,
      damage: typeData.damage,
      row: Math.floor(Math.random() * GRID_ROWS),
      attackTimer: 0,
      isAttacking: false,
      frozen: 0,
      hitFlash: 0,
      name: typeData.id,
      attackState: 'IDLE',
      attackProgress: 0,
      slowTimer: 0,
      slowMultiplier: 1,
    });
  }


  private updateEnemies(dt: number, gameState: GameState, callbacks: EngineCallbacks) {
    const store = useGameStore.getState();
    
    gameState.enemies.forEach(e => {
      if (e.hitFlash && e.hitFlash > 0) e.hitFlash -= dt;

      if (e.frozen > 0) {
        e.frozen -= dt;
        return;
      }

      let currentSpeed = e.speed;
      if (e.slowTimer && e.slowTimer > 0) {
          e.slowTimer -= dt;
          currentSpeed *= (e.slowMultiplier || 1);
      }
      
      if (e.attackState === 'ATTACKING') {
        e.attackProgress! += dt * 3.0;
        if (e.attackProgress! >= 1) {
          e.attackState = 'IDLE';
          e.attackProgress = 0;
        }
      }

      e.x -= currentSpeed * dt;

      if (e.x < GRID_OFFSET_X) {
        callbacks.onGameOver?.();
        store.setPhase(GamePhase.GAME_OVER);
        return; 
      }

      const unitInCell = store.gridUnits.find(u => 
        !u.isDead && u.row === e.row && 
        Math.abs(e.x - (GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE / 2)) < (CELL_SIZE / 2 + e.radius)
      );

      if (unitInCell) {
        e.attackTimer -= dt;
        if (e.attackTimer <= 0) {
          store.damageUnit(unitInCell.id, e.damage);
          callbacks.onUnitDamaged?.(unitInCell.id);
          e.attackTimer = 1.0;
          e.attackState = 'ATTACKING';
          e.attackProgress = 0;
        }
        e.x += currentSpeed * dt;
      }
    });
    
    gameState.enemies = gameState.enemies.filter(e => !e.markedForDeletion);
  }
}