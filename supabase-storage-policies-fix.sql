-- La sección 5 de supabase-schema.md solo definió políticas de select e insert sobre
-- storage.objects para el bucket product-images. Subir una foto nueva funciona, pero
-- reemplazar la foto de un producto ya existente (mismo path, upsert) o eliminarla
-- necesita también update/delete, que hoy no están permitidos.

create policy "product_images_update" on storage.objects for update
  using (bucket_id = 'product-images' and auth.uid() is not null)
  with check (bucket_id = 'product-images' and auth.uid() is not null);

create policy "product_images_delete" on storage.objects for delete
  using (bucket_id = 'product-images' and auth.uid() is not null);
