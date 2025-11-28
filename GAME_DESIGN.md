
# Keyboard Defense: Grid Tactics - Game Design Document (v3.0)

## 1. Project Overview

**Core Concept:** 
A sophisticated hybrid game blending **Grid-based Tower Defense**, **Auto-Battler tactics**, and deep **Roguelite progression** inspired by games like *Brotato*. Players strategically deploy and upgrade a squad of emoji-based units on a 5x9 grid to fend off relentless waves of enemies.

**Core Experience:**
*   **Strategic Depth:** Unit placement, synergies between permanent items, and temporary wave buffs create a complex decision space.
*   **Dual Progression:**
    1.  **In-Wave (Tactical):** Gain XP during combat to level up, pausing the action to draft powerful, wave-only upgrades.
    2.  **Permanent (Strategic):** Use gold earned from waves to purchase persistent stat-boosting items and new units from a "Brotato-style" shop.
*   **Dynamic Pacing:** The core loop of "Combat -> Level Up -> Shop" is enhanced by a PvZ-inspired enemy spawning system, creating waves with distinct rhythms and escalating intensity.
*   **Visual Style:** A polished cyberpunk/sci-fi aesthetic with glassmorphism UI panels, neon highlights, and expressive emoji characters.

**Technical Stack:**
*   **Frontend:** React, Tailwind CSS
*   **Core Engine:** HTML5 Canvas (`services/engine/`)
*   **State Management:** Zustand
*   **Interaction:** Mouse-driven unit placement (drag-and-drop) and entity inspection (hover/click).

---

## 2. Core Gameplay Loop

The game is structured around a compelling and repeatable cycle:

1.  **START (Start Phase)**
    *   The game launches with a polished start screen.
    *   Clicking "Start Defense" initializes the game state and transitions directly into the first wave of combat.

2.  **COMBAT (Combat Phase)**
    *   Enemies spawn from the right side of the screen in pre-determined, paced "sub-waves" (PvZ-style).
    *   Player units automatically target and attack enemies based on their logic.
    *   **Dynamic Leveling:** Killing enemies grants XP. When the XP bar fills, the player levels up, which **immediately pauses the combat** and presents a **Level Up Modal** with three random, temporary draft choices.
    *   After selecting a draft option, the buff is applied, and combat resumes.
    *   The wave ends when the timer runs out. All surviving enemies are cleared.
    *   If an enemy reaches the far-left "defense line," the game is over.

3.  **SHOP (Shop Phase)**
    *   After a successful wave, the game enters the Shop phase.
    *   A full-screen shop modal appears, offering a selection of permanent items and new units for purchase with gold.
    *   Players can freely rearrange their units on the grid during this phase.
    *   Once preparations are complete, the player clicks "START WAVE" to begin the next combat phase.

4.  **GAME OVER (Game Over Phase)**
    *   Triggered when an enemy crosses the defense line at `x = GRID_OFFSET_X`.
    *   A screen displays the final wave reached and offers a "Restart" option.

---

## 3. Battlefield & Unit System

### 3.1 Battlefield Grid
*   **Dimensions:** A 5-row by 9-column grid.
*   **Placement:** One unit per grid cell.
*   **Interaction:** During the SHOP phase, units can be freely moved by dragging and dropping to swap their positions. During COMBAT, units are locked in place.

### 3.2 Units
Units are the player's primary agents for dealing damage and controlling the battlefield.

*   **Common Attributes:**
    | Attribute | Description |
    | :--- | :--- |
    | **id, name, emoji** | Unique identifier, display name, and visual representation. |
    | **description** | Flavor text and tactical info shown in the Inspector Panel. |
    | **type** | `MELEE`, `RANGED`, `MAGIC`, `ENGINEERING`. Determines which flat damage bonus applies. |
    | **damage, maxCooldown** | Base damage and attack interval (in seconds). |
    | **range** | Attack range in pixels. Displayed to the user in "Grids" for clarity. |
    | **hp / maxHp**| The unit's health. Reaches zero -> `isDead`. |
    | **isDead** | Dead units are inactive for the current wave, shown as a gravestone (🪦). |
    | **isTemp** | If true (from a Draft), the unit is removed after the combat phase ends. |
    | **row, col** | The unit's position on the grid. |
    | **attackType**| **Hero-specific.** Attack pattern: `LINEAR`, `TRACKING`, `TRI_SHOT`, `PENTA_SHOT`. |

