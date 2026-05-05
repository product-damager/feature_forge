// ----------------------------------------------------------------------------
// Mock state — Personalization targeting rules.
// Two explicit rule types:
//   - 'targeting'  → single content, exposure-based
//   - 'experiment' → multiple contents + allocation strategy
// ----------------------------------------------------------------------------

const CONTENT_LIBRARY = [
  'AI changes',
  'Graphical changes',
  'Code content',
  'Existential penguins'
];

const SEGMENTS = {
  difficult: 'difficult segment',
  penguins: 'existential penguins',
  all: 'All visitors'
};

const CTX_CANDIDATES = ['Country', 'Device type', 'Loyalty tier', 'Page URL', 'Day of week', 'Referrer'];

let nextRuleId = 5;

const state = {
  rules: [
    {
      id: 'r1', ruleId: 213048,
      type: 'targeting',
      name: 'Exposure to AI variation',
      status: 'online',
      segment: 'difficult',
      exposure: 42,
      contents: [{ id: 'c1', name: 'AI changes', pct: 100 }],
      allocation: 'manual',
      banditWarmup: 20,
      ctxAttrs: ['Country', 'Device type', 'Loyalty tier'],
      unsaved: false
    },
    {
      id: 'r2', ruleId: 213052,
      type: 'targeting',
      name: 'Another rule',
      status: 'draft',
      segment: 'difficult',
      exposure: 50,
      contents: [{ id: 'c1', name: 'Graphical changes', pct: 100 }],
      allocation: 'manual',
      banditWarmup: 20,
      ctxAttrs: ['Country', 'Device type', 'Loyalty tier'],
      unsaved: false
    },
    {
      id: 'r3', ruleId: 213071,
      type: 'targeting',
      name: 'Cheering up rule',
      status: 'draft',
      segment: 'penguins',
      exposure: 100,
      contents: [{ id: 'c1', name: 'Existential penguins', pct: 100 }],
      allocation: 'manual',
      banditWarmup: 20,
      ctxAttrs: ['Country', 'Device type', 'Loyalty tier'],
      unsaved: false
    },
    {
      id: 'r4', ruleId: 213089,
      type: 'targeting',
      name: 'A rule to serve remaining needs!',
      status: 'online',
      segment: 'all',
      exposure: 100,
      contents: [{ id: 'c1', name: 'Code content', pct: 100 }],
      allocation: 'manual',
      banditWarmup: 20,
      ctxAttrs: ['Country', 'Device type', 'Loyalty tier'],
      unsaved: false
    }
  ],
  selectedRuleId: null,
  // Right-panel mode: 'empty' | 'type' | 'rule'
  panelMode: 'empty'
};

let lastSavedSnapshot = JSON.stringify(state.rules);

// ----------------------------------------------------------------------------
// Element refs
// ----------------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  rulesList: $('#rulesList'),

  // Panel views
  emptyView: $('#emptyView'),
  typeSelectorView: $('#typeSelectorView'),
  ruleForm: $('#ruleForm'),

  // Top nav
  saveBtn: $('#saveBtn'),
  saveBtnSub: $('#saveBtnSub'),
  saveBtnCount: $('#saveBtnCount'),
  savedText: $('#savedText'),
  onlineStatus: $('#onlineStatus'),
  onlineStatusText: $('#onlineStatusText'),

  // Type selector
  cancelTypeSelect: $('#cancelTypeSelect'),

  // Rule form header
  panelTitle: $('#panelTitle'),
  panelStatus: $('#panelStatus'),
  panelStatusText: $('#panelStatusText'),
  panelId: $('#panelId'),
  ruleTypePill: $('#ruleTypePill'),
  ruleTypeIcon: $('#ruleTypeIcon'),
  ruleTypeLabel: $('#ruleTypeLabel'),

  ruleName: $('#ruleName'),

  // Exposure section
  exposureMeta: $('#exposureMeta'),
  exposureHelper: $('#exposureHelper'),
  singleContentView: $('#singleContentView'),
  singleContentSelect: $('#singleContentSelect'),

  multiContentView: $('#multiContentView'),
  addContentBtn: $('#addContentBtn'),
  allocSeg: $('#allocSeg'),
  contentsList: $('#contentsList'),
  allocTotal: $('#allocTotal'),
  autoDistributeBtn: $('#autoDistributeBtn'),

  banditFooter: $('#banditFooter'),
  warmup: $('#warmup'),
  warmupVal: $('#warmupVal'),
  contextualOnly: $('#contextualOnly'),
  ctxChips: $('#ctxChips'),

  expSlider: $('#expSlider'),
  expNum: $('#expNum'),

  addRuleBtn: $('#addRuleBtn')
};

