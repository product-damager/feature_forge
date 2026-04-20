document.addEventListener('DOMContentLoaded', () => {

  const openSimBtn = document.getElementById('openSimulatorBtn');
  const closeSimBtn = document.getElementById('closeSimulator');

  const defaultConfigView = document.getElementById('defaultConfigView');
  const simulatorView = document.getElementById('simulatorView');

  const runSimBtn = document.getElementById('runSimBtn');
  const simResult = document.getElementById('simResult');
  const resultCardBg = document.getElementById('resultCardBg');

  const simVisitorIdInput = document.getElementById('simVisitorId');
  
  // Specific Controls
  const simCountry = document.getElementById('simCountry');
  const simToggles = {
    loyal: document.getElementById('simLoyal'),
    new: document.getElementById('simNew'),
    birds: document.getElementById('simBirds')
  };

  // DOM Elements for Result
  const resTargetText = document.getElementById('targetText');
  const resTargetIcon = document.getElementById('targetIcon');
  const resBucketText = document.getElementById('bucketText');
  const resBucketIcon = document.getElementById('bucketIcon');
  const resVariation = document.getElementById('resVariation');

  // --- Toggle Logic for Simulator Switches ---
  Object.values(simToggles).forEach(toggle => {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('on');
      toggle.classList.toggle('off');
    });
  });

  // --- New Logic for Modes ---
  let selectedMode = 'live';
  const modeOptions = document.querySelectorAll('.mode-option');
  
  modeOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      modeOptions.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      selectedMode = opt.dataset.mode;
      resetSimulation();
    });
  });

  // --- Rule Definitions with DRAFT support ---
  const getRulesData = (mode) => {
    const rules = [
      {
        id: 'rule-1',
        name: 'Loyal customers target',
        check: (ctx) => ctx.loyal,
        exposure: 100,
        variation: 'loyal banner',
        targetDesc: 'Loyal User = ON'
      },
      {
        id: 'rule-2',
        name: 'New customers target',
        check: (ctx) => ctx.new,
        exposure: 69,
        variation: 'new banner',
        targetDesc: 'New User = ON'
      },
      {
        id: 'rule-3',
        name: 'Targeted Delivery (England 50%)',
        check: (ctx) => ctx.country === 'England' || ctx.country === 'UK',
        exposure: 50,
        variation: 'fish and chips banner',
        targetDesc: 'Country is England/UK'
      },
      {
        id: 'rule-4',
        name: 'Birds',
        check: (ctx) => mode === 'draft' ? false : ctx.birds, // DISABLED IN DRAFT
        exposure: 100,
        variation: 'seed banner',
        targetDesc: 'Likes Birds = ON',
        draftNote: mode === 'draft' ? 'Rule disabled in draft' : null
      },
      {
        id: 'rule-5',
        name: 'Everyone 34%',
        check: () => true,
        exposure: mode === 'draft' ? 100 : 34, // 100% IN DRAFT
        variation: 'general banner',
        targetDesc: 'Fallback for all users',
        draftNote: mode === 'draft' ? 'Exposure increased to 100%' : null
      }
    ];
    return rules;
  };

  // --- Deterministic Hashing ---
  function getBucketScore(visitorId, ruleId) {
    const str = visitorId + ruleId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash) % 100;
  }

  // --- Reset UI ---
  function resetSimulation() {
    simResult.classList.add('hidden');
    resultCardBg.className = 'result-card';
    document.getElementById('impactNotice').classList.add('hidden');
    document.getElementById('draftBadge').classList.add('hidden');
    
    document.querySelectorAll('.rule-card').forEach(ruleEl => {
      ruleEl.classList.remove('is-simulated', 'is-dimmed', 'is-fallthrough', 'is-winner');
      ruleEl.querySelectorAll('.sim-annotation, .winner-badge, .skip-reason').forEach(a => a.remove());
    });
  }

  // --- Panel Toggle ---
  openSimBtn.addEventListener('click', () => {
    defaultConfigView.classList.add('hidden');
    simulatorView.classList.remove('hidden');
  });

  closeSimBtn.addEventListener('click', () => {
    simulatorView.classList.add('hidden');
    defaultConfigView.classList.remove('hidden');
    resetSimulation();
  });

  // --- MAIN SIMULATION ENGINE ---
  runSimBtn.addEventListener('click', () => {
    resetSimulation();

    const vid = simVisitorIdInput.value.trim() || 'anon_user_' + Math.floor(Math.random() * 1000);
    const context = {
      country: simCountry.value,
      loyal: simToggles.loyal.classList.contains('on'),
      new: simToggles.new.classList.contains('on'),
      birds: simToggles.birds.classList.contains('on')
    };

    // RUN BOTH for comparison
    const liveRules = getRulesData('live');
    const draftRules = getRulesData('draft');

    const runRules = (rules) => {
      let winningRuleMatch = null;
      let fallthroughRules = [];
      let skippedRules = [];

      for (const rule of rules) {
        if (rule.check(context)) {
          const score = getBucketScore(vid, rule.id);
          const isBucketed = score < rule.exposure;

          if (isBucketed) {
            winningRuleMatch = { rule, score };
            break; 
          } else {
            fallthroughRules.push({ rule, score });
          }
        } else {
          skippedRules.push(rule);
        }
      }
      return { winningRuleMatch, fallthroughRules, skippedRules };
    };

    const liveRes = runRules(liveRules);
    const draftRes = runRules(draftRules);

    const winner = selectedMode === 'live' ? liveRes : draftRes;
    const { winningRuleMatch, fallthroughRules, skippedRules } = winner;

    if (selectedMode === 'draft') {
      document.getElementById('draftBadge').classList.remove('hidden');
      if (liveRes.winningRuleMatch?.rule.id !== draftRes.winningRuleMatch?.rule.id) {
        document.getElementById('impactNotice').classList.remove('hidden');
      }
    }

    // --- Update LEFT LIST Visuals ---
    document.querySelectorAll('.rule-card').forEach(ruleEl => {
      const isWinner = winningRuleMatch && winningRuleMatch.rule.id === ruleEl.id;
      const ftMatch = fallthroughRules.find(f => f.rule.id === ruleEl.id);
      const isSkipped = skippedRules.find(r => r.id === ruleEl.id);

      if (isWinner) {
        ruleEl.classList.add('is-winner');
        const titleRow = ruleEl.querySelector('.rule-title-row');
        const badge = document.createElement('span');
        badge.className = 'winner-badge';
        badge.innerHTML = '<span class="material-icons" style="font-size:12px">stars</span> WINNER';
        titleRow.appendChild(badge);
        
        addAnnotation(ruleEl, 'success', `✓ Targeted & Bucketed (Score: ${winningRuleMatch.score} < ${winningRuleMatch.rule.exposure}%)`);
        ruleEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (ftMatch) {
        ruleEl.classList.add('is-fallthrough');
        addAnnotation(ruleEl, 'fallthrough', `Targeted but missed ${ftMatch.rule.exposure}% exposure (Score: ${ftMatch.score}). Falling through ↓`);
      } else if (isSkipped) {
        ruleEl.classList.add('is-dimmed');
        
        // Custom reasons based on the rule
        let reasonText = "Attribute mismatch";
        const ruleData = winner.skippedRules.find(r => r.id === ruleEl.id);
        if (ruleData.id === 'rule-1') reasonText = "Loyal User = OFF";
        if (ruleData.id === 'rule-2') reasonText = "New User = OFF";
        if (ruleData.id === 'rule-3') reasonText = `Country "${context.country}" is not England/UK`;
        if (ruleData.id === 'rule-4') reasonText = ruleData.draftNote || "Likes Birds = OFF";
        
        addAnnotation(ruleEl, 'skipped', `Skipped: ${reasonText}`);
      }
    });

    // --- Update RESULT CARD ---
    simResult.classList.remove('hidden');
    const ftCount = fallthroughRules.length;

    if (winningRuleMatch) {
      resultCardBg.className = 'result-card success';
      resTargetIcon.textContent = 'check_circle';
      resTargetIcon.className = 'material-icons step-icon success';
      resTargetText.innerHTML = `<strong>Targeted:</strong> ${winningRuleMatch.rule.name}${ftCount > 0 ? ` <span class="fallthrough-badge">after ${ftCount} fall-through${ftCount > 1 ? 's' : ''}</span>` : ''}`;

      resBucketIcon.textContent = 'check_circle';
      resBucketIcon.className = 'material-icons step-icon success';
      resBucketText.innerHTML = `<strong>Bucketed:</strong> Score <code>${winningRuleMatch.score}</code> matched exposure <strong>${winningRuleMatch.rule.exposure}%</strong>`;
      
      resVariation.textContent = winningRuleMatch.rule.variation;
      resVariation.style.color = 'var(--success-green)';
    } else {
      resultCardBg.className = 'result-card failed';
      resTargetIcon.textContent = ftCount > 0 ? 'warning' : 'cancel';
      resTargetIcon.className = `material-icons step-icon ${ftCount > 0 ? 'fallthrough-icon' : 'failed'}`;
      resTargetText.innerHTML = ftCount > 0 
        ? `<strong>Targeted</strong> ${ftCount} rule(s) but missed all bucketing exposure`
        : `<strong>No rules matched</strong> targeting criteria`;

      resBucketIcon.textContent = 'cancel';
      resBucketIcon.className = 'material-icons step-icon failed';
      resBucketText.innerHTML = `<strong>Result:</strong> Exhausted all options — serving default`;
      
      resVariation.textContent = 'Off (Default)';
      resVariation.style.color = 'var(--danger-red)';
    }
  });

  function addAnnotation(ruleEl, type, text) {
    const statusContainer = ruleEl.querySelector('.rule-status-container');
    if (!statusContainer) return;

    const div = document.createElement('div');
    div.className = `sim-annotation annotation-${type}`;
    
    let icon = 'info';
    if (type === 'success') icon = 'check_circle';
    if (type === 'skipped') icon = 'block';
    
    div.innerHTML = `<span class="material-icons" style="font-size:14px">${icon}</span> ${text}`;
    statusContainer.appendChild(div);
  }

});
