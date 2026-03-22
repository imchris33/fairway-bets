import { S, blank18, clearRound, pushHistory, loadLocalDebts, addLocalDebts, markLocalDebtPaid } from '../state.js'
import { PC } from '../constants.js'
import { par3s, pn, ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { segNets, skinsCalc, mpWins, balances, simplify } from './betting.js'
import { loadSavedPlayers, addSavedPlayer, isPlayerSaved } from './saved-players.js'

function renderSummary(){nav('settlement');}

function renderSettlement(){
  const el=ensureScr('settlement');
  const bal=balances();
  const txns=simplify([...bal]);
  const activePl=S.players.filter(p=>p.name);
  const date=new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

  // Build winners list
  const winners=[];
  if(S.games.nassau.on){
    [{nets:segNets(0,8),label:'Nassau · Front 9',amt:S.games.nassau.front},
     {nets:segNets(9,17),label:'Nassau · Back 9',amt:S.games.nassau.back},
     {nets:segNets(0,17),label:'Nassau · Overall',amt:S.games.nassau.overall}
    ].forEach(({nets,label,amt})=>{
      if(nets.some(x=>x===null)||!amt)return;
      const mn=Math.min(...nets.filter(x=>x!==null));
      const ws=nets.reduce((a,x,i)=>x===mn&&S.players[i].name?[...a,i]:a,[]);
      if(ws.length===1)winners.push({game:label,name:pn(ws[0]),earn:`+$${amt*(activePl.length-1)}`,i:ws[0],push:false});
      else if(ws.length>1)winners.push({game:label,name:'Push — tied',earn:'$0',i:-1,push:true});
    });
  }
  if(S.games.skins.on){
    const sw=[0,0,0,0];skinsCalc().forEach(r=>{if(r.w!==null)sw[r.w]+=r.pot;});
    const tot=sw.reduce((a,b)=>a+b,0);
    if(tot>0){
      const mx=Math.max(...sw);
      const ws=sw.reduce((a,w,i)=>w===mx&&S.players[i].name?[...a,i]:a,[]);
      if(ws.length===1)winners.push({game:`Skins · ${sw[ws[0]]} skin${sw[ws[0]]>1?'s':''}`,name:pn(ws[0]),earn:`+$${sw[ws[0]]*S.games.skins.amt}`,i:ws[0],push:false});
    }
  }
  if(S.games.match.on){
    const mw=mpWins();const mx=Math.max(...mw);
    const ws=mw.reduce((a,w,i)=>w===mx&&S.players[i].name?[...a,i]:a,[]);
    if(ws.length===1)winners.push({game:`Match Play · ${mw[ws[0]]} holes`,name:pn(ws[0]),earn:`+$${S.games.match.amt*(activePl.length-1)}`,i:ws[0],push:false});
  }
  if(S.games.stroke.on){
    const tots=segNets(0,17);
    if(!tots.some(x=>x===null)){const mn=Math.min(...tots.filter(x=>x!==null));
    const ws=tots.reduce((a,x,i)=>x===mn&&S.players[i].name?[...a,i]:a,[]);
    if(ws.length===1)winners.push({game:`Stroke Play · net ${tots[ws[0]]}`,name:pn(ws[0]),earn:`+$${S.games.stroke.amt*(activePl.length-1)}`,i:ws[0],push:false});}
  }
  if(S.games.ctp.on){
    const ctpWins={};
    par3s().forEach(h=>{if(S.scores[h].ctp!==null){const w=S.scores[h].ctp;ctpWins[w]=(ctpWins[w]||0)+1;}});
    Object.entries(ctpWins).forEach(([wi,count])=>{
      winners.push({game:`Closest to Pin · ${count} hole${count>1?'s':''}`,name:pn(+wi),earn:`+$${S.games.ctp.amt*(activePl.length-1)*count}`,i:+wi,push:false});
    });
  }

  const balSorted=[...bal.map((b,i)=>({b,i}))].filter(x=>S.players[x.i].name).sort((a,b)=>b.b-a.b);

  el.innerHTML=`
<div style="background:linear-gradient(180deg,#0f2a1a 0%,#091510 60%);min-height:100vh;display:flex;flex-direction:column">

  <div style="height:3px;background:linear-gradient(90deg,#e0835a,#c9a84b,#5ec47a,#5a9ed6,#a07dd4)"></div>

  <div style="padding:36px 20px 20px;text-align:center;border-bottom:1px solid #1a3525">
    <div style="font-size:52px;line-height:1;margin-bottom:12px">⛳</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:32px;color:var(--gold);font-weight:700;line-height:1;margin-bottom:4px">Round Complete</div>
    <div style="font-size:12px;color:var(--mut);margin-bottom:16px">${date}</div>
    <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap">
      ${S.players.map((p,i)=>p.name?`<div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:4px 10px">
        <div style="width:6px;height:6px;border-radius:50%;background:${PC[i]}"></div>
        <span style="font-size:11px;color:var(--txt)">${p.name}</span>
      </div>`:'').join('')}
    </div>
  </div>

  <div style="padding:16px 20px;border-bottom:1px solid #1a3525">
    <div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:.09em;font-weight:600;margin-bottom:10px">Game winners</div>
    ${winners.length===0?`<div style="font-size:13px;color:var(--mut);text-align:center;padding:10px">No completed games</div>`:''}
    ${winners.map(w=>w.push
      ?`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:rgba(94,196,122,.06);border:1px solid rgba(94,196,122,.15);border-radius:10px;margin-bottom:6px">
          <div style="font-size:16px;width:24px;text-align:center">🤝</div>
          <div style="flex:1">
            <div style="font-size:9px;color:#5ec47a;text-transform:uppercase;letter-spacing:.05em;opacity:.8;margin-bottom:2px">${w.game}</div>
            <div style="font-size:13px;color:#5ec47a">${w.name}</div>
          </div>
          <div style="font-size:12px;color:#5ec47a">$0</div>
        </div>`
      :`<div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--card);border-radius:10px;margin-bottom:6px">
          <div style="font-size:16px;width:24px;text-align:center">🏆</div>
          <div style="flex:1">
            <div style="font-size:9px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;margin-bottom:2px">${w.game}</div>
            <div style="font-size:13px;font-weight:600;color:${PC[w.i]}">${w.name}</div>
          </div>
          <div style="font-size:13px;font-weight:600;color:var(--gold)">${w.earn}</div>
        </div>`
    ).join('')}
  </div>

  <div style="padding:16px 20px;border-bottom:1px solid #1a3525">
    <div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:.09em;font-weight:600;margin-bottom:10px">Net balances</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${balSorted.map(({b,i})=>`
      <div style="background:var(--card);border-radius:10px;padding:10px 12px;border-left:3px solid ${b>=0?'#5ec47a':'#d85050'}">
        <div style="font-size:12px;font-weight:600;color:${PC[i]};margin-bottom:4px">${pn(i)}</div>
        <div style="font-size:22px;font-weight:600;color:${b>0?'#5ec47a':b<0?'#d85050':'var(--mut)'};">${b>0?'+':''}$${Math.abs(Math.round(b))}</div>
        <div style="font-size:9px;color:var(--mut);margin-top:2px;text-transform:uppercase;letter-spacing:.05em">${b>0?'Collects':b<0?'Owes':'Even'}</div>
      </div>`).join('')}
    </div>
  </div>

  ${(()=>{
    const prev=loadLocalDebts().filter(d=>!d.paid);
    if(!prev.length) return '';
    const roundDates=[...new Set(prev.map(d=>d.date))];
    return `
  <div style="padding:16px 20px;border-bottom:1px solid #1a3525">
    <div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:.09em;font-weight:600;margin-bottom:10px">📋 Running tab — ${roundDates.length} previous round${roundDates.length>1?'s':''}</div>
    <div style="background:rgba(201,168,75,.04);border:1px solid rgba(201,168,75,.2);border-radius:12px;padding:12px;margin-bottom:4px">
      ${prev.map(d=>`
      <div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.04)">
        <div style="font-size:13px;color:var(--txt)">${d.from} → ${d.to} · <strong style="color:var(--gold)">$${d.amount}</strong></div>
        <div style="display:flex;align-items:center;gap:8px">
          <span style="font-size:10px;color:var(--mut)">${d.date}</span>
          <button onclick="markPrevDebtPaid('${d.id}')" style="padding:4px 10px;border-radius:6px;background:rgba(94,196,122,.1);border:1px solid rgba(94,196,122,.25);color:#5ec47a;font-size:11px;cursor:pointer;font-family:Outfit,sans-serif">Mark paid</button>
        </div>
      </div>`).join('')}
    </div>
  </div>`;
  })()}

  <div style="padding:16px 20px;flex:1">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px">
      <div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:.09em;font-weight:600">Settle up — this round</div>
      <div style="font-size:11px;color:var(--mut);background:var(--dim);padding:3px 8px;border-radius:5px">${txns.length} payment${txns.length!==1?'s':''}</div>
    </div>
    ${txns.length===0
      ?`<div style="text-align:center;padding:24px;background:var(--card);border-radius:12px">
          <div style="font-size:40px;margin-bottom:8px">🤝</div>
          <div style="font-size:14px;color:var(--mut)">Everyone's even!</div>
        </div>`
      :txns.map(t=>`
      <div style="display:flex;align-items:stretch;margin-bottom:8px;border-radius:12px;overflow:hidden;border:1px solid var(--brd)">
        <div style="flex:1;padding:12px 14px;background:var(--card)">
          <div style="font-size:9px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Pays</div>
          <div style="font-size:15px;font-weight:600;color:${PC[t.from]}">${pn(t.from)}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 10px;background:var(--card);gap:3px">
          <div style="font-size:12px;color:var(--mut)">→</div>
          <div style="font-size:22px;font-weight:700;color:var(--gold);line-height:1">$${t.amt}</div>
        </div>
        <div style="flex:1;padding:12px 14px;background:#1f3828;text-align:right">
          <div style="font-size:9px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">To</div>
          <div style="font-size:15px;font-weight:600;color:${PC[t.to]}">${pn(t.to)}</div>
        </div>
      </div>`).join('')}
  </div>

  ${(()=>{
    const unsaved=S.players.filter(p=>p.name&&!isPlayerSaved(p.name));
    return unsaved.length>0?`
  <div style="padding:0 20px 16px">
    <div id="save-players-card" style="background:rgba(201,168,75,.05);border:1px solid rgba(201,168,75,.2);border-radius:12px;padding:14px;margin-bottom:12px">
      <div style="font-size:13px;font-weight:500;color:var(--gold);margin-bottom:10px">Save these players for next time?</div>
      ${unsaved.map((p,ui)=>{
        const pi=S.players.indexOf(p);
        return `<label style="display:flex;align-items:center;gap:10px;padding:6px 0;cursor:pointer">
          <input type="checkbox" checked class="save-player-cb" data-pi="${pi}" style="accent-color:var(--gold);width:18px;height:18px">
          <span style="font-size:14px">${p.name}</span>
          <span style="font-size:11px;color:var(--mut)">${p.hc} hdcp</span>
        </label>`;
      }).join('')}
      <button onclick="saveSelectedPlayers()" class="btn btn-outline" style="margin-top:10px;padding:8px;font-size:13px;color:var(--gold);border-color:rgba(201,168,75,.3)">Save selected players</button>
    </div>
  </div>`:'';
  })()}

  ${S.guest?`
  <div style="padding:0 20px 16px">
    <div style="background:rgba(201,168,75,.08);border:1px solid rgba(201,168,75,.25);border-radius:12px;padding:16px;text-align:center;margin-bottom:12px">
      <div style="font-size:14px;color:var(--txt);margin-bottom:4px;line-height:1.5">Want to save this round and track your season?</div>
      <div style="font-size:12px;color:var(--mut);margin-bottom:12px">Create a free account</div>
      <button class="btn btn-outline" onclick="guestSignup()" style="padding:10px;font-size:13px;color:var(--gold);border-color:var(--gold)">Sign Up</button>
    </div>
  </div>`:''}
  <div style="padding:0 20px 16px">
    <button class="btn btn-gold" onclick="doneRound()" style="font-size:15px">✓ Everyone's Paid — Save Round</button>
    <button class="btn btn-ghost" onclick="openNineteenth()" style="margin-top:8px;font-size:14px">🍺 19th Hole — Settle at the Bar</button>
    <button class="btn btn-outline" onclick="shareRoundCard()" style="margin-top:8px;font-size:13px;color:var(--mut)">📤 Share Round Results</button>
  </div>
  <div class="safe"></div>
</div>`;
}

