-- Drop all existing startup policies to start fresh
DROP POLICY IF EXISTS "Managers can view active startups" ON startups;
DROP POLICY IF EXISTS "Startups can view own active data" ON startups;
DROP POLICY IF EXISTS "Managers can insert startups" ON startups;
DROP POLICY IF EXISTS "Managers can update startups" ON startups;

-- Managers can view ALL startups (active and inactive for management purposes)
CREATE POLICY "Managers can view all startups" ON startups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

-- Startups can only view their own data if they are active
CREATE POLICY "Startups can view own data" ON startups
    FOR SELECT USING (
        user_id = auth.uid() 
        AND status = 'active'
    );

-- Managers can insert new startups
CREATE POLICY "Managers can insert startups" ON startups
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

-- Managers can update ANY startup (active or inactive)
CREATE POLICY "Managers can update all startups" ON startups
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

-- Allow startups to update their own data (for marketplace operations)
CREATE POLICY "Startups can update own data" ON startups
    FOR UPDATE USING (
        user_id = auth.uid() 
        AND status = 'active'
    )
    WITH CHECK (
        user_id = auth.uid() 
        AND status = 'active'
    );