// ----------------------------------------------------------------------------
// Render helpers
// ----------------------------------------------------------------------------

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function clamp(n, min, max) {
  n = parseInt(n, 10); if (isNaN(n)) n = 0;
  return Math.max(min, Math.min(max, n));
}

function ruleSummaryHtml(rule) {
  const seg = SEGMENTS[rule.segment] || rule.segment;
  if (rule.type === 'targeting') {
    return `<a href="#">${rule.exposure}%</a> of <a href="#">${escapeHtml(seg)}</a> exposed to <a href="#">${escapeHtml(rule.contents[0].name)}</a>`;
  }
  const allocLabel = ({
    manual: 'manual allocation',
    mab: 'multi-armed bandit',
    contextual: 'contextual bandit'
  })[rule.allocation] || 'manual allocation';
  return `<a href="#">${rule.exposure}%</a> of <a href="#">${escapeHtml(seg)}</a> exposed across <a href="#" class="exp-accent">${rule.contents.length} contents</a> · ${allocLabel}`;
}

function renderRules() {
  els.rulesList.innerHTML = '';
  state.rules.forEach((rule, idx) => {
    const card = document.createElement('div');
    const classes = ['rule-card'];
    if (rule.type === 'experiment') classes.push('experiment');
    if (state.selectedRuleId === rule.id) classes.push('selected');
    if (rule.unsaved) classes.push('unsaved');
    card.className = classes.join(' ');
    card.dataset.ruleId = rule.id;

    const statusPill = rule.status === 'online'
      ? `<span class="status-pill"><span class="status-dot"></span>Online</span>`
      : `<span class="status-pill draft"><span class="status-dot"></span>Draft</span>`;
    const unsavedPill = rule.unsaved ? `<span class="unsaved-pill">Unsaved</span>` : '';
    const playPauseIcon = rule.status === 'online' ? 'pause' : 'play_arrow';

    const typeIconClass = rule.type === 'experiment' ? 'rule-type-icon experiment' : 'rule-type-icon';
    const typeIconName = rule.type === 'experiment' ? 'science' : 'my_location';

    card.innerHTML = `
      <div class="rule-row">
        <div class="rule-num">${idx + 1}</div>
        <div class="${typeIconClass}" title="${rule.type === 'experiment' ? 'Experiment rule' : 'Targeting rule'}">
          <span class="material-icons">${typeIconName}</span>
        </div>
        <div class="rule-content">
          <div class="rule-title-row">
            <span class="rule-name">${escapeHtml(rule.name)}</span>
            ${statusPill}
            ${unsavedPill}
          </div>
          <div class="rule-summary">${ruleSummaryHtml(rule)}</div>
        </div>
        <div class="rule-actions">
          <div class="icon-btn" title="${rule.status === 'online' ? 'Pause' : 'Activate'}"><span class="material-icons">${playPauseIcon}</span></div>
          <div class="icon-btn"><span class="material-icons">more_vert</span></div>
        </div>
      </div>
    `;

    card.addEventListener('click', (e) => {
      if (e.target.closest('.icon-btn')) return;
      selectRule(rule.id);
    });
    els.rulesList.appendChild(card);
  });

  updateOnlineStatus();
}

// ----------------------------------------------------------------------------
// Right-panel mode switching
// ----------------------------------------------------------------------------

function setPanelMode(mode) {
  state.panelMode = mode;
  els.emptyView.classList.toggle('hidden', mode !== 'empty');
  els.typeSelectorView.classList.toggle('hidden', mode !== 'type');
  els.ruleForm.classList.toggle('hidden', mode !== 'rule');
}

function selectRule(id) {
  state.selectedRuleId = id;
  hydratePanel();
  setPanelMode('rule');
  renderRules();
}

function getSelectedRule() {
  return state.rules.find(r => r.id === state.selectedRuleId);
}

// ----------------------------------------------------------------------------
// Hydrate the rule form for the selected rule
// ----------------------------------------------------------------------------

