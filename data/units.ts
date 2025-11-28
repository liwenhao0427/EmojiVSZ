

import { UnitData } from '../types';

const unitsArray: Omit<UnitData, 'id'>[] = [
    { "name": "豌豆射手", "emoji": "🌱", "projectileEmoji": "🟢", "type": "RANGED", "attackPattern": "SHOOT", "price": 20, "damage": 20, "cd": 1.5, "range": 800, "maxHp": 100, "desc": "发射豌豆攻击敌人" },
    { "name": "坚果墙", "emoji": "🌰", "type": "ENGINEERING", "attackPattern": "NONE", "price": 25, "damage": 0, "cd": 0, "range": 0, "maxHp": 2000, "desc": "高耐久盾牌" },
    { "name": "铁拳", "emoji": "👊", "type": "MELEE", "attackPattern": "THRUST", "price": 20, "damage": 10, "cd": 0.76, "range": 120, "maxHp": 150, "knockback": 2.0, "desc": "快速直拳突刺" },
    { "name": "石头", "emoji": "🪨", "type": "MELEE", "attackPattern": "THRUST", "price": 20, "damage": 25, "cd": 2.0, "range": 120, "maxHp": 300, "desc": "缓慢但沉重的撞击" },
    { "name": "手枪", "emoji": "🔫", "projectileEmoji": "⚪", "type": "RANGED", "attackPattern": "SHOOT", "price": 22, "damage": 12, "cd": 1.2, "range": 400, "maxHp": 80, "pierce": 1, "desc": "发射普通子弹，穿透1人" },
    { "name": "火把", "emoji": "🕯️", "type": "MELEE", "attackPattern": "SWING", "price": 18, "damage": 5, "cd": 1.08, "range": 120, "maxHp": 100, "effect": { "burn_chance": 100 }, "desc": "攻击使敌人燃烧" },
    { "name": "树枝", "emoji": "🥢", "type": "MELEE", "attackPattern": "SWING", "price": 15, "damage": 8, "cd": 1.25, "range": 120, "maxHp": 100, "effect": { "stick_bonus": 4 }, "desc": "场上树枝越多伤害越高" },
    { "name": "螺丝刀", "emoji": "🪛", "type": "ENGINEERING", "attackPattern": "NONE", "price": 25, "damage": 8, "cd": 1.08, "range": 100, "maxHp": 100, "effect": { "spawn_mine": 12 }, "desc": "每 12 秒生成一个地雷" },
    { "name": "土豆雷", "emoji": "🥔", "type": "ENGINEERING", "attackPattern": "NONE", "price": 40, "damage": 1200, "cd": 15, "range": 50, "maxHp": 10, "effect": { "mine_arm_time": 15, "explode_on_contact": 1 }, "desc": "准备时间长，接触敌人爆炸" },
    { "name": "魔杖", "emoji": "🪄", "projectileEmoji": "🟣", "type": "MAGIC", "attackPattern": "SHOOT", "price": 35, "damage": 8, "cd": 0.87, "range": 350, "maxHp": 80, "effect": { "burn_damage": 3 }, "desc": "发射魔法弹，造成燃烧" },
    { "name": "长矛", "emoji": "🔱", "type": "MELEE", "attackPattern": "THRUST", "price": 40, "damage": 18, "cd": 1.34, "range": 250, "maxHp": 100, "desc": "长距离突刺攻击" },
    { "name": "小刀", "emoji": "🔪", "type": "MELEE", "attackPattern": "SWING", "price": 30, "damage": 8, "cd": 1.0, "range": 120, "maxHp": 80, "crit": 0.25, "desc": "斜向挥砍，高暴击" },
    { "name": "向日葵", "emoji": "🌻", "type": "ENGINEERING", "attackPattern": "NONE", "price": 50, "maxHp": 80, "effect": { "generate_gold": 25 }, "cd": 10, "damage": 0, "range": 0, "desc": "生产金币" },
    { "name": "冲锋枪", "emoji": "🖊️", "projectileEmoji": "▫️", "type": "RANGED", "attackPattern": "SHOOT", "price": 45, "damage": 3, "cd": 0.17, "range": 400, "maxHp": 80, "desc": "极高射速" },
    { "name": "双管霰弹", "emoji": "💥", "projectileEmoji": "🔸", "type": "RANGED", "attackPattern": "SHOOT", "price": 50, "damage": 3, "cd": 1.37, "range": 350, "maxHp": 100, "knockback": 8, "effect": { "projectiles": 4 }, "desc": "发射4枚弹头" },
    { "name": "弹弓", "emoji": "🪃", "projectileEmoji": "🪨", "type": "RANGED", "attackPattern": "SHOOT", "price": 40, "damage": 10, "cd": 1.22, "range": 300, "maxHp": 80, "effect": { "bounce": 1 }, "desc": "子弹弹射1次" },
    { "name": "手里剑", "emoji": "✴️", "projectileEmoji": "✴️", "type": "RANGED", "attackPattern": "SHOOT", "price": 35, "damage": 6, "cd": 0.87, "range": 350, "maxHp": 80, "crit": 0.35, "desc": "高暴击远程" },
    { "name": "盗贼匕首", "emoji": "🗡️", "type": "MELEE", "attackPattern": "THRUST", "price": 35, "damage": 5, "cd": 1.01, "range": 120, "maxHp": 80, "crit": 0.20, "effect": { "crit_gold_chance": 30 }, "desc": "暴击30%概率偷钱" },
    { "name": "尖刺盾", "emoji": "🛡️", "type": "MELEE", "attackPattern": "THRUST", "price": 40, "damage": 10, "cd": 1.17, "range": 120, "maxHp": 400, "knockback": 2.0, "desc": "极高击退，高防御" },
    { "name": "仙人掌棒", "emoji": "🌵", "projectileEmoji": "✳️", "type": "MELEE", "attackPattern": "SWING", "price": 45, "damage": 10, "cd": 1.67, "range": 120, "maxHp": 150, "effect": { "projectile_on_hit": 3 }, "desc": "挥舞时发射尖刺" },
    { "name": "剪刀", "emoji": "✂️", "type": "MELEE", "attackPattern": "SWING", "price": 35, "damage": 5, "cd": 1.01, "range": 120, "maxHp": 100, "crit": 0.10, "desc": "普通的近战单位" },
    { "name": "雷光刀", "emoji": "⚡", "type": "MELEE", "attackPattern": "THRUST", "price": 45, "damage": 8, "cd": 1.01, "range": 120, "maxHp": 100, "effect": { "lightning_on_hit": 1 }, "desc": "命中生成闪电" },
    { "name": "扳手", "emoji": "🔧", "type": "ENGINEERING", "attackPattern": "NONE", "price": 50, "damage": 12, "cd": 1.74, "range": 100, "maxHp": 150, "effect": { "spawn_turret": 1 }, "desc": "定期建造炮台" },
    { "name": "电击枪", "emoji": "🔌", "projectileEmoji": "⚡", "type": "MAGIC", "attackPattern": "SHOOT", "price": 45, "damage": 5, "cd": 0.95, "range": 200, "maxHp": 80, "effect": { "slow_aoe": 1 }, "desc": "范围减速" },
    { "name": "幽灵权杖", "emoji": "💀", "projectileEmoji": "👻", "type": "MAGIC", "attackPattern": "SHOOT", "price": 45, "damage": 10, "cd": 1.03, "range": 300, "maxHp": 80, "effect": { "hp_growth": 1 }, "desc": "击杀增加生命上限" },
    { "name": "加特林豌豆", "emoji": "🌿", "projectileEmoji": "🟢", "type": "RANGED", "attackPattern": "SHOOT", "price": 120, "damage": 20, "cd": 0.3, "range": 800, "maxHp": 150, "desc": "超高攻速发射豌豆" },
    { "name": "寒冰射手", "emoji": "❄️", "projectileEmoji": "🔵", "type": "RANGED", "attackPattern": "SHOOT", "price": 175, "damage": 20, "cd": 1.5, "range": 800, "maxHp": 100, "effect": { "slow_on_hit": 1 }, "desc": "发射冰豌豆，减速敌人" },
    { "name": "樱桃炸弹", "emoji": "🍒", "type": "MAGIC", "attackPattern": "NONE", "price": 150, "damage": 800, "cd": 0, "range": 200, "maxHp": 50, "isTemporary": true, "effect": { "explode_on_hit": 1, "trigger_on_move": 1 }, "desc": "受到攻击或被拖动时立即爆炸" },
    { "name": "大嘴花", "emoji": "🪴", "type": "MELEE", "attackPattern": "NONE", "price": 150, "damage": 1000, "cd": 40, "range": 120, "maxHp": 150, "effect": { "execute_threshold": 1000 }, "desc": "吞噬生命值低于1000的敌人" },
    { "name": "十字弩", "emoji": "🏹", "projectileEmoji": "➖", "type": "RANGED", "attackPattern": "SHOOT", "price": 80, "damage": 8, "cd": 1.13, "range": 350, "maxHp": 80, "effect": { "pierce_on_crit": 1 }, "desc": "暴击穿透" },
    { "name": "碎纸机", "emoji": "🧨", "projectileEmoji": "💣", "type": "RANGED", "attackPattern": "SHOOT", "price": 75, "damage": 5, "cd": 1.3, "range": 450, "maxHp": 100, "effect": { "explode_chance": 50 }, "desc": "50%几率爆炸" },
    { "name": "激光枪", "emoji": "🔦", "projectileEmoji": "💠", "type": "RANGED", "attackPattern": "SHOOT", "price": 85, "damage": 30, "cd": 2.15, "range": 500, "maxHp": 80, "pierce": 1, "desc": "高伤穿透，攻速慢" },
    { "name": "医疗枪", "emoji": "💉", "projectileEmoji": "💊", "type": "RANGED", "attackPattern": "SHOOT", "price": 70, "damage": 10, "cd": 0.95, "range": 400, "maxHp": 100, "effect": { "heal_on_hit": 1 }, "desc": "攻击治疗周围" },
    { "name": "喷火器", "emoji": "🔥", "projectileEmoji": "🔥", "type": "MAGIC", "attackPattern": "STREAM", "price": 200, "damage": 2, "cd": 0.1, "range": 250, "maxHp": 120, "desc": "持续喷射火焰流" },
    { "name": "加农炮", "emoji": "💣", "type": "ENGINEERING", "attackPattern": "SHOOT", "projectileEmoji": "⚫️", "price": 250, "damage": 50, "cd": 2.5, "range": 1200, "maxHp": 100, "desc": "发射高伤害爆炸炮弹，射速较慢。" },
    { "name": "狙击机器人", "emoji": "🔭", "type": "RANGED", "attackPattern": "SHOOT", "projectileEmoji": "💢", "price": 300, "damage": 100, "cd": 4.0, "range": 2000, "maxHp": 50, "desc": "极远射程和高伤害，但射速极慢。" },
    { "name": "狂战士", "emoji": "👺", "type": "MELEE", "attackPattern": "THRUST", "price": 280, "damage": 40, "cd": 0.5, "range": 150, "maxHp": 200, "desc": "一个狂暴的近战攻击者，攻速极快。" }
];

const generateId = (name: string) => name.toLowerCase().replace(/ /g, '_');

export const UNIT_DATA: Record<string, UnitData> = unitsArray.reduce((acc, unit) => {
    const id = generateId(unit.name);
    acc[id] = { ...unit, id };
    return acc;
}, {} as Record<string, UnitData>);