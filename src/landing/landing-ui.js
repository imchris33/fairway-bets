import { S } from '../state.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'

function renderLanding(){
  const el=ensureScr('landing');
  el.style.maxWidth='none';
  el.innerHTML=`
<div class="lp" id="landing-page">

  <!-- Sticky nav -->
  <nav class="lp-nav" id="lp-nav">
    <div class="lp-nav-inner">
      <div class="lp-nav-brand">
        <span class="lp-nav-logo">⛳</span>
        <span class="lp-nav-wordmark">Fairway Bets</span>
      </div>
      <button class="lp-nav-cta" onclick="nav('signup')">Get Started</button>
    </div>
  </nav>

  <!-- Hero -->
  <section class="lp-hero">
    <div class="lp-hero-inner">
      <div class="lp-hero-content">
        <div class="lp-badge">Free · No download · Works on any phone</div>
        <h1 class="lp-h1">No more math.<br>No more arguments.<br><span class="lp-h1-gold">Just golf.</span></h1>
        <p class="lp-sub">Fairway Bets tracks Nassau, Skins, Match Play and more — handicap math included. At the end of the round, everyone knows exactly who pays who.</p>
        <div class="lp-hero-btns">
          <button class="btn btn-gold lp-btn" onclick="nav('signup')">Start a Round Free</button>
          <button class="btn btn-outline lp-btn" onclick="enterGuestMode()">Try as Guest — No Account</button>
        </div>
        <p class="lp-fine">No credit card. No download. Works right in your browser.</p>
      </div>
      <div class="lp-hero-phone">
        <div class="lp-phone-frame">
          <div class="lp-phone-notch"></div>
          <div class="lp-phone-screen">
            ${renderMockupSettlement()}
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Social proof -->
  <section class="lp-section lp-proof">
    <div class="lp-container">
      <div class="lp-stat-hero">
        <div class="lp-stat-num">2,400+</div>
        <div class="lp-stat-label">rounds settled</div>
      </div>
      <div class="lp-testimonials">
        <div class="lp-testimonial">
          <div class="lp-testi-avatar">MC</div>
          <div class="lp-testi-body">
            <p class="lp-testi-text">"We used to spend 10 minutes on the 18th green arguing about who owes what. Now it's instant."</p>
            <div class="lp-testi-meta">Mike C. · 12 hdcp · Scottsdale, AZ</div>
          </div>
        </div>
        <div class="lp-testimonial">
          <div class="lp-testi-avatar">JR</div>
          <div class="lp-testi-body">
            <p class="lp-testi-text">"The Nassau auto-calc alone is worth it. Add skins and CTP and it just handles everything."</p>
            <div class="lp-testi-meta">Jason R. · 8 hdcp · Austin, TX</div>
          </div>
        </div>
      </div>
    </div>
  </section>

  <!-- Stats strip -->
  <section class="lp-stats-strip">
    <div class="lp-container">
      <div class="lp-strip-row">
        <div class="lp-strip-item"><span class="lp-strip-val">5</span> game types</div>
        <div class="lp-strip-dot"></div>
        <div class="lp-strip-item"><span class="lp-strip-val">18</span> holes tracked</div>
        <div class="lp-strip-dot"></div>
        <div class="lp-strip-item"><span class="lp-strip-val">$0</span> free to use</div>
      </div>
    </div>
  </section>

  <!-- How it works -->
  <section class="lp-section">
    <div class="lp-container">
      <h2 class="lp-h2">How It Works</h2>
      <div class="lp-steps">
        ${[
          {num:'1',icon:'👥',title:'Add your players',desc:'Enter names and handicaps for up to 4 players'},
          {num:'2',icon:'🎰',title:'Set your games & stakes',desc:'Nassau, Skins, Match Play, Stroke, CTP — pick your bets'},
          {num:'3',icon:'📷',title:'Scan the scorecard',desc:'AI reads the card and fills in par + stroke index for all 18 holes',badge:'AI powered'},
          {num:'4',icon:'⛳',title:'Score hole by hole',desc:'Tap to enter scores as you play. Net scores update live.'},
          {num:'5',icon:'💰',title:'Settle up on the 18th green',desc:'See exactly who pays who — minimum transactions to clear all debts',badge:'Automatic math'}
        ].map((s,i)=>`
          <div class="lp-step">
            <div class="lp-step-timeline">
              <div class="lp-step-num">${s.num}</div>
              ${i<4?'<div class="lp-step-line"></div>':''}
            </div>
            <div class="lp-step-content">
              <div class="lp-step-icon">${s.icon}</div>
              <div>
                <h3 class="lp-step-title">${s.title}${s.badge?`<span class="lp-step-badge">${s.badge}</span>`:''}</h3>
                <p class="lp-step-desc">${s.desc}</p>
              </div>
            </div>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- Games section -->
  <section class="lp-section lp-games-sec">
    <div class="lp-container">
      <h2 class="lp-h2">Every Game You Play</h2>
      <div class="lp-games-grid">
        ${[
          {icon:'🏌️',name:'Nassau',amt:'$10/$10/$20',desc:'Front 9, Back 9, and Overall — the classic 3-bet format'},
          {icon:'💀',name:'Skins',amt:'$5/hole',desc:'Win the hole outright or it carries over. Pressure builds every hole.'},
          {icon:'🥊',name:'Match Play',amt:'$50',desc:'Hole-by-hole battles. Most holes won takes the pot.'},
          {icon:'📊',name:'Stroke Play',amt:'$20',desc:'Lowest net score wins. Handicap strokes applied per hole.'},
          {icon:'🎯',name:'Closest to Pin',amt:'$10',desc:'Par 3s only. Closest to the flag collects from everyone.'}
        ].map(g=>`
          <div class="lp-game-card">
            <div class="lp-game-icon">${g.icon}</div>
            <div class="lp-game-name">${g.name}</div>
            <div class="lp-game-amt">${g.amt}</div>
            <div class="lp-game-desc">${g.desc}</div>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- Features section -->
  <section class="lp-section">
    <div class="lp-container">
      <h2 class="lp-h2">Built for the Course</h2>
      <div class="lp-features-grid">
        ${[
          {icon:'📷',title:'AI Scorecard Scanning',desc:'Snap a photo of the course card — par and stroke index fill in automatically'},
          {icon:'🎯',title:'Stroke Index Handicaps',desc:'Strokes from the low man, applied per hole by difficulty. Real handicap math.'},
          {icon:'💸',title:'Minimum Transactions',desc:'Smart settlement finds the fewest payments to clear all debts'},
          {icon:'📶',title:'Full Offline Mode',desc:'Score your round with no signal. Syncs when you\'re back online.'},
          {icon:'💾',title:'Auto-Save & Resume',desc:'Close the app mid-round? Pick up right where you left off.'},
          {icon:'📱',title:'Add to Home Screen',desc:'Works like a native app. No App Store needed.'}
        ].map(f=>`
          <div class="lp-feature-card">
            <div class="lp-feature-icon">${f.icon}</div>
            <h3 class="lp-feature-title">${f.title}</h3>
            <p class="lp-feature-desc">${f.desc}</p>
          </div>`).join('')}
      </div>
    </div>
  </section>

  <!-- CTA bottom -->
  <section class="lp-section lp-cta-sec">
    <div class="lp-container" style="text-align:center">
      <div style="font-size:52px;margin-bottom:12px">⛳</div>
      <h2 class="lp-h2" style="margin-bottom:8px">Ready to stop arguing?</h2>
      <p class="lp-sub" style="margin-bottom:28px">Settle every bet on the 18th green.</p>
      <div class="lp-hero-btns" style="justify-content:center">
        <button class="btn btn-gold lp-btn" onclick="nav('signup')">Start a Round Free</button>
        <button class="btn btn-outline lp-btn" onclick="enterGuestMode()">Try as Guest — No Account</button>
      </div>
      <p class="lp-fine" style="margin-top:16px">Guest mode = full access, zero commitment. Create an account later to save rounds and join groups.</p>
    </div>
  </section>

  <!-- Footer -->
  <footer class="lp-footer">
    <div class="lp-container">
      <div class="lp-footer-brand">⛳ Fairway Bets</div>
      <div class="lp-footer-links">
        <button class="auth-link" onclick="nav('login')">Sign In</button>
        <button class="auth-link" onclick="nav('signup')">Create Account</button>
      </div>
      <div class="lp-footer-copy">&copy; ${new Date().getFullYear()} Fairway Bets. All rights reserved.</div>
    </div>
  </footer>

  <!-- Sticky bottom bar (mobile) -->
  <div class="lp-sticky-bar" id="lp-sticky-bar">
    <button class="btn btn-gold lp-sticky-main" onclick="nav('signup')">Start a Round Free</button>
    <button class="btn btn-outline lp-sticky-guest" onclick="enterGuestMode()">Guest</button>
  </div>

</div>`;

  // Sticky nav scroll effect
  const navEl=document.getElementById('lp-nav');
  const handler=()=>{
    if(window.scrollY>40) navEl.classList.add('scrolled');
    else navEl.classList.remove('scrolled');
  };
  window.addEventListener('scroll',handler,{passive:true});
  // Clean up on next nav
  el._cleanup=()=>window.removeEventListener('scroll',handler);
}

function renderMockupSettlement(){
  return `
    <div class="mock-s">
      <div class="mock-rainbow"></div>
      <div class="mock-header">
        <div style="font-size:24px;margin-bottom:4px">⛳</div>
        <div class="mock-title">Round Complete</div>
        <div class="mock-course">Pebble Beach · Mar 21, 2026</div>
      </div>

      <div class="mock-sec">
        <div class="mock-lbl">Game Winners</div>
        <div class="mock-winner"><span class="mock-trophy">🏆</span><span class="mock-wgame">Nassau · Overall</span><span class="mock-wname" style="color:#e0835a">Mike</span><span class="mock-wearn">+$60</span></div>
        <div class="mock-winner"><span class="mock-trophy">🏆</span><span class="mock-wgame">Skins · 4 holes</span><span class="mock-wname" style="color:#5a9ed6">Dave</span><span class="mock-wearn">+$20</span></div>
        <div class="mock-winner"><span class="mock-trophy">🏆</span><span class="mock-wgame">CTP · Hole 7</span><span class="mock-wname" style="color:#a07dd4">Chris</span><span class="mock-wearn">+$30</span></div>
      </div>

      <div class="mock-sec">
        <div class="mock-lbl">Net Balances</div>
        <div class="mock-bal-grid">
          <div class="mock-bal mock-bal-pos"><div class="mock-bal-name" style="color:#e0835a">Mike</div><div class="mock-bal-amt" style="color:#5ec47a">+$45</div><div class="mock-bal-tag">Collects</div></div>
          <div class="mock-bal mock-bal-pos"><div class="mock-bal-name" style="color:#5a9ed6">Dave</div><div class="mock-bal-amt" style="color:#5ec47a">+$15</div><div class="mock-bal-tag">Collects</div></div>
          <div class="mock-bal mock-bal-neg"><div class="mock-bal-name" style="color:#a07dd4">Chris</div><div class="mock-bal-amt" style="color:#d85050">-$25</div><div class="mock-bal-tag">Owes</div></div>
          <div class="mock-bal mock-bal-neg"><div class="mock-bal-name" style="color:#5ec47a">Jason</div><div class="mock-bal-amt" style="color:#d85050">-$35</div><div class="mock-bal-tag">Owes</div></div>
        </div>
      </div>

      <div class="mock-sec">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
          <div class="mock-lbl" style="margin:0">Settle Up</div>
          <div class="mock-count">2 payments</div>
        </div>
        <div class="mock-txn">
          <div class="mock-txn-from"><div class="mock-txn-lbl">Pays</div><div style="color:#5ec47a;font-weight:600;font-size:9px">Jason</div></div>
          <div class="mock-txn-mid">→<div class="mock-txn-amt">$35</div></div>
          <div class="mock-txn-to"><div class="mock-txn-lbl">To</div><div style="color:#e0835a;font-weight:600;font-size:9px">Mike</div></div>
        </div>
        <div class="mock-txn">
          <div class="mock-txn-from"><div class="mock-txn-lbl">Pays</div><div style="color:#a07dd4;font-weight:600;font-size:9px">Chris</div></div>
          <div class="mock-txn-mid">→<div class="mock-txn-amt">$25</div></div>
          <div class="mock-txn-to"><div class="mock-txn-lbl">To</div><div style="color:#5a9ed6;font-weight:600;font-size:9px">Dave</div></div>
        </div>
      </div>

      <div class="mock-done-btn">✓ Everyone's Paid</div>
    </div>`;
}

registerScreen('landing', renderLanding);
