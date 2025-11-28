
import { GameState } from '../GameState';
import { System } from '../System';
import { EngineCallbacks } from '../index';
import { FloatingText } from '../../../types';

export class FloatingTextSystem implements System {
  
  update(dt: number, gameState: GameState, callbacks: EngineCallbacks) {
    gameState.floatingTexts.forEach(t => {
      t.x += t.velocity.x * dt;
      t.y += t.velocity.y * dt;
      t.life -= dt;
    });
    gameState.floatingTexts = gameState.floatingTexts.filter(t => t.life > 0);
  }

  public addText(gameState: GameState, x: number, y: number, text: string, color: string) {
    gameState.floatingTexts.push({ x, y, text, color, life: 0.8, velocity: {x:0, y:-30}, scale: 1 });
  }
}
