

import { Unit, Enemy, Projectile, FloatingText, GamePhase, PlayerStats, AmmoBayState } from '../types';
import { GRID_ROWS, GRID_COLS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, CANVAS_WIDTH, CANVAS_HEIGHT, WAVE_CONFIG, ENEMY_TYPES } from '../constants';
import { useGameStore } from '../store/useGameStore';

interface EngineCallbacks {
    onDamagePlayer?: (amount: number) => void; // Kept for visual shake
    onGainLoot?: (xp: number, gold: number) => void;
    onWaveEnd?: () => void;
    onLootGoblinKill?: () => void;
    onTimeUpdate?: (timeLeft: number) => void;
    onGameOver?: () => void;
}

// Internal visual state for smoothing animations
interface VisualUnit {
    x: number;
    y: number;
    scale: number;
    hitFlash: number;
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
  
  // Visual State Map (Separates Logic from Rendering)
  private visualUnits: Map<string, VisualUnit> = new Map();
  
  private waveTime: number = 30; // Default safe value
  private spawnTimer: number = 0;
  
  // Input State
  private dragUnitId: string | null = null;
  private dragStartGrid: { r: number, c: number } | null = null;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private unitCooldowns: Map<string, number> = new Map();

  // Callbacks & Throttling
  private callbacks?: EngineCallbacks;
  private lastTimerUpdate: number = 0;

  constructor(canvas: HTMLCanvasElement, stats?: PlayerStats, callbacks?: EngineCallbacks) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
    this.callbacks = callbacks;
    
    // Bind Input
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  public stop() {
    this.isRunning = false;
    cancelAnimationFrame(this.animationId);
  }

  public startWave(duration: number, wave: number) {
    this.enemies = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.unitCooldowns.clear();
    
    this.waveTime = (duration && duration > 0) ? duration : 30; 
    this.spawnTimer = 2.0; 
    
    // Reset timer throttle
    this.lastTimerUpdate = 0;
    this.callbacks?.onTimeUpdate?.(this.waveTime);

    if (!this.isRunning) {
        this.start();
    }
  }

  public updateAmmo(ammoState: AmmoBayState) { /* No-op */ }
  public updateStats(stats: PlayerStats) { /* Sync if needed */ }

  public updateMouse(x: number, y: number) {
      // Handled by internal listeners
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
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
  }

  private loop = (timestamp: number) => {
    if (!this.isRunning) return;
    
    const dtRaw = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const dt = Math.min(dtRaw, 0.1);

    this.update(dt, timestamp);
    this.draw();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number, timestamp: number) {
    const store = useGameStore.getState();
    
    // 1. Visual Interpolation (Runs in all phases for smooth drag)
    this.updateGridVisuals(dt, store.gridUnits);

    if (store.phase !== GamePhase.COMBAT) return;

    // 2. Logic Updates
    this.waveTime -= dt;

    if (this.waveTime <= 0) {
        this.waveTime = 0;
        this.enemies = [];
        this.projectiles = [];
        this.floatingTexts = [];
        
        // Let Store handle logic reset (temp units, energy)
        store.resetWaveState();

        this.callbacks?.onWaveEnd?.();
        return; 
    }

    this.spawnEnemies(dt, store.stats.wave);
    this.updateUnits(dt, store.gridUnits);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateFloatingText(dt); 

    if (timestamp - this.lastTimerUpdate > 1000) {
        this.callbacks?.onTimeUpdate?.(Math.ceil(Math.max(0, this.waveTime)));
        this.lastTimerUpdate = timestamp;
    }
  }

  // --- Visual Interpolation ---
  private updateGridVisuals(dt: number, units: Unit[]) {
      const LERP_FACTOR = 1 - Math.pow(0.001, dt); 
      const seenIds = new Set<string>();

      units.forEach(u => {
          seenIds.add(u.id);
          
          if (!this.visualUnits.has(u.id)) {
              this.visualUnits.set(u.id, {
                  x: GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE/2,
                  y: GRID_OFFSET_Y + u.row * CELL_SIZE + CELL_SIZE/2,
                  scale: 1,
                  hitFlash: 0
              });
          }

          const vis = this.visualUnits.get(u.id)!;
          if (vis.hitFlash > 0) vis.hitFlash -= dt;

          const isDragging = this.dragUnitId === u.id;

          if (isDragging) {
              // Strictly follow mouse when dragging
              vis.x = this.mouseX;
              vis.y = this.mouseY;
              vis.scale = vis.scale + (1.15 - vis.scale) * LERP_FACTOR;
          } else {
              // Fly to grid position
              const targetX = GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE/2;
              const targetY = GRID_OFFSET_Y + u.row * CELL_SIZE + CELL_SIZE/2;
              vis.x += (targetX - vis.x) * LERP_FACTOR;
              vis.y += (targetY - vis.y) * LERP_FACTOR;
              vis.scale += (1.0 - vis.scale) * LERP_FACTOR;
          }
      });

      // Cleanup
      for (const id of this.visualUnits.keys()) {
          if (!seenIds.has(id)) {
              this.visualUnits.delete(id);
          }
      }
  }

