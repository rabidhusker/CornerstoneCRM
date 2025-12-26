# CornerstoneCRM Setup Guide

This guide covers all manual configuration steps needed to deploy CornerstoneCRM to production with Vercel, Supabase, and integrate with the ctg-v1 and CornerstoneCallbot projects.

---

## Table of Contents

1. [Supabase Setup](#1-supabase-setup)
2. [Vercel Deployment](#2-vercel-deployment)
3. [Third-Party Integrations](#3-third-party-integrations)
4. [Integration with ctg-v1](#4-integration-with-ctg-v1)
5. [Integration with CornerstoneCallbot](#5-integration-with-cornerstonecallbot)
6. [Post-Deployment Configuration](#6-post-deployment-configuration)
7. [Cron Jobs Setup](#7-cron-jobs-setup)
8. [Testing Checklist](#8-testing-checklist)

---

## 1. Supabase Setup

### 1.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon Key** (public)
   - **Service Role Key** (secret - for server-side operations)

### 1.2 Database Schema

Run the following SQL in Supabase SQL Editor to create all required tables:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CORE TABLES
-- ============================================

-- Workspaces (Organizations)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES workspaces(id),
  logo_url TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'pending', 'cancelled')),
  subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('free', 'starter', 'professional', 'enterprise', 'custom')),
  settings JSONB DEFAULT '{}',
  feature_flags JSONB DEFAULT '{}',
  usage_limits JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Profiles (Users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES workspaces(id),
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED,
  avatar_url TEXT,
  phone TEXT,
  role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
  settings JSONB DEFAULT '{}',
  last_active_at TIMESTAMPTZ,
  invited_by UUID REFERENCES profiles(id),
  invited_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts
CREATE TABLE crm_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT,
  phone TEXT,
  first_name TEXT,
  last_name TEXT,
  full_name TEXT GENERATED ALWAYS AS (COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) STORED,
  company TEXT,
  job_title TEXT,
  avatar_url TEXT,
  source TEXT,
  status TEXT DEFAULT 'active',
  lifecycle_stage TEXT DEFAULT 'lead',
  tags TEXT[] DEFAULT '{}',
  custom_fields JSONB DEFAULT '{}',
  address JSONB DEFAULT '{}',
  social_profiles JSONB DEFAULT '{}',
  owner_id UUID REFERENCES profiles(id),
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipelines
CREATE TABLE crm_pipelines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  is_default BOOLEAN DEFAULT false,
  stages JSONB NOT NULL DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Deals
CREATE TABLE crm_deals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  pipeline_id UUID NOT NULL REFERENCES crm_pipelines(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  value DECIMAL(15,2) DEFAULT 0,
  currency TEXT DEFAULT 'USD',
  stage_id TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'won', 'lost')),
  probability INTEGER DEFAULT 0,
  expected_close_date DATE,
  actual_close_date DATE,
  lost_reason TEXT,
  notes TEXT,
  custom_fields JSONB DEFAULT '{}',
  owner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE crm_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE CASCADE,
  deal_id UUID REFERENCES crm_deals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CAMPAIGNS & EMAIL
-- ============================================

-- Email Templates
CREATE TABLE crm_email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  category TEXT,
  variables JSONB DEFAULT '[]',
  is_default BOOLEAN DEFAULT false,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE crm_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'email' CHECK (type IN ('email', 'sms', 'sequence')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'paused', 'completed', 'cancelled')),
  template_id UUID REFERENCES crm_email_templates(id),
  settings JSONB DEFAULT '{}',
  schedule JSONB DEFAULT '{}',
  stats JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaign Recipients
CREATE TABLE crm_campaign_recipients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES crm_campaigns(id) ON DELETE CASCADE,
  contact_id UUID NOT NULL REFERENCES crm_contacts(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed', 'failed')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, contact_id)
);

-- Email Queue
CREATE TABLE crm_email_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  to_email TEXT NOT NULL,
  to_name TEXT,
  from_email TEXT,
  from_name TEXT,
  reply_to TEXT,
  subject TEXT NOT NULL,
  html_content TEXT,
  text_content TEXT,
  template_id TEXT,
  template_data JSONB DEFAULT '{}',
  priority INTEGER DEFAULT 5,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FORMS & LANDING PAGES
-- ============================================

-- Forms
CREATE TABLE crm_forms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT,
  type TEXT DEFAULT 'contact' CHECK (type IN ('contact', 'lead', 'survey', 'registration', 'custom')),
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived')),
  fields JSONB NOT NULL DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  style JSONB DEFAULT '{}',
  submissions_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

-- Form Submissions
CREATE TABLE crm_form_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  form_id UUID NOT NULL REFERENCES crm_forms(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id),
  data JSONB NOT NULL DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  source_url TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'converted', 'spam')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Landing Pages
CREATE TABLE crm_landing_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  config JSONB DEFAULT '{"blocks": []}',
  settings JSONB DEFAULT '{}',
  views_count INTEGER DEFAULT 0,
  conversions_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, slug)
);

-- ============================================
-- APPOINTMENTS & BOOKING
-- ============================================

-- Booking Pages
CREATE TABLE crm_booking_pages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  availability JSONB NOT NULL DEFAULT '{}',
  appointment_types JSONB NOT NULL DEFAULT '[]',
  settings JSONB DEFAULT '{}',
  branding JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(slug)
);

