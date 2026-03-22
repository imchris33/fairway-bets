import { S } from '../state.js'
import { PC } from '../constants.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'

function renderHistory(){
  const el=ensureScr('history');
  const gname={nassau:'Nassau',skins:'Skins',match:'Match',stroke:'Stroke',ctp:'CTP'};
  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('home')">‹</button>
  <h2>Past Rounds</h2>
</div>
<div class="scroll">
  ${!S.history.length?`<div class="empty-state"><div class="ei">📋</div><p>No rounds saved yet.<br>Play your first round and it'll show up here.</p></div>`:''}
  ${S.history.map((r,ri)=>`<div class="hist-item">
    <div class="hist-date">${r.date}</div>
    <div class="hist-names">${r.players.join(' · ')}</div>
    <div class="hist-tags">${r.games.map(g=>`<span class="hist-tag">${gname[g]||g}</span>`).join('')}</div>
    <div class="hist-bals">${r.bal.map((b,i)=>r.players[i]?`
      <span style="font-size:13px">
        <span style="color:${PC[i]}">${r.players[i]}</span>
        <span style="color:${b>0?'var(--gold)':b<0?'var(--red)':'var(--mut)'};margin-left:4px">${b>0?'+':''}$${Math.abs(Math.round(b))}</span>
      </span>`:'').join('')}</div>
    ${r.txns&&r.txns.length?`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--brd)">
      ${r.txns.map(t=>`<div style="font-size:12px;color:var(--mut);margin-bottom:3px">
        <span style="color:${PC[t.from]}">${r.players[t.from]}</span> pays
        <span style="color:${PC[t.to]}">${r.players[t.to]}</span>
        <span style="color:var(--gold);font-weight:600"> $${t.amt}</span>
      </div>`).join('')}
    </div>`:''}
  </div>`).join('')}
  ${S.history.length?`<button class="btn btn-danger" style="margin-top:8px" onclick="clearHistory()">Clear All History</button>`:''}
  <div class="safe"></div>
</div>`;
}
window.clearHistory=function(){
  if(!confirm('Delete all round history?'))return;
  S.history=[];
  try{localStorage.removeItem('fb_h');}catch(e){}
  renderHistory();
};

registerScreen('history', renderHistory);
