import { S } from '../state.js'
import { PC, PBG } from '../constants.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { lowHc } from './betting.js'
import { loadSavedPlayers } from './saved-players.js'

export function syncStrokes(){
  const low=lowHc();
  S.strokes=S.players.map(p=>p.name?Math.max(0,p.hc-low):0);
}

function getInitials(name){
  const parts=name.trim().split(/\s+/);
  if(parts.length>=2) return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
  return name.slice(0,2).toUpperCase();
}

let _savedPanelOpen=false;

function renderSetup(){
  const el=ensureScr('setup');
  const saved=loadSavedPlayers();
  const hasSaved=saved.length>0;

  // Check which saved players are already added
  const currentNames=S.players.map(p=>p.name.toLowerCase()).filter(Boolean);
  const hasUsualGroup=saved.length>=4;

  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('home')">‹</button>
  <h2>Players</h2>
</div>
<div class="scroll">
  <p style="font-size:14px;color:var(--mut);margin-bottom:16px">Enter names and handicaps. Leave unused player slots blank.</p>

  ${hasSaved?`
  <!-- Saved players banner -->
  <div onclick="toggleSavedPanel()" style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;margin-bottom:12px;cursor:pointer;border:1px dashed rgba(201,168,75,.35);border-radius:10px;background:rgba(201,168,75,.07)">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:16px">⭐</span>
      <span style="font-size:14px;color:var(--gold);font-weight:500">Add from saved players</span>
    </div>
    <span style="font-size:13px;color:var(--mut)">${saved.length} saved ›</span>
  </div>

  <!-- Saved players panel -->
  <div id="saved-panel" style="display:${_savedPanelOpen?'block':'none'};margin-bottom:16px;background:var(--card);border:1px solid var(--brd);border-radius:12px;overflow:hidden">
    <div style="display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.06)">
      <span style="font-size:14px;font-weight:600">Your Players</span>
      <button onclick="toggleSavedPanel()" style="background:none;border:none;color:var(--mut);font-size:18px;cursor:pointer;padding:4px">✕</button>
    </div>

    ${hasUsualGroup?`
    <div onclick="addUsualGroup()" style="padding:12px 14px;cursor:pointer;border-bottom:1px solid rgba(255,255,255,.06);background:rgba(201,168,75,.05)">
      <div style="display:flex;align-items:center;justify-content:space-between">
        <div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
            <span style="font-size:13px">⚡</span>
            <span style="font-size:13px;font-weight:600;color:var(--gold)">Start with usual group</span>
          </div>
          <div style="font-size:11px;color:var(--mut)">${saved.slice(0,4).map(p=>p.name).join(' · ')}</div>
        </div>
        <span style="font-size:12px;color:var(--gold)">Add all →</span>
      </div>
    </div>`:''}

    ${saved.map((sp,idx)=>{
      const isAdded=currentNames.includes(sp.name.toLowerCase());
      return `
    <div style="display:flex;align-items:center;gap:10px;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.04)">
      <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;background:${PBG[sp.color||idx%4]};color:${PC[sp.color||idx%4]};flex-shrink:0">${getInitials(sp.name)}</div>
      <div style="flex:1">
        <div style="font-size:13px;font-weight:500">${sp.name}</div>
        <div style="font-size:11px;color:var(--mut)">${sp.handicap} hdcp${sp.roundsPlayed?' · '+sp.roundsPlayed+' rounds':''}</div>
      </div>
      ${isAdded
        ?`<span style="font-size:11px;color:#5ec47a;font-weight:500;opacity:.7">Added ✓</span>`
        :`<button onclick="addSavedToSlot(${idx})" style="background:rgba(201,168,75,.15);border:1px solid rgba(201,168,75,.3);border-radius:6px;padding:5px 12px;font-size:11px;font-weight:600;color:var(--gold);cursor:pointer;font-family:Outfit,sans-serif">Add</button>`
      }
    </div>`;
    }).join('')}
  </div>`:''}

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

window.toggleSavedPanel=function(){
  _savedPanelOpen=!_savedPanelOpen;
  const panel=document.getElementById('saved-panel');
  if(panel) panel.style.display=_savedPanelOpen?'block':'none';
};

window.addSavedToSlot=function(savedIdx){
  const saved=loadSavedPlayers();
  const sp=saved[savedIdx];
  if(!sp)return;
  // Find first empty slot
  const emptyIdx=S.players.findIndex(p=>!p.name);
  if(emptyIdx===-1){
    // All slots full — try replacing first unnamed or do nothing
    return;
  }
  S.players[emptyIdx].name=sp.name;
  S.players[emptyIdx].hc=sp.handicap||0;
  syncStrokes();
  renderSetup();
};

window.addUsualGroup=function(){
  const saved=loadSavedPlayers();
  const top4=saved.slice(0,4);
  top4.forEach((sp,i)=>{
    S.players[i].name=sp.name;
    S.players[i].hc=sp.handicap||0;
  });
  syncStrokes();
  _savedPanelOpen=false;
  renderSetup();
};

window.syncStrokes=syncStrokes;
window.renderSetup=renderSetup;
window.toGames=function(){
  if(!S.players.some(p=>p.name)){alert('Enter at least one player name.');return;}
  syncStrokes();
  nav('games');
};

registerScreen('setup', renderSetup);
