import { PARS, SI } from './constants.js'

export function blank18(){return Array(18).fill(null).map(()=>({g:[null,null,null,null],ctp:null}));}

export let S={
  screen:'home',
  players:[{name:'',hc:0},{name:'',hc:0},{name:'',hc:0},{name:'',hc:0}],
  strokes:[0,0,0,0],
  games:{
    nassau:{on:true,front:10,back:10,overall:20},
    skins:{on:true,amt:5},
    match:{on:false,amt:50},
    stroke:{on:false,amt:20},
    ctp:{on:true,amt:10}
  },
  holes:PARS.map((par,i)=>({par,si:SI[i]})),
  scores:blank18(),
  history:[],
  // Multi-user state
  guest:false,
  user:null,
  profile:null,
  currentGroupId:null,
  groups:[]
};

// ─── STORAGE ─────────────────────────────────────────────────────────────────
export function load(){
  try{
    const h=localStorage.getItem('fb_h');
    if(h) S.history=JSON.parse(h);
    const r=localStorage.getItem('fb_r');
    if(r){const d=JSON.parse(r);S.players=d.players;S.games=d.games;S.holes=d.holes;S.scores=d.scores;if(d.strokes)S.strokes=d.strokes;}
    const gid=localStorage.getItem('fb_gid');
    if(gid) S.currentGroupId=gid;
  }catch(e){}
}
export function saveRound(){
  try{localStorage.setItem('fb_r',JSON.stringify({players:S.players,games:S.games,holes:S.holes,scores:S.scores,strokes:S.strokes}));}catch(e){}
}
export function clearRound(){localStorage.removeItem('fb_r');}
export function pushHistory(e){
  S.history.unshift(e);
  try{localStorage.setItem('fb_h',JSON.stringify(S.history.slice(0,50)));}catch(e){}
}
export function saveGroupId(){
  try{
    if(S.currentGroupId) localStorage.setItem('fb_gid',S.currentGroupId);
    else localStorage.removeItem('fb_gid');
  }catch(e){}
}

// ─── LOCAL DEBT TRACKER ──────────────────────────────────────
function debtKey(){
  const names=S.players.filter(p=>p.name).map(p=>p.name.toLowerCase().trim()).sort().join('-');
  return 'fb_debts_'+names;
}
export function loadLocalDebts(){
  try{return JSON.parse(localStorage.getItem(debtKey()))||[];}catch{return [];}
}
export function saveLocalDebts(debts){
  try{localStorage.setItem(debtKey(),JSON.stringify(debts));}catch(e){}
}
export function addLocalDebts(txns){
  const debts=loadLocalDebts();
  const roundId=crypto.randomUUID();
  const date=new Date().toISOString().slice(0,10);
  txns.forEach(t=>{
    debts.push({
      id:crypto.randomUUID(),
      from:S.players[t.from]?.name||'',
      to:S.players[t.to]?.name||'',
      amount:t.amt,
      roundId,
      date,
      paid:false
    });
  });
  saveLocalDebts(debts);
}
export function markLocalDebtPaid(debtId){
  const debts=loadLocalDebts();
  const d=debts.find(x=>x.id===debtId);
  if(d) d.paid=true;
  saveLocalDebts(debts);
}
