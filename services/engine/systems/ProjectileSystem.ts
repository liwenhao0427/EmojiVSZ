
import { GameState } from '../GameState';
import { System } from '../System';
import { EngineCallbacks } from '../index';
import { CANVAS_WIDTH, CELL_SIZE } from '../../../constants';
import { FloatingTextSystem } from './FloatingTextSystem';
import { Enemy, Projectile } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';
import { SpatialHashGrid } from '../utils/SpatialHashGrid';
import { SimpleObjectPool } from '../utils/SimpleObjectPool';
import { audioManager } from '../../audioManager';
import { ENEMY_DATA } from '../../../data/enemies';
import { Log } from '../../Log';

export class ProjectileSystem implements System {
  
  private grid: SpatialHashGrid;
  private projectilePool: SimpleObjectPool<Projectile>;

  constructor(private floatingTextSystem: FloatingTextSystem) {
    this.grid = new SpatialHashGrid(CELL_SIZE);
    
    this.projectilePool = new SimpleObjectPool<Projectile>(
      () => ({
        id: 0, x: 0, y: 0, radius: 10, markedForDeletion: false,
        vx: 0, vy: 0, damage: 0, originType: 'RANGED', type: 'LINEAR'
      }),
      (p) => {
        p.id = Math.random(); 
        p.markedForDeletion = false;
        p.targetId = undefined;
        p.hitEnemies = [];
        p.life = undefined;
        p.spawnY = undefined;
        p.emoji = undefined;
        p.effects = undefined;
        p.bounceCount = undefined;
        p.chainExplosion = undefined;
        p.pierce = undefined;
      }
    );
  }

  public spawnProjectile(gameState: GameState, props: Omit<Projectile, 'id'>) {
    const p = this.projectilePool.get();
    
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
    p.hitEnemies = []; // Always start with a clean slate
    p.spawnY = props.spawnY;
    p.bounceCount = props.bounceCount;
    p.chainExplosion = props.chainExplosion;
    p.pierce = props.pierce;

    gameState.projectiles.push(p);
  }

  update(dt: number, gameState: GameState, callbacks: EngineCallbacks) {
    this.grid.clear();
    gameState.enemies.forEach(e => {
        // Only include living enemies in collision detection
        if (!e.deathTimer || e.deathTimer <= 0) {
            this.grid.insert({ x: e.x, y: e.y, id: e.id, radius: e.radius });
        }
    });

    gameState.projectiles.forEach(p => {
      if (p.markedForDeletion) return;

      if (p.type === 'TRACKING' && p.targetId) {
        const target = gameState.enemies.find(e => e.id === p.targetId && (!e.deathTimer || e.deathTimer <= 0));
        if (target) {
          const angle = Math.atan2(target.y - p.y, target.x - p.x);
          p.vx = Math.cos(angle) * 600;
          p.vy = Math.sin(angle) * 600;
        } else {
            p.type = 'LINEAR';
        }
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.life) { // Stream projectile logic (piercing by nature)
          p.life -= dt;
          if (p.life <= 0) {
              p.markedForDeletion = true;
              return;
          }
          if (p.spawnY) { 
              p.y = p.spawnY + Math.sin(p.x / 20) * 10;
          }
      }

      const potentialTargets = this.grid.retrieve({ x: p.x, y: p.y, radius: p.radius, id: p.id });
      
      for (const pt of potentialTargets) {
          if (p.markedForDeletion) break; // If a non-piercing projectile hits, stop checking

          const e = gameState.enemies.find(enemy => enemy.id === pt.id);

          // Check for valid target and if it has been hit by this projectile before
          if (e && !e.markedForDeletion && (!e.deathTimer || e.deathTimer <= 0) && !(p.hitEnemies?.includes(e.id))) {
              if (Math.hypot(e.x - p.x, e.y - p.y) < (e.radius + p.radius)) {
                  this.applyHit(p, e, gameState, callbacks);
                  
                  if (!p.hitEnemies) p.hitEnemies = [];
                  p.hitEnemies.push(e.id);

                  if (p.life) continue; // Stream projectiles can hit multiple targets per frame

                  if (p.bounceCount && p.bounceCount > 0) {
                      this.handleBounce(p, e, gameState);
                      p.markedForDeletion = true; // Bouncing projectile is consumed
                      break;
                  }
                  
                  if (p.pierce && p.pierce > 0) {
                      p.pierce--; // Decrement pierce count
                  } else {
                      p.markedForDeletion = true; // No more pierce, mark for deletion
                      break;
                  }
              }
          }
      }

      if (p.x > CANVAS_WIDTH + 50 || p.x < -50 || p.y < -50 || p.y > 1000) p.markedForDeletion = true;
    });

    gameState.projectiles.forEach(p => {
        if (p.markedForDeletion) {
            this.projectilePool.release(p);
        }
    });

    gameState.projectiles = gameState.projectiles.filter(p => !p.markedForDeletion);
  }

