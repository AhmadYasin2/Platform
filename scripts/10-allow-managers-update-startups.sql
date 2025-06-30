-- Remove any obsolete update policy (safe even if it does not exist)
DROP POLICY IF EXISTS "Managers can update startups" ON startups;

-- Managers may UPDATE any startup row (active or inactive)
CREATE POLICY "Managers can update startups"
ON startups
FOR UPDATE
USING (
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
