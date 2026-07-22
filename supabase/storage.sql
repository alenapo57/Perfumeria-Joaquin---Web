-- =========================================================
-- Storage: bucket de imágenes de productos
-- Correr esto en el SQL Editor de Supabase, DESPUÉS de schema.sql.
-- =========================================================

-- Bucket público (las imágenes de producto son públicas por diseño:
-- cualquiera que entra al catálogo tiene que poder verlas).
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

-- Lectura pública de las imágenes del bucket 'products'.
create policy "products bucket: lectura pública"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'products');

-- Solo el admin puede subir, reemplazar o borrar imágenes.
create policy "products bucket: escritura solo admin"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'products' and is_admin());

create policy "products bucket: update solo admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'products' and is_admin())
  with check (bucket_id = 'products' and is_admin());

create policy "products bucket: delete solo admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'products' and is_admin());
