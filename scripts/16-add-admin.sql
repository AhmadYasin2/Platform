CREATE EXTENSION IF NOT EXISTS pgcrypto;

WITH upserted AS (
  INSERT INTO public.users (
    id,
    email,
    password_hash,
    role,
    created_at,
    updated_at
  )
  VALUES (
    gen_random_uuid(),                           -- new UUID
    'admin@admin.com',                           -- admin’s email
    crypt('IParkAdmin@123', gen_salt('bf')),     -- bcrypt‑hash the password
    'manager'::user_role,                        -- cast to your user_role enum
    NOW(),
    NOW()
  )
  ON CONFLICT (email)                           -- if admin already exists
  DO UPDATE SET
    password_hash = crypt('IParkAdmin@123', gen_salt('bf')),
    role          = 'manager'::user_role,
    updated_at    = NOW()
  RETURNING id
),
uid AS (
  -- grab the id whether we just inserted or it already existed
  SELECT id FROM upserted
  UNION
  SELECT id FROM public.users WHERE email = 'admin@admin.com'
  LIMIT 1
)
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
)
SELECT
  uid.id,
  'admin@admin.com',
  'Program Manager',
  'manager'::user_role,
  NOW(),
  NOW()
FROM uid
ON CONFLICT (id)                              -- if profile row already exists
DO UPDATE SET
  full_name  = EXCLUDED.full_name,
  role       = EXCLUDED.role,
  updated_at = NOW();
