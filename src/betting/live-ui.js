import { S } from '../state.js'
import { PC } from '../constants.js'
import { holesIn, par3s, pn, ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { segNets, skinsCalc, mpWins, balances } from './betting.js'

function renderLive(){
  const el=ensureScr('live');
  const done=holesIn();

  function lbBlock(nets,label,amt){
    const valid=!nets.some(x=>x===null);
    const rows=nets.map((n,i)=>({n,i})).filter(x=>x.n!==null&&S.players[x.i].name).sort((a,b)=>a.n-b.n);
    if(!rows.length)return `<div style="color:var(--mut);font-size:13px;padding:6px 0">No scores yet</div>`;
    const mn=rows[0].n;
    return rows.map((r,rank)=>`<div class="lb-row">
      <div class="lb-pos">${rank+1}</div>
      <div class="lb-dot" style="background:${PC[r.i]}"></div>
      <div class="lb-name">${pn(r.i)}</div>
      <div class="lb-val ${valid&&r.n===mn?'pos':'neu'}">${r.n} net</div>
    </div>`).join('');
  }

  const fNets=segNets(0,8);
  const bNets=segNets(9,17);
  const oNets=segNets(0,17);
  const skins=skinsCalc();
  const sw=[0,0,0,0];skins.forEach(r=>{if(r.w!==null)sw[r.w]+=r.pot;});
  const carrying=skins.filter(r=>!r.pending&&r.w===null).length;
  const mw=mpWins();
  const ctpHoles=par3s();
  const bal=balances();

  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('scorecard')">‹</button>
  <h2>Live Totals</h2>
</div>
<div class="scroll">
  <p style="font-size:13px;color:var(--mut);margin-bottom:16px">${done}/18 holes complete</p>

  ${S.games.nassau.on?`<div class="card">
    <div class="lb-game">Nassau</div>
    ${S.games.nassau.front?`<div class="lb-seg">Front 9 — $${S.games.nassau.front}</div>${lbBlock(fNets,'front',S.games.nassau.front)}<div class="divider"></div>`:''}
    ${S.games.nassau.back?`<div class="lb-seg">Back 9 — $${S.games.nassau.back}</div>${lbBlock(bNets,'back',S.games.nassau.back)}<div class="divider"></div>`:''}
    ${S.games.nassau.overall?`<div class="lb-seg">Overall — $${S.games.nassau.overall}</div>${lbBlock(oNets,'overall',S.games.nassau.overall)}`:''}
  </div>`:''}

  ${S.games.skins.on?`<div class="card">
    <div class="lb-game">Skins — $${S.games.skins.amt} each</div>
    ${sw.map((w,i)=>S.players[i].name?`<div class="lb-row">
      <div class="lb-dot" style="background:${PC[i]}"></div>
      <div class="lb-name">${pn(i)}</div>
      <div class="lb-val ${w>0?'pos':'neu'}">${w} skin${w!==1?'s':''} · $${w*S.games.skins.amt}</div>
    </div>`:'').join('')}
    ${carrying>0?`<div style="margin-top:8px;padding:8px 10px;background:rgba(201,168,75,.1);border-radius:8px;font-size:13px;color:var(--gold)">${carrying} skin${carrying>1?'s':''} carrying over</div>`:''}
  </div>`:''}

  ${S.games.match.on?`<div class="card">
    <div class="lb-game">Match Play — $${S.games.match.amt} pot</div>
    ${[...S.players.map((p,i)=>({i,w:mw[i]}))].filter(x=>S.players[x.i].name).sort((a,b)=>b.w-a.w).map((p,rank)=>`
    <div class="lb-row">
      <div class="lb-pos">${rank+1}</div>
      <div class="lb-dot" style="background:${PC[p.i]}"></div>
      <div class="lb-name">${pn(p.i)}</div>
      <div class="lb-val ${rank===0&&p.w>0?'pos':'neu'}">${p.w} hole${p.w!==1?'s':''}</div>
    </div>`).join('')}
  </div>`:''}

  ${S.games.ctp.on?`<div class="card">
    <div class="lb-game">Closest to Pin — $${S.games.ctp.amt} per par 3</div>
    ${ctpHoles.map(h=>{const w=S.scores[h].ctp;return `<div class="lb-row">
      <div class="lb-pos">${h+1}</div>
      <div class="lb-name">Hole ${h+1}</div>
      <div class="lb-val ${w!==null?'pos':'neu'}">${w!==null?pn(w):'TBD'}</div>
    </div>`;}).join('')}
  </div>`:''}

  <div class="card">
    <div class="lb-game">Net Balances (running)</div>
    ${bal.map((b,i)=>S.players[i].name?`<div class="lb-row">
      <div class="lb-dot" style="background:${PC[i]}"></div>
      <div class="lb-name">${pn(i)}</div>
      <div class="lb-val ${b>0?'pos':b<0?'neg':'neu'}">${b>0?'+':''}$${Math.abs(Math.round(b))}</div>
    </div>`:'').join('')}
  </div>

  <div class="safe"></div>
</div>`;
}

registerScreen('live', renderLive);