*   **Unit Health & Revival:**
    *   Non-temporary units that die during combat are revived at full health at the start of the next SHOP phase.
    *   Temporary units are removed permanently if they die or at the end of the wave.

*   **The Hero Unit ("Keyboard Warrior")**
    *   The player's unique, central unit. Cannot be sold or replaced.
    *   Starts with high base damage.
    *   Has an **Energy** bar that fills over time.
    *   When energy is full, automatically unleashes an **"ULTIMATE!"** ability, damaging all enemies on screen and freezing them temporarily.
    *   The Hero's `attackType`, energy gain rate, and max energy can be upgraded via Draft options.

---

## 4. Combat Systems

### 4.1 Targeting & Attack Logic
*   **Standard Targeting (MELEE, RANGED, ENGINEERING):** Prioritizes the nearest enemy within range on the **same row**.
*   **Global Targeting (MAGIC):** Targets the nearest enemy within range, **regardless of row**.
*   **Hero Targeting:** Follows its current `attackType`.
    *   `LINEAR`: Fires straight ahead on its row.
    *   `TRACKING`: Fires a homing projectile at the nearest enemy.
    *   `TRI_SHOT`: Fires projectiles on its own row, and the rows immediately above and below.
    *   `PENTA_SHOT`: Fires projectiles down all five rows simultaneously.

### 4.2 Damage & Cooldown Formulas
The final combat stats are calculated by combining base values with player stats from items.

*   **Final Damage:**
    ```
    FinalDmg = (BaseDmg + FlatBonus) * (1 + DamagePercent) * (1 + TempDmgMult)
    ```
    *   `FlatBonus`: From `meleeDmg`, `rangedDmg`, etc., based on the unit's `type`.
    *   `DamagePercent`: From `damagePercent` stat.
    *   `TempDmgMult`: Wave-only buff from a Draft selection.

*   **Final Cooldown:**
    ```
    FinalCooldown = BaseCooldown / ((1 + AttackSpeedPercent) * (1 + TempAspdMult))
    ```
    *   `AttackSpeedPercent`: From `attackSpeed` stat.
    *   `TempAspdMult`: Wave-only buff from a Draft selection.

### 4.3 Enemy System
*   **Spawning:**
    *   At the start of a wave, a full queue of enemies is pre-calculated based on `waves.json` and the player's `enemy_count` stat.
    *   The wave's duration is divided into 10-second "buckets."
    *   The total enemy queue is distributed non-uniformly across these buckets, creating a paced rhythm of smaller groups followed by larger hordes (PvZ-style).
*   **Behavior:**
    1.  Spawn at a random row off-screen to the right.
    2.  Move leftwards in a straight line.
    3.  If a player unit is in melee range, stop moving and initiate attacks.
    4.  Attacks are visualized with a quick "lunge" animation.
*   **Visual Scaling:** Enemies have a `scale` attribute. Larger, more dangerous enemies (like Elites and Bosses) are rendered with a larger emoji font size, making them visually intimidating.

---

## 5. Progression & Economy

### 5.1 In-Wave Leveling (Drafting)
*   **XP Gain:** Killing enemies drops XP orbs (visualized as floating text).
*   **Level Up:** The player has a level and XP bar that resets each wave. When the bar fills, the game pauses, and the Draft/Level Up modal appears.
*   **Draft Choices:** The modal offers three random, mutually exclusive choices for the current wave:
    1.  **Mercenary (Temp Unit):** Adds a powerful temporary unit to an empty grid space. The pool includes dedicated mercs and temporary versions of standard weapon units.
    2.  **Hero Buff:** Enhances the Hero unit (e.g., changing `attackType`, improving energy stats).
    3.  **Global Buff:** Affects all units (e.g., "+20% Damage for this wave").

