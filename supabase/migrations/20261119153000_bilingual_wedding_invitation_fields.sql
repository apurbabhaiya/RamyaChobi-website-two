-- Add English + Bangla content fields for bilingual invitation pages.
alter table public.wedding_invitation_clients
  add column if not exists bride_name_bn text not null default '',
  add column if not exists groom_name_bn text not null default '';

alter table public.wedding_invitations
  add column if not exists title_bn text not null default '',
  add column if not exists welcome_message_bn text not null default '',
  add column if not exists dress_code_bn text not null default '';

alter table public.wedding_invitation_events
  add column if not exists title_bn text not null default '',
  add column if not exists venue_bn text not null default '',
  add column if not exists address_bn text not null default '',
  add column if not exists notes_bn text not null default '';

create or replace function public.wedding_invitation_admin(
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
  v_client_id uuid;
  v_booking_id uuid;
  v_invitation_id uuid;
  v_slug text;
  v_status text;
  v_theme text;
  v_gallery text[];
  v_booking public.booking_clients%rowtype;
  v_client public.wedding_invitation_clients%rowtype;
  v_invitation public.wedding_invitations%rowtype;
  v_guest public.wedding_invitation_guests%rowtype;
  v_name text;
  v_phone text;
  v_email text;
  v_bride text;
  v_groom text;
  v_address text;
begin
  if not coalesce(public._booking_admin_valid(p_token), false) then
    raise exception 'Admin session expired';
  end if;

  if p_action = 'dashboard' then
    return jsonb_build_object(
      'booking_clients', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', b.id,
          'reference_no', b.reference_no,
          'client_name', b.client_name,
          'phone', b.phone,
          'email', b.email,
          'bride_name', b.bride_name,
          'groom_name', b.groom_name,
          'address', b.address,
          'status', b.status,
          'created_at', b.created_at
        ) order by b.created_at desc)
        from public.booking_clients b
        where b.deleted_at is null
      ), '[]'::jsonb),
      'clients', coalesce((
        select jsonb_agg(to_jsonb(c) order by c.updated_at desc)
        from public.wedding_invitation_clients c
      ), '[]'::jsonb),
      'invitations', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', i.id,
          'client_id', i.client_id,
          'slug', i.slug,
          'title', i.title,
          'title_bn', i.title_bn,
          'welcome_message', i.welcome_message,
          'welcome_message_bn', i.welcome_message_bn,
          'cover_image_url', i.cover_image_url,
          'couple_photo_url', i.couple_photo_url,
          'theme', i.theme,
          'rsvp_deadline', i.rsvp_deadline,
          'dress_code', i.dress_code,
          'dress_code_bn', i.dress_code_bn,
          'gallery_images', i.gallery_images,
          'show_countdown', i.show_countdown,
          'status', i.status,
          'created_at', i.created_at,
          'updated_at', i.updated_at,
          'client_name', c.client_name,
          'bride_name', c.bride_name,
          'bride_name_bn', c.bride_name_bn,
          'groom_name', c.groom_name,
          'groom_name_bn', c.groom_name_bn,
          'phone', c.phone,
          'event_count', (select count(*) from public.wedding_invitation_events e where e.invitation_id = i.id),
          'guest_count', (select count(*) from public.wedding_invitation_guests g where g.invitation_id = i.id),
          'rsvp_count', (select count(*) from public.wedding_invitation_rsvps r where r.invitation_id = i.id)
        ) order by i.updated_at desc)
        from public.wedding_invitations i
        join public.wedding_invitation_clients c on c.id = i.client_id
      ), '[]'::jsonb),
      'events', coalesce((
        select jsonb_agg(to_jsonb(e) order by e.event_date, e.sort_order, e.created_at)
        from public.wedding_invitation_events e
      ), '[]'::jsonb),
      'guests', coalesce((
        select jsonb_agg(to_jsonb(g) order by g.guest_name)
        from public.wedding_invitation_guests g
      ), '[]'::jsonb),
      'rsvps', coalesce((
        select jsonb_agg(to_jsonb(r) order by r.created_at desc)
        from public.wedding_invitation_rsvps r
      ), '[]'::jsonb)
    );
  end if;

  if p_action = 'save_client' then
    v_id := nullif(p_payload->>'id', '')::uuid;
    v_booking_id := nullif(p_payload->>'booking_id', '')::uuid;

    if v_booking_id is not null then
      select * into v_booking
      from public.booking_clients b
      where b.id = v_booking_id and b.deleted_at is null;
      if not found then raise exception 'Existing booking client was not found'; end if;
    end if;

    v_name := coalesce(nullif(btrim(p_payload->>'client_name'), ''), v_booking.client_name);
    v_bride := coalesce(nullif(btrim(p_payload->>'bride_name'), ''), v_booking.bride_name, '');
    v_groom := coalesce(nullif(btrim(p_payload->>'groom_name'), ''), v_booking.groom_name, '');
    v_phone := coalesce(nullif(btrim(p_payload->>'phone'), ''), v_booking.phone, '');
    v_email := coalesce(nullif(btrim(p_payload->>'email'), ''), v_booking.email, '');
    v_address := coalesce(nullif(btrim(p_payload->>'address'), ''), v_booking.address, '');

    if coalesce(v_name, '') = '' then raise exception 'Client name is required'; end if;

    if v_id is not null then
      update public.wedding_invitation_clients
      set booking_id = v_booking_id,
          client_name = v_name,
          bride_name = coalesce(v_bride, ''),
          bride_name_bn = coalesce(p_payload->>'bride_name_bn', ''),
          groom_name = coalesce(v_groom, ''),
          groom_name_bn = coalesce(p_payload->>'groom_name_bn', ''),
          phone = coalesce(v_phone, ''),
          email = coalesce(v_email, ''),
          address = coalesce(v_address, ''),
          notes = coalesce(p_payload->>'notes', ''),
          updated_at = now()
      where id = v_id
      returning * into v_client;
      if not found then raise exception 'Invitation client was not found'; end if;
    elsif v_booking_id is not null then
      insert into public.wedding_invitation_clients(
        booking_id, client_name, bride_name, bride_name_bn, groom_name, groom_name_bn, phone, email, address, notes
      ) values (
        v_booking_id, v_name, coalesce(v_bride, ''), coalesce(p_payload->>'bride_name_bn', ''),
        coalesce(v_groom, ''), coalesce(p_payload->>'groom_name_bn', ''),
        coalesce(v_phone, ''), coalesce(v_email, ''), coalesce(v_address, ''),
        coalesce(p_payload->>'notes', '')
      )
      on conflict (booking_id) do update set
        client_name = excluded.client_name,
        bride_name = excluded.bride_name,
        bride_name_bn = excluded.bride_name_bn,
        groom_name = excluded.groom_name,
        groom_name_bn = excluded.groom_name_bn,
        phone = excluded.phone,
        email = excluded.email,
        address = excluded.address,
        notes = excluded.notes,
        updated_at = now()
      returning * into v_client;
    else
      insert into public.wedding_invitation_clients(
        client_name, bride_name, bride_name_bn, groom_name, groom_name_bn, phone, email, address, notes
      ) values (
        v_name, coalesce(v_bride, ''), coalesce(p_payload->>'bride_name_bn', ''),
        coalesce(v_groom, ''), coalesce(p_payload->>'groom_name_bn', ''),
        coalesce(v_phone, ''), coalesce(v_email, ''), coalesce(v_address, ''),
        coalesce(p_payload->>'notes', '')
      )
      returning * into v_client;
    end if;

    return jsonb_build_object('client_id', v_client.id, 'client', to_jsonb(v_client));
  end if;

  if p_action = 'save_invitation' then
    v_id := nullif(p_payload->>'id', '')::uuid;
    v_client_id := nullif(p_payload->>'client_id', '')::uuid;
    if v_client_id is null or not exists (
      select 1 from public.wedding_invitation_clients c where c.id = v_client_id
    ) then
      raise exception 'Choose a valid client before saving the invitation';
    end if;

    v_slug := lower(regexp_replace(btrim(coalesce(p_payload->>'slug', '')), '[^a-z0-9]+', '-', 'g'));
    v_slug := trim(both '-' from v_slug);
    if v_slug = '' then raise exception 'Invitation URL slug is required'; end if;
    if exists (
      select 1 from public.wedding_invitations i
      where i.slug = v_slug and (v_id is null or i.id <> v_id)
    ) then
      raise exception 'This invitation URL is already in use';
    end if;

    v_status := coalesce(nullif(p_payload->>'status', ''), 'draft');
    if v_status not in ('draft', 'published', 'archived') then raise exception 'Invalid invitation status'; end if;
    v_theme := coalesce(nullif(p_payload->>'theme', ''), 'ivory-gold');
    if v_theme not in ('ivory-gold', 'maroon-gold', 'charcoal-gold', 'rose-ivory') then raise exception 'Invalid invitation theme'; end if;

    v_gallery := array(
      select btrim(value)
      from jsonb_array_elements_text(coalesce(p_payload->'gallery_images', '[]'::jsonb)) as value
      where btrim(value) <> ''
      limit 30
    );

    if v_id is not null then
      update public.wedding_invitations
      set client_id = v_client_id,
          slug = v_slug,
          title = coalesce(nullif(btrim(p_payload->>'title'), ''), 'Wedding Invitation'),
          title_bn = coalesce(p_payload->>'title_bn', ''),
          welcome_message = coalesce(p_payload->>'welcome_message', ''),
          welcome_message_bn = coalesce(p_payload->>'welcome_message_bn', ''),
          cover_image_url = coalesce(p_payload->>'cover_image_url', ''),
          couple_photo_url = coalesce(p_payload->>'couple_photo_url', ''),
          theme = v_theme,
          rsvp_deadline = nullif(p_payload->>'rsvp_deadline', '')::date,
          dress_code = coalesce(p_payload->>'dress_code', ''),
          dress_code_bn = coalesce(p_payload->>'dress_code_bn', ''),
          gallery_images = coalesce(v_gallery, '{}'::text[]),
          show_countdown = coalesce((p_payload->>'show_countdown')::boolean, true),
          status = v_status,
          updated_at = now()
      where id = v_id
      returning * into v_invitation;
      if not found then raise exception 'Invitation was not found'; end if;
    else
      insert into public.wedding_invitations(
        client_id, slug, title, title_bn, welcome_message, welcome_message_bn, cover_image_url, couple_photo_url,
        theme, rsvp_deadline, dress_code, dress_code_bn, gallery_images, show_countdown, status
      ) values (
        v_client_id, v_slug,
        coalesce(nullif(btrim(p_payload->>'title'), ''), 'Wedding Invitation'),
        coalesce(p_payload->>'title_bn', ''),
        coalesce(p_payload->>'welcome_message', ''),
        coalesce(p_payload->>'welcome_message_bn', ''),
        coalesce(p_payload->>'cover_image_url', ''),
        coalesce(p_payload->>'couple_photo_url', ''),
        v_theme,
        nullif(p_payload->>'rsvp_deadline', '')::date,
        coalesce(p_payload->>'dress_code', ''),
        coalesce(p_payload->>'dress_code_bn', ''),
        coalesce(v_gallery, '{}'::text[]),
        coalesce((p_payload->>'show_countdown')::boolean, true),
        v_status
      )
      returning * into v_invitation;
    end if;

    return jsonb_build_object('invitation_id', v_invitation.id, 'slug', v_invitation.slug);
  end if;

  if p_action = 'save_event' then
    v_id := nullif(p_payload->>'id', '')::uuid;
    v_invitation_id := nullif(p_payload->>'invitation_id', '')::uuid;
    if v_invitation_id is null or not exists (
      select 1 from public.wedding_invitations i where i.id = v_invitation_id
    ) then raise exception 'Choose a valid invitation first'; end if;
    if coalesce(btrim(p_payload->>'title'), '') = '' then raise exception 'Event title is required'; end if;
    if nullif(p_payload->>'event_date', '') is null then raise exception 'Event date is required'; end if;

    if v_id is not null then
      update public.wedding_invitation_events
      set invitation_id = v_invitation_id,
          event_type = coalesce(nullif(p_payload->>'event_type', ''), 'other'),
          title = btrim(p_payload->>'title'),
          title_bn = coalesce(p_payload->>'title_bn', ''),
          event_date = (p_payload->>'event_date')::date,
          start_time = nullif(p_payload->>'start_time', '')::time,
          end_time = nullif(p_payload->>'end_time', '')::time,
          venue = coalesce(p_payload->>'venue', ''),
          venue_bn = coalesce(p_payload->>'venue_bn', ''),
          address = coalesce(p_payload->>'address', ''),
          address_bn = coalesce(p_payload->>'address_bn', ''),
          maps_url = coalesce(p_payload->>'maps_url', ''),
          notes = coalesce(p_payload->>'notes', ''),
          notes_bn = coalesce(p_payload->>'notes_bn', ''),
          sort_order = coalesce((p_payload->>'sort_order')::integer, 0),
          updated_at = now()
      where id = v_id
      returning id into v_id;
      if not found then raise exception 'Event was not found'; end if;
      return jsonb_build_object('event_id', v_id);
    else
      insert into public.wedding_invitation_events(
        invitation_id, event_type, title, title_bn, event_date, start_time, end_time,
        venue, venue_bn, address, address_bn, maps_url, notes, notes_bn, sort_order
      ) values (
        v_invitation_id,
        coalesce(nullif(p_payload->>'event_type', ''), 'other'),
        btrim(p_payload->>'title'),
        coalesce(p_payload->>'title_bn', ''),
        (p_payload->>'event_date')::date,
        nullif(p_payload->>'start_time', '')::time,
        nullif(p_payload->>'end_time', '')::time,
        coalesce(p_payload->>'venue', ''),
        coalesce(p_payload->>'venue_bn', ''),
        coalesce(p_payload->>'address', ''),
        coalesce(p_payload->>'address_bn', ''),
        coalesce(p_payload->>'maps_url', ''),
        coalesce(p_payload->>'notes', ''),
        coalesce(p_payload->>'notes_bn', ''),
        coalesce((p_payload->>'sort_order')::integer, 0)
      ) returning id into v_id;
      return jsonb_build_object('event_id', v_id);
    end if;
  end if;

  if p_action = 'delete_event' then
    v_id := nullif(p_payload->>'id', '')::uuid;
    delete from public.wedding_invitation_events where id = v_id;
    return jsonb_build_object('success', true);
  end if;

  if p_action = 'save_guest' then
    v_id := nullif(p_payload->>'id', '')::uuid;
    v_invitation_id := nullif(p_payload->>'invitation_id', '')::uuid;
    if v_invitation_id is null or not exists (
      select 1 from public.wedding_invitations i where i.id = v_invitation_id
    ) then raise exception 'Choose a valid invitation first'; end if;
    if coalesce(btrim(p_payload->>'guest_name'), '') = '' then raise exception 'Guest name is required'; end if;

    if v_id is not null then
      update public.wedding_invitation_guests
      set invitation_id = v_invitation_id,
          guest_name = btrim(p_payload->>'guest_name'),
          phone = coalesce(p_payload->>'phone', ''),
          email = coalesce(p_payload->>'email', ''),
          side = coalesce(nullif(p_payload->>'side', ''), 'both'),
          group_name = coalesce(p_payload->>'group_name', ''),
          max_attendees = greatest(1, least(20, coalesce(nullif(p_payload->>'max_attendees', '')::integer, 1))),
          updated_at = now()
      where id = v_id
      returning * into v_guest;
      if not found then raise exception 'Guest was not found'; end if;
    else
      insert into public.wedding_invitation_guests(
        invitation_id, guest_name, phone, email, side, group_name, max_attendees
      ) values (
        v_invitation_id,
        btrim(p_payload->>'guest_name'),
        coalesce(p_payload->>'phone', ''),
        coalesce(p_payload->>'email', ''),
        coalesce(nullif(p_payload->>'side', ''), 'both'),
        coalesce(p_payload->>'group_name', ''),
        greatest(1, least(20, coalesce(nullif(p_payload->>'max_attendees', '')::integer, 1)))
      ) returning * into v_guest;
    end if;
    return jsonb_build_object('guest', to_jsonb(v_guest));
  end if;

  if p_action = 'delete_guest' then
    v_id := nullif(p_payload->>'id', '')::uuid;
    delete from public.wedding_invitation_guests where id = v_id;
    return jsonb_build_object('success', true);
  end if;

  if p_action = 'review_rsvp' then
    v_id := nullif(p_payload->>'id', '')::uuid;
    update public.wedding_invitation_rsvps
    set reviewed = coalesce((p_payload->>'reviewed')::boolean, true)
    where id = v_id;
    return jsonb_build_object('success', true);
  end if;

  if p_action = 'archive_invitation' then
    v_id := nullif(p_payload->>'id', '')::uuid;
    update public.wedding_invitations
    set status = 'archived', updated_at = now()
    where id = v_id;
    return jsonb_build_object('success', true);
  end if;

  raise exception 'Unsupported invitation admin action';
