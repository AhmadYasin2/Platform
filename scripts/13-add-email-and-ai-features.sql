-- Add email preferences to startups table
ALTER TABLE startups ADD COLUMN notification_email TEXT;
ALTER TABLE startups ADD COLUMN email_preferences JSONB DEFAULT '{"meeting_reminders": true, "service_updates": true, "general_announcements": true}';

-- Add Google Calendar integration fields to meetings
ALTER TABLE meetings ADD COLUMN google_calendar_event_id TEXT;
ALTER TABLE meetings ADD COLUMN calendar_link TEXT;

-- Create AI chat sessions table
CREATE TABLE ai_chat_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    startup_id UUID REFERENCES startups(id) ON DELETE CASCADE,
    session_title TEXT DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create AI chat messages table
CREATE TABLE ai_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create service embeddings table for RAG
CREATE TABLE service_embeddings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    content_type TEXT NOT NULL, -- 'description', 'use_case', 'prerequisites'
    content TEXT NOT NULL,
    embedding VECTOR(1536), -- OpenAI embedding dimension
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create meeting summaries table
CREATE TABLE meeting_summaries (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    meeting_id UUID REFERENCES meetings(id) ON DELETE CASCADE,
    public_summary TEXT, -- Visible to startups
    private_notes TEXT, -- Manager-only
    action_items JSONB DEFAULT '[]',
    key_insights JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE ai_chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE meeting_summaries ENABLE ROW LEVEL SECURITY;

-- Policies for AI chat sessions
CREATE POLICY "Startups can manage own chat sessions" ON ai_chat_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM startups 
            WHERE startups.id = ai_chat_sessions.startup_id 
            AND startups.user_id = auth.uid()
            AND startups.status = 'active'
        )
    );

CREATE POLICY "Managers can view all chat sessions" ON ai_chat_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

-- Policies for AI chat messages
CREATE POLICY "Startups can manage own chat messages" ON ai_chat_messages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ai_chat_sessions 
            JOIN startups ON startups.id = ai_chat_sessions.startup_id
            WHERE ai_chat_sessions.id = ai_chat_messages.session_id
            AND startups.user_id = auth.uid()
            AND startups.status = 'active'
        )
    );

CREATE POLICY "Managers can view all chat messages" ON ai_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

-- Policies for service embeddings (read-only for all)
CREATE POLICY "Everyone can view service embeddings" ON service_embeddings
    FOR SELECT USING (true);

-- Policies for meeting summaries
CREATE POLICY "Managers can manage meeting summaries" ON meeting_summaries
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'manager'
        )
    );

CREATE POLICY "Startups can view own public summaries" ON meeting_summaries
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM meetings 
            JOIN startups ON startups.id = meetings.startup_id
            WHERE meetings.id = meeting_summaries.meeting_id
            AND startups.user_id = auth.uid()
            AND startups.status = 'active'
        )
    );
