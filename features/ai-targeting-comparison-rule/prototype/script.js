// ----------------------------------------------------------------------------
// AI Targeting Comparison Rule — Personalization prototype
//
// Rule types in the queue:
//   - 'targeting'      → single content (existing rule, minimal here)
//   - 'ai-comparison'  → 2 targeting groups, each defined with the familiar
//                        Segment + Trigger model. Exactly one group must use a
//                        segment that contains an AI Targeting condition.
//                        One shared content. (Goal lives at the personalization
//                        level, like every other rule — not on this rule.)
// ----------------------------------------------------------------------------

const CONTENTS = ['Content 1', 'Hero banner', 'Pricing callout', 'Free-shipping bar'];

// Segment library — some segments contain an AI Targeting condition (ai: true).
// AI segments carry a learning state from AI Predictive targeting (see related
// feature "AI predictive visibility", project #38057). We only consume it here
// as a read-only badge: learning | no-data | weak | moderate | good.
const SEGMENTS = [
  { id: 's1', name: 'Returning visitors', ai: false },
  { id: 's2', name: 'High purchase intent', ai: true, aiState: 'good' },
  { id: 's3', name: 'Loyalty — Gold tier', ai: false },
  { id: 's4', name: 'Likely to churn', ai: true, aiState: 'learning' },
  { id: 's5', name: 'Cart abandoners', ai: false },
  { id: 's6', name: 'Mobile — France', ai: false },
  { id: 's7', name: 'Bargain hunters', ai: true, aiState: 'moderate' }
];

// AI learning-state badge taxonomy (end result of AI Predictive training).
const AI_STATES = {
  learning: { label: 'Learning' },
  'no-data': { label: 'No data' },
  weak: { label: 'Weak' },
  moderate: { label: 'Moderate' },
  good: { label: 'Good' }
};
function aiStateBadge(state) {
  if (!AI_STATES[state]) return '';
  return `<span class="ai-state ${state}"><span class="material-icons">auto_awesome</span>${AI_STATES[state].label}</span>`;
}
// Reliability note shown inside the AI group while the data is not yet dependable.
function aiNoteHtml(seg) {
  if (!seg || !seg.ai) return '';
  if (seg.aiState === 'learning') {
    return `<div class="inline-note warn"><span class="material-icons">hourglass_top</span><div>This AI segment is still training, so its targeting — and this comparison — may not be reliable until it finishes learning.</div></div>`;
  }
  if (seg.aiState === 'no-data' || seg.aiState === 'weak') {
    return `<div class="inline-note warn"><span class="material-icons">warning_amber</span><div>This AI segment has limited data so far. The comparison will become more reliable as it gathers more.</div></div>`;
  }
  return '';
}
// Trigger library — no AI here.
const TRIGGERS = [
  { id: 't1', name: 'Pricing page reached' },
  { id: 't2', name: 'Add-to-cart clicked' },
  { id: 't3', name: '30 seconds on page' },
  { id: 't4', name: 'Exit intent detected' },
  { id: 't5', name: 'Scrolled to footer' }
];

let nextRuleId = 3;
let gidCounter = 0;
const DEFAULT_URL = 'https://www.allaboutbirds.org/';

function newGroup(name, seg, trg) {
  return {
    id: 'grp' + (++gidCounter),
    name,
    seg: seg || { mode: 'all', id: null },
    trg: trg || { mode: 'page', page: { sub: 'specific', url: DEFAULT_URL, fragment: '' }, id: null }
  };
}

const state = {
  rules: [
    {
      id: 'r1', ruleId: 233401,
      type: 'targeting',
      name: 'Welcome banner — all visitors',
      status: 'online',
      content: 'Hero banner',
      unsaved: false
    },
    {
      id: 'r2', ruleId: 233770,
      type: 'ai-comparison',
      name: 'AI vs returning-visitor targeting',
      status: 'draft',
      content: 'Content 1',
      exposure: 100,
      groups: [
        newGroup('Group 1',
          { mode: 'specific', id: 's2' },                                   // AI segment
          { mode: 'page', page: { sub: 'site', url: DEFAULT_URL }, id: null }),
        newGroup('Group 2',
          { mode: 'specific', id: 's1' },                                   // returning visitors
          { mode: 'specific', page: { sub: 'specific', url: DEFAULT_URL }, id: 't1' })
      ],
      unsaved: false
    }
  ],
  selectedRuleId: null,
  panelMode: 'empty',
  collapsedGroups: {}
};

