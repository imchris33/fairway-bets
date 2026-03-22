import { S, saveGroupId } from '../state.js'
import { ensureScr, showToast } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { createGroup, joinGroup, getMyGroups, getGroupMembers, leaveGroup } from './groups.js'

async function loadGroups(){
  if(!S.user) return;
  try{
    S.groups = await getMyGroups(S.user.id);
    if(S.groups.length && !S.currentGroupId){
      S.currentGroupId = S.groups[0].id;
      saveGroupId();
    }
  }catch(e){ console.error('Failed to load groups:', e); }
}

function renderGroups(){
  const el=ensureScr('groups');
  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('home')">‹</button>
  <h2>My Groups</h2>
</div>
<div class="scroll">
  <div id="groups-list"><div style="text-align:center;color:var(--mut);padding:20px"><span class="spin">⛳</span> Loading...</div></div>
  <button class="btn btn-gold" onclick="nav('create-group')" style="margin-top:16px">Create a Group</button>
  <button class="btn btn-outline" onclick="nav('join-group')">Join with Invite Code</button>
  <div class="safe"></div>
</div>`;
  renderGroupsList();
}

async function renderGroupsList(){
  await loadGroups();
  const container=document.getElementById('groups-list');
  if(!container) return;
  if(!S.groups.length){
    container.innerHTML=`<div class="empty-state"><div class="ei">👥</div><p>No groups yet.<br>Create one or join with an invite code.</p></div>`;
    return;
  }
  container.innerHTML=S.groups.map(g=>`
    <div class="group-card" onclick="selectGroup('${g.id}')">
      <div style="display:flex;align-items:center;gap:8px">
        <div class="group-name" style="flex:1">${g.name}</div>
        ${g.id===S.currentGroupId?`<div style="font-size:10px;color:var(--gold);background:rgba(201,168,75,.12);padding:2px 8px;border-radius:4px">Active</div>`:''}
      </div>
      <div class="group-meta">${g.role} · Code: ${g.invite_code}</div>
    </div>`).join('');
}

window.selectGroup=function(id){
  S.currentGroupId=id;
  saveGroupId();
  nav('group-detail');
};

function renderCreateGroup(){
  const el=ensureScr('create-group');
  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('groups')">‹</button>
  <h2>New Group</h2>
</div>
<div class="scroll">
  <div class="card">
    <div style="font-size:12px;color:var(--mut);margin-bottom:4px">Group Name</div>
    <input type="text" id="group-name" placeholder="e.g. Saturday Foursome" style="width:100%;margin-bottom:16px">
    <button class="btn btn-gold" id="create-group-btn">Create Group</button>
  </div>
  <div class="safe"></div>
</div>`;
  document.getElementById('create-group-btn').onclick=async()=>{
    const name=document.getElementById('group-name').value.trim();
    if(!name){showToast('Please enter a group name');return;}
    document.getElementById('create-group-btn').textContent='Creating...';
    try{
      const group=await createGroup(name, S.user.id);
      S.groups.push({...group, role:'owner'});
      S.currentGroupId=group.id;
      saveGroupId();
      showToast('Group created!','success');
      nav('group-detail');
    }catch(e){
      showToast('Failed: '+e.message);
      document.getElementById('create-group-btn').textContent='Create Group';
    }
  };
}

