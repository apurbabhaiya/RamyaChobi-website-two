insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('homepage-video', 'homepage-video', true, 52428800, array['video/mp4'])
on conflict (id) do nothing;