let lastSavedSnapshot = snapshot();
function snapshot() { return JSON.stringify(state.rules); }

// ----------------------------------------------------------------------------
const $ = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
const els = {
  rulesList: $('#rulesList'),
  emptyView: $('#emptyView'),
  typeSelectorView: $('#typeSelectorView'),
  ruleForm: $('#ruleForm'),
  formBody: $('#formBody'),
  saveBtn: $('#saveBtn'),
  saveBtnSub: $('#saveBtnSub'),
  saveBtnCount: $('#saveBtnCount'),
  savedText: $('#savedText'),
  onlineStatus: $('#onlineStatus'),
  onlineStatusText: $('#onlineStatusText'),
  cancelTypeSelect: $('#cancelTypeSelect'),
  panelTitle: $('#panelTitle'),
  panelStatus: $('#panelStatus'),
  panelStatusText: $('#panelStatusText'),
  panelId: $('#panelId'),
  ruleTypePill: $('#ruleTypePill'),
  ruleTypeIcon: $('#ruleTypeIcon'),
  ruleTypeLabel: $('#ruleTypeLabel'),
  addRuleBtn: $('#addRuleBtn')
};

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function clamp(v, min, max) {
  let n = parseInt(v, 10); if (isNaN(n)) n = min;
  return Math.max(min, Math.min(max, n));
}

function paintSlider(slider) {
  if (!slider) return;
  const min = +slider.min || 0;
  const max = +slider.max || 100;
  const pct = ((+slider.value - min) / (max - min)) * 100;
  slider.style.backgroundSize = `${pct}% 100%`;
}

// ----------------------------------------------------------------------------
// Group helpers — AI lives inside a segment
// ----------------------------------------------------------------------------
function segOf(g) { return g.seg.mode === 'specific' ? SEGMENTS.find(s => s.id === g.seg.id) : null; }
function trgOf(g) { return g.trg.mode === 'specific' ? TRIGGERS.find(t => t.id === g.trg.id) : null; }
function groupHasAI(g) { const s = segOf(g); return !!(s && s.ai); }
function ruleHasAI(rule) { return rule.groups.some(groupHasAI); }
function groupById(rule, id) { return rule.groups.find(g => g.id === id); }

function segSummary(g) {
  if (g.seg.mode === 'all') return 'All visitors are targeted';
  if (g.seg.mode === 'visitors') return 'Specific visitors';
  const s = segOf(g);
  return s ? s.name : 'Select a segment';
}
function trgSummary(g) {
  if (g.trg.mode === 'page') return 'When a web page is reached';
  if (g.trg.mode === 'combination') return 'Combination of triggers';
  const t = trgOf(g);
  return t ? t.name : 'Select a trigger';
}
function groupDesc(g) {
  let s = g.seg.mode === 'all' ? 'All visitors'
    : g.seg.mode === 'visitors' ? 'Specific visitors'
      : (segOf(g)?.name || 'Segment');
  const t = trgOf(g);
  if (t) s += ' + ' + t.name;
  return s;
}

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------
function validate(rule) {
  const issues = [];
  if (rule.type !== 'ai-comparison') return issues;
  const aiGroups = rule.groups.filter(groupHasAI).length;
  if (aiGroups === 0) issues.push('One group must use a segment that includes an AI Targeting condition.');
  if (aiGroups === 2) issues.push('Only one group can include AI Targeting. Change the segment in one group.');
  return issues;
}

// ----------------------------------------------------------------------------
// Rules list
// ----------------------------------------------------------------------------
function ruleSummaryHtml(rule) {
  if (rule.type === 'targeting') {
    return `<a href="#">100%</a> of <a href="#">All visitors</a> exposed to <a href="#">${esc(rule.content)}</a>`;
  }
  const issues = validate(rule);
  if (issues.length) return `<span class="incomplete">Incomplete — ${esc(issues[0])}</span>`;
  const [g1, g2] = rule.groups;
  const nm = (g) => groupHasAI(g) ? `<span class="ai-side">${esc(g.name)}</span>` : esc(g.name);
  return `${nm(g1)} <span class="vs">vs</span> ${nm(g2)} → tested on <a href="#">${esc(rule.content)}</a>`;
}

