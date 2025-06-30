-- Update startup policies to only show active startups to managers
DROP POLICY IF EXISTS "Managers can view all startups" ON startups;

CREATE POLICY "Managers can view active startups" ON startups
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
        AND status = 'active'
    );

-- Update startup policy to prevent inactive startups from accessing their data
DROP POLICY IF EXISTS "Startups can view own data" ON startups;

CREATE POLICY "Startups can view own active data" ON startups
    FOR SELECT USING (
        user_id = auth.uid() 
        AND status = 'active'
    );
