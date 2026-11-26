import re

with open('rs3_unified_widget.html', 'r', encoding='utf-8') as f:
    html = f.read()

# 1. Add 3d-force-graph script to head
if "3d-force-graph" not in html:
    html = html.replace('</head>', '  <script src="https://unpkg.com/3d-force-graph"></script>\n</head>')

# 2. Replace canvas with div
if '<canvas id="graph"' in html:
    html = re.sub(r'<canvas id="graph".*?</canvas>', '<div id="graph3d" style="width: 100%; height: 100%;"></div>', html)

# 3. Add keyword mesh logic to mergeAllSources
keyword_logic = """
        // KEYWORD AGNOSTIC MESH LOGIC
        const stopWords = new Set(["the", "and", "of", "to", "in", "a", "for", "on", "with", "as", "by", "is", "guide", "calculator", "calculators"]);
        const keywordMap = new Map();
        
        function extractKeywords(str) {
          if (!str) return [];
          return str.toLowerCase().replace(/[^a-z0-9]+/g, " ").split(" ").filter(w => w.length > 2 && !stopWords.has(w));
        }

        for (const n of hydrated) {
          const words = new Set();
          if (n.label) extractKeywords(n.label).forEach(w => words.add(w));
          if (n.title) extractKeywords(n.title).forEach(w => words.add(w));
          if (n.tags) n.tags.forEach(t => extractKeywords(t).forEach(w => words.add(w)));
          if (n.skill) extractKeywords(n.skill).forEach(w => words.add(w));
          
          for (const w of words) {
            if (!keywordMap.has(w)) keywordMap.set(w, []);
            keywordMap.get(w).push(n.id);
          }
        }

        for (const [kw, nodesList] of keywordMap.entries()) {
          // Connect keyword clusters that have 2 to 50 nodes (avoid super hubs)
          if (nodesList.length > 1 && nodesList.length <= 50) {
            const root = nodesList[0];
            for (let i = 1; i < nodesList.length; i++) {
              edges.push({
                source: root,
                target: nodesList[i],
                kind: "keyword-cluster",
                keyword: kw
              });
            }
          }
        }
"""

if "KEYWORD AGNOSTIC MESH LOGIC" not in html:
    html = html.replace('return { nodes: hydrated, edges };', keyword_logic + '\n        return { nodes: hydrated, edges };')

# 4. Replace initGraph completely
new_init_graph = """      function initGraph() {
        const container = document.getElementById("graph3d");
        if (!container) return;
        
        const palette = {
          wiki: "#4a9eff",
          calculator: "#d2b244",
          league: "#b07cc8",
          material: "#8c7b5b",
        };
        
        // Build Legend
        const cats = ["wiki", "calculator", "league", "material"];
        const legendEl = document.getElementById("legend");
        if(legendEl) {
          legendEl.innerHTML = cats
            .map(
              (c) =>
                `<div class="graph-legend-item"><div class="graph-legend-dot" style="background:${palette[c] || "#888"}"></div><span>${c}</span></div>`,
            )
            .join("");
        }

        const filteredNodes = STATE.nodes.filter(n => {
           if (STATE.filter === "all") return true;
           return n.domain === STATE.filter;
        });
        const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
        
        const filteredEdges = STATE.edges.filter(e => {
           // 3d-force-graph modifies e.source/target to be objects after first run, so handle both string and obj
           const sId = typeof e.source === "object" ? e.source.id : e.source;
           const tId = typeof e.target === "object" ? e.target.id : e.target;
           return filteredNodeIds.has(sId) && filteredNodeIds.has(tId);
        });

        // Clear existing canvas/graph if any
        container.innerHTML = "";
        
        window.graph3d = ForceGraph3D()(container)
          .backgroundColor("#09090b")
          .nodeColor(n => palette[n.domain] || "#888")
          .nodeRelSize(4)
          .nodeVal(n => Math.log2((n.in_degree || n.connections?.length || 1) + 2) * 1.5)
          .nodeLabel(n => n.label || n.id)
          .linkColor(e => e.kind === "keyword-cluster" ? "rgba(100,255,100,0.15)" : "rgba(120,120,160,0.3)")
          .linkOpacity(1)
          .linkWidth(e => e.kind === "keyword-cluster" ? 0.3 : 0.6)
          .onNodeClick(node => {
            // Optional: fly to node
            const distance = 40;
            const distRatio = 1 + distance/Math.hypot(node.x, node.y, node.z);
            window.graph3d.cameraPosition(
              { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
              node, // lookAt
              3000  // ms transition
            );
          })
          .graphData({ nodes: filteredNodes, links: filteredEdges });
      }"""

html = re.sub(r'      function initGraph\(\) \{.*?      return \{ updateFilter: \(\) => \{\} \};\n      \}', new_init_graph, html, flags=re.DOTALL)

with open('rs3_unified_widget.html', 'w', encoding='utf-8') as f:
    f.write(html)
