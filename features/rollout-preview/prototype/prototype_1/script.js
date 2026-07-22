document.addEventListener('DOMContentLoaded', () => {

  // Render Lucide icons present in the initial markup
  if (window.lucide) lucide.createIcons();

  // ── DOM refs ──
  const openSimBtn        = document.getElementById('openSimulatorBtn');
  const closeSimBtn       = document.getElementById('closeSimulator');
  const defaultConfigView = document.getElementById('defaultConfigView');
  const simulatorView     = document.getElementById('simulatorView');
  const runSimBtn         = document.getElementById('runSimBtn');
  const simResult         = document.getElementById('simResult');
  const resultCardBg      = document.getElementById('resultCardBg');
  const simVisitorIdInput = document.getElementById('simVisitorId');
  const simPreset         = document.getElementById('simPreset');
  const simCountry        = document.getElementById('simCountry');
  const fallbackRow       = document.getElementById('fallbackRow');
  const simToggles = {
    loyal:  document.getElementById('simLoyal'),
    new:    document.getElementById('simNew'),
    birds:  document.getElementById('simBirds'),
  };

  // ── Profile Presets ──
  const PRESETS = {
    uk_loyal: { visitorId: 'u_uk_loyal_001', country: 'England', loyal: true,  newUser: false, birds: false },
    new_user: { visitorId: 'u_new_fr_002',   country: 'France',  loyal: false, newUser: true,  birds: false },
    bird_fan: { visitorId: 'u_bird_042',     country: 'US',      loyal: false, newUser: false, birds: true  },
    us_anon:  { visitorId: 'u_anon_9876',    country: 'US',      loyal: false, newUser: false, birds: false },
  };

  simPreset.addEventListener('change', () => {
    const preset = PRESETS[simPreset.value];
    if (!preset) return;
    simVisitorIdInput.value = preset.visitorId;
    simCountry.value = preset.country;
    setToggle(simToggles.loyal, preset.loyal);
    setToggle(simToggles.new, preset.newUser);
    setToggle(simToggles.birds, preset.birds);
    resetSimulation();
  });

  // Clear preset label when any input is manually changed
  simCountry.addEventListener('change', () => { simPreset.value = ''; });
  Object.values(simToggles).forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('on');
      toggle.classList.toggle('off');
      simPreset.value = '';
    });
  });

  function setToggle(el, value) {
    el.classList.toggle('on', value);
    el.classList.toggle('off', !value);
  }

  // ── Base rules (Live config) ──
  const BASE_RULES = [
    { id: 'rule-1', num: 1, name: 'Loyal customers target', type: 'Targeted',
      check: (ctx) => ctx.loyal, exposure: 100, variation: 'loyal banner',
      skipReason: () => 'Loyal User = OFF' },
    { id: 'rule-2', num: 2, name: 'New customers target', type: 'Targeted',
      check: (ctx) => ctx.newUser, exposure: 69, variation: 'new banner',
      skipReason: () => 'New User = OFF' },
    { id: 'rule-3', num: 3, name: 'Targeted Delivery — England', type: 'Targeted',
      check: (ctx) => ctx.country === 'England' || ctx.country === 'UK', exposure: 50, variation: 'fish and chips banner',
      skipReason: (ctx) => `Country “${ctx.country}” ≠ England / UK` },
    { id: 'rule-4', num: 4, name: 'Birds', type: 'Targeted',
      check: (ctx) => ctx.birds, exposure: 100, variation: 'seed banner',
      skipReason: () => 'Likes Birds = OFF' },
    { id: 'rule-5', num: 5, name: 'Everyone 34%', type: 'Rollout',
      check: () => true, exposure: 34, variation: 'general banner',
      skipReason: () => '' },
  ];

  // ── Draft deltas — the single source of truth for "what changed in draft" ──
  // Both the evaluation engine (getRulesData) and the left rules list read from this,
  // so the panel can never contradict itself.
  const DRAFT_DELTAS = {
    'rule-4': { disabled: true, note: 'Rule disabled in draft' },
    'rule-5': { exposure: 100, chip: '34% → 100%' },
  };

  // Apply draft deltas on top of the base rules for the given mode
  function getRulesData(mode) {
    return BASE_RULES.map(rule => {
      const d = mode === 'draft' ? DRAFT_DELTAS[rule.id] : null;
      if (!d) return rule;
      return {
        ...rule,
        exposure: d.exposure != null ? d.exposure : rule.exposure,
        check: d.disabled ? () => false : rule.check,
        skipReason: d.disabled ? () => d.note : rule.skipReason,
        draftDisabled: !!d.disabled,
      };
    });
  }

  // ── Reflect the active mode's config in the left rules list ──
  // Live = base config. Draft = show disabled rules struck through and changed
  // exposures inline, with a "changed in draft" chip. Prevents the list (Live)
  // from silently disagreeing with the trace (Draft).
  function applyModeToList(mode) {
    document.querySelectorAll('.rule-card').forEach(card => {
      // reset to base
      card.classList.remove('is-draft-disabled');
      card.querySelectorAll('.draft-chip').forEach(n => n.remove());
      const expEl = card.querySelector('.rule-exposure');
      if (expEl) expEl.textContent = expEl.dataset.base;
      const badge = card.querySelector('.badge');
      if (badge) { badge.textContent = 'Active'; badge.className = 'badge badge-active'; }

      if (mode !== 'draft') return;
      const d = DRAFT_DELTAS[card.id];
      if (!d) return;

      if (d.disabled) {
        // dashed card + strikethrough + "Disabled" badge already signal the draft change
        card.classList.add('is-draft-disabled');
        if (badge) { badge.textContent = 'Disabled'; badge.className = 'badge badge-disabled'; }
      } else if (d.exposure != null && expEl) {
        expEl.textContent = d.exposure + '%';
      }
      // Draft-change chip only for value-level changes (disabled has its own treatment)
      if (d.chip && !d.disabled) addDraftChip(card.querySelector('.rule-title-row'), d.chip);
    });
    if (window.lucide) lucide.createIcons();
  }

  function addDraftChip(titleRow, text) {
    if (!titleRow) return;
    const chip = document.createElement('span');
    chip.className = 'draft-chip';
    chip.innerHTML = `<i data-lucide="pencil" class="ic-12"></i> ${text}`;
    titleRow.appendChild(chip);
  }

  // ── Mode selector ──
  let selectedMode = 'live';
  document.querySelectorAll('.mode-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.mode-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedMode = opt.dataset.mode;
      document.getElementById('draftHint').classList.toggle('hidden', selectedMode !== 'draft');
      resetSimulation();
      applyModeToList(selectedMode);
    });
  });

  // ── Deterministic bucket score ──
  function getBucketScore(visitorId, ruleId) {
    const str = visitorId + ruleId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }

  // ── Evaluation engine ──
  // Evaluates top-to-bottom, stops at first match.
  // Returns only evaluated rules (ruleResults) — not-reached rules are excluded.
  function runRules(rules, context, visitorId) {
    const ruleResults = [];
    for (const rule of rules) {
      if (rule.check(context)) {
        const score = getBucketScore(visitorId, rule.id);
        const matched = score < rule.exposure;
        ruleResults.push({ rule, status: matched ? 'matched' : 'fallthrough', score });
        if (matched) break;
      } else {
        ruleResults.push({ rule, status: 'skipped', score: null });
      }
    }
    const winner = ruleResults.find(r => r.status === 'matched') || null;
    return { ruleResults, winner };
  }

  // Variation a winner (or lack thereof) resolves to
  function outcomeVariation(winner) {
    return winner ? winner.rule.variation : 'Off (default fallback)';
  }

  // ── Reset UI ──
  function resetSimulation() {
    simResult.classList.add('hidden');
    resultCardBg.className = 'result-card';
    document.getElementById('draftBadge').classList.add('hidden');
    document.getElementById('draftComparisonSection').classList.add('hidden');
    document.getElementById('traceList').innerHTML = '';
    document.getElementById('traceFooter').classList.add('hidden');
    document.getElementById('traceFooter').innerHTML = '';

    fallbackRow.classList.remove('is-fallback-active');

    document.querySelectorAll('.rule-card').forEach(el => {
      el.classList.remove('is-winner', 'is-dimmed');
      el.querySelectorAll('.winner-badge').forEach(n => n.remove());
    });
  }

  // ── Panel open / close ──
  openSimBtn.addEventListener('click', () => {
    defaultConfigView.classList.add('hidden');
    simulatorView.classList.remove('hidden');
    applyModeToList(selectedMode);
  });

  closeSimBtn.addEventListener('click', () => {
    simulatorView.classList.add('hidden');
    defaultConfigView.classList.remove('hidden');
    resetSimulation();
    applyModeToList('live'); // restore the live config in the list
  });

  // ── Main simulation handler ──
  runSimBtn.addEventListener('click', () => {
    resetSimulation();

    // Determinism: generate VID if blank and write it back so re-runs are identical
    let vid = simVisitorIdInput.value.trim();
    if (!vid) {
      vid = 'u_anon_' + Math.floor(Math.random() * 99999);
      simVisitorIdInput.value = vid;
    }

    const context = {
      country: simCountry.value,
      loyal:   simToggles.loyal.classList.contains('on'),
      newUser: simToggles.new.classList.contains('on'),
      birds:   simToggles.birds.classList.contains('on'),
    };

    const currentRules = getRulesData(selectedMode);
    const { ruleResults, winner } = runRules(currentRules, context, vid);

    // For draft, also evaluate the live config for this same visitor
    let liveWinner = null;
    if (selectedMode === 'draft') {
      ({ winner: liveWinner } = runRules(getRulesData('live'), context, vid));
    }

    updateRuleCards(ruleResults, winner);
    populateTrace(ruleResults, context, currentRules.length);
    populateResult(winner, selectedMode, liveWinner);

    simResult.classList.remove('hidden');
    if (window.lucide) lucide.createIcons();
  });

  // ── Left panel: visual-only feedback ──
  // - Evaluated rules (skipped / fallthrough): default state
  // - Not-reached rules (after winner): dimmed
  // - Winner: green border + WINNER badge
  // - No winner: highlight the "everyone else → Off" fallback row
  function updateRuleCards(ruleResults, winner) {
    const evaluatedIds = new Set(ruleResults.map(r => r.rule.id));

    document.querySelectorAll('.rule-card').forEach(el => {
      if (!evaluatedIds.has(el.id)) el.classList.add('is-dimmed');
    });

    if (winner) {
      const ruleEl = document.getElementById(winner.rule.id);
      if (ruleEl) {
        ruleEl.classList.add('is-winner');
        const titleRow = ruleEl.querySelector('.rule-title-row');
        const badge = document.createElement('span');
        badge.className = 'winner-badge';
        badge.innerHTML = '<i data-lucide="check" class="ic-12"></i> Winner';
        titleRow.appendChild(badge);
        ruleEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    } else {
      // Nothing matched → the visitor falls through to the default
      fallbackRow.classList.add('is-fallback-active');
    }
  }

  // ── Bucket Ruler HTML ──
  function buildBucketRuler(score, threshold) {
    const matched = score < threshold;
    const pos = Math.min(97, score);
    return `
      <div class="bucket-ruler">
        <div class="br-track">
          <div class="br-exposure" style="width:${threshold}%"></div>
          <div class="br-score ${matched ? 'in' : 'out'}" style="left:${pos}%"></div>
        </div>
        <div class="br-labels">
          <span class="br-score-label ${matched ? 'in' : 'out'}">Score ${score}</span>
          <span class="br-threshold-label">Threshold ${threshold}%</span>
        </div>
      </div>`;
  }

  // ── Evaluation Trace ──
  function populateTrace(ruleResults, context, totalRules) {
    const labelMap = { matched: 'MATCHED', fallthrough: 'MISSED', skipped: 'SKIPPED' };

    document.getElementById('traceList').innerHTML = ruleResults.map(({ rule, status, score }) => {
      let detailHTML = '';
      if (status === 'skipped') {
        const reason = rule.skipReason ? rule.skipReason(context) : 'Attribute mismatch';
        detailHTML = `<span class="trace-reason">${reason}</span>`;
      } else if (status === 'fallthrough') {
        detailHTML = `<span class="trace-reason">Targeting matched, but missed the ${rule.exposure}% bucket</span>
          ${buildBucketRuler(score, rule.exposure)}`;
      } else if (rule.exposure >= 100) {
        // 100% exposure always matches — a 0-100 ruler would be noise
        detailHTML = `<span class="always-in"><i data-lucide="circle-check" class="ic-14"></i> 100% exposure — always served</span>`;
      } else {
        detailHTML = `<span class="trace-reason">Bucket score is within the ${rule.exposure}% exposure window</span>
          ${buildBucketRuler(score, rule.exposure)}`;
      }

      return `
        <div class="trace-row trace-${status}">
          <div class="trace-row-main">
            <span class="trace-index">${rule.num}</span>
            <span class="trace-name">${rule.name}</span>
            <span class="trace-badge ${status}">${labelMap[status]}</span>
          </div>
          <div class="trace-row-detail">${detailHTML}</div>
        </div>`;
    }).join('');

    // Evaluation boundary — how many rules were not reached
    const notReached = totalRules - ruleResults.length;
    if (notReached > 0) {
      const winner = ruleResults.find(r => r.status === 'matched');
      const footerEl = document.getElementById('traceFooter');
      footerEl.innerHTML = `<i data-lucide="circle-slash" class="ic-14"></i> Evaluation stopped at rule ${winner.rule.num} — ${notReached} rule${notReached > 1 ? 's' : ''} not reached`;
      footerEl.classList.remove('hidden');
    }
  }

  // ── Result card + Draft vs Live comparison ──
  function populateResult(winner, mode, liveWinner) {
    const variation = outcomeVariation(winner);

    if (winner) {
      resultCardBg.className = 'result-card success';
      document.getElementById('resMatchedRule').textContent = winner.rule.name;
      document.getElementById('resRuleType').textContent    = winner.rule.type;
      document.getElementById('resVariation').textContent   = variation;
    } else {
      resultCardBg.className = 'result-card failed';
      document.getElementById('resMatchedRule').textContent = 'No rule matched';
      document.getElementById('resRuleType').textContent    = '—';
      document.getElementById('resVariation').textContent   = variation;
    }

    if (mode !== 'draft') return;

    // Draft: neutral frame + DRAFT ribbon; the comparison block carries the verdict
    resultCardBg.className = winner ? 'result-card draft' : 'result-card failed';
    document.getElementById('draftBadge').classList.remove('hidden');

    const liveVariation = outcomeVariation(liveWinner);
    const differs = liveVariation !== variation;

    const section    = document.getElementById('draftComparisonSection');
    const comparison = document.getElementById('draftComparison');
    const verdict    = document.getElementById('cmpVerdict');
    const verdictTxt = document.getElementById('cmpVerdictText');
    const verdictIcn = document.getElementById('cmpVerdictIcon');
    const liveCol    = document.getElementById('cmpLiveCol');
    const draftCol   = document.getElementById('cmpDraftCol');

    document.getElementById('cmpLiveVal').textContent  = liveVariation;
    document.getElementById('cmpDraftVal').textContent = variation;
    liveCol.classList.toggle('is-off', !liveWinner);
    draftCol.classList.toggle('is-off', !winner);

    comparison.classList.toggle('differ', differs);
    verdict.className = 'cmp-verdict ' + (differs ? 'differ' : 'same');
    verdictIcn.setAttribute('data-lucide', differs ? 'triangle-alert' : 'circle-check');
    verdictTxt.textContent = differs
      ? 'Draft would change what this visitor sees'
      : 'Draft matches Live for this visitor';

    section.classList.remove('hidden');
  }

});
