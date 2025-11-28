
/**
 * EmojiSpriteCache (渲染优化)
 * 
 * 原理：
 * Canvas 的 ctx.fillText 在绘制复杂 Emoji 时开销很大。
 * 此类将 Emoji 预渲染到微型离屏 Canvas 上。
 * 后续渲染时，直接使用 ctx.drawImage，性能显著提升。
 */
export class EmojiSpriteCache {
  // 缓存池：Key 为 "emoji_size"，Value 为离屏 Canvas
  private cache: Map<string, HTMLCanvasElement> = new Map();

  /**
   * 绘制 Emoji (自动使用缓存)
   * @param ctx 主 Canvas 上下文
   * @param emoji 要绘制的 Emoji 字符串
   * @param x 绘制中心点 X
   * @param y 绘制中心点 Y
   * @param size 字体大小 (px)
   */
  public draw(ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number, size: number) {
    // 1. 生成唯一 Key
    // 为了防止浮点数导致缓存爆炸，将 size 取整
    const intSize = Math.floor(size);
    const key = `${emoji}_${intSize}`;

    let sprite = this.cache.get(key);

    // 2. 如果没有缓存，则创建离屏 Canvas
    if (!sprite) {
      sprite = document.createElement('canvas');
      // 留出一点 padding 防止边缘被裁剪
      const padding = Math.ceil(intSize * 0.2);
      const canvasSize = intSize + padding * 2;
      
      sprite.width = canvasSize;
      sprite.height = canvasSize;

      const sCtx = sprite.getContext('2d');
      if (sCtx) {
        sCtx.font = `${intSize}px Arial`; // 保持字体一致
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.fillStyle = 'white'; // 某些 Emoji 需要颜色，但大多是自身颜色
        // 在离屏 Canvas 中心绘制
        sCtx.fillText(emoji, canvasSize / 2, canvasSize / 2);
      }
      this.cache.set(key, sprite);
    }

    // 3. 将缓存的图片绘制到主 Canvas
    // 注意：drawImage 的坐标是左上角，需要根据宽高偏移回中心
    if (sprite) {
      ctx.drawImage(
        sprite, 
        x - sprite.width / 2, 
        y - sprite.height / 2
      );
    }
  }

  /**
   * 清理缓存 (在场景切换或内存警告时调用)
   */
  public clear() {
    this.cache.clear();
  }
}
