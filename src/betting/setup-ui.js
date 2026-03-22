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
  const active=S.players.filter(p=>p.name);
  const low=lowHc();
  const showStrokes=active.length>0;

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

  ${showStrokes?`
  <div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;padding:14px;margin-bottom:12px">
    <div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:4px">Strokes this round</div>
    <div style="font-size:12px;color:var(--mut);margin-bottom:12px;line-height:1.5">Auto-calculated from handicaps — adjust any player manually by tapping + or −</div>
    ${S.players.map((p,i)=>{
      if(!p.name)return '';
      const auto=Math.max(0,p.hc-low);
      const manual=S.strokes[i];
      const diff=manual-auto;
      const adjusted=diff!==0;
      return `<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--brd)">
        <div style="width:8px;height:8px;border-radius:50%;background:${PC[i]};flex-shrink:0"></div>
        <div style="flex:1">
          <div style="font-size:13px;font-weight:500;color:${PC[i]}">${p.name}</div>
          <div style="font-size:10px;color:var(--mut);margin-top:2px">
            HC ${p.hc}${adjusted?` · auto was ${auto} · <span style="color:var(--gold)">manually adjusted</span>`:''}
            ${manual===0&&p.hc===low?` · <span style="color:var(--mut)">low man</span>`:''}
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:8px">
          <button onclick="adjStroke(${i},-1)" style="width:36px;height:36px;border-radius:8px;background:var(--dim);border:1px solid var(--brd);color:var(--txt);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:Outfit,sans-serif">−</button>
          <div style="width:36px;text-align:center">
            <div style="font-size:22px;font-weight:600;color:${manual>0?'var(--txt)':'var(--mut)'};">${manual}</div>
            <div style="font-size:9px;color:var(--mut);text-transform:uppercase;letter-spacing:.04em">${manual===1?'stroke':'strokes'}</div>
          </div>
          <button onclick="adjStroke(${i},1)" style="width:36px;height:36px;border-radius:8px;background:var(--dim);border:1px solid var(--brd);color:var(--txt);font-size:20px;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;font-family:Outfit,sans-serif">+</button>
        </div>
      </div>`;
    }).join('')}
    <button onclick="syncStrokes();renderSetup()" style="margin-top:12px;width:100%;padding:8px;border-radius:8px;background:none;border:1px solid var(--brd);color:var(--mut);font-size:12px;cursor:pointer;font-family:Outfit,sans-serif">↺ Reset to handicap defaults</button>
  </div>`:''}

  <button class="btn btn-gold" style="margin-top:8px" onclick="toGames()">Next: Set Bets →</button>
  <div class="safe"></div>
</div>`;
}

window.adjStroke=(i,d)=>{S.strokes[i]=Math.max(0,(S.strokes[i]||0)+d);renderSetup();};
window.syncStrokes=syncStrokes;
window.renderSetup=renderSetup;
window.toGames=function(){
  if(!S.players.some(p=>p.name)){alert('Enter at least one player name.');return;}
  nav('games');
};

registerScreen('setup', renderSetup);
