import { S } from '../state.js'

// ─── CALCULATIONS ────────────────────────────────────────────────────────────
export function lowHc(){
  const active=S.players.filter(p=>p.name);
  return active.length?Math.min(...active.map(p=>p.hc)):0;
}
export function playingHc(pi){return S.strokes[pi]||0;}
export function hcStrokes(hc,si){return Math.floor(hc/18)+(si<=(hc%18)?1:0);}
export function getNet(h,pi){
  const g=S.scores[h].g[pi];
  if(g===null)return null;
  return g-hcStrokes(playingHc(pi),S.holes[h].si);
}
export function segNets(from,to){
  return S.players.map((_,pi)=>{
    let t=0;
    for(let h=from;h<=to;h++){const n=getNet(h,pi);if(n===null)return null;t+=n;}
    return t;
  });
}
export function skinsCalc(){
  const res=[];let carried=0;
  for(let h=0;h<18;h++){
    const nets=S.players.map((_,pi)=>getNet(h,pi));
    if(nets.some(n=>n===null)){res.push({h,w:null,pot:0,pending:true,carried});continue;}
    const mn=Math.min(...nets);
    const ws=nets.reduce((a,n,i)=>n===mn?[...a,i]:a,[]);
    if(ws.length===1){res.push({h,w:ws[0],pot:1+carried,carried});carried=0;}
    else{res.push({h,w:null,pot:0,tied:true,carried});carried++;}
  }
  return res;
}
export function mpWins(){
  const w=[0,0,0,0];
  for(let h=0;h<18;h++){
    const nets=S.players.map((_,pi)=>getNet(h,pi));
    if(nets.some(n=>n===null))continue;
    const mn=Math.min(...nets);
    const ws=nets.reduce((a,n,i)=>n===mn?[...a,i]:a,[]);
    if(ws.length===1)w[ws[0]]++;
  }
  return w;
}
export function balances(){
  const bal=[0,0,0,0];
  // Nassau
  if(S.games.nassau.on){
    [{nets:segNets(0,8),amt:S.games.nassau.front},
     {nets:segNets(9,17),amt:S.games.nassau.back},
     {nets:segNets(0,17),amt:S.games.nassau.overall}
    ].forEach(({nets,amt})=>{
      if(nets.some(x=>x===null)||!amt)return;
      const mn=Math.min(...nets);
      const ws=nets.reduce((a,x,i)=>x===mn?[...a,i]:a,[]);
      if(ws.length===1)nets.forEach((_,i)=>{if(i!==ws[0]){bal[ws[0]]+=amt;bal[i]-=amt;}});
    });
  }
  // Skins
  if(S.games.skins.on){
    const sw=[0,0,0,0];
    skinsCalc().forEach(r=>{if(r.w!==null)sw[r.w]+=r.pot;});
    sw.forEach((wa,i)=>sw.forEach((wb,j)=>{
      if(i<j){const n=(wa-wb)*S.games.skins.amt;bal[i]+=n;bal[j]-=n;}
    }));
  }
  // CTP
  if(S.games.ctp.on){
    for(let h=0;h<18;h++){
      if(S.holes[h].par===3&&S.scores[h].ctp!==null){
        const w=S.scores[h].ctp;
        S.players.forEach((_,i)=>{if(i!==w){bal[w]+=S.games.ctp.amt;bal[i]-=S.games.ctp.amt;}});
      }
    }
  }
  // Match Play
  if(S.games.match.on){
    const w=mpWins();const mx=Math.max(...w);
    const ws=w.reduce((a,x,i)=>x===mx?[...a,i]:a,[]);
    if(ws.length===1)w.forEach((_,i)=>{if(i!==ws[0]){bal[ws[0]]+=S.games.match.amt;bal[i]-=S.games.match.amt;}});
  }
  // Stroke Play
  if(S.games.stroke.on){
    const tots=segNets(0,17);
    if(!tots.some(x=>x===null)){
      const mn=Math.min(...tots);
      const ws=tots.reduce((a,x,i)=>x===mn?[...a,i]:a,[]);
      if(ws.length===1)tots.forEach((_,i)=>{if(i!==ws[0]){bal[ws[0]]+=S.games.stroke.amt;bal[i]-=S.games.stroke.amt;}});
    }
  }
  return bal;
}
export function simplify(bal){
  const txns=[];
  const pos=bal.map((b,i)=>({b,i})).filter(x=>x.b>0.5).sort((a,b)=>b.b-a.b);
  const neg=bal.map((b,i)=>({b,i})).filter(x=>x.b<-0.5).sort((a,b)=>a.b-b.b);
  let ci=0,di=0;
  while(ci<pos.length&&di<neg.length){
    const c=pos[ci],d=neg[di];
    const amt=Math.min(c.b,-d.b);
    txns.push({from:d.i,to:c.i,amt:Math.round(amt)});
    c.b-=amt;d.b+=amt;
    if(c.b<0.5)ci++;
    if(d.b>-0.5)di++;
  }
  return txns;
}
