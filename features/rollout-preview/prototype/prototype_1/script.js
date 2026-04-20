document.addEventListener('DOMContentLoaded', () => {

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

  // ── Mode selector ──
  let selectedMode = 'live';
  document.querySelectorAll('.mode-option').forEach(opt => {
    opt.addEventListener('click', () => {
      document.querySelectorAll('.mode-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedMode = opt.dataset.mode;
      document.getElementById('draftHint').classList.toggle('hidden', selectedMode !== 'draft');
      resetSimulation();
    });
  });

  // ── Rules data ──
  const getRulesData = (mode) => [
    {
      id: 'rule-1', num: 1,
      name: 'Loyal customers target',
      type: 'Targeted',
      check: (ctx) => ctx.loyal,
      exposure: 100,
      variation: 'loyal banner',
      skipReason: () => 'Loyal User = OFF',
    },
    {
      id: 'rule-2', num: 2,
      name: 'New customers target',
      type: 'Targeted',
      check: (ctx) => ctx.newUser,
      exposure: 69,
      variation: 'new banner',
      skipReason: () => 'New User = OFF',
    },
    {
      id: 'rule-3', num: 3,
      name: 'Targeted Delivery — England',
      type: 'Targeted',
      check: (ctx) => ctx.country === 'England' || ctx.country === 'UK',
      exposure: 50,
      variation: 'fish and chips banner',
      skipReason: (ctx) => `Country "${ctx.country}" ≠ England / UK`,
    },
    {
      id: 'rule-4', num: 4,
      name: 'Birds',
      type: 'Targeted',
      // Draft: rule disabled — simulates a pending config change
      check: (ctx) => mode === 'draft' ? false : ctx.birds,
      exposure: 100,
      variation: 'seed banner',
      skipReason: () => mode === 'draft' ? 'Rule disabled in draft' : 'Likes Birds = OFF',
    },
    {
      id: 'rule-5', num: 5,
      name: 'Everyone 34%',
      type: 'Rollout',
      check: () => true,
      // Draft: exposure raised to 100%
      exposure: mode === 'draft' ? 100 : 34,
      variation: 'general banner',
      skipReason: () => '',
    },
  ];

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

  // ── Reset UI ──
  function resetSimulation() {
    simResult.classList.add('hidden');
    resultCardBg.className = 'result-card';
    document.getElementById('draftBadge').classList.add('hidden');
    document.getElementById('draftComparison').classList.add('hidden');
    document.getElementById('impactNotice').classList.add('hidden');
    document.getElementById('draftMatchNotice').classList.add('hidden');
    document.getElementById('traceList').innerHTML = '';
    document.getElementById('traceFooter').classList.add('hidden');
    document.getElementById('traceFooter').textContent = '';

    document.querySelectorAll('.rule-card').forEach(el => {
      el.classList.remove('is-winner', 'is-dimmed');
      el.querySelectorAll('.winner-badge').forEach(n => n.remove());
    });
  }

  // ── Panel open / close ──
  openSimBtn.addEventListener('click', () => {
    defaultConfigView.classList.add('hidden');
    simulatorView.classList.remove('hidden');
  });

  closeSimBtn.addEventListener('click', () => {
    simulatorView.classList.add('hidden');
    defaultConfigView.classList.remove('hidden');
    resetSimulation();
  });

  // ── Main simulation handler ──
  runSimBtn.addEventListener('click', () => {
    resetSimulation();

    // Determinism: generate VID if blank and write it back so re-runs are identical
    let vid = simVisitorIdInput.value.trim();
    if (!vid) {
      vid = 'anon_' + Math.floor(Math.random() * 99999);
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

    let liveWinner = null;
    if (selectedMode === 'draft') {
      ({ winner: liveWinner } = runRules(getRulesData('live'), context, vid));
    }

    updateRuleCards(ruleResults, currentRules.length);
    populateTrace(ruleResults, context, currentRules.length);
    populateResult(winner, selectedMode, liveWinner);

    simResult.classList.remove('hidden');
  });

  // ── Left panel: visual-only feedback, no text ──
  // - Evaluated rules (skipped or fallthrough): default card state
  // - Not-reached rules (after winner): dimmed
  // - Winner: green border + WINNER badge
  function updateRuleCards(ruleResults, totalRules) {
    const evaluatedIds = new Set(ruleResults.map(r => r.rule.id));

    document.querySelectorAll('.rule-card').forEach(el => {
      if (!evaluatedIds.has(el.id)) {
        el.classList.add('is-dimmed');
      }
    });

    const winnerResult = ruleResults.find(r => r.status === 'matched');
    if (winnerResult) {
      const ruleEl = document.getElementById(winnerResult.rule.id);
      if (ruleEl) {
        ruleEl.classList.add('is-winner');
        const titleRow = ruleEl.querySelector('.rule-title-row');
        const badge = document.createElement('span');
        badge.className = 'winner-badge';
        badge.innerHTML = '<span class="material-icons" style="font-size:11px">stars</span> WINNER';
        titleRow.appendChild(badge);
        ruleEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
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
          <span class="br-score-label ${matched ? 'in' : 'out'}">Score: ${score}</span>
          <span class="br-threshold-label">Threshold: ${threshold}%</span>
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
        detailHTML = `<span class="trace-reason">Targeted but missed ${rule.exposure}% bucketing</span>
          ${buildBucketRuler(score, rule.exposure)}`;
      } else {
        detailHTML = `<span class="trace-reason">Score within ${rule.exposure}% exposure window</span>
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
      footerEl.textContent = `Evaluation stopped at rule ${winner.rule.num} — ${notReached} rule${notReached > 1 ? 's' : ''} not reached`;
      footerEl.classList.remove('hidden');
    }
  }

  // ── Result card ──
  function populateResult(winner, mode, liveWinner) {
    if (winner) {
      resultCardBg.className = 'result-card success';
      document.getElementById('resMatchedRule').textContent = winner.rule.name;
      document.getElementById('resRuleType').textContent    = winner.rule.type;
      const varEl = document.getElementById('resVariation');
      varEl.textContent = winner.rule.variation;
      varEl.style.color = 'var(--success-green)';
    } else {
      resultCardBg.className = 'result-card failed';
      document.getElementById('resMatchedRule').textContent = 'No rule matched';
      document.getElementById('resRuleType').textContent    = '—';
      const varEl = document.getElementById('resVariation');
      varEl.textContent = 'Off (default fallback)';
      varEl.style.color = 'var(--danger-red)';
    }

    if (mode === 'draft') {
      document.getElementById('draftBadge').classList.remove('hidden');
      document.getElementById('draftComparison').classList.remove('hidden');

      const differs = liveWinner?.rule?.id !== winner?.rule?.id;
      document.getElementById('impactNotice').classList.toggle('hidden', !differs);
      document.getElementById('draftMatchNotice').classList.toggle('hidden', differs);
    }
  }

});
