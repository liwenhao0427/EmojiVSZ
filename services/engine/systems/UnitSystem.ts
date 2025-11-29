import { GameState } from '../GameState';
import { System } from '../System';
import { EngineCallbacks } from '../index';
import { useGameStore } from '../../../store/useGameStore';
import { Unit, Enemy, Projectile, PlayerStats } from '../../../types';
import { GRID_ROWS, GRID_OFFSET_Y, GRID_OFFSET_X, CELL_SIZE } from '../../../constants';
import { ProjectileSystem } from './ProjectileSystem'; 
import { audioManager } from '../../audioManager';
import { ENEMY_DATA } from '../../../data/enemies';

export class UnitSystem implements System {
  private unitCooldowns: Map<string, number> = new Map();

  public reset() {
    this.unitCooldowns.clear();
  }

  update(dt: number, gameState: GameState, callbacks: EngineCallbacks, projectileSystem?: ProjectileSystem) {
    const store = useGameStore.getState();
    const unitIds = store.gridUnits.map(u => u.id); // Work with IDs to avoid stale objects

    unitIds.forEach(id => {
        const u = useGameStore.getState().gridUnits.find(unit => unit.id === id);
        if (!u) return;

        if (u.isDead) {
            if (u.effects?.explode_on_death || u.effects?.explode_on_hit || u.effects?.trigger_on_move) {
                this.triggerExplosion(u, gameState, callbacks);
                if (u.effects) { 
                    delete u.effects.explode_on_death;
                    delete u.effects.explode_on_hit;
                    delete u.effects.trigger_on_move;
                }
            }
            return;
        }

      if (store.phase !== 'COMBAT') return;

      this.handleSpecialEffects(u, dt, gameState, callbacks);
      
      if (u.isHero) {
          if (u.isUlting) {
              store.updateUltTimer(dt);
          } else {
              store.updateHeroEnergy(5 * dt);
              const latestHeroState = useGameStore.getState().gridUnits.find(unit => unit.isHero);
              const maxEnergy = useGameStore.getState().stats.heroMaxEnergy || 100;
              if (latestHeroState && latestHeroState.energy && latestHeroState.energy >= maxEnergy) {
                this.triggerUltimate(latestHeroState, gameState, callbacks);
                store.updateHeroEnergy(-maxEnergy); 
              }
          }
      }
      
      if (u.attackState === 'ATTACKING') {
        u.attackProgress = (u.attackProgress || 0) + dt * 4.0;
        if (u.isUlting) u.attackProgress += dt * 8.0; 
        
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

      let cd = this.unitCooldowns.get(u.id) || 0;
      if (cd > 0) {
        this.unitCooldowns.set(u.id, cd - dt);
        return;
      }

      const unitX = GRID_OFFSET_X + (u.col * CELL_SIZE) + CELL_SIZE / 2;
      const unitY = GRID_OFFSET_Y + (u.row * CELL_SIZE) + CELL_SIZE / 2;
      const rangeInPixels = u.range * CELL_SIZE;
      
      // Default: same row targeting for non-magic
      let validEnemies = gameState.enemies.filter(e => e.row === u.row && e.x > unitX && Math.abs(e.x - unitX) <= rangeInPixels && (!e.deathTimer || e.deathTimer <= 0));

      // Global targeting for magic, hero with tracking, or specific effects/range
      const isGlobalRange = u.type === 'MAGIC' || (u.isHero && u.attackType === 'TRACKING') || !!u.effects?.is_tracking || u.range > 20;
      if (isGlobalRange) {
        validEnemies = gameState.enemies.filter(e => Math.hypot(e.x - unitX, e.y - unitY) <= rangeInPixels && (!e.deathTimer || e.deathTimer <= 0));
      }
      
      if (validEnemies.length === 0) return;

      const target = validEnemies.sort((a,b) => Math.hypot(a.x - unitX, a.y - unitY) - Math.hypot(b.x - unitX, b.y - unitY))[0];

      const damage = this.calculateFinalDamage(u, store.stats);

      switch (u.attackPattern) {
          case 'THRUST':
              u.attackState = 'ATTACKING';
              u.attackProgress = 0;
              audioManager.play('swing', { volume: 0.3 });
              
              const affectedEnemies = gameState.enemies.filter(e => e.row === u.row && e.x > unitX && e.x < unitX + rangeInPixels && (!e.deathTimer || e.deathTimer <= 0));

              affectedEnemies.forEach(e => {
                  e.hp -= damage;
                  e.hitFlash = 0.2;
                  callbacks.onAddFloatingText?.(gameState, `-${damage}`, 'white', e.x, e.y);
                  if (e.hp <= 0) this.killEnemy(e, gameState, callbacks);
              });
              break;
          case 'STREAM':
          case 'SHOOT':
          default:
              audioManager.play('shoot', { volume: u.isUlting ? 0.1 : 0.2 });
              this.fireProjectile(u, unitX, unitY, target, gameState, projectileSystem);
              break;
      }
      
      const heroAspdMult = u.isHero ? 1.0 + (store.stats.heroAttackSpeedMult || 0) : 1.0;
      const buff = (1 + (store.stats.attackSpeed || 0)) * (1 + (store.stats.tempAttackSpeedMult || 0)) * heroAspdMult;
      let cooldownTime = u.maxCooldown / Math.max(0.1, buff);

      if (u.isUlting) {
          cooldownTime = cooldownTime / (store.stats.ult_speed_mult || 3);
      }

      this.unitCooldowns.set(u.id, cooldownTime);
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
        const rangeInPixels = u.range * CELL_SIZE;
        const enemyInRange = gameState.enemies.find(e => e.row === u.row && Math.abs(e.x - unitX) <= rangeInPixels && (!e.deathTimer || e.deathTimer <= 0));
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
      const rangeInPixels = u.range * CELL_SIZE;
      
      gameState.enemies.forEach(e => {
          if (Math.hypot(e.x - unitX, e.y - unitY) < rangeInPixels && (!e.deathTimer || e.deathTimer <= 0)) {
              e.hp -= damage;
              e.hitFlash = 0.3;
              callbacks.onAddFloatingText?.(gameState, `-${damage}`, 'orange', e.x, e.y);
              if (e.hp <= 0) this.killEnemy(e, gameState, callbacks);
          }
      });
  }
  
  private calculateFinalDamage(u: Unit, stats: PlayerStats): number {
      let heroDmgMult = u.isHero ? (1 + (stats.heroDamageMult || 0)) : 1;
      if (u.isHero && u.isUlting) {
        heroDmgMult *= (1 + (stats.ult_dmg_bonus || 0));
      }

      let flatBonus = 0;
      if (u.type === 'MELEE') flatBonus = stats.meleeDmg;
      if (u.type === 'RANGED') flatBonus = stats.rangedDmg;
      if (u.type === 'MAGIC') flatBonus = stats.elementalDmg;
      if (u.type === 'ENGINEERING') flatBonus = stats.engineering;
      
      const globalDmgMult = (1 + (stats.damagePercent || 0)) * (1 + (stats.tempDamageMult || 0));

      return Math.round((u.damage + flatBonus) * globalDmgMult * heroDmgMult);
  }

  private killEnemy(e: Enemy, gameState: GameState, callbacks: EngineCallbacks) {
    if (e.markedForDeletion || (e.deathTimer && e.deathTimer > 0)) return;
    
    e.deathTimer = 1.0; // Start 1-second death animation
    audioManager.play('death', { volume: 0.4 });
    
    const enemyData = e.name ? ENEMY_DATA[e.name] : null;
    const xp = enemyData?.xp ?? 3;
    const gold = enemyData?.gold ?? 5;
    
    callbacks.onGainLoot?.(xp, gold);

    callbacks.onAddFloatingText?.(gameState, `+${xp} XP`, 'cyan', e.x, e.y - 20);
    callbacks.onAddFloatingText?.(gameState, `+${gold} G`, 'yellow', e.x, e.y - 50);

    const store = useGameStore.getState();
    const chainChance = store.stats.chain_death_dmg_chance || 0;
    if (Math.random() * 100 < chainChance) {
      const otherEnemies = gameState.enemies.filter(enemy => !enemy.markedForDeletion && (!enemy.deathTimer || enemy.deathTimer <= 0) && enemy.id !== e.id);
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
    const store = useGameStore.getState();
    const bonusDuration = store.stats.ult_duration_bonus || 0;
    const duration = 3.0 + bonusDuration;
    store.setHeroUltState(true, duration);
    callbacks.onAddFloatingText?.(gameState, 'OVERDRIVE!', '#22d3ee', 600, 400); // Cyan color
  }

  private fireProjectile(u: Unit, x: number, y: number, target: Enemy | undefined, gameState: GameState, projectileSystem?: ProjectileSystem) {
    const store = useGameStore.getState();
    const damage = this.calculateFinalDamage(u, store.stats);
    
    // Magic weapons with tracking effect will track, otherwise they are linear (but can target any row via global range)
    const projectileType: 'LINEAR' | 'TRACKING' = ((u.isHero && u.attackType === 'TRACKING') || !!u.effects?.is_tracking) && target ? 'TRACKING' : 'LINEAR';

    const createBaseProjectile = (startY: number, vyOffset = 0): Omit<Projectile, 'id'> => ({
      x, y: startY,
      vx: 600, vy: vyOffset,
      damage,
      emoji: u.projectileEmoji,
      radius: 10,
      markedForDeletion: false,
      type: projectileType,
      targetId: projectileType === 'TRACKING' && target ? target.id : undefined,
      originType: u.type,
      originId: u.id,
      effects: u.effects,
      life: u.attackPattern === 'STREAM' ? 0.75 : undefined,
      hitEnemies: [], // Initialize for all projectiles
      spawnY: u.attackPattern === 'STREAM' ? y : undefined,
      bounceCount: u.effects?.bounceCount || 0,
      chainExplosion: u.effects?.chain_explosion ? true : false,
      pierce: u.effects?.pierce || 0,
    });

    const addProjectile = (base: Omit<Projectile, 'id'>) => {
        if (projectileSystem) {
            projectileSystem.spawnProjectile(gameState, base);
        } else {
            gameState.projectiles.push({ ...base, id: Math.random() });
        }
    }

    if (u.isHero && u.attackType === 'DOUBLE_SHOT') {
        addProjectile(createBaseProjectile(y - 15));
        addProjectile(createBaseProjectile(y + 15));
    } else if (u.isHero && u.attackType === 'TRI_SHOT') {
      addProjectile(createBaseProjectile(y));
      if (u.row > 0) addProjectile(createBaseProjectile(y - CELL_SIZE));
      if (u.row < GRID_ROWS - 1) addProjectile(createBaseProjectile(y + CELL_SIZE));
    } else if (u.isHero && u.attackType === 'PENTA_SHOT') {
      for (let r = 0; r < GRID_ROWS; r++) {
        addProjectile(createBaseProjectile(GRID_OFFSET_Y + (r * CELL_SIZE) + CELL_SIZE/2));
      }
    } else {
      u.attackState = 'ATTACKING';
      u.attackProgress = 0;
      addProjectile(createBaseProjectile(y));
    }
  }
}