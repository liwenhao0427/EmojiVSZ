
/**
 * EmojiSpriteCache (渲染优化)
 * 
 * 将 Emoji 预渲染到微型离屏 Canvas 上，并增加白色描边以模仿贴纸风格。
 */
export class EmojiSpriteCache {
  // 缓存池：Key 为 "emoji_size"，Value 为离屏 Canvas
  private cache: Map<string, HTMLCanvasElement> = new Map();

  /**
   * 绘制 Emoji (自动使用缓存)
   */
  public draw(ctx: CanvasRenderingContext2D, emoji: string, x: number, y: number, size: number) {
    const intSize = Math.floor(size);
    const key = `${emoji}_${intSize}`;

    let sprite = this.cache.get(key);

    if (!sprite) {
      sprite = document.createElement('canvas');
      // 留出 padding 供描边使用
      const strokeWidth = Math.max(4, intSize * 0.12); 
      const padding = strokeWidth * 2;
      const canvasSize = intSize + padding * 2;
      
      sprite.width = canvasSize;
      sprite.height = canvasSize;

      const sCtx = sprite.getContext('2d');
      if (sCtx) {
        // 使用 Fredoka 字体确保即使 Emoji 不支持时也有可爱的回退，但在 Canvas 中 emoji 依赖系统字体
        sCtx.font = `${intSize}px 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', sans-serif`; 
        sCtx.textAlign = 'center';
        sCtx.textBaseline = 'middle';
        sCtx.lineJoin = 'round';
        sCtx.miterLimit = 2;

        const cx = canvasSize / 2;
        const cy = canvasSize / 2 + (intSize * 0.1); // 微调垂直居中

        // 绘制白色描边 (Sticker Effect)
        sCtx.strokeStyle = '#ffffff'; 
        sCtx.lineWidth = strokeWidth;
        sCtx.strokeText(emoji, cx, cy);

        // 绘制 Emoji 本体
        sCtx.fillStyle = 'white'; 
        sCtx.fillText(emoji, cx, cy);
      }
      this.cache.set(key, sprite);
    }

    if (sprite) {
      ctx.drawImage(
        sprite, 
        x - sprite.width / 2, 
        y - sprite.height / 2
      );
    }
  }

  public clear() {
    this.cache.clear();
  }
}