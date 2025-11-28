
import { GameState } from '../GameState';
import { System } from '../System';
import { EngineCallbacks } from '../index';
import { CANVAS_WIDTH, CELL_SIZE } from '../../../constants';
import { FloatingTextSystem } from './FloatingTextSystem';
import { Enemy, Projectile } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { SpatialHashGrid } from '../utils/SpatialHashGrid';
import { SimpleObjectPool } from '../utils/SimpleObjectPool';

export class ProjectileSystem implements System {
  
  // 1. 实例化网格和对象池
  private grid: SpatialHashGrid;
  private projectilePool: SimpleObjectPool<Projectile>;

  constructor(private floatingTextSystem: FloatingTextSystem) {
    // 空间网格初始化，格子大小约等于游戏 Grid 大小
    this.grid = new SpatialHashGrid(CELL_SIZE);
    
    // 子弹对象池初始化
    this.projectilePool = new SimpleObjectPool<Projectile>(
      // 创建新对象函数
      () => ({
        id: 0, x: 0, y: 0, radius: 10, markedForDeletion: false,
        vx: 0, vy: 0, damage: 0, originType: 'RANGED', type: 'LINEAR'
      }),
      // 重置对象函数 (在 get 时调用)
      (p) => {
        p.id = Math.random(); // 重新分配ID
        p.markedForDeletion = false;
        p.targetId = undefined;
        p.hitEnemies = undefined;
        p.life = undefined;
        p.spawnY = undefined;
        p.emoji = undefined;
        p.effects = undefined;
        // 其他属性会由调用者覆盖
      }
    );
  }

  /**
   * 暴露给 UnitSystem 调用，用于从池中获取子弹
   */
  public spawnProjectile(gameState: GameState, props: Omit<Projectile, 'id'>) {
    const p = this.projectilePool.get();
    
    // 手动赋值属性
    p.x = props.x;
    p.y = props.y;
    p.vx = props.vx;
    p.vy = props.vy;
    p.damage = props.damage;
    p.emoji = props.emoji;
    p.radius = props.radius;
    p.type = props.type;
    p.targetId = props.targetId;
    p.originType = props.originType;
    p.effects = props.effects;
    p.life = props.life;
    p.hitEnemies = props.hitEnemies;
    p.spawnY = props.spawnY;

    gameState.projectiles.push(p);
  }

  update(dt: number, gameState: GameState, callbacks: EngineCallbacks) {
    // 2. 空间网格：每帧清理并重新插入所有存活敌人
    this.grid.clear();
    gameState.enemies.forEach(e => {
        this.grid.insert({ x: e.x, y: e.y, id: e.id, radius: e.radius });
    });

    gameState.projectiles.forEach(p => {
      if (p.markedForDeletion) return;

      if (p.type === 'TRACKING' && p.targetId) {
        const target = gameState.enemies.find(e => e.id === p.targetId);
        if (target) {
          const angle = Math.atan2(target.y - p.y, target.x - p.x);
          p.vx = Math.cos(angle) * 600;
          p.vy = Math.sin(angle) * 600;
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.life) { // Stream projectile logic
          p.life -= dt;
          if (p.life <= 0) {
              p.markedForDeletion = true;
              return;
          }
          if (p.spawnY) { // Sine wave motion for flames
              p.y = p.spawnY + Math.sin(p.x / 20) * 10;
          }
          
          // 3. 空间网格：只检测附近网格的敌人 (优化 O(N))
          const potentialTargets = this.grid.retrieve({ x: p.x, y: p.y, radius: p.radius, id: p.id });
          
          potentialTargets.forEach(pt => {
              // 再次确认精确距离 (Narrow Phase)
              const e = gameState.enemies.find(enemy => enemy.id === pt.id);
              if (e && !e.markedForDeletion) {
                  if (!(p.hitEnemies?.includes(e.id)) && Math.hypot(e.x - p.x, e.y - p.y) < (e.radius + p.radius)) {
                      this.applyHit(p, e, gameState, callbacks);
                      if (!p.hitEnemies) p.hitEnemies = [];
                      p.hitEnemies.push(e.id);
                  }
              }
          });

      } else { // Standard projectile logic
          // 3. 空间网格：只检测附近网格的敌人 (优化 O(N))
          const potentialTargets = this.grid.retrieve({ x: p.x, y: p.y, radius: p.radius, id: p.id });
          let hit = false;
          
          for (const pt of potentialTargets) {
              const e = gameState.enemies.find(enemy => enemy.id === pt.id);
              if (e && !e.markedForDeletion) {
                  if (Math.hypot(e.x - p.x, e.y - p.y) < (e.radius + p.radius)) {
                      this.applyHit(p, e, gameState, callbacks);
                      p.markedForDeletion = true;
                      hit = true;
                      break; // 击中一个即停止
                  }
              }
          }
      }

      // Out of bounds check
      if (p.x > CANVAS_WIDTH + 50 || p.x < -50) p.markedForDeletion = true;
    });

    // 4. 对象池回收：将标记删除的子弹归还到池中
    // 注意：这里需要先手动 release，再 filter，避免对象引用丢失
    gameState.projectiles.forEach(p => {
        if (p.markedForDeletion) {
            this.projectilePool.release(p);
        }
    });

    gameState.projectiles = gameState.projectiles.filter(p => !p.markedForDeletion);
  }

  private applyHit(p: any, target: Enemy, gameState: GameState, callbacks: EngineCallbacks) {
      target.hp -= p.damage;
      target.hitFlash = 0.2;
      
      if (p.effects?.slow_on_hit) {
          target.slowTimer = 2.0;
          target.slowMultiplier = 0.7;
      }

      this.floatingTextSystem.addText(gameState, target.x, target.y, `-${Math.round(p.damage)}`, 'yellow');
      
      if (target.hp <= 0) {
        this.killEnemy(target, gameState, callbacks);
      }
  }

  private killEnemy(e: Enemy, gameState: GameState, callbacks: EngineCallbacks) {
    if (e.markedForDeletion) return;
    e.markedForDeletion = true;
    
    const isBoss = e.type === 'BOSS';
    const isElite = e.type === 'ELITE';
    
    const xp = isBoss ? 50 : isElite ? 20 : 10;
    const gold = isBoss ? 20 : isElite ? 10 : 5;

    callbacks.onGainLoot?.(xp, gold);

    this.floatingTextSystem.addText(gameState, e.x, e.y - 20, `+${xp} XP`, 'cyan');
    this.floatingTextSystem.addText(gameState, e.x, e.y - 50, `+${gold} G`, 'yellow');

    // Cyberball logic
    const store = useGameStore.getState();
    const chainChance = store.stats.chain_death_dmg_chance || 0;
    if (Math.random() * 100 < chainChance) {
      const otherEnemies = gameState.enemies.filter(enemy => !enemy.markedForDeletion && enemy.id !== e.id);
      if (otherEnemies.length > 0) {
        const target = otherEnemies[Math.floor(Math.random() * otherEnemies.length)];
        const chainDamage = Math.round(e.maxHp * 0.25);
        target.hp -= chainDamage;
        target.hitFlash = 0.2;
        this.floatingTextSystem.addText(gameState, target.x, target.y, `-${chainDamage}`, 'magenta');
        if (target.hp <= 0) {
          this.killEnemy(target, gameState, callbacks);
        }
      }
    }
  }
}
