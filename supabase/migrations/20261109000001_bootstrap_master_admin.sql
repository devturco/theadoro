-- ─────────────────────────────────────────────────────────────────────────────
-- Admin master padrão
--
-- Cria o usuário de administração principal no primeiro deploy:
--
--   e-mail: admin@theadoro.com.br
--   senha:  theadoro@2025
--
-- É idempotente: se o e-mail já existir, apenas garante o papel de admin.
-- Troque a senha em Admin → Usuários → "Alterar Senha" logo após o primeiro
-- acesso (ou rode esta migration com a senha que você quiser definir).
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto with schema extensions;

do $$
declare
  v_email    constant text := 'admin@theadoro.com.br';
  v_password constant text := 'theadoro@2025';
  v_name     constant text := 'Admin Master';
  v_user_id  uuid;
begin
  select id into v_user_id from auth.users where email = v_email limit 1;

  if v_user_id is null then
    v_user_id := gen_random_uuid();

    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change
    ) values (
      '00000000-0000-0000-0000-000000000000',
      v_user_id,
      'authenticated',
      'authenticated',
      v_email,
      extensions.crypt(v_password, extensions.gen_salt('bf')),
      now(),
      jsonb_build_object('provider', 'email', 'providers', jsonb_build_array('email')),
      jsonb_build_object('full_name', v_name),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );

    insert into auth.identities (
      id,
      user_id,
      provider_id,
      provider,
      identity_data,
      last_sign_in_at,
      created_at,
      updated_at
    ) values (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      'email',
      jsonb_build_object('sub', v_user_id::text, 'email', v_email, 'email_verified', true),
      now(),
      now(),
      now()
    );
  end if;

  -- Perfil público (o trigger de signup pode não existir em bases criadas à mão)
  insert into public.profiles (id, email, full_name, role, verified, is_approved)
  values (v_user_id, v_email, v_name, 'admin', true, true)
  on conflict (id) do update
    set email      = excluded.email,
        full_name  = coalesce(nullif(public.profiles.full_name, ''), excluded.full_name),
        role       = 'admin',
        verified   = true,
        is_approved = true,
        updated_at = now();

  -- Papel usado pelo RLS (`has_role` / `is_admin`)
  insert into public.user_roles (user_id, role)
  values (v_user_id, 'admin')
  on conflict (user_id, role) do nothing;
end
$$;