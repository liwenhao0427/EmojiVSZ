import { UnitData } from '../types';

const unitsArray: Omit<UnitData, 'id'>[] = [
    // --- TIER 1 ---
    { "name": "豌豆射手", "emoji": "🌱", "tier": 1, "projectileEmoji": "🟢", "type": "RANGED", "attackPattern": "SHOOT", "price": 80, "baseDamage": 10, "scaling": { "rangedDmg": 0.5 }, "cd": 1.0, "range": 7, "maxHp": 30, "desc": "基础远程单位。" },
    { "name": "树枝", "emoji": "🥢", "tier": 1, "type": "MELEE", "attackPattern": "THRUST", "price": 90, "baseDamage": 10, "scaling": { "meleeDmg": 1.0 }, "cd": 1.0, "range": 1, "maxHp": 100, "effect": { "stick_bonus": 4 }, "desc": "近战单位。攻击会额外造成4点伤害。" },
    { "name": "手枪", "emoji": "🔫", "tier": 1, "projectileEmoji": "⚪", "type": "RANGED", "attackPattern": "SHOOT", "price": 110, "baseDamage": 12, "scaling": { "rangedDmg": 1.0 }, "cd": 1.2, "range": 4, "maxHp": 30, "pierce": 1, "desc": "发射可穿透1名敌人的子弹。" },
    { "name": "小刀", "emoji": "🔪", "tier": 1, "type": "MELEE", "attackPattern": "THRUST", "price": 120, "baseDamage": 14, "scaling": { "meleeDmg": 1.0 }, "cd": 0.8, "range": 1, "maxHp": 120, "crit": 0.25, "desc": "快速突刺，暴击率高。" },
    // --- TIER 2 ---
    { "name": "火把", "emoji": "🕯️", "tier": 2, "type": "MELEE", "attackPattern": "THRUST", "price": 160, "baseDamage": 16, "scaling": { "meleeDmg": 0.5, "elementalDmg": 0.5 }, "cd": 0.5, "range": 1, "maxHp": 200, "effect": { "burn_chance": 100 }, "desc": "攻击100%使敌人燃烧。" },
    { "name": "魔杖", "emoji": "🪄", "tier": 2, "projectileEmoji": "🟣", "type": "MAGIC", "attackPattern": "SHOOT", "price": 180, "baseDamage": 20, "scaling": { "elementalDmg": 1.0 }, "cd": 0.8, "range": 5, "maxHp": 50, "effect": { "burn_damage": 3, "is_tracking": true }, "desc": "发射追踪魔法弹，造成燃烧效果。" },
    { "name": "长矛", "emoji": "🔱", "tier": 2, "type": "MELEE", "attackPattern": "THRUST", "price": 170, "baseDamage": 26, "scaling": { "meleeDmg": 1.0 }, "cd": 1.2, "range": 2, "maxHp": 150, "desc": "更远距离的突刺攻击。" },
    { "name": "弹弓", "emoji": "🪃", "tier": 2, "projectileEmoji": "🪨", "type": "RANGED", "attackPattern": "SHOOT", "price": 150, "baseDamage": 25, "scaling": { "rangedDmg": 0.75 }, "cd": 2.0, "range": 4, "maxHp": 50, "effect": { "bounce": 1 }, "desc": "发射的石子可弹射1次。" },
    { "name": "尖刺盾", "emoji": "🛡️", "tier": 2, "type": "MELEE", "attackPattern": "THRUST", "price": 200, "baseDamage": 1, "scaling": { "maxHp": 0.05 }, "cd": 1.0, "range": 1, "maxHp": 400, "knockback": 2.0, "desc": "高击退，高防御。" },
    // --- TIER 3 ---
    { "name": "冲锋枪", "emoji": "🖊️", "tier": 3, "projectileEmoji": "▫️", "type": "RANGED", "attackPattern": "SHOOT", "price": 300, "baseDamage": 8, "scaling": { "rangedDmg": 0.25 }, "cd": 0.3, "range": 5, "maxHp": 60, "desc": "极高的射速。" },
    { "name": "双管霰弹", "emoji": "💥", "tier": 3, "projectileEmoji": "🔸", "type": "RANGED", "attackPattern": "SHOOT", "price": 320, "baseDamage": 8, "scaling": { "rangedDmg": 0.25 }, "cd": 2.4, "range": 3, "maxHp": 80, "knockback": 8, "effect": { "projectiles": 4 }, "desc": "一次发射4枚弹头，造成巨大击退。" },
    { "name": "十字弩", "emoji": "🏹", "tier": 3, "projectileEmoji": "➖", "type": "RANGED", "attackPattern": "SHOOT", "price": 360, "baseDamage": 80, "scaling": { "rangedDmg": 1.0 }, "cd": 3.0, "range": 8, "maxHp": 60, "effect": { "pierce_on_crit": 1 }, "desc": "高伤害，暴击时可穿透敌人。" },
    { "name": "幽灵权杖", "emoji": "💀", "tier": 3, "projectileEmoji": "👻", "type": "MAGIC", "attackPattern": "SHOOT", "price": 340, "baseDamage": 40, "scaling": { "elementalDmg": 1.0 }, "cd": 1.0, "range": 5, "maxHp": 50, "effect": { "hp_growth": 1 }, "desc": "每次击杀永久增加1点最大生命值。" },
    { "name": "喷火器", "emoji": "🔥", "tier": 3, "projectileEmoji": "🔥", "type": "MAGIC", "attackPattern": "STREAM", "price": 500, "baseDamage": 5, "scaling": { "elementalDmg": 0.5 }, "cd": 0.1, "range": 3, "maxHp": 120, "desc": "持续喷射火焰流，对范围内敌人造成伤害。" },
    // --- TIER 4 ---
    { "name": "加特林豌豆", "emoji": "🌿", "tier": 4, "projectileEmoji": "🟢", "type": "RANGED", "attackPattern": "SHOOT", "price": 600, "baseDamage": 10, "scaling": { "rangedDmg": 0.5 }, "cd": 0.4, "range": 7, "maxHp": 100, "desc": "豌豆射手的终极形态，拥有超高攻速。" },
    { "name": "寒冰射手", "emoji": "❄️", "tier": 4, "projectileEmoji": "🔵", "type": "RANGED", "attackPattern": "SHOOT", "price": 640, "baseDamage": 20, "scaling": { "rangedDmg": 1.0, "elementalDmg": 0.5 }, "cd": 2.0, "range": 7, "maxHp": 80, "effect": { "slow_on_hit": 1 }, "desc": "发射冰豌豆减速敌人。" },
    { "name": "激光枪", "emoji": "🔦", "tier": 4, "projectileEmoji": "💠", "type": "RANGED", "attackPattern": "SHOOT", "price": 700, "baseDamage": 100, "scaling": { "rangedDmg": 1.0 }, "cd": 4.0, "range": 6, "maxHp": 80, "pierce": 3, "desc": "发射高伤害穿透激光。" },
    { "name": "狙击机器人", "emoji": "🔭", "tier": 4, "type": "RANGED", "attackPattern": "SHOOT", "projectileEmoji": "💢", "price": 800, "baseDamage": 400, "scaling": { "rangedDmg": 1.0 }, "cd": 4.0, "range": 17, "maxHp": 50, "desc": "极远射程和极高伤害。" },
    { "name": "狂战士", "emoji": "👺", "tier": 4, "type": "MELEE", "attackPattern": "THRUST", "price": 760, "baseDamage": 80, "scaling": { "meleeDmg": 1.0 }, "cd": 0.5, "range": 1, "maxHp": 400, "desc": "狂暴的近战攻击者，攻速和伤害都极高。" }
];

const generateId = (name: string) => name.toLowerCase().replace(/ /g, '_');

export const UNIT_DATA: Record<string, UnitData> = unitsArray.reduce((acc, unit) => {
    const id = generateId(unit.name);
    acc[id] = { ...unit, id };
    return acc;
}, {} as Record<string, UnitData>);