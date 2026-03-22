import { S } from '../state.js'
import { PC } from '../constants.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { getGroupRounds } from './rounds.js'

function renderCloudHistory(){
  const el=ensureScr('cloud-history');
  const group=S.groups.find(g=>g.id===S.currentGroupId);
  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('home')">‹</button>
  <h2>Group Rounds</h2>
</div>
<div class="scroll">
  <div id="cloud-rounds"><div style="text-align:center;color:var(--mut);padding:20px"><span class="spin">⛳</span> Loading...</div></div>
  <div class="safe"></div>
</div>`;
  loadCloudRounds();
}

async function loadCloudRounds(){
  const container=document.getElementById('cloud-rounds');
  if(!container||!S.currentGroupId) return;
  try{
    const rounds=await getGroupRounds(S.currentGroupId);
    if(!rounds.length){
      container.innerHTML=`<div class="empty-state"><div class="ei">📋</div><p>No group rounds yet.<br>Complete a round and it'll appear here.</p></div>`;
      return;
    }
    container.innerHTML=rounds.map(r=>{
      const d=r.data||{};
      const players=d.players||[];
      const bals=d.balances||[];
      const txns=d.transactions||[];
      const date=new Date(r.created_at).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
      const games=d.games?Object.entries(d.games).filter(([,v])=>v.on).map(([k])=>k):[];
      const gname={nassau:'Nassau',skins:'Skins',match:'Match',stroke:'Stroke',ctp:'CTP'};
      return `<div class="hist-item" onclick="viewRound('${r.id}')">
        <div class="hist-date">${date}</div>
        <div class="hist-names">${players.map(p=>p.name).join(' · ')}</div>
        <div class="hist-tags">${games.map(g=>`<span class="hist-tag">${gname[g]||g}</span>`).join('')}</div>
        <div class="hist-bals">${bals.map((b,i)=>players[i]?`
          <span style="font-size:13px">
            <span style="color:${PC[i%PC.length]}">${players[i].name}</span>
            <span style="color:${b>0?'var(--gold)':b<0?'var(--red)':'var(--mut)'};margin-left:4px">${b>0?'+':''}$${Math.abs(Math.round(b))}</span>
          </span>`:'').join('')}</div>
      </div>`;
    }).join('');
  }catch(e){
    container.innerHTML=`<div style="color:var(--red);text-align:center;padding:20px">Failed to load rounds.</div>`;
  }
}

window.viewRound=function(id){
  // Store round ID for detail view
  S._viewRoundId=id;
  nav('round-detail');
};

registerScreen('cloud-history', renderCloudHistory);
