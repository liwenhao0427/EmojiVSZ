
import React, { useMemo } from 'react';
import { useGameStore } from '../store/useGameStore';
import { BrotatoItem } from '../types';
import { TIER_TO_RARITY, RARITY_COLORS } from '../constants';
import { Briefcase } from 'lucide-react';

interface GroupedItem {
  item: BrotatoItem;
  count: number;
}

const ItemTooltip: React.FC<{ item: BrotatoItem }> = ({ item }) => {
  const rarity = TIER_TO_RARITY[item.tier];
  const color = RARITY_COLORS[rarity];
  return (
    <div className="absolute bottom-full left-0 mb-3 w-64 bg-white border-2 rounded-xl p-4 shadow-xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: color }}>
      <div className="font-black text-lg mb-1" style={{ color }}>{item.name}</div>
      <div className="text-[10px] font-bold uppercase mb-2 bg-slate-100 px-2 py-0.5 rounded inline-block text-slate-500">等级 {item.tier} - {rarity}</div>
      <p className="text-sm font-bold text-slate-600 leading-relaxed">{item.desc}</p>
      {item.max && <p className="text-xs font-bold text-yellow-500 mt-2">上限: {item.max}</p>}
    </div>
  );
};


export const InventoryPanel: React.FC = () => {
  const { ownedItems, allItems } = useGameStore();

  const groupedItems = useMemo<GroupedItem[]>(() => {
    const itemMap = new Map<string, BrotatoItem>(allItems.map(i => [i.id, i]));
    const groups: GroupedItem[] = [];
    for (const itemId in ownedItems) {
      const item = itemMap.get(itemId);
      if (item) {
        groups.push({ item, count: ownedItems[itemId] });
      }
    }
    return groups.sort((a,b) => b.item.tier - a.item.tier);
  }, [ownedItems, allItems]);

  if (groupedItems.length === 0) {
    return null;
  }

  return (
    <div className="absolute bottom-8 left-8 glass-panel p-4 rounded-3xl z-30 max-w-sm pointer-events-auto animate-in fade-in slide-in-from-bottom duration-300 shadow-xl border-2 border-white">
      <h3 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest mb-3 border-b border-slate-100 pb-2">
        <Briefcase size={14}/> 背包
      </h3>
      <div className="flex flex-wrap gap-3">
        {groupedItems.map(({ item, count }) => {
           const rarity = TIER_TO_RARITY[item.tier];
           const color = RARITY_COLORS[rarity];
          return (
            <div key={item.id} className="relative group cursor-help">
                <div className="w-14 h-14 bg-white border-2 rounded-xl flex items-center justify-center font-bold text-2xl shadow-sm hover:scale-110 transition-transform" style={{ borderColor: color }}>
                    {item.name.charAt(0)}
                </div>
                {count > 1 && (
                    <div className="absolute -top-2 -right-2 bg-yellow-400 text-slate-900 text-xs font-black w-6 h-6 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                        {count}
                    </div>
                )}
                <ItemTooltip item={item} />
            </div>
          )
        })}
      </div>
    </div>
  );
};