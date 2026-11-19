-- Guest wishes / comments with moderation for RamyaChobi wedding invitations.
create table if not exists public.wedding_invitation_comments (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null references public.wedding_invitations(id) on delete cascade,
  guest_name text not null check (char_length(btrim(guest_name)) between 2 and 120),
  message text not null check (char_length(btrim(message)) between 2 and 500),
  approved boolean not null default false,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists wedding_invitation_comments_invitation_idx
  on public.wedding_invitation_comments(invitation_id, approved, created_at desc);

alter table public.wedding_invitation_comments enable row level security;
revoke all on table public.wedding_invitation_comments from public, anon, authenticated;

create or replace function public.submit_wedding_invitation_comment(
  p_slug text,
  p_guest_name text,
  p_message text,
  p_website text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_invitation_id uuid;
begin
  -- Honeypot: silently accept automated submissions without storing them.
  if coalesce(btrim(p_website), '') <> '' then
    return jsonb_build_object('success', true, 'message', 'Thank you. Your message has been received.');
  end if;

  if char_length(btrim(coalesce(p_guest_name, ''))) < 2
     or char_length(btrim(coalesce(p_guest_name, ''))) > 120 then
    raise exception 'Please enter a name between 2 and 120 characters';
  end if;
  if char_length(btrim(coalesce(p_message, ''))) < 2
     or char_length(btrim(coalesce(p_message, ''))) > 500 then
    raise exception 'Please enter a message between 2 and 500 characters';
  end if;

  select i.id into v_invitation_id
  from public.wedding_invitations i
  where i.slug = lower(btrim(coalesce(p_slug, '')))
    and i.status = 'published';

  if v_invitation_id is null then
    raise exception 'This invitation is not available';
  end if;

  insert into public.wedding_invitation_comments(invitation_id, guest_name, message)
  values (
    v_invitation_id,
    left(btrim(p_guest_name), 120),
    left(btrim(p_message), 500)
  );

  return jsonb_build_object(
    'success', true,
    'message', 'Thank you. Your wish has been submitted and will appear after approval.'
  );
end;
$function$;

create or replace function public.get_wedding_invitation_comments(p_slug text)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_comments jsonb;
begin
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', c.id,
      'guest_name', c.guest_name,
      'message', c.message,
      'created_at', c.created_at
    ) order by c.created_at desc
  ), '[]'::jsonb)
  into v_comments
  from public.wedding_invitation_comments c
  join public.wedding_invitations i on i.id = c.invitation_id
  where i.slug = lower(btrim(coalesce(p_slug, '')))
    and i.status = 'published'
    and c.approved = true
    and c.created_at > now() - interval '2 years';

  return v_comments;
end;
$function$;

create or replace function public.wedding_invitation_comment_admin(
  p_token text,
  p_action text,
  p_payload jsonb default '{}'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_id uuid;
  v_approved boolean;
begin
  if not coalesce(public._booking_admin_valid(p_token), false) then
    raise exception 'Admin session expired';
  end if;

  if p_action = 'dashboard' then
    return jsonb_build_object(
      'comments', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', c.id,
          'invitation_id', c.invitation_id,
          'invitation_title', i.title,
          'slug', i.slug,
          'client_name', cl.client_name,
          'guest_name', c.guest_name,
          'message', c.message,
          'approved', c.approved,
          'reviewed_at', c.reviewed_at,
          'created_at', c.created_at
        ) order by c.created_at desc)
        from public.wedding_invitation_comments c
        join public.wedding_invitations i on i.id = c.invitation_id
        join public.wedding_invitation_clients cl on cl.id = i.client_id
      ), '[]'::jsonb)
    );
  end if;

  if p_action = 'moderate' then
    v_id := nullif(p_payload->>'id', '')::uuid;
    v_approved := coalesce((p_payload->>'approved')::boolean, false);
    if v_id is null then raise exception 'Comment ID is required'; end if;
    update public.wedding_invitation_comments
    set approved = v_approved,
        reviewed_at = now()
    where id = v_id;
    if not found then raise exception 'Comment was not found'; end if;
    return jsonb_build_object('success', true, 'approved', v_approved);
  end if;

  if p_action = 'delete' then
    v_id := nullif(p_payload->>'id', '')::uuid;
    if v_id is null then raise exception 'Comment ID is required'; end if;
    delete from public.wedding_invitation_comments where id = v_id;
    return jsonb_build_object('success', true);
  end if;

  raise exception 'Unsupported comment action';
end;
$function$;

revoke all on function public.submit_wedding_invitation_comment(text, text, text, text) from public;
revoke all on function public.get_wedding_invitation_comments(text) from public;
revoke all on function public.wedding_invitation_comment_admin(text, text, jsonb) from public;

grant execute on function public.submit_wedding_invitation_comment(text, text, text, text) to anon, authenticated;
grant execute on function public.get_wedding_invitation_comments(text) to anon, authenticated;
grant execute on function public.wedding_invitation_comment_admin(text, text, jsonb) to anon, authenticated;