function renderRules() {
  els.rulesList.innerHTML = '';
  state.rules.forEach((rule, idx) => {
    const card = document.createElement('div');
    const cls = ['rule-card'];
    if (state.selectedRuleId === rule.id) cls.push('selected');
    if (rule.unsaved) cls.push('unsaved');
    card.className = cls.join(' ');

    const statusPill = rule.status === 'online'
      ? `<span class="status-pill"><span class="status-dot"></span>Online</span>`
      : `<span class="status-pill draft"><span class="status-dot"></span>Draft</span>`;
    const unsavedPill = rule.unsaved ? `<span class="unsaved-pill">Unsaved</span>` : '';
    const playPause = rule.status === 'online' ? 'pause' : 'play_arrow';

    const isAI = rule.type === 'ai-comparison';
    const iconCls = isAI ? 'rule-type-icon ai' : 'rule-type-icon';
    const iconName = isAI ? 'compare_arrows' : 'my_location';

    card.innerHTML = `
      <div class="rule-row">
        <div class="rule-num">${idx + 1}</div>
        <div class="${iconCls}"><span class="material-icons">${iconName}</span></div>
        <div class="rule-content">
          <div class="rule-title-row">
            <span class="rule-name">${esc(rule.name)}</span>
            ${statusPill}
            ${unsavedPill}
          </div>
          <div class="rule-summary">${ruleSummaryHtml(rule)}</div>
        </div>
        <div class="rule-actions">
          <div class="icon-btn" title="${rule.status === 'online' ? 'Pause' : 'Activate'}"><span class="material-icons">${playPause}</span></div>
          <div class="icon-btn"><span class="material-icons">more_vert</span></div>
        </div>
      </div>`;
    card.addEventListener('click', (e) => {
      if (e.target.closest('.icon-btn')) return;
      selectRule(rule.id);
    });
    els.rulesList.appendChild(card);
  });
  updateOnlineStatus();
}

// ----------------------------------------------------------------------------
// Panel mode + selection
// ----------------------------------------------------------------------------
function setPanelMode(mode) {
  state.panelMode = mode;
  els.emptyView.classList.toggle('hidden', mode !== 'empty');
  els.typeSelectorView.classList.toggle('hidden', mode !== 'type');
  els.ruleForm.classList.toggle('hidden', mode !== 'rule');
}
function getRule() { return state.rules.find(r => r.id === state.selectedRuleId); }
function selectRule(id) {
  state.selectedRuleId = id;
  renderForm();
  setPanelMode('rule');
  renderRules();
}

// ----------------------------------------------------------------------------
// Form rendering
// ----------------------------------------------------------------------------
function renderForm() {
  const rule = getRule();
  if (!rule) return;
  const isAI = rule.type === 'ai-comparison';

  els.panelTitle.textContent = isAI ? 'Configure the AI Targeting Comparison rule' : 'Configure the targeting rule';
  els.panelId.firstChild.nodeValue = rule.ruleId + ' ';
  if (rule.status === 'online') {
    els.panelStatus.className = 'status-pill panel-status';
    els.panelStatusText.textContent = 'Online';
  } else {
    els.panelStatus.className = 'status-pill panel-status draft';
    els.panelStatusText.textContent = 'Draft';
  }
  els.ruleTypeIcon.textContent = isAI ? 'compare_arrows' : 'my_location';
  els.ruleTypeLabel.textContent = isAI ? 'AI Comparison' : 'Targeting';
  if (!isAI) {
    els.ruleTypePill.style.background = '#eef0ff';
    els.ruleTypePill.style.color = 'var(--primary-blue)';
  } else {
    els.ruleTypePill.style.background = '';
    els.ruleTypePill.style.color = '';
  }

  els.formBody.innerHTML = isAI ? aiFormHtml(rule) : basicFormHtml(rule);
  if (isAI) wireAIForm(rule); else wireBasicForm(rule);
  updateSaveBtn();
}

