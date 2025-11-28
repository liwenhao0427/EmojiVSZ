
import React from 'react';
import { PlayerStats, DraftOption, Unit, WeaponClass, UnitData, HeroUpgradeStatus } from '../types';
import { Sparkles, Sword, Zap, User, ArrowUpCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { UNIT_DATA } from '../data/units';
import { useGameStore } from '../store/useGameStore';

interface LevelUpModalProps {
  onSelect: (option: DraftOption) => void;
  level: number;
}

const unitDataToDraftUnit = (w: UnitData): Partial<Unit> => ({
    name: w.name,
    emoji: w.emoji,
    type: w.type,
    damage: w.damage,
    maxCooldown: w.cd,
    hp: w.maxHp,
    maxHp: w.maxHp,
    range: w.range,
    description: `一个临时的 ${w.name}，仅在本波次生效。`,
    effects: w.effect,
    attackPattern: w.attackPattern,
    projectileEmoji: w.projectileEmoji,
});

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ onSelect, level }) => {
  const [options, setOptions] = React.useState<DraftOption[]>([]);
  const { heroUpgradeStatus, stats } = useGameStore();

  const getHeroUpgradeOption = (): DraftOption => {
      // Pick a random path: 0=Multishot, 1=Effect, 2=Bounce
      const roll = Math.random();
      
      const { multishot, effect, bounce } = heroUpgradeStatus;

      // New Ultimate Upgrade path (Adapting to "Overdrive" mechanics)
      if (Math.random() < 0.25) { 
           const ultLevel = stats.ult_level || 0;
           if (ultLevel === 0) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '⏱️', name: '持久核心', description: '大招持续时间 +1s',
              data: { extraEffects: { ult_duration_bonus: (stats.ult_duration_bonus || 0) + 1, ult_level: 1 }, upgradePath: 'ultimate', upgradeLevel: 1 }
           };
           if (ultLevel === 1) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '⚡', name: '狂暴核心', description: '大招期间伤害 +50%',
              data: { heroDamage: 0.5, extraEffects: { ult_level: 2 }, upgradePath: 'ultimate', upgradeLevel: 2 }
           };
           if (ultLevel >= 2) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🔋', name: '快充核心', description: '大招充能速度 +50%',
              data: { heroEnergyGainRate: 0.5, extraEffects: { ult_level: ultLevel + 1 }, upgradePath: 'ultimate', upgradeLevel: ultLevel + 1 }
           };
      }


      // 1. Multishot Path
      if (roll < 0.33) {
          if (multishot === 0) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '✌️', name: '双重射击', description: '英雄每次攻击发射两枚子弹 (伤害 +20%)',
              data: { heroAttackType: 'DOUBLE_SHOT', heroDamage: 0.2, upgradePath: 'multishot', upgradeLevel: 1 }
          };
          if (multishot === 1) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🔱', name: '三向射击', description: '英雄向三个方向发射子弹 (伤害 +20%)',
              data: { heroAttackType: 'TRI_SHOT', heroDamage: 0.2, upgradePath: 'multishot', upgradeLevel: 2 }
          };
          if (multishot === 2) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🖐️', name: '五向射击', description: '英雄向五个方向发射子弹 (伤害 +30%)',
              data: { heroAttackType: 'PENTA_SHOT', heroDamage: 0.3, upgradePath: 'multishot', upgradeLevel: 3 }
          };
          // Maxed, fallback to damage
          return { id: uuidv4(), type: 'HERO_UPGRADE', emoji: '💪', name: '英雄力量', description: '英雄伤害 +50%', data: { heroDamage: 0.5 } };
      } 
      // 2. Effect Path
      else if (roll < 0.66) {
           if (effect === 0) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🎯', name: '追踪射击', description: '英雄子弹可以追踪敌人 (伤害 +10%)',
              data: { heroAttackType: 'TRACKING', heroDamage: 0.1, upgradePath: 'effect', upgradeLevel: 1 }
           };
           if (effect === 1) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🔥', name: '燃烧射击', description: '英雄攻击造成燃烧 (伤害 +10%)',
              data: { extraEffects: { burn_chance: 100 }, heroDamage: 0.1, upgradePath: 'effect', upgradeLevel: 2 }
           };
           if (effect === 2) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '💥', name: '爆炸射击', description: '英雄攻击引发爆炸 (伤害 +10%)',
              data: { extraEffects: { explode_on_hit: 1 }, heroDamage: 0.1, upgradePath: 'effect', upgradeLevel: 3 }
           };
           if (effect === 3) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '☢️', name: '连锁反应', description: '爆炸击杀敌人会引发二次爆炸 (伤害 +20%)',
              data: { extraEffects: { chain_explosion: 1 }, heroDamage: 0.2, upgradePath: 'effect', upgradeLevel: 4 }
           };
           return { id: uuidv4(), type: 'HERO_UPGRADE', emoji: '⚡️', name: '英雄过载', description: '英雄攻速 +50%', data: { heroAttackSpeed: 0.5 } };
      }
      // 3. Bounce Path
      else {
           if (bounce === 0) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🎾', name: '弹射 I', description: '子弹弹射 1 次 (伤害 +10%)',
              data: { extraEffects: { bounceCount: 1 }, heroDamage: 0.1, upgradePath: 'bounce', upgradeLevel: 1 }
           };
           if (bounce === 1) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🎱', name: '弹射 II', description: '子弹弹射次数 +1 (总计2次)',
              data: { extraEffects: { bounceCount: 2 }, heroDamage: 0.1, upgradePath: 'bounce', upgradeLevel: 2 }
           };
           if (bounce === 2) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '💫', name: '弹射 III', description: '子弹弹射次数 +2 (总计4次)',
              data: { extraEffects: { bounceCount: 4 }, heroDamage: 0.1, upgradePath: 'bounce', upgradeLevel: 3 }
           };
           if (bounce === 3) return {
              id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🌀', name: '弹射大师', description: '子弹弹射次数 +6 (总计10次)',
              data: { extraEffects: { bounceCount: 10 }, heroDamage: 0.2, upgradePath: 'bounce', upgradeLevel: 4 }
           };
           return { id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🏹', name: '精准打击', description: '英雄伤害 +40%', data: { heroDamage: 0.4 } };
      }
  };

  React.useEffect(() => {
    const allUnitOptions: Partial<Unit>[] = Object.values(UNIT_DATA).map(unitDataToDraftUnit);
    
    const baseBuffOptions: Omit<DraftOption, 'id'>[] = [
        { type: 'TEMP_BUFF', name: '全体过载', emoji: '🚀', description: '本波次所有单位攻速提高 30%。', data: { attackSpeed: 0.3 } },
        { type: 'TEMP_BUFF', name: '战斗怒吼', emoji: '🗣️', description: '本波次所有单位伤害提高 20%。', data: { damage: 0.2 } },
        { type: 'TEMP_BUFF', name: '专注', emoji: '🧘', description: '大招充能速度 +50%。', data: { heroEnergyGainRate: 0.5 } }
    ];

    const finalOptions: DraftOption[] = [];
    const usedHeroUpgrades = new Set<string>();

    const getUniqueHeroUpgrade = (): DraftOption => {
        let attempts = 0;
        while(attempts < 10) {
            const option = getHeroUpgradeOption();
            // FIX: Use the 'in' operator as a type guard to safely access properties
            // on the union type `option.data`. This ensures that we only access
            // `upgradePath` and `upgradeLevel` when they exist on the object.
            const key = 'upgradePath' in option.data && option.data.upgradePath ? `${option.data.upgradePath}_${option.data.upgradeLevel}` : option.name;
            if (!usedHeroUpgrades.has(key)) {
                usedHeroUpgrades.add(key);
                return option;
            }
            attempts++;
        }
        // Fallback if we can't find a unique one
        return { id: uuidv4(), type: 'HERO_UPGRADE', emoji: '💪', name: '英雄力量', description: '英雄伤害 +50%', data: { heroDamage: 0.5 } };
    };

    // Option 1: Mercenary
    const unitTemplate = allUnitOptions[Math.floor(Math.random() * allUnitOptions.length)];
    finalOptions.push({
        id: uuidv4(),
        type: 'TEMP_UNIT',
        name: `雇佣兵: ${unitTemplate.name}`,
        emoji: unitTemplate.emoji || '❓',
        description: unitTemplate.description || '部署一个强大的单位，仅限本波次使用。',
        data: unitTemplate
    });

    // Option 2: Hero Upgrade
    finalOptions.push(getUniqueHeroUpgrade());

    // Option 3: Temp Buff or another Hero Upgrade
    if (Math.random() > 0.4) {
        finalOptions.push(getUniqueHeroUpgrade());
    } else {
        const buff = baseBuffOptions[Math.floor(Math.random() * baseBuffOptions.length)];
        finalOptions.push({ ...buff, id: uuidv4() });
    }
    
    setOptions(finalOptions);
  }, [level, heroUpgradeStatus, stats]);

  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-5xl w-full border border-gray-700">
        <div className="text-center mb-8">
            <h2 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-red-500 animate-pulse">
                战场支援
            </h2>
            <p className="text-gray-400 mt-2">等级 {level} - 选择一项增益 (本波次有效)</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((opt, idx) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className="group relative bg-gray-700 hover:bg-gray-600 border-2 border-gray-600 hover:border-yellow-500 rounded-xl p-6 transition-all duration-200 hover:-translate-y-2 flex flex-col items-center text-center h-96 justify-between"
            >
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-100 transition-opacity">
                 <Sparkles className="text-yellow-400" />
              </div>

              <div className={`
                 w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 group-hover:scale-110 transition-transform shadow-lg ring-4 
                 ${opt.type === 'TEMP_UNIT' ? 'bg-blue-900 ring-blue-700 group-hover:ring-blue-400' : ''}
                 ${opt.type === 'HERO_UPGRADE' ? 'bg-red-900 ring-red-700 group-hover:ring-red-400' : ''}
                 ${opt.type === 'TEMP_BUFF' ? 'bg-green-900 ring-green-700 group-hover:ring-green-400' : ''}
              `}>
                {opt.emoji}
              </div>

              <div>
                <div className={`text-xs font-bold uppercase mb-2 px-3 py-1 rounded-full inline-block
                    ${opt.type === 'TEMP_UNIT' ? 'bg-blue-900 text-blue-300' : ''}
                    ${opt.type === 'HERO_UPGRADE' ? 'bg-red-900 text-red-300' : ''}
                    ${opt.type === 'TEMP_BUFF' ? 'bg-green-900 text-green-300' : ''}
                `}>
                    {opt.type === 'TEMP_UNIT' ? '雇佣兵' : opt.type === 'HERO_UPGRADE' ? '英雄强化' : '战术增益'}
                </div>
                <h3 className="text-2xl font-bold text-white mb-2 leading-tight">{opt.name}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">{opt.description}</p>
              </div>

              <div className="w-full mt-4 py-3 bg-gray-800 rounded group-hover:bg-yellow-600 text-xs font-mono text-gray-400 group-hover:text-white transition-colors uppercase tracking-widest font-bold">
                 确认选择
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
