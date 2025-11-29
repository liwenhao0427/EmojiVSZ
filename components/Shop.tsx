
import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShopItem, BrotatoItem, UnitData } from '../types';
import { RARITY_COLORS, TIER_TO_RARITY, PRICE_MULTIPLIER, CELL_SIZE } from '../constants';
import { Lock, RefreshCw, ShoppingBag, Coins, ChevronDown, Package, Sword, TrendingUp } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
import { rollShopItems } from '../services/itemGenerator';
import { UNIT_DATA } from '../data/units';
import { InventoryPanel } from './InventoryPanel';

interface ShopProps {
  isVisible: boolean;
  onVisibilityChange: (visible: boolean) => void;
}

const UNIT_ID_POOL = Object.keys(UNIT_DATA);

export const Shop: React.FC<ShopProps> = ({ isVisible, onVisibilityChange }) => {
  const { stats, addUnit, ownedItems, buyBrotatoItem, buyExperience } = useGameStore();
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

    const unitChance = 0.40 + (stats.luck * 0.01);

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
            buyBrotatoItem({ ...itemData, price: shopItem.price }); 
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
  
  const handleBuyXP = () => {
      const xpCost = 10;
      const xpGain = 10;
      if (stats.gold >= xpCost) {
          buyExperience(xpGain, xpCost);
      }
  };
  
  const currentWave = stats.wave;
  const xpPct = (stats.xp / stats.maxXp) * 100;

  // Helper to calculate preview damage for shop unit
  const getUnitPreview = (unit: UnitData) => {
      let flatBonus = 0;
      if (unit.type === 'MELEE') flatBonus = stats.meleeDmg;
      if (unit.type === 'RANGED') flatBonus = stats.rangedDmg;
      if (unit.type === 'MAGIC') flatBonus = stats.elementalDmg;
      
      const globalDmgMult = (1 + (stats.damagePercent || 0));
      const damage = Math.round((unit.damage + flatBonus) * globalDmgMult);
      
      // Cooldown
      const attackSpeed = (1 + (stats.attackSpeed || 0));
      const cooldown = (unit.cd / Math.max(0.1, attackSpeed)).toFixed(2);
      
      const rangeCells = Math.round(unit.range / CELL_SIZE);
      
      return { damage, cooldown, rangeCells };
  };

  if (!isVisible) {
      // The "Open Shop" button is now handled in App.tsx
      return null;
  }

  return (
    <div className="absolute inset-0 bg-slate-50/95 backdrop-blur-md flex flex-col p-8 z-[60] text-slate-800 animate-in slide-in-from-bottom duration-300 pointer-events-auto">
        
        {/* Integrated Inventory Panel - Now sits on top of this layer */}
        <InventoryPanel />
        
        <div className="flex justify-between items-start mb-4 shrink-0">
            <div className="flex flex-col gap-2">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tight">
                        黑市 <span className="text-yellow-500">Shop</span>
                    </h2>
                    <p className="text-slate-400 font-bold">第 {currentWave} 波准备阶段</p>
                </div>
                
                {/* Shop Experience Bar */}
                <div className="w-64">
                    <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                        <span>HERO LEVEL {stats.heroLevel}</span>
                        <span>{Math.floor(stats.xp)}/{Math.floor(stats.maxXp)}</span>
                    </div>
                    <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden border border-slate-100">
                        <div className="h-full bg-purple-500 transition-all duration-300 rounded-full" style={{ width: `${Math.max(0, xpPct)}%` }}></div>
                    </div>
                </div>

                {feedback && <p className="text-red-500 font-bold mt-1 animate-pulse bg-red-100 px-3 py-1 rounded-full inline-block text-xs">{feedback}</p>}
            </div>
            
            <div className="flex items-center gap-4">
                 {/* Buy XP Button */}
                 <button 
                    onClick={handleBuyXP}
                    className="group flex items-center gap-3 px-5 py-3 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-2xl border-2 border-purple-200 transition-all hover:-translate-y-1 active:translate-y-0"
                    disabled={stats.gold < 10}
                 >
                     <div className="bg-purple-200 group-hover:bg-white p-1.5 rounded-lg transition-colors">
                        <TrendingUp size={20} />
                     </div>
                     <div className="flex flex-col items-start leading-none">
                         <span className="text-[10px] font-black uppercase tracking-wider opacity-70">购买经验</span>
                         <span className="text-sm font-black">+10 XP <span className="opacity-60 text-xs">(-10G)</span></span>
                     </div>
                 </button>

                 <div className="flex items-center gap-3 bg-white p-3 px-5 rounded-2xl border-2 border-slate-100 shadow-sm min-w-[140px] justify-center">
                    <Coins className="text-yellow-500" size={28} />
                    <span className="text-3xl font-black text-slate-700">{stats.gold}</span>
                </div>
            </div>
        </div>

        {/* Cards Grid - Reduced height by using aspect ratio or limiting flex basis */}
        <div className="grid grid-cols-4 gap-4 mb-4 items-start h-[380px]">
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
                            relative bg-white border-4 rounded-3xl p-3 flex flex-col justify-between transition-all group shadow-sm hover:shadow-xl h-full
                            ${shopItem.bought ? 'opacity-50 grayscale bg-slate-100' : 'hover:-translate-y-2'}
                        `}
                        style={{ borderColor: shopItem.locked ? '#facc15' : 'white' }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-1">
                           <div className="flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">
                             {isUnit ? <Sword size={12}/> : <Package size={12}/>}
                             {isUnit ? (data as UnitData).type : rarity}
                           </div>

                            <button onClick={() => toggleLock(shopItem.id)} className={`p-1.5 rounded-full transition-colors ${shopItem.locked ? 'bg-yellow-100 text-yellow-600' : 'text-slate-300 hover:bg-slate-100'}`}>
                                <Lock size={16} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="flex flex-col items-center text-center my-1 flex-1 overflow-hidden">
                            <div className="text-4xl mb-2 transform transition-transform group-hover:scale-110 drop-shadow-sm filter">
                                {isUnit ? (data as UnitData).emoji : (data as BrotatoItem).name.charAt(0)}
                            </div>
                            <h3 className="text-base font-black text-slate-800 mb-1 leading-tight line-clamp-1">
                                {data.name}
                            </h3>
                            
                            {/* Unit Stats or Item Desc */}
                            <div className="flex-1 w-full flex flex-col justify-center">
                                {isUnit ? (
                                    (() => {
                                        const preview = getUnitPreview(data as UnitData);
                                        return (
                                            <div className="grid grid-cols-2 gap-1 w-full bg-slate-50 p-2 rounded-xl text-[10px] font-bold text-slate-600">
                                                <div className="flex items-center gap-1"><span className="text-red-500">⚔️</span> {preview.damage}</div>
                                                <div className="flex items-center gap-1"><span className="text-green-500">❤️</span> {(data as UnitData).maxHp}</div>
                                                <div className="flex items-center gap-1"><span className="text-yellow-500">⚡</span> {preview.cooldown}s</div>
                                                <div className="flex items-center gap-1"><span className="text-blue-500">🎯</span> {preview.rangeCells}</div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="bg-slate-50 p-2 rounded-xl w-full text-[10px] font-bold text-slate-500 flex flex-col justify-center h-16 overflow-y-auto custom-scrollbar leading-tight">
                                        <p>{(data as BrotatoItem).desc}</p>
                                    </div>
                                )}
                            </div>
                            
                            {isUnit && (
                                <div className="text-[10px] text-slate-400 font-bold mt-1 line-clamp-1">
                                    {(data as UnitData).desc}
                                </div>
                            )}
                        </div>
                        
                        {!isUnit && maxCount && (
                             <div className="text-center text-[10px] text-slate-400 font-bold mb-1">
                                已拥有: {ownedCount} / {maxCount}
                            </div>
                        )}

                        <button 
                            onClick={() => handleBuy(shopItem)}
                            disabled={shopItem.bought || stats.gold < shopItem.price}
                            className={`
                                w-full py-2.5 rounded-xl font-black flex items-center justify-center gap-2 text-xs mt-auto shadow-sm
                                ${shopItem.bought 
                                    ? 'bg-slate-200 text-slate-400' 
                                    : stats.gold >= shopItem.price 
                                        ? 'bg-green-500 hover:bg-green-400 text-white shadow-green-200' 
                                        : 'bg-red-100 text-red-400 cursor-not-allowed'}
                            `}
                        >
                            {shopItem.bought ? '已售' : <><Coins size={14}/> {shopItem.price}</>}
                        </button>
                    </div>
                )
            })}
        </div>

        {/* Footer Actions - Right Aligned to avoid Backpack */}
        <div className="mt-auto flex justify-end items-center gap-4">
            <div className="text-xs font-bold text-slate-400 px-2 text-right">
                提示: 右键点击单位可出售
            </div>
            
            <div className="flex items-center gap-4 bg-white p-2 rounded-3xl border border-slate-200 shadow-sm pl-4">
                <button 
                    onClick={handleReroll}
                    className="flex items-center gap-2 px-6 py-3 bg-blue-500 hover:bg-blue-400 text-white rounded-xl font-black transition-colors disabled:bg-slate-200 disabled:text-slate-400 shadow-lg shadow-blue-200"
                    disabled={stats.gold < rerollCost}
                >
                    <RefreshCw size={20} /> {rerollCost === 0 ? '刷新 (免费)' : `刷新 (-${rerollCost})`}
                </button>
                <button 
                    onClick={() => onVisibilityChange(false)}
                    className="px-10 py-3 bg-red-500 hover:bg-red-400 text-white rounded-xl text-xl font-black tracking-wider shadow-lg shadow-red-200 hover:scale-105 transition-all"
                >
                    返回战场
                </button>
            </div>
        </div>
    </div>
  );
};