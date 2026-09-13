insert into public.types (type_name)
values
  ('Calming'),
  ('Mystical'),
  ('Relaxed'),
  ('Electronic'),
  ('Ambient Electronic'),
  ('Minimal Electronic'),
  ('Jazz'),
  ('Free-Jazz'),
  ('Nu-Jazz'),
  ('Modern Jazz'),
  ('Jazz: Out'),
  ('Jazz:Vocal'),
  ('Blues'),
  ('Instrumental')
on conflict (type_name) do nothing;
