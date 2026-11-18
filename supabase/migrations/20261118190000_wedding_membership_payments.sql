-- Wedding membership payment submissions.
-- The table lives in the non-exposed private schema; public clients can only submit
-- through a narrowly-scoped RPC. Admin access reuses the existing booking admin token.

create table private.wedding_membership_payments (
  id uuid primary key,
  reference_code text not null unique,
  client_name text not null check (char_length(btrim(client_name)) between 2 and 100),
  phone text not null check (char_length(btrim(phone)) between 7 and 20),
  selected_package text check (
    selected_package is null or selected_package in (
      'Hindu Groom', 'Hindu Bride', 'Muslim Groom', 'Muslim Bride'
    )
  ),
  payment_method text not null default 'bKash' check (payment_method = 'bKash'),
  payment_number text not null default '01776044951' check (payment_number = '01776044951'),
  amount integer not null default 99 check (amount = 99),
  transaction_id text not null check (transaction_id ~ '^[A-Za-z0-9]{6,30}$'),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  membership_code text unique,
  admin_note text check (admin_note is null or char_length(admin_note) <= 500),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create unique index wedding_membership_payments_transaction_id_uidx
  on private.wedding_membership_payments (lower(transaction_id));

create index wedding_membership_payments_status_created_idx
  on private.wedding_membership_payments (status, created_at desc);

alter table private.wedding_membership_payments enable row level security;
revoke all on table private.wedding_membership_payments from public, anon, authenticated;

create or replace function public.submit_wedding_membership_payment(
  p_client_name text,
  p_phone text,
  p_selected_package text,
  p_transaction_id text
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_id uuid;
  v_name text := btrim(coalesce(p_client_name, ''));
  v_phone text := btrim(coalesce(p_phone, ''));
  v_transaction_id text := upper(btrim(coalesce(p_transaction_id, '')));
  v_package text := nullif(btrim(coalesce(p_selected_package, '')), '');
  v_reference text;
begin
  if char_length(v_name) not between 2 and 100 then
    raise exception using message = 'নাম ২ থেকে ১০০ অক্ষরের মধ্যে লিখুন।';
  end if;

  if char_length(v_phone) not between 7 and 20
     or v_phone !~ '^[+0-9০-৯() -]{7,20}$'
     or char_length(regexp_replace(v_phone, '[^0-9০-৯]', '', 'g')) not between 7 and 15 then
    raise exception using message = 'সঠিক মোবাইল নম্বর লিখুন।';
  end if;

  if v_transaction_id !~ '^[A-Z0-9]{6,30}$' then
    raise exception using message = 'সঠিক bKash Transaction ID লিখুন (৬–৩০টি ইংরেজি অক্ষর/সংখ্যা)।';
  end if;

  if v_package is not null and v_package not in (
    'Hindu Groom', 'Hindu Bride', 'Muslim Groom', 'Muslim Bride'
  ) then
    raise exception using message = 'সঠিক Wedding Package নির্বাচন করুন।';
  end if;

  v_id := pg_catalog.gen_random_uuid();
  v_reference := 'RMP-' || upper(substr(replace(v_id::text, '-', ''), 1, 8));

  insert into private.wedding_membership_payments (
    id, reference_code, client_name, phone, selected_package,
    payment_method, payment_number, amount, transaction_id
  ) values (
    v_id, v_reference, v_name, v_phone, v_package,
    'bKash', '01776044951', 99, v_transaction_id
  );

  return jsonb_build_object(
    'reference_code', v_reference,
    'status', 'pending',
    'amount', 99
  );
exception
  when unique_violation then
    raise exception using message = 'এই Transaction ID আগেই জমা দেওয়া হয়েছে।';
end;
$function$;

create or replace function public.booking_admin_membership_requests(p_token text)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
begin
  if not coalesce(public._booking_admin_valid(p_token), false) then
    raise exception 'Admin session expired';
  end if;

  return (
    select coalesce(
      jsonb_agg(to_jsonb(r) order by r.created_at desc),
      '[]'::jsonb
    )
    from (
      select *
      from private.wedding_membership_payments
      order by created_at desc
      limit 500
    ) r
  );
end;
$function$;

create or replace function public.booking_admin_review_membership_payment(
  p_token text,
  p_request_id uuid,
  p_approve boolean,
  p_admin_note text default null
)
returns jsonb
language plpgsql
security definer
set search_path to ''
as $function$
declare
  v_request private.wedding_membership_payments%rowtype;
  v_membership_code text;
  v_status text;
begin
  if not coalesce(public._booking_admin_valid(p_token), false) then
    raise exception 'Admin session expired';
  end if;

  if p_approve is null then
    raise exception 'Review decision is required';
  end if;

  if p_admin_note is not null and char_length(p_admin_note) > 500 then
    raise exception 'Admin note must be 500 characters or fewer';
  end if;

  select *
    into v_request
    from private.wedding_membership_payments
   where id = p_request_id
   for update;

  if not found then
    raise exception 'Membership payment request was not found';
  end if;

  if v_request.status <> 'pending' then
    raise exception 'This membership payment has already been reviewed';
  end if;

  v_status := case when p_approve then 'approved' else 'rejected' end;
  if p_approve then
    v_membership_code := 'RCM-' || upper(substr(replace(v_request.id::text, '-', ''), 1, 8));
  end if;

  update private.wedding_membership_payments
     set status = v_status,
         membership_code = v_membership_code,
         admin_note = nullif(btrim(coalesce(p_admin_note, '')), ''),
         reviewed_at = now()
   where id = p_request_id;

  return jsonb_build_object(
    'status', v_status,
    'membership_code', v_membership_code
  );
end;
$function$;

revoke all on function public.submit_wedding_membership_payment(text, text, text, text) from public;
revoke all on function public.booking_admin_membership_requests(text) from public;
revoke all on function public.booking_admin_review_membership_payment(text, uuid, boolean, text) from public;

grant execute on function public.submit_wedding_membership_payment(text, text, text, text) to anon, authenticated;
grant execute on function public.booking_admin_membership_requests(text) to anon, authenticated;
grant execute on function public.booking_admin_review_membership_payment(text, uuid, boolean, text) to anon, authenticated;
