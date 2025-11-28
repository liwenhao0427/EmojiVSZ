

import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShopItem, PlayerStats, AmmoItem, ItemUpgrade } from '../types';
import { WEAPON_POOL, ITEM_POOL, RARITY_COLORS } from '../constants';
import { Lock, RefreshCw, ShoppingBag, Coins, ChevronDown } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';

interface ShopProps {
  stats: PlayerStats;
  currentWave: number;
  onBuyWeapon: (weapon: AmmoItem) => void;
  onBuyItem: (item: ItemUpgrade) => void;
  onNextWave: () => void;
  updateGold: (amount: number) => void;
}

export const Shop: React.FC<ShopProps> = ({ stats, currentWave, onBuyItem, onNextWave, updateGold }) => {
  const { addUnit } = useGameStore();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [rerollCount, setRerollCount] = useState(0);
  const [isVisible, setIsVisible] = useState(true);
  const [feedback, setFeedback] = useState<string | null>(null);

  const rerollCost = 1 + Math.max(0, currentWave - 1) + rerollCount;

  const generateShop = (keepLocked = true) => {
    const newItems: ShopItem[] = [];
    
    if (keepLocked) {
        items.forEach(i => {
            if (i.locked && !i.bought) newItems.push(i);
        });
    }

    while (newItems.length < 4) {
        const isWeapon = Math.random() > 0.4;
        const pool = isWeapon ? WEAPON_POOL : ITEM_POOL;
        const template = pool[Math.floor(Math.random() * pool.length)];
        
        let basePrice = isWeapon ? 20 : 15;
        if (template.rarity === 'RARE') basePrice *= 2;
        if (template.rarity === 'EPIC') basePrice *= 4;

        basePrice = Math.max(1, Math.floor(basePrice * (1 - stats.shopDiscount)));

        newItems.push({
            id: uuidv4(),
            type: isWeapon ? 'WEAPON' : 'ITEM',
            data: { ...template } as any,
            price: basePrice,
            locked: false,
            bought: false
        });
    }
    setItems(newItems);
  };

  useEffect(() => {
    generateShop(false);
  }, []);

  const handleBuy = (item: ShopItem) => {
    if (stats.gold >= item.price && !item.bought) {
        if (item.type === 'WEAPON') {
            // Try to place unit
            const placed = addUnit(item.data as AmmoItem);
            if (placed) {
                updateGold(-item.price);
                item.bought = true;
                setFeedback(null);
            } else {
                setFeedback("GRID FULL! Sell or move units.");
                setTimeout(() => setFeedback(null), 2000);
            }
        } else {
            // Passive Item
            updateGold(-item.price);
            item.bought = true;
            onBuyItem(item.data as ItemUpgrade);
        }
        setItems([...items]); 
    }
  };

  const handleReroll = () => {
    if (stats.gold >= rerollCost) {
        updateGold(-rerollCost);
        setRerollCount(prev => prev + 1);
        generateShop(true);
    }
  };

  const toggleLock = (id: string) => {
      setItems(prev => prev.map(i => i.id === id ? { ...i, locked: !i.locked } : i));
  };

  if (!isVisible) {
      return (
        <div className="absolute bottom-8 right-8 z-50">
            <button 
                onClick={() => setIsVisible(true)}
                className="flex items-center gap-3 px-6 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-full shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all animate-bounce"
            >
                <ShoppingBag size={24} />
                OPEN SHOP ({stats.gold} G)
            </button>
        </div>
      );
  }

  return (
    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col p-8 z-40 text-white animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-start mb-6">
            <div>
                <h2 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                    BLACK MARKET
                </h2>
                <p className="text-gray-400 font-mono">Wave {currentWave} Prep Phase</p>
                {feedback && <p className="text-red-500 font-bold mt-2 animate-pulse">{feedback}</p>}
            </div>
            
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-xl border border-yellow-500/30">
                    <Coins className="text-yellow-400" />
                    <span className="text-3xl font-mono text-yellow-300">{stats.gold}</span>
                </div>
                <button 
                    onClick={() => setIsVisible(false)}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                >
                    <ChevronDown size={20} /> Hide
                </button>
            </div>
        </div>

        <div className="grid grid-cols-4 gap-6 flex-1 mb-8">
            {items.map(item => (
                <div 
                    key={item.id}
                    className={`
                        relative bg-slate-900 border-2 rounded-xl p-4 flex flex-col justify-between transition-all group
                        ${item.bought ? 'opacity-50 grayscale' : 'hover:scale-105 hover:border-white'}
                    `}
                    style={{ borderColor: RARITY_COLORS[item.data.rarity] }}
                >
                    <div className="flex justify-between items-start">
                        <span className="text-xs font-bold px-2 py-1 rounded bg-black/50" style={{ color: RARITY_COLORS[item.data.rarity] }}>
                            {item.data.rarity}
                        </span>
                        <button onClick={() => toggleLock(item.id)} className={`p-1 rounded ${item.locked ? 'text-yellow-400' : 'text-gray-600 hover:text-white'}`}>
                            <Lock size={16} />
                        </button>
                    </div>

                    <div className="flex flex-col items-center text-center my-4 flex-1">
                        <div className="text-6xl mb-4 transform transition-transform group-hover:scale-110">
                            {'emoji' in item.data ? item.data.emoji : '📦'}
                        </div>
                        <h3 className="text-lg font-bold mb-2">
                            {item.data.name}
                        </h3>
                        
                        <div className="bg-black/30 p-3 rounded w-full text-sm text-gray-300 flex-1 flex flex-col justify-center">
                            {'description' in item.data ? (
                                <p>{item.data.description}</p>
                            ) : (
                                <div className="space-y-1">
                                    <p>DMG: {(item.data as AmmoItem).damage}</p>
                                    <p className="text-xs text-gray-500 italic">Adds Unit to Grid</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <button 
                        onClick={() => handleBuy(item)}
                        disabled={item.bought || stats.gold < item.price}
                        className={`
                            w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2
                            ${item.bought ? 'bg-gray-800 text-gray-500' : stats.gold >= item.price ? 'bg-green-600 hover:bg-green-500' : 'bg-red-900/50 text-red-300'}
                        `}
                    >
                        {item.bought ? 'SOLD' : <><Coins size={16}/> {item.price}</>}
                    </button>
                </div>
            ))}
        </div>

        <div className="mt-auto flex justify-between items-center bg-slate-900/50 p-6 rounded-2xl border border-white/5">
             <div className="flex items-center gap-4">
                <button 
                    onClick={handleReroll}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors"
                    disabled={stats.gold < rerollCost}
                >
                    <RefreshCw size={20} /> Reroll (-{rerollCost})
                </button>
            </div>

            <button 
                onClick={onNextWave}
                className="px-12 py-4 bg-red-600 hover:bg-red-500 rounded-lg text-2xl font-black italic tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse hover:animate-none hover:scale-105 transition-all"
            >
                START WAVE {currentWave + 1}
            </button>
        </div>
    </div>
  );
};