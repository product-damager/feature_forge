// ----------------------------------------------------------------------------
// AI Targeting Comparison Rule — Personalization prototype
//
// Rule types in the queue:
//   - 'targeting'      → single content (existing rule, minimal here)
//   - 'ai-comparison'  → 2 segments to compare + 1 shared trigger. The two
//                        segments differ only by their audience definition;
//                        the trigger is held constant (like an Experiment rule
//                        holds targeting constant and varies the content).
//                        Exactly one segment must contain an AI Targeting
//                        condition. One shared content. Overlap between the two
//                        segments is accepted (double-counting) — not resolved,
//                        not shown. (Goal lives at the personalization level.)
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

// The trigger is shared by the whole rule — it defines WHEN both segments are
// evaluated. Only the segment differs between the two.
function newTrigger(trg) {
  return trg || { mode: 'page', page: { sub: 'specific', url: DEFAULT_URL, fragment: '' }, id: null };
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
      segments: [
        { mode: 'specific', id: 's2' },   // AI segment
        { mode: 'specific', id: 's1' }    // returning visitors
      ],
      trigger: newTrigger({ mode: 'page', page: { sub: 'site', url: DEFAULT_URL, fragment: '' }, id: null }),
      unsaved: false
    }
  ],
  selectedRuleId: null,
  panelMode: 'empty'
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
function segOf(seg) { return seg.mode === 'specific' ? SEGMENTS.find(s => s.id === seg.id) : null; }
function trgOf(rule) { return rule.trigger.mode === 'specific' ? TRIGGERS.find(t => t.id === rule.trigger.id) : null; }
function segmentHasAI(seg) { const s = segOf(seg); return !!(s && s.ai); }
function ruleHasAI(rule) { return rule.segments.some(segmentHasAI); }

