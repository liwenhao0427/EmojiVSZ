import React, { useState } from 'react';
import { AmmoItem } from '../../types';
import { RARITY_COLORS, KEYWORD_DEFINITIONS, AMMO_TYPE_MAP } from '../../constants';
import { ShieldAlert, Move, Timer, Info } from 'lucide-react';
import { useGameStore } from '../../store/useGameStore';

const KeywordSpan: React.FC<{ word: string }> = ({ word }) => {
  const [hovered, setHovered] = useState(false);
  const def = KEYWORD_DEFINITIONS[word];

  if (!def) return <span>{word}</span>;

  return (
    <span 
      className="relative text-cyan-300 font-bold cursor-help underline decoration-dotted underline-offset-4"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {word}
      {hovered && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 bg-black/90 border border-cyan-500/50 text-white text-xs p-2 rounded shadow-xl z-50 pointer-events-none whitespace-normal">
          {def}
        </div>
      )}
    </span>
  );
};

export const AmmoDetailCard: React.FC<{ item: AmmoItem; isPinned: boolean; onClose: () => void }> = ({ item, isPinned, onClose }) => {
  const { stats } = useGameStore();
  
  // Calculate final stats
  let flatBonus = 0;
  if (item.weaponClass === 'MELEE') flatBonus = stats.meleeDmg;
  if (item.weaponClass === 'RANGED') flatBonus = stats.rangedDmg;
  if (item.weaponClass === 'MAGIC') flatBonus = stats.elementalDmg; 
  if (item.weaponClass === 'ENGINEERING') flatBonus = stats.engineering || 0;
  const finalDamage = Math.round((item.damage + flatBonus) * (1 + (stats.damagePercent || 0)));

  const finalCooldown = item.cooldown / (1 + (stats.attackSpeed || 0));

  const generateDescription = () => {
      // Use the static description from constants if available
      const baseDesc = item.description || `发射${AMMO_TYPE_MAP[item.type]}弹药。`;
      
      const keywords = Object.keys(KEYWORD_DEFINITIONS);
      const regex = new RegExp(`(${keywords.join('|')})`, 'g');
      
      const parts: React.ReactNode[] = [];
      const split = baseDesc.split(regex);
      
      split.forEach((part, i) => {
         if (keywords.includes(part)) {
             parts.push(<KeywordSpan key={i} word={part} />);
         } else if (part) {
             parts.push(<span key={i}>{part}</span>);
         }
      });
      
      return parts;
  };

  return (
    <div className={`
      absolute left-full top-0 ml-4 w-72 bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.8)] z-50
      transition-all duration-300 animate-in fade-in slide-in-from-left-4
      ${isPinned ? 'ring-2 ring-yellow-400/50' : ''}
    `}>
        <div className="flex items-center gap-3 mb-4 border-b border-white/10 pb-3">
             <div 
               className="w-12 h-12 rounded-lg flex items-center justify-center text-3xl bg-slate-800 border"
               style={{ borderColor: RARITY_COLORS[item.rarity || 'COMMON'] }}
             >
                {item.emoji}
             </div>
             <div>
                 <h3 className="font-bold text-white text-lg">{item.name}</h3>
                 <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800" style={{ color: RARITY_COLORS[item.rarity || 'COMMON'] }}>
                    {item.rarity || 'COMMON'}
                 </span>
             </div>
             {isPinned && (
                 <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="ml-auto text-gray-500 hover:text-white">✕</button>
             )}
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
            {/* DAMAGE */}
            <div className="bg-slate-800/50 p-2 rounded flex items-center gap-2 group relative">
                <ShieldAlert size={14} className="text-red-400" />
                <div>
                    <div className="text-gray-400">伤害</div>
                    <div className="text-white font-mono text-sm">{finalDamage}</div>
                </div>
                {/* Tooltip */}
                <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-full bg-black/90 p-2 rounded border border-white/10 z-10 whitespace-nowrap">
                    Base: {item.damage} <br/>
                    + Flat: {flatBonus} <br/>
                    x Pct: {((1 + (stats.damagePercent || 0)) * 100).toFixed(0)}%
                </div>
            </div>

            {/* ATTACK SPEED */}
            <div className="bg-slate-800/50 p-2 rounded flex items-center gap-2 group relative">
                <Move size={14} className="text-blue-400" />
                <div>
                    <div className="text-gray-400">攻速</div>
                    <div className="text-white font-mono text-sm">{finalCooldown.toFixed(2)}s</div>
                </div>
                 {/* Tooltip */}
                 <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-full bg-black/90 p-2 rounded border border-white/10 z-10 whitespace-nowrap">
                    Base: {item.cooldown}s <br/>
                    Player Spd: {((1 + (stats.attackSpeed || 0)) * 100).toFixed(0)}% <br/>
                    Formula: {item.cooldown} / {(1 + (stats.attackSpeed || 0)).toFixed(2)}
                </div>
            </div>

            {/* DURATION */}
             <div className="bg-slate-800/50 p-2 rounded flex items-center gap-2">
                <Timer size={14} className="text-yellow-400" />
                <div>
                    <div className="text-gray-400"><KeywordSpan word="持续" /></div>
                    <div className="text-white font-mono text-sm">
                        {item.duration ? `${item.duration}s` : '∞'}
                    </div>
                </div>
            </div>

            {/* TYPE */}
            <div className="bg-slate-800/50 p-2 rounded flex items-center gap-2 group relative">
                <Info size={14} className="text-purple-400" />
                <div>
                    <div className="text-gray-400">类型</div>
                    <div className="text-white font-mono text-sm">{item.weaponClass}</div>
                </div>
                 {/* Tooltip */}
                 <div className="hidden group-hover:block absolute bottom-full left-0 mb-2 w-full bg-black/90 p-2 rounded border border-white/10 z-10">
                    {item.weaponClass === 'MELEE' && "Benefits from Melee Damage."}
                    {item.weaponClass === 'RANGED' && "Benefits from Ranged Damage."}
                    {item.weaponClass === 'MAGIC' && "Benefits from Elemental Damage."}
                    {item.weaponClass === 'ENGINEERING' && "Benefits from Engineering."}
                </div>
            </div>
        </div>

        <div className="text-sm text-gray-300 leading-relaxed bg-black/30 p-3 rounded border border-white/5">
            {generateDescription()}
        </div>
        
        {!isPinned && <div className="mt-2 text-[10px] text-gray-500 text-center italic">Click to pin details</div>}
    </div>
  );
};