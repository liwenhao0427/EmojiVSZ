
import React, { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { ShopItem, BrotatoItem, UnitData } from '../types';
import { RARITY_COLORS, TIER_TO_RARITY, PRICE_MULTIPLIER, CELL_SIZE, RARITY_BG_COLORS } from '../constants';
// FIX: Change 'Dice' to 'Dice1' as 'Dice' is not an exported member of 'lucide-react'.
import { Lock, RefreshCw, ShoppingBag, Coins, ChevronDown, Package, Sword, TrendingUp, Dice1 } from 'lucide-react';
import { useGameStore } from '../store/useGameStore';
// FIX: Changed import from non-existent itemGenerator.ts to shopLogic.ts and updated function name.
import { rollShop, getShopProbabilities } from '../services/shopLogic';
import { UNIT_DATA } from '../data/units';
import { InventoryPanel } from './InventoryPanel';
import { Log } from '../services/Log';

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
  const [showProbs, setShowProbs] = useState(false);

  const allItemsBought = useMemo(() => items.length > 0 && items.every(item => item.bought), [items]);
  
  const rerollCost = useMemo(() => {
    if (allItemsBought) return 0;
    return Math.floor((1 + Math.max(0, stats.wave - 1) + rerollCount) * PRICE_MULTIPLIER);
  }, [allItemsBought, stats.wave, rerollCount]);

  const shopProbs = useMemo(() => {
    return getShopProbabilities(stats.wave, stats.luck);
  }, [stats.wave, stats.luck]);


  const generateShop = (keepLocked = true) => {
    // FIX: Refactored shop generation to use the `rollShop` function from `shopLogic.ts`.
    // This new logic preserves locked items and fills the remaining slots with new items.
    const lockedItems = keepLocked ? items.filter(i => i.locked && !i.bought) : [];
    const rolledItems = rollShop(stats.wave, stats.luck, ownedItems, stats.shopDiscount || 0);

    const finalItems = [...lockedItems];
    const existingDataIds = new Set(lockedItems.map(item => item.data.id));

    for (const newItem of rolledItems) {
        if (finalItems.length >= 4) break;
        if (!existingDataIds.has(newItem.data.id)) {
            finalItems.push(newItem);
            existingDataIds.add(newItem.data.id);
        }
    }

    setItems(finalItems.slice(0, 4).sort(() => Math.random() - 0.5));
  };

  useEffect(() => {
    generateShop(false);
    setRerollCount(0);
  }, [stats.wave]);

  const handleBuy = (shopItem: ShopItem) => {
    if (stats.gold >= shopItem.price && !shopItem.bought) {
        Log.event('商店', `玩家购买了 ${shopItem.data.name}，花费 ${shopItem.price} 金币。`);
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
        Log.event('商店', `玩家刷新了商店，花费 ${rerollCost} 金币。`);
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
          Log.event('商店', `玩家购买了 ${xpGain} 点经验，花费 ${xpCost} 金币。`);
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
      
      const rangeCells = unit.range;
      
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

                <div className="relative mt-2">
                    <button onClick={() => setShowProbs(!showProbs)} className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-full transition-colors">
                        <Dice1 size={14} />
                        <span>商店概率</span>
                        <ChevronDown size={14} className={`transition-transform ${showProbs ? 'rotate-180' : ''}`} />
                    </button>
                    {showProbs && (
                        <div className="absolute top-full left-0 mt-2 w-80 bg-white p-4 rounded-2xl shadow-lg border-2 border-slate-200 z-10 animate-in fade-in zoom-in-95 duration-200">
                            <div className="flex justify-between items-center mb-2 pb-2 border-b border-slate-100">
                                <h4 className="font-black text-slate-700">掉落率分布</h4>
                                <div className="text-xs font-bold">
                                    <span className="text-purple-600">单位: {(shopProbs.unitChance * 100).toFixed(0)}%</span> / <span className="text-green-600">物品: {((1 - shopProbs.unitChance) * 100).toFixed(0)}%</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-y-1 text-xs font-mono">
                                <div className="font-bold text-slate-400">等级</div>
                                <div className="font-bold text-slate-400 text-center">物品 %</div>
                                <div className="font-bold text-slate-400 text-center">单位 %</div>
                                
                                {[1, 2, 3, 4].map(tier => (
                                    <React.Fragment key={tier}>
                                        <div className="font-bold" style={{ color: RARITY_COLORS[TIER_TO_RARITY[tier]] }}>等级 {tier}</div>
                                        <div className="text-center text-slate-600">{shopProbs.probabilities.item[tier].percent.toFixed(1)}</div>
                                        <div className="text-center text-slate-600">{shopProbs.probabilities.unit[tier].percent.toFixed(1)}</div>
                                    </React.Fragment>
                                ))}
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3 italic">概率受波数和幸运值影响。</p>
                        </div>
                    )}
                </div>
                
                {/* Shop Experience Bar */}
                <div className="w-64 mt-2">
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
                const rarity = TIER_TO_RARITY[data.tier];
                const color = RARITY_COLORS[rarity];
                const bgColor = RARITY_BG_COLORS[rarity];
                const ownedCount = !isUnit ? ownedItems[(data as BrotatoItem).id] || 0 : 0;
                const maxCount = !isUnit ? (data as BrotatoItem).max : undefined;

                return (
                    <div 
                        key={shopItem.id}
                        className={`
                            relative border-4 rounded-3xl p-3 flex flex-col justify-between transition-all group shadow-sm hover:shadow-xl h-full
                            ${shopItem.bought ? 'opacity-50 grayscale !bg-slate-100 border-slate-200' : `hover:-translate-y-2 ${bgColor}`}
                        `}
                        style={{ borderColor: shopItem.locked ? '#facc15' : color }}
                    >
                        {/* Header */}
                        <div className="flex justify-between items-start mb-1">
                           <div className="flex items-center gap-1.5 text-[10px] font-black px-2 py-1 rounded-full bg-slate-100/80 text-slate-500 uppercase tracking-wider">
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
                                            <div className="grid grid-cols-2 gap-1 w-full bg-slate-50/80 p-2 rounded-xl text-[10px] font-bold text-slate-600">
                                                <div className="flex items-center gap-1"><span className="text-red-500">⚔️</span> {preview.damage}</div>
                                                <div className="flex items-center gap-1"><span className="text-green-500">❤️</span> {(data as UnitData).maxHp}</div>
                                                <div className="flex items-center gap-1"><span className="text-yellow-500">⚡</span> {preview.cooldown}s</div>
                                                <div className="flex items-center gap-1"><span className="text-blue-500">🎯</span> {preview.rangeCells}</div>
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div className="bg-slate-50/80 p-2 rounded-xl w-full text-[10px] font-bold text-slate-500 flex flex-col justify-center h-16 overflow-y-auto custom-scrollbar leading-tight">
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
                        
                        <div className="relative group/price mt-auto">
                            <button 
                                onClick={() => handleBuy(shopItem)}
                                disabled={shopItem.bought || stats.gold < shopItem.price}
                                className={`
                                    w-full py-2.5 rounded-xl font-black flex items-center justify-center gap-2 text-xs shadow-sm
                                    ${shopItem.bought 
                                        ? 'bg-slate-200 text-slate-400' 
                                        : stats.gold >= shopItem.price 
                                            ? 'bg-green-500 hover:bg-green-400 text-white shadow-green-200' 
                                            : 'bg-red-100 text-red-400 cursor-not-allowed'}
                                `}
                            >
                                {shopItem.bought ? '已售' : <><Coins size={14}/> {shopItem.price}</>}
                            </button>
                            {!shopItem.bought && (stats.shopDiscount || 0) > 0 && shopItem.data.price !== shopItem.price && (
                                <div className="hidden group-hover/price:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max bg-slate-800 text-white p-2 rounded-lg text-xs z-10 whitespace-nowrap leading-relaxed text-left font-mono">
                                    基础价格: {shopItem.data.price} G<br/>
                                    全局折扣: {stats.shopDiscount}%<br/>
                                    <span className="border-t border-slate-600 my-1 block"></span>
                                    最终价格: {shopItem.price} G
                                </div>
                            )}
                        </div>
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