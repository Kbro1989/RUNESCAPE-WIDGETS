import re

with open('rs3_unified_widget.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix buildCalculatorNodes
content = re.sub(
    r"function buildCalculatorNodes\(calcArray\) \{[\s\S]*?return \{[\s\S]*?id: canonicalizeArticle\(c\.title\),[\s\S]*?tags,[\s\S]*?\};[\s\S]*?\}\);[\s\S]*?\}",
    """function buildCalculatorNodes(calcArray) {
        if (!Array.isArray(calcArray)) return [];
        return calcArray.map((c) => {
          const tags = [];
          if (c.section) tags.push(c.section);
          if (c.skill_title) tags.push(c.skill_title);
          if (c.badges) {
            for (const b of c.badges) tags.push(b);
          }
          return {
            id: canonicalizeArticle(c.title || "Unknown"),
            label: c.title,
            domain: "calculator",
            section: c.section,
            url: c.href,
            description: c.desc,
            icon: c.img,
            occurrences: 1,
            sources: ["calculator"],
            tags,
            skill: c.skill,
            skill_title: c.skill_title,
            badges: c.badges,
            href: c.href,
            desc: c.desc,
            title: c.title,
            creator_link: c.creator_link,
            bg_color: c.bg_color
          };
        });
      }""",
    content
)

# 2. Fix buildLeagueNodes
content = content.replace(
    '''        nodes.push({
          id: "equilibrium-league",
          label: "Equilibrium League",
          domain: "league",
          section: "Leagues",
          kind: "league-root",
          url: "https://runescape.wiki/w/Leagues_II:_Equilibrium",
          description:
            "Event-based game mode: temporary world with special modifiers, relics, blessings, and region unlocks. Not a core gameplay mode.",
        });''',
    '''        nodes.push({
          id: "equilibrium-league",
          label: "Equilibrium League",
          domain: "league",
          section: "Leagues",
          kind: "league-root",
          url: "https://runescape.wiki/w/Leagues_II:_Equilibrium",
          description:
            "Event-based game mode: temporary world with special modifiers, relics, blessings, and region unlocks. Not a core gameplay mode.",
          sources: ["league"],
        });'''
)
content = content.replace(
    '''                kind: "blessing",
              });''',
    '''                kind: "blessing",
                sources: ["league"],
              });'''
)


# 3. Add global error catcher to init()
old_init = """      async function init() {
        const [topologyRaw, furnRaw, leagueRaw, calcRaw] = await Promise.all([
          loadJSON("./main-game/topology_data.json"),
          loadJSON("./main-game/furniture_wiki_link_sources.json"),
          loadJSON("./leagues-ii-equilibrium/equilibrium_league_data.json"),
          loadJSON("./main-game/calculator_index.json"),
        ]);
        const calcNodes = buildCalculatorNodes(calcRaw);
        const topologyResult = buildTopologyNodes(topologyRaw);
        const furnNodes = buildFurnitureNodes(furnRaw);
        const leagueNodes = buildLeagueNodes(leagueRaw);
        const merged = mergeAllSources(
          topologyResult,
          furnNodes,
          calcNodes,
          leagueNodes,
        );
        STATE.nodes = merged.nodes;
        STATE.edges = merged.edges;
        const s = summarize(STATE.nodes, STATE.edges);
        renderMeta(s);
        renderLegend(STATE.nodes);
        renderNodeGrid(STATE.nodes);
        renderCalculatorGrid(calcNodes);
        renderLeagueGrid(leagueNodes);
        renderMaterialGrid(furnNodes);
        wireFilterPills();
        wireTabs();
        initGraph();
      }"""

new_init = """      async function init() {
        try {
          const [topologyRaw, furnRaw, leagueRaw, calcRaw] = await Promise.all([
            loadJSON("./main-game/topology_data.json"),
            loadJSON("./main-game/furniture_wiki_link_sources.json"),
            loadJSON("./leagues-ii-equilibrium/equilibrium_league_data.json"),
            loadJSON("./main-game/calculator_index.json"),
          ]);
          if (!topologyRaw && !furnRaw && !leagueRaw && !calcRaw) {
            throw new Error("Data failed to load. If opening via file:///, use a local web server.");
          }
          const calcNodes = buildCalculatorNodes(calcRaw);
          const topologyResult = buildTopologyNodes(topologyRaw);
          const furnNodes = buildFurnitureNodes(furnRaw);
          const leagueNodes = buildLeagueNodes(leagueRaw);
          const merged = mergeAllSources(
            topologyResult,
            furnNodes,
            calcNodes,
            leagueNodes,
          );
          STATE.nodes = merged.nodes;
          STATE.edges = merged.edges;
          const s = summarize(STATE.nodes, STATE.edges);
          renderMeta(s);
          renderLegend(STATE.nodes);
          renderNodeGrid(STATE.nodes);
          renderCalculatorGrid(calcNodes);
          renderLeagueGrid(leagueNodes);
          renderMaterialGrid(furnNodes);
          
          const mainSearch = document.getElementById("search");
          if(mainSearch) {
            mainSearch.addEventListener("input", (e) => {
              const nodeSearch = document.getElementById("node-search");
              if(nodeSearch) nodeSearch.value = e.target.value;
              renderNodeGrid(STATE.nodes);
            });
          }
          const nSearch = document.getElementById("node-search");
          if(nSearch) {
            nSearch.addEventListener("input", () => {
              renderNodeGrid(STATE.nodes);
            });
          }

          wireFilterPills();
          wireTabs();
          initGraph();
        } catch (err) {
          const d = document.createElement("div");
          d.style = "position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#bc483d;color:white;padding:20px;border-radius:8px;z-index:9999;";
          d.innerHTML = `<h3>Error Loading Widget</h3><p>${err.message}</p><pre style="font-size:11px;overflow-x:auto;">${err.stack}</pre>`;
          document.body.appendChild(d);
          console.error(err);
        }
      }"""
content = content.replace(old_init, new_init)

with open('rs3_unified_widget.html', 'w', encoding='utf-8') as f:
    f.write(content)