  private handleBounce(p: Projectile, hitEnemy: Enemy, gameState: GameState) {
      // Find nearest enemy excluding hitEnemy
      let nearestDist = Infinity;
      let nearestEnemy: Enemy | null = null;
      
      gameState.enemies.forEach(e => {
          if (e.id !== hitEnemy.id && !e.markedForDeletion && (!e.deathTimer || e.deathTimer <= 0)) {
              const dist = Math.hypot(e.x - p.x, e.y - p.y);
              if (dist < 500 && dist < nearestDist) {
                  nearestDist = dist;
                  nearestEnemy = e;
              }
          }
      });
      
      if (nearestEnemy) {
          const newP: Omit<Projectile, 'id'> = {
            x: p.x, y: p.y,
            vx: 0, vy: 0, // Set below
            damage: Math.round(p.damage * 0.7), // 70% damage on bounce
            emoji: p.emoji,
            radius: p.radius,
            markedForDeletion: false,
            type: 'TRACKING',
            originType: p.originType,
            effects: p.effects,
            bounceCount: p.bounceCount! - 1,
            targetId: (nearestEnemy as Enemy).id,
            chainExplosion: p.chainExplosion
          };
          
          const angle = Math.atan2((nearestEnemy as Enemy).y - p.y, (nearestEnemy as Enemy).x - p.x);
          newP.vx = Math.cos(angle) * 600;
          newP.vy = Math.sin(angle) * 600;
          
          this.spawnProjectile(gameState, newP);
      }
  }

  private applyHit(p: Projectile, target: Enemy, gameState: GameState, callbacks: EngineCallbacks) {
      Log.debug('Projectile', `Applying hit. Damage: ${p.damage}. Target HP before: ${target.hp.toFixed(1)}`);
      target.hp -= p.damage;
      target.hitFlash = 0.2;
      audioManager.play('hit', { volume: 0.3 });
      
      if (p.effects?.slow_on_hit) {
          target.slowTimer = 2.0;
          target.slowMultiplier = 0.7;
      }
      
      if (p.effects?.burn_chance && Math.random() * 100 < p.effects.burn_chance) {
          target.burnTimer = 3.0; // Refresh duration
          const burnDps = p.effects.burn_damage || Math.max(1, p.damage * 0.1); // 10% of hit dmg per sec, min 1
          target.burnDamage = (target.burnDamage || 0) + burnDps; // Stacking damage
      }

      // Explode on hit (Level 3 Effect)
      if (p.effects?.explode_on_hit) {
          this.triggerAOE(gameState, target.x, target.y, 100, p.damage * 0.5, callbacks, p.chainExplosion);
      }

      this.floatingTextSystem.addText(gameState, target.x, target.y, `-${Math.round(p.damage)}`, 'white');
      
      if (target.hp <= 0) {
        // Chain Explosion Logic (Level 4 Effect)
        if (p.chainExplosion) {
             this.triggerAOE(gameState, target.x, target.y, 150, p.damage, callbacks, false);
        }
        this.killEnemy(target, gameState, callbacks);
      }
  }

  private triggerAOE(gameState: GameState, x: number, y: number, radius: number, damage: number, callbacks: EngineCallbacks, chain: boolean = false) {
      // Visual feedback
      callbacks.onAddFloatingText?.(gameState, 'BOOM!', 'orange', x, y - 20);
      
      gameState.enemies.forEach(e => {
          if (!e.markedForDeletion && (!e.deathTimer || e.deathTimer <= 0) && Math.hypot(e.x - x, e.y - y) <= radius) {
              e.hp -= damage;
              e.hitFlash = 0.3;
              if (e.hp <= 0) {
                  this.killEnemy(e, gameState, callbacks);
                  if (chain) {
                      // Chain reaction (limit depth or probability to prevent infinite loops if desired)
                      // Simple implementation: trigger another smaller blast
                      setTimeout(() => this.triggerAOE(gameState, e.x, e.y, radius * 0.8, damage * 0.5, callbacks, false), 100);
                  }
              }
          }
      });
  }

  private killEnemy(e: Enemy, gameState: GameState, callbacks: EngineCallbacks) {
    if (e.markedForDeletion || (e.deathTimer && e.deathTimer > 0)) return;
    
    e.deathTimer = 1.0; // Start 1-second death animation
    audioManager.play('death', { volume: 0.4 });
    
    const enemyData = e.name ? ENEMY_DATA[e.name] : null;
    const xp = enemyData?.xp ?? 3;
    const gold = enemyData?.gold ?? 5;

    Log.log('战斗', `击杀了 ${e.name}！获得 ${xp} 经验和 ${gold} 金币。`);
    callbacks.onGainLoot?.(xp, gold);

    this.floatingTextSystem.addText(gameState, e.x, e.y - 20, `+${xp} XP`, 'cyan');
    this.floatingTextSystem.addText(gameState, e.x, e.y - 50, `+${gold} G`, 'yellow');

    const store = useGameStore.getState();
    const chainChance = store.stats.chain_death_dmg_chance || 0;
    if (Math.random() * 100 < chainChance) {
      const otherEnemies = gameState.enemies.filter(enemy => !enemy.markedForDeletion && (!enemy.deathTimer || enemy.deathTimer <= 0) && enemy.id !== e.id);
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