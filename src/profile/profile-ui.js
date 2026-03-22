import { S } from '../state.js'
import { ensureScr, showToast } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { upsertProfile } from './profile.js'

function renderProfile(){
  const el=ensureScr('profile');
  const p=S.profile||{};
  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('home')">‹</button>
  <h2>Profile</h2>
</div>
<div class="scroll">
  <div class="card">
    <div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:12px">Your Info</div>
    <div style="margin-bottom:12px">
      <div style="font-size:12px;color:var(--mut);margin-bottom:4px">Name</div>
      <input type="text" id="profile-name" value="${p.name||''}" placeholder="Your name" style="width:100%">
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:12px;color:var(--mut);margin-bottom:4px">Handicap (0–54)</div>
      <input type="number" id="profile-hc" min="0" max="54" value="${p.handicap||0}" style="width:100px">
    </div>
    <div style="margin-bottom:12px">
      <div style="font-size:12px;color:var(--mut);margin-bottom:4px">Email</div>
      <div style="font-size:14px;color:var(--txt);padding:10px 0">${S.user?.email||''}</div>
    </div>
    <button class="btn btn-gold" id="save-profile-btn">Save Profile</button>
  </div>
  <div class="safe"></div>
</div>`;
  document.getElementById('save-profile-btn').onclick=async()=>{
    const name=document.getElementById('profile-name').value.trim();
    const handicap=Math.max(0,Math.min(54,+document.getElementById('profile-hc').value||0));
    if(!name){showToast('Please enter a name');return;}
    document.getElementById('save-profile-btn').textContent='Saving...';
    try{
      const updated=await upsertProfile(S.user.id,{name,handicap});
      S.profile=updated;
      showToast('Profile saved','success');
      document.getElementById('save-profile-btn').textContent='Save Profile';
    }catch(e){
      showToast('Failed to save: '+e.message);
      document.getElementById('save-profile-btn').textContent='Save Profile';
    }
  };
}

registerScreen('profile', renderProfile);