function basicFormHtml(rule) {
  return `
    <div class="form-section">
      <label class="field-label">Rule name</label>
      <input type="text" class="input-field" id="ruleName" value="${esc(rule.name)}">
    </div>
    <div class="inline-note info">
      <span class="material-icons">info</span>
      <div>This prototype focuses on the <b>AI Targeting Comparison</b> rule type. Standard targeting rules use the existing Segments / Triggers / Exposure configuration.</div>
    </div>`;
}
function wireBasicForm(rule) {
  $('#ruleName').addEventListener('input', (e) => { rule.name = e.target.value; markDirty(); });
}

// ── AI Comparison form ──────────────────────────────────────────────
function aiFormHtml(rule) {
  const issues = validate(rule);
  const banner = issues.length ? `
    <div class="validation-banner">
      <div class="vb-head"><span class="material-icons">error_outline</span> Resolve ${issues.length} item${issues.length > 1 ? 's' : ''} before saving</div>
      <ul class="vb-list">${issues.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
    </div>` : '';

  return `
    <div class="form-section">
      <label class="field-label">Rule name</label>
      <input type="text" class="input-field" id="ruleName" value="${esc(rule.name)}">
    </div>

    ${banner}

    <!-- TARGETING -->
    <div class="config-section expanded" data-section="targeting">
      <div class="section-head">
        <div class="section-head-left">
          <span class="section-title">Targeting</span>
          <span class="section-meta">2 groups</span>
        </div>
        <span class="material-icons section-chev">expand_more</span>
      </div>
      <div class="section-body">
        ${rule.groups.map((g, i) => groupHtml(rule, g, i)).join('')}

        ${overlapHtml()}
      </div>
    </div>

    <!-- CONTENT & EXPOSURE -->
    <div class="config-section expanded" data-section="content">
      <div class="section-head">
        <div class="section-head-left">
          <span class="section-title">Content</span>
          <span class="section-meta accent" id="contentMeta">${esc(rule.content)} · ${rule.exposure}%</span>
        </div>
        <span class="material-icons section-chev">expand_more</span>
      </div>
      <div class="section-body">
        <p class="helper-text">Select the content to display to your exposed visitors.</p>
        <select class="input-field select-field" id="contentSelect">
          ${CONTENTS.map(c => `<option ${c === rule.content ? 'selected' : ''}>${esc(c)}</option>`).join('')}
        </select>
        <div class="exposure-slider-block">
          <label class="field-label">Targeted visitors exposed (%)</label>
          <div class="slider-row">
            <input type="range" min="0" max="100" value="${rule.exposure}" class="slider" id="expSlider">
            <input type="number" min="0" max="100" value="${rule.exposure}" class="num-input" id="expNum">
          </div>
        </div>
      </div>
    </div>

    <!-- OPTIONAL -->
    ${optionalSection('Scheduling')}
    ${optionalSection('Display settings')}
    ${optionalSection('Rollback conditions')}
  `;
}

function optionalSection(title) {
  return `
    <div class="config-section collapsed" data-section="${title.toLowerCase().replace(/\s+/g, '-')}">
      <div class="section-head">
        <div class="section-head-left">
          <span class="section-title">${title}</span>
          <span class="section-meta">(Optional)</span>
        </div>
        <span class="material-icons section-chev">chevron_right</span>
      </div>
      <div class="section-body"><p class="helper-text">Optional — unchanged from standard rules.</p></div>
    </div>`;
}

function groupHtml(rule, group, idx) {
  const hasAI = groupHasAI(group);
  const aiSeg = hasAI ? segOf(group) : null;
  const collapsed = !!state.collapsedGroups[group.id];
  const chip = hasAI
    ? `<span class="cap-chip ai" title="This group uses AI Targeting to decide who qualifies."><span class="material-icons">auto_awesome</span> AI Targeting</span>${aiSeg ? aiStateBadge(aiSeg.aiState) : ''}`
    : `<span class="cap-chip no-ai" title="This group uses standard targeting conditions. That's expected — it's the comparison baseline.">No AI targeting</span>`;

  return `
    <div class="tgroup ${collapsed ? 'collapsed' : ''}" data-group="${group.id}">
      <div class="tgroup-head" data-toggle="${group.id}">
        <span class="material-icons tgroup-chev">${collapsed ? 'chevron_right' : 'expand_more'}</span>
        <span class="tg-index">${idx + 1}</span>
        <input class="tgroup-name" data-rename="${group.id}" value="${esc(group.name)}" onclick="event.stopPropagation()">
        ${chip}
        <span class="tgroup-summary">${esc(segSummary(group))}</span>
      </div>
      <div class="tgroup-body">
        ${aiNoteHtml(aiSeg)}
        ${segmentBlockHtml(rule, group)}
        ${triggerBlockHtml(rule, group)}
      </div>
    </div>`;
}

