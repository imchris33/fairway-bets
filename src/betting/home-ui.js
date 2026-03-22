import { S, blank18, clearRound } from '../state.js'
import { SI } from '../constants.js'
import { hasRound, ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'

function renderHome(){
  const el=ensureScr('home');
  const r=hasRound();
  const isGuest = S.guest;
  const userName = S.profile?.name || '';
  const hasGroup = !isGuest && S.currentGroupId && S.groups.length > 0;
  const currentGroup = hasGroup ? S.groups.find(g=>g.id===S.currentGroupId) : null;

  el.innerHTML=`
<div class="hero">
  <div class="hero-logo">⛳</div>
  <div class="hero-title">Fairway<br>Bets</div>
  <div class="hero-sub">Golf · Wagers · Settled</div>
  ${isGuest?`<div style="font-size:13px;color:var(--mut);margin-bottom:4px">Playing as Guest</div><button class="auth-link" onclick="exitGuestMode()" style="font-size:12px;margin-bottom:8px">Sign In</button>`
    :userName?`<div style="font-size:13px;color:var(--mut);margin-bottom:8px">Welcome, ${userName}</div>`:''}
  ${r?`<div class="resume-pill"><span class="resume-dot"></span> Round in progress</div>`:''}
</div>
<div style="padding:0 20px 20px">
  ${hasGroup?`
  <div style="margin-bottom:16px">
    <div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:6px">Current Group</div>
    <button class="btn btn-outline" onclick="nav('group-detail')" style="padding:12px;text-align:left">
      <span style="font-weight:600">${currentGroup?.name||'Group'}</span>
      <span style="color:var(--mut);font-size:12px;margin-left:8px">▸</span>
    </button>
  </div>`:''}
  ${r?`<button class="btn btn-gold" onclick="nav('scorecard')">Resume Round</button>`:''}
  <button class="btn ${r?'btn-outline':'btn-gold'}" onclick="newRound()">New Round</button>
  ${hasGroup?`
  <button class="btn btn-outline" onclick="nav('leaderboard')">Leaderboard</button>
  <button class="btn btn-outline" onclick="nav('debts')">Debts</button>
  `:''}
  <button class="btn btn-outline" onclick="nav('history')">Past Rounds</button>
  ${isGuest?'':`
  <button class="btn btn-outline" onclick="nav('groups')">My Groups</button>
  <button class="btn btn-ghost" onclick="nav('profile')" style="margin-top:8px">Profile</button>
  `}
  ${r?`<button class="btn btn-danger" style="margin-top:20px" onclick="abandon()">Abandon Current Round</button>`:''}
  ${isGuest
    ?`<button class="btn btn-outline" onclick="exitGuestMode()" style="margin-top:16px">Create Account / Sign In</button>`
    :`<button class="btn btn-ghost" onclick="signOutUser()" style="margin-top:8px;font-size:13px;color:var(--mut)">Sign Out</button>`}
  <div class="safe"></div>
</div>`;
}

window.newRound=function(){
  S.players=[{name:'',hc:0},{name:'',hc:0},{name:'',hc:0},{name:'',hc:0}];
  S.strokes=[0,0,0,0];
  S.scores=blank18();
  S.holes=Array(18).fill(null).map((_,i)=>({par:4,si:SI[i]}));
  S.games={nassau:{on:true,front:10,back:10,overall:20},skins:{on:true,amt:5},match:{on:false,amt:50},stroke:{on:false,amt:20},ctp:{on:true,amt:10}};
  // Auto-fill player 1 from profile
  if(S.profile){
    S.players[0].name=S.profile.name||'';
    S.players[0].hc=S.profile.handicap||0;
  }
  nav('setup');
};

window.abandon=function(){
  if(!confirm('Abandon this round? All scores will be lost.'))return;
  clearRound();S.players=[{name:'',hc:0},{name:'',hc:0},{name:'',hc:0},{name:'',hc:0}];S.scores=blank18();
  nav('home');
};

window.signOutUser=async function(){
  const { supabase } = await import('../supabase.js');
  if(supabase) await supabase.auth.signOut();
  S.user=null;S.profile=null;S.groups=[];S.currentGroupId=null;S.guest=false;
  nav('login');
};

window.exitGuestMode=function(){
  S.guest=false;
  nav('login');
};

registerScreen('home', renderHome);
