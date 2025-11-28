import React, { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DragStartEvent,
  DragOverEvent,
  DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { AmmoItem } from '../types';
import { RARITY_COLORS, GRID_TOP_OFFSET } from '../constants';
import { Rocket, ShieldAlert } from 'lucide-react';
import { AmmoRow } from './ammo-bay/AmmoRow';
import { AmmoDetailCard } from './ammo-bay/AmmoDetailCard';
import { useGameStore } from '../store/useGameStore';

export const AmmoBay: React.FC = () => {
  const { ammoState, moveAmmo } = useGameStore();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<AmmoItem | null>(null);
  const [pinnedItem, setPinnedItem] = useState<AmmoItem | null>(null);

  React.useEffect(() => {
      const handleGlobalClick = () => {
          setPinnedItem(null);
      };
      if (pinnedItem) window.addEventListener('click', handleGlobalClick);
      return () => window.removeEventListener('click', handleGlobalClick);
  }, [pinnedItem]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    setPinnedItem(null);
    setHoveredItem(null);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;
    // We delegate state updates to DragEnd for sorting within same container, 
    // or we can implement real-time preview if needed. 
    // For Zustand/Dnd-kit hybrid, calling moveAmmo on DragOver gives the best visual feedback.
    // Cast active/over to any to avoid "unknown" type errors if dnd-kit types are not inferred correctly
    if ((active as any).id !== (over as any).id) {
       moveAmmo((active as any).id as string, (over as any).id as string);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
  };
  
  // Explicitly cast the found item to AmmoItem to avoid "unknown" type errors in render
  // Also explicit cast for 'i' to handle cases where flat() might return unknown[]
  const activeDragItem = activeId ? (Object.values(ammoState).flat().find((i: any) => i.id === activeId) as AmmoItem | undefined) : null;
  const detailItem = pinnedItem || hoveredItem;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col h-full glass-panel w-full z-20 border-r border-r-white/10 shadow-2xl relative">
        <div 
          className="p-5 border-b border-white/10 bg-gradient-to-r from-slate-900 to-slate-800 flex flex-col justify-center"
          style={{ height: GRID_TOP_OFFSET }}
        >
           <div className="flex items-center gap-2 mb-1">
               <Rocket className="text-cyan-400" size={20} />
               <h2 className="text-xl font-black text-white italic tracking-wider">AMMO BAY</h2>
           </div>
           <p className="text-[10px] text-gray-400 uppercase tracking-widest">Sort sequence priority</p>
        </div>
        
        <div className="flex-1 flex flex-col w-full relative">
          {Object.keys(ammoState).map((rowId, idx) => (
            <AmmoRow 
                key={rowId} 
                id={rowId} 
                items={ammoState[rowId]} 
                label={idx} 
                onItemHover={setHoveredItem}
                onItemLeave={() => setHoveredItem(null)}
                onItemClick={(item) => setPinnedItem(prev => (prev?.id === item.id ? null : item))}
            />
          ))}

            {detailItem && (
                <AmmoDetailCard 
                    item={detailItem} 
                    isPinned={!!pinnedItem} 
                    onClose={() => setPinnedItem(null)}
                />
            )}
        </div>
        
        <div className="p-4 border-t border-white/10 text-[10px] text-gray-500 text-center">
            <ShieldAlert size={12} className="inline mr-1"/>
            DEFENSE LINE ACTIVE
        </div>
      </div>

      <DragOverlay dropAnimation={{ sideEffects: defaultDropAnimationSideEffects({ styles: { active: { opacity: '0.4' } } }) }}>
        {activeDragItem ? (
           <div 
             className="w-14 h-14 bg-slate-800 border-2 rounded-lg flex items-center justify-center text-4xl shadow-[0_0_25px_rgba(6,182,212,0.8)] z-50 pointer-events-none"
             style={{ borderColor: RARITY_COLORS[activeDragItem.rarity || 'COMMON'] }}
           >
             {activeDragItem.emoji}
           </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};