// ── Segment definition (radio buttons, mirrors current Kameleoon UI) ──
function segmentBlockHtml(rule, g) {
  const m = g.seg.mode;
  const otherHasAI = rule.groups.some(x => x !== g && groupHasAI(x));
  return `
    <div class="def-block">
      <div class="def-head">
        <span class="def-title">Segment</span>
        <span class="def-link">${esc(segSummary(g))}</span>
      </div>
      <div class="def-q">Who should see the personalization?</div>

      <label class="radio-row">
        <input type="radio" name="seg-${g.id}" data-seg-mode="all" data-group="${g.id}" ${m === 'all' ? 'checked' : ''}>
        <span>All Visitors</span>
      </label>

      <label class="radio-row">
        <input type="radio" name="seg-${g.id}" data-seg-mode="specific" data-group="${g.id}" ${m === 'specific' ? 'checked' : ''}>
        <span>Specific segment</span>
      </label>
      ${m === 'specific' ? `<div class="radio-sub">${ksSelectHtml('seg', g, otherHasAI)}</div>` : ''}

      <label class="radio-row disabled">
        <input type="radio" name="seg-${g.id}" data-seg-mode="visitors" data-group="${g.id}" disabled ${m === 'visitors' ? 'checked' : ''}>
        <span>Specific visitors</span>
        <span class="material-icons rr-help">help_outline</span>
      </label>
      <div class="radio-sub"><span class="inactive-note">Quick builder (inactive for this prototype).</span></div>
    </div>`;
}

// ── Trigger definition (radio buttons + page hierarchy) ──
function triggerBlockHtml(rule, g) {
  const m = g.trg.mode;
  const sub = g.trg.page.sub;
  return `
    <div class="def-block">
      <div class="def-head">
        <span class="def-title">Trigger</span>
        <span class="def-link">${esc(trgSummary(g))}</span>
      </div>
      <div class="def-q">When should a visitor be exposed to your personalization?</div>

      <label class="radio-row">
        <input type="radio" name="trg-${g.id}" data-trg-mode="page" data-group="${g.id}" ${m === 'page' ? 'checked' : ''}>
        <span>When a web page is reached</span>
      </label>
      ${m === 'page' ? `
        <div class="radio-sub">
          <label class="radio-row">
            <input type="radio" name="trgpage-${g.id}" data-trg-page="specific" data-group="${g.id}" ${sub === 'specific' ? 'checked' : ''}>
            <span>A specific page</span>
            <span class="material-icons rr-help">help_outline</span>
          </label>
          ${sub === 'specific' ? `<input type="text" class="input-field" data-trg-url data-group="${g.id}" value="${esc(g.trg.page.url)}">` : ''}
          <label class="radio-row">
            <input type="radio" name="trgpage-${g.id}" data-trg-page="fragment" data-group="${g.id}" ${sub === 'fragment' ? 'checked' : ''}>
            <span>The URLs containing a specific fragment</span>
          </label>
          ${sub === 'fragment' ? `<input type="text" class="input-field" data-trg-fragment data-group="${g.id}" placeholder="e.g. /pricing" value="${esc(g.trg.page.fragment || '')}">` : ''}
          <label class="radio-row">
            <input type="radio" name="trgpage-${g.id}" data-trg-page="site" data-group="${g.id}" ${sub === 'site' ? 'checked' : ''}>
            <span>The entire site</span>
            <span class="material-icons rr-help" title="Caution: This will target all pages within the project scope.">help_outline</span>
          </label>
        </div>` : ''}

      <label class="radio-row">
        <input type="radio" name="trg-${g.id}" data-trg-mode="specific" data-group="${g.id}" ${m === 'specific' ? 'checked' : ''}>
        <span>When a specific trigger occurs</span>
      </label>
      ${m === 'specific' ? `<div class="radio-sub">${ksSelectHtml('trg', g, false)}</div>` : ''}

      <label class="radio-row disabled">
        <input type="radio" name="trg-${g.id}" data-trg-mode="combination" data-group="${g.id}" disabled ${m === 'combination' ? 'checked' : ''}>
        <span>When a combination of triggers occurs</span>
        <span class="material-icons rr-help">help_outline</span>
      </label>
      <div class="radio-sub"><span class="inactive-note">Quick builder (inactive for this prototype).</span></div>
    </div>`;
}