  private spawnEnemies(dt: number, wave: number) {
      const config = WAVE_CONFIG.find(w => w.wave === wave) || WAVE_CONFIG[WAVE_CONFIG.length-1];
      if (!config) return;

      if (this.waveTime > 0) {
          this.spawnTimer -= dt;
          if (this.spawnTimer <= 0) {
              this.spawnTimer = config.interval;
              const row = Math.floor(Math.random() * GRID_ROWS);
              const typeId = config.enemies[Math.floor(Math.random() * config.enemies.length)];
              const typeData = ENEMY_TYPES.find(e => e.id === typeId) || ENEMY_TYPES[0];

              this.enemies.push({
                  id: Math.random(),
                  x: CANVAS_WIDTH + 50,
                  y: GRID_OFFSET_Y + (row * CELL_SIZE) + (CELL_SIZE/2),
                  radius: 40,
                  markedForDeletion: false,
                  hp: typeData.hp * (1 + (wave * 0.2)),
                  maxHp: typeData.hp,
                  speed: typeData.speed,
                  emoji: typeData.emoji,
                  type: typeData.type as any,
                  damage: typeData.damage,
                  row: row,
                  attackTimer: 0,
                  isAttacking: false,
                  frozen: 0,
                  hitFlash: 0
              });
          }
      }
  }

  private updateUnits(dt: number, units: Unit[]) {
      const store = useGameStore.getState();
      units.forEach(u => {
          if (u.isDead || this.dragUnitId === u.id) return;

          if (u.isHero) {
              store.updateHeroEnergy(5 * dt);
              if (u.energy && u.energy >= 100) {
                  this.triggerUltimate(u);
                  store.updateHeroEnergy(-100); 
              }
          }

          let cd = this.unitCooldowns.get(u.id) || 0;
          if (cd > 0) {
              this.unitCooldowns.set(u.id, cd - dt);
              return;
          }

          // Targeting logic
          let validEnemies = this.enemies.filter(e => e.row === u.row && e.x > (GRID_OFFSET_X + u.col * CELL_SIZE));
          if (u.type === 'MAGIC' || u.range > 1500) validEnemies = this.enemies;

          const unitX = GRID_OFFSET_X + (u.col * CELL_SIZE) + CELL_SIZE/2;
          const target = validEnemies.find(e => Math.abs(e.x - unitX) <= u.range);

          if (target) {
              this.fireProjectile(u, unitX, GRID_OFFSET_Y + (u.row * CELL_SIZE) + CELL_SIZE/2, target);
              const buff = 1 + store.stats.tempAttackSpeedMult + (store.stats.attackSpeed / 100);
              this.unitCooldowns.set(u.id, u.maxCooldown / buff);
          }
      });
  }

  private triggerUltimate(hero: Unit) {
      this.addText(CANVAS_WIDTH/2, CANVAS_HEIGHT/2, "ULTIMATE!", 'gold');
      this.enemies.forEach(e => {
          e.hp -= 50;
          e.frozen = 3.0;
          e.hitFlash = 0.5;
          this.addText(e.x, e.y, "-50", 'cyan');
          if (e.hp <= 0) this.killEnemy(e);
      });
  }

  private fireProjectile(u: Unit, x: number, y: number, target: Enemy) {
      const store = useGameStore.getState();
      const damage = u.damage * (1 + store.stats.tempDamageMult + store.stats.damagePercent/100);

      if (u.type === 'MELEE') {
          target.hp -= damage;
          target.x += 40; // Significant Knockback
          target.hitFlash = 0.2; 
          this.addText(target.x, target.y, `-${Math.round(damage)}`, 'white');
          if (target.hp <= 0) this.killEnemy(target);
          return;
      }

      this.projectiles.push({
          id: Math.random(),
          x, y,
          vx: 600, vy: 0,
          damage,
          emoji: u.emoji,
          radius: 10,
          markedForDeletion: false,
          type: u.type === 'MAGIC' ? 'TRACKING' : 'LINEAR',
          targetId: target.id
      });
  }

