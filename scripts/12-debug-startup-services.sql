-- Let's check the current startup_services policies and fix them
DROP POLICY IF EXISTS "Managers can view all startup services" ON startup_services;
DROP POLICY IF EXISTS "Startups can view own services" ON startup_services;
DROP POLICY IF EXISTS "Startups can insert own services" ON startup_services;

-- Create comprehensive policies for startup_services
CREATE POLICY "Managers can manage all startup services" ON startup_services
    FOR ALL USING (
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
            AND startups.status = 'active'
        )
    );

CREATE POLICY "Startups can insert own services" ON startup_services
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM startups 
            WHERE startups.id = startup_services.startup_id 
            AND startups.user_id = auth.uid()
            AND startups.status = 'active'
        )
    );

CREATE POLICY "Startups can delete own services" ON startup_services
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM startups 
            WHERE startups.id = startup_services.startup_id 
            AND startups.user_id = auth.uid()
            AND startups.status = 'active'
        )
    );
