
import { System } from '../System';
import { GameState } from '../GameState';
import { EngineCallbacks } from '../index';
import { useGameStore } from '../../../store/useGameStore';
import { GRID_COLS, GRID_ROWS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../../../constants';
import { InspectableEntity, StatsBreakdown, Unit, PlayerStats } from '../../../types';
import { InputSystem } from './InputSystem';

export class InspectionSystem implements System {
  private selectedEntityId: string | number | null = null;
  private lastInspectedId: string | number | null = null;

  constructor(private inputSystem: InputSystem) {}

  public update(dt: number, gameState: GameState, callbacks: EngineCallbacks): void {
    if (!this.selectedEntityId) {
      this.checkInspectionHover(gameState, callbacks);
    } else {
      this.refreshInspectionData(this.selectedEntityId, gameState, callbacks);
    }
  }

  public handleMouseClick(mx: number, my: number) {
    const entity = this.findEntityAt(mx, my, useGameStore.getState(), new GameState());
    
    if (entity) {
      const id = entity.type === 'UNIT' ? entity.data.id : entity.data.id;
      // Toggle lock
      if (this.selectedEntityId === id) {
        this.selectedEntityId = null;
        const hoverEntity = this.findEntityAt(this.inputSystem.mouseX, this.inputSystem.mouseY, useGameStore.getState(), new GameState());
        useGameStore.getState().setInspectedEntity(hoverEntity);
      } else {
        this.selectedEntityId = id;
        useGameStore.getState().setInspectedEntity(entity);
      }
    } else {
      // Clicked empty space -> Unlock
      this.selectedEntityId = null;
      useGameStore.getState().setInspectedEntity(null);
    }
  }

  private checkInspectionHover(gameState: GameState, callbacks: EngineCallbacks) {
    const entity = this.findEntityAt(this.inputSystem.mouseX, this.inputSystem.mouseY, useGameStore.getState(), gameState);
    const currentId = entity ? (entity.type === 'UNIT' ? entity.data.id : entity.data.id) : null;

    if (currentId !== this.lastInspectedId) {
      this.lastInspectedId = currentId as string | number;
      callbacks.onInspect?.(entity);
    }
  }

  private refreshInspectionData(id: string | number, gameState: GameState, callbacks: EngineCallbacks) {
    const store = useGameStore.getState();
    if (typeof id === 'string') {
      const unit = store.gridUnits.find(u => u.id === id);
      if (unit) {
        callbacks.onInspect?.({ type: 'UNIT', data: unit, statsBreakdown: this.getUnitBreakdown(unit, store.stats) });
      } else {
        this.selectedEntityId = null;
        callbacks.onInspect?.(null);
      }
    } else {
      const enemy = gameState.enemies.find(e => e.id === id);
      if (enemy) {
        const breakdown: StatsBreakdown = {
          damage: { base: enemy.damage, bonus: 0, multiplier: 1 },
          cooldown: { base: 1.0, multiplier: 1 }
        };
        callbacks.onInspect?.({ type: 'ENEMY', data: enemy, statsBreakdown: breakdown });
      } else {
        this.selectedEntityId = null;
        callbacks.onInspect?.(null);
      }
    }
  }

  private findEntityAt(mx: number, my: number, store: any, gameState: GameState): InspectableEntity {
    const { stats, gridUnits } = store;
    const { c, r } = this.inputSystem.getGridPosFromCoords(mx, my);

    if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) {
      const unit = gridUnits.find((u: any) => u.row === r && u.col === c);
      if (unit) {
        return { type: 'UNIT', data: unit, statsBreakdown: this.getUnitBreakdown(unit, stats) };
      }
    }

    for (let i = gameState.enemies.length - 1; i >= 0; i--) {
      const e = gameState.enemies[i];
      const dist = Math.hypot(e.x - mx, e.y - my);
      if (dist <= e.radius) {
        const breakdown: StatsBreakdown = {
          damage: { base: e.damage, bonus: 0, multiplier: 1 },
          cooldown: { base: 1.0, multiplier: 1 }
        };
        return { type: 'ENEMY', data: e, statsBreakdown: breakdown };
      }
    }
    
    return null;
  }
  
  private getUnitBreakdown(unit: Unit, stats: PlayerStats): StatsBreakdown {
      const typeBonus = this.getTypeBonus(unit.type, stats);
    
      const globalDmgPct = stats.damagePercent || 0;
      const tempDmgPct = stats.tempDamageMult || 0;
      const heroDmgPct = unit.isHero ? (stats.heroDamageMult || 0) : 0;
      const totalDmgMultiplier = (1 + globalDmgPct) * (1 + tempDmgPct) * (1 + heroDmgPct);
      
      const globalAspdPct = stats.attackSpeed || 0;
      const tempAspdPct = stats.tempAttackSpeedMult || 0;
      const heroAspdPct = unit.isHero ? (stats.heroAttackSpeedMult || 0) : 0;
      const totalCdMultiplier = (1 + globalAspdPct) * (1 + tempAspdPct) * (1 + heroAspdPct);

      return {
          damage: { 
              base: unit.damage, 
              bonus: typeBonus, 
              multiplier: totalDmgMultiplier,
              breakdown: {
                  globalPct: globalDmgPct,
                  tempPct: tempDmgPct,
                  heroPct: heroDmgPct,
              }
          },
          cooldown: { 
              base: unit.maxCooldown, 
              multiplier: totalCdMultiplier,
              breakdown: {
                  globalPct: globalAspdPct,
                  tempPct: tempAspdPct,
                  heroPct: heroAspdPct,
              }
          }
      };
  }

  private getTypeBonus(type: any, stats: any) {
     switch(type) {
         case 'MELEE': return stats.meleeDmg;
         case 'RANGED': return stats.rangedDmg;
         case 'MAGIC': return stats.elementalDmg;
         default: return 0;
     }
  }
}