import { S, blank18, clearRound, pushHistory } from '../state.js'
import { PC } from '../constants.js'
import { pn, ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { balances, simplify } from './betting.js'

let _paidState={}; // track which txns are marked paid by index

function renderNineteenth(){
  const el=ensureScr('nineteenth');
  const bal=balances();
  const txns=simplify([...bal]);
  const allPaid=txns.length>0&&txns.every((_,i)=>_paidState[i]);

  el.innerHTML=`
<div style="background:linear-gradient(180deg,#0f2a1a 0%,#091510 60%);min-height:100vh;display:flex;flex-direction:column">
  <div style="height:3px;background:linear-gradient(90deg,#e0835a,#c9a84b,#5ec47a,#5a9ed6,#a07dd4)"></div>

  <div style="padding:16px 20px 8px;display:flex;align-items:center;justify-content:space-between">
    <button onclick="nav('settlement')" style="background:none;border:none;color:var(--mut);font-size:13px;cursor:pointer;padding:4px 0;font-family:Outfit,sans-serif">‹ Back to summary</button>
    <div style="font-size:11px;color:var(--mut)">🍺 19th Hole</div>
  </div>

  <div style="padding:12px 20px 8px;text-align:center">
    <div style="font-size:40px;margin-bottom:8px">🍺</div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:26px;color:var(--gold);font-weight:700;margin-bottom:4px">Settle at the Bar</div>
    <div style="font-size:12px;color:var(--mut)">${txns.length} payment${txns.length!==1?'s':''} to clear everyone</div>
  </div>

  <div style="padding:16px 20px;flex:1">
    ${txns.length===0?`
    <div style="text-align:center;padding:40px 20px">
      <div style="font-size:48px;margin-bottom:12px">🤝</div>
      <div style="font-family:Georgia,serif;font-size:20px;color:var(--txt);margin-bottom:4px">Everyone's even!</div>
      <div style="font-size:13px;color:var(--mut)">No payments needed this round</div>
    </div>`
    :txns.map((t,i)=>{
      const paid=_paidState[i];
      const fromName=pn(t.from);
      const toName=pn(t.to);
      const venmoUrl=`venmo://paycharge?txn=pay&recipients=${encodeURIComponent(toName)}&amount=${t.amt}&note=${encodeURIComponent('Fairway Bets')}`;
      return `
    <div style="background:var(--card);border:1px solid var(--brd);border-radius:16px;padding:24px 20px;margin-bottom:16px;text-align:center;${paid?'opacity:.5':''}">
      <!-- Player names -->
      <div style="display:flex;align-items:center;justify-content:center;gap:20px;margin-bottom:6px">
        <div>
          <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:${PC[t.from]}">${fromName}</div>
          <div style="font-size:11px;color:var(--mut);margin-top:2px">pays</div>
        </div>
        <div style="font-size:20px;color:var(--mut)">→</div>
        <div>
          <div style="font-family:Georgia,serif;font-size:28px;font-weight:700;color:${PC[t.to]}">${toName}</div>
          <div style="font-size:11px;color:var(--mut);margin-top:2px">receives</div>
        </div>
      </div>

      <!-- Amount -->
      <div style="font-family:Georgia,serif;font-size:52px;font-weight:700;color:#c9a84b;margin:16px 0 8px">$${t.amt}</div>

      <!-- Buttons -->
      ${paid
        ?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;padding:12px;color:#5ec47a;font-size:14px;font-weight:600">✓ Paid</div>`
        :`<div style="display:flex;gap:10px;margin-top:16px">
          <button onclick="markTxnPaid(${i})" style="flex:1;padding:14px;border-radius:10px;background:rgba(94,196,122,.1);border:1px solid rgba(94,196,122,.3);color:#5ec47a;font-size:14px;font-weight:600;cursor:pointer;font-family:Outfit,sans-serif">Mark as paid</button>
          <a href="${venmoUrl}" style="padding:14px 18px;border-radius:10px;background:#1a2e1d;border:2px solid rgba(255,255,255,.15);color:var(--txt);font-size:14px;font-weight:500;text-decoration:none;display:flex;align-items:center;gap:4px;font-family:Outfit,sans-serif">Venmo ›</a>
        </div>`
      }
    </div>`;
    }).join('')}

    ${allPaid?`
    <div style="text-align:center;padding:20px 0">
      <div style="font-size:48px;margin-bottom:12px">🎉</div>
      <div style="font-family:Georgia,serif;font-size:22px;color:var(--txt);margin-bottom:4px">All settled up!</div>
      <div style="font-size:14px;color:var(--mut);margin-bottom:20px">Great round — see you next week.</div>
      <button onclick="shareFromNineteenth()" class="btn btn-outline" style="padding:12px;font-size:14px">📤 Share Round Results</button>
    </div>`:''}
  </div>
  <div class="safe"></div>
</div>`;
}

window.markTxnPaid=function(i){
  _paidState[i]=true;
  renderNineteenth();
};

window.shareFromNineteenth=function(){
  // Will be implemented in Feature 4
  if(window.shareRoundCard) window.shareRoundCard();
};

window.openNineteenth=function(){
  _paidState={};
  nav('nineteenth');
};

registerScreen('nineteenth', renderNineteenth);
