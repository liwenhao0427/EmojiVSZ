
import { Unit, Enemy, Projectile, FloatingText, GamePhase, PlayerStats, AmmoBayState } from '../types';
import { GRID_ROWS, GRID_COLS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, CANVAS_WIDTH, CANVAS_HEIGHT, WAVE_CONFIG, ENEMY_TYPES } from '../constants';
import { useGameStore } from '../store/useGameStore';

interface EngineCallbacks {
    onDamagePlayer?: (amount: number) => void;
    onGainLoot?: (xp: number, gold: number) => void;
    onWaveEnd?: () => void;
    onLootGoblinKill?: () => void;
}

export class GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animationId: number = 0;
  private lastTime: number = 0;
  
  public isRunning: boolean = false;
  
  // Game State Local Copy
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private floatingTexts: FloatingText[] = [];
  
  private waveTime: number = 0;
  private spawnTimer: number = 0;
  
  // Input State
  private dragUnitId: string | null = null;
  private unitCooldowns: Map<string, number> = new Map();

  private callbacks?: EngineCallbacks;

  constructor(canvas: HTMLCanvasElement, stats?: PlayerStats, callbacks?: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.callbacks = callbacks;
    
    // Bind Input
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    
    // Explicitly clear state on start if phase is valid to prevent stale frames
    const store = useGameStore.getState();
    if (store.phase === GamePhase.COMBAT) {
        // Double check we are in a valid wave state
    }
    
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
  }

  public startWave(duration: number, wave: number) {
    // Critical: Clear everything to prevent immediate Game Over or glitches
    this.enemies = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.unitCooldowns.clear();
    
    this.waveTime = 0;
    this.spawnTimer = 2.0; // Small delay before first spawn
    
    if (!this.isRunning) {
        this.start();
    }
  }

  public updateAmmo(ammoState: AmmoBayState) {
    // No-op
  }

  public updateStats(stats: PlayerStats) {
    // Sync if needed
  }

  public updateMouse(x: number, y: number) {
    // No-op
  }

  public resize(width: number, height: number) {
    this.canvas.width = width;
    this.canvas.height = height;
  }

  public cleanup() {
    this.stop();
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Cap dt to prevent huge jumps if tab was inactive
    const safeDt = Math.min(dt, 0.1);

    this.update(safeDt);
    this.draw();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    const store = useGameStore.getState();
    
    // Only update combat logic in COMBAT phase
    // In SHOP/DRAFT phase, we skip this to "pause" the game, but continue the loop for rendering/grid sorting
    if (store.phase !== GamePhase.COMBAT) return;

    // --- Wave Management ---
    this.waveTime += dt;
    this.spawnEnemies(dt, store.stats.wave);

    // --- Unit Logic ---
    this.updateUnits(dt, store.gridUnits);

    // --- Entity Updates ---
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateFloatingText(dt);

    // --- End Conditions ---
    // Game Over Check
    if (this.enemies.some(e => e.x < 0)) {
        store.setPhase(GamePhase.GAME_OVER);
        this.stop();
        return;
    }
    
    // Wave Clear Check
    const waveConfig = WAVE_CONFIG.find(w => w.wave === store.stats.wave) || WAVE_CONFIG[WAVE_CONFIG.length-1];
    const duration = waveConfig ? waveConfig.duration : 30;

    if (this.waveTime > duration && this.enemies.length === 0) {
        store.resetWaveState(); // Trigger Draft Phase
        this.enemies = [];
        this.projectiles = [];
        // Don't stop loop, keep it running for UI interactions in SHOP/DRAFT
        // this.stop(); 
        this.callbacks?.onWaveEnd?.();
    }
  }

  // --- Spawning ---
  private spawnEnemies(dt: number, wave: number) {
      const config = WAVE_CONFIG.find(w => w.wave === wave) || WAVE_CONFIG[WAVE_CONFIG.length-1];
      if (!config) return;

      if (this.waveTime < config.duration) {
          this.spawnTimer -= dt;
          if (this.spawnTimer <= 0) {
              this.spawnTimer = config.interval;
              
              // Spawn
              const row = Math.floor(Math.random() * GRID_ROWS);
              const typeId = config.enemies[Math.floor(Math.random() * config.enemies.length)];
              const typeData = ENEMY_TYPES.find(e => e.id === typeId) || ENEMY_TYPES[0];

              this.enemies.push({
                  id: Math.random(),
                  x: CANVAS_WIDTH + 50,
                  y: GRID_OFFSET_Y + (row * CELL_SIZE) + (CELL_SIZE/2),
                  radius: 40,
                  markedForDeletion: false,
                  hp: typeData.hp * (1 + (wave * 0.2)), // Scaling
                  maxHp: typeData.hp,
                  speed: typeData.speed,
                  emoji: typeData.emoji,
                  type: typeData.type as any,
                  damage: typeData.damage,
                  row: row,
                  attackTimer: 0,
                  isAttacking: false,
                  frozen: 0
              });
          }
      }
  }

  // --- Unit Combat Logic ---
  private updateUnits(dt: number, units: Unit[]) {
      const store = useGameStore.getState();

      units.forEach(u => {
          if (u.isDead) return;

          // Hero Energy Regen
          if (u.isHero) {
              store.updateHeroEnergy(5 * dt);
              if (u.energy && u.energy >= 100) {
                  // ULTIMATE!
                  this.triggerUltimate(u);
                  store.updateHeroEnergy(-100); 
              }
          }

          // Cooldown
          let cd = this.unitCooldowns.get(u.id) || 0;
          if (cd > 0) {
              this.unitCooldowns.set(u.id, cd - dt);
              return;
          }

          // Targeting
          // Filter enemies in same row (unless tracking)
          let validEnemies = this.enemies.filter(e => e.row === u.row && e.x > (GRID_OFFSET_X + u.col * CELL_SIZE));
          
          if (u.type === 'MAGIC' || u.range > 1500) {
              // Magic hits any row
              validEnemies = this.enemies;
          }

          // Distance check
          const unitX = GRID_OFFSET_X + (u.col * CELL_SIZE) + CELL_SIZE/2;
          const target = validEnemies.find(e => Math.abs(e.x - unitX) <= u.range);

          if (target) {
              // Fire
              this.fireProjectile(u, unitX, GRID_OFFSET_Y + (u.row * CELL_SIZE) + CELL_SIZE/2, target);
              
              // Set Cooldown (apply temp attack speed buff)
              const buff = 1 + store.stats.tempAttackSpeedMult;
              this.unitCooldowns.set(u.id, u.maxCooldown / buff);
          }
      });
  }

  private triggerUltimate(hero: Unit) {
      // Screen freeze + Damage all
      this.floatingTexts.push({ x: CANVAS_WIDTH/2, y: CANVAS_HEIGHT/2, text: "ULTIMATE!", color: 'gold', life: 2, velocity: {x:0, y:-50}, scale: 3 });
      this.enemies.forEach(e => {
          e.hp -= 50;
          e.frozen = 3.0; // Freeze 3s
          this.floatingTexts.push({ x: e.x, y: e.y, text: "-50", color: 'cyan', life: 1, velocity: {x:0, y:-20}, scale: 1.5 });
          if (e.hp <= 0) e.markedForDeletion = true;
      });
  }

  private fireProjectile(u: Unit, x: number, y: number, target: Enemy) {
      const store = useGameStore.getState();
      const damage = u.damage * (1 + store.stats.tempDamageMult);

      if (u.type === 'MELEE') {
          // Instant hit
          target.hp -= damage;
          target.x += 30; // Knockback
          this.addText(target.x, target.y, `-${Math.round(damage)}`, 'white');
          if (target.hp <= 0) target.markedForDeletion = true;
          return;
      }

      // Use unit's own emoji as projectile
      this.projectiles.push({
          id: Math.random(),
          x, y,
          vx: 600, vy: 0, // Base velocity
          damage,
          emoji: u.emoji, // Projectile looks like mini version of unit
          radius: 10,
          markedForDeletion: false,
          type: u.type === 'MAGIC' ? 'TRACKING' : 'LINEAR',
          targetId: target.id
      });
  }

  private updateEnemies(dt: number) {
      const store = useGameStore.getState();
      
      this.enemies.forEach(e => {
          if (e.frozen > 0) {
              e.frozen -= dt;
              return;
          }

          // Movement
          // Check collision with Live Units
          const unitInCell = store.gridUnits.find(u => 
              !u.isDead && u.row === e.row && 
              // Simple bounding box for cell
              Math.abs(e.x - (GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE/2)) < (CELL_SIZE/2 + e.radius)
          );

          if (unitInCell) {
              // Attack Unit
              e.attackTimer -= dt;
              if (e.attackTimer <= 0) {
                  store.damageUnit(unitInCell.id, e.damage);
                  this.addText(e.x - 20, e.y, "CRUNCH", 'red');
                  e.attackTimer = 1.0; // 1 sec attack rate
              }
          } else {
              // Move Forward
              e.x -= e.speed * dt;
          }
      });

      this.enemies = this.enemies.filter(e => !e.markedForDeletion);
  }

  private updateProjectiles(dt: number) {
      this.projectiles.forEach(p => {
          // Move
          if (p.type === 'TRACKING' && p.targetId) {
              const target = this.enemies.find(e => e.id === p.targetId);
              if (target) {
                  const angle = Math.atan2(target.y - p.y, target.x - p.x);
                  p.vx = Math.cos(angle) * 600;
                  p.vy = Math.sin(angle) * 600;
              }
          }

          p.x += p.vx * dt;
          p.y += p.vy * dt;

          // Collision
          const target = this.enemies.find(e => Math.hypot(e.x - p.x, e.y - p.y) < (e.radius + p.radius));
          
          if (target) {
              target.hp -= p.damage;
              this.addText(target.x, target.y, `-${Math.round(p.damage)}`, 'yellow');
              if (target.hp <= 0) target.markedForDeletion = true;
              p.markedForDeletion = true;
          }

          if (p.x > CANVAS_WIDTH || p.x < 0) p.markedForDeletion = true;
      });
      this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
  }

  private updateFloatingText(dt: number) {
      this.floatingTexts.forEach(t => {
          t.x += t.velocity.x * dt;
          t.y += t.velocity.y * dt;
          t.life -= dt;
      });
      this.floatingTexts = this.floatingTexts.filter(t => t.life > 0);
  }

  private addText(x: number, y: number, text: string, color: string) {
      this.floatingTexts.push({ x, y, text, color, life: 0.8, velocity: {x:0, y:-30}, scale: 1 });
  }

  // --- Rendering ---
  private draw() {
    // Clear
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw Grid (Checkerboard)
    for (let r=0; r<GRID_ROWS; r++) {
        for (let c=0; c<GRID_COLS; c++) {
            const x = GRID_OFFSET_X + c * CELL_SIZE;
            const y = GRID_OFFSET_Y + r * CELL_SIZE;
            
            this.ctx.fillStyle = (r+c)%2===0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.06)';
            this.ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            this.ctx.strokeStyle = 'rgba(255,255,255,0.1)';
            this.ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }

    // Draw Units (From Store)
    const store = useGameStore.getState();
    store.gridUnits.forEach(u => {
        const x = GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE/2;
        const y = GRID_OFFSET_Y + u.row * CELL_SIZE + CELL_SIZE/2;
        
        if (u.isDead) {
            this.ctx.font = '50px Arial';
            this.ctx.globalAlpha = 0.5;
            this.ctx.fillText('🪦', x, y);
            this.ctx.globalAlpha = 1.0;
        } else {
            this.ctx.font = '60px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(u.emoji, x, y);
            
            // Health Bar
            const barWidth = 60;
            const barHeight = 6;
            const hpPct = u.hp / u.maxHp;
            const barX = x - barWidth / 2;
            const barY = y - 40;

            this.ctx.fillStyle = 'red';
            this.ctx.fillRect(barX, barY, barWidth, barHeight);
            this.ctx.fillStyle = 'green';
            this.ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);

            // Energy Bar (Hero)
            if (u.isHero) {
                const ep = (u.energy || 0) / 100;
                this.ctx.fillStyle = 'blue';
                this.ctx.fillRect(barX, barY + 80, barWidth, 4);
                this.ctx.fillStyle = 'cyan';
                this.ctx.fillRect(barX, barY + 80, barWidth * ep, 4);
            }
        }
    });

    // Draw Enemies
    this.enemies.forEach(e => {
        this.ctx.font = '50px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        if (e.frozen > 0) {
            this.ctx.shadowColor = 'cyan';
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.shadowBlur = 0;
        }
        
        this.ctx.fillText(e.emoji, e.x, e.y);
        this.ctx.shadowBlur = 0;
        
        // HP Bar - Centered above enemy
        const barWidth = 50;
        const barHeight = 5;
        const hpPct = e.hp / e.maxHp;
        // Center the bar horizontally relative to enemy X
        const barX = e.x - (barWidth / 2);
        // Position bar above the emoji
        const barY = e.y - 45;

        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);
    });

    // Draw Projectiles
    this.projectiles.forEach(p => {
        this.ctx.font = '30px Arial'; // Smaller font for projectiles
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(p.emoji, p.x, p.y);
    });

    // Texts
    this.floatingTexts.forEach(t => {
        this.ctx.font = `bold ${20 * t.scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = t.color;
        this.ctx.fillText(t.text, t.x, t.y);
    });
  }

  // --- Input ---
  private handleMouseDown = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      
      const c = Math.floor((x - GRID_OFFSET_X) / CELL_SIZE);
      const r = Math.floor((y - GRID_OFFSET_Y) / CELL_SIZE);

      if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) {
          const store = useGameStore.getState();
          const unit = store.gridUnits.find(u => u.row === r && u.col === c);
          if (unit) this.dragUnitId = unit.id;
      }
  };

  private handleMouseMove = (e: MouseEvent) => {
      // Visual feedback only for now
      this.canvas.style.cursor = 'default';
  };

  private handleMouseUp = (e: MouseEvent) => {
      if (this.dragUnitId) {
          const rect = this.canvas.getBoundingClientRect();
          const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
          const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
          
          const c = Math.floor((x - GRID_OFFSET_X) / CELL_SIZE);
          const r = Math.floor((y - GRID_OFFSET_Y) / CELL_SIZE);
          
          if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) {
              useGameStore.getState().moveUnit(this.dragUnitId, r, c);
          }
          this.dragUnitId = null;
      }
  };
}