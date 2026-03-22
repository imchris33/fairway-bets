export function calculateLeaderboard(rounds){
  const stats={};

  rounds.forEach(r=>{
    const d=r.data||{};
    const players=d.players||[];
    const bals=d.balances||[];

    players.forEach((p,i)=>{
      if(!p.name) return;
      const key=p.name.toLowerCase().trim();
      if(!stats[key]) stats[key]={name:p.name,totalWinnings:0,roundsPlayed:0,wins:0};
      stats[key].roundsPlayed++;
      const bal=bals[i]||0;
      stats[key].totalWinnings+=bal;
      if(bal>0) stats[key].wins++;
    });
  });

  return Object.values(stats)
    .map(s=>({...s, winRate: s.roundsPlayed>0 ? Math.round((s.wins/s.roundsPlayed)*100) : 0}))
    .sort((a,b)=>b.totalWinnings-a.totalWinnings);
}
