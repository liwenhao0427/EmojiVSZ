
import { GameState } from '../GameState';
import { System } from '../System';
import { EngineCallbacks } from '../index';
import { useGameStore } from '../../../store/useGameStore';
import { Unit, Enemy, Projectile, PlayerStats } from '../../../types';
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
        if (u.isDead) {
            if (u.effects?.explode_on_death || u.effects?.explode_on_hit || u.effects?.trigger_on_move) {
                this.triggerExplosion(u, gameState, callbacks);
                if (u.effects) { // Prevent re-explosion
                    delete u.effects.explode_on_death;
                    delete u.effects.explode_on_hit;
                    delete u.effects.trigger_on_move;
                }
            }
            return;
        }

      if (store.phase !== 'COMBAT') return;

      this.handleSpecialEffects(u, dt, gameState, callbacks);
      
      if (u.attackState === 'ATTACKING') {
        u.attackProgress = (u.attackProgress || 0) + dt * 4.0;
        if (u.attackProgress >= 1) {
            u.attackState = 'IDLE';
            u.attackProgress = 0;
        }
      }

      if (u.state === 'ARMING') {
          u.armingTimer = (u.armingTimer || 0) - dt;
          if (u.armingTimer <= 0) u.state = 'READY';
          return;
      }
      
      if(u.damage === 0 || u.attackPattern === 'NONE') return;

      let heroAspdBuff = u.isHero ? 1.0 + (store.stats.heroTempAttackSpeedMult || 0) : 1.0;
      if (u.isHero) {
        store.updateHeroEnergy(5 * dt);
        const maxEnergy = store.stats.heroMaxEnergy || 100;
        if (u.energy && u.energy >= maxEnergy) {
          this.triggerUltimate(u, gameState, callbacks);
          store.updateHeroEnergy(-maxEnergy); 
        }
      }

      let cd = this.unitCooldowns.get(u.id) || 0;
      if (cd > 0) {
        this.unitCooldowns.set(u.id, cd - dt);
        return;
      }

      const unitX = GRID_OFFSET_X + (u.col * CELL_SIZE) + CELL_SIZE / 2;
      const unitY = GRID_OFFSET_Y + (u.row * CELL_SIZE) + CELL_SIZE / 2;
      let validEnemies = gameState.enemies.filter(e => e.row === u.row && e.x > unitX && Math.abs(e.x - unitX) <= u.range);
      
      const isGlobalRange = (u.isHero && u.attackType === 'TRACKING') || u.type === 'MAGIC' || u.range > 1500;
      if (isGlobalRange) {
        validEnemies = gameState.enemies.filter(e => Math.hypot(e.x - unitX, e.y - unitY) <= u.range);
      }
      
      const target = validEnemies.sort((a,b) => Math.hypot(a.x - unitX, a.y - unitY) - Math.hypot(b.x - unitX, b.y - unitY))[0];

      if (target) {
        const damage = this.calculateFinalDamage(u, store.stats);

        switch (u.attackPattern) {
            case 'THRUST':
                u.attackState = 'ATTACKING';
                u.attackProgress = 0;
                target.hp -= damage;
                target.hitFlash = 0.2;
                callbacks.onAddFloatingText?.(gameState, `-${damage}`, 'white', target.x, target.y);
                if (target.hp <= 0) this.killEnemy(target, gameState, callbacks);
                break;
            case 'SWING':
                u.attackState = 'ATTACKING';
                u.attackProgress = 0;
                gameState.enemies.forEach(e => {
                    const dist = Math.hypot(e.x - unitX, e.y - unitY);
                    const angle = Math.atan2(e.y - unitY, e.x - unitX);
                    if (dist <= u.range && Math.abs(angle) < Math.PI / 4) {
                        e.hp -= damage;
                        e.hitFlash = 0.2;
                        callbacks.onAddFloatingText?.(gameState, `-${damage}`, 'white', e.x, e.y);
                        if (e.hp <= 0) this.killEnemy(e, gameState, callbacks);
                    }
                });
                break;
            case 'STREAM':
            case 'SHOOT':
            default:
                this.fireProjectile(u, unitX, unitY, target, gameState);
                break;
        }
        
        const buff = (1 + (store.stats.attackSpeed / 100)) * heroAspdBuff;
        this.unitCooldowns.set(u.id, u.maxCooldown / buff);
      }
    });
  }

  private handleSpecialEffects(u: Unit, dt: number, gameState: GameState, callbacks: EngineCallbacks) {
    if (u.effects?.generate_gold) {
        u.specialEffectTimer = (u.specialEffectTimer || 0) - dt;
        if (u.specialEffectTimer <= 0) {
            useGameStore.getState().addGold(u.effects.generate_gold);
            callbacks.onAddFloatingText?.(gameState, `+${u.effects.generate_gold} G`, 'yellow', GRID_OFFSET_X + u.col * CELL_SIZE + 30, GRID_OFFSET_Y + u.row * CELL_SIZE);
            u.specialEffectTimer = u.maxCooldown;
        }
    }
    
    if (u.state === 'READY' && u.effects?.explode_on_contact) {
        const unitX = GRID_OFFSET_X + (u.col * CELL_SIZE) + CELL_SIZE / 2;
        const enemyInRange = gameState.enemies.find(e => e.row === u.row && Math.abs(e.x - unitX) <= u.range);
        if (enemyInRange) {
            this.triggerExplosion(u, gameState, callbacks);
            u.hp = 0;
            u.isDead = true;
        }
    }
  }

  private triggerExplosion(u: Unit, gameState: GameState, callbacks: EngineCallbacks) {
      const unitX = GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE / 2;
      const unitY = GRID_OFFSET_Y + u.row * CELL_SIZE + CELL_SIZE / 2;
      const damage = this.calculateFinalDamage(u, useGameStore.getState().stats);
      
      gameState.enemies.forEach(e => {
          if (Math.hypot(e.x - unitX, e.y - unitY) < u.range) {
              e.hp -= damage;
              e.hitFlash = 0.3;
              callbacks.onAddFloatingText?.(gameState, `-${damage}`, 'orange', e.x, e.y);
              if (e.hp <= 0) this.killEnemy(e, gameState, callbacks);
          }
      });
  }
  
  private calculateFinalDamage(u: Unit, stats: PlayerStats): number {
      const heroDmgBuff = u.isHero ? (1 + (stats.heroTempDamageMult || 0)) : 1;
      let flatBonus = 0;
      if (u.type === 'MELEE') flatBonus = stats.meleeDmg;
      if (u.type === 'RANGED') flatBonus = stats.rangedDmg;
      if (u.type === 'MAGIC') flatBonus = stats.elementalDmg;
      if (u.type === 'ENGINEERING') flatBonus = stats.engineering;
      
      const globalDmgMult = (1 + (stats.damagePercent / 100) + (stats.tempDamageMult || 0));

      return Math.round((u.damage + flatBonus) * globalDmgMult * heroDmgBuff);
  }

  private killEnemy(e: Enemy, gameState: GameState, callbacks: EngineCallbacks) {
    if (e.markedForDeletion) return;
    e.markedForDeletion = true;
    const xp = e.type === 'BOSS' ? 50 : e.type === 'ELITE' ? 20 : 10;
    const gold = e.type === 'BOSS' ? 20 : e.type === 'ELITE' ? 10 : 5;
    callbacks.onGainLoot?.(xp, gold);

    callbacks.onAddFloatingText?.(gameState, `+${xp} XP`, 'cyan', e.x, e.y - 20);
    callbacks.onAddFloatingText?.(gameState, `+${gold} G`, 'yellow', e.x, e.y - 50);

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
        callbacks.onAddFloatingText?.(gameState, `-${chainDamage}`, 'magenta', target.x, target.y);
        if (target.hp <= 0) {
          this.killEnemy(target, gameState, callbacks);
        }
      }
    }
  }

  private triggerUltimate(hero: Unit, gameState: GameState, callbacks: EngineCallbacks) {
    callbacks.onAddFloatingText?.(gameState, '终极技能!', 'gold', 600, 400);
    gameState.enemies.forEach(e => {
      e.hp -= 50;
      e.frozen = 3.0;
      e.hitFlash = 0.5;
      callbacks.onAddFloatingText?.(gameState, '-50', 'cyan', e.x, e.y);
      if (e.hp <= 0) this.killEnemy(e, gameState, callbacks);
    });
  }

  private fireProjectile(u: Unit, x: number, y: number, target: Enemy, gameState: GameState) {
    const store = useGameStore.getState();
    const damage = this.calculateFinalDamage(u, store.stats);
    
    const projectileType: 'LINEAR' | 'TRACKING' = (u.isHero && u.attackType === 'TRACKING') || u.type === 'MAGIC' ? 'TRACKING' : 'LINEAR';

    const createBaseProjectile = (startY: number): Omit<Projectile, 'id'> => ({
      x, y: startY,
      vx: 600, vy: 0,
      damage,
      emoji: u.projectileEmoji,
      radius: 10,
      markedForDeletion: false,
      type: projectileType,
      targetId: projectileType === 'TRACKING' ? target.id : undefined,
      originType: u.type,
      effects: u.effects,
      life: u.attackPattern === 'STREAM' ? 0.75 : undefined,
      hitEnemies: u.attackPattern === 'STREAM' ? [] : undefined,
      spawnY: u.attackPattern === 'STREAM' ? y : undefined,
    });

    const addProjectile = (base: Omit<Projectile, 'id'>) => {
        gameState.projectiles.push({ ...base, id: Math.random() });
    }

    if (u.isHero && u.attackType === 'TRI_SHOT') {
      addProjectile(createBaseProjectile(y));
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