function hydratePanel() {
  const rule = getSelectedRule();
  if (!rule) return;

  // Header
  const isExperiment = rule.type === 'experiment';
  els.panelTitle.textContent = isExperiment ? 'Configure the experiment rule' : 'Configure the targeting rule';

  els.ruleName.value = rule.name;
  els.panelId.firstChild.nodeValue = rule.ruleId + ' ';

  // Status pill
  if (rule.status === 'online') {
    els.panelStatus.className = 'status-pill panel-status';
    els.panelStatusText.textContent = 'Online';
  } else {
    els.panelStatus.className = 'status-pill panel-status draft';
    els.panelStatusText.textContent = 'Draft';
  }

  // Rule-type pill
  if (isExperiment) {
    els.ruleTypePill.className = 'rule-type-pill experiment';
    els.ruleTypeIcon.textContent = 'science';
    els.ruleTypeLabel.textContent = 'Experiment';
  } else {
    els.ruleTypePill.className = 'rule-type-pill';
    els.ruleTypeIcon.textContent = 'my_location';
    els.ruleTypeLabel.textContent = 'Targeting';
  }

  // Exposure value
  els.exposureMeta.textContent = `${rule.exposure}%`;
  els.expSlider.value = rule.exposure;
  els.expNum.value = rule.exposure;
  paintSlider(els.expSlider);

  // Single vs multi content view
  els.singleContentView.classList.toggle('hidden', isExperiment);
  els.multiContentView.classList.toggle('hidden', !isExperiment);

  if (!isExperiment) {
    const current = rule.contents[0]?.name || CONTENT_LIBRARY[0];
    els.singleContentSelect.innerHTML = CONTENT_LIBRARY
      .map(c => `<option ${c === current ? 'selected' : ''}>${escapeHtml(c)}</option>`).join('');
    els.exposureHelper.textContent = 'Select the content to display to your exposed visitors.';
  } else {
    els.exposureHelper.textContent = 'Pick the contents to compare. Exposed visitors are split using the chosen allocation strategy.';

    $$('#allocSeg .seg-option').forEach(b => {
      b.classList.toggle('active', b.dataset.mode === rule.allocation);
    });

    renderContentsList();
    updateAllocFooter();

    els.warmup.value = rule.banditWarmup;
    els.warmupVal.textContent = `${rule.banditWarmup}%`;
    paintSlider(els.warmup);

    els.contextualOnly.classList.toggle('hidden', rule.allocation !== 'contextual');
    renderCtxChips();
  }
}

function renderContentsList() {
  const rule = getSelectedRule();
  els.contentsList.innerHTML = '';
  rule.contents.forEach((c, i) => {
    const row = document.createElement('div');
    row.className = 'content-row';
    const isManual = rule.allocation === 'manual';
    row.innerHTML = `
      <span class="cr-color s${i}"></span>
      <input class="cr-name" data-idx="${i}" value="${escapeHtml(c.name)}" />
      ${isManual
        ? `<input type="number" class="cr-pct-input" data-idx="${i}" min="0" max="100" value="${c.pct}" /><span class="cr-pct-suffix">%</span>`
        : `<span class="cr-auto">Auto</span>`}
      <span class="material-icons cr-remove" data-idx="${i}" title="Remove">close</span>
    `;
    els.contentsList.appendChild(row);
  });

  els.contentsList.querySelectorAll('.cr-name').forEach(inp => {
    inp.addEventListener('input', (e) => {
      rule.contents[+e.target.dataset.idx].name = e.target.value;
      markDirty();
    });
  });
  els.contentsList.querySelectorAll('.cr-pct-input').forEach(inp => {
    inp.addEventListener('input', (e) => {
      rule.contents[+e.target.dataset.idx].pct = clamp(e.target.value, 0, 100);
      updateAllocFooter();
      markDirty();
    });
  });
  els.contentsList.querySelectorAll('.cr-remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const i = +e.currentTarget.dataset.idx;
      if (rule.contents.length <= 2) {
        flash('An experiment rule needs at least 2 contents.');
        return;
      }
      rule.contents.splice(i, 1);
      renderContentsList();
      updateAllocFooter();
      markDirty();
    });
  });
}

function updateAllocFooter() {
  const rule = getSelectedRule();
  const isManual = rule.allocation === 'manual';
  els.banditFooter.classList.toggle('hidden', isManual);

  if (isManual) {
    const total = rule.contents.reduce((s, c) => s + (c.pct || 0), 0);
    els.allocTotal.classList.remove('hidden');
    els.autoDistributeBtn.classList.remove('hidden');
    if (total === 100) {
      els.allocTotal.textContent = 'Total: 100% ✓';
      els.allocTotal.className = 'alloc-total';
    } else {
      els.allocTotal.textContent = `Total: ${total}%`;
      els.allocTotal.className = 'alloc-total error';
    }
  } else {
    els.allocTotal.textContent = 'Auto-allocated';
    els.allocTotal.className = 'alloc-total auto';
    els.autoDistributeBtn.classList.add('hidden');
  }
}

