
import { PlayerStats, Unit } from './types';

export const CANVAS_WIDTH = 1200; 
export const CANVAS_HEIGHT = 800; // Reduced height for better landscape aspect

export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const CELL_SIZE = 120; // Size of each grid cell
export const GRID_OFFSET_X = 60; // Left margin
export const GRID_OFFSET_Y = 100; // Top margin
export const GRID_TOP_OFFSET = 100;

export const INITIAL_STATS: PlayerStats = {
  gold: 0,
  heroLevel: 1,
  heroXp: 0,
  heroMaxXp: 100,
  level: 1,
  xp: 0,
  maxXp: 100,
  
  hp: 100,
  maxHp: 100,
  damagePercent: 0,
  attackSpeed: 0,
  critChance: 0.05,
  armor: 0,
  speed: 100,
  luck: 0,
  hpRegen: 0,
  pickupRange: 1.0,
  xpGain: 1.0,
  shopDiscount: 0,

  meleeDmg: 0,
  rangedDmg: 0,
  elementalDmg: 0,
  engineering: 0,

  tempDamageMult: 0,
  tempAttackSpeedMult: 0,
  wave: 1,
};

export const RARITY_COLORS: Record<string, string> = {
  COMMON: '#94a3b8',
  RARE: '#3b82f6',
  EPIC: '#a855f7',
  LEGENDARY: '#ef4444'
};

export const HERO_UNIT: Unit = {
  id: 'hero',
  name: 'Keyboard Warrior',
  emoji: '🦸‍♂️',
  type: 'MAGIC',
  damage: 10,
  range: 9999, // Infinite
  cooldown: 0,
  maxCooldown: 1.0,
  hp: 100,
  maxHp: 100,
  isHero: true,
  energy: 0,
  row: 2,
  col: 0, // Starts at back middle
  isDead: false
};

// Available Mercenaries for Draft
export const MERCENARY_POOL: Partial<Unit>[] = [
  { name: "Boxer", emoji: '🥊', type: 'MELEE', damage: 20, maxCooldown: 1.5, hp: 150, range: 150, maxHp: 150 },
  { name: "Gunner", emoji: '🔫', type: 'RANGED', damage: 8, maxCooldown: 0.8, hp: 60, range: 900, maxHp: 60 },
  { name: "Wizard", emoji: '🧙‍♂️', type: 'MAGIC', damage: 15, maxCooldown: 2.0, hp: 50, range: 600, maxHp: 50 },
  { name: "Wall-Nut", emoji: '🌰', type: 'ENGINEERING', damage: 0, maxCooldown: 999, hp: 400, range: 0, maxHp: 400 },
  { name: "Sniper", emoji: '🏹', type: 'RANGED', damage: 40, maxCooldown: 3.5, hp: 40, range: 1200, maxHp: 40 },
  { name: "Ninja", emoji: '🥷', type: 'MELEE', damage: 10, maxCooldown: 0.2, hp: 80, range: 150, maxHp: 80 },
];

export const ENEMY_TYPES = [
  { id: 'troll', emoji: '🤡', hp: 30, speed: 40, damage: 5, type: 'NORMAL' },
  { id: 'hater', emoji: '😡', hp: 60, speed: 30, damage: 10, type: 'NORMAL' },
  { id: 'bot', emoji: '🤖', hp: 120, speed: 20, damage: 15, type: 'ELITE' },
  { id: 'boss', emoji: '👹', hp: 1000, speed: 15, damage: 50, type: 'BOSS' },
];

export const WAVE_CONFIG = [
  { wave: 1, duration: 30, interval: 3.0, enemies: ['troll'] },
  { wave: 2, duration: 35, interval: 2.5, enemies: ['troll', 'hater'] },
  { wave: 3, duration: 40, interval: 2.0, enemies: ['troll', 'hater', 'bot'] },
  { wave: 4, duration: 45, interval: 1.5, enemies: ['hater', 'bot'] },
  { wave: 5, duration: 60, interval: 1.0, enemies: ['troll', 'hater', 'bot', 'boss'] },
];

export const AMMO_TYPE_MAP: Record<string, string> = {
  BULLET: 'Bullet',
  ROCKET: 'Rocket',
  MAGIC: 'Magic',
  MELEE: 'Melee',
  ENGINEERING: 'Tech'
};

export const KEYWORD_DEFINITIONS: Record<string, string> = {
  "Burn": "Deals damage over time.",
  "Freeze": "Stops movement.",
  "Pierce": "Goes through enemies.",
  "持续": "Duration of the effect."
};

export const WEAPON_POOL = [
  { name: "Pistol", emoji: '🔫', rarity: 'COMMON', type: 'BULLET', damage: 10, cooldown: 1.0, speed: 20, weaponClass: 'RANGED' },
  { name: "Wand", emoji: '🪄', rarity: 'RARE', type: 'MAGIC', damage: 15, cooldown: 1.5, speed: 15, weaponClass: 'MAGIC' },
];

export const ITEM_POOL = [
  { name: "Bandage", rarity: 'COMMON', description: "+10 HP", stats: { maxHp: 10 } },
  { name: "Scope", rarity: 'RARE', description: "+10% Range", stats: { pickupRange: 0.1 } },
];

export const AVAILABLE_UPGRADES = [
  { label: "Max HP Up", detail: "+20 Max HP", type: 'STAT', value: 20 },
  { label: "Damage Up", detail: "+10% Damage", type: 'STAT', value: 10 },
];
