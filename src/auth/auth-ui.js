import { ensureScr, showToast } from '../utils.js'
import { nav, registerScreen } from '../router.js'
import { signUp, signIn, resetPassword, updatePassword } from './auth.js'

function renderLogin(){
  const el=ensureScr('login');
  el.innerHTML=`
<div class="auth-container">
  <div class="auth-logo">⛳</div>
  <div class="auth-title">Fairway Bets</div>
  <div class="auth-sub">Sign in to your account</div>
  <div class="auth-form">
    <div id="login-error"></div>
    <input type="email" id="login-email" placeholder="Email" style="width:100%;margin-bottom:12px">
    <input type="password" id="login-password" placeholder="Password" style="width:100%;margin-bottom:16px">
    <button class="btn btn-gold" id="login-btn">Sign In</button>
    <button class="btn btn-outline" onclick="nav('signup')">Create Account</button>
    <div style="text-align:center;margin-top:12px">
      <button class="auth-link" onclick="nav('forgot')">Forgot password?</button>
    </div>
  </div>
</div>`;
  document.getElementById('login-btn').onclick=async()=>{
    const email=document.getElementById('login-email').value.trim();
    const pw=document.getElementById('login-password').value;
    if(!email||!pw){document.getElementById('login-error').innerHTML=`<div class="auth-error">Please fill in all fields.</div>`;return;}
    document.getElementById('login-btn').textContent='Signing in...';
    document.getElementById('login-btn').disabled=true;
    try{
      await signIn(email,pw);
      // Auth state change listener in main.js handles the redirect
    }catch(e){
      document.getElementById('login-error').innerHTML=`<div class="auth-error">${e.message}</div>`;
      document.getElementById('login-btn').textContent='Sign In';
      document.getElementById('login-btn').disabled=false;
    }
  };
  // Allow enter key
  document.getElementById('login-password').onkeydown=e=>{if(e.key==='Enter')document.getElementById('login-btn').click();};
}

function renderSignup(){
  const el=ensureScr('signup');
  el.innerHTML=`
<div class="auth-container">
  <div class="auth-logo">⛳</div>
  <div class="auth-title">Create Account</div>
  <div class="auth-sub">Join Fairway Bets</div>
  <div class="auth-form">
    <div id="signup-msg"></div>
    <input type="email" id="signup-email" placeholder="Email" style="width:100%;margin-bottom:12px">
    <input type="password" id="signup-password" placeholder="Password (6+ characters)" style="width:100%;margin-bottom:12px">
    <input type="password" id="signup-confirm" placeholder="Confirm password" style="width:100%;margin-bottom:16px">
    <button class="btn btn-gold" id="signup-btn">Create Account</button>
    <button class="btn btn-outline" onclick="nav('login')">Back to Sign In</button>
  </div>
</div>`;
  document.getElementById('signup-btn').onclick=async()=>{
    const email=document.getElementById('signup-email').value.trim();
    const pw=document.getElementById('signup-password').value;
    const confirm=document.getElementById('signup-confirm').value;
    if(!email||!pw||!confirm){document.getElementById('signup-msg').innerHTML=`<div class="auth-error">Please fill in all fields.</div>`;return;}
    if(pw!==confirm){document.getElementById('signup-msg').innerHTML=`<div class="auth-error">Passwords don't match.</div>`;return;}
    if(pw.length<6){document.getElementById('signup-msg').innerHTML=`<div class="auth-error">Password must be at least 6 characters.</div>`;return;}
    document.getElementById('signup-btn').textContent='Creating account...';
    document.getElementById('signup-btn').disabled=true;
    try{
      await signUp(email,pw);
      document.getElementById('signup-msg').innerHTML=`<div class="auth-success">Account created! Check your email to confirm, then sign in.</div>`;
      document.getElementById('signup-btn').textContent='Account Created';
    }catch(e){
      document.getElementById('signup-msg').innerHTML=`<div class="auth-error">${e.message}</div>`;
      document.getElementById('signup-btn').textContent='Create Account';
      document.getElementById('signup-btn').disabled=false;
    }
  };
  document.getElementById('signup-confirm').onkeydown=e=>{if(e.key==='Enter')document.getElementById('signup-btn').click();};
}

function renderForgot(){
  const el=ensureScr('forgot');
  el.innerHTML=`
<div class="auth-container">
  <div class="auth-logo">⛳</div>
  <div class="auth-title">Reset Password</div>
  <div class="auth-sub">We'll send you a reset link</div>
  <div class="auth-form">
    <div id="forgot-msg"></div>
    <input type="email" id="forgot-email" placeholder="Email" style="width:100%;margin-bottom:16px">
    <button class="btn btn-gold" id="forgot-btn">Send Reset Link</button>
    <button class="btn btn-outline" onclick="nav('login')">Back to Sign In</button>
  </div>
</div>`;
  document.getElementById('forgot-btn').onclick=async()=>{
    const email=document.getElementById('forgot-email').value.trim();
    if(!email){document.getElementById('forgot-msg').innerHTML=`<div class="auth-error">Please enter your email.</div>`;return;}
    document.getElementById('forgot-btn').textContent='Sending...';
    document.getElementById('forgot-btn').disabled=true;
    try{
      await resetPassword(email);
      document.getElementById('forgot-msg').innerHTML=`<div class="auth-success">Reset link sent! Check your email.</div>`;
    }catch(e){
      document.getElementById('forgot-msg').innerHTML=`<div class="auth-error">${e.message}</div>`;
      document.getElementById('forgot-btn').textContent='Send Reset Link';
      document.getElementById('forgot-btn').disabled=false;
    }
  };
}

function renderResetPassword(){
  const el=ensureScr('reset-password');
  el.innerHTML=`
<div class="auth-container">
  <div class="auth-logo">⛳</div>
  <div class="auth-title">New Password</div>
  <div class="auth-sub">Choose a new password</div>
  <div class="auth-form">
    <div id="reset-msg"></div>
    <input type="password" id="reset-password" placeholder="New password (6+ characters)" style="width:100%;margin-bottom:12px">
    <input type="password" id="reset-confirm" placeholder="Confirm new password" style="width:100%;margin-bottom:16px">
    <button class="btn btn-gold" id="reset-btn">Update Password</button>
  </div>
</div>`;
  document.getElementById('reset-btn').onclick=async()=>{
    const pw=document.getElementById('reset-password').value;
    const confirm=document.getElementById('reset-confirm').value;
    if(!pw||!confirm){document.getElementById('reset-msg').innerHTML=`<div class="auth-error">Please fill in all fields.</div>`;return;}
    if(pw!==confirm){document.getElementById('reset-msg').innerHTML=`<div class="auth-error">Passwords don't match.</div>`;return;}
    if(pw.length<6){document.getElementById('reset-msg').innerHTML=`<div class="auth-error">Password must be at least 6 characters.</div>`;return;}
    try{
      await updatePassword(pw);
      document.getElementById('reset-msg').innerHTML=`<div class="auth-success">Password updated! Redirecting...</div>`;
      setTimeout(()=>nav('home'),1500);
    }catch(e){
      document.getElementById('reset-msg').innerHTML=`<div class="auth-error">${e.message}</div>`;
    }
  };
}

registerScreen('login', renderLogin);
registerScreen('signup', renderSignup);
registerScreen('forgot', renderForgot);
registerScreen('reset-password', renderResetPassword);