function renderCtxChips() {
  const rule = getSelectedRule();
  els.ctxChips.innerHTML = rule.ctxAttrs.map(a =>
    `<span class="picked-chip" data-ctx="${escapeHtml(a)}">${escapeHtml(a)} <span class="material-icons">close</span></span>`
  ).join('') + `<span class="picked-chip add" id="addCtxBtn">+ Add attribute</span>`;

  els.ctxChips.querySelectorAll('.picked-chip:not(.add) .material-icons').forEach(x => {
    x.addEventListener('click', (e) => {
      const chip = e.target.closest('.picked-chip');
      rule.ctxAttrs = rule.ctxAttrs.filter(a => a !== chip.dataset.ctx);
      renderCtxChips();
      markDirty();
    });
  });
  document.getElementById('addCtxBtn').addEventListener('click', () => {
    const next = CTX_CANDIDATES.find(c => !rule.ctxAttrs.includes(c));
    if (!next) { flash('All attributes already added.'); return; }
    rule.ctxAttrs.push(next);
    renderCtxChips();
    markDirty();
  });
}

// ----------------------------------------------------------------------------
// Dirty-state tracking
// ----------------------------------------------------------------------------

function markDirty() {
  const snapshot = JSON.parse(lastSavedSnapshot);
  state.rules.forEach((r) => {
    const baseline = snapshot.find(s => s.id === r.id);
    if (!baseline) {
      r.unsaved = true;
      return;
    }
    const a = { ...r, unsaved: false };
    const b = { ...baseline, unsaved: false };
    r.unsaved = JSON.stringify(a) !== JSON.stringify(b);
  });
  updateSaveBtn();
  renderRules();
}

function updateSaveBtn() {
  const dirtyCount = state.rules.filter(r => r.unsaved).length;
  if (dirtyCount > 0) {
    els.saveBtn.disabled = false;
    els.saveBtn.classList.add('dirty');
    els.saveBtnSub.classList.remove('hidden');
    els.saveBtnCount.textContent = `${dirtyCount} Unsaved change${dirtyCount > 1 ? 's' : ''}`;
  } else {
    els.saveBtn.disabled = true;
    els.saveBtn.classList.remove('dirty');
    els.saveBtnSub.classList.add('hidden');
  }
}

function commitSave() {
  if (state.rules.every(r => !r.unsaved)) return;
  state.rules.forEach(r => { r.unsaved = false; });
  lastSavedSnapshot = JSON.stringify(state.rules);
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yy = now.getFullYear();
  els.savedText.textContent = `Saved ${dd}/${mm}/${yy}`;
  updateSaveBtn();
  renderRules();
}

function updateOnlineStatus() {
  const onlineCount = state.rules.filter(r => r.status === 'online').length;
  els.onlineStatusText.textContent = `${onlineCount} out of ${state.rules.length} rules online`;
  els.onlineStatus.classList.toggle('draft', onlineCount === 0);
}

function paintSlider(slider) {
  const min = +slider.min || 0;
  const max = +slider.max || 100;
  const val = +slider.value;
  const pct = ((val - min) / (max - min)) * 100;
  slider.style.backgroundSize = `${pct}% 100%`;
}

// ----------------------------------------------------------------------------
// Event bindings
// ----------------------------------------------------------------------------

// Section collapse/expand
$$('.config-section .section-head').forEach(head => {
  head.addEventListener('click', () => {
    const sec = head.parentElement;
    const wasCollapsed = sec.classList.contains('collapsed');
    sec.classList.toggle('collapsed');
    sec.classList.toggle('expanded');
    head.querySelector('.section-chev').textContent = wasCollapsed ? 'expand_more' : 'chevron_right';
  });
});

// Rule name
els.ruleName.addEventListener('input', (e) => {
  const rule = getSelectedRule(); if (!rule) return;
  rule.name = e.target.value;
  markDirty();
});

// Single content selection (Targeting rule)
els.singleContentSelect.addEventListener('change', (e) => {
  const rule = getSelectedRule(); if (!rule) return;
  rule.contents = [{ id: 'c1', name: e.target.value, pct: 100 }];
  markDirty();
});