-- Appointments
CREATE TABLE crm_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  booking_page_id UUID REFERENCES crm_booking_pages(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  user_id UUID NOT NULL REFERENCES profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  appointment_type_id TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  timezone TEXT DEFAULT 'UTC',
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'cancelled', 'completed', 'no_show')),
  location_type TEXT DEFAULT 'video' CHECK (location_type IN ('video', 'phone', 'in_person', 'custom')),
  location TEXT,
  meeting_url TEXT,
  confirmation_code TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  external_calendar_id TEXT,
  metadata JSONB DEFAULT '{}',
  cancelled_at TIMESTAMPTZ,
  cancelled_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATIONS & MESSAGING
-- ============================================

-- Conversations
CREATE TABLE crm_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id) ON DELETE SET NULL,
  channel TEXT NOT NULL CHECK (channel IN ('email', 'sms', 'phone', 'chat', 'whatsapp')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'pending', 'spam')),
  subject TEXT,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,
  unread_count INTEGER DEFAULT 0,
  assigned_to UUID REFERENCES profiles(id),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE crm_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES crm_conversations(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
  channel TEXT NOT NULL,
  from_address TEXT,
  to_address TEXT,
  subject TEXT,
  content TEXT,
  html_content TEXT,
  attachments JSONB DEFAULT '[]',
  status TEXT DEFAULT 'sent' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_by UUID REFERENCES profiles(id),
  external_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canned Responses
CREATE TABLE crm_canned_responses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  shortcut TEXT,
  content TEXT NOT NULL,
  category TEXT,
  is_shared BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- WORKFLOWS & AUTOMATION
-- ============================================

-- Workflows
CREATE TABLE crm_workflows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  actions JSONB NOT NULL DEFAULT '[]',
  conditions JSONB DEFAULT '{}',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'archived')),
  run_count INTEGER DEFAULT 0,
  last_run_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow Executions
CREATE TABLE crm_workflow_executions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_id UUID NOT NULL REFERENCES crm_workflows(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES crm_contacts(id),
  deal_id UUID REFERENCES crm_deals(id),
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  current_step INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  error_message TEXT,
  execution_log JSONB DEFAULT '[]'
);

-- ============================================
-- REPORTS & SETTINGS
-- ============================================

-- Custom Reports
CREATE TABLE crm_custom_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  config JSONB NOT NULL DEFAULT '{}',
  filters JSONB DEFAULT '[]',
  is_favorite BOOLEAN DEFAULT false,
  is_shared BOOLEAN DEFAULT false,
  schedule JSONB DEFAULT '{}',
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Branding Settings
CREATE TABLE crm_branding_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE UNIQUE,
  logo_light_url TEXT,
  logo_dark_url TEXT,
  favicon_url TEXT,
  primary_color TEXT DEFAULT '#0ea5e9',
  secondary_color TEXT DEFAULT '#64748b',
  accent_color TEXT,
  text_primary TEXT,
  text_secondary TEXT,
  background_color TEXT,
  surface_color TEXT,
  custom_css TEXT,
  organization_name TEXT NOT NULL,
  tagline TEXT,
  support_email TEXT,
  support_url TEXT,
  footer_text TEXT,
  show_powered_by BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration Settings
