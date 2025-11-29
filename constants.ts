
import { PlayerStats, Unit, Rarity } from './types';

export const CANVAS_WIDTH = 1200; 
export const CANVAS_HEIGHT = 800; 

export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const CELL_SIZE = 120; 
export const GRID_OFFSET_X = 60; 
export const GRID_OFFSET_Y = 100; 
export const GRID_TOP_OFFSET = 100;

// 全局价格倍率
export const PRICE_MULTIPLIER = 1.5;

export const INITIAL_STATS: PlayerStats = {
  gold: 10,
  heroLevel: 1,
  heroXp: 0,
  heroMaxXp: 50, 
  level: 1,
  xp: 0,
  maxXp: 50, // Initial XP requirement lowered
  
  damagePercent: 0,
  attackSpeed: 0,
  critChance: 0.05,
  speed: 100,
  luck: 0,
  pickupRange: 1.0,
  xpGain: 1.0,
  shopDiscount: 0,
  flatHp: 0,
  hpPercent: 0,
  harvesting: 0,

  meleeDmg: 0,
  rangedDmg: 0,
  elementalDmg: 0,
  engineering: 0,

  tempDamageMult: 0,
  tempAttackSpeedMult: 0,
  heroDamageMult: 0,
  heroAttackSpeedMult: 0,
  wave: 1,
  
  heroEnergyGainRate: 1.0,
  heroMaxEnergy: 100,
};

export const RARITY_COLORS: Record<string, string> = {
  COMMON: '#94a3b8',
  RARE: '#3b82f6',
  EPIC: '#a855f7',
  LEGENDARY: '#ef4444'
};

export const RARITY_BG_COLORS: Record<string, string> = {
  COMMON: 'bg-white',
  RARE: 'bg-blue-50',
  EPIC: 'bg-purple-50',
  LEGENDARY: 'bg-red-50'
};

export const RARITY_HOVER_BG_COLORS: Record<string, string> = {
    COMMON: 'hover:bg-slate-50',
    RARE: 'hover:bg-blue-100',
    EPIC: 'hover:bg-purple-100',
    LEGENDARY: 'hover:bg-red-100'
};

export const TIER_TO_RARITY: Record<number, Rarity> = {
  1: 'COMMON',
  2: 'RARE',
  3: 'EPIC',
  4: 'LEGENDARY'
};


export const HERO_UNIT: Unit = {
  id: 'hero',
  name: 'Keyboard Warrior',
  emoji: '🦸‍♂️',
  description: 'The commander. Gains energy over time to unleash a powerful ultimate attack. Its attack pattern can be upgraded.',
  type: 'RANGED',
  damage: 25, // DPS equivalent to ~5 starting units
  range: 99, 
  cooldown: 0,
  maxCooldown: 1.0,
  hp: 200,
  maxHp: 200,
  isHero: true,
  energy: 0,
  row: 2,
  col: 0, 
  isDead: false,
  attackType: 'LINEAR',
};

export const AMMO_TYPE_MAP: Record<string, string> = {
  BULLET: 'Bullet',
  ROCKET: 'Rocket',
  MAGIC: 'Magic',
  MELEE: 'Melee',
};

export const KEYWORD_DEFINITIONS: Record<string, string> = {
  "Burn": "Deals damage over time.",
  "Freeze": "Stops movement.",
  "Pierce": "Goes through enemies.",
  "持续": "Duration of the effect."
};