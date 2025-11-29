
import { BrotatoItem } from "../types";

export const ITEMS_DATA: BrotatoItem[] = [
  // --- TIER 1 ---
  {
    "id": "ant_power", "name": "蚂蚁之力", "tier": 1, "price": 40,
    "stats": { "meleeDmg": 2 }, "desc": "+2 近战伤害"
  },
  {
    "id": "bee_stinger", "name": "蜜蜂蜇针", "tier": 1, "price": 50,
    "stats": { "rangedDmg": 1, "atkSpeed": 0.05 }, "desc": "+1 远程伤害, +5% 攻击速度"
  },
  {
    "id": "lucky_cat", "name": "招财猫", "tier": 1, "price": 50,
    "max": 5, "effect": { "shop_discount": 5 }, "desc": "商店价格 -5% (最大5个)"
  },
  {
    "id": "hummingbird_nectar", "name": "蜂鸟蜜", "tier": 1, "price": 50,
    "stats": { "atkSpeed": 0.10, "percentDmg": -0.02 }, "desc": "+10% 攻击速度, -2% 伤害"
  },
  {
    "id": "firefly_lantern", "name": "萤火虫灯笼", "tier": 1, "price": 40,
    "stats": { "elementalDmg": 2 }, "desc": "+2 元素伤害"
  },
  {
    "id": "turtle_shell", "name": "硬龟壳", "tier": 1, "price": 60,
    "stats": { "flatHp": 10 }, "desc": "+10 最大生命值"
  },
  {
    "id": "rabbit_foot", "name": "兔子脚", "tier": 1, "price": 40,
    "stats": { "luck": 15, "elementalDmg": -1 }, "desc": "+15 幸运, -1 元素伤害"
  },
  {
    "id": "mole_claws", "name": "鼹鼠爪", "tier": 1, "price": 60,
    "stats": { "crit": 0.06, "percentDmg": -0.03 }, "desc": "+6% 暴击率, -3% 伤害"
  },
  {
    "id": "friendly_alien_frog", "name": "友善的外星蛙", "tier": 1, "price": 60,
    "max": 10, "stats": { "percentDmg": 0.05 }, "effect": { "enemy_count": 5 }, "desc": "+5% 伤害, 敌人数量 +5%"
  },
  {
    "id": "earthworm", "name": "蚯蚓", "tier": 1, "price": 40,
    "stats": { "harvesting": 8, "meleeDmg": -1 }, "desc": "+8 收获, -1 近战伤害"
  },
  // --- TIER 2 ---
  {
    "id": "bull_horns", "name": "公牛角", "tier": 2, "price": 100,
    "stats": { "meleeDmg": 6, "rangedDmg": -3 }, "desc": "+6 近战伤害, -3 远程伤害"
  },
  {
    "id": "eagle_eye", "name": "鹰眼", "tier": 2, "price": 90,
    "stats": { "crit": 0.05 }, "desc": "+5% 暴击"
  },
  {
    "id": "armadillo_plate", "name": "犰狳甲", "tier": 2, "price": 120,
    "stats": { "flatHp": 20 }, "desc": "+20 最大生命值"
  },
  {
    "id": "cheetah_paws", "name": "猎豹爪", "tier": 2, "price": 110,
    "stats": { "atkSpeed": 0.10 }, "desc": "+10% 攻击速度"
  },
  {
    "id": "fox_cunning", "name": "狐狸的狡猾", "tier": 2, "price": 96,
    "stats": { "luck": 20 }, "desc": "+20 幸运"
  },
  {
    "id": "poison_dart_frog", "name": "毒镖蛙", "tier": 2, "price": 90,
    "stats": { "elementalDmg": 4, "meleeDmg": -1, "rangedDmg": -1 }, "desc": "+4 元素伤害, -1 近战/远程伤害"
  },
  {
    "id": "porcupine_quills", "name": "豪猪刺", "tier": 2, "price": 90,
    "stats": { "percentDmg": 0.12 }, "desc": "+12% 伤害"
  },
  {
    "id": "money_tree_sapling", "name": "摇钱树苗", "tier": 2, "price": 80,
    "effect": { "piggy_bank_savings": 20 }, "desc": "波次开始时获得相当于当前金币20%的利息。"
  },
  // --- TIER 3 ---
  {
    "id": "bear_paw", "name": "熊掌", "tier": 3, "price": 160,
    "stats": { "meleeDmg": 8, "rangedDmg": 8, "elementalDmg": 8 }, "desc": "所有扁平伤害+8"
  },
  {
    "id": "glass_mantis", "name": "玻璃螳螂", "tier": 3, "price": 150,
    "stats": { "percentDmg": 0.25, "flatHp": -15 }, "desc": "+25% 伤害, -15 最大生命值"
  },
  {
    "id": "chameleon_skin", "name": "变色龙皮", "tier": 3, "price": 170,
    "effect": { "stationary_dmg": 25 }, "desc": "静止时, 伤害+25%"
  },
  {
    "id": "four_leaf_clover", "name": "四叶草", "tier": 3, "price": 130,
    "stats": { "luck": 20 }, "desc": "+20 幸运"
  },
  {
    "id": "elephant_strength", "name": "大象之力", "tier": 3, "price": 140,
    "stats": { "flatHp": 40, "percentDmg": -0.08 }, "desc": "+40 最大生命值, -8% 伤害"
  },
  {
    "id": "ancient_tortoise_blood", "name": "老龟之血", "tier": 3, "price": 190,
    "effect": { "hp_regen_per_sec": 0.5 }, "desc": "每秒恢复0.5点生命值"
  },
  {
    "id": "vitality_stone", "name": "活力石", "tier": 3, "price": 160,
    "stats": { "hpPercent": 0.15 }, "desc": "+15% 最大生命值"
  },
  {
    "id": "vigilante_badger", "name": "平头哥警员", "tier": 3, "price": 184,
    "effect": { "dmg_growth": 3 }, "desc": "每波次结束, 永久+3% 伤害 (可无限叠加)"
  },
  // --- TIER 4 ---
  {
    "id": "mammoth_tusk", "name": "猛犸象牙", "tier": 4, "price": 230,
    "stats": { "meleeDmg": 15, "percentDmg": -0.08 }, "desc": "+15 近战伤害, -8% 伤害"
  },
  {
    "id": "phoenix_feather", "name": "凤凰羽", "tier": 4, "price": 240,
    "stats": { "elementalDmg": 8, "luck": 15, "flatHp": -20 }, "desc": "+8 元素伤害, +15 幸运, -20 最大生命值"
  },
  {
    "id": "dragon_scale", "name": "龙鳞", "tier": 4, "price": 300,
    "stats": { "flatHp": 50 }, "desc": "+50 最大生命值"
  },
  {
    "id": "bouncing_slime", "name": "弹弹史莱姆", "tier": 4, "price": 200,
    "stats": { "percentDmg": -0.35 }, "effect": { "bounce_plus_1": 1 }, "desc": "子弹弹射+1, 但伤害-35%"
  },
  {
    "id": "spider_web_orb", "name": "蛛网球", "tier": 4, "price": 180,
    "max": 1, "effect": { "global_slow": 0.1 }, "desc": "[唯一] 场上所有敌人减速10%"
  }
];