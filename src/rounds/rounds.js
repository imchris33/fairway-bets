import { supabase } from '../supabase.js'
import { S } from '../state.js'

export async function saveCloudRound(groupId, roundData){
  const { data, error } = await supabase
    .from('rounds')
    .insert({
      group_id: groupId,
      created_by: S.user.id,
      data: roundData
    })
    .select()
    .single();
  if(error) throw error;
  return { data };
}

export async function getGroupRounds(groupId, limit=50){
  const { data, error } = await supabase
    .from('rounds')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if(error) throw error;
  return data||[];
}

export async function getRound(roundId){
  const { data, error } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();
  if(error) throw error;
  return data;
}