end;
$function$;

create or replace function public.get_wedding_invitation(
  p_slug text,
  p_guest_token text default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_invitation_id uuid;
  v_payload jsonb;
  v_guest jsonb;
begin
  select i.id,
    jsonb_build_object(
      'invitation', jsonb_build_object(
        'id', i.id,
        'slug', i.slug,
        'title', i.title,
        'title_bn', i.title_bn,
        'welcome_message', i.welcome_message,
        'welcome_message_bn', i.welcome_message_bn,
        'cover_image_url', i.cover_image_url,
        'couple_photo_url', i.couple_photo_url,
        'theme', i.theme,
        'rsvp_deadline', i.rsvp_deadline,
        'dress_code', i.dress_code,
        'dress_code_bn', i.dress_code_bn,
        'gallery_images', i.gallery_images,
        'show_countdown', i.show_countdown,
        'client_name', c.client_name,
        'bride_name', c.bride_name,
        'bride_name_bn', c.bride_name_bn,
        'groom_name', c.groom_name,
        'groom_name_bn', c.groom_name_bn
      ),
      'events', coalesce((
        select jsonb_agg(jsonb_build_object(
          'id', e.id,
          'event_type', e.event_type,
          'title', e.title,
          'title_bn', e.title_bn,
          'event_date', e.event_date,
          'start_time', e.start_time,
          'end_time', e.end_time,
          'venue', e.venue,
          'venue_bn', e.venue_bn,
          'address', e.address,
          'address_bn', e.address_bn,
          'maps_url', e.maps_url,
          'notes', e.notes,
          'notes_bn', e.notes_bn,
          'sort_order', e.sort_order
        ) order by e.event_date, e.sort_order)
        from public.wedding_invitation_events e
        where e.invitation_id = i.id
      ), '[]'::jsonb)
    )
  into v_invitation_id, v_payload
  from public.wedding_invitations i
  join public.wedding_invitation_clients c on c.id = i.client_id
  where i.slug = lower(btrim(coalesce(p_slug, '')))
    and i.status = 'published';

  if v_invitation_id is null then return null; end if;

  if nullif(p_guest_token, '') is not null then
    select jsonb_build_object(
      'guest_name', g.guest_name,
      'max_attendees', g.max_attendees,
      'rsvp_status', g.rsvp_status,
      'attending_count', g.attending_count
    )
    into v_guest
    from public.wedding_invitation_guests g
    where g.invitation_id = v_invitation_id
      and g.invite_token = p_guest_token;

    if v_guest is not null then
      v_payload := v_payload || jsonb_build_object('guest', v_guest);
    end if;
  end if;

  return v_payload;
end;
$function$;

create or replace function public.submit_wedding_invitation_rsvp(
  p_slug text,
  p_guest_token text default null,
  p_guest_name text default '',
  p_phone text default '',
  p_email text default '',
  p_attendance text default 'attending',
  p_attendee_count integer default 1,
  p_message text default '',
  p_event_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_invitation_id uuid;
  v_guest_id uuid;
  v_max_attendees integer;
  v_count integer;
  v_attendance text;
begin
  select i.id into v_invitation_id
  from public.wedding_invitations i
  where i.slug = lower(btrim(coalesce(p_slug, '')))
    and i.status = 'published';

  if v_invitation_id is null then raise exception 'This invitation is not available'; end if;

  if exists (
    select 1 from public.wedding_invitations i
    where i.id = v_invitation_id
      and i.rsvp_deadline is not null
      and (now() at time zone 'Asia/Dhaka')::date > i.rsvp_deadline
  ) then
    raise exception 'The RSVP deadline has passed';
  end if;

  v_attendance := coalesce(nullif(p_attendance, ''), 'attending');
  if v_attendance not in ('attending', 'not_attending') then
    raise exception 'Please choose an RSVP response';
  end if;

  if nullif(p_guest_token, '') is not null then
    select g.id, g.max_attendees
    into v_guest_id, v_max_attendees
    from public.wedding_invitation_guests g
    where g.invitation_id = v_invitation_id
      and g.invite_token = p_guest_token;

    if v_guest_id is null then raise exception 'This guest invitation link is invalid'; end if;

    v_count := coalesce(p_attendee_count, 1);
    if v_attendance = 'not_attending' then v_count := 0; end if;
    if v_count < 0 or v_count > v_max_attendees then
      raise exception 'Attendee count exceeds the guest allowance';
    end if;
    if v_attendance = 'attending' and v_count < 1 then
      raise exception 'At least one attendee is required';
    end if;

    update public.wedding_invitation_guests
    set rsvp_status = v_attendance,
        attending_count = v_count,
        message = left(coalesce(p_message, ''), 1000),
        responded_at = now(),
        updated_at = now()
    where id = v_guest_id;

    return jsonb_build_object('success', true, 'message', 'Your RSVP has been saved');
  end if;

  if length(btrim(coalesce(p_guest_name, ''))) < 2 then
    raise exception 'Please enter your name';
  end if;
  if length(regexp_replace(coalesce(p_phone, ''), '[^0-9]', '', 'g')) < 7 then
    raise exception 'Please enter a valid phone number';
  end if;

  v_count := coalesce(p_attendee_count, 1);
  if v_attendance = 'not_attending' then v_count := 0; end if;
  if v_attendance = 'attending' and (v_count < 1 or v_count > 20) then
    raise exception 'Please enter a valid attendee count';
  end if;

  insert into public.wedding_invitation_rsvps(
    invitation_id, event_id, guest_name, phone, email, attendance, attendee_count, message
  ) values (
    v_invitation_id,
    p_event_id,
    left(btrim(p_guest_name), 120),
    left(btrim(p_phone), 30),
    left(btrim(coalesce(p_email, '')), 160),
    v_attendance,
    v_count,
    left(coalesce(p_message, ''), 1000)
  );

  return jsonb_build_object('success', true, 'message', 'Thank you. Your RSVP has been received');
end;
$function$;

