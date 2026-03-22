import { S, saveRound } from '../state.js'
import { SI } from '../constants.js'
import { ensureScr } from '../utils.js'
import { nav, registerScreen } from '../router.js'

let _searchTimer = null;
let _courseName = '';
let _searchCache = [];
let _selectedCourse = null; // full course object from API
let _selectedTee = null;    // current tee object
let _allTees = [];          // flattened tee list
let _courseImported = false;

// ─── SI color coding ───────────────────────────────────────────
function siColor(si){
  if(si<=3) return '#dc503c';
  if(si<=6) return '#fb923c';
  if(si<=9) return '#fbbf24';
  if(si<=12) return '#7b9a85';
  if(si<=15) return '#4a6652';
  return '#2d4035';
}
function parColor(par){
  if(par===3) return '#5ec47a';
  if(par===5) return '#c9a84b';
  return '#ede8d8';
}

// ─── Build confirmation card HTML ──────────────────────────────
function buildConfirmCard(course, tee, holes){
  const totalYards=holes.reduce((s,h)=>s+(h.yardage||0),0);
  const f9Yards=holes.slice(0,9).reduce((s,h)=>s+(h.yardage||0),0);
  const b9Yards=holes.slice(9).reduce((s,h)=>s+(h.yardage||0),0);
  const f9Par=holes.slice(0,9).reduce((s,h)=>s+h.par,0);
  const b9Par=holes.slice(9).reduce((s,h)=>s+h.par,0);
  const totalPar=f9Par+b9Par;
  const loc=course.location;
  const city=loc?[loc.city,loc.state||loc.country].filter(Boolean).join(', '):'';

  const holeRows=holes.map((h,i)=>`
    <tr>
      <td style="text-align:left;padding:4px 4px;color:#7b9a85;font-size:10px">${i+1}</td>
      <td style="text-align:center;padding:4px 2px;color:#9ab8a2;font-size:10px">${h.yardage||'—'}</td>
      <td style="text-align:center;padding:4px 2px;color:${parColor(h.par)};font-weight:${h.par!==4?'600':'400'}">${h.par}</td>
      <td style="text-align:center;padding:4px 2px;color:${siColor(h.si)};font-size:11px">${h.si}</td>
    </tr>
    ${i===8?`<tr style="border-top:1px solid rgba(255,255,255,.1)">
      <td style="text-align:left;padding:5px 4px;color:#7b9a85;font-size:10px;font-weight:600">OUT</td>
      <td style="text-align:center;color:#c9a84b;font-weight:600;font-size:10px">${f9Yards.toLocaleString()}</td>
      <td style="text-align:center;color:#c9a84b;font-weight:600">${f9Par}</td>
      <td style="text-align:center;color:#4a6652">—</td>
    </tr>`:''}`).join('');

  // Determine tee dot color
  const tn=(tee.tee_name||'').toLowerCase();
  let teeColor='#fff';
  if(tn.includes('blue')) teeColor='#60a5fa';
  else if(tn.includes('red')) teeColor='#ef4444';
  else if(tn.includes('gold')||tn.includes('yellow')) teeColor='#fbbf24';
  else if(tn.includes('black')) teeColor='#555';
  else if(tn.includes('green')) teeColor='#5ec47a';
  else if(tn.includes('silver')) teeColor='#a0a0a0';

  return `
  <div style="background:#0d1f14;border:1px solid rgba(94,196,122,.25);border-radius:14px;overflow:hidden;margin-bottom:16px">
    <!-- Hero -->
    <div style="background:linear-gradient(135deg,rgba(94,196,122,.08),rgba(201,168,75,.05));padding:16px;border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px">
        <div style="width:24px;height:24px;border-radius:50%;background:rgba(94,196,122,.2);border:1px solid rgba(94,196,122,.4);display:flex;align-items:center;justify-content:center;font-size:11px;color:#5ec47a">✓</div>
        <span style="font-size:10px;color:#5ec47a;text-transform:uppercase;letter-spacing:.12em;font-weight:600">Course imported</span>
      </div>
      <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:20px;font-weight:700;color:#ede8d8;margin-bottom:2px">${course.course_name||course.club_name}</div>
      <div style="font-size:12px;color:#7b9a85">${city}</div>
    </div>

    <!-- Stats strip -->
    <div style="display:flex;border-bottom:1px solid rgba(255,255,255,.06)">
      ${[['Par',totalPar],['Yards',totalYards.toLocaleString()],['Rating',tee.course_rating||'—'],['Slope',tee.slope_rating||'—']].map(([l,v])=>`
      <div style="flex:1;padding:11px 8px;text-align:center;border-right:1px solid rgba(255,255,255,.06)">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:17px;font-weight:700;color:#c9a84b;margin-bottom:2px">${v}</div>
        <div style="font-size:9px;color:#4a6652;text-transform:uppercase;letter-spacing:.05em">${l}</div>
      </div>`).join('')}
    </div>

    <!-- Tee row -->
    <div style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="display:flex;align-items:center;gap:8px">
        <div style="width:11px;height:11px;border-radius:50%;background:${teeColor};border:1px solid rgba(255,255,255,.2)"></div>
        <div>
          <div style="font-size:13px;color:#ede8d8;font-weight:500">${tee.tee_name} tees</div>
          <div style="font-size:11px;color:#7b9a85">${tee.course_rating||''} rating · ${tee.slope_rating||''} slope · ${totalYards.toLocaleString()} yds</div>
        </div>
      </div>
      ${_allTees.length>1?`<span onclick="showTeeSelector()" style="font-size:11px;color:#4a6652;text-decoration:underline;cursor:pointer">Change tee ›</span>`:''}
    </div>

    <!-- Tee selector (hidden by default) -->
    <div id="tee-selector" style="display:none;padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="font-size:10px;color:#4a6652;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Select tee box</div>
      ${_allTees.map((t,ti)=>{
        const sel=t===tee;
        return `<div onclick="changeTee(${ti})" style="padding:8px 10px;border:1px solid ${sel?'rgba(201,168,75,.4)':'rgba(255,255,255,.08)'};border-radius:8px;margin-bottom:6px;cursor:pointer;background:${sel?'rgba(201,168,75,.08)':'transparent'};display:flex;align-items:center;justify-content:space-between">
          <div style="font-size:13px;color:${sel?'var(--gold)':'var(--txt)'};font-weight:${sel?'600':'400'}">${t.tee_name}</div>
          <div style="font-size:11px;color:var(--mut)">${t.course_rating||'—'} / ${t.slope_rating||'—'}</div>
        </div>`;
      }).join('')}
    </div>

    <!-- Full scorecard table -->
    <div style="padding:10px 12px 12px;border-bottom:1px solid rgba(255,255,255,.06)">
      <div style="font-size:10px;color:#4a6652;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">Full scorecard — par, yardage & stroke index</div>
      <table style="width:100%;border-collapse:collapse;font-size:11px">
        <thead><tr>
          <th style="text-align:left;font-size:9px;color:#4a6652;font-weight:500;padding:3px 4px;border-bottom:1px solid rgba(255,255,255,.08)">Hole</th>
          <th style="text-align:center;font-size:9px;color:#4a6652;font-weight:500;padding:3px 2px;border-bottom:1px solid rgba(255,255,255,.08)">Yds</th>
          <th style="text-align:center;font-size:9px;color:#4a6652;font-weight:500;padding:3px 2px;border-bottom:1px solid rgba(255,255,255,.08)">Par</th>
          <th style="text-align:center;font-size:9px;color:#4a6652;font-weight:500;padding:3px 2px;border-bottom:1px solid rgba(255,255,255,.08)">SI</th>
        </tr></thead>
        <tbody>
          ${holeRows}
          <tr style="border-top:1px solid rgba(255,255,255,.1)">
            <td style="text-align:left;padding:5px 4px;color:#7b9a85;font-size:10px;font-weight:600">IN</td>
            <td style="text-align:center;color:#c9a84b;font-weight:600;font-size:10px">${b9Yards.toLocaleString()}</td>
            <td style="text-align:center;color:#c9a84b;font-weight:600">${b9Par}</td>
            <td style="text-align:center;color:#4a6652">—</td>
          </tr>
          <tr style="border-top:1px solid rgba(255,255,255,.1)">
            <td style="text-align:left;padding:5px 4px;color:#c9a84b;font-size:11px;font-weight:700">TOTAL</td>
            <td style="text-align:center;color:#c9a84b;font-weight:700;font-size:11px">${totalYards.toLocaleString()}</td>
            <td style="text-align:center;color:#c9a84b;font-weight:700;font-size:11px">${totalPar}</td>
            <td style="text-align:center;color:#4a6652">—</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- SI legend -->
    <div style="padding:8px 14px;display:flex;gap:10px;flex-wrap:wrap;border-bottom:1px solid rgba(255,255,255,.06)">
      ${[['#dc503c','SI 1–3 hardest'],['#fb923c','4–6'],['#fbbf24','7–9'],['#4a6652','10–18 easiest']].map(([c,l])=>
        `<div style="display:flex;align-items:center;gap:4px;font-size:10px;color:#4a6652">
          <div style="width:8px;height:8px;border-radius:2px;background:${c}"></div>${l}
        </div>`).join('')}
    </div>

    <!-- Footer -->
    <div style="padding:10px 14px;display:flex;align-items:center;justify-content:space-between">
      <div style="display:flex;align-items:center;gap:6px;font-size:12px;color:#5ec47a">
        <div style="width:16px;height:16px;border-radius:50%;background:rgba(94,196,122,.2);display:flex;align-items:center;justify-content:center;font-size:9px">✓</div>
        18 holes · par, yardage & SI ready
      </div>
      <span onclick="resetCourseSearch()" style="font-size:12px;color:#4a6652;text-decoration:underline;cursor:pointer">Wrong course?</span>
    </div>
  </div>`;
}

