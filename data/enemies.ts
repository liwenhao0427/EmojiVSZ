
export interface EnemyData {
    id: string;
    name: string;
    emoji: string;
    type: 'NORMAL' | 'SPECIAL' | 'ELITE' | 'BOSS';
    baseHp: number;
    hpPerWave: number;
    speed: number;
    damage: number;
    materials: number;
    scale: number;
    isRanged?: boolean;
    armor?: number;
    behavior?: 'flee';
}

export const ENEMY_DATA: Record<string, EnemyData> = {
    "baby_alien": { "id": "baby_alien", "name": "外星幼崽", "emoji": "👾", "type": "NORMAL", "baseHp": 25, "hpPerWave": 3, "speed": 200, "damage": 5, "materials": 1, "scale": 0.8 },
    "fly": { "id": "fly", "name": "烦人苍蝇", "emoji": "🦟", "type": "NORMAL", "baseHp": 10, "hpPerWave": 2, "speed": 320, "damage": 5, "materials": 1, "scale": 0.6 },
    "chaser": { "id": "chaser", "name": "追逐者", "emoji": "🐛", "type": "NORMAL", "baseHp": 15, "hpPerWave": 2, "speed": 350, "damage": 8, "materials": 1, "scale": 0.9 },
    "spitter": { "id": "spitter", "name": "喷吐者", "emoji": "🐡", "type": "NORMAL", "baseHp": 20, "hpPerWave": 4, "speed": 180, "damage": 8, "materials": 2, "isRanged": true, "scale": 1.0 },
    "helmet_alien": { "id": "helmet_alien", "name": "头盔怪", "emoji": "💂", "type": "NORMAL", "baseHp": 30, "hpPerWave": 4, "speed": 200, "damage": 10, "materials": 2, "armor": 3, "scale": 1.1 },
    "charger": { "id": "charger", "name": "冲锋者", "emoji": "🐗", "type": "NORMAL", "baseHp": 45, "hpPerWave": 5, "speed": 350, "damage": 12, "materials": 2, "scale": 1.3 },
    "bruiser": { "id": "bruiser", "name": "壮汉", "emoji": "🦍", "type": "NORMAL", "baseHp": 60, "hpPerWave": 8, "speed": 150, "damage": 20, "materials": 3, "scale": 1.5 },
    "looter": { "id": "looter", "name": "寻宝哥", "emoji": "💰", "type": "SPECIAL", "baseHp": 80, "hpPerWave": 20, "speed": 400, "damage": 0, "materials": 15, "behavior": "flee", "scale": 1.2 },
    "rhino": { "id": "rhino", "name": "犀牛精英", "emoji": "🦏", "type": "ELITE", "baseHp": 1200, "hpPerWave": 300, "speed": 120, "damage": 25, "materials": 50, "scale": 2.0 },
    "monk": { "id": "monk", "name": "武僧精英", "emoji": "🧘", "type": "ELITE", "baseHp": 1000, "hpPerWave": 250, "speed": 140, "damage": 20, "materials": 50, "scale": 1.8 },
    "boss_predator": { "id": "boss_predator", "name": "掠食者", "emoji": "👹", "type": "BOSS", "baseHp": 25000, "hpPerWave": 0, "speed": 250, "damage": 50, "materials": 500, "scale": 3.0 }
};
