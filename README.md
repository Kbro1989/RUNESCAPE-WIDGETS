# RuneScape Widgets

A collection of self-contained interactive dashboards, widgets, and tools for RuneScape 3. 

## Directory Structure

### `/main-game` (Base RS3 Wiki Tools)
| File | Description |
|------|-------------|
| `index.html` | **RS3 Wiki Topology Explorer**: Full interactive explorer for the RuneScape 3 wiki link topology graph. |
| `rs3_calculator_index.html` | Original calculator index for RuneScape 3. |
| `rs3-calculator-index-upgraded-2026.html` | Upgraded 2026 version of the calculator index. |
| `topology_data.json` | Raw graph data for the Wiki Topology Explorer. |
| `unified_data_blob.json` | Comprehensive data blob. |
| `calculator_index.json` | Data source for the calculator indexes. |
| `furniture_wiki_link_sources.json` | Link source data specifically for furniture items. |
| `FurnitureWikiLinkSources.*` | Documentation and typings for the furniture link sources. |
| `rehydrate_interaction_vocab.*` | Scripts for rehydrating interaction vocabularies. |
| `rsmv_upstream_commit_intelligence.md` | Commit intelligence notes for RSMV upstream. |

### `/leagues-ii-equilibrium` (Challenge Mode Guide)
| File | Description |
|------|-------------|
| `equilibrium_compendium_widget.html` | Interactive compendium for Equilibrium League data. |
| `equilibrium_league_data.json` | Data source for the Equilibrium League compendium widget. |
| `EquilibriumLeagueSchema*.ts` | TypeScript schemas for the Equilibrium League data. |
| `Equilibrium_Naming_Engine.md` | Spec for the procedural build naming engine. |
| `Equilibrium_Strategy_Rev2.md` | Strategy guide for the challenge mode. |

### `/` (Root)
| File | Description |
|------|-------------|
| `rs3_unified_widget.html` | Unified widget orchestrator for exploring data from both domains. |

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
