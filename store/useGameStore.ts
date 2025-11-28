
import { create } from 'zustand';
import { PlayerStats, Unit, GamePhase, DraftOption, AmmoBayState, InspectableEntity, BrotatoItem, UnitData, AmmoItem, HeroUpgradeStatus } from '../types';
import { INITIAL_STATS, HERO_UNIT, GRID_ROWS, GRID_COLS } from '../constants';
import { v4 as uuidv4 } from 'uuid';
import { ITEMS_DATA } from '../data/items';
import { UNIT_DATA } from '../data/units';
import { Log } from '../services/Log';

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
  
  // Hero Upgrade Tracking (Resets every wave)
  heroUpgradeStatus: HeroUpgradeStatus;

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
  endWaveAndGoToShop: () => void;
  addGold: (amount: number) => void;
  setHeroUltState: (isUlting: boolean, ultTimer?: number) => void;
  updateUltTimer: (dt: number) => void;
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
  heroUpgradeStatus: { multishot: 0, effect: 0, bounce: 0 },

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

    Log.i('Store', 'initGame: Resetting all stats and units for a new game.');
    set({
      stats: { ...INITIAL_STATS, wave: 1, gold: 10, heroLevel: 1 }, 
      gridUnits: starters,
      phase: GamePhase.COMBAT,
      draftOptions: [],
      inspectedEntity: null,
      ownedItems: {},
      heroUpgradeStatus: { multishot: 0, effect: 0, bounce: 0 },
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
      const targetUnit = units.find(u => u.row === tRow && u.col === tCol && u.id !== unitId);
      
      if (targetUnit) {
        // Swap positions with the target unit (dead or alive)
        targetUnit.row = unit.row;
        targetUnit.col = unit.col;
        unit.row = tRow;
        unit.col = tCol;
      } else {
        // Move to an empty cell
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
  
  updateUltTimer: (dt) => set(state => {
    let needsUpdate = false;
    const units = state.gridUnits.map(u => {
        if (u.isHero && u.isUlting && u.ultTimer) {
            needsUpdate = true;
            const newTimer = u.ultTimer - dt;
            if (newTimer <= 0) {
                return { ...u, isUlting: false, ultTimer: 0 };
            }
            return { ...u, ultTimer: newTimer };
        }
        return u;
    });
    return needsUpdate ? { gridUnits: units } : {};
  }),

  setHeroUltState: (isUlting, ultTimer) => set(state => {
      const units = state.gridUnits.map(u => {
          if (u.isHero) {
              return { ...u, isUlting, ultTimer: isUlting ? ultTimer : 0 };
          }
          return u;
      });
      return { gridUnits: units };
  }),

  endWaveAndGoToShop: () => {
    set(state => {
      Log.i('Store', `endWaveAndGoToShop: phase -> SHOP. Current wave is still ${state.stats.wave}.`);
      const nextUnits = state.gridUnits
        .filter(u => !u.isTemp) 
        .map(u => ({ ...u, hp: u.maxHp, isDead: false, energy: 0 }));
      
      const baseStats = calculateFinalStats(state.ownedItems, state.allItems, state.stats);
      baseStats.tempDamageMult = 0;
      baseStats.tempAttackSpeedMult = 0;
      baseStats.heroTempDamageMult = 0;
      baseStats.heroTempAttackSpeedMult = 0;

      return {
        gridUnits: nextUnits,
        stats: baseStats,
        phase: GamePhase.SHOP,
      };
    });
  },

  startNextWave: () => {
    set(state => {
      Log.i('Store', `startNextWave: phase -> COMBAT, wave -> ${state.stats.wave + 1}.`);
      const unitsWithResetHero = state.gridUnits.map(u => {
        if (u.isHero) {
          // FIX: Add 'as const' to ensure TypeScript infers 'LINEAR' as a literal type,
          // not a generic string, which resolves the type incompatibility with the Unit interface.
          return { ...u, attackType: 'LINEAR' as const, effects: {} };
        }
        return u;
      });

      return {
        gridUnits: unitsWithResetHero,
        stats: {
          ...state.stats,
          wave: state.stats.wave + 1,
          level: 1,
          xp: 0,
          maxXp: INITIAL_STATS.maxXp,
        },
        phase: GamePhase.COMBAT,
        heroUpgradeStatus: { multishot: 0, effect: 0, bounce: 0 },
      };
    });
  },

  applyDraft: (option) => {
    set(state => {
      const nextState: Partial<Pick<GameStore, 'gridUnits' | 'stats' | 'heroUpgradeStatus'>> = {}; 

      if (option.type === 'TEMP_UNIT') {
        get().addUnit({ ...option.data, isTemp: true });
      } else if (option.type === 'HERO_UPGRADE') {
          const upgradeData = option.data as any;
          if (upgradeData.upgradePath) {
              const currentStatus = { ...state.heroUpgradeStatus };
              currentStatus[upgradeData.upgradePath as keyof HeroUpgradeStatus] = upgradeData.upgradeLevel;
              nextState.heroUpgradeStatus = currentStatus;
          }

          const nextStats = { ...state.stats };
          if (upgradeData.heroDamage) nextStats.heroTempDamageMult = (nextStats.heroTempDamageMult || 0) + upgradeData.heroDamage;
          nextState.stats = nextStats;
          
          const units = [...state.gridUnits];
          const heroIndex = units.findIndex(u => u.isHero);
          if (heroIndex !== -1) {
            let hero = { ...units[heroIndex] };
            if (upgradeData.heroAttackType) hero.attackType = upgradeData.heroAttackType;
            if (upgradeData.extraEffects) {
                hero.effects = { ...(hero.effects || {}), ...upgradeData.extraEffects };
            }
            units[heroIndex] = hero;
            nextState.gridUnits = units;
          }

      } else if (option.type === 'TEMP_BUFF') {
        const buff = option.data as any;
        const nextStats = { ...state.stats };

        if (buff.damage) nextStats.tempDamageMult = (nextStats.tempDamageMult || 0) + buff.damage;
        if (buff.attackSpeed) nextStats.tempAttackSpeedMult = (nextStats.tempAttackSpeedMult || 0) + buff.attackSpeed;
        if (buff.heroDamage) nextStats.heroTempDamageMult = (nextStats.heroTempDamageMult || 0) + buff.heroDamage;
        if (buff.heroAttackSpeed) nextStats.heroTempAttackSpeedMult = (nextStats.heroTempAttackSpeedMult || 0) + buff.heroAttackSpeed;
        if (buff.heroEnergyGainRate) nextStats.heroEnergyGainRate = (nextStats.heroEnergyGainRate || 1.0) + buff.heroEnergyGainRate;
        if (buff.heroMaxEnergy) nextStats.heroMaxEnergy = Math.max(20, (nextState.stats.heroMaxEnergy || 100) + buff.heroMaxEnergy);

        nextState.stats = nextStats;
      }
      return nextState;
    });
  }
}));
