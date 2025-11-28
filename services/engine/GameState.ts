
import { Enemy, Projectile, FloatingText } from '../../types';

/**
 * A container for the dynamic "live" state of the game world.
 * This object is passed to all systems during the update loop.
 */
export class GameState {
  public enemies: Enemy[] = [];
  public projectiles: Projectile[] = [];
  public floatingTexts: FloatingText[] = [];

  public waveTime: number = 0;
  public waveDuration: number = 30;
  public spawnTimer: number = 0;

  public reset() {
    this.enemies = [];
    this.projectiles = [];
    this.floatingTexts = [];
    this.waveTime = 0;
    this.waveDuration = 30;
    this.spawnTimer = 0;
  }
}