// ── Rich dropdown (so AI segments can show a badge) ──
function ksSelectHtml(kind, g, disableAI) {
  const opts = kind === 'seg' ? SEGMENTS : TRIGGERS;
  const curId = kind === 'seg' ? g.seg.id : g.trg.id;
  const cur = opts.find(o => o.id === curId);
  const label = cur
    ? `<span class="ks-select-label">${esc(cur.name)}${cur.ai ? ' ' + aiStateBadge(cur.aiState) : ''}</span>`
    : `<span class="ks-select-label"><span class="ph">${kind === 'seg' ? 'Select a segment…' : 'Select a trigger…'}</span></span>`;

  const rows = opts.map(o => {
    const disabled = kind === 'seg' && o.ai && disableAI;
    return `
      <button class="ks-opt ${o.id === curId ? 'selected' : ''} ${disabled ? 'disabled' : ''}"
              data-ks-opt="${o.id}" data-kind="${kind}" data-group="${g.id}" ${disabled ? 'data-disabled="1"' : ''}>
        <span>${esc(o.name)}</span>
        ${o.ai ? aiStateBadge(o.aiState) : ''}
      </button>`;
  }).join('');

  const note = (kind === 'seg' && disableAI)
    ? `<div class="ks-menu-note">AI segments are disabled here — the other group already includes AI Targeting.</div>`
    : '';

  return `
    <div class="ks-select" data-kind="${kind}" data-group="${g.id}">
      <button class="ks-select-btn" data-ks-toggle>
        ${label}
        <span class="material-icons">expand_more</span>
      </button>
      <div class="ks-select-menu hidden">
        ${rows}
        ${note}
      </div>
    </div>`;
}

function overlapHtml() {
  return `
    <div class="overlap-note">
      <div class="overlap-top">
        <span class="material-icons">shuffle</span>
        <span class="overlap-short">Visitors who match both groups are assigned to one group automatically for a clean comparison.</span>
      </div>
      <button class="overlap-toggle" id="overlapToggle">How overlap is handled →</button>
      <div class="overlap-expanded hidden" id="overlapExpanded">
        If a visitor qualifies for both targeting groups, they are assigned to exactly one group using stable random assignment so they are not counted twice. Both groups are still evaluated against the full incoming population — only the overlap is split, 50/50, by a stable per-visitor hash.
      </div>
      <div class="overlap-diag">
        <span class="material-icons">insights</span>
        <span>Estimated overlap: <b>~18%</b> of matched visitors → split evenly between groups (diagnostic only).</span>
      </div>
    </div>`;
}

