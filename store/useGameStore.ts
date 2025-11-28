

import { create } from 'zustand';
import { PlayerStats, Unit, GamePhase, DraftOption, AmmoBayState, InspectableEntity, BrotatoItem, UnitData, AmmoItem } from '../types';
import { INITIAL_STATS, HERO_UNIT, GRID_ROWS, GRID_COLS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { ITEMS_DATA } from '../data/items';
import { UNIT_DATA } from '../data/units';

// A mapping from item stat keys to player stat keys
const STAT_KEY_MAP: Record<string, string> = {
  percentDmg: 'damagePercent',
  atkSpeed: 'attackSpeed',
  crit: 'critChance',
  shop_discount: 'shopDiscount'
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
  addUnit: (item: UnitData | Partial<Unit>) => boolean;
  applyDraft: (option: DraftOption) => void;
  setInspectedEntity: (entity: InspectableEntity) => void;
  buyBrotatoItem: (item: BrotatoItem) => void;
  moveAmmo: (activeId: string, overId: string) => void;
  triggerManualExplosion: (unitId: string) => void;


  // Engine Sync Actions
  damageUnit: (unitId: string, amount: number) => void;
  updateHeroEnergy: (amount: number) => void;
  startNextWave: () => void;
  resetWaveState: () => void;
  addGold: (amount: number) => void;
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
  
  addGold: (amount) => set(state => ({ stats: { ...state.stats, gold: state.stats.gold + amount }})),

  initGame: () => {
    const heroUnit = { 
      ...HERO_UNIT, 
      id: uuidv4(), 
      row: 2, 
      col: 0,
      attackType: 'LINEAR' as const
    };
    
    const starters: Unit[] = [heroUnit];
    const peashooterData = UNIT_DATA['豌豆射手'];
    if (peashooterData) {
        const positions = [[0, 1], [1, 1], [3, 1], [4, 1]];
        positions.forEach(([r, c]) => {
            starters.push({
                id: uuidv4(),
                name: peashooterData.name,
                emoji: peashooterData.emoji,
                description: peashooterData.desc,
                type: peashooterData.type,
                damage: peashooterData.damage,
                range: peashooterData.range,
                cooldown: 0,
                maxCooldown: peashooterData.cd,
                hp: peashooterData.maxHp,
                maxHp: peashooterData.maxHp,
                row: r,
                col: c,
                effects: peashooterData.effect,
                attackPattern: peashooterData.attackPattern,
                projectileEmoji: peashooterData.projectileEmoji,
            });
        });
    }

    set({
      stats: { ...INITIAL_STATS, wave: 1, gold: 10, heroLevel: 1 }, 
      gridUnits: starters,
      phase: GamePhase.COMBAT,
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

          const newUnit: Unit = {
            id: uuidv4(),
            name: data.name || 'Unit',
            emoji: data.emoji || '📦',
            type: data.type || 'RANGED',
            damage: data.damage || 10,
            range: data.range || 1200,
            cooldown: 0,
            // 修复：将 `data` 转换为 `Partial<Unit>` 类型以访问 `maxCooldown` 属性，因为 `UnitData` 类型中不存在此属性。
            maxCooldown: 'cd' in data && typeof data.cd === 'number' ? data.cd : ((data as Partial<Unit>).maxCooldown || 1.0),
            hp: data.maxHp || ('hp' in data && typeof data.hp === 'number' ? data.hp : 100),
            maxHp: data.maxHp || 100,
            row: r,
            col: c,
            description: 'desc' in data ? data.desc : data.description,
            isTemp: 'isTemporary' in data ? !!data.isTemporary : ('isTemp' in data ? !!data.isTemp : false),
            effects: 'effect' in data ? data.effect : ('effects' in data ? data.effects || {} : {}),
            attackPattern: 'attackPattern' in data ? data.attackPattern : 'SHOOT',
            projectileEmoji: 'projectileEmoji' in data ? data.projectileEmoji : undefined,
            state: 'IDLE',
            armingTimer: ('effect' in data && data.effect?.mine_arm_time) ? data.effect.mine_arm_time : 0,
            // 修复：将 `data` 转换为 `Partial<Unit>` 类型以访问 `maxCooldown` 属性，因为 `UnitData` 类型中不存在此属性。
            specialEffectTimer: ('cd' in data && typeof data.cd === 'number' ? data.cd : (data as Partial<Unit>).maxCooldown) || 0,
          };

          if (newUnit.effects?.mine_arm_time) {
            newUnit.state = 'ARMING';
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

  moveAmmo: (activeId: string, overId: string) => {
    if (activeId === overId) return;

    set(state => {
        const { ammoState } = state;
        const newAmmoState = JSON.parse(JSON.stringify(ammoState));

        let activeContainer: string | undefined;
        let overContainer: string | undefined;
        let activeIndex = -1;
        let overIndex = -1;
        let activeItem: AmmoItem | undefined;

        for (const containerId in newAmmoState) {
            const index = newAmmoState[containerId].findIndex(item => item.id === activeId);
            if (index !== -1) {
                activeContainer = containerId;
                activeIndex = index;
                activeItem = newAmmoState[containerId][index];
                break;
            }
        }

        for (const containerId in newAmmoState) {
            const index = newAmmoState[containerId].findIndex(item => item.id === overId);
            if (index !== -1) {
                overContainer = containerId;
                overIndex = index;
                break;
            }
        }
        
        if (!overContainer && newAmmoState[overId]) {
          overContainer = overId;
          overIndex = newAmmoState[overId].length;
        }
        
        if (!activeItem || !activeContainer || !overContainer) {
            return {};
        }
        
        newAmmoState[activeContainer].splice(activeIndex, 1);
        newAmmoState[overContainer].splice(overIndex, 0, activeItem);

        return { ammoState: newAmmoState };
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

  damageUnit: (unitId, amount) => {
    set((state) => {
      const units = state.gridUnits.map(u => {
        if (u.id !== unitId) return u;
        
        if (u.effects?.explode_on_hit) {
            return { ...u, hp: 0, isDead: true };
        }

        const newHp = u.hp - amount;
        return { ...u, hp: newHp, isDead: newHp <= 0, hitFlash: 0.2 };
      });
      return { gridUnits: units };
    });
  },

  triggerManualExplosion: (unitId) => {
    set((state) => {
        const units = state.gridUnits.map(u => {
            if (u.id === unitId && u.effects?.trigger_on_move) {
                return { ...u, hp: 0, isDead: true };
            }
            return u;
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
        .filter(u => !u.isTemp && !u.isDead) 
        .map(u => ({ ...u, hp: u.maxHp, isDead: false, energy: 0 }));
      
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
        get().addUnit({ ...option.data, isTemp: true });
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