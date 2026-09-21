import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/**
 * Crea una cuenta de usuario sin afectar la sesión del administrador que la está creando.
 * Usa un cliente de Supabase aparte (sin persistir sesión) solo para este signUp, porque
 * el cliente principal (src/lib/supabase.js) reemplazaría la sesión activa por la del
 * usuario recién creado si se usara directamente.
 */
export async function createUserAccount({ name, email, phone, password, profileId }) {
  const ephemeralClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  })

  return ephemeralClient.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
        phone,
        profile_id: profileId || null,
      },
    },
  })
}
