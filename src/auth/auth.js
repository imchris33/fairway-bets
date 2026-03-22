import { supabase } from '../supabase.js'

export async function signUp(email, password){
  if(!supabase) throw new Error('Not connected to server');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if(error) throw error;
  return data;
}

export async function signIn(email, password){
  if(!supabase) throw new Error('Not connected to server');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data;
}

export async function signOut(){
  if(!supabase) return;
  const { error } = await supabase.auth.signOut();
  if(error) throw error;
}

export async function resetPassword(email){
  if(!supabase) throw new Error('Not connected to server');
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/#reset-password'
  });
  if(error) throw error;
}

export async function updatePassword(newPassword){
  if(!supabase) throw new Error('Not connected to server');
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if(error) throw error;
}

export async function getSession(){
  if(!supabase) return null;
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthChange(callback){
  if(!supabase) return { data: { subscription: { unsubscribe(){} } } };
  return supabase.auth.onAuthStateChange(callback);
}
