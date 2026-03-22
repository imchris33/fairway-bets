import { S } from '../state.js'
import { ensureScr, showToast } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { getGroupSettlements, markSettlementPaid, netDebts } from './debts.js'

function renderDebts(){
  const el=ensureScr('debts');
  const group=S.groups.find(g=>g.id===S.currentGroupId);
  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('home')">‹</button>
  <h2>Debts</h2>
</div>
<div class="scroll">
  ${group?`<div style="font-size:12px;color:var(--mut);margin-bottom:16px">${group.name}</div>`:''}
  <div id="debts-content"><div style="text-align:center;color:var(--mut);padding:20px"><span class="spin">⛳</span> Loading...</div></div>
  <div class="safe"></div>
</div>`;
  loadDebts();
}

async function loadDebts(){
  const container=document.getElementById('debts-content');
  if(!container||!S.currentGroupId) return;
  try{
    const settlements=await getGroupSettlements(S.currentGroupId);
    if(!settlements.length){
      container.innerHTML=`<div class="empty-state"><div class="ei">✅</div><p>All settled up!<br>No outstanding debts.</p></div>`;
      return;
    }

    const nets=netDebts(settlements);

    let html=`<div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:12px">Net balances</div>`;

    if(nets.length===0){
      html+=`<div class="card" style="text-align:center;padding:24px"><div style="font-size:14px;color:var(--mut)">Everyone's even!</div></div>`;
    }else{
      nets.forEach(d=>{
        html+=`<div class="debt-card">
          <div style="flex:1">
            <div style="font-size:14px;font-weight:600">${d.from}</div>
            <div style="font-size:11px;color:var(--mut)">owes</div>
            <div style="font-size:14px;font-weight:600;color:var(--gold)">${d.to}</div>
          </div>
          <div class="debt-amount">$${d.amount}</div>
        </div>`;
      });
    }

    // Individual settlements
    html+=`<div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin:20px 0 12px">Unpaid settlements</div>`;
    settlements.forEach(s=>{
      const date=new Date(s.rounds?.created_at||Date.now()).toLocaleDateString('en-US',{month:'short',day:'numeric'});
      html+=`<div class="card" style="display:flex;align-items:center;gap:10px;padding:12px">
        <div style="flex:1">
          <div style="font-size:12px;color:var(--mut)">${date}</div>
          <div style="font-size:13px">${s.from_user_name} → ${s.to_user_name}</div>
        </div>
        <div style="font-size:16px;font-weight:600;color:var(--gold)">$${s.amount}</div>
        <button class="debt-action" onclick="markPaid('${s.id}')">Paid</button>
      </div>`;
    });

    container.innerHTML=html;
  }catch(e){
    container.innerHTML=`<div style="color:var(--red);text-align:center;padding:20px">Failed to load debts.</div>`;
  }
}

window.markPaid=async function(id){
  try{
    await markSettlementPaid(id);
    showToast('Marked as paid','success');
    loadDebts();
  }catch(e){showToast('Failed: '+e.message);}
};

registerScreen('debts', renderDebts);
