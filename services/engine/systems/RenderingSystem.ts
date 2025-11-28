
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
}

export class RenderingSystem {
  private visualUnits: Map<string, VisualUnit> = new Map();
  // 1. 初始化缓存工具
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
        });
      }

      const vis = this.visualUnits.get(u.id)!;
      if (u.hitFlash && u.hitFlash > 0) {
        vis.hitFlash = u.hitFlash;
        u.hitFlash = 0;
      }
      if (vis.hitFlash > 0) vis.hitFlash -= dt;

      const isDragging = this.inputSystem.dragUnitId === u.id;

      let lungeOffset = 0;
      if (u.attackPattern === 'THRUST' && u.attackState === 'ATTACKING' && u.attackProgress) {
          const lungeDistance = u.range * 0.5;
          lungeOffset = Math.sin(u.attackProgress * Math.PI) * lungeDistance;
      }

      if (isDragging) {
        vis.x = this.inputSystem.mouseX;
        vis.y = this.inputSystem.mouseY;
        vis.scale += (1.15 - vis.scale) * LERP_FACTOR;
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
    this.ctx.globalAlpha = 1.0;
    this.ctx.fillStyle = '#0f172a';
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 计算当前悬停的网格坐标
    const { c: hoverC, r: hoverR } = this.inputSystem.getGridPosFromCoords(this.inputSystem.mouseX, this.inputSystem.mouseY);

    this.drawGrid(hoverC, hoverR);

    const store = useGameStore.getState();
    const activeUnits = store.gridUnits.filter(u => u.id !== this.inputSystem.dragUnitId);
    const draggingUnit = store.gridUnits.find(u => u.id === this.inputSystem.dragUnitId);
    
    // 查找当前悬停的单位 (非拖拽中)
    const hoveredUnit = !this.inputSystem.dragUnitId 
        ? activeUnits.find(u => u.col === hoverC && u.row === hoverR && !u.isDead) 
        : null;

    // 绘制攻击范围 (位于单位下方，网格上方)
    if (hoveredUnit) {
        this.drawAttackRange(hoveredUnit);
    }

    // 绘制单位
    activeUnits.forEach(u => {
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

  private drawAttackRange(u: Unit) {
    if (!u.range || u.range <= 0 || u.isDead) return;

    const vis = this.visualUnits.get(u.id);
    if (!vis) return;

    const { x, y } = vis;

    this.ctx.save();

    // 呼吸效果
    const time = performance.now() / 1000;
    const alpha = 0.15 + Math.sin(time * 5) * 0.05;
    this.ctx.fillStyle = `rgba(239, 68, 68, ${alpha})`;
    this.ctx.strokeStyle = `rgba(239, 68, 68, ${alpha * 2 + 0.2})`;
    this.ctx.lineWidth = 2;

    const isGlobal = (u.isHero && u.attackType === 'TRACKING') || u.type === 'MAGIC' || u.range > 1500;

    if (isGlobal) {
      // --- 圆形：用于追踪、魔法或全屏攻击 ---
      this.ctx.beginPath();
      this.ctx.arc(x, y, u.range, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();
      if (u.range > 1500) {
        this.ctx.font = '12px monospace';
        this.ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
        this.ctx.textAlign = 'center';
        this.ctx.fillText("GLOBAL RANGE", x, y - 40);
      }
    } else if (u.isHero && u.attackType === 'TRI_SHOT') {
      // --- 3行矩形：用于英雄三向射击 ---
      const startRow = Math.max(0, u.row - 1);
      const endRow = Math.min(GRID_ROWS - 1, u.row + 1);
      const rectY = GRID_OFFSET_Y + startRow * CELL_SIZE;
      const rectHeight = (endRow - startRow + 1) * CELL_SIZE;
      this.ctx.fillRect(x - CELL_SIZE / 2, rectY, u.range, rectHeight);
      this.ctx.strokeRect(x - CELL_SIZE / 2, rectY, u.range, rectHeight);
    } else if (u.isHero && u.attackType === 'PENTA_SHOT') {
      // --- 5行矩形：用于英雄五向射击 ---
      const rectY = GRID_OFFSET_Y;
      const rectHeight = GRID_ROWS * CELL_SIZE;
      this.ctx.fillRect(x - CELL_SIZE / 2, rectY, u.range, rectHeight);
      this.ctx.strokeRect(x - CELL_SIZE / 2, rectY, u.range, rectHeight);
    } else {
      // --- 单行攻击模式 ---
      if (u.attackPattern === 'SWING') {
        // 扇形：用于挥砍
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.arc(x, y, u.range, -Math.PI / 4, Math.PI / 4);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
      } else {
        // 矩形：用于直线射击或突刺
        const rectY = GRID_OFFSET_Y + u.row * CELL_SIZE;
        this.ctx.fillRect(x - CELL_SIZE / 2, rectY, u.range, CELL_SIZE);
        this.ctx.strokeRect(x - CELL_SIZE / 2, rectY, u.range, CELL_SIZE);
      }
    }

    this.ctx.restore();
  }

  private drawGrid(hoverC: number, hoverR: number) {
    this.ctx.lineWidth = 1;
    for (let r = 0; r < GRID_ROWS; r++) {
      for (let c = 0; c < GRID_COLS; c++) {
        const x = GRID_OFFSET_X + c * CELL_SIZE;
        const y = GRID_OFFSET_Y + r * CELL_SIZE;
        
        // 拖拽高亮 (蓝色)
        if (this.inputSystem.dragUnitId) {
          const { c: dragC, r: dragR } = this.inputSystem.getGridPosFromCoords(this.inputSystem.mouseX, this.inputSystem.mouseY);
          if (dragC === c && dragR === r) {
            this.ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
            this.ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
          }
        }
        // 鼠标悬停高亮 (白色) - 仅在非拖拽状态下
        else if (hoverC === c && hoverR === r) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
            
            // 绘制边框高亮
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.strokeRect(x, y, CELL_SIZE, CELL_SIZE);
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

  private drawUnit(u: Unit, isHovered: boolean = false) {
    const vis = this.visualUnits.get(u.id);
    if (!vis) return;

    const { x, y, scale, offsetX } = vis;
    this.ctx.save();
    this.ctx.translate(x + offsetX, y);
    this.ctx.scale(scale, scale);

    if (u.id === this.inputSystem.dragUnitId) {
      this.ctx.shadowColor = 'rgba(0,0,0,0.5)';
      this.ctx.shadowBlur = 20;
      this.ctx.shadowOffsetY = 10;
    } else if (isHovered) {
      // 单位悬停高亮效果
      this.ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
      this.ctx.shadowBlur = 15;
    }

    if (u.attackPattern === 'SWING' && u.attackState === 'ATTACKING' && u.attackProgress) {
        this.ctx.save();
        this.ctx.globalAlpha = 0.7 * Math.sin(u.attackProgress * Math.PI);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.beginPath();
        this.ctx.moveTo(0, 0);
        this.ctx.arc(0, 0, u.range, -Math.PI / 4, Math.PI / 4, false);
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.restore();
    }
    
    if (u.state === 'ARMING') this.ctx.globalAlpha = 0.5 + Math.sin(performance.now() / 100) * 0.2;
    else this.ctx.globalAlpha = 1.0;

    if (u.isDead) {
      this.ctx.globalAlpha = 0.5;
      // 墓碑也可以缓存
      this.emojiCache.draw(this.ctx, '🪦', 0, 0, 60);
    } else {
      if (u.isTemp) {
        this.ctx.shadowColor = 'cyan';
        this.ctx.shadowBlur = 10;
      }
      
      // 使用缓存绘制单位 Emoji
      this.emojiCache.draw(this.ctx, u.emoji, 0, 0, 60);
      
      this.ctx.globalAlpha = 1.0;

      if (vis.hitFlash > 0) {
        this.ctx.globalCompositeOperation = 'source-atop';
        this.ctx.fillStyle = `rgba(255, 255, 255, 0.7)`;
        // 闪白效果目前还是用文字绘制遮罩比较方便
        this.ctx.font = '60px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(u.emoji, 0, 0);
        this.ctx.globalCompositeOperation = 'source-over';
      }

      const barWidth = 60;
      const barHeight = 6;
      const hpPct = u.hp / u.maxHp;
      
      this.ctx.scale(1 / scale, 1 / scale);
      const barX = -barWidth / 2;
      const barY = -40;

      this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this.ctx.fillRect(barX, barY, barWidth, barHeight);
      this.ctx.fillStyle = 'red';
      this.ctx.fillRect(barX, barY, barWidth, barHeight);
      this.ctx.fillStyle = 'green';
      this.ctx.fillRect(barX, barY, barWidth * hpPct, barHeight);

      if (u.isHero) {
        const maxEnergy = useGameStore.getState().stats.heroMaxEnergy || 100;
        const ep = (u.energy || 0) / maxEnergy;
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
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
      
      // 替换敌人绘制
      if (e.slowTimer && e.slowTimer > 0) {
         // 冰冻效果，简单绘制一个底色光圈
         this.ctx.shadowColor = '#67e8f9';
         this.ctx.shadowBlur = 10;
      }

      this.ctx.globalAlpha = 1.0;
      // 使用缓存绘制敌人，大小计算：50px * scale
      this.emojiCache.draw(this.ctx, e.emoji, 0, 0, 50 * scale);

      if (e.hitFlash && e.hitFlash > 0) {
        this.ctx.globalCompositeOperation = 'source-atop';
        this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
        // 闪白处理同上
        this.ctx.font = `${50 * scale}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
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
      
      // 替换子弹绘制
      if(p.emoji) {
        // 使用缓存绘制子弹
        this.emojiCache.draw(this.ctx, p.emoji, 0, 0, 24);
      } else {
        this.ctx.fillStyle = 'yellow';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 8, 0, Math.PI * 2);
        this.ctx.fill();
      }
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
