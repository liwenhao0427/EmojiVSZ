

export type WeaponClass = 'MELEE' | 'RANGED' | 'MAGIC' | 'ENGINEERING';

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Unit {
  id: string;
  name: string;
  emoji: string;
  type: WeaponClass;
  
  // Combat Stats
  damage: number;
  range: number; // In grid cells or pixels
  cooldown: number; // Seconds
  maxCooldown: number;
  
  // Survival Stats
  hp: number;
  maxHp: number;
  
  // Hero Specifics
  isHero?: boolean;
  energy?: number; // 0-100
  
  // State
  isTemp?: boolean; // If true, removed at end of wave (Mercenary)
  isDead?: boolean; // If true, inactive until next wave
  hitFlash?: number; // Visual flash timer
  
  // Grid Position (0-4 Row, 0-8 Col)
  row: number;
  col: number;
}

export interface PlayerStats {
  // Hero / Global Progression
  gold: number;
  heroLevel: number;
  heroXp: number;
  heroMaxXp: number;
  
  // HUD Aliases
  level: number;
  xp: number;
  maxXp: number;
  
  // Combat Stats (HUD & Calculations)
  hp: number;
  maxHp: number;
  damagePercent: number;
  attackSpeed: number;
  critChance: number;
  armor: number;
  speed: number;
  luck: number;
  hpRegen: number;
  pickupRange: number;
  xpGain: number;
  shopDiscount: number;

  // Class Bonuses
  meleeDmg: number;
  rangedDmg: number;
  elementalDmg: number;
  engineering: number;

  // Temporary Wave Buffs (Reset every wave)
  tempDamageMult: number;
  tempAttackSpeedMult: number;
  
  // Meta
  wave: number;
}

export enum GamePhase {
  START = 'START',
  COMBAT = 'COMBAT',
  DRAFT = 'DRAFT',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface DraftOption {
  id: string;
  type: 'MERCENARY' | 'BUFF';
  description: string;
  data: Partial<Unit> | { damage?: number, speed?: number };
  emoji: string;
  name: string;
}

// --- Engine Entity Types ---

export interface Entity {
  id: number;
  x: number;
  y: number;
  radius: number;
  markedForDeletion: boolean;
}

export interface Enemy extends Entity {
  hp: number;
  maxHp: number;
  speed: number;
  emoji: string;
  type: 'NORMAL' | 'ELITE' | 'BOSS';
  damage: number;
  row: number; // Enemies are locked to a row usually, or move freely
  attackTimer: number; // Time until next attack
  isAttacking: boolean; // Visual state
  frozen: number; // Time remaining frozen
  hitFlash?: number; // Visual flash timer
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  damage: number;
  emoji: string;
  type: 'LINEAR' | 'ARC' | 'TRACKING';
  targetId?: number; // For tracking
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  velocity: { x: number; y: number };
  scale: number;
}

// --- Ammo / Shop Types ---

export interface AmmoItem {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  rarity: Rarity;
  damage: number;
  speed: number; 
  cooldown: number;
  duration?: number;
  weaponClass: WeaponClass;
  type: string;
  bought?: boolean; // For shop
  locked?: boolean; // For shop
}

export type AmmoBayState = Record<string, AmmoItem[]>;

export interface ItemUpgrade {
  id: string;
  name: string;
  description: string;
  rarity: Rarity;
  stats: Partial<PlayerStats>;
  bought?: boolean;
  locked?: boolean;
}

export interface ShopItem {
  id: string;
  type: 'WEAPON' | 'ITEM';
  data: AmmoItem | ItemUpgrade;
  price: number;
  locked: boolean;
  bought: boolean;
}