
import { create } from 'zustand';
import { PlayerStats, Unit, GamePhase, DraftOption, AmmoBayState, AmmoItem, InspectableEntity, BrotatoItem } from '../types';
import { INITIAL_STATS, HERO_UNIT, GRID_ROWS, GRID_COLS, TEMP_UNIT_POOL } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { ITEMS_DATA } from '../data/items';

// A mapping from item stat keys to player stat keys
const STAT_KEY_MAP: Record<string, string> = {
  percentDmg: 'damagePercent',
  atkSpeed: 'attackSpeed',
  crit: 'critChance'
};

interface GameStore {
  stats: PlayerStats;
  phase: GamePhase;
  gridUnits: Unit[];
  draftOptions: DraftOption[];
  ammoState: AmmoBayState;
  inspectedEntity: InspectableEntity;
  
  // New state for Brotato-style items
  allItems: BrotatoItem[];
  ownedItems: Record<string, number>; // Map of item.id -> count

  // Actions
  setPhase: (phase: GamePhase) => void;
  initGame: () => void;
  moveUnit: (unitId: string, targetRow: number, targetCol: number) => void;
  addUnit: (item: AmmoItem | Partial<Unit>) => boolean;
  moveAmmo: (fromId: string, toId: string) => void;
  applyDraft: (option: DraftOption) => void;
  setInspectedEntity: (entity: InspectableEntity) => void;
  buyBrotatoItem: (item: BrotatoItem) => void;

  // Engine Sync Actions
  damageUnit: (unitId: string, amount: number) => void;
  updateHeroEnergy: (amount: number) => void;
  startNextWave: () => void;
  resetWaveState: () => void;
}

const calculateFinalStats = (ownedItems: Record<string, number>, allItems: BrotatoItem[], currentStats: PlayerStats): PlayerStats => {
    const newStats: PlayerStats = { 
        ...INITIAL_STATS,
        gold: currentStats.gold,
        wave: currentStats.wave,
        level: currentStats.level,
        xp: currentStats.xp,
        maxXp: currentStats.maxXp,
        heroLevel: currentStats.heroLevel,
        heroXp: currentStats.heroXp,
        heroMaxXp: currentStats.heroMaxXp,
    };
    
    const itemMap = new Map(allItems.map(i => [i.id, i]));

    for (const itemId in ownedItems) {
        const count = ownedItems[itemId];
        const itemData = itemMap.get(itemId);
        if (itemData) {
            for (let i = 0; i < count; i++) { 
                const combinedAttrs = { ...(itemData.stats || {}), ...(itemData.effect || {}) };
                for (const key in combinedAttrs) {
                    const value = combinedAttrs[key];
                    const statKey = STAT_KEY_MAP[key] || key;
                    newStats[statKey] = (newStats[statKey] || 0) + value;
                }
            }
        }
    }
    return newStats;
};


