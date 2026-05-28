-- ============================================================================
-- MIGRATION: V1__Add_Email_Tracking_To_Contact_Messages.sql
-- ============================================================================
-- Purpose: Add email delivery tracking fields to contact_messages table
-- 
-- Context:
--   - ContactMessage entity was enhanced (commit 5da1a8b) with:
--     * emailSent: Boolean field to track if email notification sent
--     * emailProvider: String field to track which provider (Brevo/MailerSend)
--   - Production PostgreSQL schema was not updated
--   - This causes HTTP 500 errors on contact form submission
--
-- Strategy: Non-destructive additive migration
--   - Uses IF NOT EXISTS to be idempotent
--   - No data loss
--   - Can be run multiple times safely
-- ============================================================================

-- Add email_sent column (tracks email delivery success)
-- Default: FALSE (email not yet sent)
-- Constraint: NOT NULL to enforce tracking
ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT FALSE NOT NULL;

-- Add email_provider column (tracks which provider delivered)
-- Values: 'brevo' | 'mailersend' | null (if delivery failed/pending)
-- Type: VARCHAR(20) per entity definition
ALTER TABLE contact_messages
ADD COLUMN IF NOT EXISTS email_provider VARCHAR(20);

-- Create index on email_sent for efficient filtering
-- Use case: Dashboard queries filtering delivered vs failed
-- Conditional to prevent "index already exists" errors
CREATE INDEX IF NOT EXISTS idx_email_sent ON contact_messages(email_sent);

-- ============================================================================
-- Verification Queries (run after migration to confirm success)
-- ============================================================================

-- Verify columns exist and have correct properties:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'contact_messages'
-- ORDER BY ordinal_position;

-- Expected output:
-- | column_name      | data_type           | is_nullable | column_default       |
-- |------------------+---------------------+-------------+----------------------|
-- | id               | bigint              | NO          | nextval(...)         |
-- | name             | character varying   | NO          |                      |
-- | email            | character varying   | NO          |                      |
-- | subject          | character varying   | NO          |                      |
-- | message          | text                | NO          |                      |
-- | created_at       | timestamp(6)        | NO          |                      |
-- | email_sent       | boolean             | NO          | false                |
-- | email_provider   | character varying   | YES         |                      |

-- ============================================================================
