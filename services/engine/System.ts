
import { GameState } from './GameState';
import { EngineCallbacks } from './index';
import { InputSystem } from './systems/InputSystem';

/**
 * Defines the basic contract for a game system.
 * Each system is responsible for a specific piece of game logic.
 */
export interface System {
  // `args` can include other systems if dependencies are needed (e.g., InspectionSystem needs InputSystem)
  update(dt: number, gameState: GameState, callbacks: EngineCallbacks, ...args: any[]): void;
}