export const useGameStore = create<GameStore>((set, get) => ({
  stats: INITIAL_STATS,
  phase: GamePhase.START,
  gridUnits: [],
  draftOptions: [],
  ammoState: {},
  inspectedEntity: null,
  allItems: ITEMS_DATA,
  ownedItems: {},

  setPhase: (phase) => set({ phase }),
  
  setInspectedEntity: (entity) => set({ inspectedEntity: entity }),

  initGame: () => {
    const heroUnit = { 
      ...HERO_UNIT, 
      id: uuidv4(), 
      row: 2, 
      col: 0,
      attackType: 'LINEAR' as const
    };
    
    const starters: Unit[] = [heroUnit];
    for (let r = 0; r < GRID_ROWS; r++) {
      if (r === 2) continue;
      starters.push({
        id: uuidv4(),
        name: 'Militia',
        emoji: '🔫',
        description: 'A basic ranged defender. Reliable but not exceptional.',
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
      draftOptions: [],
      inspectedEntity: null,
      ownedItems: {},
    });
  },

  addUnit: (data) => {
    const units = [...get().gridUnits];
    for (let c = 0; c < GRID_COLS; c++) {
      for (let r = 0; r < GRID_ROWS; r++) {
        if (!units.find(u => u.row === r && u.col === c)) {
          const unitType = 'weaponClass' in data ? data.weaponClass : (data.type || 'RANGED');
          const unitMaxCooldown = 'cooldown' in data && typeof data.cooldown === 'number' 
            ? data.cooldown 
            : ((data as Partial<Unit>).maxCooldown || 1.0);

          const newUnit: Unit = {
            id: uuidv4(),
            name: data.name || 'Unit',
            emoji: data.emoji || '📦',
            type: unitType,
            damage: data.damage || 10,
            range: 1200,
            cooldown: 0,
            maxCooldown: unitMaxCooldown,
            hp: 100,
            maxHp: 100,
            row: r,
            col: c,
            isTemp: (data as any).isTemp || false,
            ...data as any
          };
          
          if ('weaponClass' in data) {
            newUnit.type = (data as AmmoItem).weaponClass;
            newUnit.maxCooldown = (data as AmmoItem).cooldown;
          }

          set({ gridUnits: [...units, newUnit] });
          return true;
        }
      }
    }
    return false;
  },

  buyBrotatoItem: (item) => {
    set(state => {
      const currentGold = state.stats.gold;
      if (currentGold < item.price) return {};

      const newOwnedItems = { ...state.ownedItems };
      newOwnedItems[item.id] = (newOwnedItems[item.id] || 0) + 1;
      
      const newStats = calculateFinalStats(newOwnedItems, state.allItems, state.stats);
      newStats.gold -= item.price; // Deduct gold after calculation

      return {
        ownedItems: newOwnedItems,
        stats: newStats
      };
    });
  },

  moveUnit: (unitId, tRow, tCol) => {
    set((state) => {
      if (tRow < 0 || tRow >= GRID_ROWS || tCol < 0 || tCol >= GRID_COLS) return {};

      const units = [...state.gridUnits];
      const unitIndex = units.findIndex(u => u.id === unitId);
      if (unitIndex === -1) return {};

      const unit = units[unitIndex];
      const targetIndex = units.findIndex(u => u.row === tRow && u.col === tCol && u.id !== unitId && !u.isDead);
      
      if (targetIndex !== -1) {
        const targetUnit = units[targetIndex];
        targetUnit.row = unit.row;
        targetUnit.col = unit.col;
        unit.row = tRow;
        unit.col = tCol;
      } else {
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
      const energyGain = amount * (state.stats.heroEnergyGainRate || 1.0);
      const maxEnergy = state.stats.heroMaxEnergy || 100;
      const units = state.gridUnits.map(u => {
        if (!u.isHero) return u;
        return { ...u, energy: Math.min(maxEnergy, (u.energy || 0) + energyGain) };
      });
      return { gridUnits: units };
    });
  },

  startNextWave: () => {
    set(state => ({
      stats: {
        ...state.stats,
        level: 1,
        xp: 0,
        maxXp: INITIAL_STATS.maxXp,
        wave: state.stats.wave + 1
      },
      phase: GamePhase.COMBAT
    }));
  },

  resetWaveState: () => {
    set(state => {
      const nextUnits = state.gridUnits
        .filter(u => !u.isTemp)
        .map(u => ({ ...u, hp: u.maxHp, isDead: false, energy: 0 }));
      
      // Recalculate stats to remove any temporary wave-based buffs if they existed
      const nextStats = calculateFinalStats(state.ownedItems, state.allItems, state.stats);

      nextStats.tempDamageMult = 0;
      nextStats.tempAttackSpeedMult = 0;
      nextStats.heroTempDamageMult = 0;
      nextStats.heroTempAttackSpeedMult = 0;

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
      const nextState: Partial<Pick<GameStore, 'gridUnits' | 'stats'>> = {}; 

      if (option.type === 'TEMP_UNIT') {
        const units = [...state.gridUnits];
        const data = option.data as Partial<Unit>;
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
                isTemp: true
              });
              placed = true;
              break;
            }
          }
          if (placed) break;
        }
        nextState.gridUnits = units;
      } else if (option.type === 'TEMP_BUFF') {
        const buff = option.data as any;
        const nextStats = { ...state.stats };

        if (buff.damage) nextStats.tempDamageMult = (nextStats.tempDamageMult || 0) + buff.damage;
        if (buff.attackSpeed) nextStats.tempAttackSpeedMult = (nextStats.tempAttackSpeedMult || 0) + buff.attackSpeed;
        if (buff.heroDamage) nextStats.heroTempDamageMult = (nextStats.heroTempDamageMult || 0) + buff.heroDamage;
        if (buff.heroAttackSpeed) nextStats.heroTempAttackSpeedMult = (nextStats.heroTempAttackSpeedMult || 0) + buff.heroAttackSpeed;
        if (buff.heroEnergyGainRate) nextStats.heroEnergyGainRate = (nextStats.heroEnergyGainRate || 1.0) + buff.heroEnergyGainRate;
        if (buff.heroMaxEnergy) nextStats.heroMaxEnergy = Math.max(20, (nextStats.heroMaxEnergy || 100) + buff.heroMaxEnergy);

        nextState.stats = nextStats;
        
        if (buff.heroAttackType) {
          const units = [...state.gridUnits];
          const heroIndex = units.findIndex(u => u.isHero);
          if (heroIndex !== -1) {
            units[heroIndex] = { ...units[heroIndex], attackType: buff.heroAttackType };
            nextState.gridUnits = units;
          }
        }
      }
      return nextState;
    });
  }
}));
