import { supabase } from '../supabase.js'
import { S } from '../state.js'

export async function createSettlements(roundId, transactions, players){
  // Map player indices to user IDs if we can match by name
  // For now, store player names since not all players may be app users
  const rows = transactions.map(t=>({
    round_id: roundId,
    from_user_name: players[t.from]?.name || `P${t.from+1}`,
    to_user_name: players[t.to]?.name || `P${t.to+1}`,
    from_user: null, // Will be null until we can map to user IDs
    to_user: null,
    amount: t.amt,
    paid: false
  }));

  const { error } = await supabase.from('settlements').insert(rows);
  if(error) console.error('Settlement insert error:', error);
}

export async function getGroupSettlements(groupId){
  // Get all settlements for rounds in this group
  const { data, error } = await supabase
    .from('settlements')
    .select('*, rounds!inner(group_id, created_at, data)')
    .eq('rounds.group_id', groupId)
    .eq('paid', false)
    .order('created_at', { foreignTable: 'rounds', ascending: false });
  if(error) throw error;
  return data||[];
}

export async function markSettlementPaid(settlementId){
  const { error } = await supabase
    .from('settlements')
    .update({ paid: true, paid_at: new Date().toISOString() })
    .eq('id', settlementId);
  if(error) throw error;
}

export function netDebts(settlements){
  // Aggregate all unpaid settlements into net debts between pairs
  const pairs={};
  settlements.forEach(s=>{
    const from=s.from_user_name||'Unknown';
    const to=s.to_user_name||'Unknown';
    const key=[from,to].sort().join('::');
    if(!pairs[key]) pairs[key]={a:from,b:to,net:0};
    // If from->to, it's positive for "to"
    if(pairs[key].a===from) pairs[key].net+=s.amount;
    else pairs[key].net-=s.amount;
  });
  return Object.values(pairs)
    .filter(p=>Math.abs(p.net)>0.5)
    .map(p=>p.net>0
      ? {from:p.a, to:p.b, amount:Math.round(p.net)}
      : {from:p.b, to:p.a, amount:Math.round(Math.abs(p.net))}
    );
}
