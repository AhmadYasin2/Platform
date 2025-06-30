-- Update any existing admin@admin.com user to have manager role
UPDATE profiles 
SET role = 'manager', full_name = 'Program Manager' 
WHERE email = 'admin@admin.com';
