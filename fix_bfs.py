import re

with open('rs3_unified_widget.html', 'r', encoding='utf-8') as f:
    html = f.read()

old_edge_logic = """        edges.forEach(e => {
          if (adj.has(e.source)) adj.get(e.source).push(e.target);
          if (adj.has(e.target)) adj.get(e.target).push(e.source);
        });"""

new_edge_logic = """        edges.forEach(e => {
          if (adj.has(e.source) && adj.has(e.target)) {
            adj.get(e.source).push(e.target);
            adj.get(e.target).push(e.source);
          }
        });"""

html = html.replace(old_edge_logic, new_edge_logic)

with open('rs3_unified_widget.html', 'w', encoding='utf-8') as f:
    f.write(html)
