import { supabase } from '../supabase.js'

function generateCode(){
  const chars='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code='';
  for(let i=0;i<6;i++) code+=chars[Math.floor(Math.random()*chars.length)];
  return code;
}

export async function createGroup(name, userId){
  let invite_code=generateCode();
  // Try up to 3 times for unique code
  for(let attempt=0;attempt<3;attempt++){
    const { data, error } = await supabase
      .from('groups')
      .insert({ name, invite_code, created_by: userId })
      .select()
      .single();
    if(!error){
      // Add creator as owner
      await supabase.from('group_members').insert({
        group_id: data.id,
        user_id: userId,
        role: 'owner'
      });
      return data;
    }
    if(error.code==='23505') invite_code=generateCode(); // unique violation
    else throw error;
  }
  throw new Error('Could not generate unique invite code');
}

export async function joinGroup(code, userId){
  const { data: group, error: gErr } = await supabase
    .from('groups')
    .select('*')
    .eq('invite_code', code.toUpperCase().trim())
    .single();
  if(gErr) throw new Error('Group not found. Check the invite code.');

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', group.id)
    .eq('user_id', userId)
    .single();
  if(existing) return group; // already a member

  const { error: jErr } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, user_id: userId, role: 'member' });
  if(jErr) throw jErr;
  return group;
}

export async function getMyGroups(userId){
  const { data, error } = await supabase
    .from('group_members')
    .select('group_id, role, groups(id, name, invite_code, created_at)')
    .eq('user_id', userId);
  if(error) throw error;
  return (data||[]).map(m=>({...m.groups, role: m.role}));
}

export async function getGroupMembers(groupId){
  const { data, error } = await supabase
    .from('group_members')
    .select('user_id, role, joined_at, profiles(id, name, handicap)')
    .eq('group_id', groupId);
  if(error) throw error;
  return (data||[]).map(m=>({...m.profiles, role: m.role, joined_at: m.joined_at}));
}

export async function leaveGroup(groupId, userId){
  const { error } = await supabase
    .from('group_members')
    .delete()
    .eq('group_id', groupId)
    .eq('user_id', userId);
  if(error) throw error;
}
