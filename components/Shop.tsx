
import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShopItem, BrotatoItem, UnitData } from '../types';
import { RARITY_COLORS, TIER_TO_RARITY, PRICE_MULTIPLIER } from '../constants';
import { Lock, RefreshCw, ShoppingBag, Coins, ChevronDown, Package, Sword } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { rollShopItems } from '../services/itemGenerator';
import { UNIT_DATA } from '../data/units';
import { InventoryPanel } from './InventoryPanel';

interface ShopProps {
  onBuyItem: (item: BrotatoItem) => void;
  onNextWave: () => void;
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

const UNIT_ID_POOL = Object.keys(UNIT_DATA);

export const Shop: React.FC<ShopProps> = ({ onBuyItem, onNextWave, isVisible, onVisibilityChange }) => {
  const { stats, addUnit, ownedItems } = useGameStore();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [rerollCount, setRerollCount] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const allItemsBought = useMemo(() => items.length > 0 && items.every(item => item.bought), [items]);
  
  const rerollCost = useMemo(() => {
    if (allItemsBought) return 0;
    return Math.floor((1 + Math.max(0, stats.wave - 1) + rerollCount) * PRICE_MULTIPLIER);
  }, [allItemsBought, stats.wave, rerollCount]);


  const generateShop = (keepLocked = true) => {
    let newItems: ShopItem[] = [];
    
    if (keepLocked) {
        newItems = items.filter(i => i.locked && !i.bought);
    }
    
    const itemsToRoll = 4 - newItems.length;
    if (itemsToRoll > 0) {
      const rolledBrotatoItems = rollShopItems(stats.wave, stats.luck, ownedItems, itemsToRoll);
      
      rolledBrotatoItems.forEach(item => {
        const basePrice = Math.round(item.price * PRICE_MULTIPLIER);
        const price = Math.round(basePrice * (1 - (stats.shopDiscount || 0) / 100));
        newItems.push({
          id: uuidv4(),
          type: 'ITEM',
          data: item,
          price,
          locked: false,
          bought: false
        });
      });
    }

    // Unit Chance Calculation: Base 40% + Luck%
    const unitChance = 0.40 + (stats.luck * 0.01);

    // Try to replace items with units based on chance
    newItems.forEach((item, idx) => {
        if (!item.locked && !item.bought && item.type === 'ITEM') {
            if (Math.random() < unitChance) {
                 const unitId = UNIT_ID_POOL[Math.floor(Math.random() * UNIT_ID_POOL.length)];
                 const unitData = UNIT_DATA[unitId];
                 if (unitData) {
                    const basePrice = Math.round(unitData.price * PRICE_MULTIPLIER);
                    const price = Math.round(basePrice * (1 - (stats.shopDiscount || 0) / 100));
                    newItems[idx] = {
                        id: uuidv4(),
                        type: 'UNIT',
                        data: unitData,
                        price: price,
                        locked: false,
                        bought: false
                    };
                 }
            }
        }
    });


    setItems(newItems.slice(0, 4).sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    generateShop(false);
    setRerollCount(0);
  }, [stats.wave]);

  const handleBuy = (shopItem: ShopItem) => {
    if (stats.gold >= shopItem.price && !shopItem.bought) {
        if (shopItem.type === 'ITEM') {
            const itemData = shopItem.data as BrotatoItem;
            const currentCount = ownedItems[itemData.id] || 0;
            if (itemData.max && currentCount >= itemData.max) {
                 setFeedback("已达到最大拥有数量！");
                 setTimeout(() => setFeedback(null), 2000);
                 return;
            }
            onBuyItem({ ...itemData, price: shopItem.price }); // Pass the adjusted price
            shopItem.bought = true;
        } else {
             const placed = addUnit(shopItem.data as UnitData);
            if (placed) {
                useGameStore.setState(s => ({ stats: { ...s.stats, gold: s.stats.gold - shopItem.price }}));
                shopItem.bought = true;
                setFeedback(null);
            } else {
                setFeedback("场地已满！请腾出空间。");
                setTimeout(() => setFeedback(null), 2000);
            }
        }
        setItems([...items]); 
    }
  };

  const handleReroll = () => {
    if (stats.gold >= rerollCost) {
        if (rerollCost > 0) {
            useGameStore.setState(s => ({ stats: { ...s.stats, gold: s.stats.gold - rerollCost }}));
        }
        setRerollCount(prev => prev + 1);
        generateShop(true);
    }
  };

  const toggleLock = (id: string) => {
      setItems(prev => prev.map(i => i.id === id ? { ...i, locked: !i.locked } : i));
  };
  
  const currentWave = stats.wave;

  if (!isVisible) {
      return (
        <div className="absolute bottom-8 right-8 z-50 pointer-events-auto">
            <button 
                onClick={() => onVisibilityChange(true)}
                className="flex items-center gap-3 px-6 py-4 bg-yellow-500 hover:bg-yellow-400 text-black font-black rounded-full shadow-[0_0_20px_rgba(234,179,8,0.5)] transition-all animate-bounce"
            >
                <ShoppingBag size={24} />
                打开商店 ({stats.gold} G)
            </button>
        </div>
      );
  }

  return (
    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-sm flex flex-col p-8 z-40 text-white animate-in slide-in-from-bottom duration-300 pointer-events-auto">
        
        {/* Integrated Inventory Panel */}
        <InventoryPanel />
        
        <div className="flex justify-between items-start mb-4">
            <div>
                <h2 className="text-4xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                    黑市
                </h2>
                <p className="text-gray-400 font-mono">第 {currentWave} 波准备阶段</p>
                {feedback && <p className="text-red-500 font-bold mt-2 animate-pulse">{feedback}</p>}
            </div>
            
            <div className="flex items-center gap-4">
                 <div className="flex items-center gap-4 bg-slate-900 p-3 rounded-xl border border-yellow-500/30">
                    <Coins className="text-yellow-400" />
                    <span className="text-3xl font-mono text-yellow-300">{stats.gold}</span>
                </div>
                <button 
                    onClick={() => onVisibilityChange(false)}
                    className="p-3 bg-slate-800 hover:bg-slate-700 rounded-lg text-gray-300 hover:text-white transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
                >
                    <ChevronDown size={20} /> 隐藏
                </button>
            </div>
        </div>

        <div className="grid grid-cols-4 gap-6 flex-1 mb-6 items-start">
            {items.map(shopItem => {
                const isUnit = shopItem.type === 'UNIT';
                const data = shopItem.data as BrotatoItem | UnitData;
                const rarity = isUnit ? 'COMMON' : TIER_TO_RARITY[(data as BrotatoItem).tier]; 
                const color = RARITY_COLORS[rarity];
                const ownedCount = !isUnit ? ownedItems[(data as BrotatoItem).id] || 0 : 0;
                const maxCount = !isUnit ? (data as BrotatoItem).max : undefined;

                return (
                    <div 
                        key={shopItem.id}
                        className={`
                            relative bg-slate-900 border-2 rounded-xl p-2 flex flex-col justify-between transition-all group
                            ${shopItem.bought ? 'opacity-50 grayscale' : 'hover:scale-105 hover:border-white'}
                        `}
                        style={{ borderColor: color }}
                    >
                        <div className="flex justify-between items-start">
                           <div className="flex items-center gap-2 text-xs font-bold px-2 py-1 rounded bg-black/50" style={{ color }}>
                             {isUnit ? <Sword size={12}/> : <Package size={12}/>}
                             {isUnit ? (data as UnitData).type : rarity}
                           </div>

                            <button onClick={() => toggleLock(shopItem.id)} className={`p-1 rounded ${shopItem.locked ? 'text-yellow-400' : 'text-gray-600 hover:text-white'}`}>
                                <Lock size={16} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center text-center my-1">
                            <div className="text-4xl mb-1 transform transition-transform group-hover:scale-110">
                                {isUnit ? (data as UnitData).emoji : (data as BrotatoItem).name.charAt(0)}
                            </div>
                            <h3 className="text-base font-bold mb-1">
                                {data.name}
                            </h3>
                            
                            <div className="bg-black/30 p-2 rounded w-full text-xs text-gray-300 flex flex-col justify-center">
                                <p className="min-h-[2.5rem]">{isUnit ? (data as UnitData).desc : (data as BrotatoItem).desc}</p>
                            </div>
                        </div>
                        
                        {!isUnit && maxCount && (
                             <div className="text-center text-[10px] text-yellow-400 font-mono mb-1">
                                已拥有: {ownedCount} / {maxCount}
                            </div>
                        )}

                        <button 
                            onClick={() => handleBuy(shopItem)}
                            disabled={shopItem.bought || stats.gold < shopItem.price}
                            className={`
                                w-full py-2 rounded-lg font-bold flex items-center justify-center gap-2 text-sm mt-1
                                ${shopItem.bought ? 'bg-gray-800 text-gray-500' : stats.gold >= shopItem.price ? 'bg-green-600 hover:bg-green-500' : 'bg-red-900/50 text-red-300'}
                            `}
                        >
                            {shopItem.bought ? '已售' : <><Coins size={14}/> {shopItem.price}</>}
                        </button>
                    </div>
                )
            })}
        </div>

        <div className="flex justify-between items-center bg-slate-900/50 p-4 rounded-2xl border border-white/5">
            <div />
            <div className="flex items-center gap-4">
                <button 
                    onClick={handleReroll}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold transition-colors disabled:bg-slate-700 disabled:cursor-not-allowed"
                    disabled={stats.gold < rerollCost}
                >
                    <RefreshCw size={20} /> {rerollCost === 0 ? '刷新 (免费)' : `刷新 (-${rerollCost})`}
                </button>
                <button 
                    onClick={onNextWave}
                    className="px-12 py-4 bg-red-600 hover:bg-red-500 rounded-lg text-2xl font-black italic tracking-wider shadow-[0_0_20px_rgba(220,38,38,0.5)] animate-pulse hover:animate-none hover:scale-105 transition-all"
                >
                    开始第 {currentWave + 1} 波
                </button>
            </div>
        </div>
    </div>
  );
};