// Add content (Experiment rule)
els.addContentBtn.addEventListener('click', () => {
  const rule = getSelectedRule(); if (!rule) return;
  if (rule.contents.length >= 5) {
    flash('Up to 5 contents in this prototype.');
    return;
  }
  const used = new Set(rule.contents.map(c => c.name));
  const nextName = CONTENT_LIBRARY.find(c => !used.has(c)) || `New content ${rule.contents.length + 1}`;
  rule.contents.push({ id: 'c' + Date.now(), name: nextName, pct: 0 });
  renderContentsList();
  updateAllocFooter();
  markDirty();
});

// Allocation seg control (Experiment rule)
els.allocSeg.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-option');
  if (!btn) return;
  const rule = getSelectedRule(); if (!rule) return;
  rule.allocation = btn.dataset.mode;
  hydratePanel();
  markDirty();
});

// Auto-distribute (Manual)
els.autoDistributeBtn.addEventListener('click', () => {
  const rule = getSelectedRule(); if (!rule) return;
  const n = rule.contents.length;
  const base = Math.floor(100 / n);
  const remainder = 100 - base * n;
  rule.contents.forEach((c, i) => { c.pct = base + (i < remainder ? 1 : 0); });
  renderContentsList();
  updateAllocFooter();
  markDirty();
});

// Warm-up
els.warmup.addEventListener('input', () => {
  const rule = getSelectedRule(); if (!rule) return;
  rule.banditWarmup = +els.warmup.value;
  els.warmupVal.textContent = `${rule.banditWarmup}%`;
  paintSlider(els.warmup);
  markDirty();
});

// Exposure slider <-> num input
function syncExposureFromSlider() {
  const rule = getSelectedRule(); if (!rule) return;
  rule.exposure = +els.expSlider.value;
  els.expNum.value = rule.exposure;
  els.exposureMeta.textContent = `${rule.exposure}%`;
  paintSlider(els.expSlider);
  markDirty();
}
function syncExposureFromNum() {
  const rule = getSelectedRule(); if (!rule) return;
  rule.exposure = clamp(els.expNum.value, 0, 100);
  els.expSlider.value = rule.exposure;
  els.exposureMeta.textContent = `${rule.exposure}%`;
  paintSlider(els.expSlider);
  markDirty();
}
els.expSlider.addEventListener('input', syncExposureFromSlider);
els.expNum.addEventListener('input', syncExposureFromNum);

// ----------------------------------------------------------------------------
// Add rule → type selector → create rule
// ----------------------------------------------------------------------------

els.addRuleBtn.addEventListener('click', () => {
  state.selectedRuleId = null;
  setPanelMode('type');
  renderRules();
});

els.cancelTypeSelect.addEventListener('click', () => {
  setPanelMode(state.selectedRuleId ? 'rule' : 'empty');
});

$$('.type-card').forEach(card => {
  card.addEventListener('click', () => {
    const type = card.dataset.type;
    const rule = createRule(type);
    state.rules.push(rule);
    state.selectedRuleId = rule.id;
    hydratePanel();
    setPanelMode('rule');
    markDirty();
  });
});

function createRule(type) {
  const id = 'r' + nextRuleId++;
  const ruleId = 213000 + nextRuleId * 7;
  const base = {
    id, ruleId,
    type,
    name: type === 'experiment' ? 'New experiment rule' : 'New targeting rule',
    status: 'draft',
    segment: 'all',
    exposure: 100,
    allocation: 'manual',
    banditWarmup: 20,
    ctxAttrs: ['Country', 'Device type', 'Loyalty tier'],
    unsaved: true
  };
  if (type === 'experiment') {
    base.contents = [
      { id: 'c1', name: CONTENT_LIBRARY[0], pct: 50 },
      { id: 'c2', name: CONTENT_LIBRARY[1], pct: 50 }
    ];
  } else {
    base.contents = [{ id: 'c1', name: CONTENT_LIBRARY[0], pct: 100 }];
  }
  return base;
}

// Save (top-right)
els.saveBtn.addEventListener('click', () => {
  if (els.saveBtn.disabled) return;
  commitSave();
});

// ----------------------------------------------------------------------------
// Toast
// ----------------------------------------------------------------------------
let flashTimer = null;
function flash(msg) {
  let toast = document.getElementById('protoToast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'protoToast';
    toast.style.cssText = `
      position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
      background: #1c1c1c; color: #fff;
      padding: 8px 14px; border-radius: 6px;
      font-size: 12px; font-weight: 500;
      z-index: 100; opacity: 0; transition: opacity 0.2s;
    `;
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = '1';
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { toast.style.opacity = '0'; }, 1800);
}

// ----------------------------------------------------------------------------
// Boot
// ----------------------------------------------------------------------------
renderRules();
updateSaveBtn();
selectRule('r1');
