import { S } from '../state.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { getGroupRounds } from '../rounds/rounds.js'
import { calculateLeaderboard } from './leaderboard.js'

function renderLeaderboard(){
  const el=ensureScr('leaderboard');
  const group=S.groups.find(g=>g.id===S.currentGroupId);
  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('home')">‹</button>
  <h2>Leaderboard</h2>
</div>
<div class="scroll">
  ${group?`<div style="font-size:12px;color:var(--mut);margin-bottom:16px">${group.name}</div>`:''}
  <div id="lb-content"><div style="text-align:center;color:var(--mut);padding:20px"><span class="spin">⛳</span> Loading...</div></div>
  <div class="safe"></div>
</div>`;
  loadLeaderboard();
}

async function loadLeaderboard(){
  const container=document.getElementById('lb-content');
  if(!container||!S.currentGroupId) return;
  try{
    const rounds=await getGroupRounds(S.currentGroupId, 200);
    if(!rounds.length){
      container.innerHTML=`<div class="empty-state"><div class="ei">🏆</div><p>No rounds yet.<br>Play some rounds to see the leaderboard.</p></div>`;
      return;
    }
    const lb=calculateLeaderboard(rounds);
    container.innerHTML=`
      <div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:12px">${rounds.length} round${rounds.length!==1?'s':''} played</div>
      ${lb.map((p,rank)=>`
      <div class="card" style="display:flex;align-items:center;gap:12px">
        <div class="lb-rank ${rank===0?'gold':'silver'}">${rank+1}</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:600">${p.name}</div>
          <div style="font-size:11px;color:var(--mut)">${p.roundsPlayed} round${p.roundsPlayed!==1?'s':''} · ${p.winRate}% win rate</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:20px;font-weight:700;color:${p.totalWinnings>0?'var(--green)':p.totalWinnings<0?'var(--red)':'var(--mut)'}">${p.totalWinnings>0?'+':''}$${Math.abs(Math.round(p.totalWinnings))}</div>
        </div>
      </div>`).join('')}
    `;
  }catch(e){
    container.innerHTML=`<div style="color:var(--red);text-align:center;padding:20px">Failed to load leaderboard.</div>`;
  }
}

registerScreen('leaderboard', renderLeaderboard);