CREATE TABLE crm_integration_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT false,
  credentials JSONB DEFAULT '{}',
  settings JSONB DEFAULT '{}',
  last_sync_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(workspace_id, provider)
);

-- API Keys
CREATE TABLE crm_api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '[]',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Invitations
CREATE TABLE crm_user_invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'member',
  invitation_code TEXT NOT NULL UNIQUE,
  invited_by UUID REFERENCES profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Account Audit Log
CREATE TABLE crm_account_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_org_id UUID,
  account_id UUID NOT NULL,
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_profiles_workspace ON profiles(workspace_id);
CREATE INDEX idx_contacts_workspace ON crm_contacts(workspace_id);
CREATE INDEX idx_contacts_email ON crm_contacts(email);
CREATE INDEX idx_deals_workspace ON crm_deals(workspace_id);
CREATE INDEX idx_deals_pipeline ON crm_deals(pipeline_id);
CREATE INDEX idx_deals_contact ON crm_deals(contact_id);
CREATE INDEX idx_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_campaigns_workspace ON crm_campaigns(workspace_id);
CREATE INDEX idx_forms_workspace ON crm_forms(workspace_id);
CREATE INDEX idx_forms_slug ON crm_forms(slug);
CREATE INDEX idx_landing_pages_slug ON crm_landing_pages(slug);
CREATE INDEX idx_booking_pages_slug ON crm_booking_pages(slug);
CREATE INDEX idx_appointments_user ON crm_appointments(user_id);
CREATE INDEX idx_appointments_start ON crm_appointments(start_time);
CREATE INDEX idx_conversations_workspace ON crm_conversations(workspace_id);
CREATE INDEX idx_conversations_contact ON crm_conversations(contact_id);
CREATE INDEX idx_messages_conversation ON crm_messages(conversation_id);
CREATE INDEX idx_workflows_workspace ON crm_workflows(workspace_id);
CREATE INDEX idx_email_queue_status ON crm_email_queue(status, scheduled_for);
CREATE INDEX idx_workspaces_parent ON workspaces(parent_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_form_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_landing_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_booking_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_canned_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_branding_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_api_keys ENABLE ROW LEVEL SECURITY;

-- RLS Policies (workspace-based access)
-- Users can only access data in their workspace

CREATE POLICY workspace_isolation ON crm_contacts
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_pipelines
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_deals
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_activities
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_campaigns
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_forms
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_landing_pages
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_booking_pages
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_appointments
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_conversations
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_messages
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY workspace_isolation ON crm_workflows
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM profiles WHERE id = auth.uid()
  ));

-- Public access for forms and landing pages
CREATE POLICY public_forms ON crm_forms
  FOR SELECT USING (status = 'active');

CREATE POLICY public_landing_pages ON crm_landing_pages
  FOR SELECT USING (status = 'published');

CREATE POLICY public_booking_pages ON crm_booking_pages
  FOR SELECT USING (is_active = true);
```

### 1.3 Storage Buckets

Create the following storage buckets in Supabase Dashboard > Storage:

| Bucket Name | Public | Purpose |
|-------------|--------|---------|
| `avatars` | Yes | User profile pictures |
| `logos` | Yes | Organization logos |
| `attachments` | No | Email/message attachments |
| `documents` | No | General document storage |
| `form-uploads` | No | Form submission files |

**Bucket Policies:**

```sql
-- Allow public read access to avatars
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload avatars
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' AND
    auth.role() = 'authenticated'
  );

-- Same for logos bucket
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated'
  );
```

### 1.4 Authentication Setup

1. **Enable Email Auth:**
   - Supabase Dashboard > Authentication > Providers > Email
   - Enable "Enable Email Signup"
   - Configure email templates as needed

2. **Enable Google OAuth (optional):**
   - Supabase Dashboard > Authentication > Providers > Google
   - Add your Google OAuth credentials
   - Set redirect URL: `https://your-app.vercel.app/auth/callback`

3. **Configure Auth Settings:**
   - Site URL: `https://your-app.vercel.app`
   - Redirect URLs:
     - `https://your-app.vercel.app/auth/callback`
     - `http://localhost:3000/auth/callback` (for development)

