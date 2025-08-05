-- scripts/14-add-mailjet-tracking.sql

-- 1) Create email_logs table
CREATE TABLE IF NOT EXISTS email_logs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email     TEXT NOT NULL,
  recipient_name      TEXT,
  subject             TEXT NOT NULL,
  message_content     TEXT,
  mailjet_message_id  TEXT,
  status              TEXT 
                       DEFAULT 'sent' 
                       CHECK (status IN ('sent','delivered','opened','clicked','bounced','spam')),
  sent_by             UUID 
                       REFERENCES profiles(id)       -- or users(id) if you prefer
                       ON DELETE SET NULL,
  sent_at             TIMESTAMPTZ DEFAULT now(),
  delivered_at        TIMESTAMPTZ,
  opened_at           TIMESTAMPTZ,
  metadata            JSONB DEFAULT '{}'
);

-- 2) Enable Row Level Security
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;

-- 3) Policies for email_logs
CREATE POLICY "Managers can view all email logs" 
  ON email_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
  );

CREATE POLICY "Managers can insert email logs"
  ON email_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 
      FROM profiles 
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'manager'
    )
  );

-- 4) Indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_logs_recipient ON email_logs(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_status    ON email_logs(status);
CREATE INDEX IF NOT EXISTS idx_email_logs_sent_at   ON email_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_email_logs_mailjet_id ON email_logs(mailjet_message_id);