function renderJoinGroup(){
  const el=ensureScr('join-group');
  // Check for code in URL
  const params=new URLSearchParams(window.location.search);
  const urlCode=params.get('code')||'';

  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('groups')">‹</button>
  <h2>Join Group</h2>
</div>
<div class="scroll">
  <div class="card">
    <div style="font-size:12px;color:var(--mut);margin-bottom:4px">Invite Code</div>
    <input type="text" id="join-code" placeholder="e.g. ABC123" value="${urlCode}" style="width:100%;text-transform:uppercase;font-size:18px;letter-spacing:.1em;text-align:center;margin-bottom:16px">
    <button class="btn btn-gold" id="join-group-btn">Join Group</button>
  </div>
  <div class="safe"></div>
</div>`;
  document.getElementById('join-group-btn').onclick=async()=>{
    const code=document.getElementById('join-code').value.trim();
    if(!code){showToast('Please enter an invite code');return;}
    document.getElementById('join-group-btn').textContent='Joining...';
    try{
      const group=await joinGroup(code, S.user.id);
      await loadGroups();
      S.currentGroupId=group.id;
      saveGroupId();
      showToast('Joined group!','success');
      nav('group-detail');
    }catch(e){
      showToast(e.message);
      document.getElementById('join-group-btn').textContent='Join Group';
    }
  };
  // Auto-join if code from URL
  if(urlCode) document.getElementById('join-group-btn').click();
}

function renderGroupDetail(){
  const el=ensureScr('group-detail');
  const group=S.groups.find(g=>g.id===S.currentGroupId);
  if(!group){nav('groups');return;}

  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('home')">‹</button>
  <h2>${group.name}</h2>
</div>
<div class="scroll">
  <div class="card">
    <div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:8px">Invite Code</div>
    <div style="display:flex;align-items:center;gap:12px">
      <div class="invite-code">${group.invite_code}</div>
      <button class="btn btn-ghost" style="width:auto;padding:8px 14px" onclick="copyInvite('${group.invite_code}')">Copy Link</button>
    </div>
  </div>

  <div class="card">
    <div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:10px">Members</div>
    <div id="members-list"><div style="color:var(--mut);font-size:13px"><span class="spin">⛳</span> Loading...</div></div>
  </div>

  <button class="btn btn-outline" onclick="nav('groups')">All Groups</button>
  ${group.role!=='owner'?`<button class="btn btn-danger" style="margin-top:16px" onclick="leaveCurrentGroup()">Leave Group</button>`:''}
  <div class="safe"></div>
</div>`;
  loadMembers();
}

async function loadMembers(){
  if(!S.currentGroupId) return;
  try{
    const members=await getGroupMembers(S.currentGroupId);
    const container=document.getElementById('members-list');
    if(!container) return;
    container.innerHTML=members.map(m=>`
      <div style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid var(--brd)">
        <div style="width:32px;height:32px;border-radius:50%;background:var(--dim);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:var(--gold)">${(m.name||'?')[0].toUpperCase()}</div>
        <div style="flex:1">
          <div style="font-size:14px;font-weight:500">${m.name||'Unknown'}</div>
          <div style="font-size:11px;color:var(--mut)">HC ${m.handicap||0} · ${m.role}</div>
        </div>
      </div>`).join('');
  }catch(e){
    const container=document.getElementById('members-list');
    if(container) container.innerHTML=`<div style="color:var(--mut);font-size:13px">Could not load members.</div>`;
  }
}

window.copyInvite=async function(code){
  const link=`${window.location.origin}/join?code=${code}`;
  try{
    if(navigator.share){
      await navigator.share({title:'Join my Fairway Bets group',text:`Join my golf betting group on Fairway Bets!`,url:link});
    }else{
      await navigator.clipboard.writeText(link);
      showToast('Invite link copied!','success');
    }
  }catch(e){
    try{await navigator.clipboard.writeText(link);showToast('Link copied!','success');}
    catch(e2){showToast('Could not copy link');}
  }
};

window.leaveCurrentGroup=async function(){
  if(!confirm('Leave this group?'))return;
  try{
    await leaveGroup(S.currentGroupId,S.user.id);
    S.groups=S.groups.filter(g=>g.id!==S.currentGroupId);
    S.currentGroupId=S.groups[0]?.id||null;
    saveGroupId();
    showToast('Left group','success');
    nav('groups');
  }catch(e){showToast('Failed: '+e.message);}
};

export { loadGroups };
registerScreen('groups', renderGroups);
registerScreen('create-group', renderCreateGroup);
registerScreen('join-group', renderJoinGroup);
registerScreen('group-detail', renderGroupDetail);
