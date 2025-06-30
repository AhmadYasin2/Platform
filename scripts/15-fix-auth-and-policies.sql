-- First, let's fix the profiles policies to be more robust
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create comprehensive profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Allow service role to manage profiles (for admin operations)
CREATE POLICY "Service role can manage profiles" ON profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Fix startup policies to handle edge cases
DROP POLICY IF EXISTS "Managers can view all startups" ON startups;
DROP POLICY IF EXISTS "Startups can view own data" ON startups;
DROP POLICY IF EXISTS "Managers can insert startups" ON startups;
DROP POLICY IF EXISTS "Managers can update all startups" ON startups;
DROP POLICY IF EXISTS "Startups can update own data" ON startups;

-- Recreate startup policies with better error handling
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

-- Add a function to handle profile creation automatically
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
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        role = COALESCE(EXCLUDED.role, profiles.role),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create profiles
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();
