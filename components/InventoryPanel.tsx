
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
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-60 bg-slate-900 border-2 rounded-lg p-3 shadow-2xl z-50 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity" style={{ borderColor: color }}>
      <div className="font-bold text-lg" style={{ color }}>{item.name}</div>
      <div className="text-xs font-mono uppercase mb-2" style={{ color }}>Tier {item.tier} - {rarity}</div>
      <p className="text-sm text-gray-300">{item.desc}</p>
      {item.max && <p className="text-xs text-yellow-400 mt-2">Max: {item.max}</p>}
    </div>
  );
};


export const InventoryPanel: React.FC = () => {
  const { ownedItems, allItems } = useGameStore();

  const groupedItems = useMemo<GroupedItem[]>(() => {
    const itemMap = new Map(allItems.map(i => [i.id, i]));
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
    <div className="absolute bottom-4 left-4 glass-panel p-3 rounded-xl z-30 max-w-sm pointer-events-auto animate-in fade-in slide-in-from-bottom duration-300">
      <h3 className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
        <Briefcase size={14}/> Inventory
      </h3>
      <div className="flex flex-wrap gap-2">
        {groupedItems.map(({ item, count }) => {
           const rarity = TIER_TO_RARITY[item.tier];
           const color = RARITY_COLORS[rarity];
          return (
            <div key={item.id} className="relative group">
                <div className="w-12 h-12 bg-slate-800 border-2 rounded-lg flex items-center justify-center font-bold text-lg shadow-md" style={{ borderColor: color }}>
                    {item.name.charAt(0)}
                </div>
                {count > 1 && (
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-black text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900">
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
