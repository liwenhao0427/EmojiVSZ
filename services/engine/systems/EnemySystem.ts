

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
    
    // 3. Define new spawn rhythm percentages
    const MAJOR_BURST_PERCENT = 0.70;
    const MINOR_BURST_PERCENT = 0.20;

    const majorBurstTotalEnemies = Math.floor(totalToSpawn * MAJOR_BURST_PERCENT);
    const minorBurstTotalEnemies = Math.floor(totalToSpawn * MINOR_BURST_PERCENT);
    
    // 4. Schedule major bursts (at 10s intervals)
    const numMajorBursts = Math.floor(config.duration / 10);
    if (numMajorBursts > 0) {
        const enemiesPerMajorBurst = Math.floor(majorBurstTotalEnemies / numMajorBursts);
        for (let i = 1; i <= numMajorBursts; i++) {
            this.burstSchedule.push({
                time: i * 10,
                enemies: totalSpawnQueue.splice(0, enemiesPerMajorBurst)
            });
        }
    }

    // 5. Schedule minor bursts (at 5s intervals, skipping 10s intervals)
    const numMinorBursts = Math.floor(config.duration / 5) - numMajorBursts;
    if (numMinorBursts > 0) {
        const enemiesPerMinorBurst = Math.floor(minorBurstTotalEnemies / numMinorBursts);
        for (let i = 1; i <= Math.floor(config.duration / 5); i++) {
            if ((i * 5) % 10 !== 0) { // Only on 5, 15, 25...
                this.burstSchedule.push({
                    time: i * 5,
                    enemies: totalSpawnQueue.splice(0, enemiesPerMinorBurst)
                });
            }
        }
    }
    
    // Sort the schedule by time to ensure correct execution order
    this.burstSchedule.sort((a, b) => a.time - b.time);

    // 6. Anything left in the queue is for trickling
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
        
        // Distribute enemies evenly across rows to avoid stacking
        let spawnRowCounter = Math.floor(Math.random() * GRID_ROWS);
        for(const enemyId of burst.enemies) {
            this.spawnSingleEnemy(enemyId, gameState, spawnRowCounter);
            spawnRowCounter = (spawnRowCounter + 1) % GRID_ROWS;
        }

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
  
  private spawnSingleEnemy(enemyId: string, gameState: GameState, forcedRow?: number) {
    if (!enemyId) return;
    const typeData = ENEMY_DATA[enemyId];
    if (!typeData) return;

    const wave = useGameStore.getState().stats.wave;

    // First, determine a consistent row for both positioning and logic
    const spawnRow = (forcedRow !== undefined) ? forcedRow : Math.floor(Math.random() * GRID_ROWS);
    const spawnY = GRID_OFFSET_Y + (spawnRow * CELL_SIZE) + (CELL_SIZE / 2);

    // Find the rightmost enemy in the same row to prevent perfect stacking.
    const rightmostEnemyInRowX = gameState.enemies
      .filter(e => e.row === spawnRow)
      .reduce((max_x, e) => Math.max(e.x, max_x), 0);

    const baseSpawnX = CANVAS_WIDTH + 50;
    const spawnOffset = 15; // Small pixel offset to stagger spawns.

    // Spawn behind the rightmost enemy in the lane, or at the default position if the lane is clear.
    const spawnX = Math.max(baseSpawnX, rightmostEnemyInRowX + spawnOffset);

    gameState.enemies.push({
      id: Math.random(),
      x: spawnX,
      y: spawnY,
      radius: 24 * typeData.scale,
      markedForDeletion: false,
      hp: typeData.baseHp + typeData.hpPerWave * (wave - 1),
      maxHp: typeData.baseHp + typeData.hpPerWave * (wave - 1),
      speed: typeData.speed,
      emoji: typeData.emoji,
      description: typeData.name,
      type: typeData.type as any,
      damage: typeData.damage,
      row: spawnRow, // Use the single, consistent calculated row
      attackTimer: 0,
      isAttacking: false,
      frozen: 0,
      hitFlash: 0,
      name: typeData.id,
      attackState: 'IDLE',
      attackProgress: 0,
      slowTimer: 0,
      slowMultiplier: 1,
      deathTimer: 0,
    });
  }


  private updateEnemies(dt: number, gameState: GameState, callbacks: EngineCallbacks) {
    const store = useGameStore.getState();
    
    gameState.enemies.forEach(e => {
      if (e.hitFlash && e.hitFlash > 0) e.hitFlash -= dt;

      // Handle death animation timer
      if (e.deathTimer && e.deathTimer > 0) {
        e.deathTimer -= dt;
        if (e.deathTimer <= 0) {
          e.markedForDeletion = true;
        }
        return; // Don't process movement/attacks for dying enemies
      }

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