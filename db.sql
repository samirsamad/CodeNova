-- ══════════════════════════════════════════════════════════════════
--  CODE NOVA – Fix: "profile save failed" error
--  The problem: RLS blocks the INSERT into citizens right after
--  signup because the session hasn't fully attached yet.
--  The solution: a database trigger that creates the citizens row
--  automatically the moment a new auth user is created — this runs
--  with superuser privileges and completely bypasses RLS.
-- ══════════════════════════════════════════════════════════════════


-- ── TRIGGER FUNCTION ─────────────────────────────────────────────
-- This function runs automatically after every new row in auth.users.
-- It reads the user's email and any metadata passed during signUp()
-- and creates a matching row in public.citizens instantly.
-- Because it runs as "security definer" (superuser), RLS does not
-- apply — no more "profile save failed" errors.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer                     -- runs as superuser, bypasses RLS
set search_path = public             -- prevents search_path hijacking
as $$
begin
  insert into public.citizens (id, email, first_name, last_name)
  values (
    new.id,
    new.email,
    -- reads the metadata you pass in signUp({ options: { data: {...} } })
    coalesce(new.raw_user_meta_data->>'first_name', ''),
    coalesce(new.raw_user_meta_data->>'last_name',  '')
  )
  on conflict (id) do nothing;       -- safe to re-run; won't duplicate rows
  return new;
end;
$$;


-- ── ATTACH THE TRIGGER ────────────────────────────────────────────
-- Drop first so this script is safe to re-run without errors.
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users          -- fires after every new signup
  for each row
  execute procedure public.handle_new_user();


-- ── VERIFY: check existing users now have citizens rows ──────────
-- If you have test accounts that previously failed the insert,
-- this backfills them so they won't get a blank profile on login.
insert into public.citizens (id, email, first_name, last_name)
select
  id,
  email,
  coalesce(raw_user_meta_data->>'first_name', ''),
  coalesce(raw_user_meta_data->>'last_name',  '')
from auth.users
on conflict (id) do nothing;         -- skips users who already have a row


-- ── CONFIRM EVERYTHING LOOKS GOOD ────────────────────────────────
-- After running, you should see one citizens row per auth user,
-- with matching IDs. Any row showing NULL for email is suspicious.
select
  u.id,
  u.email          as auth_email,
  c.first_name,
  c.last_name,
  case
    when c.id is not null then 'Profile exists ✓'
    else 'MISSING — trigger may have failed ✗'
  end as profile_status
from auth.users u
left join public.citizens c on c.id = u.id
order by u.created_at desc;