### 1.5 Database Functions (Optional)

```sql
-- Function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, created_at, updated_at)
  VALUES (NEW.id, NEW.email, NOW(), NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 2. Vercel Deployment

### 2.1 Connect Repository

1. Go to [vercel.com](https://vercel.com) and import the GitHub repository
2. Select the `CornerstoneCRM` repository
3. Framework Preset: **Next.js**
4. Root Directory: `./` (or specify if in subdirectory)

### 2.2 Environment Variables

Add these environment variables in Vercel Dashboard > Settings > Environment Variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# App URL
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app

# Email (Resend)
RESEND_API_KEY=re_xxxxx
EMAIL_FROM_ADDRESS=noreply@yourdomain.com
EMAIL_FROM_NAME=CornerstoneCRM

# SMS (Twilio)
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Google Calendar Integration
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GOOGLE_REDIRECT_URI=https://your-app.vercel.app/api/auth/google/callback

# Cron Secret (for securing cron endpoints)
CRON_SECRET=your-random-secret-string

# CornerstoneCallbot Integration
CALLBOT_API_URL=https://your-callbot-api.com
CALLBOT_API_KEY=xxxxx

# ctg-v1 Integration
CTG_API_URL=https://your-ctg-api.com
CTG_API_KEY=xxxxx
CTG_WEBHOOK_SECRET=xxxxx
```

### 2.3 Build Settings

- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`
- Node.js Version: 18.x or 20.x

### 2.4 Domain Configuration

1. Add your custom domain in Vercel Dashboard > Settings > Domains
2. Update Supabase Auth redirect URLs with the new domain
3. Update `NEXT_PUBLIC_APP_URL` environment variable

---

## 3. Third-Party Integrations

### 3.1 Resend (Email)

1. Sign up at [resend.com](https://resend.com)
2. Verify your sending domain
3. Create API key and add to `RESEND_API_KEY`
4. Configure webhook for delivery tracking:
   - Webhook URL: `https://your-app.vercel.app/api/webhooks/resend`
   - Events: `email.sent`, `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`

### 3.2 Twilio (SMS)

