
      const WIKI_BASE = "https://runescape.wiki/w";
      const DOMAINS = {
        wiki: "Wiki",
        calculator: "Calculator",
        league: "League",
        material: "Material",
      };
      function esc(s) {
        const d = document.createElement("div");
        d.textContent = s;
        return d.innerHTML;
      }
      function slugify(s) {
        return s
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, "");
      }
      function canonicalizeArticle(name) {
        return name
          .trim()
          .replace(/\(furniture\)/g, "")
          .replace(/\s+/g, " ")
          .replace(/[()]+/g, (m) => (m === "()" ? "" : m))
          .trim();
      }

      async function loadJSON(url) {
        try {
          const r = await fetch(url);
          if (!r.ok) throw new Error("HTTP " + r.status);
          return await r.json();
        } catch (e) {
          console.warn("Failed to load", url, e);
          return null;
        }
      }

      function buildTopologyNodes(rawTopology) {
        const nodeMap = new Map();
        const edgeList = [];
        if (!rawTopology || !rawTopology.pages) return { nodes: [], edges: [] };
        for (const [pageName, pageData] of Object.entries(rawTopology.pages)) {
          const canonical = canonicalizeArticle(pageName);
          if (!nodeMap.has(canonical))
            nodeMap.set(canonical, {
              id: canonical,
              label: canonical,
              domain: "wiki",
              in_degree: pageData.out_degree || 0,
              backlinks: [],
              connections: new Set(),
              sources: new Set(),
            });
          const src = nodeMap.get(canonical);
          src.sources.add("topology");
          for (const target of pageData.unique_links || []) {
            const tCanon = canonicalizeArticle(target);
            if (!nodeMap.has(tCanon))
              nodeMap.set(tCanon, {
                id: tCanon,
                label: tCanon,
                domain: "wiki",
                in_degree: 0,
                backlinks: [],
                connections: new Set(),
                sources: new Set(),
              });
            const tgt = nodeMap.get(tCanon);
            tgt.sources.add("topology");
            tgt.backlinks.push(canonical);
            src.connections.add(tCanon);
            tgt.connections.add(canonical);
            edgeList.push({
              source: canonical,
              target: tCanon,
              kind: "wiki-link",
            });
          }
        }
        const nodes = Array.from(nodeMap.values()).map((n) => ({
          id: n.id,
          label: n.label,
          domain: "wiki",
          in_degree: n.in_degree,
          backlinks: n.backlinks,
          connections: Array.from(n.connections),
          sources: Array.from(n.sources),
          url: `${WIKI_BASE}/${encodeURIComponent(n.id.replace(/ /g, "_"))}`,
        }));
        const edgeMap = new Map();
        for (const e of edgeList) {
          const key = `${e.source}::${e.target}`;
          if (!edgeMap.has(key)) edgeMap.set(key, { ...e, count: 0 });
          edgeMap.get(key).count++;
        }
        const edges = Array.from(edgeMap.values());
        return { nodes, edges };
      }

      function buildFurnitureNodes(furnData) {
        if (
          !furnData ||
          !furnData.categories ||
          !furnData.categories.wiki_articles
        )
          return [];
        return furnData.categories.wiki_articles.map((a) => ({
          id: canonicalizeArticle(
            a.titles[0] || a.href.replace(/^\/w\//, "").replace(/_/g, " "),
          ),
          label: a.titles[0] || a.href.replace(/^\/w\//, "").replace(/_/g, " "),
          domain: "material",
          occurrences: a.occurrences,
          href: a.href,
          url: `https://runescape.wiki${a.href}`,
          sources: ["furniture"],
          kind: "construction-material",
        }));
      }

      function buildCalculatorNodes(calcArray) {
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
      }

      function buildCalculatorAdjacency(calcNodes) {
        const edgeList = [];
        const bySection = new Map();
        const byBadge = new Map();
        const bySkill = new Map();
        for (const n of calcNodes) {
          const sec = n.section;
          if (sec)
            bySection.get(sec)
              ? bySection.get(sec).push(n)
              : bySection.set(sec, [n]);
          for (const b of n.badges || []) {
            byBadge.get(b) ? byBadge.get(b).push(n) : byBadge.set(b, [n]);
          }
          const sk = n.skill;
          if (sk) {
            bySkill.get(sk) ? bySkill.get(sk).push(n) : bySkill.set(sk, [n]);
          }
        }
        for (const arr of bySection.values())
          for (let i = 0; i < arr.length; i++)
            for (let j = i + 1; j < arr.length; j++)
              edgeList.push({
                source: arr[i].id,
                target: arr[j].id,
                kind: "section",
              });
        for (const arr of byBadge.values())
          for (let i = 0; i < arr.length; i++)
            for (let j = i + 1; j < arr.length; j++)
              edgeList.push({
                source: arr[i].id,
                target: arr[j].id,
                kind: "badge",
              });
        for (const arr of bySkill.values())
          for (let i = 0; i < arr.length; i++)
            for (let j = i + 1; j < arr.length; j++)
              edgeList.push({
                source: arr[i].id,
                target: arr[j].id,
                kind: "skill",
              });
        return edgeList;
      }

      function buildLeagueNodes(leagueData) {
        if (!leagueData) return [];
        const nodes = [];
        nodes.push({
          id: "equilibrium-league",
          label: "Equilibrium League",
          domain: "league",
          section: "Leagues",
          kind: "league-root",
          url: "https://runescape.wiki/w/Leagues_II:_Equilibrium",
          description:
            "Event-based game mode: temporary world with special modifiers, relics, blessings, and region unlocks. Not a core gameplay mode.",
          sources: ["league"],
        });
        if (leagueData.relic_tiers)
          for (const tier of leagueData.relic_tiers)
            for (const choice of tier.choices || [])
              nodes.push({
                id: `relic-${choice.id}`,
                label: choice.name,
                domain: "league",
                section: "Relics",
                tier: tier.tier,
                points_required: tier.points_required,
                skills: choice.skills || [],
                description: choice.description,
                icon: choice.icon,
                url: `https://runescape.wiki/w/${encodeURIComponent(choice.name.replace(/ /g, "_"))}`,
                kind: "relic",
                sources: ["league"],
              });
        if (leagueData.blessing_tiers)
          for (const tier of leagueData.blessing_tiers)
            for (const choice of tier.choices || [])
              nodes.push({
                id: `blessing-${choice.id}`,
                label: choice.name,
                domain: "league",
                section: "Blessings",
                tier: tier.tier,
                path: choice.path,
                description: choice.description,
                url: `https://runescape.wiki/w/${encodeURIComponent(choice.name.replace(/ /g, "_"))}`,
                kind: "blessing",
                sources: ["league"],
              });
        if (leagueData.regions)
          for (const region of leagueData.regions || [])
            nodes.push({
              id: `region-${region.id}`,
              label: region.name,
              domain: "league",
              section: "Regions",
              points: region.points,
              tasks: region.tasks,
              starting: region.starting,
              auto_quests: region.auto_quests || [],
              url: `https://runescape.wiki/w/${encodeURIComponent(region.name.replace(/ /g, "_"))}`,
              kind: "region",
              sources: ["league"],
            });
        return nodes;
      }

      function hydrateMissing(topologyNodes, extraNodes) {
        const allById = new Map();
        for (const n of [...topologyNodes, ...extraNodes])
          allById.set(slugify(n.id), n);
        for (const n of extraNodes) {
          const key = slugify(n.id);
          if (!allById.has(key))
            allById.set(key, {
              ...n,
              in_degree: 0,
              backlinks: [],
              connections: [],
            });
          else {
            const existing = allById.get(key);
            existing.sources = [
              ...new Set([...existing.sources, ...n.sources]),
            ];
            if (n.occurrences)
              existing.occurrences =
                (existing.occurrences || 0) + n.occurrences;
            if (!existing.url && n.url) existing.url = n.url;
            if (!existing.domain) existing.domain = n.domain;
          }
        }
        const nameMap = new Map();
        for (const n of allById.values()) {
          const canon = canonicalizeArticle(n.label || n.id);
          const key = slugify(canon);
          if (!nameMap.has(key)) nameMap.set(key, { ...n, id: canon });
        }
        return Array.from(nameMap.values());
      }

      function mergeAllSources(
        topologyResult,
        furnNodes,
        calcNodes,
        leagueNodes,
      ) {
        const extra = [...furnNodes, ...calcNodes, ...leagueNodes];
        const hydrated = hydrateMissing(topologyResult.nodes, extra);
        const edges = [...topologyResult.edges];
        const calcEdges = buildCalculatorAdjacency(calcNodes);
        edges.push(...calcEdges);
        const nodeById = new Map(hydrated.map((n) => [slugify(n.id), n]));
        for (const n of extra) {
          const key = slugify(n.id);
          const node = nodeById.get(key);
          if (!node) continue;
          if (n.href && n.href.includes("/w/")) {
            const targetSlug = slugify(
              n.href.replace(/^\/w\//, "").replace(/_/g, " "),
            );
            if (nodeById.has(targetSlug) && targetSlug !== key)
              edges.push({
                source: node.id,
                target: nodeById.get(targetSlug).id,
                kind: "material-link",
              });
          }
          if (n.backlinks && Array.isArray(n.backlinks))
            for (const bl of n.backlinks) {
              const blSlug = slugify(bl);
              if (nodeById.has(blSlug))
                edges.push({ source: bl, target: node.id, kind: "backlink" });
            }
        }

        // Use Calculators and Full Wiki Data as baseline source pointers for League modifiers
        for (const ln of leagueNodes) {
          if (!ln.skills || !ln.skills.length) continue;
          const lNode = nodeById.get(slugify(ln.id));
          if (!lNode) continue;

          for (const sk of ln.skills) {
            const skSlug = slugify(sk);
            for (const n of hydrated) {
              if (n.id === lNode.id) continue;
              // Connect to matching calculators
              if (n.domain === "calculator") {
                if (
                  (n.skill && slugify(n.skill) === skSlug) ||
                  (n.skill_title && slugify(n.skill_title) === skSlug)
                ) {
                  edges.push({
                    source: lNode.id,
                    target: n.id,
                    kind: "league-calc-pointer",
                  });
                }
              }
              // Connect to matching full wiki topology nodes (e.g. the Archaeology skill page itself)
              if (n.domain === "wiki") {
                if (slugify(n.id) === skSlug) {
                  edges.push({
                    source: lNode.id,
                    target: n.id,
                    kind: "league-wiki-pointer",
                  });
                }
              }
            }
          }
        }

        
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

        return { nodes: hydrated, edges };
      }

      function summarize(nodes, edges) {
        const domains = {};
        const kinds = {};
        for (const n of nodes) {
          domains[n.domain] = (domains[n.domain] || 0) + 1;
          if (n.kind) kinds[n.kind] = (kinds[n.kind] || 0) + 1;
        }
        const linkCount = edges.filter((e) => e.kind === "wiki-link").length;
        const matCount = edges.filter((e) => e.kind !== "wiki-link").length;
        return {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          wikiLinks: linkCount,
          materialLinks: matCount,
          domains,
          kinds,
        };
      }

      let STATE = {
        nodes: [],
        edges: [],
        filter: "all",
        query: "",
        hover: null,
      };

      function renderMeta(s) {
        document.getElementById("meta").innerHTML =
          `<span>nodes: <span class="val">${s.totalNodes.toLocaleString()}</span></span><span>edges: <span class="val">${s.totalEdges.toLocaleString()}</span></span><span>wiki links: <span class="val">${s.wikiLinks.toLocaleString()}</span></span><span>calculator adjacencies: <span class="val">${s.materialLinks.toLocaleString()}</span></span>`;
        document.getElementById("count-all").textContent =
          s.totalNodes.toLocaleString();
        document.getElementById("count-wiki").textContent = (
          s.domains["wiki"] || 0
        ).toLocaleString();
        document.getElementById("count-calc").textContent = (
          s.domains["calculator"] || 0
        ).toLocaleString();
        document.getElementById("count-league").textContent = (
          s.domains["league"] || 0
        ).toLocaleString();
        document.getElementById("count-mat").textContent = (
          s.domains["material"] || 0
        ).toLocaleString();
      }
      function renderLegend(nodes) {
        const cats = [...new Set(nodes.map((n) => n.domain))];
        const palette = {
          wiki: "#4a9eff",
          calculator: "#d2b244",
          league: "#b07cc8",
          material: "#8c7b5b",
        };
        document.getElementById("legend").innerHTML = cats
          .map(
            (c) =>
              `<div class="graph-legend-item"><div class="graph-legend-dot" style="background:${palette[c] || "#888"}"></div><span>${c}</span></div>`,
          )
          .join("");
      }

      function initGraph() {
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
      }

      const tooltip = document.getElementById("tooltip");
      function updateTooltip(e, node) {
        if (!node) {
          hideTooltip();
          return;
        }
        const domainColor = {
          wiki: "#4a9eff",
          calculator: "#d2b244",
          league: "#b07cc8",
          material: "#8c7b5b",
        };
        const color = domainColor[node.domain] || "#888";
        const chips = [];
        if (node.badges)
          for (const b of node.badges)
            chips.push(`<span class="chip chip-${b}">${b}</span>`);
        if (node.kind) chips.push(`<span class="chip">${node.kind}</span>`);
        if (node.section)
          chips.push(`<span class="chip">${esc(node.section)}</span>`);
        if (node.skill)
          chips.push(`<span class="chip">${esc(node.skill)}</span>`);
        const meta = [];
        if (node.section) meta.push(esc(node.section));
        if (node.skill) meta.push("skill: " + esc(node.skill));
        if (node.badges && node.badges.length)
          meta.push("badges: " + node.badges.join(", "));
        if (node.creator_link) meta.push("creator: " + esc(node.creator_link));
        if (node.meta && node.meta.geo) meta.push("geo: " + esc(node.meta.geo));
        if (node.meta && node.meta.infra)
          meta.push("infra: " + esc(node.meta.infra));
        tooltip.innerHTML = `<h3 style="color:${color}">${esc(node.label)}</h3><div class="meta">${node.domain} · in-degree ${node.in_degree || 0} · ${(node.connections || []).length} connections</div><div class="meta">${meta.join(" · ")}</div>${node.description ? `<div style="margin:6px 0;color:var(--text-secondary)">${esc(node.description)}</div>` : ""}${node.url ? `<a class="link" href="${esc(node.url)}" target="_blank" rel="noopener">${esc(node.url)}</a>` : ""}<div class="chips">${chips.join("")}</div>`;
        tooltip.style.opacity = "1";
        const x = Math.min(e.clientX + 14, window.innerWidth - 380);
        const y = Math.min(e.clientY + 14, window.innerHeight - 220);
        tooltip.style.left = x + "px";
        tooltip.style.top = y + "px";
      }
      function hideTooltip() {
        tooltip.style.opacity = "0";
      }

      function renderNodeGrid(nodes) {
        const grid = document.getElementById("node-grid");
        const q = (
          document.getElementById("node-search").value || ""
        ).toLowerCase();
        const items = nodes
          .filter((n) => {
            if (STATE.filter !== "all" && n.domain !== STATE.filter)
              return false;
            if (
              q &&
              !(n.label || "").toLowerCase().includes(q) &&
              !(n.id || "").toLowerCase().includes(q)
            )
              return false;
            return true;
          })
          .slice(0, 240);
        document.getElementById("node-stats").innerHTML =
          `<div class="stat"><div class="val">${nodes.length.toLocaleString()}</div><div class="label">nodes</div></div><div class="stat"><div class="val">${items.length.toLocaleString()}</div><div class="label">shown</div></div>`;
        grid.innerHTML =
          items
            .map((n, i) => {
              const color =
                {
                  wiki: "#4a9eff",
                  calculator: "#d2b244",
                  league: "#b07cc8",
                  material: "#8c7b5b",
                }[n.domain] || "#888";
              const badges = (n.badges || [])
                .map((b) => `<span class="chip chip-${b}">${b}</span>`)
                .join("");
              return `<div class="card" style="animation-delay:${i * 0.015}s"><div class="card-header" style="background:${n.bg_color || color}"></div><div class="card-body"><div class="card-info"><div style="font-size:10px;color:var(--text-quaternary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">${n.domain}${n.kind ? " · " + n.kind : ""}</div><a class="card-title" href="${esc(n.url || "#")}" target="_blank" rel="noopener">${esc(n.label || n.id)}</a>${n.description ? `<div class="card-desc">${esc(n.description)}</div>` : ""}<div class="card-badges">${badges}</div></div></div></div>`;
            })
            .join("") || '<div class="empty">No nodes match</div>';
      }

      function renderCalculatorGrid(items) {
        const grid = document.getElementById("calc-grid");
        grid.innerHTML =
          items
            .map((c, i) => {
              const badges = (c.badges || [])
                .map((b) => `<span class="chip chip-${b}">${b}</span>`)
                .join("");
              const meta = [];
              if (c.section) meta.push(esc(c.section));
              if (c.skill_title || c.skill)
                meta.push(esc(c.skill_title || c.skill));
              if (c.creator_link) meta.push("creator: " + esc(c.creator_link));
              return `<div class="card" style="animation-delay:${i * 0.02}s"><div class="card-header" style="background:${c.bg_color || "#888"}"></div><div class="card-body"><div class="card-info"><div style="font-size:10px;color:var(--text-quaternary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">${meta.join(" · ")}</div><a class="card-title" href="${esc(c.href || "#")}" target="_blank" rel="noopener">${esc(c.title)}</a>${c.desc ? `<div class="card-desc">${esc(c.desc)}</div>` : ""}<div class="card-badges">${badges}</div></div></div></div>`;
            })
            .join("") || '<div class="empty">No calculators loaded</div>';
      }

      function renderLeagueGrid(items) {
        const grid = document.getElementById("league-grid");
        grid.innerHTML =
          items
            .map((n, i) => {
              const badges = [];
              if (n.kind === "relic")
                badges.push('<span class="chip chip-combat">relic</span>');
              if (n.kind === "blessing")
                badges.push('<span class="chip chip-guide">blessing</span>');
              if (n.kind === "region")
                badges.push('<span class="chip chip-economic">region</span>');
              if (n.kind === "league-root")
                badges.push('<span class="chip chip-league">event mode</span>');
              if (n.tier !== undefined)
                badges.push(`<span class="chip">tier ${n.tier}</span>`);
              return `<div class="card" style="animation-delay:${i * 0.02}s"><div class="card-header" style="background:linear-gradient(90deg,#b07cc8,#7a3c9e)"></div><div class="card-body"><div class="card-info"><div style="font-size:10px;color:var(--text-quaternary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">event mode · ${esc(n.section || "League")}</div><a class="card-title" href="${esc(n.url || "#")}" target="_blank" rel="noopener">${esc(n.label || n.id)}</a>${n.description ? `<div class="card-desc">${esc(n.description)}</div>` : ""}<div class="card-badges">${badges.join("")}</div></div></div></div>`;
            })
            .join("") || '<div class="empty">No league data loaded</div>';
      }

      function renderMaterialGrid(items) {
        const grid = document.getElementById("mat-grid");
        grid.innerHTML =
          items
            .slice(0, 200)
            .map(
              (n, i) =>
                `<div class="card" style="animation-delay:${i * 0.02}s"><div class="card-header" style="background:#8c7b5b"></div><div class="card-body"><div class="card-info"><div style="font-size:10px;color:var(--text-quaternary);text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px">material</div><a class="card-title" href="${esc(n.url || "#")}" target="_blank" rel="noopener">${esc(n.label || n.id)}</a>${n.occurrences ? `<div class="card-desc">wiki occurrences: ${n.occurrences}</div>` : ""}</div></div></div>`,
            )
            .join("") || '<div class="empty">No material data loaded</div>';
      }

      function wireFilterPills() {
        document.querySelectorAll(".pill[data-filter]").forEach((btn) => {
          btn.addEventListener("click", () => {
            document
              .querySelectorAll(".pill[data-filter]")
              .forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            STATE.filter = btn.dataset.filter;
            renderNodeGrid(STATE.nodes);
          });
        });
      }
      function wireTabs() {
        document.querySelectorAll(".tab").forEach((tab) => {
          tab.addEventListener("click", () => {
            document
              .querySelectorAll(".tab")
              .forEach((t) => t.classList.remove("active"));
            document
              .querySelectorAll(".panel")
              .forEach((p) => p.classList.remove("active"));
            tab.classList.add("active");
            document
              .getElementById("panel-" + tab.dataset.tab)
              .classList.add("active");
          });
        });
      }

      async function init() {
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
        document
          .getElementById("node-search")
          .addEventListener("input", () => renderNodeGrid(STATE.nodes));
        document.getElementById("search").addEventListener("input", (e) => {
          const q = e.target.value.trim().toLowerCase();
          STATE.query = q;
          document.getElementById("node-search").value = q;
          renderNodeGrid(STATE.nodes);
        });
      }
      init();
    