
import { GameState } from '../GameState';
import { Unit, InspectableEntity } from '../../../types';
import { GRID_ROWS, GRID_COLS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y, CANVAS_WIDTH, CANVAS_HEIGHT } from '../../../constants';
import { useGameStore } from '../../../store/useGameStore';
import { InputSystem } from './InputSystem';
import { ENEMY_DATA } from '../../../data/enemies';

interface VisualUnit {
  x: number;
  y: number;
  scale: number;
  hitFlash: number;
}

export class RenderingSystem {
  private visualUnits: Map<string, VisualUnit> = new Map();
  
  constructor(private ctx: CanvasRenderingContext2D, private inputSystem: InputSystem) {}

  public setUnitHitFlash(unitId: string) {
    const vis = this.visualUnits.get(unitId);
    if (vis) {
      vis.hitFlash = 0.2;
    }
  }

  // Update visual state (interpolation, flashes)
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
          hitFlash: 0
        });
      }

      const vis = this.visualUnits.get(u.id)!;
      if (vis.hitFlash > 0) vis.hitFlash -= dt;

      const isDragging = this.inputSystem.dragUnitId === u.id;

      if (isDragging) {
        vis.x = this.inputSystem.mouseX;
        vis.y = this.inputSystem.mouseY;
        vis.scale += (1.15 - vis.scale) * LERP_FACTOR;
      } else {
        const targetX = GRID_OFFSET_X + u.col * CELL_SIZE + CELL_SIZE / 2;
        const targetY = GRID_OFFSET_Y + u.row * CELL_SIZE + CELL_SIZE / 2;
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
  
  public draw(gameState: GameState, inspectedEntity: InspectableEntity) {
    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    this.drawGrid();

    const store = useGameStore.getState();
    const activeUnits = store.gridUnits.filter(u => u.id !== this.inputSystem.dragUnitId);
    const draggingUnit = store.gridUnits.find(u => u.id === this.inputSystem.dragUnitId);

    activeUnits.forEach(u => this.drawUnit(u));
    this.drawEnemies(gameState);
    this.drawProjectiles(gameState);

    if (draggingUnit) this.drawUnit(draggingUnit);
    this.drawFloatingTexts(gameState);

    if (inspectedEntity && store.phase === 'COMBAT') {
      const selectedId = 'id' in inspectedEntity.data ? inspectedEntity.data.id : null;
      if (selectedId) this.drawSelection(selectedId, gameState);
    }
  }

  private drawGrid() {
    this.ctx.lineWidth = 1;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = GRID_OFFSET_X + c * CELL_SIZE;
        const y = GRID_OFFSET_Y + r * CELL_SIZE;
        
        if (this.inputSystem.dragUnitId) {
          const { c: dragC, r: dragR } = this.inputSystem.getGridPosFromCoords(this.inputSystem.mouseX, this.inputSystem.mouseY);
          if (dragC === c && dragR === r) {
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
            this.ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
          }
        }

        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        this.ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
      }
    }
    
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

    if (u.id === this.inputSystem.dragUnitId) {
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

      const barWidth = 60;
      const barHeight = 6;
      const hpPct = u.hp / u.maxHp;
      
      this.ctx.scale(1 / scale, 1 / scale);
      const barX = -barWidth / 2;
      const barY = -40;

      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(barX, barY, barWidth, barHeight);
      this.ctx.fillStyle = 'green';
      this.ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);

      if (u.isHero) {
        const maxEnergy = useGameStore.getState().stats.heroMaxEnergy || 100;
        const ep = (u.energy || 0) / maxEnergy;
        this.ctx.fillStyle = 'blue';
        this.ctx.fillRect(barX, barY + 80, barWidth, 4);
        this.ctx.fillStyle = 'cyan';
        this.ctx.fillRect(barX, barY + 80, barWidth * ep, 4);
      }
    }
    this.ctx.restore();
  }

  private drawEnemies(gameState: GameState) {
    gameState.enemies.forEach(e => {
      let drawX = e.x;
      if (e.attackState === 'ATTACKING' && e.attackProgress) {
        const lungeDistance = 40;
        const offset = Math.sin(e.attackProgress * Math.PI) * -lungeDistance;
        drawX += offset;
      }
      
      const typeData = ENEMY_DATA[e.name!];
      const scale = typeData ? typeData.scale : 1.0;

      this.ctx.save();
      this.ctx.translate(drawX, e.y);
      this.ctx.font = `${50 * scale}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillStyle = 'white';
      this.ctx.globalAlpha = 1.0;
      this.ctx.fillText(e.emoji, 0, 0);

      if (e.hitFlash && e.hitFlash > 0) {
        this.ctx.globalCompositeOperation = 'source-atop';
        this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
        this.ctx.fillText(e.emoji, 0, 0);
        this.ctx.globalCompositeOperation = 'source-over';
      }
      
      const barWidth = 40 * scale;
      const barHeight = 5;
      const hpPct = Math.max(0, e.hp / e.maxHp);
      const barX = -(barWidth / 2);
      const barY = - (35 * scale);
      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(barX, barY, barWidth, barHeight);
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);
      this.ctx.restore();
    });
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
      this.ctx.strokeStyle = '#22d3ee';
      this.ctx.lineWidth = 3;
      this.ctx.setLineDash([5, 5]);
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.stroke();
      
      const time = performance.now() / 500;
      for (let i = 0; i < 4; i++) {
        const angle = time + (i * Math.PI / 2);
        const tx = x + Math.cos(angle) * radius;
        const ty = y + Math.sin(angle) * radius;
        this.ctx.fillStyle = '#22d3ee';
        this.ctx.beginPath();
        this.ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
      this.ctx.restore();
    }
  }

  private drawProjectiles(gameState: GameState) {
    gameState.projectiles.forEach(p => {
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

  private drawFloatingTexts(gameState: GameState) {
    gameState.floatingTexts.forEach(t => {
      this.ctx.font = `bold ${20 * t.scale}px Arial`;
      this.ctx.textAlign = 'center';
      this.ctx.fillStyle = t.color;
      this.ctx.fillText(t.text, t.x, t.y);
    });
  }
}
