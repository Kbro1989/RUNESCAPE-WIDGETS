# Equilibrium Procedural Build Naming Engine

> For Leagues II: Equilibrium — 2,946,308,904 possible unique builds.
> Generates a canonical variant name from any combination of relics, blessings, and regions.

---

## I. Combinatorics Verification

### Relic Permutations: 8,019
- **Without Rejuvenated:** Tiers 1–5 have 3 choices each. Tier 6 has 1 (Perkfection). Tier 7 has 3.
  `3^5 × 1 × 3 = 729`
- **With Rejuvenated:** Tier 6 = Rejuvenated. Backtrack pick from any of 5 previous tiers, each with 2 remaining choices.
  `3^5 × 10 × 3 = 7,290`
- **Total:** `729 + 7,290 = 8,019`

### Blessing Permutations: 6,561
- 8 tiers (T1–T6 + God Tier 1 + God Tier 2), 3 paths each.
  `3^8 = 6,561`

### Region Permutations: 56
- Misthalin + Havenhythe (starting) + Karamja (auto) = 3 fixed.
- 8 remaining regions, choose 3.
  `C(8,3) = 56`

### Total Unique Builds
`8,019 × 6,561 × 56 = 2,946,308,904`

---

## II. Naming Algorithm

The engine produces a three-part name:
```
[Prefix] [Core Title] [Suffix]
```

### Prefix — Relic Identity

Selected from the **most impactful** relic in the build, in priority order:

| Priority | Condition | Prefix |
|----------|-----------|--------|
| 1 | Tier 7 relic selected | Capstone prefix (Infernal / Deathless / Icyene) |
| 2 | Tier 6 = Perkfection | "Perfected" |
| 3 | Tier 6 = Rejuvenated | "Twice-Blessed" (+ secondary relic prefix if picked) |
| 4 | Highest selected tier 1–5 | That relic's prefix |
| 5 | Nothing selected | "Unnamed" |

**Relic Prefix Mapping:**

| Relic ID | Prefix |
|----------|--------|
| endless_harvest | Tireless |
| survivalist | Stalwart |
| golden_touch | Gilded |
| animal_wrangler | Beastmaster |
| superheated | Forged |
| divine_druid | Verdant |
| natures_network | Sylvan |
| assassins_insight | Shadow |
| voidwalker | Abyssal |
| crystal_grace | Crystalline |
| transmutation | Alchemical |
| antiquarian | Ancient |
| clue_connoisseur | Seeker |
| production_master | Artisan |
| devout | Saint |
| perkfection | Perfected |
| rejuvenated | Twice-Blessed |
| infernal_fire | Infernal |
| naragi_edict | Deathless |
| icyenic_faith | Icyene |

### Core Title — Blessing Path Dominance

Counted across all 8 blessing tiers. Deterministic hash selects from pool.

| Condition | Path | Title Pool |
|-----------|------|------------|
| All 8 same path | Chaos | Ascendant of Chaos |
| All 8 same path | Balance | Ascendant of Balance |
| All 8 same path | Order | Ascendant of Order |
| ≥ 6 same path | Chaos | Executioner, Warlord, Reaver, Destroyer |
| ≥ 6 same path | Balance | Druid, Avenger, Warden, Guardian |
| ≥ 6 same path | Order | Immortal, Templar, Paladin, Crusader |
| ≥ 4 same path | Chaos | Executioner, Warlord, Reaver, Destroyer |
| ≥ 4 same path | Balance | Druid, Avenger, Warden, Guardian |
| ≥ 4 same path | Order | Immortal, Templar, Paladin, Crusader |
| All 3 paths present, no majority | — | Avatar, Sovereign, Equilibrist, Harmonist |
| Only 2 paths present, split | — | Discordant |
| No selections | — | Wanderer |

**Selection method:** `title = pool[hash(buildState) % pool.length]` — deterministic per build, no RNG.

### Suffix — Region Identity

Taken from the **highest unlocked region** (by task threshold). If no regions unlocked beyond starters, defaults to "of Gielinor".

| Region | Suffix |
|--------|--------|
| Misthalin | of the Heartlands |
| Havenhythe | of the Sanguine Coast |
| Karamja | of the Jungle |
| Anachronia | of the Lost World |
| Asgarnia | of the White Mountain |
| Desert | of the Sands |
| Fremennik | of the North |
| Kandarin | of the Western Realms |
| Morytania | of the Myre |
| Tirannwn | of the Crystal City |
| Wilderness | of the Abyss |

---

## III. Example Outputs

### Build A: Chaos Executioner
- **Relics:** Survivalist → Superheated → Voidwalker → Crystal Grace → Production Master → Perkfection → Infernal Fire
- **Blessings:** All Chaos (8×)
- **Regions:** Misthalin → Havenhythe → Karamja → Desert → Asgarnia → Wilderness

**Name:** `Infernal Ascendant of Chaos of the Abyss`

### Build B: Order Immortal
- **Relics:** Endless Harvest → Divine Druid → Nature's Network → Crystal Grace → Devout → Rejuvenated (Production Master) → Icyenic Faith
- **Blessings:** All Order (8×)
- **Regions:** Misthalin → Havenhythe → Karamja → Fremennik → Morytania → Tirannwn

**Name:** `Icyene Ascendant of Order of the Crystal City`

### Build C: Balance Poison (True Equilibrium)
- **Relics:** Golden Touch → Animal Wrangler → Assassin's Insight → Antiquarian → Clue Connoisseur → Perkfection → Naragi Edict
- **Blessings:** 3 Chaos, 3 Balance, 2 Order
- **Regions:** Misthalin → Havenhythe → Karamja → Anachronia → Kandarin → Wilderness

**Name:** `Deathless Sovereign of the Abyss`

### Build D: Rejuvenated Hybrid
- **Relics:** ... → Rejuvenated (back for Superheated) → Infernal Fire
- **Blessings:** 4 Chaos, 2 Balance, 2 Order
- **Regions:** ... → Wilderness

**Name:** `Twice-Blessed Reaver of the Abyss`

---

## IV. Integration Notes

### For POG2 Widget
```javascript
function generateBuildName(state) {
  const prefix = derivePrefix(state.relics, state.rejuvenatedPick);
  const title = deriveTitle(state.blessings);
  const suffix = deriveSuffix(state.blessingTasks);
  return `${prefix} ${title} ${suffix}`;
}
```

### Deterministic Hash
Use a string hash of the serialized build state (relic IDs + blessing IDs + region task count) to index into title pools. This ensures:
- Same build → same name, always
- No pseudo-RNG dependency
- Reproducible across sessions

### Border Color Coding
The nameplate border should reflect the dominant blessing path:
- Chaos → Red (`var(--kimi-chart-2)`)
- Balance → Green (`var(--kimi-chart-3)`)
- Order → Blue (`var(--kimi-chart-1)`)
- Equilibrium (mixed) → Gold (`#d4a017`)
- None → Neutral border

---

## V. True Equilibrium Badge

Display alongside the name:
```
X unique paths — [True Equilibrium maxed if 3]
```

This reinforces the diversity mechanic and gives the player immediate feedback on whether they're hitting the 3-stack True Equilibrium buff.

---

*Engine spec for Equilibrium League Variant Forger widget. Compatible with POG2 Sovereign Stack.*
