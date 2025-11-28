
import { Unit, Enemy, Projectile, FloatingText, GamePhase, PlayerStats, AmmoBayState } from '../types';
import { GRID_ROWS, GRID_COLS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, CANVAS_WIDTH, CANVAS_HEIGHT, WAVE_CONFIG, ENEMY_TYPES } from '../constants';
import { useGameStore } from '../store/useGameStore';

interface EngineCallbacks {
    onDamagePlayer?: (amount: number) => void;
    onGainLoot?: (xp: number, gold: number) => void;
    onWaveEnd?: () => void;
    onLootGoblinKill?: () => void;
    onTimeUpdate?: (timeLeft: number) => void;
}

// Internal visual state for smoothing animations
interface VisualUnit {
    x: number;
    y: number;
    scale: number;
    hitFlash: number;
}

// Internal Loot interface
interface Loot {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    value: number;
    type: 'XP' | 'GOLD';
    collected: boolean;
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
  private loot: Loot[] = [];
  
  // Visual State Map (Separates Logic from Rendering)
  private visualUnits: Map<string, VisualUnit> = new Map();
  
  private waveTime: number = 0; // Counts DOWN now
  private spawnTimer: number = 0;
  
  // Input State
  private dragUnitId: string | null = null;
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
    this.loot = []; 
    this.unitCooldowns.clear();
    
    // FIX: Timer counts DOWN
    this.waveTime = duration; 
    this.spawnTimer = 2.0; 
    
