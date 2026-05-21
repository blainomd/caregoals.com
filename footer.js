(function() {
  'use strict';

  // ── Color tokens ──────────────────────────────────────────────────
  var DOT_GREEN   = '#4edea3';
  var DOT_ORANGE  = '#fb923c';
  var DOT_RED     = '#f87171';
  var DOT_INDIGO  = '#818cf8';

  // ── Research cards per profile ────────────────────────────────────
  var CARDS = {
    surgeon: [
      { tag: 'CMS · April 2026', text: 'CJR-X proposed rule: nationwide mandatory joint replacement episodes. 2,500 hospitals affected. 90-day bundled payments.', dot: DOT_ORANGE },
      { tag: 'CMS PFS · 2024',   text: 'RTM billing up 373% since 2022 activation. Penetration still under 0.2% of eligible Medicare patients.', dot: DOT_GREEN },
      { tag: 'HHS OIG · 2025',   text: '96% of CCM-eligible patients not enrolled. $4,500/patient revenue gap for participating practices.', dot: DOT_GREEN },
      { tag: 'CMS · 2026',       text: 'ACCESS MSK program activating Q3 2026. FFS exclusions for non-participating surgeons in select markets.', dot: DOT_RED }
    ],
    family: [
      { tag: 'PHI · 2024',            text: '77% annual caregiver turnover. Average family onboards 3 new caregivers per year, restarting trust each time.', dot: DOT_ORANGE },
      { tag: 'IRS 213(d)',             text: 'HSA/FSA eligible: companion care, memory care, fall prevention — with physician-signed LMN. Average $936/yr unclaimed.', dot: DOT_GREEN },
      { tag: 'AARP · 2023',           text: '3M+ caregiver shortage projected by 2030. Demand for home-based care outpacing workforce growth by 2:1.', dot: DOT_ORANGE },
      { tag: 'Care.com · March 2026', text: 'Care.com reports $180M operating loss. 77% caregiver turnover cited as core unit economics failure.', dot: DOT_RED }
    ],
    physician: [
      { tag: 'JAMA · 2026',    text: 'Lantos: AI-generated clinical documentation requires substantive physician review, not attestation velocity.', dot: DOT_ORANGE },
      { tag: 'OIG AO 25-03',   text: 'Advisory opinion: flat per-encounter AI platform fees compliant with AKS if below FMV and not volume-linked.', dot: DOT_GREEN },
      { tag: 'CMS · 2026',     text: 'G0023/G0019: new AI-assisted care management codes. Physician supervision required for billing.', dot: DOT_GREEN }
    ],
    default: [
      { tag: 'CMS · April 2026', text: 'CJR-X proposed: mandatory joint replacement bundles nationwide. 90-day episodes, 2,500 hospitals.', dot: DOT_ORANGE },
      { tag: 'IRS 213(d)',        text: 'Physician-signed LMN unlocks HSA/FSA for home care. Average family saves $936/yr. Most never receive one.', dot: DOT_GREEN },
      { tag: 'co-op.care · 2026', text: 'AI generates. Physicians attest. Every clinical document exits through a hard intercept — no exceptions.', dot: DOT_INDIGO }
    ]
  };

  // ── Sage chips per profile ────────────────────────────────────────
  var CHIPS = {
    surgeon:   ['What codes am I likely missing?', 'How do I set up RTM billing?'],
    family:    ['Do I qualify for an LMN?', 'What does $59/mo include?'],
    physician: ['How does attestation work?', 'What is my earnings potential?'],
    default:   ['How does the network work?', 'What is an LMN?']
  };

  // ── State ─────────────────────────────────────────────────────────
  var tickerCards = [];
  var tickerIdx   = 0;
  var tickerTimer = null;
  var sageOpen    = false;

  // ── Helpers ───────────────────────────────────────────────────────
  function getProfile() {
    try { return (localStorage.getItem('hh_profile') || '').toLowerCase(); } catch(e) { return ''; }
  }
  function getPlan() {
    try { return localStorage.getItem('hh_plan') || ''; } catch(e) { return ''; }
  }
  function getLmn() {
    try { return localStorage.getItem('hh_lmn') === 'true'; } catch(e) { return false; }
  }
  function getLmnExpires() {
    try { return localStorage.getItem('hh_lmn_expires') || ''; } catch(e) { return ''; }
  }
  function getAccent() {
    var el = document.getElementById('hh-rail');
    if (!el) return '#7c6fff';
    return getComputedStyle(el).getPropertyValue('--footer-accent').trim() || '#7c6fff';
  }
  function profileGroup(p) {
    if (p === 'surgeon' || p === 'surgeonvalue') return 'surgeon';
    if (p === 'family'  || p === 'coop')         return 'family';
    if (p === 'physician' || p === 'clinicalswipe') return 'physician';
    return 'default';
  }

  // ── LEFT: Membership chip ─────────────────────────────────────────
  function renderLeft() {
    var el   = document.getElementById('hh-rail-left');
    if (!el) return;
    var profile = getProfile();
    var plan    = getPlan();
    var lmn     = getLmn();
    var lmnExp  = getLmnExpires();
    var accent  = getAccent();
    var html    = '';

    if (!profile) {
      // No profile
      html = dot('#6b7280') +
        span('Not connected', 'rgba(255,255,255,0.4)', '12px') +
        link('Start free', 'https://co-op.care', 'rgba(255,255,255,0.28)');
    } else if (plan === 'member') {
      // Full member
      var lmnBadge = lmn ? badge('LMN: active', DOT_GREEN) : '';
      html = dot(DOT_GREEN) +
        span('Member', 'rgba(255,255,255,0.85)', '12px', 'font-weight:700') +
        span(plan === 'member' ? '$59/mo' : plan, accent, '11px') +
        lmnBadge +
        link('Dashboard →', 'https://co-op.care', 'rgba(255,255,255,0.3)');
    } else if (plan === 'lmn_only') {
      // LMN only
      var renewText = lmnExp ? 'Renews ' + lmnExp : '';
      html = dot('#6bd8cb') +
        span('LMN active', 'rgba(255,255,255,0.8)', '12px', 'font-weight:600') +
        (renewText ? span(renewText, 'rgba(255,255,255,0.3)', '11px') : '') +
        link('Upgrade to member →', 'https://co-op.care', 'rgba(255,255,255,0.3)');
    } else if (profile) {
      // Profile but no plan
      var profileLabel = profile.charAt(0).toUpperCase() + profile.slice(1);
      var upgradeHref  = profile === 'surgeon' || profile === 'surgeonvalue'
        ? 'https://surgeonvalue.com'
        : profile === 'family' || profile === 'coop'
          ? 'https://co-op.care'
          : profile === 'physician' || profile === 'clinicalswipe'
            ? 'https://clinicalswipe.com'
            : 'https://co-op.care';
      html = dot(DOT_INDIGO) +
        span('Connected', accent, '12px', 'font-weight:600') +
        span(profileLabel, 'rgba(255,255,255,0.35)', '11px') +
        link('Upgrade →', upgradeHref, 'rgba(255,255,255,0.3)');
    }

    el.innerHTML = html;
  }

  function dot(color) {
    return '<span style="width:7px;height:7px;border-radius:50%;background:' + color + ';flex-shrink:0;display:inline-block;margin-right:2px"></span>';
  }
  function span(text, color, size, extra) {
    return '<span style="font-size:' + size + ';color:' + color + ';white-space:nowrap;' + (extra||'') + '">' + text + '</span>';
  }
  function link(text, href, color) {
    return '<a href="' + href + '" style="font-size:11px;color:' + color + ';text-decoration:none;white-space:nowrap;transition:color 0.15s" ' +
      'onmouseover="this.style.color=\'rgba(255,255,255,0.7)\'" onmouseout="this.style.color=\'' + color + '\'">' + text + '</a>';
  }
  function badge(text, color) {
    return '<span style="font-size:10px;color:' + color + ';background:' + color + '18;border:1px solid ' + color + '44;border-radius:4px;padding:1px 6px;white-space:nowrap">' + text + '</span>';
  }

  // ── CENTER: Ticker ────────────────────────────────────────────────
  function renderTicker() {
    var profile = getProfile();
    var group   = profileGroup(profile);
    tickerCards = CARDS[group] || CARDS['default'];

    var container = document.getElementById('hh-rail-ticker');
    if (!container) return;

    container.innerHTML = '';
    for (var i = 0; i < tickerCards.length; i++) {
      var card = tickerCards[i];
      var div  = document.createElement('div');
      div.style.cssText = [
        'position:absolute',
        'top:0','left:0','right:0',
        'display:flex','align-items:center','gap:8px',
        'height:32px',
        'opacity:' + (i === 0 ? '1' : '0'),
        'transition:opacity 0.5s ease',
        'overflow:hidden',
        'pointer-events:' + (i === 0 ? 'auto' : 'none')
      ].join(';');
      div.innerHTML =
        '<span style="flex-shrink:0;font-size:10px;font-weight:700;color:rgba(255,255,255,0.3);white-space:nowrap;background:rgba(255,255,255,0.05);border-radius:4px;padding:2px 6px">' + escHtml(card.tag) + '</span>' +
        '<span style="font-size:12px;color:rgba(255,255,255,0.55);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:1;min-width:0">' + escHtml(card.text) + '</span>' +
        '<span style="flex-shrink:0;width:7px;height:7px;border-radius:50%;background:' + card.dot + ';margin-left:4px"></span>';
      container.appendChild(div);
    }

    startTicker();

    // Pause on hover
    container.addEventListener('mouseenter', stopTicker);
    container.addEventListener('mouseleave', startTicker);
  }

  function startTicker() {
    stopTicker();
    tickerTimer = setInterval(advanceTicker, 6000);
  }
  function stopTicker() {
    if (tickerTimer) { clearInterval(tickerTimer); tickerTimer = null; }
  }
  function advanceTicker() {
    var container = document.getElementById('hh-rail-ticker');
    if (!container) return;
    var cards = container.children;
    if (!cards.length) return;
    cards[tickerIdx].style.opacity = '0';
    cards[tickerIdx].style.pointerEvents = 'none';
    tickerIdx = (tickerIdx + 1) % cards.length;
    cards[tickerIdx].style.opacity = '1';
    cards[tickerIdx].style.pointerEvents = 'auto';
  }
  function escHtml(s) {
    return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // ── RIGHT: Sage panel ─────────────────────────────────────────────
  function renderChips() {
    var profile = getProfile();
    var group   = profileGroup(profile);
    var chips   = CHIPS[group] || CHIPS['default'];
    var el      = document.getElementById('hh-sage-chips');
    if (!el) return;
    el.innerHTML = '';
    chips.forEach(function(q) {
      var btn = document.createElement('button');
      btn.textContent = q;
      btn.style.cssText = [
        'background:rgba(255,255,255,0.05)',
        'border:1px solid rgba(255,255,255,0.1)',
        'border-radius:6px',
        'padding:5px 10px',
        'font-size:11px',
        'color:rgba(255,255,255,0.55)',
        'cursor:pointer',
        'font-family:-apple-system,\'Inter\',sans-serif',
        'transition:border-color 0.15s,color 0.15s'
      ].join(';');
      btn.addEventListener('mouseenter', function() {
        this.style.borderColor = getAccent();
        this.style.color = getAccent();
      });
      btn.addEventListener('mouseleave', function() {
        this.style.borderColor = 'rgba(255,255,255,0.1)';
        this.style.color = 'rgba(255,255,255,0.55)';
      });
      btn.addEventListener('click', function() {
        document.getElementById('hh-sage-input').value = q;
        hhRailSageSubmit();
      });
      el.appendChild(btn);
    });
  }

  window.hhRailToggleSage = function() {
    var panel = document.getElementById('hh-sage-panel');
    if (!panel) return;
    sageOpen = !sageOpen;
    panel.style.transform = sageOpen ? 'translateY(0)' : 'translateY(100%)';
    if (sageOpen) {
      renderChips();
      setTimeout(function() {
        var inp = document.getElementById('hh-sage-input');
        if (inp) inp.focus();
      }, 260);
    }
  };

  window.hhRailSageSubmit = function() {
    var input = document.getElementById('hh-sage-input');
    var msgs  = document.getElementById('hh-sage-messages');
    if (!input || !msgs) return;
    var q = (input.value || '').trim();
    if (!q) return;
    input.value = '';

    // User bubble
    var userBubble = document.createElement('div');
    userBubble.style.cssText = 'align-self:flex-end;background:rgba(255,255,255,0.07);border-radius:10px 10px 2px 10px;padding:8px 12px;font-size:12px;color:rgba(255,255,255,0.75);line-height:1.5;max-width:88%';
    userBubble.textContent = q;
    msgs.appendChild(userBubble);

    // Typing indicator
    var typing = document.createElement('div');
    typing.style.cssText = 'background:rgba(255,255,255,0.04);border-radius:10px 10px 10px 2px;padding:8px 12px;font-size:12px;color:rgba(255,255,255,0.3);max-width:60%;display:flex;align-items:center;gap:4px';
    typing.innerHTML = '<span style="animation:hh-blink 1s infinite">&#9679;</span><span style="animation:hh-blink 1s infinite 0.33s">&#9679;</span><span style="animation:hh-blink 1s infinite 0.66s">&#9679;</span>';
    msgs.appendChild(typing);
    msgs.scrollTop = msgs.scrollHeight;

    setTimeout(function() {
      msgs.removeChild(typing);
      var reply = document.createElement('div');
      reply.style.cssText = 'background:rgba(255,255,255,0.04);border-radius:10px 10px 10px 2px;padding:10px 12px;font-size:12px;color:rgba(255,255,255,0.6);line-height:1.65;max-width:88%';
      reply.innerHTML = 'Sage is the AI layer across co-op.care. <a href="https://co-op.care" style="color:var(--footer-accent);text-decoration:none;font-weight:600">Join co-op.care \u2192</a> to start a conversation with full family care context.';
      msgs.appendChild(reply);
      msgs.scrollTop = msgs.scrollHeight;
    }, 1200);
  };

  // ── Inject body padding so content isn't hidden behind rail ──────
  function addBodyPad() {
    try {
      var body = document.body;
      var cur  = parseInt(getComputedStyle(body).paddingBottom, 10) || 0;
      if (cur < 52) body.style.paddingBottom = '52px';
    } catch(e) {}
  }

  // ── Blink keyframes (typing indicator) ───────────────────────────
  (function injectKeyframes() {
    if (document.getElementById('hh-rail-style')) return;
    var s = document.createElement('style');
    s.id = 'hh-rail-style';
    s.textContent = '@keyframes hh-blink{0%,100%{opacity:0.2}50%{opacity:1}}';
    document.head.appendChild(s);
  })();

  // ── Init ──────────────────────────────────────────────────────────
  function init() {
    addBodyPad();
    renderLeft();
    renderTicker();
    // Also re-render if localStorage changes (cross-tab)
    try {
      window.addEventListener('storage', function(e) {
        if (e.key === 'hh_profile' || e.key === 'hh_plan' || e.key === 'hh_lmn') {
          renderLeft();
          tickerIdx = 0;
          renderTicker();
        }
      });
    } catch(e2) {}
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
