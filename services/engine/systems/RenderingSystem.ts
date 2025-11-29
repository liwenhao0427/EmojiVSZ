
import { GameState } from '../GameState';
import { Unit, InspectableEntity } from '../../../types';
import { GRID_ROWS, GRID_COLS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';
import { useGameStore } from '../../../store/useGameStore';
import { InputSystem } from './InputSystem';
import { ENEMY_DATA } from '../../../data/enemies';
import { EmojiSpriteCache } from '../utils/EmojiSpriteCache';

interface VisualUnit {
  x: number;
  y: number;
  scale: number;
  hitFlash: number;
  offsetX: number;
  recoil: number;
}

export class RenderingSystem {
  private visualUnits: Map<string, VisualUnit> = new Map();
  private emojiCache: EmojiSpriteCache = new EmojiSpriteCache();
  
  constructor(private ctx: CanvasRenderingContext2D, private inputSystem: InputSystem) {}

  public setUnitHitFlash(unitId: string) {
    const vis = this.visualUnits.get(unitId);
    if (vis) {
      vis.hitFlash = 0.2;
    }
  }

  public update(dt: number) {
    const units = useGameStore.getState().gridUnits;
    const LERP_FACTOR = 1 - Math.pow(0.001, dt);
    const seenIds = new Set<string>();

    units.forEach(u => {
      seenIds.add(u.id);
      
      if (!this.visualUnits.has(u.id)) {
        this.visualUnits.set(u.id, {
          x: GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE / 2,
          y: GRID_OFFSET_Y + u.row * CELL_SIZE + CELL_SIZE / 2,
          scale: 1,
          hitFlash: 0,
          offsetX: 0,
          recoil: 0,
        });
      }

      const vis = this.visualUnits.get(u.id)!;
      if (u.hitFlash && u.hitFlash > 0) {
        vis.hitFlash = u.hitFlash;
        u.hitFlash = 0;
      }
      if (vis.hitFlash > 0) vis.hitFlash -= dt;

      // Recoil logic
      if (u.attackState === 'ATTACKING' && (u.attackPattern === 'SHOOT' || u.attackPattern === 'STREAM')) {
          vis.recoil = -15; 
      }
      vis.recoil += (0 - vis.recoil) * LERP_FACTOR * 3; 

      const isDragging = this.inputSystem.dragUnitId === u.id;

      let lungeOffset = 0;
      if (u.attackPattern === 'THRUST' && u.attackState === 'ATTACKING' && u.attackProgress) {
          const lungeDistance = u.range * 0.6;
          lungeOffset = Math.sin(u.attackProgress * Math.PI) * lungeDistance;
      }

      if (isDragging) {
        vis.x = this.inputSystem.mouseX;
        vis.y = this.inputSystem.mouseY;
        vis.scale += (1.2 - vis.scale) * LERP_FACTOR;
        vis.offsetX += (0 - vis.offsetX) * LERP_FACTOR;
      } else {
        const targetX = GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE / 2;
        const targetY = GRID_OFFSET_Y + u.row * CELL_SIZE + CELL_SIZE / 2;
        vis.x += (targetX - vis.x) * LERP_FACTOR;
        vis.y += (targetY - vis.y) * LERP_FACTOR;
        vis.scale += (1.0 - vis.scale) * LERP_FACTOR;
        vis.offsetX += (lungeOffset - vis.offsetX) * LERP_FACTOR;
      }
    });

    for (const id of this.visualUnits.keys()) {
      if (!seenIds.has(id)) {
        this.visualUnits.delete(id);
      }
    }
  }
  
  public draw(gameState: GameState, inspectedEntity: InspectableEntity) {
    this.drawBackground();

    const { c: hoverC, r: hoverR } = this.inputSystem.getGridPosFromCoords(this.inputSystem.mouseX, this.inputSystem.mouseY);

    this.drawGridHighlights(hoverC, hoverR);

    const store = useGameStore.getState();
    const activeUnits = store.gridUnits.filter(u => u.id !== this.inputSystem.dragUnitId);
    const draggingUnit = store.gridUnits.find(u => u.id === this.inputSystem.dragUnitId);
    
    const hoveredUnit = !this.inputSystem.dragUnitId 
        ? activeUnits.find(u => u.col === hoverC && u.row === hoverR && !u.isDead) 
        : null;

    if (hoveredUnit) {
        this.drawAttackRange(hoveredUnit);
    }

    const sortedUnits = [...activeUnits].sort((a, b) => a.row - b.row);

    sortedUnits.forEach(u => {
        const isHovered = u.id === hoveredUnit?.id;
        this.drawUnit(u, isHovered);
    });

    this.drawEnemies(gameState);
    this.drawProjectiles(gameState);

    if (draggingUnit) this.drawUnit(draggingUnit, true);
    this.drawFloatingTexts(gameState);

    if (inspectedEntity && store.phase === 'COMBAT') {
      const selectedId = 'id' in inspectedEntity.data ? inspectedEntity.data.id : null;
      if (selectedId) this.drawSelection(selectedId, gameState);
    }
  }

  // --- Background: Sky + Grass + Dirt Lanes ---
  private drawBackground() {
      // Sky
      const gradient = this.ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      gradient.addColorStop(0, '#bae6fd'); // Sky 200
      gradient.addColorStop(1, '#7dd3fc'); // Sky 300
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Grass Field
      this.ctx.fillStyle = '#a3e635'; // Lime 400
      const grassY = GRID_OFFSET_Y - 30;
      const grassH = GRID_ROWS * CELL_SIZE + 60;
      // Rounded grass field
      this.ctx.beginPath();
      this.ctx.roundRect(10, grassY, CANVAS_WIDTH - 20, grassH, 30);
      this.ctx.fill();
      // Grass border
      this.ctx.strokeStyle = '#84cc16'; // Lime 500
      this.ctx.lineWidth = 4;
      this.ctx.stroke();
      
      // Dirt Lanes
      for (let r = 0; r < GRID_ROWS; r++) {
          const laneY = GRID_OFFSET_Y + r * CELL_SIZE + 10;
          const laneHeight = CELL_SIZE - 20;
          
          // Main dirt
          this.ctx.fillStyle = '#d97706'; // Amber 600
          this.ctx.beginPath();
          this.ctx.roundRect(40, laneY, CANVAS_WIDTH - 80, laneHeight, 16);
          this.ctx.fill();

          // Inner lighter dirt (Highlight)
          this.ctx.fillStyle = '#f59e0b'; // Amber 500
          this.ctx.beginPath();
          this.ctx.roundRect(40, laneY + 6, CANVAS_WIDTH - 80, laneHeight - 16, 16);
          this.ctx.fill();
      }
  }

  private drawGridHighlights(hoverC: number, hoverR: number) {
    if (this.inputSystem.dragUnitId) {
        // Drop Zones
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                const x = GRID_OFFSET_X + c * CELL_SIZE;
                const y = GRID_OFFSET_Y + r * CELL_SIZE;
                
                const { c: dragC, r: dragR } = this.inputSystem.getGridPosFromCoords(this.inputSystem.mouseX, this.inputSystem.mouseY);
                if (dragC === c && dragR === r) {
                    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    this.ctx.beginPath();
                    this.ctx.roundRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10, 15);
                    this.ctx.fill();
                    
                    this.ctx.strokeStyle = '#ffffff';
                    this.ctx.lineWidth = 4;
                    this.ctx.stroke();
                } else {
                    // Slight highlight for available slots
                    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    this.ctx.lineWidth = 2;
                    this.ctx.beginPath();
                    this.ctx.roundRect(x + 10, y + 10, CELL_SIZE - 20, CELL_SIZE - 20, 15);
                    this.ctx.stroke();
                }
            }
        }
    } else if (hoverC >= 0 && hoverC < GRID_COLS && hoverR >= 0 && hoverR < GRID_ROWS) {
        // Mouse Hover
        const x = GRID_OFFSET_X + hoverC * CELL_SIZE;
        const y = GRID_OFFSET_Y + hoverR * CELL_SIZE;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.beginPath();
        this.ctx.roundRect(x + 5, y + 5, CELL_SIZE - 10, CELL_SIZE - 10, 15);
        this.ctx.fill();
    }
    
    // Danger Line
    this.ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)'; // Red
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([15, 15]);
    this.ctx.beginPath();
    this.ctx.moveTo(GRID_OFFSET_X, GRID_OFFSET_Y - 20);
    this.ctx.lineTo(GRID_OFFSET_X, GRID_OFFSET_Y + GRID_ROWS * CELL_SIZE + 20);
    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  private drawUnit(u: Unit, isHovered: boolean = false) {
    const vis = this.visualUnits.get(u.id);
    if (!vis) return;
    
    const store = useGameStore.getState();
    const stats = store.stats;

    const { x, y, scale, offsetX, recoil } = vis;
    this.ctx.save();
    
    let shakeX = 0, shakeY = 0;
    if (u.isUlting) {
        shakeX = (Math.random() - 0.5) * 6;
        shakeY = (Math.random() - 0.5) * 6;
    }

    this.ctx.translate(x + offsetX + recoil + shakeX, y + shakeY);

    if (!isHovered && !u.isDead && this.inputSystem.dragUnitId !== u.id) {
        const time = performance.now() / 1000;
        const sway = Math.sin(time * 3 + parseInt(u.id, 16));
        this.ctx.scale(1 + sway * 0.02, 1 - sway * 0.02);
    }
    
    this.ctx.scale(scale, scale);

    // Drop Shadow
    this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
    this.ctx.beginPath();
    this.ctx.ellipse(0, 35, 30, 10, 0, 0, Math.PI * 2);
    this.ctx.fill();

    if (u.isUlting) {
        this.ctx.shadowColor = '#facc15'; 
        this.ctx.shadowBlur = 20;
    }

    if (u.isDead) {
      this.ctx.globalAlpha = 0.6;
      this.emojiCache.draw(this.ctx, '🪦', 0, -10, 70);
    } else {
      if (u.isTemp) {
        this.ctx.shadowColor = '#38bdf8'; // Sky blue
        this.ctx.shadowBlur = 15;
      }
      
      this.emojiCache.draw(this.ctx, u.emoji, 0, -10, 70);
      
      this.ctx.globalAlpha = 1.0;
      this.ctx.shadowBlur = 0;

      if (vis.hitFlash > 0) {
        this.ctx.globalCompositeOperation = 'source-atop';
        this.ctx.fillStyle = `rgba(255, 255, 255, 0.8)`;
        this.ctx.beginPath();
        this.ctx.arc(0, -10, 35, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
      }

      // --- Stats Display (SAP Style) ---
      const statY = 35;
      
      // Calculate REAL Damage for Display
      let flatBonus = 0;
      if (u.type === 'MELEE') flatBonus = stats.meleeDmg;
      if (u.type === 'RANGED') flatBonus = stats.rangedDmg;
      if (u.type === 'MAGIC') flatBonus = stats.elementalDmg;
      
      const heroDmgMult = u.isHero ? (1 + (stats.heroDamageMult || 0)) : 1;
      const globalDmgMult = (1 + (stats.damagePercent || 0)) * (1 + (stats.tempDamageMult || 0));
      const finalDamage = Math.round((u.damage + flatBonus) * globalDmgMult * heroDmgMult);

      // Damage (Left, Yellow)
      this.drawStatBadge(-25, statY, finalDamage, '#facc15', '⚔️'); 
      // HP (Right, Red)
      this.drawStatBadge(25, statY, Math.ceil(u.hp), '#f87171', '❤️');

      // Hero Energy Bar
      if (u.isHero) {
        const barW = 60;
        const barH = 8;
        const barY = -55;
        // Bg
        this.ctx.fillStyle = 'rgba(255,255,255,0.6)';
        this.ctx.beginPath();
        this.ctx.roundRect(-barW/2, barY, barW, barH, 4);
        this.ctx.fill();
        
        const maxEnergy = useGameStore.getState().stats.heroMaxEnergy || 100;
        let pct = (u.energy || 0) / maxEnergy;
        let color = '#38bdf8'; // Blue

        if (u.isUlting) {
             const maxDuration = 3.0 + (useGameStore.getState().stats.ult_duration_bonus || 0);
             const remaining = Math.max(0, u.ultTimer || 0);
             pct = remaining / maxDuration;
             color = '#facc15'; // Yellow
        }
        
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.roundRect(-barW/2, barY, barW * pct, barH, 4);
        this.ctx.fill();
        
        // Border
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(-barW/2, barY, barW, barH);
      }
    }
    this.ctx.restore();
  }

  private drawStatBadge(x: number, y: number, value: number, bgColor: string, icon: string) {
      // Circle Bg
      this.ctx.beginPath();
      this.ctx.arc(x, y, 16, 0, Math.PI * 2);
      this.ctx.fillStyle = bgColor;
      this.ctx.fill();
      
      // Outline
      this.ctx.strokeStyle = '#ffffff';
      this.ctx.lineWidth = 3;
      this.ctx.stroke();

      // Value
      this.ctx.fillStyle = '#1e293b'; // Slate 800
      this.ctx.font = `800 14px 'Fredoka', Arial`; // Extra bold
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(Math.floor(value).toString(), x, y + 1);
  }

  private drawEnemies(gameState: GameState) {
    gameState.enemies.forEach(e => {
      let drawX = e.x;
      let drawY = e.y;
      
      this.ctx.save();
      
      if (e.deathTimer && e.deathTimer > 0) {
        const deathProgress = 1 - e.deathTimer / 1.0; 
        this.ctx.globalAlpha = 1 - deathProgress;
        drawY -= deathProgress * CELL_SIZE;
        this.ctx.translate(drawX, drawY);
        this.ctx.rotate(deathProgress * 2); 
      } else {
         const hopOffsetY = Math.abs(Math.sin(performance.now() / 200 + e.id)) * 8;
         drawY -= hopOffsetY;
         this.ctx.translate(drawX, drawY);
      }

      if (e.attackState === 'ATTACKING' && e.attackProgress) {
        const lungeDistance = 40;
        const offset = Math.sin(e.attackProgress * Math.PI) * -lungeDistance;
        this.ctx.translate(offset, 0);
      }
      
      // Shadow
      this.ctx.fillStyle = 'rgba(0,0,0,0.15)';
      this.ctx.beginPath();
      this.ctx.ellipse(0, e.radius, e.radius * 0.9, e.radius * 0.3, 0, 0, Math.PI * 2);
      this.ctx.fill();

      // Body
      this.emojiCache.draw(this.ctx, e.emoji, 0, -10, e.radius * 2.5);

      if (e.hitFlash && e.hitFlash > 0) {
        this.ctx.globalCompositeOperation = 'source-atop';
        this.ctx.fillStyle = 'rgba(255,255,255,0.8)';
        this.ctx.beginPath();
        this.ctx.arc(0, -10, e.radius * 1.2, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
      }
      
      if (e.burnTimer && e.burnTimer > 0) {
          const time = performance.now() / 150;
          const flickerY = Math.sin(time) * 3;
          this.emojiCache.draw(this.ctx, '🔥', 0, -e.radius - 15 + flickerY, 24);
      }
      
      if (!e.deathTimer || e.deathTimer <= 0) {
          const statY = 40;
          // Stats are drawn in a separate pass to avoid scaling with the enemy
          this.ctx.save();
          this.ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
          this.ctx.translate(drawX, drawY); // Manually translate to enemy position
          this.drawStatBadge(-20, statY, e.damage, '#facc15', '');
          this.drawStatBadge(20, statY, Math.ceil(e.hp), '#f87171', '');
          this.ctx.restore();
      }
      
      this.ctx.restore();
    });
  }
  
  private drawAttackRange(u: Unit) {
    if (!u.range || u.range <= 0 || u.isDead) return;

    const vis = this.visualUnits.get(u.id);
    if (!vis) return;
    const { x, y } = vis;

    this.ctx.save();
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 4;
    this.ctx.setLineDash([12, 12]);

    if (u.isHero && u.attackType === 'PENTA_SHOT') {
      const rectY = GRID_OFFSET_Y;
      const rectHeight = GRID_ROWS * CELL_SIZE;
      this.ctx.strokeRect(x - CELL_SIZE / 2, rectY, u.range, rectHeight);
    } else {
        const rectY = GRID_OFFSET_Y + u.row * CELL_SIZE;
        this.ctx.strokeRect(x - CELL_SIZE / 2, rectY, u.range, CELL_SIZE);
    }
    this.ctx.restore();
  }

  private drawSelection(id: string | number, gameState: GameState) {
    let x = 0, y = 0, radius = 40;
    const store = useGameStore.getState();
    
    if (typeof id === 'string') {
      const u = store.gridUnits.find(unit => unit.id === id);
      if (u) {
        x = GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE / 2;
        y = GRID_OFFSET_Y + u.row * CELL_SIZE + CELL_SIZE / 2;
        radius = 50;
      }
    } else {
      const e = gameState.enemies.find(enemy => enemy.id === id);
      if (e) {
        x = e.x;
        y = e.y;
        radius = e.radius + 10;
      }
    }

    if (x !== 0) {
      this.ctx.save();
      this.ctx.strokeStyle = '#facc15'; 
      this.ctx.lineWidth = 5;
      this.ctx.setLineDash([12, 8]);
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();
    }
  }

  private drawProjectiles(gameState: GameState) {
    gameState.projectiles.forEach(p => {
      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      if (p.vx !== 0 || p.vy !== 0) {
        const angle = Math.atan2(p.vy, p.vx);
        this.ctx.rotate(angle);
      }
      
      if(p.emoji) {
        this.emojiCache.draw(this.ctx, p.emoji, 0, 0, 30);
      } else {
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
      }
      this.ctx.restore();
    });
  }

  private drawFloatingTexts(gameState: GameState) {
    gameState.floatingTexts.forEach(t => {
      this.ctx.save();
      this.ctx.font = `900 ${24 * t.scale}px 'Fredoka', Arial`;
      this.ctx.textAlign = 'center';
      
      this.ctx.strokeStyle = 'white';
      this.ctx.lineWidth = 4;
      this.ctx.strokeText(t.text, t.x, t.y);
      
      this.ctx.fillStyle = t.color;
      // Force text color for damage to be readable on light background
      if (t.color === 'white') this.ctx.fillStyle = '#ef4444'; // red for damage
      if (t.color === 'yellow') this.ctx.fillStyle = '#d97706'; // gold
      if (t.color === 'cyan') this.ctx.fillStyle = '#0284c7'; // xp
      
      this.ctx.fillText(t.text, t.x, t.y);
      this.ctx.restore();
    });
  }
}