
import { BrotatoItem } from "../types";

export const ITEMS_DATA: BrotatoItem[] = [
  {
    "id": "book",
    "name": "书",
    "tier": 1,
    "price": 8,
    "stats": { "engineering": 1 },
    "desc": "+1 工程学"
  },
  {
    "id": "boxing_glove",
    "name": "拳击手套",
    "tier": 1,
    "price": 15,
    "stats": { "knockback": 3 },
    "desc": "+3 击退"
  },
  {
    "id": "charcoal",
    "name": "木炭",
    "tier": 1,
    "price": 20,
    "stats": { "elementalDmg": 1, "meleeDmg": 2, "harvesting": -2 },
    "desc": "+1 元素伤害, +2 近战伤害, -2 收获"
  },
  {
    "id": "coffee",
    "name": "咖啡",
    "tier": 1,
    "price": 15,
    "stats": { "atkSpeed": 0.10, "percentDmg": -0.02 },
    "desc": "+10% 攻击速度, -2% 伤害"
  },
  {
    "id": "coupon",
    "name": "优惠券",
    "tier": 1,
    "price": 15,
    "max": 5,
    "effect": { "shop_discount": 5 },
    "desc": "商店价格 -5% (最大5个)"
  },
  {
    "id": "cyberball",
    "name": "赛博球",
    "tier": 1,
    "price": 30,
    "max": 4,
    "effect": { "chain_death_dmg_chance": 25 },
    "desc": "敌人死亡时 25% 概率对随机敌人造成伤害 (最大4个)"
  },
  {
    "id": "dynamite",
    "name": "炸药",
    "tier": 1,
    "price": 20,
    "effect": { "explosion_dmg": 15 },
    "desc": "+15% 爆炸伤害"
  },
  {
    "id": "fertilizer",
    "name": "化肥",
    "tier": 1,
    "price": 15,
    "stats": { "harvesting": 8, "meleeDmg": -1 },
    "desc": "+8 收获, -1 近战伤害"
  },
  {
    "id": "gentle_alien",
    "name": "温柔外星人",
    "tier": 1,
    "price": 30,
    "max": 10,
    "stats": { "percentDmg": 0.05 },
    "effect": { "enemy_count": 5 },
    "desc": "+5% 伤害, 敌人数量 +5%"
  },
  {
    "id": "goat_skull",
    "name": "山羊头骨",
    "tier": 1,
    "price": 25,
    "stats": { "meleeDmg": 3, "crit": -0.02 },
    "desc": "+3 近战伤害, -2% 暴击率"
  },
  {
    "id": "hedgehog",
    "name": "刺猬",
    "tier": 1,
    "price": 30,
    "stats": { "meleeDmg": 2, "rangedDmg": 1 },
    "desc": "+2 近战伤害, +1 远程伤害"
  },
  {
    "id": "injection",
    "name": "针剂",
    "tier": 1,
    "price": 20,
    "stats": { "percentDmg": 0.07 },
    "desc": "+7% 伤害"
  },
  {
    "id": "insanity",
    "name": "疯狂",
    "tier": 1,
    "price": 20,
    "stats": { "crit": 0.06, "percentDmg": -0.03 },
    "desc": "+6% 暴击率, -3% 伤害"
  },
  {
    "id": "lens",
    "name": "透镜",
    "tier": 1,
    "price": 20,
    "stats": { "rangedDmg": 1 },
    "desc": "+1 远程伤害"
  },
  {
    "id": "lost_duck",
    "name": "丢失的鸭子",
    "tier": 1,
    "price": 25,
    "stats": { "luck": 10, "elementalDmg": -1 },
    "desc": "+10 幸运, -1 元素伤害"
  },
  {
    "id": "mutation",
    "name": "突变",
    "tier": 1,
    "price": 25,
    "stats": { "rangedDmg": 1, "elementalDmg": 1 },
    "desc": "+1 远程伤害, +1 元素伤害"
  },
  {
    "id": "pencil",
    "name": "铅笔",
    "tier": 1,
    "price": 15,
    "stats": { "engineering": 2, "atkSpeed": -0.01, "crit": -0.01 },
    "desc": "+2 工程学, -1% 攻速/暴击"
  },
  {
    "id": "propeller_hat",
    "name": "螺旋桨帽",
    "tier": 1,
    "price": 28,
    "stats": { "luck": 10, "percentDmg": -0.02 },
    "desc": "+10 幸运, -2% 伤害"
  },
  {
    "id": "scar",
    "name": "伤疤",
    "tier": 1,
    "price": 30,
    "stats": { "xpGain": 0.15 },
    "desc": "+15% 经验获取"
  },
  {
    "id": "scared_sausage",
    "name": "害怕的香肠",
    "tier": 1,
    "price": 25,
    "max": 4,
    "effect": { "burn_chance": 25 },
    "desc": "攻击 25% 概率附加燃烧 (最大4个)"
  },
  {
    "id": "snake",
    "name": "蛇",
    "tier": 1,
    "price": 25,
    "max": 1,
    "effect": { "burn_spread": 1 },
    "desc": "【唯一】燃烧效果传导至附近的一个敌人"
  },
  {
    "id": "toxic_sludge",
    "name": "有毒污泥",
    "tier": 1,
    "price": 20,
    "stats": { "elementalDmg": 2 },
    "desc": "+2 元素伤害"
  },
  {
    "id": "ugly_tooth",
    "name": "丑牙",
    "tier": 1,
    "price": 25,
    "max": 1,
    "effect": { "slow_on_hit": 1 },
    "desc": "【唯一】击中敌人时移除其 10% 速度"
  },
  {
    "id": "alien_eyes",
    "name": "外星眼",
    "tier": 2,
    "price": 50,
    "effect": { "alien_eyes_count": 6 },
    "desc": "每5秒向周围发射 6 个外星眼 (50% 伤害)"
  },
  {
    "id": "banner",
    "name": "旗帜",
    "tier": 2,
    "price": 55,
    "stats": { "atkSpeed": 0.10 },
    "desc": "+10% 攻速"
  },
  {
    "id": "black_belt",
    "name": "黑带",
    "tier": 2,
    "price": 55,
    "stats": { "xpGain": 0.15, "meleeDmg": 3, "luck": -8 },
    "desc": "+15% 经验, +3 近战, -8 幸运"
  },
  {
    "id": "blindfold",
    "name": "眼罩",
    "tier": 2,
    "price": 45,
    "stats": { "crit": 0.05 },
    "desc": "+5% 暴击"
  },
  {
    "id": "cog",
    "name": "齿轮",
    "tier": 2,
    "price": 35,
    "stats": { "engineering": 4, "percentDmg": -0.04 },
    "desc": "+4 工程学, -4% 伤害"
  },
  {
    "id": "compass",
    "name": "指南针",
    "tier": 2,
    "price": 40,
    "stats": { "engineering": 3, "crit": -0.03 },
    "desc": "+3 工程学, -3% 暴击"
  },
  {
    "id": "cyclops_worm",
    "name": "独眼蠕虫",
    "tier": 2,
    "price": 45,
    "stats": { "percentDmg": 0.12 },
    "desc": "+12% 伤害"
  },
  {
    "id": "dangerous_bunny",
    "name": "危险兔子",
    "tier": 2,
    "price": 35,
    "max": 3,
    "effect": { "free_reroll": 1 },
    "desc": "商店免费刷新一次 (最大3个)"
  },
  {
    "id": "energy_bracelet",
    "name": "能量手环",
    "tier": 2,
    "price": 55,
    "stats": { "crit": 0.04, "elementalDmg": 2, "rangedDmg": -2 },
    "desc": "+4% 暴击, +2 元素, -2 远程"
  },
  {
    "id": "fuel_tank",
    "name": "燃料箱",
    "tier": 2,
    "price": 45,
    "stats": { "elementalDmg": 4, "meleeDmg": -1, "rangedDmg": -1 },
    "desc": "+4 元素伤害, 降低近战/远程"
  },
  {
    "id": "little_frog",
    "name": "小青蛙",
    "tier": 2,
    "price": 50,
    "stats": { "harvesting": 10 },
    "desc": "+10 收获"
  },
  {
    "id": "little_muscley_dude",
    "name": "肌肉小人",
    "tier": 2,
    "price": 50,
    "stats": { "meleeDmg": 3 },
    "desc": "+3 近战伤害"
  },
  {
    "id": "mastery",
    "name": "精通",
    "tier": 2,
    "price": 55,
    "stats": { "meleeDmg": 6, "rangedDmg": -3 },
    "desc": "+6 近战伤害, -3 远程伤害"
  },
  {
    "id": "medal",
    "name": "奖牌",
    "tier": 2,
    "price": 55,
    "stats": { "percentDmg": 0.03, "crit": -0.04 },
    "desc": "+3% 伤害, -4% 暴击"
  },
  {
    "id": "metal_detector",
    "name": "金属探测器",
    "tier": 2,
    "price": 40,
    "stats": { "luck": 6, "engineering": 2, "percentDmg": -0.05 },
    "effect": { "double_material_chance": 5 },
    "desc": "材料翻倍概率 +5%, +6 幸运"
  },
  {
    "id": "metal_plate",
    "name": "金属板",
    "tier": 2,
    "price": 40,
    "stats": { "percentDmg": -0.03 },
    "desc": "-3% 伤害"
  },
  {
    "id": "missile",
    "name": "导弹",
    "tier": 2,
    "price": 45,
    "stats": { "percentDmg": 0.10, "atkSpeed": -0.06 },
    "desc": "+10% 伤害, -6% 攻速"
  },
  {
    "id": "piggy_bank",
    "name": "存钱罐",
    "tier": 2,
    "price": 40,
    "effect": { "piggy_bank_savings": 20 },
    "desc": "波次开始获得 20% 存款利息"
  },
  {
    "id": "pumpkin",
    "name": "南瓜",
    "tier": 2,
    "price": 40,
    "stats": { "percentDmg": -0.02 },
    "effect": { "pierce_damage": 15 },
    "desc": "贯穿伤害 +15%, -2% 伤害"
  },
  {
    "id": "ritual",
    "name": "仪式",
    "tier": 2,
    "price": 60,
    "stats": { "percentDmg": 0.06, "engineering": -2 },
    "desc": "+6% 伤害, -2 工程"
  },
  {
    "id": "scope",
    "name": "瞄准镜",
    "tier": 2,
    "price": 55,
    "stats": { "rangedDmg": 2, "atkSpeed": -0.07 },
    "desc": "+2 远程, -7% 攻速"
  },
  {
    "id": "shady_potion",
    "name": "可疑药水",
    "tier": 2,
    "price": 48,
    "stats": { "luck": 20 },
    "desc": "+20 幸运"
  },
  {
    "id": "small_magazine",
    "name": "小弹夹",
    "tier": 2,
    "price": 60,
    "stats": { "rangedDmg": 2, "atkSpeed": 0.10, "percentDmg": -0.06 },
    "desc": "+2 远程, +10% 攻速, -6% 伤害"
  },
  {
    "id": "sunglasses",
    "name": "墨镜",
    "tier": 2,
    "price": 50,
    "stats": { "crit": 0.10 },
    "desc": "+10% 暴击率"
  },
  {
    "id": "wheelbarrow",
    "name": "独轮车",
    "tier": 2,
    "price": 40,
    "stats": { "harvesting": 16 },
    "desc": "+16 收获"
  },
  {
    "id": "whetstone",
    "name": "磨刀石",
    "tier": 2,
    "price": 40,
    "stats": { "knockback": -3 },
    "desc": "-3 击退"
  },
  {
    "id": "white_flag",
    "name": "白旗",
    "tier": 2,
    "price": 40,
    "stats": { "harvesting": 5 },
    "effect": { "enemy_count": -5 },
    "desc": "+5 收获, 敌人数量 -5%"
  },
  {
    "id": "alloy",
    "name": "合金",
    "tier": 3,
    "price": 80,
    "stats": { "meleeDmg": 3, "rangedDmg": 3, "engineering": 3, "crit": 0.05 },
    "desc": "全伤害属性提升 +3, +5% 暴击"
  },
  {
    "id": "baby_with_a_beard",
    "name": "长胡子的婴儿",
    "tier": 3,
    "price": 95,
    "effect": { "corpse_bullet": 1 },
    "desc": "敌人死亡时尸体发射 1 发子弹"
  },
  {
    "id": "bandana",
    "name": "头巾",
    "tier": 3,
    "price": 75,
    "max": 1,
    "stats": { "percentDmg": -0.10 },
    "effect": { "projectile_pierce": 1 },
    "desc": "【唯一】子弹穿透 +1, -10% 伤害"
  },
  {
    "id": "bean_teacher",
    "name": "豆老师",
    "tier": 3,
    "price": 70,
    "stats": { "xpGain": 0.30 },
    "desc": "+30% 经验获取"
  },
  {
    "id": "blood_donation",
    "name": "献血",
    "tier": 3,
    "price": 50,
    "stats": { "harvesting": 40 },
    "desc": "+40 收获"
  },
  {
    "id": "bowler_hat",
    "name": "圆顶硬礼帽",
    "tier": 3,
    "price": 75,
    "stats": { "luck": 15, "harvesting": 18, "atkSpeed": -0.05, "crit": -0.03 },
    "desc": "+15 幸运, +18 收获, -5% 攻速"
  },
  {
    "id": "candle",
    "name": "蜡烛",
    "tier": 3,
    "price": 65,
    "stats": { "elementalDmg": 4, "percentDmg": -0.05 },
    "effect": { "enemy_count": -10 },
    "desc": "+4 元素, 敌人数量 -10%"
  },
  {
    "id": "clover",
    "name": "三叶草",
    "tier": 3,
    "price": 65,
    "stats": { "luck": 20 },
    "desc": "+20 幸运"
  },
  {
    "id": "community_support",
    "name": "社区支持",
    "tier": 3,
    "price": 65,
    "effect": { "atk_spd_per_enemy": 1 },
    "desc": "每个存活敌人提供 +1% 攻速"
  },
  {
    "id": "crown",
    "name": "王冠",
    "tier": 3,
    "price": 70,
    "max": 1,
    "effect": { "harvesting_growth": 8 },
    "desc": "【唯一】波次结束时收获额外增加 8%"
  },
  {
    "id": "glass_cannon",
    "name": "玻璃大炮",
    "tier": 3,
    "price": 75,
    "stats": { "percentDmg": 0.25 },
    "desc": "+25% 伤害"
  },
  {
    "id": "handcuffs",
    "name": "手铐",
    "tier": 3,
    "price": 80,
    "stats": { "meleeDmg": 8, "rangedDmg": 8, "elementalDmg": 8 },
    "desc": "全伤害 +8"
  },
  {
    "id": "hunting_trophy",
    "name": "狩猎战利品",
    "tier": 3,
    "price": 55,
    "max": 3,
    "effect": { "crit_gold_chance": 33 },
    "desc": "暴击击杀 33% 概率掉落 1 金币 (最大3个)"
  },
  {
    "id": "lucky_charm",
    "name": "幸运护符",
    "tier": 3,
    "price": 75,
    "stats": { "luck": 30, "meleeDmg": -2, "rangedDmg": -1 },
    "desc": "+30 幸运, 降低近战/远程"
  },
  {
    "id": "mouse",
    "name": "老鼠",
    "tier": 3,
    "price": 55,
    "stats": { "harvesting": -5 },
    "effect": { "enemy_count": 10 },
    "desc": "敌人数量 +10%, -5 收获"
  },
  {
    "id": "plastic_explosive",
    "name": "塑料炸药",
    "tier": 3,
    "price": 60,
    "effect": { "explosion_size": 25 },
    "desc": "爆炸范围 +25%"
  },
  {
    "id": "poisonous_tonic",
    "name": "有毒补剂",
    "tier": 3,
    "price": 80,
    "stats": { "atkSpeed": 0.10, "crit": 0.05 },
    "desc": "+10% 攻速, +5% 暴击"
  },
  {
    "id": "rip_and_tear",
    "name": "撕裂",
    "tier": 3,
    "price": 65,
    "stats": { "harvesting": -12 },
    "effect": { "explode_on_death_chance": 100 },
    "desc": "敌人死亡时爆炸概率 +100%"
  },
  {
    "id": "shmoop",
    "name": "舒慕普",
    "tier": 3,
    "price": 60,
    "stats": { "meleeDmg": -2, "rangedDmg": -1 },
    "desc": "降低近战/远程伤害"
  },
  {
    "id": "statue",
    "name": "雕像",
    "tier": 3,
    "price": 85,
    "effect": { "stationary_dmg": 25 },
    "desc": "静止时伤害 +25%"
  },
  {
    "id": "strange_book",
    "name": "奇怪的书",
    "tier": 3,
    "price": 70,
    "stats": { "meleeDmg": -1, "rangedDmg": -1 },
    "effect": { "ele_to_eng": 1 },
    "desc": "每 1 点元素伤害增加 1 点工程学"
  },
  {
    "id": "toolbox",
    "name": "工具箱",
    "tier": 3,
    "price": 55,
    "stats": { "engineering": 6, "atkSpeed": -0.08 },
    "desc": "+6 工程学, -8% 攻速"
  },
  {
    "id": "tractor",
    "name": "拖拉机",
    "tier": 3,
    "price": 70,
    "stats": { "harvesting": 40, "percentDmg": -0.08 },
    "desc": "+40 收获, -8% 伤害"
  },
  {
    "id": "triangle_of_power",
    "name": "力量三角",
    "tier": 3,
    "price": 65,
    "stats": { "percentDmg": 0.20 },
    "desc": "+20% 伤害"
  },
  {
    "id": "vigilante_ring",
    "name": "义务警员戒指",
    "tier": 3,
    "price": 92,
    "effect": { "dmg_growth": 3 },
    "desc": "每波次结束 +3% 伤害 (无限叠加)"
  },
  {
    "id": "wheat",
    "name": "小麦",
    "tier": 3,
    "price": 85,
    "stats": { "meleeDmg": 4, "rangedDmg": 2, "harvesting": 10, "elementalDmg": -2 },
    "desc": "+4 近战, +2 远程, +10 收获"
  },
  {
    "id": "wisdom",
    "name": "智慧",
    "tier": 3,
    "price": 85,
    "stats": { "percentDmg": -0.20 },
    "effect": { "dmg_over_time": 5 },
    "desc": "伤害随时间增长, 初始 -20%"
  },
  {
    "id": "big_arms",
    "name": "粗壮手臂",
    "tier": 4,
    "price": 105,
    "stats": { "meleeDmg": 10, "rangedDmg": 5 },
    "desc": "+10 近战, +5 远程"
  },
  {
    "id": "diploma",
    "name": "文凭",
    "tier": 4,
    "price": 80,
    "stats": { "engineering": 10, "xpGain": 0.10 },
    "desc": "+10 工程学, +10% 经验"
  },
  {
    "id": "explosive_shells",
    "name": "爆炸弹",
    "tier": 4,
    "price": 100,
    "stats": { "percentDmg": -0.15 },
    "effect": { "explosion_dmg": 60 },
    "desc": "+60% 爆炸伤害, -15% 伤害"
  },
  {
    "id": "gnome",
    "name": "侏儒",
    "tier": 4,
    "price": 100,
    "stats": { "meleeDmg": 10, "elementalDmg": 5 },
    "desc": "+10 近战, +5 元素"
  },
  {
    "id": "heavy_bullets",
    "name": "重型子弹",
    "tier": 4,
    "price": 100,
    "stats": { "rangedDmg": 5, "percentDmg": 0.10, "atkSpeed": -0.10, "crit": -0.05 },
    "desc": "+5 远程, +10% 伤害, -10% 攻速"
  },
  {
    "id": "mammoth",
    "name": "猛犸象",
    "tier": 4,
    "price": 115,
    "stats": { "meleeDmg": 15, "percentDmg": -0.08 },
    "desc": "+15 近战, -8% 伤害"
  },
  {
    "id": "night_goggles",
    "name": "夜视仪",
    "tier": 4,
    "price": 90,
    "stats": { "crit": 0.15 },
    "desc": "+15% 暴击"
  },
  {
    "id": "octopus",
    "name": "章鱼",
    "tier": 4,
    "price": 105,
    "stats": { "crit": -0.08 },
    "desc": "-8% 暴击"
  },
  {
    "id": "panda",
    "name": "熊猫",
    "tier": 4,
    "price": 100,
    "stats": { "luck": 25, "percentDmg": -0.12 },
    "desc": "+25 幸运, -12% 伤害"
  },
  {
    "id": "ricochet",
    "name": "跳弹",
    "tier": 4,
    "price": 100,
    "stats": { "percentDmg": -0.35 },
    "effect": { "bounce_plus_1": 1 },
    "desc": "子弹弹射 +1, -35% 伤害"
  },
  {
    "id": "robot_arm",
    "name": "机械臂",
    "tier": 4,
    "price": 90,
    "stats": { "engineering": 6 },
    "desc": "+6 工程"
  },
  {
    "id": "wolf_helmet",
    "name": "狼头盔",
    "tier": 4,
    "price": 80,
    "stats": { "elementalDmg": 8, "luck": 15, "engineering": -5 },
    "desc": "+8 元素, +15 幸运, -5 工程"
  }
];
