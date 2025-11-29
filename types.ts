// FIX: Add 'ENGINEERING' to WeaponClass to support engineering units and fix type errors.
export type WeaponClass = 'MELEE' | 'RANGED' | 'MAGIC' | 'ENGINEERING';

export type Rarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY';

export interface Unit {
  id: string;
  name: string;
  emoji: string;
  description?: string;
  type: WeaponClass;
  
  // Combat Stats
  baseDamage: number;
  scaling?: Record<string, number>;
  range: number; // In grid cells
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
  attackType?: 'LINEAR' | 'TRACKING' | 'TRI_SHOT' | 'PENTA_SHOT' | 'DOUBLE_SHOT';
  attackPattern?: 'SHOOT' | 'THRUST' | 'STREAM' | 'NONE';
  projectileEmoji?: string;

  // --- New properties for PvZ/Brotato mechanics ---
  // For Potato Mine
  state?: 'IDLE' | 'ARMING' | 'READY';
  armingTimer?: number;
  
  // For Sunflower
  specialEffectTimer?: number;
  
  // For attack animations
  attackState?: 'IDLE' | 'ATTACKING';
  attackProgress?: number;
  
  // To store raw data for effects
  effects?: Record<string, any>;

  // For Hero Ultimate
  isUlting?: boolean;
  ultTimer?: number;
  ultTickTimer?: number;
}

export interface HeroUpgradeStatus {
    multishot: number; // 0 -> 1(Double) -> 2(Tri) -> 3(Penta)
    effect: number;    // 0 -> 1(Tracking) -> 2(Burn) -> 3(Explode) -> 4(Chain)
    bounce: number;    // 0 -> 1(1) -> 2(2) -> 3(4) -> 4(10)
    damage: number;    // Level of pure damage upgrade
    attackSpeed: number; // Level of pure attack speed upgrade
    ultimate: number;  // Level of ultimate upgrade
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
  flatHp: number;
  hpPercent: number;
  harvesting: number;

  // Class Bonuses
  meleeDmg: number;
  rangedDmg: number;
  elementalDmg: number;
  engineering: number;

  // Temporary Wave Buffs (Reset every wave)
  tempDamageMult: number;
  tempAttackSpeedMult: number;
  
  // Hero-specific multipliers (also reset/recalculated each wave)
  heroDamageMult?: number;
  heroAttackSpeedMult?: number;
  
  // Meta
  wave: number;
  
  // New hero-specific stats for upgrades
  heroEnergyGainRate?: number;
  heroMaxEnergy?: number;
  
  // For UI feedback
  lastHarvestYield?: number | null;

  // Ultimate-specific stats
  ult_speed_mult?: number;
  ult_dmg_bonus?: number;
  ult_kill_extend?: number;

  // New Growth Rate Modifiers
  meleeDmgGrowth?: number;
  rangedDmgGrowth?: number;
  elementalDmgGrowth?: number;
  hpGrowth?: number;
  
  // Index signature for dynamic item effects
  [key: string]: number | undefined | any;
}

export enum GamePhase {
  START = 'START',
  PREPARING_WAVE = 'PREPARING_WAVE',
  COMBAT = 'COMBAT',
  DRAFT = 'DRAFT',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export interface DraftOption {
  id: string;
  type: 'TEMP_UNIT' | 'TEMP_BUFF' | 'HERO_UPGRADE';
  description: string;
  data: Partial<Unit> | { 
      damage?: number; 
      attackSpeed?: number; 
      heroDamage?: number; 
      heroAttackSpeed?: number;
      // For hero-specific upgrades
      heroAttackType?: 'LINEAR' | 'TRACKING' | 'TRI_SHOT' | 'PENTA_SHOT' | 'DOUBLE_SHOT';
      heroEnergyGainRate?: number; // As a multiplier, e.g. 0.5 for +50%
      heroMaxEnergy?: number; // As a reduction, e.g., -20
      upgradePath?: 'multishot' | 'effect' | 'bounce' | 'ultimate' | 'damage' | 'attackSpeed';
      upgradeLevel?: number;
      extraEffects?: Record<string, any>;
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
  // For slow effect
  slowTimer?: number;
  slowMultiplier?: number;
  // For death animation
  deathTimer?: number;
  // Knockback
  knockbackVx?: number;
  // For burn effect
  burnTimer?: number;
  burnDamage?: number;
  burnTickTimer?: number;
}

export interface Projectile extends Entity {
  vx: number;
  vy: number;
  damage: number;
  emoji?: string;
  type: 'LINEAR' | 'ARC' | 'TRACKING';
  targetId?: number; 
  originType: WeaponClass;
  originId?: string;
  life?: number; // for stream projectiles
  hitEnemies?: number[]; // for piercing/stream
  spawnY?: number; // for sine wave of stream
  // For special effects like slow
  effects?: Record<string, any>;
  // Bouncing logic
  bounceCount?: number;
  chainExplosion?: boolean;
  pierce?: number;
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

export interface BrotatoItem {
  id: string;
  name: string;
  tier: number;
  price: number;
  desc: string;
  stats?: Record<string, number>;
  effect?: Record<string, any>; // Changed to any to support preset upgrades
  max?: number;
}

// Data format for the new units.json
export interface UnitData {
  id: string;
  name: string;
  emoji: string;
  tier: number;
  type: WeaponClass;
  attackPattern: 'SHOOT' | 'THRUST' | 'STREAM' | 'NONE';
  price: number;
  baseDamage: number;
  scaling: Record<string, number>;
  cd: number;
  range: number;
  maxHp: number;
  desc: string;
  isTemporary?: boolean;
  effect?: Record<string, any>;
  projectileEmoji?: string;
  // Optional raw stats
  knockback?: number;
  crit?: number;
  critMult?: number;
  projectiles?: number;
  pierce?: number;
}


export interface ShopItem {
  id: string;
  type: 'UNIT' | 'ITEM';
  data: UnitData | BrotatoItem;
  price: number;
  locked: boolean;
  bought: boolean;
}

// Union type for inspection
export type StatsBreakdown = {
    damage: { 
        base: number;
        scaled: Array<{ source: string; emoji: string; value: number; percentage: number }>;
        bonus: number; // For other flat bonuses like stick
        multiplier: number; // This will be the final combined multiplier
        breakdown?: { // Optional detailed breakdown for multipliers
            globalPct: number;
            heroPct: number;
            tempPct: number;
        }
    };
    cooldown: { 
        base: number; 
        multiplier: number; // Final combined
        breakdown?: {
            globalPct: number;
            heroPct: number;
            tempPct: number;
        }
    };
    hp?: {
        base: number;
        bonus: number;
        multiplier: number;
        breakdown?: any;
    };
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