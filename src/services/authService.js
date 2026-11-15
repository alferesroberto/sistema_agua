import { supabase } from './supabase';

export async function iniciarSesion(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.session;
}

export async function cerrarSesion() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function obtenerSesion() {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

export function suscribirSesion(callback) {
  const {
    data: { subscription }
  } = supabase.auth.onAuthStateChange((_evento, session) => {
    callback(session);
  });

  return () => subscription.unsubscribe();
}