  private updateEnemies(dt: number) {
      const store = useGameStore.getState();
      
      this.enemies.forEach(e => {
          if (e.hitFlash && e.hitFlash > 0) e.hitFlash -= dt;

          if (e.frozen > 0) {
              e.frozen -= dt;
              return;
          }

          // 1. Move
          e.x -= e.speed * dt;

          // 2. Instant Game Over Check
          if (e.x < GRID_OFFSET_X) {
             this.callbacks?.onGameOver?.();
             store.setPhase(GamePhase.GAME_OVER);
             return; 
          }

          // 3. Combat with Units
          const unitInCell = store.gridUnits.find(u => 
              !u.isDead && u.row === e.row && 
              Math.abs(e.x - (GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE/2)) < (CELL_SIZE/2 + e.radius)
          );

          if (unitInCell) {
              e.attackTimer -= dt;
              if (e.attackTimer <= 0) {
                  // Enemies damage Units (Units have HP)
                  store.damageUnit(unitInCell.id, e.damage);
                  const vis = this.visualUnits.get(unitInCell.id);
                  if (vis) vis.hitFlash = 0.2;
                  this.addText(e.x - 20, e.y, "CRUNCH", 'red');
                  e.attackTimer = 1.0;
              }
              // Stop moving if engaging unit
              e.x += e.speed * dt; 
          } 
      });
      this.enemies = this.enemies.filter(e => !e.markedForDeletion);
  }

  private updateProjectiles(dt: number) {
      this.projectiles.forEach(p => {
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

          const target = this.enemies.find(e => Math.hypot(e.x - p.x, e.y - p.y) < (e.radius + p.radius));
          
          if (target) {
              target.hp -= p.damage;
              target.hitFlash = 0.2;
              this.addText(target.x, target.y, `-${Math.round(p.damage)}`, 'yellow');
              if (target.hp <= 0) this.killEnemy(target);
              p.markedForDeletion = true;
          }
          if (p.x > CANVAS_WIDTH || p.x < 0) p.markedForDeletion = true;
      });
      this.projectiles = this.projectiles.filter(p => !p.markedForDeletion);
  }

  private killEnemy(e: Enemy) {
      if (e.markedForDeletion) return;
      e.markedForDeletion = true;
      
      const isBoss = e.type === 'BOSS';
      const isElite = e.type === 'ELITE';
      
      const xp = isBoss ? 50 : isElite ? 20 : 10;
      const gold = isBoss ? 20 : isElite ? 10 : 5;

      this.callbacks?.onGainLoot?.(xp, gold);

      this.addText(e.x, e.y - 20, `+${xp} XP`, 'cyan');
      this.addText(e.x, e.y - 50, `+${gold} G`, 'yellow');
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
    this.ctx.globalAlpha = 1.0; 
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawGrid();

    const store = useGameStore.getState();
    const activeUnits = store.gridUnits.filter(u => u.id !== this.dragUnitId);
    const draggingUnit = store.gridUnits.find(u => u.id === this.dragUnitId);

    activeUnits.forEach(u => this.drawUnit(u));
    this.drawEnemies(); 
    this.drawProjectiles();

    if (draggingUnit) this.drawUnit(draggingUnit);
    this.drawFloatingTexts();
  }

  private drawGrid() {
    this.ctx.lineWidth = 1;
    for (let r=0; r<GRID_ROWS; r++) {
        for (let c=0; c<GRID_COLS; c++) {
            const x = GRID_OFFSET_X + c * CELL_SIZE;
            const y = GRID_OFFSET_Y + r * CELL_SIZE;
            
            // Highlight drop target if dragging
            if (this.dragUnitId) {
                const dragC = Math.floor((this.mouseX - GRID_OFFSET_X) / CELL_SIZE);
                const dragR = Math.floor((this.mouseY - GRID_OFFSET_Y) / CELL_SIZE);
                if (dragC === c && dragR === r) {
                    this.ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
                    this.ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
                }
            }

            this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
            this.ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
        }
    }
    
    // Danger Zone Line
    this.ctx.strokeStyle = 'red';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.moveTo(GRID_OFFSET_X, 0);
    this.ctx.lineTo(GRID_OFFSET_X, CANVAS_HEIGHT);
    this.ctx.stroke();
  }

