// =====================================================================
// Global Parameters — Direction 2 (minimal dashboard + detail editor)
// ---------------------------------------------------------------------
// The dashboard is a clean management table. The richer setup lives inside
// the parameter detail page: a source-type selector (Static value /
// Feature Flag variable). For a flag-variable source you pick a flag in the
// parameter's project, then a variable of the SAME type as the parameter.
//
// Mock data, in-memory only. Reload resets to seed.
// =====================================================================

(function () {
  "use strict";

  // ── Mock projects → flags → typed variables ─────────────────────────
  const flags = [
    {
      id: "f_home", name: "homepage_hero", project: "Birdwatching",
      variables: [
        { name: "crow_image", type: "string", value: "/img/crow.png" },
        { name: "hero_layout", type: "string", value: "centered" },
        { name: "show_badge", type: "boolean", value: true }
      ]
    },
    {
      id: "f_newbird", name: "new_bird_promo", project: "Birdwatching",
      variables: [
        { name: "new_bird", type: "string", value: "Kingfisher" },
        { name: "promo_days", type: "number", value: 7 }
      ]
    },
    {
      id: "f_promo", name: "promo_campaign", project: "Marketing",
      variables: [
        { name: "banner_text", type: "string", value: "Spring sale is live" },
        { name: "rate", type: "number", value: 20 },
        { name: "rate_blackfriday", type: "number", value: 30 }
      ]
    }
  ];

  // ── Parameters ──────────────────────────────────────────────────────
  // sourceType: "static" → uses `value`; "flag" → references {flagId, variableName}
  const seed = () => [
    {
      key: "hero_bird_img", project: "Birdwatching", type: "string",
      description: "Hero image shown at the top of the homepage. Currently mapped to a flag variable so it can change per audience.",
      sourceType: "flag", value: null,
      reference: { flagId: "f_home", variableName: "crow_image" },
      updatedAt: "2026-05-20T09:00:00Z"
    },
    {
      key: "hero_text", project: "Birdwatching", type: "string",
      description: "Homepage hero headline.",
      sourceType: "static", value: "Your online guide to birds and birdwatching",
      reference: null,
      updatedAt: "2026-05-18T14:10:00Z"
    },
    {
      key: "promo.discount_rate", project: "Marketing", type: "number",
      description: "Promotional discount percentage, mapped to the campaign flag so marketing can move it without code.",
      sourceType: "flag", value: null,
      reference: { flagId: "f_promo", variableName: "rate" },
      updatedAt: "2026-05-02T09:00:00Z"
    },
    {
      key: "checkout.threshold", project: "Marketing", type: "number",
      description: "Free-shipping order threshold.",
      sourceType: "static", value: 50,
      reference: null,
      updatedAt: "2026-04-28T16:40:00Z"
    }
  ];

  const params = seed();
  let search = "";
  let draft = null; // detail edit state

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
  function getFlag(id) { return flags.find(f => f.id === id) || null; }
  function flagsForProject(project) { return flags.filter(f => f.project === project); }

  // Resolve the effective value of a parameter (or a draft-shaped object).
  function effective(p) {
    if (p.sourceType === "static") return p.value;
    const f = getFlag(p.reference && p.reference.flagId);
    if (!f) return undefined;
    const v = f.variables.find(x => x.name === (p.reference && p.reference.variableName));
    return v ? v.value : undefined;
  }

  function srcChip(sourceType) {
    return sourceType === "flag"
      ? `<span class="src-chip flag"><span class="material-icons">flag</span>Flag variable</span>`
      : `<span class="src-chip static"><span class="material-icons">lock</span>Static</span>`;
  }

  // ── Routing ──────────────────────────────────────────────────────────
  function route() {
    const h = location.hash;
    if (h.startsWith("#/p/")) {
      const key = decodeURIComponent(h.slice("#/p/".length));
      if (getParam(key)) { renderDetail(key); return; }
    }
    renderDashboard();
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }

  // ── Dashboard (minimal) ────────────────────────────────────────────
  function renderDashboard() {
    draft = null;
    const q = search.trim().toLowerCase();
    const rows = params.filter(p => !q || (p.key + " " + p.project).toLowerCase().includes(q));

    // Dynamic metrics for the KPI banner
    const totalParams = params.length;
    const flagSourced = params.filter(p => p.sourceType === "flag").length;
    const staticSourced = totalParams - flagSourced;

    $("#gpPanel").innerHTML = `
      <div class="panel-head">
        <div class="ph-row">
          <h2>Global Parameters</h2>
          <button class="btn-primary" id="newBtn"><span class="material-icons">add</span> New parameter</button>
        </div>
      </div>

      <!-- Sizing & KPI Banner (Analysis §10) -->
      <div class="kpi-banner">
        <div class="kpi-card">
          <div class="kpi-icon blue"><span class="material-icons">data_object</span></div>
          <div class="kpi-info">
            <span class="kpi-value">${totalParams}</span>
            <span class="kpi-label">Decoupled Parameters</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon purple"><span class="material-icons">sync</span></div>
          <div class="kpi-info">
            <span class="kpi-value">${flagSourced}</span>
            <span class="kpi-label">Flag Variable Sources</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green"><span class="material-icons">lock</span></div>
          <div class="kpi-info">
            <span class="kpi-value">${staticSourced}</span>
            <span class="kpi-label">Static Value Sources</span>
          </div>
        </div>
      </div>

      <div class="toolbar">
        <div class="search"><span class="material-icons">search</span>
          <input id="search" type="text" placeholder="Search parameters…" value="${esc(search)}" />
        </div>
      </div>
      <table class="gp">
        <thead><tr>
          <th style="width:24%">Name</th>
          <th style="width:15%">Project</th>
          <th style="width:9%">Type</th>
          <th style="width:20%">Current value</th>
          <th style="width:18%">Source</th>
          <th style="width:8%">Updated</th>
          <th style="width:6%"></th>
        </tr></thead>
        <tbody>
          ${rows.length ? rows.map(rowHtml).join("") :
            `<tr><td colspan="7" class="empty-row">No parameters${q ? ` match “${esc(search)}”` : " yet"}.</td></tr>`}
        </tbody>
      </table>
    `;

    const s = $("#search");
    s.addEventListener("input", e => { search = e.target.value; const c = s.selectionStart; renderDashboard(); const ns = $("#search"); ns.focus(); ns.setSelectionRange(c, c); });
    $("#newBtn").addEventListener("click", () => toast("New parameter — stub action (prototype only)."));

    $$("table.gp tbody tr[data-key]").forEach(tr => {
      const key = tr.dataset.key;
      tr.addEventListener("click", e => { if (!e.target.closest(".row-actions")) go("#/p/" + encodeURIComponent(key)); });
      const edit = tr.querySelector(".act-edit");
      const del = tr.querySelector(".act-del");
      if (edit) edit.addEventListener("click", () => go("#/p/" + encodeURIComponent(key)));
      if (del) del.addEventListener("click", () => deleteParam(key));
    });
  }

  function rowHtml(p) {
    const ref = p.sourceType === "flag" && p.reference
      ? `<small>${esc((getFlag(p.reference.flagId) || {}).name || "?")} · ${esc(p.reference.variableName)}</small>`
      : "";
    return `
      <tr data-key="${esc(p.key)}">
        <td><div class="k-key">${esc(p.key)}</div></td>
        <td><span class="proj-chip">${esc(p.project)}</span></td>
        <td><span class="chip t-${p.type}">${p.type}</span></td>
        <td><span class="k-val">${esc(fmt(p.type, effective(p)))}</span></td>
        <td><div class="src-cell">${srcChip(p.sourceType)}${ref}</div></td>
        <td class="k-updated">${rel(p.updatedAt)}</td>
        <td>
          <div class="row-actions">
            <button class="icon-act act-edit" title="Edit"><span class="material-icons">edit</span></button>
            <button class="icon-act act-del" title="Delete"><span class="material-icons">delete_outline</span></button>
          </div>
        </td>
      </tr>`;
  }

  function deleteParam(key) {
    const i = params.findIndex(p => p.key === key);
    if (i < 0) return;
    params.splice(i, 1);
    toast(`Deleted ${key} (prototype only).`);
    renderDashboard();
  }

  // ── Detail editor ───────────────────────────────────────────────────
  function renderDetail(key) {
    const p = getParam(key);
    draft = {
      sourceType: p.sourceType,
      value: clone(p.value),
      flagId: p.reference ? p.reference.flagId : (flagsForProject(p.project)[0] || {}).id || null,
      variableName: p.reference ? p.reference.variableName : null,
      valid: true
    };

    $("#gpPanel").innerHTML = `
      <div class="detail-head">
        <div class="back-link" id="back"><span class="material-icons">arrow_back</span> All parameters</div>
        <div class="detail-key">${esc(p.key)}</div>
        <div class="detail-meta">
          <span class="proj-chip">${esc(p.project)}</span>
          <span class="sep">·</span><span class="chip t-${p.type}">${p.type}</span>
          <span class="sep">·</span><span>Updated ${rel(p.updatedAt)}</span>
        </div>
      </div>
      <div class="detail-body">
        <div class="muted" style="font-size:13px;line-height:1.55;">${esc(p.description)}</div>

        <div class="field">
          <label>Source type</label>
          <div class="seg" id="seg">
            <button class="seg-opt" data-src="static"><span class="material-icons">lock</span> Static value</button>
            <button class="seg-opt" data-src="flag"><span class="material-icons">flag</span> Feature Flag variable</button>
          </div>
        </div>

        <div id="sourcePane"></div>

        <div class="map-preview" id="preview"></div>

        <div class="save-row" id="saveRow">
          <button class="btn-secondary" id="discardBtn">Discard</button>
          <button class="btn-primary" id="saveBtn" disabled><span class="material-icons">save</span> Save</button>
        </div>
      </div>
    `;

    setSeg(draft.sourceType);
    renderSourcePane(p);
    renderPreview(p);

    $("#back").addEventListener("click", () => go("#/"));
    $("#discardBtn").addEventListener("click", () => go("#/"));
    $("#saveBtn").addEventListener("click", () => save(p));
    $$("#seg .seg-opt").forEach(b => b.addEventListener("click", () => { setSeg(b.dataset.src); draft.sourceType = b.dataset.src; ensureFlagDefaults(p); renderSourcePane(p); onDraftChange(p); }));
  }

  function setSeg(src) {
    $$("#seg .seg-opt").forEach(b => b.classList.toggle("active", b.dataset.src === src));
  }

  // Make sure a flag-variable draft has a valid flag + matching-type variable selected.
  function ensureFlagDefaults(p) {
    if (draft.sourceType !== "flag") return;
    const projFlags = flagsForProject(p.project);
    if (!draft.flagId || !projFlags.some(f => f.id === draft.flagId)) {
      draft.flagId = (projFlags[0] || {}).id || null;
      draft.variableName = null;
    }
    const vars = matchingVars(p, draft.flagId);
    if (!draft.variableName || !vars.some(v => v.name === draft.variableName)) {
      draft.variableName = (vars[0] || {}).name || null;
    }
  }

  // Variables of the selected flag that match the parameter's type.
  function matchingVars(p, flagId) {
    const f = getFlag(flagId);
    if (!f) return [];
    return f.variables.filter(v => v.type === p.type);
  }

  function renderSourcePane(p) {
    const mount = $("#sourcePane");
    if (draft.sourceType === "static") {
      mount.innerHTML = `<div class="field"><label>Value</label><div id="editor"></div>
        <div class="json-hint hidden" id="vhint"></div></div>`;
      renderStaticEditor(p);
      return;
    }
    // Feature Flag variable: flag dropdown (project-filtered) → variable dropdown (type-filtered)
    const projFlags = flagsForProject(p.project);
    mount.innerHTML = `
      <div class="map-grid">
        <div class="field">
          <label>Feature Flag <span class="muted" style="text-transform:none;font-weight:400;">· project “${esc(p.project)}”</span></label>
          <select class="select" id="flagSel">
            ${projFlags.map(f => `<option value="${esc(f.id)}" ${f.id === draft.flagId ? "selected" : ""}>${esc(f.name)}</option>`).join("")}
          </select>
        </div>
        <div class="field">
          <label>Variable <span class="muted" style="text-transform:none;font-weight:400;">· type “${esc(p.type)}” only</span></label>
          <select class="select" id="varSel"></select>
        </div>
      </div>`;
    renderVarOptions(p);
    $("#flagSel").addEventListener("change", e => { draft.flagId = e.target.value; draft.variableName = null; ensureFlagDefaults(p); renderVarOptions(p); onDraftChange(p); renderPreview(p); });
    $("#varSel").addEventListener("change", e => { draft.variableName = e.target.value || null; onDraftChange(p); renderPreview(p); });
  }

  function renderVarOptions(p) {
    const sel = $("#varSel");
    const vars = matchingVars(p, draft.flagId);
    if (!vars.length) {
      sel.innerHTML = `<option value="">No ${esc(p.type)} variables on this flag</option>`;
      draft.variableName = null;
    } else {
      if (!draft.variableName || !vars.some(v => v.name === draft.variableName)) draft.variableName = vars[0].name;
      sel.innerHTML = vars.map(v => `<option value="${esc(v.name)}" ${v.name === draft.variableName ? "selected" : ""}>${esc(v.name)} — ${esc(fmt(v.type, v.value))}</option>`).join("");
    }
  }

  function renderStaticEditor(p) {
    const mount = $("#editor");
    if (p.type === "string") {
      mount.innerHTML = `<input type="text" id="valInput" value="${esc(draft.value)}" />`;
      $("#valInput").addEventListener("input", e => { draft.value = e.target.value; draft.valid = true; onDraftChange(p); renderPreview(p); });
    } else if (p.type === "number") {
      mount.innerHTML = `<input type="number" id="valInput" value="${draft.value}" />`;
      $("#valInput").addEventListener("input", e => {
        const raw = e.target.value.trim();
        if (raw === "" || isNaN(Number(raw))) { draft.valid = false; }
        else { draft.value = Number(raw); draft.valid = true; }
        hint($("#vhint"), draft.valid ? "" : "Enter a valid number.");
        onDraftChange(p); renderPreview(p);
      });
    } else if (p.type === "boolean") {
      mount.innerHTML = `<div class="toggle-row"><div class="toggle ${draft.value ? "on" : ""}" id="valToggle"></div><span class="toggle-label" id="toggleLbl">${draft.value ? "true" : "false"}</span></div>`;
      $("#valToggle").addEventListener("click", () => {
        draft.value = !draft.value; draft.valid = true;
        $("#valToggle").classList.toggle("on", draft.value);
        $("#toggleLbl").textContent = draft.value ? "true" : "false";
        onDraftChange(p); renderPreview(p);
      });
    } else if (p.type === "json") {
      mount.innerHTML = `<textarea class="mono" rows="7" id="valInput">${esc(JSON.stringify(draft.value, null, 2))}</textarea>`;
      $("#valInput").addEventListener("input", e => {
        try { draft.value = JSON.parse(e.target.value); draft.valid = true; } catch { draft.valid = false; }
        hint($("#vhint"), draft.valid ? "" : "Invalid JSON.");
        onDraftChange(p); renderPreview(p);
      });
    }
  }

  function hint(el, msg) {
    if (!el) return;
    if (!msg) {
      el.innerHTML = "";
      el.classList.add("hidden");
    } else {
      el.innerHTML = `<span class="material-icons">error_outline</span> ${msg}`;
      el.className = "json-hint error";
      el.classList.remove("hidden");
    }
  }

  // Effective value of the current (unsaved) draft.
  function draftEffective(p) {
    if (draft.sourceType === "static") return draft.value;
    const f = getFlag(draft.flagId);
    if (!f) return undefined;
    const v = f.variables.find(x => x.name === draft.variableName);
    return v ? v.value : undefined;
  }

  function renderPreview(p) {
    const el = $("#preview");
    if (!el) return;
    const val = draftEffective(p);
    if (draft.sourceType === "flag") {
      const f = getFlag(draft.flagId);
      const hasVar = !!draft.variableName;
      
      el.innerHTML = hasVar
        ? `<div class="mp-head"><span class="material-icons">trending_flat</span> Variable Resolution Path</div>
           
           <!-- Premium Visual Resolution flowchart -->
           <div class="resolution-flow">
             <div class="flow-step">
               <span class="material-icons">flag</span>
               <div class="fs-text">
                 <span class="fs-label">Feature Flag Variable</span>
                 <span class="fs-val mono">${esc(f ? f.name : "?")} · ${esc(draft.variableName)}</span>
               </div>
             </div>
             <div class="flow-connect">
               <span class="material-icons">arrow_forward</span>
               <span class="fc-label">resolves to</span>
             </div>
             <div class="flow-step active">
               <span class="material-icons">data_object</span>
               <div class="fs-text">
                 <span class="fs-label">Effective Parameter Value</span>
                 <span class="fs-val mono">${esc(fmt(p.type, val))}</span>
               </div>
             </div>
           </div>
           
           <div class="mp-note" style="margin-top: 14px;">The parameter automatically resolves to this flag variable. Updates to the variable inside the Feature Flag will propagate immediately to every consumer of <span class="mono">${esc(p.key)}</span> — without a developer editing code.</div>`
        : `<div class="mp-head warn"><span class="material-icons">error_outline</span> No matching variable selected</div>
           <div class="mp-note">Pick a flag that has a <b>${esc(p.type)}</b> variable.</div>`;
    } else {
      el.innerHTML = `
        <div class="mp-head"><span class="material-icons">check_circle</span> Static Value Resolution</div>
        <div class="resolution-flow">
          <div class="flow-step active">
            <span class="material-icons">lock</span>
            <div class="fs-text">
              <span class="fs-label">Static Value Source</span>
              <span class="fs-val mono">${esc(fmt(p.type, val))}</span>
            </div>
          </div>
        </div>
      `;
    }
  }

  function isDirty(p) {
    if (draft.sourceType !== p.sourceType) return true;
    if (draft.sourceType === "static") return JSON.stringify(draft.value) !== JSON.stringify(p.value);
    const ref = p.reference || {};
    return draft.flagId !== ref.flagId || draft.variableName !== ref.variableName;
  }
  function isValid() {
    if (draft.sourceType === "static") return draft.valid;
    return !!(draft.flagId && draft.variableName);
  }
  function onDraftChange(p) {
    const ok = isValid();
    const dirty = isDirty(p);
    $("#saveRow").classList.toggle("changed", ok && dirty);
    $("#saveBtn").disabled = !(ok && dirty);
  }

  function save(p) {
    if (!isValid()) return;
    p.sourceType = draft.sourceType;
    if (draft.sourceType === "static") { p.value = clone(draft.value); p.reference = null; }
    else { p.reference = { flagId: draft.flagId, variableName: draft.variableName }; p.value = null; }
    p.updatedAt = "2026-06-01T12:00:00Z";
    toast(`Saved ${p.key}. Effective value: ${fmt(p.type, effective(p))}.`);
    go("#/");
  }

  function clone(v) { return v === null || v === undefined ? v : JSON.parse(JSON.stringify(v)); }

  // ── Toast ───────────────────────────────────────────────────────────
  let toastT;
  function toast(text) {
    const el = $("#toast");
    $("#toastText").textContent = text;
    el.classList.remove("hidden");
    clearTimeout(toastT);
    toastT = setTimeout(() => el.classList.add("hidden"), 3200);
  }

  // ── Boot ────────────────────────────────────────────────────────────
  window.addEventListener("hashchange", route);
  route();
})();
