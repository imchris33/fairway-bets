import { S } from '../state.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'

function renderGames(){
  const el=ensureScr('games');
  const {nassau,skins,match,stroke,ctp}=S.games;
  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('setup')">‹</button>
  <h2>Bets</h2>
</div>
<div class="scroll">
  <p style="font-size:14px;color:var(--mut);margin-bottom:16px">Toggle games on/off and set the dollar amounts.</p>

  <div class="card">
    <div class="toggle-row" style="padding-top:0">
      <div class="t-label"><h3>Nassau</h3><p>Front 9 · Back 9 · Overall</p></div>
      <button class="tog ${nassau.on?'on':''}" onclick="tog('nassau')"></button>
    </div>
    ${nassau.on?`<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-top:14px">
      <div><div style="font-size:11px;color:var(--mut);margin-bottom:5px;text-align:center">Front $</div><input type="number" min="0" value="${nassau.front}" oninput="S.games.nassau.front=+this.value||0" style="width:100%"></div>
      <div><div style="font-size:11px;color:var(--mut);margin-bottom:5px;text-align:center">Back $</div><input type="number" min="0" value="${nassau.back}" oninput="S.games.nassau.back=+this.value||0" style="width:100%"></div>
      <div><div style="font-size:11px;color:var(--mut);margin-bottom:5px;text-align:center">Overall $</div><input type="number" min="0" value="${nassau.overall}" oninput="S.games.nassau.overall=+this.value||0" style="width:100%"></div>
    </div>`:''}
  </div>

  <div class="card">
    <div class="toggle-row" style="padding-top:0">
      <div class="t-label"><h3>Skins</h3><p>Low net per hole · ties carry over</p></div>
      <button class="tog ${skins.on?'on':''}" onclick="tog('skins')"></button>
    </div>
    ${skins.on?`<div style="display:flex;align-items:center;gap:12px;margin-top:14px">
      <span style="font-size:14px;color:var(--mut);flex:1">$ per skin</span>
      <input type="number" min="0" value="${skins.amt}" oninput="S.games.skins.amt=+this.value||0">
    </div>`:''}
  </div>

  <div class="card">
    <div class="toggle-row" style="padding-top:0">
      <div class="t-label"><h3>Match Play</h3><p>Most holes won takes the pot</p></div>
      <button class="tog ${match.on?'on':''}" onclick="tog('match')"></button>
    </div>
    ${match.on?`<div style="display:flex;align-items:center;gap:12px;margin-top:14px">
      <span style="font-size:14px;color:var(--mut);flex:1">Pot per player $</span>
      <input type="number" min="0" value="${match.amt}" oninput="S.games.match.amt=+this.value||0">
    </div>`:''}
  </div>

  <div class="card">
    <div class="toggle-row" style="padding-top:0">
      <div class="t-label"><h3>Stroke Play</h3><p>Lowest total net score wins</p></div>
      <button class="tog ${stroke.on?'on':''}" onclick="tog('stroke')"></button>
    </div>
    ${stroke.on?`<div style="display:flex;align-items:center;gap:12px;margin-top:14px">
      <span style="font-size:14px;color:var(--mut);flex:1">Pot per player $</span>
      <input type="number" min="0" value="${stroke.amt}" oninput="S.games.stroke.amt=+this.value||0">
    </div>`:''}
  </div>

  <div class="card">
    <div class="toggle-row" style="padding-top:0">
      <div class="t-label"><h3>Closest to Pin</h3><p>Par 3s only · fixed payout each</p></div>
      <button class="tog ${ctp.on?'on':''}" onclick="tog('ctp')"></button>
    </div>
    ${ctp.on?`<div style="display:flex;align-items:center;gap:12px;margin-top:14px">
      <span style="font-size:14px;color:var(--mut);flex:1">$ per par 3</span>
      <input type="number" min="0" value="${ctp.amt}" oninput="S.games.ctp.amt=+this.value||0">
    </div>`:''}
  </div>

  <button class="btn btn-gold" onclick="teeOff()">⛳ Tee Off</button>
  <div class="safe"></div>
</div>`;
}
window.tog=function(g){S.games[g].on=!S.games[g].on;renderGames();};
window.teeOff=function(){nav('course');};

registerScreen('games', renderGames);
