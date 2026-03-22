import { PC } from '../constants.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { getRound } from '../rounds/rounds.js'
import { S } from '../state.js'

function renderSharedRound(){
  const el=ensureScr('shared-round');
  el.innerHTML=`
<div style="background:linear-gradient(180deg,#0f2a1a 0%,#091510 60%);min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center">
  <div style="color:var(--mut);font-size:14px"><span class="spin">⛳</span> Loading round...</div>
</div>`;
  loadSharedRound(el);
}

async function loadSharedRound(el){
  const roundId = S._viewRoundId || window.location.pathname.split('/round/')[1];
  if(!roundId){el.innerHTML=`<div class="auth-container"><div style="color:var(--red)">Round not found.</div></div>`;return;}

  try{
    const round=await getRound(roundId);
    const d=round.data||{};
    const players=d.players||[];
    const bals=d.balances||[];
    const txns=d.transactions||[];
    const date=new Date(round.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});

    const balSorted=[...bals.map((b,i)=>({b,i}))].filter(x=>players[x.i]).sort((a,b)=>b.b-a.b);

    el.innerHTML=`
<div style="background:linear-gradient(180deg,#0f2a1a 0%,#091510 60%);min-height:100vh;display:flex;flex-direction:column">
  <div style="height:3px;background:linear-gradient(90deg,#e0835a,#c9a84b,#5ec47a,#5a9ed6,#a07dd4)"></div>
  <div style="padding:36px 20px 20px;text-align:center;border-bottom:1px solid #1a3525">
    <div style="font-size:52px;line-height:1;margin-bottom:12px">⛳</div>
    <div style="font-family:'Cormorant Garamond',serif;font-size:32px;color:var(--gold);font-weight:700;line-height:1;margin-bottom:4px">Round Results</div>
    <div style="font-size:12px;color:var(--mut);margin-bottom:16px">${date}</div>
    <div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap">
      ${players.map((p,i)=>`<div style="display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.08);border-radius:20px;padding:4px 10px">
        <div style="width:6px;height:6px;border-radius:50%;background:${PC[i%PC.length]}"></div>
        <span style="font-size:11px;color:var(--txt)">${p.name}</span>
      </div>`).join('')}
    </div>
  </div>

  <div style="padding:16px 20px;border-bottom:1px solid #1a3525">
    <div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:.09em;font-weight:600;margin-bottom:10px">Net balances</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
      ${balSorted.map(({b,i})=>`
      <div style="background:var(--card);border-radius:10px;padding:10px 12px;border-left:3px solid ${b>=0?'#5ec47a':'#d85050'}">
        <div style="font-size:12px;font-weight:600;color:${PC[i%PC.length]};margin-bottom:4px">${players[i]?.name||'?'}</div>
        <div style="font-size:22px;font-weight:600;color:${b>0?'#5ec47a':b<0?'#d85050':'var(--mut)'};">${b>0?'+':''}$${Math.abs(Math.round(b))}</div>
        <div style="font-size:9px;color:var(--mut);margin-top:2px;text-transform:uppercase;letter-spacing:.05em">${b>0?'Collects':b<0?'Owes':'Even'}</div>
      </div>`).join('')}
    </div>
  </div>

  <div style="padding:16px 20px;flex:1">
    <div style="font-size:9px;color:var(--gold);text-transform:uppercase;letter-spacing:.09em;font-weight:600;margin-bottom:10px">Settle up</div>
    ${txns.length===0
      ?`<div style="text-align:center;padding:24px;background:var(--card);border-radius:12px">
          <div style="font-size:40px;margin-bottom:8px">🤝</div>
          <div style="font-size:14px;color:var(--mut)">Everyone's even!</div>
        </div>`
      :txns.map(t=>`
      <div style="display:flex;align-items:stretch;margin-bottom:8px;border-radius:12px;overflow:hidden;border:1px solid var(--brd)">
        <div style="flex:1;padding:12px 14px;background:var(--card)">
          <div style="font-size:9px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">Pays</div>
          <div style="font-size:15px;font-weight:600;color:${PC[t.from%PC.length]}">${players[t.from]?.name||'?'}</div>
        </div>
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 10px;background:var(--card);gap:3px">
          <div style="font-size:12px;color:var(--mut)">→</div>
          <div style="font-size:22px;font-weight:700;color:var(--gold);line-height:1">$${t.amt}</div>
        </div>
        <div style="flex:1;padding:12px 14px;background:#1f3828;text-align:right">
          <div style="font-size:9px;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;margin-bottom:4px">To</div>
          <div style="font-size:15px;font-weight:600;color:${PC[t.to%PC.length]}">${players[t.to]?.name||'?'}</div>
        </div>
      </div>`).join('')}
  </div>

  <div style="padding:16px 20px;text-align:center">
    <div style="font-size:12px;color:var(--mut);margin-bottom:8px">Fairway Bets · fairwaybets.golf</div>
    ${S.user?`<button class="btn btn-outline" onclick="nav('home')">Back to App</button>`:`<button class="btn btn-gold" onclick="nav('login')">Sign In to Fairway Bets</button>`}
  </div>
  <div class="safe"></div>
</div>`;
  }catch(e){
    el.innerHTML=`<div class="auth-container"><div style="color:var(--red);text-align:center">Could not load this round.<br><br><button class="btn btn-outline" style="width:auto" onclick="nav('login')">Go to App</button></div></div>`;
  }
}

registerScreen('shared-round', renderSharedRound);
registerScreen('round-detail', renderSharedRound);
