
export interface EnemyData {
    id: string;
    name: string;
    emoji: string;
    type: 'NORMAL' | 'SPECIAL' | 'ELITE' | 'BOSS';
    baseHp: number;
    hpPerWave: number;
    speed: number;
    damage: number;
    gold: number;
    xp: number;
    scale: number;
    isRanged?: boolean;
    armor?: number;
    behavior?: 'flee';
}

export const ENEMY_DATA: Record<string, EnemyData> = {
    "baby_alien": { "id": "baby_alien", "name": "外星幼崽", "emoji": "👾", "type": "NORMAL", "baseHp": 20, "hpPerWave": 2, "speed": 100, "damage": 5, "gold": 5, "xp": 3, "scale": 0.8 },
    "chaser": { "id": "chaser", "name": "追逐者", "emoji": "🐛", "type": "NORMAL", "baseHp": 12, "hpPerWave": 2, "speed": 190, "damage": 8, "gold": 6, "xp": 4, "scale": 0.9 },
    "spitter": { "id": "spitter", "name": "喷吐者", "emoji": "🐡", "type": "NORMAL", "baseHp": 15, "hpPerWave": 3, "speed": 90, "damage": 8, "gold": 7, "xp": 4, "isRanged": true, "scale": 1.0 },
    "helmet_alien": { "id": "helmet_alien", "name": "头盔怪", "emoji": "💂", "type": "NORMAL", "baseHp": 25, "hpPerWave": 3, "speed": 100, "damage": 10, "gold": 8, "xp": 5, "armor": 3, "scale": 1.1 },
    "charger": { "id": "charger", "name": "冲锋者", "emoji": "🐗", "type": "NORMAL", "baseHp": 35, "hpPerWave": 4, "speed": 175, "damage": 12, "gold": 10, "xp": 6, "scale": 1.3 },
    "bruiser": { "id": "bruiser", "name": "壮汉", "emoji": "🦍", "type": "NORMAL", "baseHp": 50, "hpPerWave": 6, "speed": 75, "damage": 20, "gold": 15, "xp": 8, "scale": 1.5 },
    "looter": { "id": "looter", "name": "寻宝哥", "emoji": "💰", "type": "SPECIAL", "baseHp": 60, "hpPerWave": 15, "speed": 200, "damage": 0, "gold": 100, "xp": 10, "behavior": "flee", "scale": 1.2 },
    "rhino": { "id": "rhino", "name": "犀牛精英", "emoji": "🦏", "type": "ELITE", "baseHp": 1000, "hpPerWave": 200, "speed": 60, "damage": 25, "gold": 150, "xp": 50, "scale": 2.0 },
    "monk": { "id": "monk", "name": "武僧精英", "emoji": "🧘", "type": "ELITE", "baseHp": 900, "hpPerWave": 200, "speed": 70, "damage": 20, "gold": 150, "xp": 50, "scale": 1.8 },
    "boss_predator": { "id": "boss_predator", "name": "掠食者", "emoji": "👹", "type": "BOSS", "baseHp": 20000, "hpPerWave": 0, "speed": 80, "damage": 50, "gold": 500, "xp": 200, "scale": 3.0 }
};