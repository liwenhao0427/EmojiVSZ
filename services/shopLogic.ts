
import { BrotatoItem, UnitData, ShopItem, Rarity } from '../types';
import { ITEMS_DATA } from '../data/items';
import { UNIT_DATA } from '../data/units';
import { v4 as uuidv4 } from 'uuid';
import { PRICE_MULTIPLIER } from '../constants';
import { Log } from './Log';

const TIER_GATES: Record<number, number> = { 1: 1, 2: 3, 3: 8, 4: 15 };
const TIER_WEIGHTS_CONFIG: Record<number, { base: number, wave: number, luck: number }> = {
    1: { base: 1000, wave: -10, luck: -2 },
    2: { base: 0, wave: 10, luck: 2 },
    3: { base: 0, wave: 5, luck: 5 },
    4: { base: 0, wave: 2, luck: 10 },
};

// Pre-process items and units by tier
const itemsByTier: Record<number, BrotatoItem[]> = { 1: [], 2: [], 3: [], 4: [] };
ITEMS_DATA.forEach(item => {
  if (itemsByTier[item.tier]) itemsByTier[item.tier].push(item);
});

const unitsByTier: Record<number, UnitData[]> = { 1: [], 2: [], 3: [], 4: [] };
Object.values(UNIT_DATA).forEach(unit => {
    if (unitsByTier[unit.tier]) unitsByTier[unit.tier].push(unit);
});

export const getShopProbabilities = (wave: number, luck: number) => {
    const unitChance = Math.max(0, Math.min(1, 0.40 + (luck * 0.005)));
    const itemChance = 1 - unitChance;
    Log.debug('ShopLogic', `Base unit/item chance: ${(unitChance*100).toFixed(1)}% / ${(itemChance*100).toFixed(1)}% (Luck: ${luck})`);

    const tierWeights: { tier: number, weight: number, raw: any }[] = [];
    let totalWeight = 0;

    Log.debug('ShopLogic', `Calculating tier weights for Wave ${wave}, Luck ${luck}:`);
    for (const tierStr in TIER_GATES) {
        const tier = parseInt(tierStr, 10);
        if (wave >= TIER_GATES[tier]) {
            const config = TIER_WEIGHTS_CONFIG[tier];
            const waveBonus = wave * config.wave;
            const luckBonus = luck * config.luck;
            const weight = Math.max(0, config.base + waveBonus + luckBonus);
            
            Log.debug('ShopLogic', ` > Tier ${tier}: Unlocked (gate: ${TIER_GATES[tier]}). Weight = ${config.base}(base) + ${waveBonus}(wave) + ${luckBonus}(luck) = ${weight}`);

            if (weight > 0) {
                tierWeights.push({ tier, weight, raw: { base: config.base, wave: waveBonus, luck: luckBonus } });
                totalWeight += weight;
            }
        } else {
             Log.debug('ShopLogic', ` > Tier ${tier}: Locked (gate: ${TIER_GATES[tier]})`);
        }
    }
     Log.debug('ShopLogic', `Total weight: ${totalWeight}`);
    
    const probabilities: Record<'item' | 'unit', Record<number, { percent: number, raw: any }>> = {
        item: { 1: { percent: 0, raw: {} }, 2: { percent: 0, raw: {} }, 3: { percent: 0, raw: {} }, 4: { percent: 0, raw: {} } },
        unit: { 1: { percent: 0, raw: {} }, 2: { percent: 0, raw: {} }, 3: { percent: 0, raw: {} }, 4: { percent: 0, raw: {} } },
    };

    if (totalWeight > 0) {
        tierWeights.forEach(({ tier, weight, raw }) => {
            const tierProb = weight / totalWeight;
            probabilities.item[tier] = { percent: tierProb * itemChance * 100, raw };
            probabilities.unit[tier] = { percent: tierProb * unitChance * 100, raw };
        });
    }

    return { probabilities, unitChance };
};

export function rollShop(wave: number, luck: number, ownedItems: Record<string, number>, shopDiscount: number): ShopItem[] {
  const { probabilities, unitChance } = getShopProbabilities(wave, luck);
  const rolledItems: (BrotatoItem | UnitData)[] = [];
  const finalShop: ShopItem[] = [];

  const tierProbabilities = [1, 2, 3, 4].map(tier => ({
      tier,
      prob: (probabilities.item[tier].percent + probabilities.unit[tier].percent) / 100
  }));

  for (let i = 0; i < 4; i++) {
    let chosenEntity: BrotatoItem | UnitData | null = null;
    let attempts = 0;

    while (!chosenEntity && attempts < 50) {
        attempts++;
        const typeRoll = Math.random();
        const isUnit = typeRoll < unitChance;

        const tierRoll = Math.random();
        let cumulativeProb = 0;
        let selectedTier = 1;
        for (const tierInfo of tierProbabilities) {
            cumulativeProb += tierInfo.prob;
            if (tierRoll <= cumulativeProb) {
                selectedTier = tierInfo.tier;
                break;
            }
        }

        const sourcePool = isUnit ? unitsByTier[selectedTier] : itemsByTier[selectedTier];
        if (!sourcePool || sourcePool.length === 0) continue;

        const potentialEntities = sourcePool.filter(entity => {
            const isAlreadyRolled = rolledItems.some(rolled => rolled.id === entity.id);
            if (isUnit) return !isAlreadyRolled;
            
            const item = entity as BrotatoItem;
            const ownedCount = ownedItems[item.id] || 0;
            const hasMax = typeof item.max === 'number';
            return !isAlreadyRolled && (!hasMax || ownedCount < item.max);
        });

        if (potentialEntities.length > 0) {
            chosenEntity = potentialEntities[Math.floor(Math.random() * potentialEntities.length)];
        }
    }

    if (chosenEntity) {
        rolledItems.push(chosenEntity);
        const price = Math.round(chosenEntity.price * (1 - (shopDiscount / 100)));
        
        finalShop.push({
            id: uuidv4(),
            type: 'price' in chosenEntity && 'cd' in chosenEntity ? 'UNIT' : 'ITEM',
            data: chosenEntity,
            price,
            locked: false,
            bought: false,
        });
    }
  }

  return finalShop;
}