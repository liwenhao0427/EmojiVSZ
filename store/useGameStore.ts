

import { create } from 'zustand';
import { PlayerStats, Unit, GamePhase, DraftOption, AmmoBayState, AmmoItem } from '../types';
import { INITIAL_STATS, HERO_UNIT, GRID_ROWS, GRID_COLS, TEMP_UNIT_POOL } from '../constants';
import { v4 as uuidv4 } from 'uuid';

interface GameStore {
  stats: PlayerStats;
  phase: GamePhase;
  gridUnits: Unit[]; // Flat array of active units
  draftOptions: DraftOption[];
  ammoState: AmmoBayState;
  
  // Actions
  setPhase: (phase: GamePhase) => void;
  initGame: () => void;
  moveUnit: (unitId: string, targetRow: number, targetCol: number) => void;
  addUnit: (item: AmmoItem | Partial<Unit>) => boolean; // Returns true if placed
  moveAmmo: (fromId: string, toId: string) => void;
  applyDraft: (option: DraftOption) => void;
  
  // Engine Sync Actions (Called by GameEngine)
  damageUnit: (unitId: string, amount: number) => void;
  updateHeroEnergy: (amount: number) => void;
  gainXp: (amount: number) => void;
  startNextWave: () => void;
  resetWaveState: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  stats: INITIAL_STATS,
  phase: GamePhase.START,
  gridUnits: [],
  draftOptions: [],
  ammoState: {},

  setPhase: (phase) => set({ phase }),

  initGame: () => {
    // 1. Place Hero in Middle Row (Row 2, Col 0)
    const heroUnit = { 
        ...HERO_UNIT, 
        id: uuidv4(), 
        row: 2, 
        col: 0 
    };
    
    // 2. Place Basic Defenders
    const starters: Unit[] = [heroUnit];
    for(let r=0; r<GRID_ROWS; r++) {
        if(r === 2) continue; // Skip hero row
        starters.push({
             id: uuidv4(),
             name: 'Militia',
             emoji: '🔫',
             type: 'RANGED',
             damage: 8,
             range: 2000, 
             cooldown: 0,
             maxCooldown: 1.5,
             hp: 60,
             maxHp: 60,
             row: r,
             col: 0
        });
    }

    set({
      stats: { ...INITIAL_STATS, wave: 0, gold: 10, heroLevel: 1 }, 
      gridUnits: starters,
      phase: GamePhase.START,
      draftOptions: []
    });
  },

  // Auto-placement logic for shopping/drafting
  addUnit: (data) => {
      const units = [...get().gridUnits];
      
      // Find first empty slot (Column-major or Row-major? Row-major fills back lines first usually)
      // Let's fill by Column first (Front to Back defense) or Row first?
      // Grid is 5 rows x 9 cols. Let's try to fill from Col 0 upwards.
      
      for (let c = 0; c < GRID_COLS; c++) {
          for (let r = 0; r < GRID_ROWS; r++) {
             const occupied = units.find(u => u.row === r && u.col === c);
             if (!occupied) {
                 // Found spot
                 const unitType = 'weaponClass' in data ? data.weaponClass : (data.type || 'RANGED');
                 // AmmoItem uses 'cooldown', Unit uses 'maxCooldown'. Prioritize explicit values.
                 const unitMaxCooldown = 'cooldown' in data && typeof data.cooldown === 'number' 
                    ? data.cooldown 
                    : ((data as Partial<Unit>).maxCooldown || 1.0);

                 const newUnit: Unit = {
                    id: uuidv4(),
                    name: data.name || 'Unit',
                    emoji: data.emoji || '📦',
                    type: unitType,
                    damage: data.damage || 10,
                    range: 1200, // Default range if not specified
                    cooldown: 0,
                    maxCooldown: unitMaxCooldown,
                    hp: 100, // Default HP
                    maxHp: 100,
                    row: r,
                    col: c,
                    isTemp: (data as any).isTemp || false,
                    ...data as any
                 };
                 
                 // If it was an ammo item, map stats
                 if ('weaponClass' in data) {
                     newUnit.hp = 100;
                     newUnit.maxHp = 100;
                     newUnit.type = (data as AmmoItem).weaponClass;
                     newUnit.maxCooldown = (data as AmmoItem).cooldown;
                 }

                 set({ gridUnits: [...units, newUnit] });
                 return true;
             }
          }
      }
      return false; // Grid full
  },

