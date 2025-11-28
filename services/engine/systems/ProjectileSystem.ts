
import { GameState } from '../GameState';
import { System } from '../System';
import { EngineCallbacks } from '../index';
import { CANVAS_WIDTH } from '../../../constants';
import { FloatingTextSystem } from './FloatingTextSystem';
import { Enemy } from '../../../types';
import { useGameStore } from '../../../store/useGameStore';

export class ProjectileSystem implements System {

  constructor(private floatingTextSystem: FloatingTextSystem) {}

  update(dt: number, gameState: GameState, callbacks: EngineCallbacks) {
    gameState.projectiles.forEach(p => {
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
          // Piercing collision for stream
          gameState.enemies.forEach(e => {
              if (!(p.hitEnemies?.includes(e.id)) && Math.hypot(e.x - p.x, e.y - p.y) < (e.radius + p.radius)) {
                  this.applyHit(p, e, gameState, callbacks);
                  p.hitEnemies?.push(e.id);
              }
          });
      } else { // Standard projectile logic
          const target = gameState.enemies.find(e => Math.hypot(e.x - p.x, e.y - p.y) < (e.radius + p.radius));
          if (target) {
              this.applyHit(p, target, gameState, callbacks);
              p.markedForDeletion = true;
          }
      }

      // Out of bounds check
      if (p.x > CANVAS_WIDTH + 50 || p.x < -50) p.markedForDeletion = true;
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
