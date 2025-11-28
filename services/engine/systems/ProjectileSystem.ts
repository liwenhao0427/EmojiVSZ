
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

      // Find first enemy hit by this projectile
      const target = gameState.enemies.find(e => Math.hypot(e.x - p.x, e.y - p.y) < (e.radius + p.radius));
      
      if (target) {
        target.hp -= p.damage;
        target.hitFlash = 0.2;
        if (p.originType === 'MELEE') {
          target.x += 20; // Knockback
        }
        this.floatingTextSystem.addText(gameState, target.x, target.y, `-${Math.round(p.damage)}`, 'yellow');
        
        if (target.hp <= 0) {
          this.killEnemy(target, gameState, callbacks);
        }
        p.markedForDeletion = true;
      }

      // Out of bounds check
      if (p.x > CANVAS_WIDTH + 50 || p.x < -50) p.markedForDeletion = true;
    });

    gameState.projectiles = gameState.projectiles.filter(p => !p.markedForDeletion);
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
  }
}
