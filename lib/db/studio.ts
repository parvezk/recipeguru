import http from "node:http";
import { config } from "dotenv";
config({ path: ".env.local", quiet: true });

import { withConnection } from "./db";

const PORT = Number(process.env.STUDIO_PORT || 4000);

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>RecipeGuru SQL Studio — Aurora PostgreSQL</title>
  <style>
    :root {
      --bg: #0f1117;
      --panel: #161922;
      --panel-hover: #1e2230;
      --border: #262b3d;
      --text: #e6edf3;
      --muted: #8b949e;
      --accent: #3b82f6;
      --accent-hover: #2563eb;
      --green: #22c55e;
      --red: #ef4444;
      --mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: var(--sans);
      background: var(--bg);
      color: var(--text);
      height: 100vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    header {
      height: 48px;
      background: var(--panel);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 16px;
      font-size: 13px;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 600;
      font-size: 14px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 3px 8px;
      border-radius: 999px;
      background: rgba(34, 197, 94, 0.12);
      color: var(--green);
      font-size: 11px;
      font-family: var(--mono);
    }
    .dot {
      width: 7px;
      height: 7px;
      border-radius: 50%;
      background: var(--green);
    }
    .workspace {
      flex: 1;
      display: grid;
      grid-template-columns: 290px 1fr;
      min-height: 0;
    }
    aside {
      background: var(--panel);
      border-right: 1px solid var(--border);
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 18px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--muted);
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .table-card {
      border: 1px solid var(--border);
      border-radius: 6px;
      margin-bottom: 6px;
      overflow: hidden;
      background: rgba(255, 255, 255, 0.01);
    }
    .table-header {
      padding: 8px 10px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      cursor: pointer;
      font-family: var(--mono);
      font-size: 12.5px;
      font-weight: 600;
    }
    .table-header:hover { background: var(--panel-hover); }
    .row-count {
      font-size: 11px;
      color: var(--muted);
      font-weight: 400;
    }
    .cols {
      border-top: 1px solid var(--border);
      padding: 6px 10px;
      font-family: var(--mono);
      font-size: 11.5px;
      color: var(--muted);
      background: rgba(0, 0, 0, 0.2);
    }
    .col-row {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }
    .col-type { color: #60a5fa; }
    .snippet-btn {
      width: 100%;
      text-align: left;
      background: transparent;
      border: 1px solid var(--border);
      color: var(--text);
      padding: 7px 10px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
      margin-bottom: 6px;
      transition: background 0.15s;
    }
    .snippet-btn:hover { background: var(--panel-hover); }
    .snippet-btn small {
      display: block;
      color: var(--muted);
      font-family: var(--mono);
      font-size: 10.5px;
      margin-top: 2px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    main {
      display: flex;
      flex-direction: column;
      min-width: 0;
      min-height: 0;
    }
    .editor-pane {
      padding: 12px 16px;
      border-bottom: 1px solid var(--border);
      background: var(--bg);
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    textarea {
      width: 100%;
      height: 165px;
      resize: vertical;
      background: var(--panel);
      color: var(--text);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 12px;
      font-family: var(--mono);
      font-size: 13px;
      line-height: 1.5;
      outline: none;
    }
    textarea:focus { border-color: var(--accent); }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .toolbar-left, .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    button.primary {
      background: var(--accent);
      color: white;
      border: none;
      padding: 7px 14px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 12.5px;
      cursor: pointer;
    }
    button.primary:hover { background: var(--accent-hover); }
    button.primary:disabled { opacity: 0.6; cursor: wait; }
    button.secondary {
      background: var(--panel);
      color: var(--text);
      border: 1px solid var(--border);
      padding: 6px 11px;
      border-radius: 6px;
      font-size: 12px;
      cursor: pointer;
    }
    button.secondary.active {
      border-color: var(--accent);
      color: #60a5fa;
    }
    .meta {
      font-family: var(--mono);
      font-size: 12px;
      color: var(--muted);
    }
    .results-pane {
      flex: 1;
      overflow: auto;
      padding: 0;
      position: relative;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-family: var(--mono);
      font-size: 12.5px;
    }
    th, td {
      border-bottom: 1px solid var(--border);
      border-right: 1px solid var(--border);
      padding: 8px 12px;
      text-align: left;
      vertical-align: top;
      max-width: 480px;
      overflow-wrap: break-word;
    }
    th {
      background: var(--panel);
      position: sticky;
      top: 0;
      font-weight: 600;
      color: #93c5fd;
      z-index: 1;
    }
    tr:hover td { background: rgba(255, 255, 255, 0.02); }
    .null-val {
      color: var(--muted);
      font-style: italic;
    }
    .error-box {
      margin: 16px;
      padding: 14px;
      border-radius: 6px;
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid var(--red);
      color: #fca5a5;
      font-family: var(--mono);
      font-size: 12.5px;
      white-space: pre-wrap;
    }
    pre.json-view {
      padding: 16px;
      font-family: var(--mono);
      font-size: 12.5px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <header>
    <div class="brand">
      <span>🍲 RecipeGuru SQL Studio</span>
      <span class="badge"><span class="dot"></span> <span id="conn-info">Aurora PostgreSQL (IAM Auth)</span></span>
    </div>
    <div class="meta">Shortcut: <strong>Cmd/Ctrl + Enter</strong> to run</div>
  </header>

  <div class="workspace">
    <aside>
      <div>
        <div class="section-title">
          <span>Public Tables</span>
          <button class="secondary" style="padding:2px 6px;font-size:10px" onclick="loadSchema()">↻</button>
        </div>
        <div id="tables-list">Loading schema...</div>
      </div>

      <div>
        <div class="section-title">RecipeGuru Sample Queries</div>
        <button class="snippet-btn" onclick="setQuery('SELECT recipe_id, title, body FROM recipes ORDER BY recipe_id ASC LIMIT 15;')">
          All Recipes
          <small>SELECT recipe_id, title, body FROM recipes...</small>
        </button>
        <button class="snippet-btn" onclick="setQuery(\`SELECT DISTINCT ON (r.recipe_id)
  r.recipe_id,
  r.title,
  COALESCE(rp.url, 'default.jpg') AS url
FROM recipes r
LEFT JOIN recipes_photos rp
  ON r.recipe_id = rp.recipe_id
ORDER BY r.recipe_id;\`)">
          Recipes + Poster Photo (LEFT JOIN)
          <small>SELECT DISTINCT ON (r.recipe_id) ...</small>
        </button>
        <button class="snippet-btn" onclick="setQuery(\`SELECT
  r.title AS recipe,
  i.title AS ingredient,
  i.type,
  i.image
FROM recipe_ingredients ri
INNER JOIN recipes r ON r.recipe_id = ri.recipe_id
INNER JOIN ingredients i ON i.id = ri.ingredient_id
WHERE ri.recipe_id = 1;\`)">
          Ingredients for Recipe #1 (INNER JOIN)
          <small>JOIN recipe_ingredients + ingredients</small>
        </button>
        <button class="snippet-btn" onclick="setQuery(\`SELECT
  type,
  COUNT(*)::int AS count
FROM ingredients
GROUP BY type
ORDER BY count DESC;\`)">
          Ingredient Counts by Type
          <small>GROUP BY type ORDER BY count DESC</small>
        </button>
        <button class="snippet-btn" onclick="setQuery(\`EXPLAIN ANALYZE
SELECT r.title, r.body, rp.url
FROM recipes_photos rp
INNER JOIN recipes r ON rp.recipe_id = r.recipe_id
WHERE rp.recipe_id = 4;\`)">
          EXPLAIN ANALYZE Join Query
          <small>Inspect Aurora query plan & timing</small>
        </button>
      </div>
    </aside>

    <main>
      <div class="editor-pane">
        <textarea id="sql-input" spellcheck="false">SELECT DISTINCT ON (r.recipe_id)
  r.recipe_id,
  r.title,
  COALESCE(rp.url, 'default.jpg') AS url,
  LEFT(r.body, 80) AS preview
FROM recipes r
LEFT JOIN recipes_photos rp
  ON r.recipe_id = rp.recipe_id
ORDER BY r.recipe_id
LIMIT 20;</textarea>
        <div class="toolbar">
          <div class="toolbar-left">
            <button id="run-btn" class="primary" onclick="runQuery()">▶ Run Query</button>
            <span id="status-meta" class="meta">Ready</span>
          </div>
          <div class="toolbar-right">
            <button id="btn-table" class="secondary active" onclick="setView('table')">Table</button>
            <button id="btn-json" class="secondary" onclick="setView('json')">JSON</button>
          </div>
        </div>
      </div>
      <div id="results" class="results-pane"></div>
    </main>
  </div>

  <script>
    let lastResult = null;
    let currentView = 'table';

    function escapeHtml(str) {
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    async function loadSchema() {
      const container = document.getElementById('tables-list');
      try {
        const res = await fetch('/api/schema');
        const data = await res.json();
        if (data.host) {
          document.getElementById('conn-info').textContent =
            data.database + ' @ ' + data.host.split('.')[0] + ' (Aurora IAM)';
        }
        if (!data.tables || data.tables.length === 0) {
          container.innerHTML = '<div class="meta">No tables found</div>';
          return;
        }
        container.innerHTML = data.tables.map(t => \`
          <div class="table-card">
            <div class="table-header" onclick="setQuery('SELECT * FROM ' + '\${t.name}' + ' LIMIT 50;')">
              <span>📋 \${t.name}</span>
              <span class="row-count">\${t.count} rows</span>
            </div>
            <div class="cols">
              \${t.columns.map(c => \`
                <div class="col-row">
                  <span>\${c.name}</span>
                  <span class="col-type">\${c.type}</span>
                </div>
              \`).join('')}
            </div>
          </div>
        \`).join('');
      } catch (err) {
        container.innerHTML = '<div class="error-box">' + escapeHtml(err.message) + '</div>';
      }
    }

    function setQuery(sql) {
      document.getElementById('sql-input').value = sql;
      runQuery();
    }

    function setView(view) {
      currentView = view;
      document.getElementById('btn-table').classList.toggle('active', view === 'table');
      document.getElementById('btn-json').classList.toggle('active', view === 'json');
      renderResult();
    }

    async function runQuery() {
      const sql = document.getElementById('sql-input').value.trim();
      if (!sql) return;
      const btn = document.getElementById('run-btn');
      const meta = document.getElementById('status-meta');
      btn.disabled = true;
      meta.textContent = 'Running against Aurora PostgreSQL...';

      try {
        const res = await fetch('/api/query', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sql }),
        });
        const data = await res.json();
        lastResult = data;
        if (!res.ok || data.error) {
          meta.textContent = 'Error';
          document.getElementById('results').innerHTML =
            '<div class="error-box">' + escapeHtml(data.error || 'Query failed') + '</div>';
        } else {
          meta.textContent = \`\${data.command || 'SQL'} • \${data.rowCount ?? data.rows.length} rows • \${data.durationMs} ms\`;
          renderResult();
        }
      } catch (err) {
        meta.textContent = 'Error';
        document.getElementById('results').innerHTML =
          '<div class="error-box">' + escapeHtml(err.message) + '</div>';
      } finally {
        btn.disabled = false;
      }
    }

    function renderResult() {
      const container = document.getElementById('results');
      if (!lastResult || lastResult.error) return;
      const { rows, fields } = lastResult;

      if (currentView === 'json') {
        container.innerHTML = '<pre class="json-view">' + escapeHtml(JSON.stringify(rows, null, 2)) + '</pre>';
        return;
      }

      if (!rows || rows.length === 0) {
        container.innerHTML = '<div style="padding:20px" class="meta">Query executed successfully (0 rows returned).</div>';
        return;
      }

      const cols = fields && fields.length ? fields : Object.keys(rows[0]);
      const thead = '<tr><th>#</th>' + cols.map(c => '<th>' + escapeHtml(c) + '</th>').join('') + '</tr>';
      const tbody = rows.map((row, idx) => {
        const cells = cols.map(c => {
          const val = row[c];
          if (val === null || val === undefined) return '<td><span class="null-val">NULL</span></td>';
          if (typeof val === 'object') return '<td>' + escapeHtml(JSON.stringify(val)) + '</td>';
          return '<td>' + escapeHtml(val) + '</td>';
        }).join('');
        return '<tr><td class="meta">' + (idx + 1) + '</td>' + cells + '</tr>';
      }).join('');

      container.innerHTML = '<table><thead>' + thead + '</thead><tbody>' + tbody + '</tbody></table>';
    }

    document.getElementById('sql-input').addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        runQuery();
      }
    });

    loadSchema();
    runQuery();
  </script>
</body>
</html>`;

const server = http.createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(HTML);
      return;
    }

    if (req.method === "GET" && req.url === "/api/schema") {
      const data = await withConnection(async (client) => {
        const colsResult = await client.query(`
          SELECT table_name, column_name, data_type
          FROM information_schema.columns
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position
        `);

        const tableMap = new Map<
          string,
          { name: string; count: number; columns: { name: string; type: string }[] }
        >();

        for (const row of colsResult.rows) {
          if (!tableMap.has(row.table_name)) {
            tableMap.set(row.table_name, {
              name: row.table_name,
              count: 0,
              columns: [],
            });
          }
          tableMap.get(row.table_name)!.columns.push({
            name: row.column_name,
            type: row.data_type,
          });
        }

        for (const table of tableMap.values()) {
          const countRes = await client.query(
            `SELECT COUNT(*)::int AS count FROM "${table.name.replace(/"/g, '""')}"`,
          );
          table.count = countRes.rows[0].count;
        }

        return {
          host: process.env.PGHOST,
          database: process.env.PGDATABASE || "postgres",
          tables: Array.from(tableMap.values()),
        };
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(data));
      return;
    }

    if (req.method === "POST" && req.url === "/api/query") {
      let body = "";
      for await (const chunk of req) {
        body += chunk;
      }
      const { sql } = JSON.parse(body || "{}");
      if (!sql || typeof sql !== "string") {
        res.writeHead(400, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing SQL query" }));
        return;
      }

      const start = performance.now();
      const result = await withConnection(async (client) => {
        return await client.query(sql);
      });
      const durationMs = Math.round(performance.now() - start);

      const finalResult = Array.isArray(result)
        ? result[result.length - 1]
        : result;

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          command: finalResult.command,
          rowCount: finalResult.rowCount,
          fields: finalResult.fields?.map((f) => f.name) ?? [],
          rows: finalResult.rows ?? [],
          durationMs,
        }),
      );
      return;
    }

    res.writeHead(404);
    res.end("Not Found");
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.writeHead(400, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: message }));
  }
});

server.listen(PORT, () => {
  console.log(`\n🍲 RecipeGuru Browser SQL Studio running at:`);
  console.log(`   👉 http://localhost:${PORT}\n`);
  console.log(
    `   Connected to Aurora PostgreSQL (${process.env.PGHOST}) via RDS IAM Auth.`,
  );
});
