
import { GameState } from '../GameState';
import { System } from '../System';
import { EngineCallbacks } from '../index';
// FIX: `GRID_OFFSET_X` was not imported, causing a reference error.
import { GRID_ROWS, GRID_OFFSET_Y, CANVAS_WIDTH, CELL_SIZE, GRID_OFFSET_X } from '../../../constants';
import { useGameStore } from '../../../store/useGameStore';
import { GamePhase } from '../../../types';
import { ENEMY_DATA } from '../../../data/enemies';
import { WAVE_DATA } from '../../../data/waves';

export class EnemySystem implements System {
  // State for wave management
  private spawnQueue: string[] = [];
  private bucketSpawnCounts: number[] = [];
  private currentBucketIndex: number = 0;
  private timeInBucket: number = 0;
  private readonly bucketDuration: number = 10;
  private bucketSpawnTimer: number = 0;
  
  update(dt: number, gameState: GameState, callbacks: EngineCallbacks) {
    this.spawnEnemies(dt, gameState);
    this.updateEnemies(dt, gameState, callbacks);
  }

  public prepareWave(waveNumber: number) {
    this.spawnQueue = [];
    this.bucketSpawnCounts = [];
    this.currentBucketIndex = 0;
    this.timeInBucket = 0;
    this.bucketSpawnTimer = 0;

    const config = WAVE_DATA.find(w => w.wave === waveNumber) || WAVE_DATA[WAVE_DATA.length - 1];
    if (!config) return;

    const store = useGameStore.getState();
    const enemyCountModifier = 1 + ((store.stats.enemy_count || 0) / 100);
    
    let tempQueue: string[] = [];
    let specialUnits: string[] = [];
    let totalNormalWeight = 0;
    
    // Separate normal/special enemies and calculate total weight of normal units
    for (const id in config.composition) {
        const enemyType = ENEMY_DATA[id];
        if (enemyType.type === 'ELITE' || enemyType.type === 'BOSS' || enemyType.type === 'SPECIAL') {
            for (let i = 0; i < config.composition[id]; i++) {
                specialUnits.push(id);
            }
        } else {
            totalNormalWeight += config.composition[id];
        }
    }

    const finalNormalCount = Math.round(config.totalCount * enemyCountModifier);

    if (totalNormalWeight > 0) {
        for (const id in config.composition) {
            const enemyType = ENEMY_DATA[id];
            if (enemyType.type === 'NORMAL') {
                const weight = config.composition[id];
                const count = Math.round((weight / totalNormalWeight) * finalNormalCount);
                for (let i = 0; i < count; i++) {
                    tempQueue.push(id);
                }
            }
        }
    }
    
    tempQueue.push(...specialUnits);
    
    // Shuffle queue for randomness
    for (let i = tempQueue.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tempQueue[i], tempQueue[j]] = [tempQueue[j], tempQueue[i]];
    }

    this.spawnQueue = tempQueue;

    // Distribute into buckets
    const totalToSpawn = this.spawnQueue.length;
    const numBuckets = Math.floor(config.duration / this.bucketDuration);
    const percentages = [0.10, 0.15, 0.20, 0.25];
    let assignedCount = 0;
    
    for (let i = 0; i < numBuckets - 1; i++) {
        if (assignedCount >= totalToSpawn) break;
        const percentage = percentages[i] || percentages[percentages.length-1];
        const countForBucket = Math.floor(totalToSpawn * percentage);
        this.bucketSpawnCounts.push(countForBucket);
        assignedCount += countForBucket;
    }
    
    this.bucketSpawnCounts.push(totalToSpawn - assignedCount); // Last bucket gets the rest
  }

  private spawnEnemies(dt: number, gameState: GameState) {
    if (this.spawnQueue.length === 0 || this.currentBucketIndex >= this.bucketSpawnCounts.length) {
      return;
    }

    this.timeInBucket += dt;

    const currentBucketCount = this.bucketSpawnCounts[this.currentBucketIndex];
    if (currentBucketCount > 0) {
      this.bucketSpawnTimer -= dt;
      if (this.bucketSpawnTimer <= 0) {
        const spawnInterval = this.bucketDuration / currentBucketCount;
        this.bucketSpawnTimer = spawnInterval * (0.8 + Math.random() * 0.4);

        const enemyId = this.spawnQueue.pop();
        if (enemyId) {
          const typeData = ENEMY_DATA[enemyId];
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
      }
    }
    
    if (this.timeInBucket >= this.bucketDuration && this.currentBucketIndex < this.bucketSpawnCounts.length - 1) {
      this.timeInBucket = 0;
      this.currentBucketIndex++;
    }
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

      if (e.x < 0) {
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
        e.x += currentSpeed * dt; // Stand still by moving back
      }
    });
    
    gameState.enemies = gameState.enemies.filter(e => !e.markedForDeletion);
  }
}
