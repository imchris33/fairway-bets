import { S } from './state.js'

const screens = {};

export function registerScreen(name, renderFn){
  screens[name] = renderFn;
}

export function nav(s){
  S.screen=s;
  document.querySelectorAll('.screen').forEach(el=>el.classList.remove('active'));
  render();
  window.scrollTo(0,0);
}

export function render(){
  if(screens[S.screen]) screens[S.screen]();
}

// Expose nav globally for onclick handlers
window.nav = nav;