    if (!this.isRunning) {
        this.start();
    }
  }

  public updateAmmo(ammoState: AmmoBayState) { /* No-op */ }
  public updateStats(stats: PlayerStats) { /* Sync if needed */ }

  public updateMouse(x: number, y: number) {
      // Handled by internal listeners, but kept for interface compatibility
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
    const dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;
    const safeDt = Math.min(dt, 0.1);

    this.update(safeDt, timestamp);
    this.draw();

    this.animationId = requestAnimationFrame(this.loop);
  };

  private update(dt: number, timestamp: number) {
    const store = useGameStore.getState();
    
    // 1. Visual Interpolation (Runs in all phases for smooth drag)
    this.updateGridVisuals(dt, store.gridUnits);

    if (store.phase !== GamePhase.COMBAT) return;

    // 2. Logic Updates - Timer Countdown
    this.waveTime -= dt;
    if (this.waveTime < 0) this.waveTime = 0;

    this.spawnEnemies(dt, store.stats.wave);
    this.updateUnits(dt, store.gridUnits);
    this.updateEnemies(dt);
    this.updateProjectiles(dt);
    this.updateLoot(dt); // FIX: Hero targeting
    this.updateFloatingText(dt); // FIX: Cleanup

    // Throttled Timer Update (Prevent React flooding)
    if (timestamp - this.lastTimerUpdate > 1000) {
        this.callbacks?.onTimeUpdate?.(Math.ceil(this.waveTime));
        this.lastTimerUpdate = timestamp;
    }

    // End Conditions
    if (this.enemies.some(e => e.x < 0)) {
        store.setPhase(GamePhase.GAME_OVER);
        this.stop();
        return;
    }

    // Wave End: Time is up AND no enemies left
    if (this.waveTime <= 0 && this.enemies.length === 0) {
        store.resetWaveState(); 
        this.enemies = [];
        this.projectiles = [];
        this.loot = [];
        this.callbacks?.onWaveEnd?.();
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
          
          // Flash Decay
          if (vis.hitFlash > 0) vis.hitFlash -= dt;

          const isDragging = this.dragUnitId === u.id;

          if (isDragging) {
              vis.x = this.mouseX;
              vis.y = this.mouseY;
              vis.scale = vis.scale + (1.15 - vis.scale) * LERP_FACTOR;
          } else {
              const targetX = GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE/2;
              const targetY = GRID_OFFSET_Y + u.row * CELL_SIZE + CELL_SIZE/2;
              vis.x += (targetX - vis.x) * LERP_FACTOR;
              vis.y += (targetY - vis.y) * LERP_FACTOR;
              vis.scale += (1.0 - vis.scale) * LERP_FACTOR;
          }
      });

      for (const id of this.visualUnits.keys()) {
          if (!seenIds.has(id)) {
              this.visualUnits.delete(id);
          }
      }
  }

  // --- FIX: Optimized Loot Logic (Target Hero) ---
  private updateLoot(dt: number) {
      let totalXp = 0;
      let totalGold = 0;
      
      const store = useGameStore.getState();
      const hero = store.gridUnits.find(u => u.isHero && !u.isDead);
      
      // Get Hero Visual Position
      let targetX = 0;
      let targetY = 0;
      let hasTarget = false;

      if (hero) {
          const vis = this.visualUnits.get(hero.id);
          if (vis) {
              targetX = vis.x;
              targetY = vis.y;
              hasTarget = true;
          }
      }

      this.loot.forEach(l => {
          if (l.collected) return;

          // Basic Physics
          l.x += l.vx * dt;
          l.y += l.vy * dt;
          l.vx *= 0.95; // Friction
          l.vy *= 0.95;

          if (hasTarget) {
              const dx = targetX - l.x;
              const dy = targetY - l.y;
              const dist = Math.hypot(dx, dy);

              // Magnet Logic
              if (dist < 1000) { // Global pull
                  const speed = 1200; // Very fast pull
                  l.vx += (dx / dist) * speed * dt;
                  l.vy += (dy / dist) * speed * dt;
                  
                  if (dist < 30) {
                      l.collected = true;
                      if (l.type === 'XP') totalXp += l.value;
                      else totalGold += l.value;
                  }
              }
          }
      });

      this.loot = this.loot.filter(l => !l.collected);

      if (totalXp > 0 || totalGold > 0) {
          this.callbacks?.onGainLoot?.(totalXp, totalGold);
      }
  }

  private spawnEnemies(dt: number, wave: number) {
      const config = WAVE_CONFIG.find(w => w.wave === wave) || WAVE_CONFIG[WAVE_CONFIG.length-1];
      if (!config) return;

      // Spawn as long as time remains (Countdown logic)
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

          let validEnemies = this.enemies.filter(e => e.row === u.row && e.x > (GRID_OFFSET_X + u.col * CELL_SIZE));
          if (u.type === 'MAGIC' || u.range > 1500) validEnemies = this.enemies;

          const unitX = GRID_OFFSET_X + (u.col * CELL_SIZE) + CELL_SIZE/2;
          const target = validEnemies.find(e => Math.abs(e.x - unitX) <= u.range);

          if (target) {
              this.fireProjectile(u, unitX, GRID_OFFSET_Y + (u.row * CELL_SIZE) + CELL_SIZE/2, target);
              const buff = 1 + store.stats.tempAttackSpeedMult;
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
      const damage = u.damage * (1 + store.stats.tempDamageMult);

      if (u.type === 'MELEE') {
          target.hp -= damage;
          target.x += 30; // Knockback
          target.hitFlash = 0.2; // Visual flash
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

          const unitInCell = store.gridUnits.find(u => 
              !u.isDead && u.row === e.row && 
              Math.abs(e.x - (GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE/2)) < (CELL_SIZE/2 + e.radius)
          );

          if (unitInCell) {
              e.attackTimer -= dt;
              if (e.attackTimer <= 0) {
                  store.damageUnit(unitInCell.id, e.damage);
                  const vis = this.visualUnits.get(unitInCell.id);
                  if (vis) vis.hitFlash = 0.2;
                  this.addText(e.x - 20, e.y, "CRUNCH", 'red');
                  e.attackTimer = 1.0;
              }
          } else {
              e.x -= e.speed * dt;
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
      e.markedForDeletion = true;
      for(let i=0; i<3; i++) {
          this.loot.push({
              id: Math.random(),
              x: e.x,
              y: e.y,
              vx: (Math.random() - 0.5) * 300,
              vy: (Math.random() - 0.5) * 300,
              value: 10,
              type: Math.random() > 0.8 ? 'GOLD' : 'XP',
              collected: false
          });
      }
  }

  private updateFloatingText(dt: number) {
      this.floatingTexts.forEach(t => {
          t.x += t.velocity.x * dt;
          t.y += t.velocity.y * dt;
          t.life -= dt;
      });
      // FIX: Strict Cleanup
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
    this.drawEnemies(); // Fixed Draw Logic
    this.drawProjectiles();
    this.drawLootBatched();

    if (draggingUnit) this.drawUnit(draggingUnit);
    this.drawFloatingTexts();
  }

  private drawGrid() {
    this.ctx.lineWidth = 1;
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
  }

  // --- FIX: 3-Step Draw for Units (Ghosting Fix) ---
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
        this.ctx.globalAlpha = 1.0; 
      } else {
        // 1. BASE DRAW (Always Opaque)
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = 'white'; // Prevent color pollution
        this.ctx.fillText(u.emoji, 0, 0);

        // 2. HIT FLASH OVERLAY
        if (vis.hitFlash > 0) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'source-atop';
            this.ctx.fillStyle = `rgba(255, 255, 255, 0.6)`;
            this.ctx.fillText(u.emoji, 0, 0);
            this.ctx.restore();
            // Reset composite is handled by restore, but explicitly safe:
            this.ctx.globalCompositeOperation = 'source-over';
        }

        // 3. UI / BARS
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

  // --- FIX: 3-Step Draw for Enemies (Ghosting Fix) ---
  private drawEnemies() {
      this.enemies.forEach(e => {
        this.ctx.save();
        
        this.ctx.translate(e.x, e.y);
        this.ctx.font = '50px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        
        if (e.frozen > 0) {
            this.ctx.shadowColor = 'cyan';
            this.ctx.shadowBlur = 10;
        } else {
            this.ctx.shadowBlur = 0;
        }
        
        // 1. BASE DRAW (Always Opaque)
        this.ctx.globalAlpha = 1.0;
        this.ctx.fillStyle = 'white';
        this.ctx.fillText(e.emoji, 0, 0);

        // 2. HIT FLASH OVERLAY
        if (e.hitFlash && e.hitFlash > 0) {
            this.ctx.save();
            this.ctx.globalCompositeOperation = 'source-atop';
            this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
            this.ctx.fillText(e.emoji, 0, 0);
            this.ctx.restore();
            this.ctx.globalCompositeOperation = 'source-over';
        }
        
        this.ctx.shadowBlur = 0;
        
        // 3. HP Bar
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

  private drawLootBatched() {
      if (this.loot.length === 0) return;

      this.ctx.save();
      this.ctx.shadowColor = 'gold';
      this.ctx.shadowBlur = 10; 
      this.ctx.fillStyle = '#fcd34d'; 

      this.ctx.beginPath();
      for (const l of this.loot) {
          this.ctx.moveTo(l.x + 5, l.y); 
          this.ctx.arc(l.x, l.y, 5, 0, Math.PI * 2);
      }
      this.ctx.fill(); 
      this.ctx.restore();
  }

  private drawProjectiles() {
      this.projectiles.forEach(p => {
        this.ctx.font = '30px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(p.emoji, p.x, p.y);
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

  // --- Input Handlers ---
  private handleMouseDown = (e: MouseEvent) => {
      this.updateMouseCoords(e);
      const { c, r } = this.getGridPos(e);

      if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) {
          const store = useGameStore.getState();
          const unit = store.gridUnits.find(u => u.row === r && u.col === c);
          if (unit) {
              this.dragUnitId = unit.id;
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
          const { c, r } = this.getGridPos(e);

          if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) {
              const store = useGameStore.getState();
              const unit = store.gridUnits.find(u => u.id === this.dragUnitId);
              
              if (unit && (unit.row !== r || unit.col !== c)) {
                  store.moveUnit(this.dragUnitId, r, c);
              }
          }
      } else {
          this.canvas.style.cursor = 'default';
      }
  };

  private handleMouseUp = (e: MouseEvent) => {
      this.dragUnitId = null;
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
