import { S, saveRound } from '../state.js'
import { SI } from '../constants.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'

let _searchTimer = null;
let _courseName = '';

function renderCourse(){
  const el=ensureScr('course');
  function parBtn(h,p){
    const sel=S.holes[h].par===p;
    return `<button onclick="setPar(${h},${p})" style="width:38px;height:34px;border-radius:8px;border:1px solid ${sel?'var(--gold)':'var(--brd)'};background:${sel?'var(--gold)':'var(--dim)'};color:${sel?'#091510':'var(--mut)'};font-family:Outfit,sans-serif;font-size:14px;font-weight:${sel?'600':'400'};cursor:pointer">${p}</button>`;
  }
  const front=S.holes.slice(0,9).reduce((a,h)=>a+h.par,0);
  const back=S.holes.slice(9).reduce((a,h)=>a+h.par,0);
  const scanned=S.holes.some(h=>h._scanned);
  const courseLoaded=S.holes.some(h=>h._fromApi);

  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('games')">‹</button>
  <h2>Course Setup</h2>
</div>
<div class="scroll">

  <!-- Course Search -->
  <div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;padding:14px;margin-bottom:12px">
    <div style="font-size:13px;font-weight:500;margin-bottom:4px">🔍 Find your course</div>
    <div style="font-size:12px;color:var(--mut);margin-bottom:10px;line-height:1.5">Search by name — pars and stroke indexes load automatically.</div>
    ${courseLoaded?`<div style="padding:8px 10px;background:rgba(94,196,122,.1);border:1px solid rgba(94,196,122,.25);border-radius:8px;font-size:12px;color:#5ec47a;margin-bottom:10px">✓ ${_courseName||'Course'} loaded — adjust any hole below if needed</div>`:''}
    <input type="text" id="course-search" placeholder="e.g. Pebble Beach, Augusta National..." style="width:100%" oninput="courseSearch(this.value)">
    <div id="course-results"></div>
  </div>

  <!-- AI Scan fallback -->
  <div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;padding:14px;margin-bottom:12px">
    <div style="font-size:13px;font-weight:500;margin-bottom:4px">📷 Or scan the scorecard</div>
    <div style="font-size:12px;color:var(--mut);margin-bottom:10px;line-height:1.5">Take a photo of the paper scorecard — Claude reads pars and stroke indexes.</div>
    ${scanned?`<div style="padding:8px 10px;background:rgba(94,196,122,.1);border:1px solid rgba(94,196,122,.25);border-radius:8px;font-size:12px;color:#5ec47a;margin-bottom:10px">✓ Course data scanned</div>`:''}
    <label style="display:block;width:100%">
      <span class="btn btn-outline" style="display:block;cursor:pointer;padding:10px;text-align:center;font-size:13px">📷 ${scanned?'Re-scan':'Scan Scorecard'}</span>
      <input type="file" accept="image/*" capture="environment" onchange="handleCourseScan(this)" style="display:none">
    </label>
  </div>

  <div id="course-scan-status"></div>

  <div style="display:flex;gap:8px;margin-bottom:16px">
    <button class="btn btn-ghost" style="padding:10px;font-size:12px;flex:1" onclick="setAllPar()">All Par 4 / Reset</button>
  </div>

  <div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin-bottom:8px">Front nine — par ${front}</div>
  ${[0,1,2,3,4,5,6,7,8].map(h=>`
  <div style="display:flex;align-items:center;padding:7px 0;border-bottom:1px solid var(--brd);gap:8px">
    <div style="width:22px;font-size:12px;color:var(--mut);font-weight:500;text-align:center;flex-shrink:0">${h+1}</div>
    <div style="display:flex;gap:4px;flex-shrink:0">${parBtn(h,3)}${parBtn(h,4)}${parBtn(h,5)}</div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:flex-end;gap:2px">
      <div style="font-size:9px;color:var(--mut)">SI</div>
      <div style="font-size:12px;font-weight:500;color:${S.holes[h].si?'var(--txt)':'var(--mut)'}">${S.holes[h].si||'—'}</div>
    </div>
    ${S.holes[h].par===3?`<div style="font-size:9px;color:var(--gold);background:rgba(201,168,75,.12);padding:2px 6px;border-radius:4px;flex-shrink:0">CTP</div>`:'<div style="width:28px"></div>'}
  </div>`).join('')}

  <div style="font-size:10px;color:var(--gold);text-transform:uppercase;letter-spacing:.08em;font-weight:600;margin:16px 0 8px">Back nine — par ${back}</div>
  ${[9,10,11,12,13,14,15,16,17].map(h=>`
  <div style="display:flex;align-items:center;padding:7px 0;border-bottom:1px solid var(--brd);gap:8px">
    <div style="width:22px;font-size:12px;color:var(--mut);font-weight:500;text-align:center;flex-shrink:0">${h+1}</div>
    <div style="display:flex;gap:4px;flex-shrink:0">${parBtn(h,3)}${parBtn(h,4)}${parBtn(h,5)}</div>
    <div style="flex:1;display:flex;flex-direction:column;align-items:flex-end;gap:2px">
      <div style="font-size:9px;color:var(--mut)">SI</div>
      <div style="font-size:12px;font-weight:500;color:${S.holes[h].si?'var(--txt)':'var(--mut)'}">${S.holes[h].si||'—'}</div>
    </div>
    ${S.holes[h].par===3?`<div style="font-size:9px;color:var(--gold);background:rgba(201,168,75,.12);padding:2px 6px;border-radius:4px;flex-shrink:0">CTP</div>`:'<div style="width:28px"></div>'}
  </div>`).join('')}

  <div style="margin-top:14px;padding:12px;background:var(--dim);border-radius:8px;font-size:13px;color:var(--mut);display:flex;gap:16px;justify-content:center">
    <span>Total par: <strong style="color:var(--txt)">${front+back}</strong></span>
    <span>Par 3s: <strong style="color:var(--gold)">${S.holes.filter(h=>h.par===3).length}</strong></span>
    <span>SI set: <strong style="color:${S.holes.every(h=>h.si)?'#5ec47a':'var(--mut)'}">${S.holes.filter(h=>h.si).length}/18</strong></span>
  </div>

  <button class="btn btn-gold" style="margin-top:16px" onclick="startRound()">⛳ Tee Off</button>
  <div class="safe"></div>
</div>`;
}

// ─── Course Search ─────────────────────────────────────────────
// Cache search results so we can load a course without a second API call
let _searchCache = [];

window.courseSearch=function(query){
  clearTimeout(_searchTimer);
  const container=document.getElementById('course-results');
  if(!container) return;
  if(query.trim().length<3){
    container.innerHTML=query.trim().length>0?`<div style="padding:10px;color:var(--mut);font-size:13px">Type at least 3 characters to search</div>`:'';
    return;
  }
  container.innerHTML=`<div style="padding:10px;color:var(--mut);font-size:13px"><span class="spin">⛳</span> Searching...</div>`;
  _searchTimer=setTimeout(async()=>{
    try{
      const res=await fetch(`/api/courses?q=${encodeURIComponent(query.trim())}`);
      const data=await res.json();
      const courses=data.courses||[];
      _searchCache=courses;
      if(!courses.length){
        container.innerHTML=`<div style="padding:10px;color:var(--mut);font-size:13px">No courses found — try a shorter name or enter manually below.</div>`;
        return;
      }
      // Each result IS a course (id, club_name, tees, location)
      container.innerHTML=courses.slice(0,8).map((c,idx)=>{
        const loc=c.location;
        const city=loc?[loc.city,loc.state||loc.country].filter(Boolean).join(', '):'';
        const name=(c.club_name||c.course_name||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
        return `<div onclick="selectCourse(${idx},'${name}')" style="padding:10px 0;border-bottom:1px solid var(--brd);cursor:pointer">
          <div style="font-size:14px;font-weight:500">${c.club_name||c.course_name}</div>
          <div style="font-size:11px;color:var(--mut)">${city}</div>
        </div>`;
      }).join('');
    }catch(e){
      container.innerHTML=`<div style="padding:10px;color:var(--red);font-size:13px">Search failed. Check your connection.</div>`;
    }
  },400);
};

window.selectCourse=function(cacheIdx, courseName){
  const container=document.getElementById('course-results');
  const course=_searchCache[cacheIdx];
  if(!course){
    if(container) container.innerHTML=`<div style="padding:10px;color:var(--red);font-size:13px">Course not found — try searching again.</div>`;
    return;
  }

  // Parse holes from course tees (search already returns full data)
  const holes=parseHolesFromCourse(course);
  if(!holes||holes.length!==18){
    if(container) container.innerHTML=`<div style="padding:10px;color:var(--red);font-size:13px">Course data incomplete (${holes?holes.length:0} holes) — please enter manually.</div>`;
    return;
  }

  // Apply holes data
  holes.forEach((h,i)=>{
    S.holes[i].par=h.par;
    S.holes[i].si=h.si;
    S.holes[i]._fromApi=true;
  });

  _courseName=course.course_name||course.club_name||courseName||'Course';
  S.courseName=_courseName;
  renderCourse();
};

function parseHolesFromCourse(course){
  if(!course||!course.tees) return null;

  // API returns tees as { male: [...], female: [...] } — flatten to array
  let allTees=[];
  if(Array.isArray(course.tees)){
    allTees=course.tees;
  }else if(typeof course.tees==='object'){
    // Prefer male tees for default, fall back to any
    allTees=course.tees.male||course.tees.female||Object.values(course.tees).flat();
  }
  if(!allTees.length) return null;

  // Pick tee: prefer middle tee (white/blue) — good for casual gambling rounds
  let tee=allTees[0];
  const preferred=['white','blue','regular','men'];
  for(const p of preferred){
    const found=allTees.find(t=>t.tee_name?.toLowerCase().includes(p));
    if(found){tee=found;break;}
  }
  if(!tee.holes||tee.holes.length===0) return null;

  // Map into app's hole format: { par: 4, si: 7 }
  // API holes are in order (no hole_number field), use handicap for SI
  return tee.holes.map((h,i)=>({
    par:h.par,
    si:h.handicap||h.stroke_index||0
  }));
}

// ─── Manual controls ───────────────────────────────────────────
window.setPar=(h,p)=>{S.holes[h].par=p;renderCourse();};
window.setSI=(h,si)=>{S.holes[h].si=si;renderCourse();};
window.setAllPar=function(){
  S.holes=S.holes.map((_,i)=>({par:4,si:SI[i]}));
  _courseName='';
  renderCourse();
};
window.startRound=function(){saveRound();nav('strokes');};

// ─── AI Course Scan ────────────────────────────────────────────
window.handleCourseScan=async function(input){
  const file=input.files[0];
  if(!file)return;
  const statusEl=document.getElementById('course-scan-status');
  statusEl.innerHTML=`<div style="padding:12px;background:var(--dim);border-radius:8px;text-align:center;font-size:13px;color:var(--mut);margin-bottom:12px"><span class="spin">⛳</span> Reading course scorecard...</div>`;
  const reader=new FileReader();
  reader.onload=async e=>{
    const b64=e.target.result.split(',')[1];
    const mime=file.type||'image/jpeg';
    const prompt=`You are reading a golf course scorecard image.

Extract the par and stroke index (SI/handicap) for all 18 holes.

Return ONLY valid JSON, nothing else:
{
  "course_name": "name if visible",
  "confidence": "high" | "medium" | "low",
  "notes": "any issues reading the card",
  "holes": [
    {"hole": 1, "par": 4, "si": 7},
    {"hole": 2, "par": 4, "si": 11},
    ...all 18 holes
  ]
}

Rules:
- par must be 3, 4, or 5
- si (stroke index) must be 1-18, each number used exactly once
- If SI row is labeled "handicap" or "hdcp" that is the stroke index
- If you cannot read a value clearly, use null
- holes array must have exactly 18 entries in order`;

    try{
      const res=await fetch('https://api.anthropic.com/v1/messages',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          model:'claude-sonnet-4-20250514',
          max_tokens:1000,
          messages:[{role:'user',content:[
            {type:'image',source:{type:'base64',media_type:mime,data:b64}},
            {type:'text',text:prompt}
          ]}]
        })
      });
      const data=await res.json();
      const raw=data.content?.find(b=>b.type==='text')?.text||'';
      const parsed=JSON.parse(raw.replace(/```json|```/g,'').trim());
      applyCourseScan(parsed,statusEl);
    }catch(err){
      statusEl.innerHTML=`<div style="padding:10px 12px;background:rgba(216,80,80,.1);border:1px solid rgba(216,80,80,.3);border-radius:8px;font-size:12px;color:var(--red);margin-bottom:12px">Could not read the scorecard. Try a clearer photo with good lighting, flat on a table.</div>`;
    }
  };
  reader.readAsDataURL(file);
};

function applyCourseScan(parsed,statusEl){
  if(!parsed.holes||parsed.holes.length<18){
    statusEl.innerHTML=`<div style="padding:10px 12px;background:rgba(216,80,80,.1);border:1px solid rgba(216,80,80,.3);border-radius:8px;font-size:12px;color:var(--red);margin-bottom:12px">Couldn't find all 18 holes. Try a better angle or closer shot.</div>`;
    return;
  }
  let applied=0;
  parsed.holes.forEach((h,i)=>{
    if(i>=18)return;
    if(h.par&&[3,4,5].includes(h.par)){S.holes[i].par=h.par;applied++;}
    if(h.si&&h.si>=1&&h.si<=18)S.holes[i].si=h.si;
    S.holes[i]._scanned=true;
  });
  const warn=parsed.confidence==='low'?`<div style="margin-bottom:8px;padding:8px 10px;background:rgba(201,168,75,.1);border:1px solid rgba(201,168,75,.3);border-radius:8px;font-size:11px;color:var(--gold)">⚠️ Low confidence — please verify holes below</div>`:'';
  const note=parsed.notes?`<div style="font-size:11px;color:var(--mut);margin-bottom:8px">${parsed.notes}</div>`:'';
  statusEl.innerHTML=`<div style="padding:10px 12px;background:rgba(94,196,122,.08);border:1px solid rgba(94,196,122,.2);border-radius:8px;margin-bottom:12px">${warn}${note}<div style="font-size:12px;color:#5ec47a">✓ ${parsed.course_name?parsed.course_name+' · ':''}${applied} holes loaded — check any holes that show "—" for SI</div></div>`;
  renderCourse();
}

registerScreen('course', renderCourse);
