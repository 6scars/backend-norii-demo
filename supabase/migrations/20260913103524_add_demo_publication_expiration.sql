alter table public.song_publication_consents
  add column if not exists expires_at timestamp with time zone;

update public.song_publication_consents
set expires_at = accepted_at + interval '15 minutes'
where expires_at is null;

alter table public.song_publication_consents
  alter column expires_at set default (now() + interval '15 minutes'),
  alter column expires_at set not null;

create index if not exists song_publication_consents_expiration_idx
  on public.song_publication_consents (expires_at, song_id);
