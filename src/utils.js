import { S } from './state.js'

export function pn(i){return S.players[i].name||`P${i+1}`;}
export function holesIn(){
  const active=S.players.map((_,i)=>i).filter(i=>S.players[i].name);
  return S.scores.filter(s=>active.every(i=>s.g[i]!==null)).length;
}
export function hasRound(){return S.players.some(p=>p.name)&&S.scores.some(s=>s.g.some(g=>g!==null));}
export function par3s(){return S.holes.map((h,i)=>h.par===3?i:-1).filter(i=>i>=0);}
export function diffCls(d){
  if(d===null||d===undefined)return '';
  if(d<=-2)return 'sc-eagle';if(d===-1)return 'sc-birdie';
  if(d===1)return 'sc-bogey';if(d===2)return 'sc-double';if(d>=3)return 'sc-triple';
  return '';
}

export function ensureScr(id){
  let el=document.getElementById('s-'+id);
  if(!el){el=document.createElement('div');el.id='s-'+id;el.className='screen';document.getElementById('app').appendChild(el);}
  el.classList.add('active');
  return el;
}

export function showToast(msg, type='error'){
  const el=document.createElement('div');
  el.className=`toast ${type}`;
  el.textContent=msg;
  document.body.appendChild(el);
  setTimeout(()=>el.remove(),3500);
}
