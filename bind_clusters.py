import re

with open('rs3_unified_widget.html', 'r', encoding='utf-8') as f:
    html = f.read()

# The logic to detect and bind isolated clusters
binder_logic = """
        // DETECT AND BIND ISOLATED CLUSTERS (BFS)
        const adj = new Map();
        hydrated.forEach(n => adj.set(n.id, []));
        edges.forEach(e => {
          if (adj.has(e.source)) adj.get(e.source).push(e.target);
          if (adj.has(e.target)) adj.get(e.target).push(e.source);
        });

        const visited = new Set();
        const components = [];
        for (const n of hydrated) {
          if (!visited.has(n.id)) {
            const comp = [];
            const q = [n.id];
            visited.add(n.id);
            while (q.length > 0) {
              const curr = q.shift();
              comp.push(curr);
              for (const neighbor of (adj.get(curr) || [])) {
                if (!visited.has(neighbor)) {
                  visited.add(neighbor);
                  q.push(neighbor);
                }
              }
            }
            components.push(comp);
          }
        }
        
        // Sort components by size descending
        components.sort((a, b) => b.length - a.length);
        
        if (components.length > 1) {
          const mainGraphNodes = new Set(components[0]);
          
          // Pre-calculate degrees in main graph to find popular nodes for fallback
          const mainGraphDegrees = new Map();
          components[0].forEach(id => mainGraphDegrees.set(id, adj.get(id).length));
          const sortedMainNodes = [...components[0]].sort((a, b) => mainGraphDegrees.get(b) - mainGraphDegrees.get(a));
          const topHubs = {
             wiki: sortedMainNodes.find(id => hydrated.find(n => n.id === id).domain === 'wiki') || sortedMainNodes[0],
             calculator: sortedMainNodes.find(id => hydrated.find(n => n.id === id).domain === 'calculator') || sortedMainNodes[0],
             league: sortedMainNodes.find(id => hydrated.find(n => n.id === id).domain === 'league') || sortedMainNodes[0],
             material: sortedMainNodes.find(id => hydrated.find(n => n.id === id).domain === 'material') || sortedMainNodes[0]
          };

          // Attach all smaller components to the main graph
          for (let i = 1; i < components.length; i++) {
            const comp = components[i];
            const attachNodeId = comp[0]; // Just take the first node of this isolated cluster
            const attachNode = hydrated.find(n => n.id === attachNodeId);
            
            // Link it to the main graph hub of the same domain
            const targetHub = topHubs[attachNode.domain] || sortedMainNodes[0];
            
            edges.push({
              source: attachNodeId,
              target: targetHub,
              kind: "cluster-binder"
            });
          }
        }
"""

if "DETECT AND BIND ISOLATED CLUSTERS" not in html:
    html = html.replace('return { nodes: hydrated, edges };', binder_logic + '\n        return { nodes: hydrated, edges };')

with open('rs3_unified_widget.html', 'w', encoding='utf-8') as f:
    f.write(html)
