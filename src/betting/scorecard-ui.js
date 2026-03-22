import { S, saveRound } from '../state.js'
import { PC, PBG } from '../constants.js'
import { holesIn, diffCls, ensureScr, pn, showToast } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { getNet, hcStrokes, playingHc, segNets } from './betting.js'

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

// ─── Score label helpers ────────────────────────────────────────
function scoreLabel(score, par){
  const diff=score-par;
  if(score===1) return 'Ace';
  if(diff<=-3) return 'Albatross';
  if(diff===-2) return 'Eagle';
  if(diff===-1) return 'Birdie';
  if(diff===0) return 'Par';
  if(diff===1) return 'Bogey';
  if(diff===2) return 'Double';
  if(diff===3) return 'Triple';
  return `+${diff}`;
}

function scoreBtnStyle(score, par, isSelected, currentScore){
  const diff=score-par;
  if(isSelected){
    return 'background:#c9a84b;color:#000;border:2px solid #c9a84b;font-weight:700';
  }
  if(diff<0){
    return 'background:rgba(94,196,122,.08);border:1px solid rgba(94,196,122,.2);color:#5ec47a';
  }
  if(diff===0){
    return 'background:rgba(201,168,75,.08);border:1px solid rgba(201,168,75,.2);color:#c9a84b';
  }
  // above par
  return 'background:rgba(220,80,60,.06);border:1px solid rgba(220,80,60,.15);color:#dc503c';
}

function netLabel(net, par){
  const diff=net-par;
  if(diff<=-2) return {text:'Eagle or better', color:'#5ec47a'};
  if(diff===-1) return {text:'Birdie', color:'#5ec47a'};
  if(diff===0) return {text:'Par', color:'#c9a84b'};
  if(diff===1) return {text:'Bogey', color:'#dc503c'};
  if(diff===2) return {text:'Double', color:'#dc503c'};
  return {text:`+${diff}`, color:'#dc503c'};
}

