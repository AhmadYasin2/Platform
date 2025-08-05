CREATE SCHEMA IF NOT EXISTS auth;

CREATE OR REPLACE FUNCTION auth.uid()
  RETURNS UUID
  LANGUAGE sql
  STABLE
AS $$
  SELECT current_setting('jwt.claims.sub')::uuid;
$$;
-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Startups policies
CREATE POLICY "Managers can view all startups" ON startups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

CREATE POLICY "Startups can view own data" ON startups
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Managers can insert startups" ON startups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

CREATE POLICY "Managers can update startups" ON startups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

-- Services policies (managers only)
CREATE POLICY "Managers can manage services" ON services
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

CREATE POLICY "Everyone can view services" ON services
    FOR SELECT USING (true);

-- Packages policies
CREATE POLICY "Managers can manage packages" ON packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

CREATE POLICY "Everyone can view packages" ON packages
    FOR SELECT USING (true);

-- Meetings policies
CREATE POLICY "Managers can manage all meetings" ON meetings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

CREATE POLICY "Startups can view own meetings" ON meetings
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM startups 
            WHERE startups.id = meetings.startup_id 
            AND startups.user_id = auth.uid()
        )
    );

-- Startup services policies
CREATE POLICY "Managers can view all startup services" ON startup_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

CREATE POLICY "Startups can view own services" ON startup_services
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM startups 
            WHERE startups.id = startup_services.startup_id 
            AND startups.user_id = auth.uid()
        )
    );

CREATE POLICY "Startups can insert own services" ON startup_services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM startups 
            WHERE startups.id = startup_services.startup_id 
            AND startups.user_id = auth.uid()
        )
    );
