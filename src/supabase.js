import { createClient } from '@supabase/supabase-js';

// Tus credenciales de Supabase
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error("Faltan las variables de entorno de Supabase. Revisa tu archivo .env");
  }
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);