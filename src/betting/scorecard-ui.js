import { S, saveRound } from '../state.js'
import { PC, PBG } from '../constants.js'
import { holesIn, diffCls, ensureScr, pn } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { getNet, hcStrokes, playingHc } from './betting.js'

function renderScorecard(){
  const el=ensureScr('scorecard');
  const done=holesIn();
  const prog=Math.round((done/18)*100);

  function nineTots(from,to){
    return S.players.map((_,pi)=>{
      if(!S.players[pi].name)return null;
      let t=0;
      for(let h=from;h<=to;h++){const g=S.scores[h].g[pi];if(g===null)return '—';t+=g;}
      return t;
    });
  }

  let rows='';
  for(let h=0;h<18;h++){
    if(h===9){
      const tots=nineTots(0,8);
      rows+=`<div class="nine-div">
        <div class="nine-lbl">Out</div>
        ${tots.map((t,i)=>S.players[i].name?`<div class="nine-tot" style="color:${PC[i]}">${t}</div>`:'<div></div>').join('')}
      </div>`;
    }
    const hole=S.holes[h];
    const sc=S.scores[h];
    const isp3=hole.par===3;
    const cells=S.players.map((p,pi)=>{
      if(!p.name)return '<div></div>';
      const g=sc.g[pi];
      const d=g!==null?g-hole.par:null;
      const cls=diffCls(d);
      const net=getNet(h,pi);
      const showCTP=isp3&&S.games.ctp.on&&sc.ctp===pi&&g!==null;
      return `<div class="score-cell ${cls}" style="${g!==null?`background:${PBG[pi]}`:''}">
        <span class="g" style="color:${g!==null?PC[pi]:'var(--dim)'}">${g!==null?g:'—'}</span>
        ${g!==null&&p.hc>0?`<span class="nl">net ${net}</span>`:''}
        ${showCTP?`<span class="ctpb">CTP</span>`:''}
      </div>`;
    }).join('');
    rows+=`<div class="hole-row ${isp3?'par3':''}" onclick="openHole(${h})">
      <div class="h-num">${h+1}</div>
      <div class="h-par">${hole.par}</div>
      ${cells}
    </div>`;
  }

  const backTots=nineTots(9,17);
  const allTots=nineTots(0,17);

  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('home')">‹</button>
  <h2>Scorecard</h2>
  <button class="topbar-btn" onclick="openScan()" style="margin-right:6px">📷 Scan</button>
  <button class="topbar-btn" onclick="nav('live')">Totals</button>
</div>
<div class="prog-bar"><div class="prog-fill" style="width:${prog}%"></div></div>
<div class="sc-head">
  <div class="ch">#</div><div class="ch">Par</div>
  ${S.players.map((p,i)=>p.name?`<div class="ph"><div class="ph-dot" style="background:${PC[i]}"></div><span>${p.name}</span></div>`:'<div></div>').join('')}
</div>
<div style="flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch">
  ${rows}
  <div class="nine-div" style="border-top:2px solid var(--brd)">
    <div class="nine-lbl">In</div>
    ${backTots.map((t,i)=>S.players[i].name?`<div class="nine-tot" style="color:${PC[i]}">${t}</div>`:'<div></div>').join('')}
  </div>
  <div class="nine-div" style="background:var(--card)">
    <div class="nine-lbl" style="color:var(--gold2)">Total</div>
    ${allTots.map((t,i)=>S.players[i].name?`<div class="nine-tot" style="color:${PC[i]};font-size:14px;font-weight:700">${t}</div>`:'<div></div>').join('')}
  </div>
</div>
${done===18
  ?`<div style="padding:16px"><button class="btn btn-gold" onclick="nav('summary')">Finish Round →</button></div>`
  :`<div style="padding:12px;text-align:center;font-size:13px;color:var(--mut)">${done}/18 holes complete · tap any hole to enter scores</div>`}
<div class="safe"></div>`;
}

window.openHole=function(hi){
  const hole=S.holes[hi];
  const sc=S.scores[hi];
  const isp3=hole.par===3;
  const wg=[...sc.g].map((g,pi)=>g===null?(S.players[pi].name?hole.par:null):g);
  let wctp=sc.ctp;

  function draw(){
    document.getElementById('sheet').innerHTML=`
<div class="sheet-handle"></div>
<div class="sheet-title">Hole ${hi+1}</div>
<div class="sheet-sub">Par ${hole.par} &nbsp;·&nbsp; Stroke Index ${hole.si}${isp3?' &nbsp;·&nbsp; Par 3':''}</div>
${S.players.map((p,pi)=>{
  if(!p.name)return '';
  const strokes=hcStrokes(playingHc(pi),hole.si);
  const net=wg[pi]!==null?wg[pi]-strokes:null;
  const diff=wg[pi]!==null?wg[pi]-hole.par:null;
  const col=diff===null?'var(--txt)':diff<0?'var(--gold2)':diff>0?'var(--red)':'var(--txt)';
  return `<div class="psr">
    <div style="width:10px;height:10px;border-radius:50%;background:${PC[pi]};flex-shrink:0"></div>
    <div class="psr-info">
      <div class="psr-name">${p.name}</div>
      <div class="psr-hc">${strokes>0?`Gets ${strokes} stroke${strokes>1?'s':''} (HC diff ${playingHc(pi)})`:playingHc(pi)===0?'Low man — no strokes':'No stroke this hole'}</div>
      ${net!==null?`<div style="font-size:10px;color:var(--mut);margin-top:1px">net ${net}</div>`:''}
    </div>
    <div class="stepper">
      <button class="step-btn" onclick="adj(${pi},-1)">−</button>
      <div class="step-val" style="color:${col}">${wg[pi]!==null?wg[pi]:'—'}</div>
      <button class="step-btn" onclick="adj(${pi},1)">+</button>
    </div>
  </div>`;
}).join('')}
${isp3&&S.games.ctp.on?`<div class="ctp-sec">
  <h4>⛳ Closest to Pin</h4>
  <div class="ctp-opts">
    ${S.players.map((p,pi)=>p.name?`<button class="ctp-opt ${wctp===pi?'sel':''}" onclick="setCTP(${pi})">${p.name}</button>`:'').join('')}
    <button class="ctp-opt ${wctp===null?'sel':''}" onclick="setCTP(-1)">None yet</button>
  </div>
</div>`:''}
<div style="padding:16px 20px">
  <button class="btn btn-gold" onclick="saveHole(${hi})">Save Hole ${hi+1}</button>
  <button class="btn btn-ghost" onclick="closeSheet()">Cancel</button>
</div>
<div class="safe"></div>`;
  }

  window.adj=(pi,d)=>{wg[pi]=Math.max(1,(wg[pi]||hole.par)+d);draw();};
  window.setCTP=(pi)=>{wctp=pi===-1?null:pi;draw();};
  window.saveHole=(hi)=>{
    S.scores[hi].g=[...wg];
    S.scores[hi].ctp=wctp;
    saveRound();closeSheet();renderScorecard();
  };

  draw();
  document.getElementById('overlay').classList.add('open');
};

window.closeSheet=function(e){
  if(e&&e.target!==e.currentTarget)return;
  document.getElementById('overlay').classList.remove('open');
};

registerScreen('scorecard', renderScorecard);