// ─── Main render ──────────────────────────────────────────────
function renderCourse(){
  const el=ensureScr('course');

  if(_courseImported && _selectedCourse && _selectedTee){
    // Show the imported confirmation card
    const holes=S.holes.map(h=>({par:h.par,si:h.si,yardage:h.yardage||0}));
    el.innerHTML=`
    <div class="topbar">
      <button class="back-btn" onclick="nav('games')">‹</button>
      <h2>Course Setup</h2>
    </div>
    <div class="scroll">
      <div style="text-align:center;margin-bottom:16px">
        <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;font-weight:600">Course Imported</div>
      </div>
      ${buildConfirmCard(_selectedCourse, _selectedTee, holes)}
      <button class="btn btn-gold" style="font-size:16px;font-weight:700;padding:17px;border-radius:13px" onclick="startRound()">Continue to Strokes →</button>
      <div style="text-align:center;font-size:11px;color:#4a6652;margin-top:10px">All course data locked in — no manual entry needed</div>
      <div class="safe"></div>
    </div>`;
    return;
  }

  // Normal search/manual view
  function parBtn(h,p){
    const sel=S.holes[h].par===p;
    return `<button onclick="setPar(${h},${p})" style="width:38px;height:34px;border-radius:8px;border:1px solid ${sel?'var(--gold)':'var(--brd)'};background:${sel?'var(--gold)':'var(--dim)'};color:${sel?'#091510':'var(--mut)'};font-family:Outfit,sans-serif;font-size:14px;font-weight:${sel?'600':'400'};cursor:pointer">${p}</button>`;
  }
  const front=S.holes.slice(0,9).reduce((a,h)=>a+h.par,0);
  const back=S.holes.slice(9).reduce((a,h)=>a+h.par,0);
  const scanned=S.holes.some(h=>h._scanned);

  el.innerHTML=`
<div class="topbar">
  <button class="back-btn" onclick="nav('games')">‹</button>
  <h2>Course Setup</h2>
</div>
<div class="scroll">

  <!-- Course Search -->
  <div style="background:var(--card);border:1px solid var(--brd);border-radius:12px;padding:14px;margin-bottom:12px">
    <div style="font-size:13px;font-weight:500;margin-bottom:4px">🔍 Find your course</div>
    <div style="font-size:12px;color:var(--mut);margin-bottom:10px;line-height:1.5">Search by name — pars, stroke indexes and yardage load automatically.</div>
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

  <!-- Manual entry toggle -->
  <div onclick="toggleManualEntry()" style="display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;margin-bottom:12px;cursor:pointer;border:1px dashed rgba(255,255,255,.1);border-radius:10px;background:rgba(255,255,255,.02)">
    <span id="manual-toggle-icon" style="font-size:14px;color:#4a6652;transition:transform .25s">▼</span>
    <span style="font-size:13px;color:var(--mut)"><span style="color:var(--gold);font-weight:500">Enter manually</span> — set par and stroke index per hole</span>
  </div>

  <div id="manual-entry-panel" style="display:none">
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
  </div>

  <button class="btn btn-gold" style="margin-top:16px" onclick="startRound()">⛳ Tee Off</button>
  <div class="safe"></div>
</div>`;
}

