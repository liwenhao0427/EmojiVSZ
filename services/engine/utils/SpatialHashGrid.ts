
import { CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE } from '../../../constants';

interface Point {
  x: number;
  y: number;
  id: string | number;
  radius: number;
}

/**
 * SpatialHashGrid (物理优化)
 * 
 * 原理：
 * 将屏幕划分为多个格子。只对处于相同格子(或相邻格子)的物体进行碰撞检测。
 * 避免了 O(N^2) 的全场遍历。
 */
export class SpatialHashGrid {
  private cells: Map<string, Point[]> = new Map();
  private cellSize: number;

  constructor(cellSize: number = 120) { // 默认使用游戏 Grid 大小
    this.cellSize = cellSize;
  }

  /**
   * 每帧开始前清空网格
   */
  public clear() {
    this.cells.clear();
  }

  /**
   * 将物体插入网格
   */
  public insert(obj: Point) {
    // 计算物体覆盖的格子范围 (考虑到物体有半径，可能跨越格子)
    const startX = Math.floor((obj.x - obj.radius) / this.cellSize);
    const endX = Math.floor((obj.x + obj.radius) / this.cellSize);
    const startY = Math.floor((obj.y - obj.radius) / this.cellSize);
    const endY = Math.floor((obj.y + obj.radius) / this.cellSize);

    for (let x = startX; x <= endX; x++) {
      for (let y = startY; y <= endY; y++) {
        const key = `${x},${y}`;
        if (!this.cells.has(key)) {
          this.cells.set(key, []);
        }
        this.cells.get(key)!.push(obj);
      }
    }
  }

  /**
   * 获取某物体附近的潜在碰撞目标
   */
  public retrieve(obj: Point): Point[] {
    const key = `${Math.floor(obj.x / this.cellSize)},${Math.floor(obj.y / this.cellSize)}`;
    // 返回该格子的所有物体，如果没有则返回空数组
    // 优化：此处只返回中心点所在格子的物体。
    // 如果物体很大且跨格，严谨做法是 retrieve 也遍历 startX-endX，
    // 但在子弹打敌人场景中，取中心点通常足够且极快。
    return this.cells.get(key) || [];
  }
}