window.doneRound=async function(){
  const bal=balances();
  const txns=simplify([...bal]);
  const histEntry={
    date:new Date().toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}),
    players:S.players.map(p=>p.name).filter(Boolean),
    games:Object.entries(S.games).filter(([,v])=>v.on).map(([k])=>k),
    bal:[...bal],txns
  };
  pushHistory(histEntry);

  // Save debts locally for carry-forward tracking
  if(txns.length>0) addLocalDebts(txns);

  // Save to cloud if authenticated and in a group
  if(S.user && S.currentGroupId){
    try{
      const { saveCloudRound } = await import('../rounds/rounds.js');
      const roundData = {
        players: S.players.filter(p=>p.name).map((p,i)=>({name:p.name,hc:p.hc,strokes:S.strokes[i]})),
        scores: S.scores,
        holes: S.holes,
        games: S.games,
        balances: bal,
        transactions: txns
      };
      const { data: savedRound } = await saveCloudRound(S.currentGroupId, roundData);

      // Create settlement records
      if(savedRound && txns.length > 0){
        const { createSettlements } = await import('../debts/debts.js');
        const activePlayers = S.players.filter(p=>p.name);
        await createSettlements(savedRound.id, txns, activePlayers);
      }
    }catch(e){
      console.error('Cloud save failed:', e);
    }
  }

  clearRound();
  S.players=[{name:'',hc:0},{name:'',hc:0},{name:'',hc:0},{name:'',hc:0}];
  S.scores=blank18();
  nav('home');
};

window.markPrevDebtPaid=function(debtId){
  markLocalDebtPaid(debtId);
  renderSettlement();
};

window.saveSelectedPlayers=function(){
  const cbs=document.querySelectorAll('.save-player-cb:checked');
  cbs.forEach(cb=>{
    const pi=+cb.dataset.pi;
    const p=S.players[pi];
    if(p&&p.name) addSavedPlayer(p.name, p.hc, pi);
  });
  const card=document.getElementById('save-players-card');
  if(card) card.innerHTML=`<div style="text-align:center;padding:8px;font-size:13px;color:#5ec47a">✓ Players saved!</div>`;
};

window.guestSignup=function(){
  S.guest=false;
  nav('signup');
};

registerScreen('summary', renderSummary);
registerScreen('settlement', renderSettlement);
