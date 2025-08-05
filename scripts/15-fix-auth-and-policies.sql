-- 15-fix-policies-and-trigger.sql

-- ───────────────────────────────────────────────────────────────────────────
-- 0) Stub auth.role() if you haven’t already
CREATE OR REPLACE FUNCTION auth.role()
  RETURNS TEXT
  LANGUAGE sql
  STABLE
AS $$
  SELECT current_setting('jwt.claims.role', true);
$$;

-- ───────────────────────────────────────────────────────────────────────────
-- 1) Profiles policies

DROP POLICY IF EXISTS "Users can view own profile"   ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Service role can manage profiles" ON profiles;

CREATE POLICY "Users can view own profile"   ON profiles
  FOR SELECT USING ( auth.uid() = id );

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING ( auth.uid() = id );

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK ( auth.uid() = id );

CREATE POLICY "Service role can manage profiles" ON profiles
  FOR ALL USING ( auth.role() = 'service_role' );

-- ───────────────────────────────────────────────────────────────────────────
-- 2) Startups policies

DROP POLICY IF EXISTS "Managers can view all startups" ON startups;
DROP POLICY IF EXISTS "Startups can view own data"     ON startups;
DROP POLICY IF EXISTS "Managers can insert startups"   ON startups;
DROP POLICY IF EXISTS "Managers can update all startups" ON startups;
DROP POLICY IF EXISTS "Startups can update own data"     ON startups;

CREATE POLICY "Managers can view all startups" ON startups
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Startups can view own data" ON startups
  FOR SELECT USING (
    (user_id = auth.uid() AND status = 'active')
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Managers can insert startups" ON startups
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Managers can update all startups" ON startups
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
    OR auth.role() = 'service_role'
  );

CREATE POLICY "Startups can update own data" ON startups
  FOR UPDATE USING (
    (user_id = auth.uid() AND status = 'active')
    OR auth.role() = 'service_role'
  );

-- ───────────────────────────────────────────────────────────────────────────
-- 3) Trigger & function to sync new users → profiles

-- Create or replace the function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE(NEW.raw_user_meta_data->>'role', 'startup')
  )
  ON CONFLICT (id) DO UPDATE
    SET
      email      = EXCLUDED.email,
      full_name  = COALESCE(EXCLUDED.full_name,  profiles.full_name),
      role       = COALESCE(EXCLUDED.role,       profiles.role),
      updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach it to your public.users table
DROP TRIGGER IF EXISTS on_user_created ON public.users;
CREATE TRIGGER on_user_created
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();
