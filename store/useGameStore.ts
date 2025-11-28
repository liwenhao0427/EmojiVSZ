
import { create } from 'zustand';
import { PlayerStats, Unit, GamePhase, DraftOption, AmmoBayState } from '../types';
import { INITIAL_STATS, HERO_UNIT, GRID_ROWS, GRID_COLS, MERCENARY_POOL } from '../constants';
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
    
    // 2. Place Basic Defenders in other rows (Col 0)
    const starters: Unit[] = [heroUnit];
    for(let r=0; r<GRID_ROWS; r++) {
        if(r === 2) continue; // Skip hero row
        starters.push({
             id: uuidv4(),
             name: 'Militia',
             emoji: '🔫',
             type: 'RANGED',
             damage: 8,
             range: 2000, // Full map range for starters
             cooldown: 0,
             maxCooldown: 1.5,
             hp: 60,
             maxHp: 60,
             row: r,
             col: 0
        });
    }

    set({
      stats: { ...INITIAL_STATS, wave: 0, gold: 0, hp: 100, maxHp: 100 }, // Wave 0 implies game hasn't started wave 1
      gridUnits: starters,
      phase: GamePhase.START,
      draftOptions: []
    });
  },

  moveUnit: (unitId, tRow, tCol) => {
    set((state) => {
      // Bounds check
      if (tRow < 0 || tRow >= GRID_ROWS || tCol < 0 || tCol >= GRID_COLS) return {};

      const units = [...state.gridUnits];
      const unitIndex = units.findIndex(u => u.id === unitId);
      if (unitIndex === -1) return {};

      const unit = units[unitIndex];
      
      // Check if target slot is occupied
      const targetIndex = units.findIndex(u => u.row === tRow && u.col === tCol && u.id !== unitId && !u.isDead);
      
      if (targetIndex !== -1) {
        // Swap
        const targetUnit = units[targetIndex];
        targetUnit.row = unit.row;
        targetUnit.col = unit.col;
      }

      unit.row = tRow;
      unit.col = tCol;
      
      return { gridUnits: units };
    });
  },

  moveAmmo: (fromId, toId) => {
      // Deprecated
  },

  // Engine: Unit takes damage
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
      // Just track globally
      set(state => ({
          stats: { ...state.stats, heroXp: state.stats.heroXp + amount }
      }));
  },

  startNextWave: () => {
      set(state => {
          return {
              stats: { ...state.stats, wave: state.stats.wave + 1 },
              phase: GamePhase.COMBAT
          };
      });
  },

  // Called between waves
  resetWaveState: () => {
      set(state => {
          // 1. Revive all units
          // 2. Remove temp units
          // 3. Reset Hero Energy & Temp Stats
          const nextUnits = state.gridUnits
            .filter(u => !u.isTemp)
            .map(u => ({ ...u, hp: u.maxHp, isDead: false, energy: 0 }));

          // Generate Draft
          const options: DraftOption[] = [];
          for (let i=0; i<3; i++) {
              const isMerc = Math.random() > 0.3;
              if (isMerc) {
                  const template = MERCENARY_POOL[Math.floor(Math.random() * MERCENARY_POOL.length)];
                  options.push({
                      id: uuidv4(),
                      type: 'MERCENARY',
                      name: `Merc: ${template.name}`,
                      emoji: template.emoji || '❓',
                      description: 'Hired for one wave only.',
                      data: template
                  });
              } else {
                  options.push({
                      id: uuidv4(),
                      type: 'BUFF',
                      name: 'Hero Buff',
                      emoji: '💪',
                      description: '+50% DMG this wave',
                      data: { damage: 0.5 }
                  });
              }
          }

          return {
              gridUnits: nextUnits,
              stats: { ...state.stats, tempDamageMult: 0, tempAttackSpeedMult: 0 },
              draftOptions: options,
              phase: GamePhase.DRAFT
          };
      });
  },

  applyDraft: (option) => {
      set(state => {
          // Logic to apply draft
          const nextState: Partial<GameStore> = { phase: GamePhase.SHOP }; // Move to SHOP after Draft

          if (option.type === 'MERCENARY') {
              // Add unit to first available slot
              const units = [...state.gridUnits];
              // Find empty slot
              let placed = false;
              for (let r=0; r<GRID_ROWS; r++) {
                  for (let c=0; c<GRID_COLS; c++) {
                      if (!units.find(u => u.row === r && u.col === c)) {
                          const mercData = option.data as any;
                          units.push({
                              ...mercData,
                              id: uuidv4(),
                              row: r, col: c,
                              isTemp: true,
                              maxCooldown: mercData.maxCooldown || 1,
                              hp: mercData.hp || 100,
                              maxHp: mercData.maxHp || 100,
                              cooldown: 0
                          });
                          placed = true;
                          break;
                      }
                  }
                  if (placed) break;
              }
              nextState.gridUnits = units;
          } else {
              // Buff
              nextState.stats = { 
                  ...state.stats, 
                  tempDamageMult: state.stats.tempDamageMult + (option.data.damage || 0) 
              };
          }
          return nextState;
      });
  }
}));