// =====================================================================
// Global Parameters — Direction 1 (dashboard MVP)
// ---------------------------------------------------------------------
// Product model (intentionally SIMPLE for this direction):
//   A Global Parameter is a shared value. Change it once on the dashboard
//   and every flag that consumes it receives the new value.
//   No override hierarchy, no effective-value resolution, no experiment
//   control — those belong to Direction 2 (built later).
// Mock data, in-memory only. A reload resets everything to seed.
// =====================================================================

(function () {
  "use strict";

  // ── Seed data ──────────────────────────────────────────────────────
  const seed = () => [
    {
      key: "discount_rate",
      type: "number",
      value: 20,
      description: "Promotional discount percentage, shared across web, iOS, and Android.",
      usedIn: [
        { name: "promo_web", status: "live" },
        { name: "promo_ios", status: "live" },
        { name: "promo_android", status: "live" },
        { name: "promo_email", status: "draft" }
      ],
      updatedAt: "2026-05-02T09:00:00Z"
    },
    {
      key: "homepage.hero_text",
      type: "string",
      value: "Find your perfect plan",
      description: "Hero headline on the marketing homepage.",
      usedIn: [
        { name: "homepage_v2", status: "live" },
        { name: "pricing_page", status: "live" }
      ],
      updatedAt: "2026-04-22T10:14:00Z"
    },
    {
      key: "promo_banner_enabled",
      type: "boolean",
      value: true,
      description: "Master switch for the promotional banner across surfaces.",
      usedIn: [
        { name: "seasonal_banner", status: "live" }
      ],
      updatedAt: "2026-04-30T14:20:00Z"
    },
    {
      key: "checkout.config",
      type: "json",
      value: { steps: 3, express: true, methods: ["card", "paypal"] },
      description: "Structured checkout-flow configuration. Centralized so changes are traceable.",
      usedIn: [
        { name: "checkout_web", status: "live" },
        { name: "checkout_ios", status: "live" },
        { name: "checkout_android", status: "draft" }
      ],
      updatedAt: "2026-03-18T11:05:00Z"
    }
  ];

  const params = seed();
  let search = "";
  // working copy of the value being edited in the detail view
  let draft = null; // { key, value }

  // ── Helpers ─────────────────────────────────────────────────────────
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const NOW = new Date("2026-06-01T12:00:00Z").getTime();

  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fmt(type, v) {
    if (v === undefined || v === null) return "—";
    if (type === "json") return JSON.stringify(v);
    if (type === "boolean") return v ? "true" : "false";
    if (type === "string") return `"${v}"`;
    return String(v);
  }
  function rel(iso) {
    const d = Math.max(0, NOW - new Date(iso).getTime());
    const days = Math.floor(d / 86400000);
    if (days <= 0) return "just now";
    if (days === 1) return "yesterday";
    if (days < 7) return days + " days ago";
    if (days < 30) return Math.floor(days / 7) + "w ago";
    if (days < 365) return Math.floor(days / 30) + "mo ago";
    return Math.floor(days / 365) + "y ago";
  }
  function getParam(key) { return params.find(p => p.key === key) || null; }
  function liveCount(p) { return p.usedIn.filter(f => f.status === "live").length; }

  // ── Routing (light hash routing inside the panel) ───────────────────
  function route() {
    const h = location.hash;
    if (h.startsWith("#/p/")) {
      const key = decodeURIComponent(h.slice("#/p/".length));
      if (getParam(key)) { renderDetail(key); return; }
    }
    renderDashboard();
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  // ── Dashboard ───────────────────────────────────────────────────────
  function renderDashboard() {
    draft = null;
    const q = search.trim().toLowerCase();
    const rows = params.filter(p => !q || (p.key + " " + p.description).toLowerCase().includes(q));

    // Calculate pilot metrics dynamically for the visual KPI banner
    const totalParams = params.length;
    const activeCoverage = params.filter(p => p.usedIn.length > 0).length;
    const totalDeps = params.reduce((acc, p) => acc + p.usedIn.length, 0);

    $("#gpPanel").innerHTML = `
      <div class="panel-head">
        <div class="ph-row">
          <div>
            <h2>Global Parameters</h2>
            <p>Reusable values shared across your Feature Flags. Change a value once here — every flag that uses it receives the update.</p>
          </div>
          <button class="btn-primary" id="newBtn"><span class="material-icons">add</span> New parameter</button>
        </div>
      </div>

      <!-- Sizing & KPI Banner (Analysis §10) -->
      <div class="kpi-banner">
        <div class="kpi-card">
          <div class="kpi-icon blue"><span class="material-icons">hub</span></div>
          <div class="kpi-info">
            <span class="kpi-value">${totalDeps}</span>
            <span class="kpi-label">Active Connections</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green"><span class="material-icons">verified</span></div>
          <div class="kpi-info">
            <span class="kpi-value">${activeCoverage} of ${totalParams}</span>
            <span class="kpi-label">Traceability Coverage</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon purple"><span class="material-icons">content_copy</span></div>
          <div class="kpi-info">
            <span class="kpi-value">${totalDeps - activeCoverage}</span>
            <span class="kpi-label">Duplications Prevented</span>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <div class="search"><span class="material-icons">search</span>
          <input id="search" type="text" placeholder="Search by key or description…" value="${esc(search)}" />
        </div>
      </div>
      <table class="gp">
        <thead><tr>
          <th style="width:30%">Key</th>
          <th style="width:9%">Type</th>
          <th style="width:24%">Current value</th>
          <th style="width:22%">Used in</th>
          <th style="width:15%">Updated</th>
        </tr></thead>
        <tbody>
          ${rows.length ? rows.map(rowHtml).join("") :
            `<tr><td colspan="5" class="empty-row">No parameters match “${esc(search)}”.</td></tr>`}
        </tbody>
      </table>
    `;

    const s = $("#search");
    s.addEventListener("input", e => { search = e.target.value; const c = s.selectionStart; renderDashboard(); const ns = $("#search"); ns.focus(); ns.setSelectionRange(c, c); });
    $("#newBtn").addEventListener("click", () => toast("New parameter — stub action (prototype only)."));
    $$("table.gp tbody tr[data-key]").forEach(tr => tr.addEventListener("click", () => go("#/p/" + encodeURIComponent(tr.dataset.key))));
  }

  function rowHtml(p) {
    const n = p.usedIn.length;
    const used = n === 0
      ? `<span class="used-pill zero"><span class="material-icons">link_off</span> Not used</span>`
      : `<span class="used-pill"><span class="material-icons">flag</span> ${n} flag${n > 1 ? "s" : ""}</span>`;
    return `
      <tr data-key="${esc(p.key)}">
        <td><div class="k-key">${esc(p.key)}<small>${esc(p.description)}</small></div></td>
        <td><span class="chip t-${p.type}">${p.type}</span></td>
        <td><span class="k-val">${esc(fmt(p.type, p.value))}</span></td>
        <td>${used}</td>
        <td class="k-updated">${rel(p.updatedAt)}</td>
      </tr>`;
  }

  // ── Detail ──────────────────────────────────────────────────────────
  function renderDetail(key) {
    const p = getParam(key);
    draft = { key, value: clone(p.value), valid: true };

    $("#gpPanel").innerHTML = `
      <div class="detail-head">
        <div class="back-link" id="back"><span class="material-icons">arrow_back</span> All parameters</div>
        <div class="detail-key">${esc(p.key)}</div>
        <div class="detail-meta">
          <span class="chip t-${p.type}">${p.type}</span>
          <span class="sep">·</span><span>Updated ${rel(p.updatedAt)}</span>
        </div>
      </div>
      <div class="detail-body">
        <div class="field">
          <label>Description</label>
          <div class="muted" style="font-size:13px;line-height:1.5;">${esc(p.description)}</div>
        </div>

        <div class="field">
          <label>Shared value</label>
          <div id="editor"></div>
          <div class="json-hint hidden" id="jsonHint">Invalid JSON — save disabled.</div>
        </div>

        <div id="blast"></div>

        <div class="save-row" id="saveRow">
          <button class="btn-secondary" id="discardBtn">Discard</button>
          <button class="btn-primary" id="saveBtn" disabled><span class="material-icons">sync</span> Save &amp; update flags</button>
        </div>
      </div>
    `;

    renderEditor(p);
    renderBlast(p);
    $("#back").addEventListener("click", () => go("#/"));
    $("#discardBtn").addEventListener("click", () => go("#/"));
    $("#saveBtn").addEventListener("click", () => save(p));
  }

  function renderEditor(p) {
    const mount = $("#editor");
    if (p.type === "string") {
      mount.innerHTML = `<input type="text" id="valInput" value="${esc(draft.value)}" />`;
      $("#valInput").addEventListener("input", e => { draft.value = e.target.value; onDraftChange(p); });
    } else if (p.type === "number") {
      mount.innerHTML = `<input type="number" id="valInput" value="${draft.value}" />
        <div class="json-hint hidden" id="numHint">Enter a valid number — save disabled.</div>`;
      $("#valInput").addEventListener("input", e => {
        const raw = e.target.value.trim();
        if (raw === "" || isNaN(Number(raw))) { draft.valid = false; }
        else { draft.value = Number(raw); draft.valid = true; }
        $("#numHint").classList.toggle("hidden", draft.valid);
        onDraftChange(p);
      });
    } else if (p.type === "boolean") {
      mount.innerHTML = `<div class="toggle-row"><div class="toggle ${draft.value ? "on" : ""}" id="valToggle"></div><span class="toggle-label" id="toggleLbl">${draft.value ? "true" : "false"}</span></div>`;
      $("#valToggle").addEventListener("click", () => {
        draft.value = !draft.value;
        $("#valToggle").classList.toggle("on", draft.value);
        $("#toggleLbl").textContent = draft.value ? "true" : "false";
        onDraftChange(p);
      });
    } else if (p.type === "json") {
      mount.innerHTML = `<textarea class="mono" rows="8" id="valInput">${esc(JSON.stringify(draft.value, null, 2))}</textarea>`;
      $("#valInput").addEventListener("input", e => {
        try { draft.value = JSON.parse(e.target.value); draft.valid = true; }
        catch { draft.valid = false; }
        $("#jsonHint").classList.toggle("hidden", draft.valid);
        onDraftChange(p);
      });
    }
  }

  // Blast radius — the defining idea of Direction 1: make the impact obvious.
  function renderBlast(p) {
    const mount = $("#blast");
    const n = p.usedIn.length;
    if (n === 0) {
      mount.innerHTML = `
        <div class="blast empty">
          <div class="blast-head"><span class="material-icons">link_off</span> Not used by any flag yet</div>
          <div class="blast-sub">When a flag references this parameter, it will appear here. Changes you save now affect nothing until a flag links to it.</div>
        </div>`;
      return;
    }
    const live = liveCount(p);
    mount.innerHTML = `
      <div class="blast">
        <div class="blast-head"><span class="material-icons">hub</span> Active Blast Radius: updates ${n} flag${n > 1 ? "s" : ""}</div>
        <div class="blast-sub">${live} live · ${n - live} draft. Saving a new value here propagates it to every surface below automatically.</div>
        
        <!-- Premium Visual Flow Map -->
        <div class="flow-map">
          <div class="fm-source">
            <span class="material-icons">data_object</span>
            <div class="fm-info">
              <span class="fm-label">Parameter Value</span>
              <span class="fm-val mono">${esc(fmt(p.type, p.value))}</span>
            </div>
          </div>
          <div class="fm-arrow">
            <span class="material-icons">trending_flat</span>
            <span class="fm-arrow-label">propagates to</span>
          </div>
          <div class="fm-targets">
            ${p.usedIn.map(f => `
              <div class="fm-target-card">
                <span class="material-icons">flag</span>
                <div class="fm-target-info">
                  <span class="fm-target-name">${esc(f.name)}</span>
                  <span class="fp-status ${f.status}">${f.status}</span>
                </div>
              </div>
            `).join("")}
          </div>
        </div>
      </div>`;
  }

  function onDraftChange(p) {
    const changed = JSON.stringify(draft.value) !== JSON.stringify(p.value);
    $("#saveRow").classList.toggle("changed", changed && draft.valid);
    $("#saveBtn").disabled = !(changed && draft.valid);
  }

  function save(p) {
    if (!draft.valid) return;
    p.value = clone(draft.value);
    p.updatedAt = "2026-06-01T12:00:00Z"; // "just now"
    const n = p.usedIn.length;
    toast(n === 0
      ? `Saved ${p.key}. No flags consume it yet.`
      : `Saved ${p.key}. ${n} flag${n > 1 ? "s" : ""} now receive ${fmt(p.type, p.value)}.`);
    go("#/"); // back to dashboard, which now shows the new value
  }

  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  // ── Toast ───────────────────────────────────────────────────────────
  let toastT;
  function toast(text) {
    const el = $("#toast");
    $("#toastText").textContent = text;
    el.classList.remove("hidden");
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.add("hidden"), 3000);
  }

  // ── Boot ────────────────────────────────────────────────────────────
  window.addEventListener("hashchange", route);
  route();
})();