  moveUnit: (unitId, tRow, tCol) => {
    set((state) => {
      if (tRow < 0 || tRow >= GRID_ROWS || tCol < 0 || tCol >= GRID_COLS) return {};

      const units = [...state.gridUnits];
      const unitIndex = units.findIndex(u => u.id === unitId);
      if (unitIndex === -1) return {};

      const unit = units[unitIndex];
      
      // Check if target slot is occupied
      const targetIndex = units.findIndex(u => u.row === tRow && u.col === tCol && u.id !== unitId && !u.isDead);
      
      if (targetIndex !== -1) {
        // Swap logic
        const targetUnit = units[targetIndex];
        // Move target to source pos
        targetUnit.row = unit.row;
        targetUnit.col = unit.col;
        // Move source to target pos
        unit.row = tRow;
        unit.col = tCol;
      } else {
        // Simple move
        unit.row = tRow;
        unit.col = tCol;
      }
      
      return { gridUnits: units };
    });
  },

  moveAmmo: (fromId, toId) => { /* Deprecated */ },

  damageUnit: (unitId, amount) => {
    set((state) => {
      const units = state.gridUnits.map(u => {
        if (u.id !== unitId) return u;
        const newHp = u.hp - amount;
        return { ...u, hp: newHp, isDead: newHp <= 0 };
      });
      return { gridUnits: units };
    });
  },

  updateHeroEnergy: (amount) => {
    set((state) => {
      const units = state.gridUnits.map(u => {
        if (!u.isHero) return u;
        return { ...u, energy: Math.min(100, (u.energy || 0) + amount) };
      });
      return { gridUnits: units };
    });
  },

  gainXp: (amount) => {
      set(state => ({
          stats: { ...state.stats, heroXp: state.stats.heroXp + amount }
      }));
  },

  startNextWave: () => {
      set(state => {
          // RESET LOGIC: Reset Level and XP every wave to build fresh synergies
          const resetStats = {
              ...state.stats,
              heroLevel: 1,
              heroXp: 0,
              heroMaxXp: 100,
              level: 1, // Sync with heroLevel
              xp: 0,
              maxXp: 100,
              wave: state.stats.wave + 1
          };

          return {
              stats: resetStats,
              phase: GamePhase.COMBAT
          };
      });
  },

  resetWaveState: () => {
      set(state => {
          // 1. Remove Temporary Units
          // 2. Revive permanent units
          const nextUnits = state.gridUnits
            .filter(u => !u.isTemp)
            .map(u => ({ ...u, hp: u.maxHp, isDead: false, energy: 0 }));

          // 3. Reset Hero Buffs
          const nextStats = {
              ...state.stats,
              tempDamageMult: 0,
              tempAttackSpeedMult: 0
          };

          return {
              gridUnits: nextUnits,
              stats: nextStats,
              draftOptions: [], 
              phase: GamePhase.SHOP
          };
      });
  },

  applyDraft: (option) => {
      set(state => {
          const nextState: Partial<GameStore> = {}; 

          if (option.type === 'TEMP_UNIT') {
             // Logic handled by addUnit, but here we need to insert manually into state to be safe or call get().addUnit
             // Since we are in set(), we can call get().addUnit? No, better duplicate logic or keep simple.
             // We can just use the addUnit logic logic here roughly:
             const units = [...state.gridUnits];
             const data = option.data as Partial<Unit>;
             
             // Find empty slot
             let placed = false;
             for (let c = 0; c < GRID_COLS; c++) {
                for (let r = 0; r < GRID_ROWS; r++) {
                    if (!units.find(u => u.row === r && u.col === c)) {
                        units.push({
                             id: uuidv4(),
                             name: data.name || 'Merc',
                             emoji: data.emoji || '🤠',
                             type: data.type || 'RANGED',
                             damage: data.damage || 20,
                             range: data.range || 1200,
                             cooldown: 0,
                             maxCooldown: data.maxCooldown || 1.0,
                             hp: data.hp || 100,
                             maxHp: data.maxHp || 100,
                             row: r, col: c,
                             isTemp: true // Force temp
                        });
                        placed = true;
                        break;
                    }
                }
                if (placed) break;
             }
             nextState.gridUnits = units;
          } else if (option.type === 'TEMP_BUFF') {
              const buff = option.data as { damage?: number, attackSpeed?: number };
              nextState.stats = { 
                  ...state.stats, 
                  tempDamageMult: state.stats.tempDamageMult + (buff.damage || 0),
                  tempAttackSpeedMult: state.stats.tempAttackSpeedMult + (buff.attackSpeed || 0)
              };
          }
          return nextState;
      });
  }
}));