// ─── Toggle manual entry ──────────────────────────────────────
window.toggleManualEntry=function(){
  const panel=document.getElementById('manual-entry-panel');
  const icon=document.getElementById('manual-toggle-icon');
  if(!panel) return;
  const isOpen=panel.style.display!=='none';
  panel.style.display=isOpen?'none':'block';
  if(icon) icon.style.transform=isOpen?'':'rotate(180deg)';
};

// ─── Course Search ─────────────────────────────────────────────
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
      container.innerHTML=courses.slice(0,8).map((c,idx)=>{
        const loc=c.location;
        const city=loc?[loc.city,loc.state||loc.country].filter(Boolean).join(', '):'';
        const name=(c.club_name||c.course_name||'').replace(/'/g,"\\'").replace(/"/g,'&quot;');
        // Get total par from first available tee
        const tees=flattenTees(c);
        const firstTee=tees[0];
        const totalPar=firstTee?.holes?.reduce((s,h)=>s+h.par,0)||'—';
        return `<div onclick="selectCourse(${idx},'${name}')" style="padding:10px 0;border-bottom:1px solid var(--brd);cursor:pointer;border-left:3px solid transparent;padding-left:8px" onmouseover="this.style.borderLeftColor='var(--gold)'" onmouseout="this.style.borderLeftColor='transparent'">
          <div style="font-size:14px;font-weight:500">${c.club_name||c.course_name}</div>
          <div style="font-size:11px;color:var(--mut)">${city}${totalPar!=='—'?' · 18 holes · Par '+totalPar:''}</div>
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

  // Flatten tees and pick default
  _allTees=flattenTees(course);
  if(!_allTees.length){
    if(container) container.innerHTML=`<div style="padding:10px;color:var(--red);font-size:13px">No tee data available — please enter manually.</div>`;
    return;
  }

  // Pick preferred tee
  _selectedTee=_allTees[0];
  const preferred=['white','blue','regular','men'];
  for(const p of preferred){
    const found=_allTees.find(t=>t.tee_name?.toLowerCase().includes(p));
    if(found){_selectedTee=found;break;}
  }

  const holes=parseTeeHoles(_selectedTee);
  if(!holes||holes.length!==18){
    if(container) container.innerHTML=`<div style="padding:10px;color:var(--red);font-size:13px">Course data incomplete (${holes?holes.length:0} holes) — please enter manually.</div>`;
    return;
  }

  // Apply to state
  applyHolesToState(holes, course, courseName);
  _selectedCourse=course;
  _courseImported=true;
  renderCourse();
};

window.showTeeSelector=function(){
  const sel=document.getElementById('tee-selector');
  if(sel) sel.style.display=sel.style.display==='none'?'block':'none';
};

window.changeTee=function(teeIdx){
  if(!_allTees[teeIdx]) return;
  _selectedTee=_allTees[teeIdx];
  const holes=parseTeeHoles(_selectedTee);
  if(!holes||holes.length!==18) return;
  applyHolesToState(holes, _selectedCourse, _courseName);
  renderCourse();
};

window.resetCourseSearch=function(){
  _courseImported=false;
  _selectedCourse=null;
  _selectedTee=null;
  _allTees=[];
  _courseName='';
  S.holes=S.holes.map((_,i)=>({par:4,si:SI[i]}));
  renderCourse();
};

// ─── Helpers ──────────────────────────────────────────────────
function flattenTees(course){
  if(!course||!course.tees) return [];
  if(Array.isArray(course.tees)) return course.tees;
  if(typeof course.tees==='object'){
    return course.tees.male||course.tees.female||Object.values(course.tees).flat();
  }
  return [];
}

function parseTeeHoles(tee){
  if(!tee||!tee.holes||tee.holes.length===0) return null;
  return tee.holes.map(h=>({
    par:h.par,
    si:h.handicap||h.stroke_index||0,
    yardage:h.yardage||h.distance||0
  }));
}

function applyHolesToState(holes, course, courseName){
  holes.forEach((h,i)=>{
    S.holes[i]={par:h.par, si:h.si, yardage:h.yardage, _fromApi:true};
  });
  _courseName=course?.course_name||course?.club_name||courseName||'Course';
  S.courseName=_courseName;
  if(_selectedTee){
    S.courseRating=_selectedTee.course_rating;
    S.slopeRating=_selectedTee.slope_rating;
    S.teeName=_selectedTee.tee_name;
  }
}

// ─── Manual controls ───────────────────────────────────────────
window.setPar=(h,p)=>{S.holes[h].par=p;renderCourse();};
window.setSI=(h,si)=>{S.holes[h].si=si;renderCourse();};
window.setAllPar=function(){
  S.holes=S.holes.map((_,i)=>({par:4,si:SI[i]}));
  _courseName='';
  _courseImported=false;
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
