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

  // --- Rule Definitions ---
  const rulesData = [
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
      check: (ctx) => ctx.birds,
      exposure: 100,
      variation: 'seed banner',
      targetDesc: 'Likes Birds = ON'
    },
    {
      id: 'rule-5',
      name: 'Everyone 34%',
      check: () => true,
      exposure: 34,
      variation: 'general banner',
      targetDesc: 'Fallback for all users'
    }
  ];

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
    document.querySelectorAll('.rule-card').forEach(ruleEl => {
      ruleEl.classList.remove('is-simulated', 'is-dimmed', 'is-fallthrough');
      ruleEl.querySelectorAll('.sim-annotation').forEach(a => a.remove());
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

    let winningRuleMatch = null;
    let fallthroughRules = []; 
    let ignoredRules = [];

    // Evaluate rules top-to-bottom
    for (const rule of rulesData) {
      if (rule.check(context)) {
        const score = getBucketScore(vid, rule.id);
        const isBucketed = score < rule.exposure;

        if (isBucketed) {
          winningRuleMatch = { rule, score };
          break; // Found our winner, stop evaluation
        } else {
          // TARGETED but MISSED BUCKET -> Fall through
          fallthroughRules.push({ rule, score });
        }
      } else {
        ignoredRules.push(rule);
      }
    }

    // --- Update LEFT LIST Visuals ---
    document.querySelectorAll('.rule-card').forEach(ruleEl => {
      const isWinner = winningRuleMatch && winningRuleMatch.rule.id === ruleEl.id;
      const ftMatch = fallthroughRules.find(f => f.rule.id === ruleEl.id);
      const isIgnored = ignoredRules.find(r => r.id === ruleEl.id);

      if (isWinner) {
        ruleEl.classList.add('is-simulated');
        addAnnotation(ruleEl, 'success', `✓ Targeted & Bucketed (${winningRuleMatch.score < winningRuleMatch.rule.exposure ? '<' : '>='} ${winningRuleMatch.rule.exposure}%)`);
        ruleEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (ftMatch) {
        ruleEl.classList.add('is-fallthrough');
        addAnnotation(ruleEl, 'fallthrough', `Targeted but missed ${ftMatch.rule.exposure}% exposure (Score: ${ftMatch.score}). Falling through ↓`);
      } else {
        ruleEl.classList.add('is-dimmed');
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
    const div = document.createElement('div');
    div.className = `sim-annotation annotation-${type}`;
    div.innerHTML = `<span class="material-icons" style="font-size:14px">${type === 'success' ? 'check_circle' : 'info'}</span> ${text}`;
    ruleEl.appendChild(div);
  }

});
