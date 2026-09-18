-- Corrige un candado en la sección 4 de supabase-schema.md: "profiles_admin" exige permiso
-- 'mantenimiento' para CUALQUIER operación sobre profiles, incluyendo select. Eso bloquea la
-- pantalla de registro (sin sesión) que necesita leer id/name de los perfiles para el selector.
-- Esta política adicional solo habilita LECTURA pública; insert/update/delete siguen
-- restringidos a 'mantenimiento' por la política existente (las políticas de select se
-- combinan con OR, así que esta no reemplaza a la otra, solo la complementa).

create policy "profiles_public_read" on public.profiles for select
  using (true);
