
/**
 * SimpleObjectPool (内存优化)
 * 
 * 原理：
 * 避免频繁 new Object() 和 垃圾回收。
 * 废弃的对象不销毁，而是存入数组，下次需要时直接拿出来重置属性使用。
 */
export class SimpleObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(createFn: () => T, resetFn: (obj: T) => void) {
    this.createFn = createFn;
    this.resetFn = resetFn;
  }

  /**
   * 获取对象 (复用或创建)
   */
  public get(): T {
    if (this.pool.length > 0) {
      const obj = this.pool.pop()!;
      this.resetFn(obj); // 确保拿出的对象是干净的
      return obj;
    }
    return this.createFn();
  }

  /**
   * 回收对象
   */
  public release(obj: T) {
    this.pool.push(obj);
  }

  public get size(): number {
    return this.pool.length;
  }
}
