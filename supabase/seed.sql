-- LOCAL Supabase seed (applied by `supabase db reset` after migrations).
-- Creates the public image bucket with the same limits the cloud guide asks for.
-- The local admin user must be created in Studio (http://localhost:54323 →
-- Authentication → Add user), e.g. admin@local.test / admin123 — signups are
-- disabled in config.toml so any authenticated user is the admin.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 2097152, array['image/*'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