// ----------------------------------------------------------------------------
// Wiring
// ----------------------------------------------------------------------------
function wireAIForm(rule) {
  $('#ruleName').addEventListener('input', (e) => { rule.name = e.target.value; markDirty(); });
  $('#contentSelect').addEventListener('change', (e) => { rule.content = e.target.value; rerender(); markDirty(); });

  // Exposure slider <-> number input (no rerender — keep slider responsive)
  const expSlider = $('#expSlider');
  const expNum = $('#expNum');
  paintSlider(expSlider);
  const updateContentMeta = () => {
    const m = $('#contentMeta');
    if (m) m.textContent = `${rule.content} · ${rule.exposure}%`;
  };
  expSlider.addEventListener('input', () => {
    rule.exposure = +expSlider.value;
    expNum.value = rule.exposure;
    paintSlider(expSlider);
    updateContentMeta();
    markDirty();
  });
  expNum.addEventListener('input', () => {
    rule.exposure = clamp(expNum.value, 0, 100);
    expSlider.value = rule.exposure;
    paintSlider(expSlider);
    updateContentMeta();
    markDirty();
  });

  const ot = $('#overlapToggle');
  ot.addEventListener('click', () => {
    const ex = $('#overlapExpanded');
    ex.classList.toggle('hidden');
    ot.textContent = ex.classList.contains('hidden') ? 'How overlap is handled →' : 'Hide details ↑';
  });

  // section collapse
  els.formBody.querySelectorAll('.config-section .section-head').forEach(head => {
    head.addEventListener('click', () => {
      const sec = head.parentElement;
      const wasCollapsed = sec.classList.contains('collapsed');
      sec.classList.toggle('collapsed');
      sec.classList.toggle('expanded');
      head.querySelector('.section-chev').textContent = wasCollapsed ? 'expand_more' : 'chevron_right';
    });
  });

  // group collapse
  els.formBody.querySelectorAll('[data-toggle]').forEach(h => {
    h.addEventListener('click', () => {
      const gid = h.dataset.toggle;
      state.collapsedGroups[gid] = !state.collapsedGroups[gid];
      rerender();
    });
  });

  // group rename
  els.formBody.querySelectorAll('[data-rename]').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const g = groupById(rule, e.target.dataset.rename);
      if (g) { g.name = e.target.value; markDirty(); }
    });
  });

  // segment mode radios
  els.formBody.querySelectorAll('[data-seg-mode]').forEach(r => {
    r.addEventListener('change', (e) => {
      const g = groupById(rule, e.target.dataset.group);
      g.seg.mode = e.target.dataset.segMode;
      if (g.seg.mode === 'specific' && !g.seg.id) g.seg.id = firstSelectableSegment(rule, g);
      rerender(); markDirty();
    });
  });

  // trigger mode radios
  els.formBody.querySelectorAll('[data-trg-mode]').forEach(r => {
    r.addEventListener('change', (e) => {
      const g = groupById(rule, e.target.dataset.group);
      g.trg.mode = e.target.dataset.trgMode;
      if (g.trg.mode === 'specific' && !g.trg.id) g.trg.id = TRIGGERS[0].id;
      rerender(); markDirty();
    });
  });

  // page sub radios
  els.formBody.querySelectorAll('[data-trg-page]').forEach(r => {
    r.addEventListener('change', (e) => {
      const g = groupById(rule, e.target.dataset.group);
      g.trg.page.sub = e.target.dataset.trgPage;
      rerender(); markDirty();
    });
  });

  // url input (no rerender — keep focus)
  els.formBody.querySelectorAll('[data-trg-url]').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const g = groupById(rule, e.target.dataset.group);
      g.trg.page.url = e.target.value; markDirty();
    });
  });

  // fragment input (no rerender — keep focus)
  els.formBody.querySelectorAll('[data-trg-fragment]').forEach(inp => {
    inp.addEventListener('input', (e) => {
      const g = groupById(rule, e.target.dataset.group);
      g.trg.page.fragment = e.target.value; markDirty();
    });
  });

  // rich dropdown: toggle
  els.formBody.querySelectorAll('[data-ks-toggle]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = btn.parentElement.querySelector('.ks-select-menu');
      const wasHidden = menu.classList.contains('hidden');
      closeAllMenus();
      if (wasHidden) menu.classList.remove('hidden');
    });
  });
  // rich dropdown: option click
  els.formBody.querySelectorAll('[data-ks-opt]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.dataset.disabled) { flash('Only one group can include AI Targeting.'); return; }
      const g = groupById(rule, btn.dataset.group);
      if (btn.dataset.kind === 'seg') g.seg.id = btn.dataset.ksOpt;
      else g.trg.id = btn.dataset.ksOpt;
      rerender(); markDirty();
    });
  });
}

function firstSelectableSegment(rule, g) {
  const otherHasAI = rule.groups.some(x => x !== g && groupHasAI(x));
  const pick = SEGMENTS.find(s => !(s.ai && otherHasAI));
  return (pick || SEGMENTS[0]).id;
}