function segSummary(seg) {
  if (seg.mode === 'all') return 'All visitors are targeted';
  if (seg.mode === 'visitors') return 'Specific visitors';
  const s = segOf(seg);
  return s ? s.name : 'Select a segment';
}
function trgSummary(rule) {
  if (rule.trigger.mode === 'page') return 'When a web page is reached';
  if (rule.trigger.mode === 'combination') return 'Combination of triggers';
  const t = trgOf(rule);
  return t ? t.name : 'Select a trigger';
}

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------
function validate(rule) {
  const issues = [];
  if (rule.type !== 'ai-comparison') return issues;
  const aiSegments = rule.segments.filter(segmentHasAI).length;
  if (aiSegments === 0) issues.push('One segment must include an AI Targeting condition.');
  if (aiSegments === 2) issues.push('Only one segment can include AI Targeting. Change one segment.');
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
  const [s1, s2] = rule.segments;
  const nm = (seg) => segmentHasAI(seg) ? `<span class="ai-side">${esc(segSummary(seg))}</span>` : esc(segSummary(seg));
  return `${nm(s1)} <span class="vs">vs</span> ${nm(s2)} → tested on <a href="#">${esc(rule.content)}</a>`;
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
          <span class="section-meta">2 segments · 1 shared trigger</span>
        </div>
        <span class="material-icons section-chev">expand_more</span>
      </div>
      <div class="section-body">
        <div class="subsection-head">
          <span class="subsection-title">Segments to compare</span>
          <span class="subsection-hint">The only difference between the two targeting paths.</span>
        </div>
        ${rule.segments.map((seg, i) => segmentHtml(rule, seg, i)).join('')}

        <div class="subsection-head">
          <span class="subsection-title">Trigger</span>
          <span class="subsection-hint">Shared — when both segments are evaluated and the content is shown.</span>
        </div>
        ${triggerBlockHtml(rule)}
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

function segmentHtml(rule, seg, idx) {
  const hasAI = segmentHasAI(seg);
  const aiSeg = hasAI ? segOf(seg) : null;
  const chip = hasAI
    ? `<span class="cap-chip ai" title="This segment uses AI Targeting to decide who qualifies."><span class="material-icons">auto_awesome</span> AI Targeting</span>${aiSeg ? aiStateBadge(aiSeg.aiState) : ''}`
    : `<span class="cap-chip no-ai" title="This segment uses standard targeting conditions. That's expected — it's the comparison baseline.">Standard targeting</span>`;

  return `
    <div class="segment-card" data-segment-idx="${idx}">
      <div class="segment-head">
        <span class="segment-num">${idx + 1}</span>
        ${chip}
        <span class="segment-summary">${esc(segSummary(seg))}</span>
      </div>
      <div class="segment-body">
        ${aiNoteHtml(aiSeg)}
        ${segmentBlockHtml(rule, seg, idx)}
      </div>
    </div>`;
}

// ── Segment definition (radio buttons, mirrors current Kameleoon UI) ──
function segmentBlockHtml(rule, seg, idx) {
  const m = seg.mode;
  const otherHasAI = rule.segments.some((x, i) => i !== idx && segmentHasAI(x));
  return `
    <div class="def-block">
      <div class="def-head">
        <span class="def-title">Segment</span>
        <span class="def-link">${esc(segSummary(seg))}</span>
      </div>
      <div class="def-q">Who should see the personalization?</div>

      <label class="radio-row">
        <input type="radio" name="seg-${idx}" data-seg-mode="all" data-seg-idx="${idx}" ${m === 'all' ? 'checked' : ''}>
        <span>All Visitors</span>
      </label>

      <label class="radio-row">
        <input type="radio" name="seg-${idx}" data-seg-mode="specific" data-seg-idx="${idx}" ${m === 'specific' ? 'checked' : ''}>
        <span>Specific segment</span>
      </label>
      ${m === 'specific' ? `<div class="radio-sub">${ksSelectHtml(seg, idx, otherHasAI)}</div>` : ''}

      <label class="radio-row disabled">
        <input type="radio" name="seg-${idx}" data-seg-mode="visitors" data-seg-idx="${idx}" disabled ${m === 'visitors' ? 'checked' : ''}>
        <span>Specific visitors</span>
        <span class="material-icons rr-help">help_outline</span>
      </label>
      <div class="radio-sub"><span class="inactive-note">Quick builder (inactive for this prototype).</span></div>
    </div>`;
}

// ── Shared trigger definition (radio buttons + page hierarchy) ──
// One trigger for the whole rule — governs when both segments are evaluated.
function triggerBlockHtml(rule) {
  const trg = rule.trigger;
  const m = trg.mode;
  const sub = trg.page.sub;
  return `
    <div class="def-block shared-trigger">
      <div class="def-head">
        <span class="def-title">Trigger</span>
        <span class="def-link">${esc(trgSummary(rule))}</span>
      </div>
      <div class="def-q">When should the two segments be evaluated and the content shown?</div>

      <label class="radio-row">
        <input type="radio" name="trg-shared" data-trg-mode="page" ${m === 'page' ? 'checked' : ''}>
        <span>When a web page is reached</span>
      </label>
      ${m === 'page' ? `
        <div class="radio-sub">
          <label class="radio-row">
            <input type="radio" name="trgpage-shared" data-trg-page="specific" ${sub === 'specific' ? 'checked' : ''}>
            <span>A specific page</span>
            <span class="material-icons rr-help">help_outline</span>
          </label>
          ${sub === 'specific' ? `<input type="text" class="input-field" data-trg-url value="${esc(trg.page.url)}">` : ''}
          <label class="radio-row">
            <input type="radio" name="trgpage-shared" data-trg-page="fragment" ${sub === 'fragment' ? 'checked' : ''}>
            <span>The URLs containing a specific fragment</span>
          </label>
          ${sub === 'fragment' ? `<input type="text" class="input-field" data-trg-fragment placeholder="e.g. /pricing" value="${esc(trg.page.fragment || '')}">` : ''}
          <label class="radio-row">
            <input type="radio" name="trgpage-shared" data-trg-page="site" ${sub === 'site' ? 'checked' : ''}>
            <span>The entire site</span>
            <span class="material-icons rr-help" title="Caution: This will target all pages within the project scope.">help_outline</span>
          </label>
        </div>` : ''}

      <label class="radio-row">
        <input type="radio" name="trg-shared" data-trg-mode="specific" ${m === 'specific' ? 'checked' : ''}>
        <span>When a specific trigger occurs</span>
      </label>
      ${m === 'specific' ? `<div class="radio-sub">${triggerSelectHtml(rule)}</div>` : ''}

      <label class="radio-row disabled">
        <input type="radio" name="trg-shared" data-trg-mode="combination" disabled ${m === 'combination' ? 'checked' : ''}>
        <span>When a combination of triggers occurs</span>
        <span class="material-icons rr-help">help_outline</span>
      </label>
      <div class="radio-sub"><span class="inactive-note">Quick builder (inactive for this prototype).</span></div>
    </div>`;
}

// ── Segment dropdown (so AI segments can show a learning-state badge) ──
function ksSelectHtml(seg, idx, disableAI) {
  const curId = seg.id;
  const cur = SEGMENTS.find(o => o.id === curId);
  const label = cur
    ? `<span class="ks-select-label">${esc(cur.name)}${cur.ai ? ' ' + aiStateBadge(cur.aiState) : ''}</span>`
    : `<span class="ks-select-label"><span class="ph">Select a segment…</span></span>`;

  const rows = SEGMENTS.map(o => {
    const disabled = o.ai && disableAI;
    return `
      <button class="ks-opt ${o.id === curId ? 'selected' : ''} ${disabled ? 'disabled' : ''}"
              data-ks-opt="${o.id}" data-seg-idx="${idx}" ${disabled ? 'data-disabled="1"' : ''}>
        <span>${esc(o.name)}</span>
        ${o.ai ? aiStateBadge(o.aiState) : ''}
      </button>`;
  }).join('');

  const note = disableAI
    ? `<div class="ks-menu-note">AI segments are disabled here — the other segment already includes AI Targeting.</div>`
    : '';

  return `
    <div class="ks-select">
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

// ── Shared trigger dropdown (one per rule, no AI concerns) ──
function triggerSelectHtml(rule) {
  const curId = rule.trigger.id;
  const cur = TRIGGERS.find(o => o.id === curId);
  const label = cur
    ? `<span class="ks-select-label">${esc(cur.name)}</span>`
    : `<span class="ks-select-label"><span class="ph">Select a trigger…</span></span>`;

  const rows = TRIGGERS.map(o => `
      <button class="ks-opt ${o.id === curId ? 'selected' : ''}" data-ks-trg-opt="${o.id}">
        <span>${esc(o.name)}</span>
      </button>`).join('');

  return `
    <div class="ks-select" data-kind="trg">
      <button class="ks-select-btn" data-ks-toggle>
        ${label}
        <span class="material-icons">expand_more</span>
      </button>
      <div class="ks-select-menu hidden">
        ${rows}
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

  // segment mode radios
  els.formBody.querySelectorAll('[data-seg-mode]').forEach(r => {
    r.addEventListener('change', (e) => {
      const idx = parseInt(e.target.dataset.segIdx, 10);
      rule.segments[idx].mode = e.target.dataset.segMode;
      if (rule.segments[idx].mode === 'specific' && !rule.segments[idx].id) {
        rule.segments[idx].id = firstSelectableSegment(rule, idx);
      }
      rerender(); markDirty();
    });
  });

  // shared trigger mode radios
  els.formBody.querySelectorAll('[data-trg-mode]').forEach(r => {
    r.addEventListener('change', (e) => {
      rule.trigger.mode = e.target.dataset.trgMode;
      if (rule.trigger.mode === 'specific' && !rule.trigger.id) rule.trigger.id = TRIGGERS[0].id;
      rerender(); markDirty();
    });
  });

  // shared trigger page-sub radios
  els.formBody.querySelectorAll('[data-trg-page]').forEach(r => {
    r.addEventListener('change', (e) => {
      rule.trigger.page.sub = e.target.dataset.trgPage;
      rerender(); markDirty();
    });
  });

  // url input (no rerender — keep focus)
  els.formBody.querySelectorAll('[data-trg-url]').forEach(inp => {
    inp.addEventListener('input', (e) => {
      rule.trigger.page.url = e.target.value; markDirty();
    });
  });

  // fragment input (no rerender — keep focus)
  els.formBody.querySelectorAll('[data-trg-fragment]').forEach(inp => {
    inp.addEventListener('input', (e) => {
      rule.trigger.page.fragment = e.target.value; markDirty();
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
  // segment dropdown: option click
  els.formBody.querySelectorAll('[data-ks-opt]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (btn.dataset.disabled) { flash('Only one segment can include AI Targeting.'); return; }
      const idx = parseInt(btn.dataset.segIdx, 10);
      rule.segments[idx].id = btn.dataset.ksOpt;
      rerender(); markDirty();
    });
  });
  // shared trigger dropdown: option click
  els.formBody.querySelectorAll('[data-ks-trg-opt]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      rule.trigger.id = btn.dataset.ksTrgOpt;
      rerender(); markDirty();
    });
  });
}

function firstSelectableSegment(rule, idx) {
  const otherHasAI = rule.segments.some((x, i) => i !== idx && segmentHasAI(x));
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
      segments: [
        { mode: 'specific', id: 's2' },   // defaults to an AI segment
        { mode: 'all', id: null }
      ],
      trigger: newTrigger(),
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
