import React from 'react';
import { PlayerStats, DraftOption, Unit, WeaponClass, UnitData, HeroUpgradeStatus } from '../types';
import { Sparkles, Sword, Zap, User, ArrowUpCircle, Flame, Target, Disc } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { UNIT_DATA } from '../data/units';
import { useGameStore } from '../store/useGameStore';

interface LevelUpModalProps {
  onSelect: (option: DraftOption) => void;
  level: number;
  isPermanent?: boolean;
}

const unitDataToDraftUnit = (w: UnitData): Partial<Unit> => ({
    name: w.name,
    emoji: w.emoji,
    type: w.type,
    baseDamage: w.baseDamage,
    maxCooldown: w.cd,
    hp: w.maxHp,
    maxHp: w.maxHp,
    range: w.range,
    description: `一个临时的 ${w.name}，仅在本波次生效。`,
    effects: w.effect,
    attackPattern: w.attackPattern,
    projectileEmoji: w.projectileEmoji,
});

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ onSelect, level, isPermanent = false }) => {
  const [options, setOptions] = React.useState<DraftOption[]>([]);
  const { heroUpgradeStatus, permanentHeroUpgradeStatus, stats } = useGameStore();

  // Define all possible next steps for each path
  const getNextUpgradeForPath = (path: keyof HeroUpgradeStatus, currentLevel: number): DraftOption | null => {
      const nextLevel = currentLevel + 1;

      switch(path) {
          case 'multishot':
              if (currentLevel === 0) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '✌️', name: '双重射击', description: '英雄每次攻击发射两枚子弹, 但伤害降低20%',
                  data: { heroAttackType: 'DOUBLE_SHOT', upgradePath: 'multishot', upgradeLevel: 1, heroDamage: -0.20 }
              };
              if (currentLevel === 1) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🔱', name: '三向射击', description: '英雄向三个方向发射子弹, 但伤害再降低20%',
                  data: { heroAttackType: 'TRI_SHOT', upgradePath: 'multishot', upgradeLevel: 2, heroDamage: -0.20 }
              };
              if (currentLevel === 2) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🖐️', name: '五向射击', description: '英雄向五个方向发射子弹, 但伤害再降低20%',
                  data: { heroAttackType: 'PENTA_SHOT', upgradePath: 'multishot', upgradeLevel: 3, heroDamage: -0.20 }
              };
              return null; // Maxed out

          case 'effect':
              if (currentLevel === 0) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🎯', name: '追踪射击', description: '英雄子弹可以追踪敌人',
                  data: { extraEffects: { is_tracking: true }, upgradePath: 'effect', upgradeLevel: 1 }
              };
              if (currentLevel === 1) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '💥', name: '爆炸射击', description: '英雄攻击引发爆炸',
                  data: { extraEffects: { explode_on_hit: 1 }, upgradePath: 'effect', upgradeLevel: 2 }
              };
              if (currentLevel === 2) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '☢️', name: '连锁反应', description: '爆炸击杀敌人会引发二次爆炸',
                  data: { extraEffects: { chain_explosion: 1 }, upgradePath: 'effect', upgradeLevel: 3 }
              };
              return null;

          case 'bounce':
              if (currentLevel === 0) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🎾', name: '弹射 I', description: '子弹弹射 1 次, 但攻速降低10%',
                  data: { extraEffects: { bounceCount: 1 }, upgradePath: 'bounce', upgradeLevel: 1, heroAttackSpeed: -0.10 }
              };
              if (currentLevel === 1) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🎱', name: '弹射 II', description: '子弹弹射次数 +1 (总计2次), 但攻速再降低10%',
                  data: { extraEffects: { bounceCount: 2 }, upgradePath: 'bounce', upgradeLevel: 2, heroAttackSpeed: -0.10 }
              };
              if (currentLevel === 2) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '💫', name: '弹射 III', description: '子弹弹射次数 +2 (总计4次), 但攻速再降低10%',
                  data: { extraEffects: { bounceCount: 4 }, upgradePath: 'bounce', upgradeLevel: 3, heroAttackSpeed: -0.10 }
              };
              if (currentLevel === 3) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🌀', name: '弹射大师', description: '子弹弹射次数 +6 (总计10次), 但攻速再降低10%',
                  data: { extraEffects: { bounceCount: 10 }, upgradePath: 'bounce', upgradeLevel: 4, heroAttackSpeed: -0.10 }
              };
              return null;

          case 'ultimate':
              if (currentLevel === 0) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🚀', name: '超频', description: '大招攻速加成提升至 +300% (4倍速)',
                  data: { extraEffects: { ult_speed_mult_bonus: 1 }, upgradePath: 'ultimate', upgradeLevel: 1 }
              };
              if (currentLevel === 1) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🔥', name: '毁灭', description: '大招期间伤害额外提升 25%',
                  data: { extraEffects: { ult_dmg_bonus: 0.25 }, upgradePath: 'ultimate', upgradeLevel: 2 }
              };
              if (currentLevel === 2) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '⏱️', name: '持久', description: '大招持续时间 +1.5秒',
                  data: { extraEffects: { ult_duration_bonus: 1.5 }, upgradePath: 'ultimate', upgradeLevel: 3 }
              };
               if (currentLevel === 3) return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '🔋', name: '虹吸', description: '大招期间每次击杀延长0.1秒持续时间',
                  data: { extraEffects: { ult_kill_extend: 0.1 }, upgradePath: 'ultimate', upgradeLevel: 4 }
              };
              return null;
              
          case 'damage':
              // Infinite Scaling Path
              return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '💪', name: `英雄蛮力 Lv.${nextLevel}`, description: '英雄伤害 +50% (独立乘区)',
                  data: { heroDamage: 0.50, upgradePath: 'damage', upgradeLevel: nextLevel }
              };
              
          case 'attackSpeed':
              // Infinite Scaling Path
              return {
                  id: uuidv4(), type: 'HERO_UPGRADE', emoji: '⚡️', name: `神经加速 Lv.${nextLevel}`, description: '英雄攻速 +30% (独立乘区)',
                  data: { heroAttackSpeed: 0.30, upgradePath: 'attackSpeed', upgradeLevel: nextLevel }
              };
              
          default: 
              return null;
      }
  };

  React.useEffect(() => {
    const finalOptions: DraftOption[] = [];
    
    // Determine which status object to use as base
    const statusSource = isPermanent ? permanentHeroUpgradeStatus : heroUpgradeStatus;

    if (isPermanent) {
        // --- PERMANENT MODE: 3 HERO UPGRADES ---
        // Strategy: Build a pool of ALL valid next steps from all paths, then pick 3 distinct ones.
        const pool: DraftOption[] = [];
        
        // Check all paths
        (['multishot', 'effect', 'bounce', 'ultimate', 'damage', 'attackSpeed'] as const).forEach(path => {
            const opt = getNextUpgradeForPath(path, statusSource[path]);
            if (opt) pool.push(opt);
        });
        
        // Shuffle pool
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        
        // Pick top 3 (or less if not enough options)
        const picks = pool.slice(0, 3);
        
        // If we somehow have fewer than 3 options (everything maxed?), fill with damage/speed
        while (picks.length < 3) {
             const fallbackType = Math.random() > 0.5 ? 'damage' : 'attackSpeed';
             const fallbackOpt = getNextUpgradeForPath(fallbackType, statusSource[fallbackType]);
             if (fallbackOpt) picks.push({ ...fallbackOpt, id: uuidv4() });
        }
        
        setOptions(picks);

    } else {
        // --- COMBAT TEMP MODE ---
        // Option 1 & 2: Hero Upgrades (using same pool logic)
        const pool: DraftOption[] = [];
        (['multishot', 'effect', 'bounce', 'ultimate', 'damage', 'attackSpeed'] as const).forEach(path => {
            const opt = getNextUpgradeForPath(path, statusSource[path]);
            if (opt) pool.push(opt);
        });
        
        // Shuffle
        for (let i = pool.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pool[i], pool[j]] = [pool[j], pool[i]];
        }
        
        // Pick 2 Hero Upgrades
        finalOptions.push(...pool.slice(0, 2));
        
        // If pool was small, fill
        while (finalOptions.length < 2) {
             const fallbackOpt = getNextUpgradeForPath('damage', statusSource['damage']);
             if (fallbackOpt) finalOptions.push({ ...fallbackOpt, id: uuidv4() });
        }

        // Option 3: Buff or another Hero Upgrade (50/50)
        if (Math.random() > 0.5 && pool.length > 2) {
            finalOptions.push(pool[2]);
        } else {
            const baseBuffOptions: Omit<DraftOption, 'id'>[] = [
                { type: 'TEMP_BUFF', name: '全体过载', emoji: '🚀', description: '本波次所有单位攻速提高 15%。', data: { attackSpeed: 0.15 } }, 
                { type: 'TEMP_BUFF', name: '战斗怒吼', emoji: '🗣️', description: '本波次所有单位伤害提高 10%。', data: { damage: 0.1 } }, 
                { type: 'TEMP_BUFF', name: '专注', emoji: '🧘', description: '大招充能速度 +25%。', data: { heroEnergyGainRate: 0.25 } } 
            ];
            const buff = baseBuffOptions[Math.floor(Math.random() * baseBuffOptions.length)];
            finalOptions.push({ ...buff, id: uuidv4() });
        }
        
        setOptions(finalOptions);
    }
    
  }, [level, heroUpgradeStatus, permanentHeroUpgradeStatus, stats, isPermanent]);

  return (
    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-8 animate-in fade-in zoom-in duration-300">
      <div className={`bg-white p-8 rounded-[40px] shadow-2xl max-w-5xl w-full border-4 ${isPermanent ? 'border-purple-400 ring-4 ring-purple-200' : 'border-white ring-4 ring-slate-200'}`}>
        <div className="text-center mb-8">
            <h2 className={`text-5xl font-black tracking-tight mb-2 ${isPermanent ? 'text-purple-600' : 'text-slate-800'}`}>
                {isPermanent ? '英雄进化' : '战场支援'}
            </h2>
            <p className="text-slate-500 font-bold">
                {isPermanent ? `英雄等级 ${level} - 选择一项永久强化` : `等级 ${level} - 选择一项增益 (本波次有效)`}
            </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {options.map((opt, idx) => (
            <button
              key={opt.id}
              onClick={() => onSelect(opt)}
              className={`group relative bg-slate-50 hover:bg-white border-4 rounded-3xl p-6 transition-all duration-200 hover:-translate-y-2 flex flex-col items-center text-center h-96 justify-between shadow-sm hover:shadow-xl
                ${isPermanent ? 'border-purple-100 hover:border-purple-400' : 'border-slate-100 hover:border-yellow-400'}
              `}
            >
              <div className={`
                 w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 group-hover:scale-110 transition-transform shadow-md ring-4 ring-white
                 ${opt.type === 'HERO_UPGRADE' ? (isPermanent ? 'bg-purple-100' : 'bg-red-100') : ''}
                 ${opt.type === 'TEMP_BUFF' ? 'bg-green-100' : ''}
              `}>
                {opt.emoji}
              </div>

              <div>
                <div className={`text-xs font-black uppercase mb-3 px-3 py-1.5 rounded-full inline-block tracking-widest
                    ${opt.type === 'HERO_UPGRADE' ? (isPermanent ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600') : ''}
                    ${opt.type === 'TEMP_BUFF' ? 'bg-green-100 text-green-600' : ''}
                `}>
                    {isPermanent ? '永久强化' : (opt.type === 'HERO_UPGRADE' ? '英雄强化' : '战术增益')}
                </div>
                <h3 className="text-2xl font-black text-slate-800 mb-2 leading-tight">{opt.name}</h3>
                <p className="text-slate-500 text-sm font-bold leading-relaxed">{opt.description}</p>
              </div>

              <div className={`w-full mt-4 py-3 rounded-xl text-xs font-black transition-colors uppercase tracking-widest
                  ${isPermanent 
                    ? 'bg-purple-200 text-purple-700 group-hover:bg-purple-500 group-hover:text-white' 
                    : 'bg-slate-200 text-slate-500 group-hover:bg-yellow-400 group-hover:text-slate-900'}
              `}>
                 确认选择
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};