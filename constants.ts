

import { PlayerStats, Unit } from './types';

export const CANVAS_WIDTH = 1200; 
export const CANVAS_HEIGHT = 800; 

export const GRID_ROWS = 5;
export const GRID_COLS = 9;
export const CELL_SIZE = 120; 
export const GRID_OFFSET_X = 60; 
export const GRID_OFFSET_Y = 100; 
export const GRID_TOP_OFFSET = 100;

export const INITIAL_STATS: PlayerStats = {
  gold: 10,
  heroLevel: 1,
  heroXp: 0,
  heroMaxXp: 50, // Lower initial XP
  level: 1,
  xp: 0,
  maxXp: 50, // Lower initial XP
  
  damagePercent: 0,
  attackSpeed: 0,
  critChance: 0.05,
  speed: 100,
  luck: 0,
  pickupRange: 1.0,
  xpGain: 1.0,
  shopDiscount: 0,

  meleeDmg: 0,
  rangedDmg: 0,
  elementalDmg: 0,
  engineering: 0,

  tempDamageMult: 0,
  tempAttackSpeedMult: 0,
  heroTempDamageMult: 0,
  heroTempAttackSpeedMult: 0,
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

export const HERO_UNIT: Unit = {
  id: 'hero',
  name: 'Keyboard Warrior',
  emoji: '🦸‍♂️',
  description: 'The commander. Gains energy over time to unleash a powerful ultimate attack. Its attack pattern can be upgraded.',
  type: 'MAGIC',
  damage: 25, // DPS equivalent to ~5 starting units
  range: 9999, 
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

// Temp Units for Draft
export const TEMP_UNIT_POOL: Partial<Unit>[] = [
  { name: "Cannon", emoji: '💣', type: 'ENGINEERING', damage: 50, maxCooldown: 2.5, hp: 100, range: 1200, maxHp: 100, description: 'Fires a high-damage explosive shell at a slow rate.' },
  { name: "Sniper Bot", emoji: '🔭', type: 'RANGED', damage: 100, maxCooldown: 4.0, hp: 50, range: 2000, maxHp: 50, description: 'Extremely long range and high damage, but very slow fire rate.' },
  { name: "Berzerker", emoji: '👺', type: 'MELEE', damage: 40, maxCooldown: 0.5, hp: 200, range: 150, maxHp: 200, description: 'A furious melee attacker with a very fast attack speed.' },
];

export const ENEMY_TYPES = [
  { id: 'troll', emoji: '🤡', hp: 30, speed: 40, damage: 5, type: 'NORMAL', description: 'A standard, numerous foe. Weak but annoying.' },
  { id: 'hater', emoji: '😡', hp: 60, speed: 30, damage: 10, type: 'NORMAL', description: 'Slightly tougher than a troll, with more health.' },
  { id: 'bot', emoji: '🤖', hp: 120, speed: 20, damage: 15, type: 'ELITE', description: 'A durable elite unit that can absorb significant damage.' },
  { id: 'boss', emoji: '👹', hp: 1000, speed: 15, damage: 50, type: 'BOSS', description: 'A massive threat. Extremely high health and damage.' },
];

export const WAVE_CONFIG = [
  { wave: 1, duration: 30, interval: 2.5, enemies: ['troll'] },
  { wave: 2, duration: 35, interval: 2.0, enemies: ['troll', 'hater'] },
  { wave: 3, duration: 40, interval: 1.8, enemies: ['troll', 'hater', 'bot'] },
  { wave: 4, duration: 45, interval: 1.2, enemies: ['hater', 'bot'] },
  { wave: 5, duration: 60, interval: 0.8, enemies: ['troll', 'hater', 'bot', 'boss'] },
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
  { name: "Sword", emoji: '⚔️', rarity: 'COMMON', type: 'MELEE', damage: 20, cooldown: 0.8, speed: 0, weaponClass: 'MELEE' },
  { name: "Turret", emoji: '📡', rarity: 'EPIC', type: 'ENGINEERING', damage: 8, cooldown: 0.3, speed: 30, weaponClass: 'ENGINEERING' },
];

export const ITEM_POOL = [
  { name: "Scope", rarity: 'RARE', description: "+10% Range", stats: { pickupRange: 0.1 } },
  { name: "Coffee", rarity: 'COMMON', description: "+10% Atk Speed", stats: { attackSpeed: 10 } },
  { name: "Dumbbell", rarity: 'COMMON', description: "+5% Damage", stats: { damagePercent: 5 } },
  { name: "Lucky Charm", rarity: 'EPIC', description: "+20 Luck", stats: { luck: 20 } },
];
