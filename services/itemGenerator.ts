
import { BrotatoItem } from '../types';
import { ITEMS_DATA } from '../data/items';

// Pre-process items by tier for efficient lookup
const itemsByTier: Record<number, BrotatoItem[]> = { 1: [], 2: [], 3: [], 4: [] };
ITEMS_DATA.forEach(item => {
  if (itemsByTier[item.tier]) {
    itemsByTier[item.tier].push(item);
  }
});

const TIER_GATES: Record<number, number> = { 1: 1, 2: 3, 3: 8, 4: 15 };
const TIER_WEIGHTS_CONFIG: Record<number, { base: number, wave: number, luck: number }> = {
    1: { base: 1000, wave: -10, luck: -2 },
    2: { base: 0, wave: 10, luck: 2 },
    3: { base: 0, wave: 5, luck: 5 },
    4: { base: 0, wave: 2, luck: 10 },
};

/**
 * Generates a list of items for the shop using a weighted random algorithm.
 * @param wave The current wave number.
 * @param luck The player's luck stat.
 * @param ownedItems A record of item IDs to their counts in the player's inventory.
 * @param count The number of items to generate.
 * @returns An array of BrotatoItem objects for the shop.
 */
export function rollShopItems(wave: number, luck: number, ownedItems: Record<string, number>, count: number): BrotatoItem[] {
  const rolledItems: BrotatoItem[] = [];

  for (let i = 0; i < count; i++) {
    // Calculate weights for available tiers
    const tierWeights: { tier: number, weight: number }[] = [];
    let totalWeight = 0;

    for (const tierStr in TIER_GATES) {
      const tier = parseInt(tierStr, 10);
      if (wave >= TIER_GATES[tier]) {
        const config = TIER_WEIGHTS_CONFIG[tier];
        const weight = Math.max(0, config.base + (wave * config.wave) + (luck * config.luck));
        if (weight > 0) {
          tierWeights.push({ tier, weight });
          totalWeight += weight;
        }
      }
    }
    
    if (totalWeight === 0) continue;

    let chosenItem: BrotatoItem | null = null;
    let attempts = 0;

    // Try to find a valid item, with fallback
    while (!chosenItem && attempts < 20) {
      // Select a tier based on weights
      const randomWeight = Math.random() * totalWeight;
      let currentWeight = 0;
      let selectedTier = tierWeights[0].tier;

      for (const tw of tierWeights) {
        currentWeight += tw.weight;
        if (randomWeight <= currentWeight) {
          selectedTier = tw.tier;
          break;
        }
      }

      // Filter items from the selected tier
      const potentialItems = itemsByTier[selectedTier].filter(item => {
        const ownedCount = ownedItems[item.id] || 0;
        const isAlreadyRolled = rolledItems.some(rolled => rolled.id === item.id);
        const hasMax = typeof item.max === 'number';
        return !isAlreadyRolled && (!hasMax || ownedCount < item.max);
      });
      
      if (potentialItems.length > 0) {
        chosenItem = potentialItems[Math.floor(Math.random() * potentialItems.length)];
      }

      attempts++;
    }

    if (chosenItem) {
      rolledItems.push(chosenItem);
    }
  }
  
  return rolledItems;
}
