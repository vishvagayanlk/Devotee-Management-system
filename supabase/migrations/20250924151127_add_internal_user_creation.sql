
create schema if not exists internal_functions;

create extension if not exists "uuid-ossp";

create or replace function internal_functions.create_auth_user(
  email text,
  password text,
  user_id uuid default null
)
returns uuid as $$
declare
  encrypted_password text;
  new_user_id uuid;
begin
  if user_id is null then
    new_user_id := uuid_generate_v4();
  else
    new_user_id := user_id;
  end if;

  encrypted_password := crypt(password, gen_salt('bf'));

  insert into auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_token,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    email_change_token_current,
    email_change_sent_at
  ) values (
    new_user_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    email,
    encrypted_password,
    now(),
    '',
    null,
    null,
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now(),
    '',
    '',
    '',
    '',
    null
  );

  insert into auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) values (
    uuid_generate_v4(),
    new_user_id,
    format('{"sub":"%s","email":"%s"}', new_user_id, email)::jsonb,
    'email',
    email,
    now(),
    now(),
    now()
  );

  return new_user_id;
end;
$$ language plpgsql;
