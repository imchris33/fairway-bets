import { S, saveRound } from '../state.js'
import { PC } from '../constants.js'
import { pn } from '../utils.js'

// ─── SCAN SCORECARD ──────────────────────────────────────────────────────────
window.openScan=function(){
  document.getElementById('scan-overlay').classList.add('open');
  resetScanUI();
};
window.closeScan=function(){
  document.getElementById('scan-overlay').classList.remove('open');
};
function resetScanUI(){
  document.getElementById('scan-preview').style.display='none';
  document.getElementById('scan-preview').src='';
  document.getElementById('scan-result').innerHTML='';
  document.getElementById('scan-action').innerHTML=`
    <label style="display:block;width:100%;margin-bottom:10px">
      <span class="btn btn-gold" style="display:block;cursor:pointer">📷 Take Photo / Choose Image</span>
      <input type="file" accept="image/*" capture="environment" onchange="handleScanFile(this)" style="display:none">
    </label>
    <button class="btn btn-ghost" onclick="closeScan()">Cancel</button>`;
}

window.handleScanFile=function(input){
  const file=input.files[0];
  if(!file)return;
  const reader=new FileReader();
  reader.onload=e=>{
    const b64=e.target.result.split(',')[1];
    const mime=file.type||'image/jpeg';
    const prev=document.getElementById('scan-preview');
    prev.src=e.target.result;
    prev.style.display='block';
    runScan(b64,mime);
  };
  reader.readAsDataURL(file);
};

async function runScan(b64,mime){
  document.getElementById('scan-result').innerHTML='';
  document.getElementById('scan-action').innerHTML=`
    <div style="padding:16px;color:var(--mut);font-size:14px">
      <span class="spin">⛳</span> Reading scorecard...
    </div>`;

  const activePlayers=S.players.filter(p=>p.name).map(p=>p.name);
  const prompt=`You are reading a golf scorecard photo. The players in this round are: ${activePlayers.join(', ')}.

Extract the gross (actual) score for each player on each of the 18 holes.

Return ONLY valid JSON in this exact format, nothing else:
{
  "confidence": "high" | "medium" | "low",
  "notes": "any issues or warnings about the image",
  "players": [
    {
      "name": "player name as it appears",
      "matched": "matched player name from the list above",
      "scores": [hole1, hole2, ..., hole18]
    }
  ]
}

Rules:
- scores must be integers, use null if a hole score is unreadable
- Only include players you can actually see on the scorecard
- matched must be one of: ${activePlayers.join(', ')}
- If you can't read the scorecard clearly, set confidence to "low" and explain in notes`;

  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        model:'claude-sonnet-4-20250514',
        max_tokens:1000,
        messages:[{
          role:'user',
          content:[
            {type:'image',source:{type:'base64',media_type:mime,data:b64}},
            {type:'text',text:prompt}
          ]
        }]
      })
    });
    const data=await res.json();
    const raw=data.content?.find(b=>b.type==='text')?.text||'';
    const clean=raw.replace(/```json|```/g,'').trim();
    const parsed=JSON.parse(clean);
    showScanResult(parsed);
  }catch(err){
    document.getElementById('scan-result').innerHTML=`<div style="color:var(--red);font-size:14px;padding:8px 0">Could not read the scorecard. Try a clearer photo with better lighting.</div>`;
    document.getElementById('scan-action').innerHTML=`
      <label style="display:block;width:100%;margin-bottom:10px">
        <span class="btn btn-outline" style="display:block;cursor:pointer">Try Another Photo</span>
        <input type="file" accept="image/*" capture="environment" onchange="handleScanFile(this)" style="display:none">
      </label>
      <button class="btn btn-ghost" onclick="closeScan()">Cancel</button>`;
  }
}

function showScanResult(parsed){
  const activePi=S.players.reduce((m,p,i)=>{if(p.name)m[p.name]=i;return m},{});
  const low=parsed.confidence==='low';
  const resultEl=document.getElementById('scan-result');

  let html='';
  if(parsed.notes){
    html+=`<div class="scan-warn">ℹ️ ${parsed.notes}</div>`;
  }
  if(low){
    html+=`<div class="scan-warn">⚠️ Low confidence — please verify all scores before applying.</div>`;
  }

  parsed.players.forEach(pl=>{
    const pi=activePi[pl.matched];
    if(pi===undefined)return;
    const color=PC[pi];
    const valid=pl.scores.filter(s=>s!==null).length;
    html+=`<div class="scan-player-result">
      <div class="scan-player-name" style="color:${color}">${pl.name} → ${pn(pi)}</div>
      <div class="scan-scores-row">
        ${pl.scores.map((s,hi)=>`<span class="scan-score-chip" style="${s===null?'opacity:.4':''}">${hi+1}:${s!==null?s:'?'}</span>`).join('')}
      </div>
      <div style="font-size:11px;color:var(--mut);margin-top:4px">${valid}/18 holes read</div>
    </div>`;
  });

  resultEl.innerHTML=html||'<div style="color:var(--mut);font-size:14px">No player scores detected.</div>';

  const toApply=parsed.players.filter(pl=>activePi[pl.matched]!==undefined);

  document.getElementById('scan-action').innerHTML=`
    ${toApply.length?`<button class="btn btn-gold" onclick="applyScan(${JSON.stringify(toApply).replace(/"/g,'&quot;')})">Apply Scores to Scorecard</button>`:''}
    <label style="display:block;width:100%;margin-top:10px">
      <span class="btn btn-outline" style="display:block;cursor:pointer">Try Another Photo</span>
      <input type="file" accept="image/*" capture="environment" onchange="handleScanFile(this)" style="display:none">
    </label>
    <button class="btn btn-ghost" onclick="closeScan()">Cancel</button>`;
}

window.applyScan=function(players){
  const activePi=S.players.reduce((m,p,i)=>{if(p.name)m[p.name]=i;return m},{});
  players.forEach(pl=>{
    const pi=activePi[pl.matched];
    if(pi===undefined)return;
    pl.scores.forEach((s,hi)=>{
      if(s!==null&&Number.isInteger(s)&&s>0&&s<20){
        S.scores[hi].g[pi]=s;
      }
    });
  });
  saveRound();
  closeScan();
  // Trigger scorecard re-render
  const { render } = window.__router || {};
  if(render) render();
  else nav('scorecard');
};
