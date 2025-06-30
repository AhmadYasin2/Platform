-- Create enum types
CREATE TYPE contract_status AS ENUM ('Pending', 'Sent', 'Signed');
CREATE TYPE user_role AS ENUM ('manager', 'startup');

-- Create profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'startup',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create startups table
CREATE TABLE startups (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    founder_name TEXT,
    email TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    contract_status contract_status DEFAULT 'Pending',
    total_credits INTEGER DEFAULT 1000,
    used_credits INTEGER DEFAULT 0,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create services table
CREATE TABLE services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create packages table
CREATE TABLE packages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price INTEGER NOT NULL, -- Price in dollars
    hours INTEGER NOT NULL, -- Converted hours (price / 50)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meetings table
CREATE TABLE meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    meeting_date DATE NOT NULL,
    farah_notes TEXT,
    guest_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create startup_services table (tracks selected services)
CREATE TABLE startup_services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    hours_used INTEGER NOT NULL,
    selected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(startup_id, package_id)
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE startup_services ENABLE ROW LEVEL SECURITY;
