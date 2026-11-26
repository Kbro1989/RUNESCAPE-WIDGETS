import re

with open('rs3_unified_widget.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Update linkColor and linkWidth to support 'cluster-binder'
html = html.replace('e.kind === "keyword-cluster" ? "rgba(100,255,100,0.15)" : "rgba(120,120,160,0.3)"', 
                    'e.kind === "keyword-cluster" ? "rgba(100,255,100,0.15)" : (e.kind === "cluster-binder" ? "rgba(255,100,100,0.15)" : "rgba(120,120,160,0.3)")')

html = html.replace('e.kind === "keyword-cluster" ? 0.3 : 0.6',
                    'e.kind === "keyword-cluster" ? 0.3 : (e.kind === "cluster-binder" ? 0.2 : 0.6)')

with open('rs3_unified_widget.html', 'w', encoding='utf-8') as f:
    f.write(html)
