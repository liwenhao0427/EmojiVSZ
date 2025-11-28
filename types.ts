

export type WeaponClass = 'MELEE' | 'RANGED' | 'MAGIC' | 'ENGINEERING';

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Unit {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  type: WeaponClass;
  
  // Combat Stats
  damage: number;
  range: number; // In grid cells or pixels
  cooldown: number; // Seconds
  maxCooldown: number;
  
  // Survival Stats (For the Unit itself, not the player)
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

  // New property for hero attack patterns
  attackType?: 'LINEAR' | 'TRACKING' | 'TRI_SHOT' | 'PENTA_SHOT';
}

export interface PlayerStats {
  // Resources
  gold: number;
  
  // Progression
  heroLevel: number;
  heroXp: number;
  heroMaxXp: number;
  
  // HUD Aliases
  level: number;
  xp: number;
  maxXp: number;
  
  // Combat Stats (Global Buffs)
  damagePercent: number;
  attackSpeed: number;
  critChance: number;
  speed: number; // Projectile speed modifier
  luck: number;
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
  heroTempDamageMult?: number;
  heroTempAttackSpeedMult?: number;
  
  // Meta
  wave: number;
  
  // New hero-specific stats for upgrades
  heroEnergyGainRate?: number;
  heroMaxEnergy?: number;
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
  type: 'TEMP_UNIT' | 'TEMP_BUFF';
  description: string;
  data: Partial<Unit> | { 
      damage?: number; 
      attackSpeed?: number; 
      heroDamage?: number; 
      heroAttackSpeed?: number;
      // For hero-specific upgrades
      heroAttackType?: 'LINEAR' | 'TRACKING' | 'TRI_SHOT' | 'PENTA_SHOT';
      heroEnergyGainRate?: number; // As a multiplier, e.g. 0.5 for +50%
      heroMaxEnergy?: number; // As a reduction, e.g., -20
  };
  emoji: string;
  name: string;
  value?: number; // For UI display
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
  description?: string;
  type: 'NORMAL' | 'ELITE' | 'BOSS';
  damage: number;
  row: number; 
  attackTimer: number; 
  isAttacking: boolean; 
  frozen: number; 
  hitFlash?: number; 
  // Added for Inspection
  name?: string; 
  // New properties for attack animation
  attackState?: 'IDLE' | 'ATTACKING';
  attackProgress?: number;
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  damage: number;
  emoji: string;
  type: 'LINEAR' | 'ARC' | 'TRACKING';
  targetId?: number; 
  originType: WeaponClass;
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
  bought?: boolean; 
  locked?: boolean; 
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

// Union type for inspection
export type StatsBreakdown = {
    damage: { base: number; bonus: number; multiplier: number };
    cooldown: { base: number; multiplier: number };
};

export type InspectableEntity = {
    type: 'UNIT';
    data: Unit;
    statsBreakdown: StatsBreakdown;
} | {
    type: 'ENEMY';
    data: Enemy;
    statsBreakdown: StatsBreakdown;
} | null;
