import { UnitData } from '../types';

const unitsArray: Omit<UnitData, 'id'>[] = [
    // --- TIER 1 ---
    { "name": "豌豆射手", "emoji": "🌱", "tier": 1, "projectileEmoji": "🟢", "type": "RANGED", "attackPattern": "SHOOT", "price": 80, "damage": 10, "cd": 1.0, "range": 7, "maxHp": 30, "desc": "基础远程单位" },
    { "name": "树枝", "emoji": "🥢", "tier": 1, "type": "MELEE", "attackPattern": "THRUST", "price": 90, "damage": 20, "cd": 1.0, "range": 1, "maxHp": 100, "effect": { "stick_bonus": 4 }, "desc": "场上树枝越多伤害越高" },
    { "name": "手枪", "emoji": "🔫", "tier": 1, "projectileEmoji": "⚪", "type": "RANGED", "attackPattern": "SHOOT", "price": 110, "damage": 12, "cd": 1.2, "range": 4, "maxHp": 30, "pierce": 1, "desc": "发射穿透1名敌人的子弹" },
    { "name": "小刀", "emoji": "🔪", "tier": 1, "type": "MELEE", "attackPattern": "THRUST", "price": 120, "damage": 14, "cd": 0.5, "range": 1, "maxHp": 120, "crit": 0.25, "desc": "快速突刺，暴击率高" },
    // --- TIER 2 ---
    { "name": "火把", "emoji": "🕯️", "tier": 2, "type": "MELEE", "attackPattern": "THRUST", "price": 160, "damage": 16, "cd": 1.0, "range": 1, "maxHp": 200, "effect": { "burn_chance": 100 }, "desc": "攻击100%使敌人燃烧" },
    { "name": "魔杖", "emoji": "🪄", "tier": 2, "projectileEmoji": "🟣", "type": "MAGIC", "attackPattern": "SHOOT", "price": 180, "damage": 20, "cd": 0.8, "range": 5, "maxHp": 50, "effect": { "burn_damage": 3, "is_tracking": true }, "desc": "发射追踪魔法弹，造成燃烧" },
    { "name": "长矛", "emoji": "🔱", "tier": 2, "type": "MELEE", "attackPattern": "THRUST", "price": 170, "damage": 26, "cd": 1.2, "range": 2, "maxHp": 150, "desc": "更远距离的突刺攻击" },
    { "name": "弹弓", "emoji": "🪃", "tier": 2, "projectileEmoji": "🪨", "type": "RANGED", "attackPattern": "SHOOT", "price": 150, "damage": 25, "cd": 2.0, "range": 4, "maxHp": 50, "effect": { "bounce": 1 }, "desc": "子弹可弹射1次" },
    { "name": "尖刺盾", "emoji": "🛡️", "tier": 2, "type": "MELEE", "attackPattern": "THRUST", "price": 200, "damage": 20, "cd": 1.0, "range": 1, "maxHp": 400, "knockback": 2.0, "desc": "高击退，高防御" },
    // --- TIER 3 ---
    { "name": "冲锋枪", "emoji": "🖊️", "tier": 3, "projectileEmoji": "▫️", "type": "RANGED", "attackPattern": "SHOOT", "price": 300, "damage": 8, "cd": 0.3, "range": 5, "maxHp": 60, "desc": "极高的射速，但单发伤害低" },
    { "name": "双管霰弹", "emoji": "💥", "tier": 3, "projectileEmoji": "🔸", "type": "RANGED", "attackPattern": "SHOOT", "price": 320, "damage": 8, "cd": 2.4, "range": 3, "maxHp": 80, "knockback": 8, "effect": { "projectiles": 4 }, "desc": "一次发射4枚弹头，造成范围伤害" },
    { "name": "十字弩", "emoji": "🏹", "tier": 3, "projectileEmoji": "➖", "type": "RANGED", "attackPattern": "SHOOT", "price": 360, "damage": 80, "cd": 3.0, "range": 8, "maxHp": 60, "effect": { "pierce_on_crit": 1 }, "desc": "高伤害，暴击时子弹可穿透" },
    { "name": "幽灵权杖", "emoji": "💀", "tier": 3, "projectileEmoji": "👻", "type": "MAGIC", "attackPattern": "SHOOT", "price": 340, "damage": 40, "cd": 1.0, "range": 5, "maxHp": 50, "effect": { "hp_growth": 1 }, "desc": "每次击杀敌人，永久增加自身1点最大生命值" },
    { "name": "喷火器", "emoji": "🔥", "tier": 3, "projectileEmoji": "🔥", "type": "MAGIC", "attackPattern": "STREAM", "price": 500, "damage": 5, "cd": 0.1, "range": 3, "maxHp": 120, "desc": "持续向前方喷射火焰流，对范围内敌人造成伤害" },
    // --- TIER 4 ---
    { "name": "加特林豌豆", "emoji": "🌿", "tier": 4, "projectileEmoji": "🟢", "type": "RANGED", "attackPattern": "SHOOT", "price": 600, "damage": 10, "cd": 0.4, "range": 7, "maxHp": 100, "desc": "超高攻速发射伤害更高的豌豆" },
    { "name": "寒冰射手", "emoji": "❄️", "tier": 4, "projectileEmoji": "🔵", "type": "RANGED", "attackPattern": "SHOOT", "price": 640, "damage": 20, "cd": 2.0, "range": 7, "maxHp": 80, "effect": { "slow_on_hit": 1 }, "desc": "发射冰豌豆，减速单个敌人" },
    { "name": "激光枪", "emoji": "🔦", "tier": 4, "projectileEmoji": "💠", "type": "RANGED", "attackPattern": "SHOOT", "price": 700, "damage": 100, "cd": 4.0, "range": 6, "maxHp": 80, "pierce": 3, "desc": "发射高伤害激光，可穿透3名敌人" },
    { "name": "狙击机器人", "emoji": "🔭", "tier": 4, "type": "RANGED", "attackPattern": "SHOOT", "projectileEmoji": "💢", "price": 800, "damage": 400, "cd": 4.0, "range": 17, "maxHp": 50, "desc": "极远射程和极高伤害，但射速很慢。" },
    { "name": "狂战士", "emoji": "👺", "tier": 4, "type": "MELEE", "attackPattern": "THRUST", "price": 760, "damage": 80, "cd": 0.5, "range": 1, "maxHp": 400, "desc": "狂暴的近战攻击者，攻速和伤害都极高。" }
];

const generateId = (name: string) => name.toLowerCase().replace(/ /g, '_');

export const UNIT_DATA: Record<string, UnitData> = unitsArray.reduce((acc, unit) => {
    const id = generateId(unit.name);
    acc[id] = { ...unit, id };
    return acc;
}, {} as Record<string, UnitData>);