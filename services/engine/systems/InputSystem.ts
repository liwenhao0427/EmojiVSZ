
import { useGameStore } from '../../../store/useGameStore';
import { CANVAS_WIDTH, CANVAS_HEIGHT, GRID_COLS, GRID_ROWS, CELL_SIZE, GRID_OFFSET_X, GRID_OFFSET_Y } from '../../../constants';
import { InspectionSystem } from './InspectionSystem';

export class InputSystem {
  public mouseX: number = 0;
  public mouseY: number = 0;
  public dragUnitId: string | null = null;
  private dragStartGrid: { r: number, c: number } | null = null;
  private inspectionSystem!: InspectionSystem;
  
  constructor(private canvas: HTMLCanvasElement) {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseup', this.handleMouseUp);
    this.canvas.addEventListener('mouseleave', this.handleMouseUp);
  }

  public setInspectionSystem(inspectionSystem: InspectionSystem) {
    this.inspectionSystem = inspectionSystem;
  }

  public cleanup() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseup', this.handleMouseUp);
    this.canvas.removeEventListener('mouseleave', this.handleMouseUp);
  }

  private handleMouseDown = (e: MouseEvent) => {
    this.updateMouseCoords(e);
    // Delegate inspection logic to the InspectionSystem
    this.inspectionSystem.handleMouseClick(this.mouseX, this.mouseY);
    
    const { c, r } = this.getGridPosFromCoords(this.mouseX, this.mouseY);
    if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) {
      const store = useGameStore.getState();
      const unit = store.gridUnits.find(u => u.row === r && u.col === c);
      if (unit) {
        this.dragUnitId = unit.id;
        this.dragStartGrid = { r, c };
      }
    }
  };

  private handleMouseMove = (e: MouseEvent) => {
    this.updateMouseCoords(e);
    if (this.dragUnitId) {
      this.canvas.style.cursor = 'grabbing';
    } else {
      this.canvas.style.cursor = 'default';
    }
  };

  private handleMouseUp = (e: MouseEvent) => {
    if (this.dragUnitId && this.dragStartGrid) {
      const { c, r } = this.getGridPosFromCoords(this.mouseX, this.mouseY);
      
      if (c >= 0 && c < GRID_COLS && r >= 0 && r < GRID_ROWS) {
        useGameStore.getState().moveUnit(this.dragUnitId, r, c);
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

  public getGridPosFromCoords(x: number, y: number) {
    const c = Math.floor((x - GRID_OFFSET_X) / CELL_SIZE);
    const r = Math.floor((y - GRID_OFFSET_Y) / CELL_SIZE);
    return { c, r };
  }
}