function closeAllMenus() {
  els.formBody.querySelectorAll('.ks-select-menu').forEach(m => m.classList.add('hidden'));
}
document.addEventListener('click', closeAllMenus);

function rerender() {
  const panel = $('#rightPanel');
  const sp = panel.scrollTop;
  renderForm();
  panel.scrollTop = sp;
  renderRules();
}

// ----------------------------------------------------------------------------
// Dirty / save
// ----------------------------------------------------------------------------
function markDirty() {
  const base = JSON.parse(lastSavedSnapshot);
  state.rules.forEach(r => {
    const b = base.find(s => s.id === r.id);
    if (!b) { r.unsaved = true; return; }
    const a = { ...r, unsaved: false };
    const bb = { ...b, unsaved: false };
    r.unsaved = JSON.stringify(a) !== JSON.stringify(bb);
  });
  updateSaveBtn();
  renderRules();
}

function updateSaveBtn() {
  const dirty = state.rules.filter(r => r.unsaved).length;
  const sel = getRule();
  const issues = sel ? validate(sel) : [];
  if (dirty === 0) {
    els.saveBtn.disabled = true;
    els.saveBtn.className = 'save-btn';
    els.saveBtnSub.classList.add('hidden');
    return;
  }
  if (issues.length) {
    els.saveBtn.disabled = true;
    els.saveBtn.className = 'save-btn blocked';
    els.saveBtnSub.classList.remove('hidden');
    els.saveBtnCount.textContent = `Resolve ${issues.length} issue${issues.length > 1 ? 's' : ''}`;
  } else {
    els.saveBtn.disabled = false;
    els.saveBtn.className = 'save-btn dirty';
    els.saveBtnSub.classList.remove('hidden');
    els.saveBtnCount.textContent = `${dirty} Unsaved change${dirty > 1 ? 's' : ''}`;
  }
}

function commitSave() {
  const sel = getRule();
  if (sel && validate(sel).length) { flash('Resolve validation issues before saving.'); return; }
  if (state.rules.every(r => !r.unsaved)) return;
  state.rules.forEach(r => { r.unsaved = false; });
  lastSavedSnapshot = snapshot();
  els.savedText.textContent = 'Saved just now';
  updateSaveBtn();
  renderRules();
  flash('Saved.');
}

function updateOnlineStatus() {
  const on = state.rules.filter(r => r.status === 'online').length;
  els.onlineStatusText.textContent = `${on} out of ${state.rules.length} rules online`;
  els.onlineStatus.classList.toggle('draft', on === 0);
}

// ----------------------------------------------------------------------------
// Add rule → type selector
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
    const rule = createRule(card.dataset.type);
    state.rules.push(rule);
    state.selectedRuleId = rule.id;
    renderForm();
    setPanelMode('rule');
    markDirty();
  });
});

function createRule(type) {
  const id = 'r' + (++nextRuleId);
  const ruleId = 233000 + nextRuleId * 13;
  if (type === 'ai-comparison') {
    return {
      id, ruleId, type, name: 'New AI Targeting Comparison rule', status: 'draft',
      content: CONTENTS[0],
      exposure: 100,
      groups: [
        newGroup('Group 1', { mode: 'specific', id: 's2' }),   // defaults to an AI segment
        newGroup('Group 2', { mode: 'all', id: null })
      ],
      unsaved: true
    };
  }
  return { id, ruleId, type: 'targeting', name: type === 'experiment' ? 'New experiment rule' : 'New targeting rule', status: 'draft', content: CONTENTS[0], unsaved: true };
}

els.saveBtn.addEventListener('click', () => { if (!els.saveBtn.disabled) commitSave(); });

// ----------------------------------------------------------------------------
// Toast
// ----------------------------------------------------------------------------
let flashTimer = null;
function flash(msg) {
  let t = document.getElementById('protoToast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'protoToast';
    t.style.cssText = 'position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:#1c1c1c;color:#fff;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:500;z-index:100;opacity:0;transition:opacity .2s;';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  if (flashTimer) clearTimeout(flashTimer);
  flashTimer = setTimeout(() => { t.style.opacity = '0'; }, 1800);
}

// ----------------------------------------------------------------------------
// Boot
// ----------------------------------------------------------------------------
renderRules();
updateSaveBtn();
selectRule('r2');
