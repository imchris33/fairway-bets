// ─── Saved Players — localStorage persistence ────────────────
const STORAGE_KEY='fb_saved_players';

export function loadSavedPlayers(){
  try{
    return JSON.parse(localStorage.getItem(STORAGE_KEY))||[];
  }catch{return [];}
}

export function saveSavedPlayers(players){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(players));
}

export function addSavedPlayer(name, handicap, colorIdx){
  const players=loadSavedPlayers();
  const existing=players.find(p=>p.name.toLowerCase()===name.toLowerCase());
  if(existing){
    existing.handicap=handicap;
    existing.roundsPlayed=(existing.roundsPlayed||0)+1;
    existing.lastPlayed=new Date().toISOString().slice(0,10);
  }else{
    players.push({
      id:crypto.randomUUID(),
      name,
      handicap,
      color:colorIdx,
      roundsPlayed:1,
      lastPlayed:new Date().toISOString().slice(0,10)
    });
  }
  saveSavedPlayers(players);
}

export function removeSavedPlayer(id){
  const players=loadSavedPlayers().filter(p=>p.id!==id);
  saveSavedPlayers(players);
}

export function updateSavedPlayer(id, updates){
  const players=loadSavedPlayers();
  const p=players.find(x=>x.id===id);
  if(p) Object.assign(p, updates);
  saveSavedPlayers(players);
}

export function isPlayerSaved(name){
  return loadSavedPlayers().some(p=>p.name.toLowerCase()===name.trim().toLowerCase());
}
