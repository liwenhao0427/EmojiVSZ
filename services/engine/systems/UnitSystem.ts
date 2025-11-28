
import { GameState } from '../GameState';
import { System } from '../System';
import { EngineCallbacks } from '../index';
import { useGameStore } from '../../../store/useGameStore';
import { Unit, Enemy, Projectile } from '../../../types';
import { GRID_ROWS, GRID_OFFSET_Y, GRID_OFFSET_X, CELL_SIZE } from '../../../constants';

export class UnitSystem implements System {
  private unitCooldowns: Map<string, number> = new Map();

  public reset() {
    this.unitCooldowns.clear();
  }

  update(dt: number, gameState: GameState, callbacks: EngineCallbacks) {
    const store = useGameStore.getState();
    const { gridUnits } = store;

    gridUnits.forEach(u => {
      if (u.isDead || store.phase !== 'COMBAT') return;
      
      let heroAspdBuff = 1.0;

      if (u.isHero) {
        store.updateHeroEnergy(5 * dt);
        const maxEnergy = store.stats.heroMaxEnergy || 100;
        if (u.energy && u.energy >= maxEnergy) {
          this.triggerUltimate(u, gameState, callbacks);
          store.updateHeroEnergy(-maxEnergy); 
        }
        heroAspdBuff += (store.stats.heroTempAttackSpeedMult || 0);
      }

      let cd = this.unitCooldowns.get(u.id) || 0;
      if (cd > 0) {
        this.unitCooldowns.set(u.id, cd - dt);
        return;
      }

      // Targeting logic
      const unitX = GRID_OFFSET_X + (u.col * CELL_SIZE) + CELL_SIZE / 2;
      let validEnemies = gameState.enemies.filter(e => e.row === u.row && e.x > unitX);
      
      const isGlobalRange = (u.isHero && (u.attackType === 'TRACKING' || u.attackType === 'TRI_SHOT' || u.attackType === 'PENTA_SHOT')) || 
                           (!u.isHero && u.type === 'MAGIC') || 
                           u.range > 1500;

      if (isGlobalRange) {
        validEnemies = gameState.enemies;
      }

      const target = validEnemies.find(e => Math.abs(e.x - unitX) <= u.range);

      if (target) {
        this.fireProjectile(u, unitX, GRID_OFFSET_Y + (u.row * CELL_SIZE) + CELL_SIZE / 2, target, gameState);
        const buff = (1 + store.stats.tempAttackSpeedMult + (store.stats.attackSpeed / 100)) * heroAspdBuff;
        this.unitCooldowns.set(u.id, u.maxCooldown / buff);
      }
    });
  }

  private triggerUltimate(hero: Unit, gameState: GameState, callbacks: EngineCallbacks) {
    callbacks.onAddFloatingText?.(gameState, 'ULTIMATE!', 'gold', 600, 400);
    gameState.enemies.forEach(e => {
      e.hp -= 50;
      e.frozen = 3.0;
      e.hitFlash = 0.5;
      callbacks.onAddFloatingText?.(gameState, '-50', 'cyan', e.x, e.y);
      if (e.hp <= 0) {
        // Directly kill enemy without projectile collision
        if (!e.markedForDeletion) {
          e.markedForDeletion = true;
          const xp = e.type === 'BOSS' ? 50 : e.type === 'ELITE' ? 20 : 10;
          const gold = e.type === 'BOSS' ? 20 : e.type === 'ELITE' ? 10 : 5;
          callbacks.onGainLoot?.(xp, gold);
          callbacks.onAddFloatingText?.(gameState, `+${xp} XP`, 'cyan', e.x, e.y - 20);
          callbacks.onAddFloatingText?.(gameState, `+${gold} G`, 'yellow', e.x, e.y - 50);
        }
      }
    });
  }

  private fireProjectile(u: Unit, x: number, y: number, target: Enemy, gameState: GameState) {
    const store = useGameStore.getState();
    const heroDmgBuff = u.isHero ? (1 + (store.stats.heroTempDamageMult || 0)) : 1;
    const damage = u.damage * (1 + store.stats.tempDamageMult + store.stats.damagePercent/100) * heroDmgBuff;
    
    const projectileType: 'LINEAR' | 'TRACKING' = (u.isHero && u.attackType === 'TRACKING') || (!u.isHero && u.type === 'MAGIC') ? 'TRACKING' : 'LINEAR';

    const createBaseProjectile = (startY: number): Omit<Projectile, 'id'> => ({
      x, y: startY,
      vx: 600, vy: 0,
      damage,
      emoji: u.type === 'MELEE' ? '🔪' : u.emoji,
      radius: 10,
      markedForDeletion: false,
      type: projectileType,
      targetId: projectileType === 'TRACKING' ? target.id : undefined,
      originType: u.type,
    });

    const addProjectile = (base: Omit<Projectile, 'id'>) => {
        gameState.projectiles.push({ ...base, id: Math.random() });
    }

    if (u.isHero && u.attackType === 'TRI_SHOT') {
      addProjectile(createBaseProjectile(y)); // Center
      if (u.row > 0) addProjectile(createBaseProjectile(y - CELL_SIZE));
      if (u.row < GRID_ROWS - 1) addProjectile(createBaseProjectile(y + CELL_SIZE));
    } else if (u.isHero && u.attackType === 'PENTA_SHOT') {
      for (let r = 0; r < GRID_ROWS; r++) {
        addProjectile(createBaseProjectile(GRID_OFFSET_Y + (r * CELL_SIZE) + CELL_SIZE/2));
      }
    } else {
      addProjectile(createBaseProjectile(y));
    }
  }
}
