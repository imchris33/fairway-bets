import { S, saveRound } from '../state.js'
import { PC, PBG } from '../constants.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { lowHc, playingHc } from './betting.js'
import { syncStrokes } from './setup-ui.js'

function getInitials(name){
  const parts=name.trim().split(/\s+/);
  if(parts.length>=2) return (parts[0][0]+parts[parts.length-1][0]).toUpperCase();
  return name.slice(0,2).toUpperCase();
}

function strokeHoles(pi){
  // Returns array of 18 booleans — true if player gets a stroke on that hole
  const hc=playingHc(pi);
  if(hc===0) return Array(18).fill(false);
  return S.holes.map(h=>{
    const si=h.si;
    if(!si) return false;
    // Player gets a stroke if SI <= strokes (for first 18)
    // For strokes > 18, everyone gets at least 1, then SI <= remainder get 2
    const full=Math.floor(hc/18);
    const remainder=hc%18;
    return si<=remainder ? true : false;
    // Note: full > 0 means they get a stroke everywhere, so also true
  }).map((gets,i)=>{
    const hc2=playingHc(pi);
    const si=S.holes[i].si;
    const full=Math.floor(hc2/18);
    return full>0 || si<=hc2%18;
  });
}

function renderStrokes(){
  const el=ensureScr('strokes');
  const active=S.players.map((p,i)=>({...p,idx:i})).filter(p=>p.name);
  const low=lowHc();
  const lowPlayer=active.find(p=>p.hc===low);

  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('course')">‹</button>
  <h2>Stroke Allocations</h2>
</div>
<div class="scroll">

  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:13px;color:var(--mut);line-height:1.6">
      Low man: <strong style="color:var(--gold)">${lowPlayer?lowPlayer.name:''} (${low} hdcp)</strong> — plays scratch this round
    </div>
  </div>

  <!-- COMPACT PLAYER ROWS -->
  <div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px">
    ${active.map(p=>{
      const i=p.idx;
      const strk=S.strokes[i];
      const auto=Math.max(0,p.hc-low);
      const adjusted=strk!==auto;
      const isLow=p.hc===low&&strk===0;
      return `
    <div style="background:var(--card);border:1px solid ${isLow?'rgba(94,196,122,.2)':'var(--brd)'};border-radius:12px;padding:12px 14px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;background:${PBG[i]};color:${PC[i]};flex-shrink:0">${getInitials(p.name)}</div>
        <div>
          <div style="font-size:15px;font-weight:600">${p.name}${isLow?` <span style="font-size:10px;color:#5ec47a;font-weight:500;margin-left:4px">LOW MAN</span>`:''}</div>
          <div style="font-size:11px;color:var(--mut)">${p.hc} hdcp${isLow?' — benchmark':strk>0?` — gets ${strk} from ${lowPlayer?.name||'low man'}`:''}</div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px">
        ${adjusted?`<div style="width:7px;height:7px;border-radius:50%;background:var(--gold);flex-shrink:0"></div>`:''}
        <div style="background:${isLow?'rgba(94,196,122,.1)':'rgba(201,168,75,.15)'};border:1px solid ${isLow?'rgba(94,196,122,.25)':'rgba(201,168,75,.3)'};border-radius:20px;padding:5px 14px;font-size:14px;font-weight:700;color:${isLow?'#5ec47a':'var(--gold)'};white-space:nowrap">${isLow?'0 strokes':`+${strk} strokes`}</div>
      </div>
    </div>`;
    }).join('')}
  </div>

  <!-- DETAIL TOGGLE -->
  <div onclick="toggleStrokeDetail()" id="stroke-toggle" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;margin-bottom:20px;cursor:pointer;border:1px dashed rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.02)">
    <span id="stroke-toggle-icon" style="font-size:14px;color:#4a6652;transition:transform .25s">▼</span>
    <span style="font-size:13px;color:var(--mut)"><span id="stroke-toggle-label" style="color:var(--gold);font-weight:500">Show hole-by-hole breakdown</span> — which holes each stroke applies</span>
  </div>

  <!-- DETAIL PANEL -->
  <div id="stroke-detail-panel" style="display:none;flex-direction:column;gap:10px;margin-bottom:20px">
    ${active.map(p=>{
      const i=p.idx;
      const strk=S.strokes[i];
      const auto=Math.max(0,p.hc-low);
      const adjusted=strk!==auto;
      const isLow=p.hc===low&&strk===0;
      const holes=strokeHoles(i);
      const strokeCount=holes.filter(Boolean).length;

      return `
    <div style="background:var(--card);border:1px solid ${adjusted?'rgba(201,168,75,.25)':'var(--brd)'};border-radius:12px;overflow:hidden">
      <!-- Header -->
      <div style="display:flex;align-items:center;justify-content:space-between;padding:11px 14px;border-bottom:1px solid rgba(255,255,255,.06)">
        <div style="display:flex;align-items:center;gap:10px">
          <div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;background:${PBG[i]};color:${PC[i]}">${getInitials(p.name)}</div>
          <div>
            <div style="font-size:14px;font-weight:600">${p.name}${isLow?' — Low Man':''}</div>
            <div style="font-size:11px;color:var(--mut)">${p.hc} hdcp — ${isLow?'0 strokes':`${p.hc} − ${low} = ${auto} strokes${adjusted?' (adjusted to '+strk+')':''}` }</div>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:6px">
          ${adjusted?`<span style="font-size:10px;color:var(--gold);background:rgba(201,168,75,.1);border:1px solid rgba(201,168,75,.2);border-radius:4px;padding:2px 7px">adjusted</span>`:''}
          <div style="background:${isLow?'rgba(94,196,122,.1)':'rgba(201,168,75,.15)'};border:1px solid ${isLow?'rgba(94,196,122,.25)':'rgba(201,168,75,.3)'};border-radius:20px;padding:4px 10px;font-size:12px;font-weight:700;color:${isLow?'#5ec47a':'var(--gold)'}">${isLow?'Scratch':`+${strk}`}</div>
        </div>
      </div>

      <!-- Explanation -->
      <div style="padding:9px 14px;font-size:12px;color:var(--mut);line-height:1.55;border-bottom:1px solid rgba(255,255,255,.04)">
        ${isLow
          ?`${p.name} is the <strong style="color:var(--txt)">low man</strong>. He plays to his handicap with no adjustment. Everyone else plays off him.`
          :`${p.name} <span style="color:var(--gold);font-weight:600">gets ${strk} strokes from ${lowPlayer?.name||'low man'}</span>.${adjusted?` <strong style="color:var(--txt)">Group adjusted from ${auto} → ${strk}.</strong>`:''} Net score reduced by 1 on the ${strk} hardest holes${strk>0?` (SI ${Array.from({length:18},(_,si)=>si+1).filter(si=>si<=strk).join(' and SI ')})`:''}.`
        }
      </div>

      ${!isLow&&strk>0?`
      <!-- Hole-by-hole grid -->
      <div style="padding:9px 14px;display:flex;flex-wrap:wrap;gap:4px">
        <div style="font-size:10px;color:#4a6652;width:100%;margin-bottom:4px;text-transform:uppercase;letter-spacing:.06em">Stroke holes highlighted</div>
        ${Array.from({length:18},(_,h)=>{
          const gets=holes[h];
          return `<div style="width:26px;height:26px;border-radius:5px;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600;${gets
            ?'background:rgba(201,168,75,.18);border:1px solid rgba(201,168,75,.3);color:var(--gold)'
            :'background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.05);color:#2d4035'
          }">${h+1}</div>`;
        }).join('')}
      </div>`:''}

      <!-- Adjust stepper -->
      ${isLow?'':`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:9px 14px;border-top:1px solid rgba(255,255,255,.05)">
        <div style="font-size:11px;color:#4a6652">${adjusted?'Manually adjusted':'Adjust if group agrees'}</div>
        <div style="display:flex;align-items:center">
          <button onclick="adjStrokeConfirm(${i},-1)" style="width:30px;height:30px;border-radius:7px;background:#1a2e1d;border:1px solid rgba(255,255,255,.12);color:var(--txt);font-size:17px;font-weight:300;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;font-family:Outfit,sans-serif">−</button>
          <div style="width:38px;text-align:center;font-size:15px;font-weight:700;color:var(--gold)">${strk}</div>
          <button onclick="adjStrokeConfirm(${i},1)" style="width:30px;height:30px;border-radius:7px;background:#1a2e1d;border:1px solid rgba(255,255,255,.12);color:var(--txt);font-size:17px;font-weight:300;display:flex;align-items:center;justify-content:center;cursor:pointer;padding:0;font-family:Outfit,sans-serif">+</button>
        </div>
      </div>`}
    </div>`;
    }).join('')}
  </div>

  <button class="btn btn-gold" onclick="confirmStrokes()" style="font-size:16px;font-weight:700;padding:17px;border-radius:13px">Confirm & Start Round</button>
  <div style="text-align:center;font-size:11px;color:#4a6652;margin-top:10px">Stroke allocations visible anytime during the round</div>
  <div class="safe"></div>
</div>`;
}

window.toggleStrokeDetail=function(){
  const panel=document.getElementById('stroke-detail-panel');
  const icon=document.getElementById('stroke-toggle-icon');
  const label=document.getElementById('stroke-toggle-label');
  if(!panel) return;
  const isOpen=panel.style.display==='flex';
  panel.style.display=isOpen?'none':'flex';
  if(icon) icon.style.transform=isOpen?'':'rotate(180deg)';
  if(label) label.textContent=isOpen?'Show hole-by-hole breakdown':'Hide hole-by-hole breakdown';
};

window.adjStrokeConfirm=function(i,d){
  S.strokes[i]=Math.max(0,(S.strokes[i]||0)+d);
  renderStrokes();
  // Re-open detail panel since user was adjusting
  const panel=document.getElementById('stroke-detail-panel');
  const icon=document.getElementById('stroke-toggle-icon');
  const label=document.getElementById('stroke-toggle-label');
  if(panel){panel.style.display='flex';}
  if(icon){icon.style.transform='rotate(180deg)';}
  if(label){label.textContent='Hide hole-by-hole breakdown';}
};

window.confirmStrokes=function(){
  saveRound();
  nav('scorecard');
};

registerScreen('strokes', renderStrokes);