// ─── Open hole bottom sheet ─────────────────────────────────────
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
  const gross=wg[pi];
  const net=gross!==null?gross-strokes:null;
  const netDiff=net!==null?net-hole.par:null;
  const nl=net!==null?netLabel(net,hole.par):{text:'',color:'var(--mut)'};

  // Score buttons 1-8
  const minScore=1;
  const maxScore=8;
  const scoreButtons=[];
  for(let s=minScore;s<=maxScore;s++){
    const sel=gross===s;
    const style=scoreBtnStyle(s, hole.par, sel, gross);
    const label=scoreLabel(s, hole.par);
    scoreButtons.push(`<button onclick="setScore(${pi},${s})" style="min-width:52px;height:60px;border-radius:10px;${style};display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;flex-shrink:0;padding:0 4px;font-family:Outfit,sans-serif">
      <span style="font-size:20px;font-weight:700;line-height:1">${s}</span>
      <span style="font-size:8px;line-height:1;opacity:.85;text-transform:uppercase;letter-spacing:.02em;white-space:nowrap">${label}</span>
    </button>`);
  }
  // +/- fallback for scores > 8
  scoreButtons.push(`<button onclick="adjScore(${pi},1)" style="min-width:40px;height:60px;border-radius:10px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);color:var(--mut);display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;font-size:18px;font-family:Outfit,sans-serif">${gross!==null&&gross>8?gross:'+'}${gross!==null&&gross>8?`<span style="font-size:9px;margin-left:2px">▲</span>`:''}</button>`);

  return `<div style="margin-bottom:14px">
    <!-- Player header -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;padding:0 2px">
      <div style="width:10px;height:10px;border-radius:50%;background:${PC[pi]};flex-shrink:0"></div>
      <div style="flex:1">
        <span style="font-size:14px;font-weight:600;color:var(--txt)">${p.name}</span>
        <span style="font-size:11px;color:var(--mut);margin-left:6px">${strokes>0?`+${strokes} stroke${strokes>1?'s':''}`:playingHc(pi)===0?'Low man':'No stroke'}</span>
      </div>
    </div>

    <!-- Score buttons row -->
    <div style="display:flex;gap:6px;overflow-x:auto;padding:2px 0 6px;-webkit-overflow-scrolling:touch;scrollbar-width:none">
      ${scoreButtons.join('')}
    </div>

    <!-- Net score display -->
    ${gross!==null?`<div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,.03);border-radius:9px;padding:8px 12px;margin-top:4px">
      <div>
        <span style="font-size:11px;color:var(--mut)">Net </span>
        <span style="font-size:16px;font-weight:700;color:${nl.color}">${net}</span>
        ${strokes>0?`<span style="font-size:11px;color:${nl.color};margin-left:6px">${nl.text} (with stroke${strokes>1?'s':''})</span>`
          :`<span style="font-size:11px;color:${nl.color};margin-left:6px">${nl.text}</span>`}
      </div>
      <div style="text-align:right">
        <span style="font-size:11px;color:var(--mut)">Gross </span>
        <span style="font-size:14px;font-weight:600;color:var(--txt)">${gross}</span>
      </div>
    </div>`:''
    }
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

  window.setScore=(pi,val)=>{wg[pi]=val;draw();};
  window.adjScore=(pi,d)=>{
    const cur=wg[pi]||hole.par;
    wg[pi]=Math.max(1,cur+d);
    draw();
  };
  window.setCTP=(pi)=>{wctp=pi===-1?null:pi;draw();};
  window.saveHole=(hi)=>{
    S.scores[hi].g=[...wg];
    S.scores[hi].ctp=wctp;
    saveRound();closeSheet();
    // Check for press opportunities after saving
    if(S.games.nassau.on&&S.nassauPresses.mode!=='none'){
      checkForPress(hi);
    }
    renderScorecard();
  };

  draw();
  document.getElementById('overlay').classList.add('open');
};

window.closeSheet=function(e){
  if(e&&e.target!==e.currentTarget)return;
  document.getElementById('overlay').classList.remove('open');
};

// ─── Press bet checking ─────────────────────────────────────────
function checkForPress(hi){
  const mode=S.nassauPresses.mode;
  const downBy=mode==='auto-1'?1:mode==='auto-2'?2:2;
  const nine=hi<9?'front':'back';
  const nineStart=nine==='front'?0:9;
  const nineEnd=nine==='front'?8:17;
  const holesLeft=nineEnd-hi;

  if(holesLeft<1) return; // Not enough holes left for a press

  // Calculate net holes won per player for this nine so far
  const active=S.players.map((p,i)=>({name:p.name,idx:i})).filter(p=>p.name);
  if(active.length<2) return;

  const wins=active.map(p=>{
    let w=0;
    for(let h=nineStart;h<=hi;h++){
      const net=getNet(h,p.idx);
      if(net===null) continue;
      const others=active.filter(o=>o.idx!==p.idx);
      const otherNets=others.map(o=>getNet(h,o.idx)).filter(n=>n!==null);
      if(otherNets.length&&net<Math.min(...otherNets)) w++;
    }
    return w;
  });

  // Check each pair
  for(let i=0;i<active.length;i++){
    for(let j=i+1;j<active.length;j++){
      const diff=wins[i]-wins[j];
      const loser=diff<0?i:j;
      const winner=diff<0?j:i;
      const deficit=Math.abs(diff);

      if(deficit>=downBy){
        const loserName=active[loser].name;
        const winnerName=active[winner].name;

        // Check if a press already exists for this range
        const alreadyPressed=S.presses.some(p=>
          p.nine===nine&&p.startHole===hi+2&&
          p.players[0]===loserName&&p.players[1]===winnerName
        );
        if(alreadyPressed) continue;

        // Calculate press amount
        let amt=S.games.nassau[nine==='front'?'front':'back']||10;
        if(S.nassauPresses.amount==='half') amt=Math.round(amt/2);
        if(S.nassauPresses.amount==='double') amt=amt*2;

        if(mode==='manual'){
          // Show press prompt (simplified — just fire it since we can't block)
          if(confirm(`${loserName} is ${deficit} down on the ${nine} with ${holesLeft} holes left.\n\nPress for $${amt}?`)){
            firePress(nine, hi+2, nineEnd+1, amt, loserName, winnerName);
          }
        }else{
          // Auto-press
          firePress(nine, hi+2, nineEnd+1, amt, loserName, winnerName);
          showToast(`Auto-press: ${loserName} vs ${winnerName}, $${amt}, holes ${hi+2}–${nineEnd+1}`);
        }
      }
    }
  }
}

function firePress(nine, startHole, endHole, amount, loserName, winnerName){
  S.presses.push({
    id:crypto.randomUUID(),
    nine,
    startHole,
    endHole,
    amount,
    players:[loserName, winnerName],
    result:null
  });
  saveRound();
}

registerScreen('scorecard', renderScorecard);