1. Sign up at [twilio.com](https://twilio.com)
2. Get a phone number
3. Add credentials to environment variables
4. Configure webhook for incoming SMS:
   - Webhook URL: `https://your-app.vercel.app/api/webhooks/twilio`
   - HTTP Method: POST

### 3.3 Google Calendar

1. Create a project in [Google Cloud Console](https://console.cloud.google.com)
2. Enable Google Calendar API
3. Configure OAuth consent screen
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-app.vercel.app/api/auth/google/callback`
6. Add credentials to environment variables

---

## 4. Integration with ctg-v1

The ctg-v1 project integration allows syncing contacts and triggering workflows from external events.

### 4.1 Webhook Endpoints

Create a webhook endpoint in CornerstoneCRM for ctg-v1 to call:

**File:** `app/api/webhooks/ctg/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get("x-ctg-signature");
    const body = await request.text();

    const expectedSignature = crypto
      .createHmac("sha256", process.env.CTG_WEBHOOK_SECRET!)
      .update(body)
      .digest("hex");

    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    const supabase = await createClient();

    switch (payload.event) {
      case "contact.created":
        // Sync contact to CRM
        await syncContactFromCtg(supabase, payload.data);
        break;

      case "contact.updated":
        await updateContactFromCtg(supabase, payload.data);
        break;

      case "lead.qualified":
        // Trigger workflow in CRM
        await triggerLeadWorkflow(supabase, payload.data);
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("CTG webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
```

### 4.2 Outbound Sync

Create a utility for pushing CRM data to ctg-v1:

**File:** `lib/integrations/ctg-sync.ts`

```typescript
const CTG_API_URL = process.env.CTG_API_URL;
const CTG_API_KEY = process.env.CTG_API_KEY;

export async function syncContactToCtg(contact: any) {
  const response = await fetch(`${CTG_API_URL}/api/contacts`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CTG_API_KEY}`,
    },
    body: JSON.stringify({
      email: contact.email,
      firstName: contact.first_name,
      lastName: contact.last_name,
      phone: contact.phone,
      company: contact.company,
      source: "cornerstone_crm",
      externalId: contact.id,
    }),
  });

  return response.json();
}

export async function syncDealToCtg(deal: any) {
  const response = await fetch(`${CTG_API_URL}/api/opportunities`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${CTG_API_KEY}`,
    },
    body: JSON.stringify({
      name: deal.title,
      value: deal.value,
      stage: deal.stage_id,
      contactId: deal.contact_id,
      source: "cornerstone_crm",
      externalId: deal.id,
    }),
  });

  return response.json();
}
```

### 4.3 Configuration in ctg-v1

Add these settings in your ctg-v1 project:

```env
# CornerstoneCRM Integration
CRM_WEBHOOK_URL=https://your-crm.vercel.app/api/webhooks/ctg
CRM_API_URL=https://your-crm.vercel.app/api/v1
CRM_API_KEY=your-crm-api-key
```

---

## 5. Integration with CornerstoneCallbot

The CornerstoneCallbot integration enables:
- Initiating calls from the CRM
- Logging call activities
- Triggering follow-up workflows after calls

### 5.1 Webhook Handler

**File:** `app/api/webhooks/callbot/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get("x-api-key");

    if (apiKey !== process.env.CALLBOT_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    const supabase = await createClient();

    switch (payload.event) {
      case "call.started":
        await logCallActivity(supabase, payload, "call_started");
        break;

      case "call.completed":
        await logCallActivity(supabase, payload, "call_completed");
        // Update contact with call outcome
        await updateContactAfterCall(supabase, payload);
        // Trigger follow-up workflow if needed
        if (payload.outcome === "interested") {
          await triggerFollowUpWorkflow(supabase, payload);
        }
        break;

      case "call.failed":
        await logCallActivity(supabase, payload, "call_failed");
        break;

      case "voicemail.left":
        await logCallActivity(supabase, payload, "voicemail_left");
        break;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Callbot webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}

async function logCallActivity(supabase: any, payload: any, type: string) {
  await supabase.from("crm_activities").insert({
    workspace_id: payload.workspace_id,
    contact_id: payload.contact_id,
    type,
    title: `Call ${type.replace("_", " ")}`,
    description: payload.notes || `Duration: ${payload.duration}s`,
    metadata: {
      call_id: payload.call_id,
      duration: payload.duration,
      outcome: payload.outcome,
      recording_url: payload.recording_url,
    },
  });
}
```

### 5.2 Initiate Calls from CRM

**File:** `lib/integrations/callbot.ts`

```typescript
const CALLBOT_API_URL = process.env.CALLBOT_API_URL;
const CALLBOT_API_KEY = process.env.CALLBOT_API_KEY;

export interface InitiateCallParams {
  workspaceId: string;
  contactId: string;
  phoneNumber: string;
  userId: string;
  script?: string;
  metadata?: Record<string, any>;
}

export async function initiateCall(params: InitiateCallParams) {
  const response = await fetch(`${CALLBOT_API_URL}/api/calls/initiate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CALLBOT_API_KEY!,
    },
    body: JSON.stringify({
      to: params.phoneNumber,
      workspaceId: params.workspaceId,
      contactId: params.contactId,
      userId: params.userId,
      script: params.script,
      webhookUrl: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/callbot`,
      metadata: params.metadata,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to initiate call");
  }

  return response.json();
}

export async function getCallStatus(callId: string) {
  const response = await fetch(`${CALLBOT_API_URL}/api/calls/${callId}`, {
    headers: {
      "x-api-key": CALLBOT_API_KEY!,
    },
  });

  return response.json();
}
```

### 5.3 Configuration in CornerstoneCallbot

Add these settings in your CornerstoneCallbot project:

```env
# CornerstoneCRM Integration
CRM_WEBHOOK_URL=https://your-crm.vercel.app/api/webhooks/callbot
CRM_API_KEY=your-shared-api-key
```

### 5.4 Add Click-to-Call UI

Add a call button to contact pages that triggers the Callbot:

```typescript
// In your contact detail page
const handleInitiateCall = async () => {
  try {
    const result = await fetch("/api/v1/calls/initiate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId: contact.id,
        phoneNumber: contact.phone,
      }),
    });

    if (result.ok) {
      toast({ title: "Call initiated" });
    }
  } catch (error) {
    toast({ title: "Failed to initiate call", variant: "destructive" });
  }
};
```

---

## 6. Post-Deployment Configuration

### 6.1 Create Initial Workspace

After deployment, create your first workspace and admin user:

```sql
-- Create workspace
INSERT INTO workspaces (id, name, slug, status, subscription_tier, feature_flags)
VALUES (
  uuid_generate_v4(),
  'My Organization',
  'my-org',
  'active',
  'enterprise',
  '{"contacts": true, "deals": true, "pipelines": true, "email_campaigns": true, "sms_campaigns": true, "conversations": true, "workflows": true, "forms": true, "landing_pages": true, "appointments": true, "booking_pages": true, "reports": true, "custom_reports": true, "integrations": true, "api_access": true, "webhooks": true, "white_label": true, "custom_domain": true, "remove_branding": true}'
);