### 5.2 Permanent Progression (Shop)
*   **Gold:** The primary currency, earned by killing enemies.
*   **Shop Interface:** A full-screen interface available between waves. It displays 4 randomly generated items for sale.
*   **Item Types:**
    1.  **Weapons:** Purchase to add a new, permanent unit to an empty grid space.
    2.  **Items (Brotato-style):** Purchase to gain a permanent, passive buff to player stats (`PlayerStats`). These are the primary way to scale power across waves.
*   **Shop Mechanics:**
    *   **Reroll:** Pay an increasing amount of gold to refresh the shop's offerings.
    *   **Lock:** Toggle a lock on items to prevent them from being rerolled.

---

## 6. Content Library (Examples)

### 6.1 Units

| Name | Emoji | Type | Rarity | Role / Special Trait |
| :--- | :--- | :--- | :--- | :--- |
| **Keyboard Warrior**| 🦸‍♂️ | MAGIC | - | Player's Hero. Has an ultimate ability and upgradable attack patterns. |
| **Militia** | 🔫 | RANGED | - | The starting default unit. |
| **Sword** | ⚔️ | MELEE | COMMON | Basic melee unit with knockback. |
| **Wand** | 🪄 | MAGIC | RARE | Fires tracking projectiles with global range. |
| **Turret** | 📡 | ENGINEERING | EPIC | Extremely high fire rate, low damage per shot. |
| **Berzerker** | 👺 | MELEE | - | Mercenary unit with very fast melee attacks. |

### 6.2 Shop Items (Brotato-style)

| Name | Tier | Effect Example |
| :--- | :--- | :--- |
| **Gentle Alien** | 1 | +5% Damage, but +5% Enemy Count. |
| **Coupon** | 1 | -5% Shop Prices. |
| **Piggy Bank** | 2 | Gain interest on your gold at the start of a wave. |
| **Glass Cannon** | 3 | +25% Damage. |
| **Vigilante Ring**| 3 | +3% Damage at the end of each wave (stacks infinitely). |
| **Ricochet** | 4 | Projectiles bounce +1 time, -35% Damage. |

### 6.3 Enemies

| Name | Emoji | Type | Scale | Behavior / Special Trait |
| :--- | :--- | :--- | :--- | :--- |
| **Fly** | 🦟 | NORMAL | 0.6 | Very fast but very low health. |
| **Bruiser** | 🦍 | NORMAL | 1.5 | Slow, tanky, and hits hard. |
| **Looter** | 💰 | SPECIAL | 1.2 | Flees instead of fighting. Drops a large amount of gold if killed. |
| **Rhino** | 🦏 | ELITE | 2.0 | A massive threat with extremely high health and damage. |
| **Predator** | 👹 | BOSS | 3.0 | The final wave boss with immense health. |

### 6.4 Wave Structure
Waves are defined in `data/waves.ts`. Each wave has a `duration`, a `totalCount` of enemies (which is modified by player stats), and a `composition` defining the weighted mix of enemy types. Some waves have flags like `HORDE`, `ELITE`, or `BOSS` to signify special events.

---

## 7. UI / UX

*   **HUD:** A clean, non-intrusive top bar shows Level/XP, Gold, Wave number, and the wave Timer. A pop-out menu on the right details all active stat bonuses from items.
*   **Inspector Panel:** A context-aware panel on the top-right.
    *   **Hover:** Displays real-time stats of any unit or enemy.
    *   **Click-to-Lock:** Clicking an entity pins its details to the panel for continuous monitoring.
    *   **Stat Breakdowns:** Tooltips on stats like Damage and Cooldown show the complete calculation (`Base + Bonus * Multiplier`).
*   **Visual Feedback:**
    *   **Hit Flash:** Entities flash white when taking damage.
    *   **Floating Text:** Damage numbers, XP gains, and gold gains appear as floating text.
    *   **Selection Indicator:** A dashed, rotating circle appears around the inspected entity.
    *   **Hero Ultimate:** A large "ULTIMATE!" text flash and visual screen effect.
