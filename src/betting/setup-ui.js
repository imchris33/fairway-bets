import { S } from '../state.js'
import { PC } from '../constants.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { lowHc } from './betting.js'

export function syncStrokes(){
  const low=lowHc();
  S.strokes=S.players.map(p=>p.name?Math.max(0,p.hc-low):0);
}

function renderSetup(){
  const el=ensureScr('setup');

  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('home')">‹</button>
  <h2>Players</h2>
</div>
<div class="scroll">
  <p style="font-size:14px;color:var(--mut);margin-bottom:16px">Enter names and handicaps. Leave unused player slots blank.</p>
  ${S.players.map((p,i)=>`
  <div class="player-card" style="border-left-color:${PC[i]}">
    <div class="pc-header">
      <div class="pc-dot" style="background:${PC[i]}"></div>
      <span style="font-size:12px;color:var(--mut)">Player ${i+1}</span>
    </div>
    <input type="text" placeholder="Name" value="${p.name}" oninput="S.players[${i}].name=this.value" onblur="S.players[${i}].name=this.value.trim();syncStrokes();renderSetup()" style="width:100%;margin-bottom:10px">
    <div style="display:flex;align-items:center;gap:12px">
      <span style="font-size:14px;color:var(--mut);flex:1">Handicap (0–54)</span>
      <input type="number" min="0" max="54" value="${p.hc}" oninput="S.players[${i}].hc=Math.max(0,+this.value||0)" onblur="syncStrokes();renderSetup()">
    </div>
  </div>`).join('')}

  <button class="btn btn-gold" style="margin-top:8px" onclick="toGames()">Next: Set Bets →</button>
  <div class="safe"></div>
</div>`;
}

window.syncStrokes=syncStrokes;
window.renderSetup=renderSetup;
window.toGames=function(){
  if(!S.players.some(p=>p.name)){alert('Enter at least one player name.');return;}
  syncStrokes();
  nav('games');
};

registerScreen('setup', renderSetup);
