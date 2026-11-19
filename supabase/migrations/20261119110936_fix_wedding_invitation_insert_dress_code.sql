do $migration$
declare
  v_definition text;
  v_old text := 'theme, template_key, rsvp_deadline, dress_code_bn, gallery_images, show_countdown, status';
  v_new text := 'theme, template_key, rsvp_deadline, dress_code, dress_code_bn, gallery_images, show_countdown, status';
begin
  select pg_get_functiondef('public.wedding_invitation_admin(text,text,jsonb)'::regprocedure)
    into v_definition;

  if position(v_old in v_definition) = 0 then
    raise exception 'Expected wedding invitation INSERT column list was not found; no change applied';
  end if;

  v_definition := replace(v_definition, v_old, v_new);
  execute v_definition;
end;
$migration$;
