import { S } from '../state.js'
import { PC } from '../constants.js'
import { par3s, pn } from '../utils.js'
import { segNets, skinsCalc, mpWins, balances } from './betting.js'

function buildShareCardHTML(){
  const bal=balances();
  const date=new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'});
  const course=S.courseName||'Round';
  const activePl=S.players.filter(p=>p.name);

  // Winners
  const winners=[];
  if(S.games.nassau.on){
    const oNets=segNets(0,17);
    if(oNets&&!oNets.some(x=>x===null)){
      const mn=Math.min(...oNets.filter(x=>x!==null));
      const ws=oNets.reduce((a,x,i)=>x===mn&&S.players[i].name?[...a,i]:a,[]);
      if(ws.length===1){
        const total=S.games.nassau.front+S.games.nassau.back+S.games.nassau.overall;
        winners.push({game:'Nassau',name:pn(ws[0]),earn:`+$${total*(activePl.length-1)}`,color:PC[ws[0]]});
      }
    }
  }
  if(S.games.skins.on){
    const sw=[0,0,0,0];skinsCalc().forEach(r=>{if(r.w!==null)sw[r.w]+=r.pot;});
    const tot=sw.reduce((a,b)=>a+b,0);
    if(tot>0){
      const mx=Math.max(...sw);
      const ws=sw.reduce((a,w,i)=>w===mx&&S.players[i].name?[...a,i]:a,[]);
      if(ws.length===1) winners.push({game:`Skins (${sw[ws[0]]} holes)`,name:pn(ws[0]),earn:`+$${sw[ws[0]]*S.games.skins.amt}`,color:PC[ws[0]]});
    }
  }
  if(S.games.ctp.on){
    const ctpWins={};
    par3s().forEach(h=>{if(S.scores[h].ctp!==null){const w=S.scores[h].ctp;ctpWins[w]=(ctpWins[w]||0)+1;}});
    Object.entries(ctpWins).forEach(([wi,count])=>{
      winners.push({game:`CTP (${count} hole${count>1?'s':''})`,name:pn(+wi),earn:`+$${S.games.ctp.amt*(activePl.length-1)*count}`,color:PC[+wi]});
    });
  }

  // Final scores sorted by balance
  const scores=activePl.map((p,idx)=>{
    const i=S.players.indexOf(p);
    const nets=segNets(0,17);
    return {name:p.name,net:nets[i],bal:bal[i],color:PC[i],initials:p.name.split(/\s+/).map(w=>w[0]).join('').toUpperCase().slice(0,2)};
  }).sort((a,b)=>b.bal-a.bal);

  return `
  <div style="text-align:center;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.1);margin-bottom:16px">
    <div style="font-size:11px;color:#c9a84b;text-transform:uppercase;letter-spacing:.15em;font-weight:600;margin-bottom:8px">⛳ FAIRWAY BETS</div>
    <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:700;color:#ede8d8;margin-bottom:4px">${course}</div>
    <div style="font-size:12px;color:#7b9a85">${date}</div>
  </div>

  ${winners.length>0?`
  <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.1)">
    <div style="font-size:10px;color:#c9a84b;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:10px">Game Winners</div>
    ${winners.map(w=>`
    <div style="display:flex;align-items:center;gap:10px;padding:6px 0">
      <div style="font-size:14px;width:20px;text-align:center">🏆</div>
      <div style="flex:1;font-size:13px;color:#7b9a85">${w.game}</div>
      <div style="font-size:13px;font-weight:600;color:${w.color}">${w.name}</div>
      <div style="font-size:13px;font-weight:600;color:#5ec47a">${w.earn}</div>
    </div>`).join('')}
  </div>`:''}

  <div style="margin-bottom:16px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.1)">
    <div style="font-size:10px;color:#c9a84b;text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:10px">Final Scores</div>
    ${scores.map(s=>`
    <div style="display:flex;align-items:center;gap:10px;padding:6px 0">
      <div style="width:28px;height:28px;border-radius:50%;background:${s.color}22;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:700;color:${s.color}">${s.initials}</div>
      <div style="flex:1;font-size:14px;font-weight:500;color:#ede8d8">${s.name}</div>
      <div style="font-size:12px;color:#7b9a85">${s.net!==null?s.net+' net':'—'}</div>
      <div style="font-size:14px;font-weight:700;color:${s.bal>0?'#5ec47a':s.bal<0?'#dc503c':'#7b9a85'}">${s.bal>0?'+':''}$${Math.abs(Math.round(s.bal))}<span style="font-size:11px;margin-left:2px">${s.bal>0?'↑':s.bal<0?'↓':''}</span></div>
    </div>`).join('')}
  </div>

  <div style="text-align:center;font-size:11px;color:#4a6652">
    fairwaybets.golf &nbsp;·&nbsp; Track your bets
  </div>`;
}

window.shareRoundCard=async function(){
  const card=document.getElementById('share-card');
  if(!card) return;
  card.style.left='0';
  card.style.top='0';
  card.style.position='fixed';
  card.style.zIndex='-1';
  card.innerHTML=buildShareCardHTML();

  try{
    // Wait for fonts to render
    await new Promise(r=>setTimeout(r,200));
    const canvas=await html2canvas(card,{backgroundColor:'#091510',scale:2,useCORS:true});
    card.style.left='-9999px';
    card.style.position='absolute';
    const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));
    const file=new File([blob],'fairway-bets-round.png',{type:'image/png'});

    if(navigator.share&&navigator.canShare({files:[file]})){
      await navigator.share({files:[file],title:'Fairway Bets — Round Results'});
    }else{
      const a=document.createElement('a');
      a.href=URL.createObjectURL(blob);
      a.download='fairway-bets-round.png';
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }catch(e){
    console.error('Share failed:',e);
    card.style.left='-9999px';
    card.style.position='absolute';
  }
};
