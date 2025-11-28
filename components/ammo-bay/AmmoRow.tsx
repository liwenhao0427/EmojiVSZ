

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AmmoItem } from '../../types';
import { RARITY_COLORS } from '../../constants';

export function SortableAmmo({ 
    id, 
    item, 
    onHover, 
    onLeave, 
    onClick 
}: { 
    id: string; 
    item: AmmoItem; 
    onHover: (item: AmmoItem) => void; 
    onLeave: () => void;
    onClick: (item: AmmoItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.0 : 1, 
  };

  const rarityColor = item.rarity ? RARITY_COLORS[item.rarity] : RARITY_COLORS.COMMON;

  return (
    <div
      ref={setNodeRef}
      style={{...style, borderColor: rarityColor, boxShadow: `0 0 8px ${rarityColor}20`}}
      {...attributes}
      {...listeners}
      onMouseEnter={() => onHover(item)}
      onMouseLeave={onLeave}
      onClick={(e) => {
        e.stopPropagation();
        onClick(item);
      }}
      className={`
        w-10 h-10 md:w-12 md:h-12 
        bg-slate-900/90 backdrop-blur border rounded-lg
        flex items-center justify-center text-2xl cursor-grab active:cursor-grabbing
        hover:scale-110 hover:z-10 transition-all select-none
        relative group shrink-0
      `}
    >
      {item.emoji}
    </div>
  );
}

export function AmmoRow({ 
    id, 
    items, 
    label,
    onItemHover,
    onItemLeave,
    onItemClick
}: { 
    id: string; 
    items: AmmoItem[]; 
    label: number;
    onItemHover: (item: AmmoItem) => void;
    onItemLeave: () => void;
    onItemClick: (item: AmmoItem) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div 
      ref={setNodeRef}
      className={`
        flex-1 w-full flex items-center relative group pl-6 pr-2 transition-all duration-200 border-l-2
        ${isOver ? 'bg-blue-500/20 border-blue-400 shadow-[inset_0_0_20px_rgba(59,130,246,0.3)]' : 'border-transparent hover:bg-white/5 hover:border-blue-500/30'}
      `}
    >
      <div className={`absolute left-1 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold pointer-events-none transition-colors ${isOver ? 'text-blue-300' : 'text-gray-600 group-hover:text-blue-400'}`}>
        {label + 1}
      </div>
      <SortableContext 
        id={id} 
        items={items.map(i => i.id)} 
        strategy={horizontalListSortingStrategy}
      >
        <div className="flex gap-2 items-center w-full overflow-x-auto custom-scrollbar h-full px-1 py-1">
           {items.map((item) => (
            <SortableAmmo 
                key={item.id} 
                id={item.id} 
                item={item} 
                onHover={onItemHover}
                onLeave={onItemLeave}
                onClick={onItemClick}
            />
          ))}
          {items.length === 0 && (
             <div className="w-10 h-10 border border-dashed border-gray-700 rounded-lg flex items-center justify-center opacity-50 shrink-0">
                <span className="text-gray-700 text-xs">+</span>
             </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
}