import './style.css'
import { S, load } from './state.js'
import { nav, render } from './router.js'
import { supabase } from './supabase.js'
import { getSession, onAuthChange } from './auth/auth.js'
import { createProfileIfNeeded, getProfile } from './profile/profile.js'
import { loadGroups } from './groups/groups-ui.js'

// Register all screens
import './auth/auth-ui.js'
import './profile/profile-ui.js'
import './groups/groups-ui.js'
import './betting/home-ui.js'
import './betting/setup-ui.js'
import './betting/games-ui.js'
import './betting/course-ui.js'
import './betting/strokes-ui.js'
import './betting/scorecard-ui.js'
import './betting/live-ui.js'
import './betting/settlement-ui.js'
import './betting/nineteenth-ui.js'
import './betting/share-card.js'
import './betting/history-ui.js'
import './betting/scan.js'
import './rounds/rounds-ui.js'
import './leaderboard/leaderboard-ui.js'
import './debts/debts-ui.js'
import './share/share.js'
import './landing/landing-ui.js'

// Expose S globally for inline oninput handlers like "S.players[0].name=this.value"
window.S = S;

async function init(){
  // Load localStorage data
  load();

  // Check for shared round URL: /round/:id
  const path = window.location.pathname;
  if(path.startsWith('/round/')){
    S._viewRoundId = path.split('/round/')[1];
    S.screen = 'shared-round';
    render();
    return;
  }

  // Check for join invite URL: /join?code=XXX
  const params = new URLSearchParams(window.location.search);
  const joinCode = params.get('code');

  // Check for password reset callback
  const hash = window.location.hash;
  if(hash.includes('type=recovery')){
    S.screen = 'reset-password';
    render();
    return;
  }

  // Check auth session
  try{
    const session = await getSession();
    if(session?.user){
      await setupUser(session.user);
      if(joinCode){
        S.screen = 'join-group';
      }else{
        S.screen = 'home';
      }
    }else{
      S.screen = 'landing';
    }
  }catch(e){
    console.error('Auth init failed:', e);
    S.screen = 'landing';
  }
  try{
    render();
  }catch(e){
    console.error('Render failed:', e);
    // Fallback: show landing page directly
    document.getElementById('app').innerHTML='<div style="text-align:center;padding:60px 20px;color:#ede8d8"><div style="font-size:48px;margin-bottom:16px">⛳</div><div style="font-family:Georgia,serif;font-size:24px;color:#c9a84b;margin-bottom:8px">Fairway Bets</div><div style="color:#7b9a85;margin-bottom:20px">Something went wrong loading the app.</div><button onclick="location.reload()" style="background:#c9a84b;color:#000;border:none;padding:12px 24px;border-radius:8px;font-weight:700;cursor:pointer">Reload</button></div>';
  }
}

async function setupUser(user){
  S.user = user;
  try{
    S.profile = await createProfileIfNeeded(user);
  }catch(e){
    console.error('Profile setup failed:', e);
    // Try to just get the profile
    try{ S.profile = await getProfile(user.id); }catch(e2){}
  }
  try{
    await loadGroups();
  }catch(e){
    console.error('Groups load failed:', e);
  }
}

// Listen for auth state changes
onAuthChange(async (event, session) => {
  if(event === 'SIGNED_IN' && session?.user){
    await setupUser(session.user);
    if(S.screen === 'login' || S.screen === 'signup'){
      nav('home');
    }
  }else if(event === 'SIGNED_OUT'){
    S.user = null;
    S.profile = null;
    S.groups = [];
    S.currentGroupId = null;
    nav('landing');
  }else if(event === 'PASSWORD_RECOVERY'){
    nav('reset-password');
  }
});

init();
