import { supabase } from '../supabase.js'

export async function signUp(email, password){
  const { data, error } = await supabase.auth.signUp({ email, password });
  if(error) throw error;
  return data;
}

export async function signIn(email, password){
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if(error) throw error;
  return data;
}

export async function signOut(){
  const { error } = await supabase.auth.signOut();
  if(error) throw error;
}

export async function resetPassword(email){
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin + '/#reset-password'
  });
  if(error) throw error;
}

export async function updatePassword(newPassword){
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if(error) throw error;
}

export async function getSession(){
  const { data: { session } } = await supabase.auth.getSession();
  return session;
}

export function onAuthChange(callback){
  return supabase.auth.onAuthStateChange(callback);
}
