# RuneScape Widgets

A collection of self-contained interactive dashboards, widgets, and tools for RuneScape 3. 

## Files

| File | Description |
|------|-------------|
| `index.html` | **RS3 Wiki Topology Explorer**: Full interactive explorer for the RuneScape 3 wiki link topology graph. Search, filter by category, sort by in-degree or name. |
| `rs3_unified_widget.html` | Unified widget for exploring various RuneScape 3 data points. |
| `equilibrium_compendium_widget.html` | Interactive compendium for Equilibrium League data. |
| `rs3_calculator_index.html` | Original calculator index for RuneScape 3. |
| `rs3-calculator-index-upgraded-2026.html` | Upgraded 2026 version of the calculator index. |
| `topology_data.json` | Raw graph data for the Wiki Topology Explorer: 84 source pages, 17,946 unique articles, 42,517 link instances. |
| `unified_data_blob.json` | Comprehensive data blob for the unified widget. |
| `equilibrium_league_data.json` | Data source for the Equilibrium League compendium widget. |
| `calculator_index.json` | Data source for the calculator indexes. |
| `furniture_wiki_link_sources.json` | Link source data specifically for furniture items. |
| `FurnitureWikiLinkSources.md / .pdf / .ts` | Documentation and typings for the furniture link sources. |
| `EquilibriumLeagueSchema.ts` | TypeScript schema for the Equilibrium League data. |
| `rehydrate_interaction_vocab.*` | Scripts for rehydrating interaction vocabularies. |
| `rsmv_upstream_commit_intelligence.md` | Commit intelligence notes for RSMV upstream. |

## Run Locally

Most widgets are fully self-contained HTML files and can be run by double-clicking them.

### Option 1: Direct open
Double-click `index.html` or any of the other HTML widgets. Works in Chrome, Firefox, Edge, Safari.

### Option 2: Local server (recommended)
```bash
python3 -m http.server 8080
# Then open http://localhost:8080
```

### Option 3: Node
```bash
npx serve .
```

## Data Sources

- **Wiki Topology Explorer**: MediaWiki API (`action=query&prop=links`) against `runescape.wiki`. 84 core pages queried including: Furniture, Construction, Player-owned_house, Money_making_guide, Bestiary, List_of_quests, all 29 skills, all major bosses, PvM abilities, perks, relics, locations, and more.
