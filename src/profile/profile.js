import { supabase } from '../supabase.js'

export async function getProfile(userId){
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if(error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
  return data;
}

export async function upsertProfile(userId, updates){
  const { data, error } = await supabase
    .from('profiles')
    .upsert({ id: userId, ...updates })
    .select()
    .single();
  if(error) throw error;
  return data;
}

export async function createProfileIfNeeded(user){
  const existing = await getProfile(user.id);
  if(existing) return existing;
  const name = user.email?.split('@')[0] || 'Player';
  return upsertProfile(user.id, { name, handicap: 0 });
}