-- After user signs up, update their profile with workspace
UPDATE profiles SET
  workspace_id = (SELECT id FROM workspaces WHERE slug = 'my-org'),
  role = 'owner'
WHERE email = 'admin@yourdomain.com';
```

### 6.2 Create Default Pipeline

```sql
INSERT INTO crm_pipelines (workspace_id, name, description, is_default, stages)
SELECT
  id,
  'Sales Pipeline',
  'Default sales pipeline',
  true,
  '[
    {"id": "lead", "name": "Lead", "order": 0, "color": "#6366f1"},
    {"id": "qualified", "name": "Qualified", "order": 1, "color": "#8b5cf6"},
    {"id": "proposal", "name": "Proposal", "order": 2, "color": "#a855f7"},
    {"id": "negotiation", "name": "Negotiation", "order": 3, "color": "#d946ef"},
    {"id": "closed_won", "name": "Closed Won", "order": 4, "color": "#22c55e"},
    {"id": "closed_lost", "name": "Closed Lost", "order": 5, "color": "#ef4444"}
  ]'::jsonb
FROM workspaces WHERE slug = 'my-org';
```

---

## 7. Cron Jobs Setup

### 7.1 Vercel Cron Jobs

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/send-emails",
      "schedule": "*/5 * * * *"
    },
    {
      "path": "/api/cron/appointment-reminders",
      "schedule": "*/15 * * * *"
    },
    {
      "path": "/api/cron/process-workflows",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

### 7.2 Secure Cron Endpoints

Each cron endpoint should verify the `CRON_SECRET`:

```typescript
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");

  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Process cron job...
}
```

---

## 8. Testing Checklist

### 8.1 Authentication
- [ ] User can sign up with email
- [ ] User can sign in with email
- [ ] Password reset works
- [ ] Google OAuth works (if configured)

### 8.2 Core CRM
- [ ] Can create/edit/delete contacts
- [ ] Can create/edit/delete deals
- [ ] Can move deals through pipeline stages
- [ ] Activities are logged correctly

### 8.3 Email & SMS
- [ ] Can send test email
- [ ] Can send test SMS
- [ ] Webhooks update delivery status
- [ ] Email queue processes correctly

### 8.4 Forms & Pages
- [ ] Can create and publish forms
- [ ] Form submissions create contacts
- [ ] Can create and publish landing pages
- [ ] Public pages render correctly

### 8.5 Appointments
- [ ] Can create booking page
- [ ] Public booking flow works
- [ ] Appointment reminders send
- [ ] Calendar integration syncs

### 8.6 Integrations
- [ ] ctg-v1 webhooks work
- [ ] CornerstoneCallbot webhooks work
- [ ] Click-to-call initiates calls
- [ ] Call logs appear in activities

### 8.7 White-Label
- [ ] Branding settings save correctly
- [ ] Logo appears on public pages
- [ ] Colors apply correctly
- [ ] Custom CSS works

### 8.8 Sub-Accounts
- [ ] Can create sub-account
- [ ] Can switch between accounts
- [ ] Feature flags restrict access
- [ ] Usage limits enforce correctly

---

## Support

For issues or questions:
- GitHub Issues: https://github.com/rabidhusker/CornerstoneCRM/issues
- Documentation: (add link when available)

---

*Last updated: December 2024*