  private drawUnit(u: Unit) {
      const vis = this.visualUnits.get(u.id);
      if (!vis) return;

      const { x, y, scale } = vis;
      
      this.ctx.save();
      this.ctx.translate(x, y);
      this.ctx.scale(scale, scale);

      if (u.id === this.dragUnitId) {
          this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
          this.ctx.shadowBlur = 20;
          this.ctx.shadowOffsetY = 10;
      }

      this.ctx.font = '60px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';

      if (u.isDead) {
        this.ctx.globalAlpha = 0.5; 
        this.ctx.fillText('🪦', 0, 0);
      } else {
        if (u.isTemp) {
             this.ctx.shadowColor = 'cyan';
             this.ctx.shadowBlur = 10;
        }

        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = 'white'; 
        this.ctx.fillText(u.emoji, 0, 0);

        if (vis.hitFlash > 0) {
            this.ctx.globalCompositeOperation = 'source-atop';
            this.ctx.fillStyle = `rgba(255, 255, 255, 0.7)`;
            this.ctx.fillText(u.emoji, 0, 0);
            this.ctx.globalCompositeOperation = 'source-over';
        }

        // Unit HP Bar
        const barWidth = 60;
        const barHeight = 6;
        const hpPct = u.hp / u.maxHp;
        
        this.ctx.scale(1/scale, 1/scale); 
        const barX = -barWidth / 2;
        const barY = -40;

        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        this.ctx.fillStyle = 'green';
        this.ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);

        if (u.isHero) {
            const ep = (u.energy || 0) / 100;
            this.ctx.fillStyle = 'blue';
            this.ctx.fillRect(barX, barY + 80, barWidth, 4);
            this.ctx.fillStyle = 'cyan';
            this.ctx.fillRect(barX, barY + 80, barWidth * ep, 4);
        }
      }
      this.ctx.restore();
  }

  private drawEnemies() {
      this.enemies.forEach(e => {
        this.ctx.save();
        this.ctx.translate(e.x, e.y);
        this.ctx.font = '50px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(e.emoji, 0, 0);

        if (e.hitFlash && e.hitFlash > 0) {
            this.ctx.globalCompositeOperation = 'source-atop';
            this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
            this.ctx.fillText(e.emoji, 0, 0);
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        const barWidth = 50;
        const barHeight = 5;
        const hpPct = Math.max(0, e.hp / e.maxHp);
        const barX = -(barWidth / 2);
        const barY = -45;

        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.fillRect(barX, barY, barWidth, barHeight);
        this.ctx.fillStyle = 'red';
        this.ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);

        this.ctx.restore();
      });
  }

  private drawProjectiles() {
      this.projectiles.forEach(p => {
        this.ctx.save();
        this.ctx.globalAlpha = 1.0;
        this.ctx.translate(p.x, p.y);
        
        if (p.vx !== 0 || p.vy !== 0) {
            const angle = Math.atan2(p.vy, p.vx);
            this.ctx.rotate(angle);
        }

        this.ctx.font = '24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(p.emoji, 0, 0);
        this.ctx.restore();
      });
  }

  private drawFloatingTexts() {
      this.floatingTexts.forEach(t => {
        this.ctx.font = `bold ${20 * t.scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = t.color;
        this.ctx.fillText(t.text, t.x, t.y);
      });
  }

  // --- Input Handlers (Modified for Strict Swap) ---
  private handleMouseDown = (e: MouseEvent) => {
      this.updateMouseCoords(e);
      const { c, r } = this.getGridPos(e);

      if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) {
          const store = useGameStore.getState();
          const unit = store.gridUnits.find(u => u.row === r && u.col === c);
          if (unit) {
              this.dragUnitId = unit.id;
              this.dragStartGrid = { r, c };
              const vis = this.visualUnits.get(unit.id);
              if (vis) {
                  vis.scale = 1.15;
              }
          }
      }
  };

  private handleMouseMove = (e: MouseEvent) => {
      this.updateMouseCoords(e);
      if (this.dragUnitId) {
          this.canvas.style.cursor = 'grabbing';
          // NOTE: We do NOT update store.moveUnit here anymore. 
          // We only update mouse coords which update visual position in updateGridVisuals
      } else {
          this.canvas.style.cursor = 'default';
      }
  };

  private handleMouseUp = (e: MouseEvent) => {
      if (this.dragUnitId && this.dragStartGrid) {
          const { c, r } = this.getGridPos(e);
          
          if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) {
              const store = useGameStore.getState();
              // Perform strict swap logic or move
              // The store's moveUnit handles the swap if target is occupied
              store.moveUnit(this.dragUnitId, r, c);
          }
      }

      this.dragUnitId = null;
      this.dragStartGrid = null;
      this.canvas.style.cursor = 'default';
  };

  private updateMouseCoords(e: MouseEvent) {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      this.mouseY = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
  }

  private getGridPos(e: MouseEvent) {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (CANVAS_WIDTH / rect.width);
      const y = (e.clientY - rect.top) * (CANVAS_HEIGHT / rect.height);
      const c = Math.floor((x - GRID_OFFSET_X) / CELL_SIZE);
      const r = Math.floor((y - GRID_OFFSET_Y) / CELL_SIZE);
      return { c, r };
  }
}