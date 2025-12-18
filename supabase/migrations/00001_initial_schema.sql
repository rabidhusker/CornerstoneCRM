-- CSTG CRM Platform - Database Schema
-- Version: 001_crm_tables
-- Description: CRM module for shared Supabase database
-- Integrates with existing workspaces and auth.users
-- All tables prefixed with 'crm_' for namespace separation

-- ============================================
-- EXTENSIONS
-- ============================================
-- Enable pg_trgm for fuzzy text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- ENUMS (prefixed to avoid conflicts)
-- ============================================
DO $$ BEGIN
    CREATE TYPE crm_contact_type AS ENUM ('buyer', 'seller', 'both', 'investor', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crm_contact_status AS ENUM ('active', 'inactive', 'archived');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crm_deal_status AS ENUM ('open', 'won', 'lost');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crm_activity_type AS ENUM ('call', 'email', 'meeting', 'note', 'task', 'other');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crm_campaign_type AS ENUM ('email', 'sms', 'drip');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crm_campaign_status AS ENUM ('draft', 'scheduled', 'active', 'paused', 'completed');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crm_message_type AS ENUM ('email', 'sms');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crm_message_direction AS ENUM ('inbound', 'outbound');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crm_message_status AS ENUM ('pending', 'sent', 'delivered', 'failed', 'opened', 'clicked');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE crm_appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================
-- CRM_CONTACTS TABLE
-- Core contact management for the CRM
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Basic Information
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),

    -- Contact Type and Status
    type crm_contact_type DEFAULT 'other',
    status crm_contact_status DEFAULT 'active',

    -- Lead Source
    source VARCHAR(100),
    source_detail TEXT,

    -- Address
    address_line1 TEXT,
    address_line2 TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'USA',

    -- Organization and Metadata
    company_name VARCHAR(255),
    job_title VARCHAR(100),
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',

    -- Engagement Metrics
    last_contacted_at TIMESTAMPTZ,
    lead_score INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_contacts_workspace ON public.crm_contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_assigned_to ON public.crm_contacts(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_phone ON public.crm_contacts(phone);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_status ON public.crm_contacts(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_type ON public.crm_contacts(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_tags ON public.crm_contacts USING GIN(tags);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_name_search ON public.crm_contacts USING GIN((first_name || ' ' || last_name) gin_trgm_ops);

-- ============================================
-- CRM_PIPELINES TABLE
-- Sales pipelines for deal management
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_pipelines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- Basic Information
    name VARCHAR(100) NOT NULL,
    description TEXT,

    -- Configuration
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_pipelines_workspace ON public.crm_pipelines(workspace_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_pipelines_default ON public.crm_pipelines(workspace_id) WHERE is_default = TRUE;

-- ============================================
-- CRM_PIPELINE_STAGES TABLE
-- Stages within each pipeline
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,

    -- Stage Information
    name VARCHAR(100) NOT NULL,
    position INTEGER NOT NULL,
    color VARCHAR(20) DEFAULT '#6B7280',

    -- Win Probability (0-100%)
    probability INTEGER CHECK (probability >= 0 AND probability <= 100),

    -- Configuration
    is_won_stage BOOLEAN DEFAULT FALSE,
    is_lost_stage BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_pipeline_stages_pipeline ON public.crm_pipeline_stages(pipeline_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_pipeline_stages_position ON public.crm_pipeline_stages(pipeline_id, position);

-- ============================================
-- CRM_DEALS TABLE
-- Real estate deals/transactions
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_deals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    pipeline_id UUID NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE RESTRICT,
    stage_id UUID NOT NULL REFERENCES public.crm_pipeline_stages(id) ON DELETE RESTRICT,
    contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE RESTRICT,
    assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Deal Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    value DECIMAL(15, 2),
    expected_close_date DATE,
    actual_close_date DATE,

    -- Status
    status crm_deal_status DEFAULT 'open',
    lost_reason TEXT,
    won_date TIMESTAMPTZ,
    lost_date TIMESTAMPTZ,

    -- Property Information (Real Estate specific)
    property_address TEXT,
    property_city VARCHAR(100),
    property_state VARCHAR(50),
    property_zip VARCHAR(20),
    property_type VARCHAR(100),
    property_bedrooms INTEGER,
    property_bathrooms DECIMAL(3,1),
    property_sqft INTEGER,
    property_year_built INTEGER,
    property_list_price DECIMAL(15, 2),
    property_mls_number VARCHAR(50),

    -- Commission Tracking
    commission_rate DECIMAL(5, 2),
    commission_amount DECIMAL(15, 2),
    commission_split JSONB DEFAULT '{}',

    -- Metadata
    tags TEXT[] DEFAULT '{}',
    custom_fields JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_deals_workspace ON public.crm_deals(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline ON public.crm_deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals(stage_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_contact ON public.crm_deals(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_assigned_to ON public.crm_deals(assigned_to);
CREATE INDEX IF NOT EXISTS idx_crm_deals_status ON public.crm_deals(workspace_id, status);
CREATE INDEX IF NOT EXISTS idx_crm_deals_expected_close ON public.crm_deals(workspace_id, expected_close_date) WHERE status = 'open';

-- ============================================
-- CRM_ACTIVITIES TABLE
-- Activity tracking (calls, emails, meetings, tasks)
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,

    -- Link to callbot calls (integration with existing system)
    call_id UUID REFERENCES public.calls(id) ON DELETE SET NULL,

    -- Activity Information
    type crm_activity_type NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,

    -- Scheduling
    due_date TIMESTAMPTZ,
    reminder_at TIMESTAMPTZ,

    -- Completion
    completed_at TIMESTAMPTZ,
    outcome TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_activities_workspace ON public.crm_activities(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_user ON public.crm_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_contact ON public.crm_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON public.crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_call ON public.crm_activities(call_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_type ON public.crm_activities(workspace_id, type);
CREATE INDEX IF NOT EXISTS idx_crm_activities_due_date ON public.crm_activities(workspace_id, due_date) WHERE completed_at IS NULL;

-- ============================================
-- CRM_CAMPAIGNS TABLE
-- Marketing campaigns
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Campaign Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type crm_campaign_type NOT NULL,
    status crm_campaign_status DEFAULT 'draft',

    -- Content
    subject_line VARCHAR(500),
    content_html TEXT,
    content_text TEXT,

    -- Configuration
    settings JSONB DEFAULT '{}',

    -- Scheduling
    scheduled_at TIMESTAMPTZ,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,

    -- Stats
    recipients_count INTEGER DEFAULT 0,
    sent_count INTEGER DEFAULT 0,
    delivered_count INTEGER DEFAULT 0,
    opened_count INTEGER DEFAULT 0,
    clicked_count INTEGER DEFAULT 0,
    bounced_count INTEGER DEFAULT 0,
    unsubscribed_count INTEGER DEFAULT 0,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_workspace ON public.crm_campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_created_by ON public.crm_campaigns(created_by);
CREATE INDEX IF NOT EXISTS idx_crm_campaigns_status ON public.crm_campaigns(workspace_id, status);

-- ============================================
-- CRM_CAMPAIGN_CONTACTS TABLE
-- Many-to-many: campaigns to contacts
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_campaign_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES public.crm_campaigns(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',

    -- Tracking
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    bounced_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_crm_campaign_contacts_unique ON public.crm_campaign_contacts(campaign_id, contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_campaign_contacts_contact ON public.crm_campaign_contacts(contact_id);

-- ============================================
-- CRM_WORKFLOWS TABLE
-- Automation workflows
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_workflows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

    -- Workflow Information
    name VARCHAR(255) NOT NULL,
    description TEXT,

    -- Trigger
    trigger_type VARCHAR(100) NOT NULL,
    trigger_config JSONB DEFAULT '{}',

    -- Actions
    actions JSONB DEFAULT '[]',

    -- Status
    is_active BOOLEAN DEFAULT FALSE,

    -- Stats
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,
    last_run_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_workflows_workspace ON public.crm_workflows(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_workflows_active ON public.crm_workflows(workspace_id) WHERE is_active = TRUE;

-- ============================================
-- CRM_MESSAGES TABLE
-- Email/SMS message history
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    contact_id UUID NOT NULL REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    campaign_id UUID REFERENCES public.crm_campaigns(id) ON DELETE SET NULL,

    -- Link to existing SMS system
    sms_message_id UUID REFERENCES public.sms_messages(id) ON DELETE SET NULL,

    -- Message Information
    type crm_message_type NOT NULL,
    direction crm_message_direction NOT NULL,
    subject VARCHAR(500),
    content TEXT NOT NULL,

    -- Status
    status crm_message_status DEFAULT 'pending',

    -- External References
    external_id VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    sent_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    opened_at TIMESTAMPTZ,
    clicked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_messages_workspace ON public.crm_messages(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_contact ON public.crm_messages(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_user ON public.crm_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_campaign ON public.crm_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_sms ON public.crm_messages(sms_message_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_external ON public.crm_messages(external_id);
CREATE INDEX IF NOT EXISTS idx_crm_messages_status ON public.crm_messages(workspace_id, status);

-- ============================================
-- CRM_APPOINTMENTS TABLE
-- Calendar appointments and showings
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE SET NULL,

    -- Appointment Information
    title VARCHAR(255) NOT NULL,
    description TEXT,
    location TEXT,

    -- Timing
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    all_day BOOLEAN DEFAULT FALSE,
    timezone VARCHAR(50) DEFAULT 'America/New_York',

    -- Status
    status crm_appointment_status DEFAULT 'scheduled',

    -- Reminders
    reminder_minutes INTEGER[] DEFAULT ARRAY[30, 1440],
    reminder_sent BOOLEAN DEFAULT FALSE,

    -- Integration
    google_event_id VARCHAR(255),
    google_calendar_id VARCHAR(255),

    -- Real Estate Specific
    showing_type VARCHAR(50),
    showing_feedback TEXT,

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_appointments_workspace ON public.crm_appointments(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_appointments_user ON public.crm_appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_appointments_contact ON public.crm_appointments(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_appointments_deal ON public.crm_appointments(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_appointments_time ON public.crm_appointments(workspace_id, start_time, end_time);
CREATE INDEX IF NOT EXISTS idx_crm_appointments_google ON public.crm_appointments(google_event_id) WHERE google_event_id IS NOT NULL;

-- ============================================
-- CRM_NOTES TABLE
-- General notes for contacts/deals
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,

    -- Note Content
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_notes_workspace ON public.crm_notes(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_contact ON public.crm_notes(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_notes_deal ON public.crm_notes(deal_id);

-- ============================================
-- CRM_DOCUMENTS TABLE
-- Document storage for deals
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    contact_id UUID REFERENCES public.crm_contacts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.crm_deals(id) ON DELETE CASCADE,

    -- Document Information
    name VARCHAR(255) NOT NULL,
    description TEXT,
    file_path TEXT NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),

    -- Document Type
    document_type VARCHAR(50),

    -- DocuSign Integration
    docusign_envelope_id VARCHAR(255),
    docusign_status VARCHAR(50),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_documents_workspace ON public.crm_documents(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_documents_contact ON public.crm_documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_documents_deal ON public.crm_documents(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_documents_docusign ON public.crm_documents(docusign_envelope_id) WHERE docusign_envelope_id IS NOT NULL;

-- ============================================
-- CRM_AUDIT_LOGS TABLE
-- Audit trail for CRM actions
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- Audit Information
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,

    -- Change Data
    old_values JSONB,
    new_values JSONB,

    -- Request Context
    ip_address INET,
    user_agent TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_workspace ON public.crm_audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_entity ON public.crm_audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_user ON public.crm_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_audit_logs_created ON public.crm_audit_logs(workspace_id, created_at DESC);

-- ============================================
-- CRM_TAGS TABLE
-- Centralized tag management
-- ============================================
CREATE TABLE IF NOT EXISTS public.crm_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,

    -- Tag Information
    name VARCHAR(100) NOT NULL,
    color VARCHAR(20) DEFAULT '#6B7280',
    description TEXT,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique tag names per workspace
    UNIQUE(workspace_id, name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crm_tags_workspace ON public.crm_tags(workspace_id);

-- ============================================
-- UPDATED_AT TRIGGERS
-- Use existing update_updated_at() function from cornerstone-callbot
-- ============================================
CREATE TRIGGER update_crm_contacts_updated_at BEFORE UPDATE ON public.crm_contacts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_pipelines_updated_at BEFORE UPDATE ON public.crm_pipelines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_pipeline_stages_updated_at BEFORE UPDATE ON public.crm_pipeline_stages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_deals_updated_at BEFORE UPDATE ON public.crm_deals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_activities_updated_at BEFORE UPDATE ON public.crm_activities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_campaigns_updated_at BEFORE UPDATE ON public.crm_campaigns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_workflows_updated_at BEFORE UPDATE ON public.crm_workflows
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_messages_updated_at BEFORE UPDATE ON public.crm_messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_appointments_updated_at BEFORE UPDATE ON public.crm_appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_notes_updated_at BEFORE UPDATE ON public.crm_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_documents_updated_at BEFORE UPDATE ON public.crm_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_crm_tags_updated_at BEFORE UPDATE ON public.crm_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Uses workspace membership for access control
-- ============================================

-- Enable RLS on all CRM tables
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_campaign_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tags ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is a member of workspace
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
        AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Check if user is admin/owner of workspace
CREATE OR REPLACE FUNCTION is_workspace_admin(ws_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_id = ws_id
        AND user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- CRM_CONTACTS POLICIES
CREATE POLICY "Users can view contacts in their workspace" ON public.crm_contacts
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can create contacts in their workspace" ON public.crm_contacts
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Users can update contacts in their workspace" ON public.crm_contacts
    FOR UPDATE USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can delete contacts" ON public.crm_contacts
    FOR DELETE USING (is_workspace_admin(workspace_id));

-- CRM_PIPELINES POLICIES
CREATE POLICY "Users can view pipelines in their workspace" ON public.crm_pipelines
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage pipelines" ON public.crm_pipelines
    FOR ALL USING (is_workspace_admin(workspace_id));

-- CRM_PIPELINE_STAGES POLICIES
CREATE POLICY "Users can view pipeline stages" ON public.crm_pipeline_stages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.crm_pipelines
            WHERE crm_pipelines.id = crm_pipeline_stages.pipeline_id
            AND is_workspace_member(crm_pipelines.workspace_id)
        )
    );

CREATE POLICY "Admins can manage pipeline stages" ON public.crm_pipeline_stages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.crm_pipelines
            WHERE crm_pipelines.id = crm_pipeline_stages.pipeline_id
            AND is_workspace_admin(crm_pipelines.workspace_id)
        )
    );

-- CRM_DEALS POLICIES
CREATE POLICY "Users can view deals in their workspace" ON public.crm_deals
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can create deals in their workspace" ON public.crm_deals
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Users can update deals in their workspace" ON public.crm_deals
    FOR UPDATE USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can delete deals" ON public.crm_deals
    FOR DELETE USING (is_workspace_admin(workspace_id));

-- CRM_ACTIVITIES POLICIES
CREATE POLICY "Users can view activities in their workspace" ON public.crm_activities
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can create activities" ON public.crm_activities
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id) AND user_id = auth.uid());

CREATE POLICY "Users can update their own activities" ON public.crm_activities
    FOR UPDATE USING (user_id = auth.uid() OR is_workspace_admin(workspace_id));

CREATE POLICY "Users can delete their own activities" ON public.crm_activities
    FOR DELETE USING (user_id = auth.uid() OR is_workspace_admin(workspace_id));

-- CRM_CAMPAIGNS POLICIES
CREATE POLICY "Users can view campaigns in their workspace" ON public.crm_campaigns
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can create campaigns" ON public.crm_campaigns
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Users can update campaigns they created or as admin" ON public.crm_campaigns
    FOR UPDATE USING (created_by = auth.uid() OR is_workspace_admin(workspace_id));

CREATE POLICY "Admins can delete campaigns" ON public.crm_campaigns
    FOR DELETE USING (is_workspace_admin(workspace_id));

-- CRM_CAMPAIGN_CONTACTS POLICIES
CREATE POLICY "Users can view campaign contacts" ON public.crm_campaign_contacts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.crm_campaigns
            WHERE crm_campaigns.id = crm_campaign_contacts.campaign_id
            AND is_workspace_member(crm_campaigns.workspace_id)
        )
    );

CREATE POLICY "Users can manage campaign contacts" ON public.crm_campaign_contacts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.crm_campaigns
            WHERE crm_campaigns.id = crm_campaign_contacts.campaign_id
            AND is_workspace_member(crm_campaigns.workspace_id)
        )
    );

-- CRM_WORKFLOWS POLICIES
CREATE POLICY "Users can view workflows in their workspace" ON public.crm_workflows
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage workflows" ON public.crm_workflows
    FOR ALL USING (is_workspace_admin(workspace_id));

-- CRM_MESSAGES POLICIES
CREATE POLICY "Users can view messages in their workspace" ON public.crm_messages
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can create messages" ON public.crm_messages
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Users can update messages" ON public.crm_messages
    FOR UPDATE USING (is_workspace_member(workspace_id));

-- CRM_APPOINTMENTS POLICIES
CREATE POLICY "Users can view appointments in their workspace" ON public.crm_appointments
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can create appointments" ON public.crm_appointments
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Users can update their own appointments" ON public.crm_appointments
    FOR UPDATE USING (user_id = auth.uid() OR is_workspace_admin(workspace_id));

CREATE POLICY "Users can delete their own appointments" ON public.crm_appointments
    FOR DELETE USING (user_id = auth.uid() OR is_workspace_admin(workspace_id));

-- CRM_NOTES POLICIES
CREATE POLICY "Users can view notes in their workspace" ON public.crm_notes
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can create notes" ON public.crm_notes
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id) AND user_id = auth.uid());

CREATE POLICY "Users can update their own notes" ON public.crm_notes
    FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own notes or as admin" ON public.crm_notes
    FOR DELETE USING (user_id = auth.uid() OR is_workspace_admin(workspace_id));

-- CRM_DOCUMENTS POLICIES
CREATE POLICY "Users can view documents in their workspace" ON public.crm_documents
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Users can upload documents" ON public.crm_documents
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

CREATE POLICY "Users can update their documents or as admin" ON public.crm_documents
    FOR UPDATE USING (uploaded_by = auth.uid() OR is_workspace_admin(workspace_id));

CREATE POLICY "Admins can delete documents" ON public.crm_documents
    FOR DELETE USING (is_workspace_admin(workspace_id));

-- CRM_AUDIT_LOGS POLICIES
CREATE POLICY "Users can view audit logs in their workspace" ON public.crm_audit_logs
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "System can insert audit logs" ON public.crm_audit_logs
    FOR INSERT WITH CHECK (is_workspace_member(workspace_id));

-- CRM_TAGS POLICIES
CREATE POLICY "Users can view tags in their workspace" ON public.crm_tags
    FOR SELECT USING (is_workspace_member(workspace_id));

CREATE POLICY "Admins can manage tags" ON public.crm_tags
    FOR ALL USING (is_workspace_admin(workspace_id));

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to get user's workspaces
CREATE OR REPLACE FUNCTION get_user_workspaces()
RETURNS TABLE (
    workspace_id UUID,
    workspace_name TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        w.id,
        w.name,
        wm.role
    FROM public.workspaces w
    INNER JOIN public.workspace_members wm ON w.id = wm.workspace_id
    WHERE wm.user_id = auth.uid()
    AND wm.status = 'active'
    AND w.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create default pipeline for workspace
CREATE OR REPLACE FUNCTION create_default_crm_pipeline(ws_id UUID)
RETURNS UUID AS $$
DECLARE
    pipeline_id UUID;
BEGIN
    -- Create default pipeline
    INSERT INTO public.crm_pipelines (workspace_id, name, description, is_default)
    VALUES (ws_id, 'Sales Pipeline', 'Default sales pipeline', true)
    RETURNING id INTO pipeline_id;

    -- Create default stages
    INSERT INTO public.crm_pipeline_stages (pipeline_id, name, position, color, probability, is_won_stage, is_lost_stage) VALUES
    (pipeline_id, 'New Lead', 1, '#6B7280', 10, false, false),
    (pipeline_id, 'Contacted', 2, '#3B82F6', 20, false, false),
    (pipeline_id, 'Qualified', 3, '#8B5CF6', 40, false, false),
    (pipeline_id, 'Showing Scheduled', 4, '#F59E0B', 60, false, false),
    (pipeline_id, 'Offer Made', 5, '#10B981', 80, false, false),
    (pipeline_id, 'Under Contract', 6, '#06B6D4', 90, false, false),
    (pipeline_id, 'Closed Won', 7, '#22C55E', 100, true, false),
    (pipeline_id, 'Closed Lost', 8, '#EF4444', 0, false, true);

    RETURN pipeline_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS
-- ============================================

-- Contact summary view with activity counts
CREATE OR REPLACE VIEW public.crm_contact_summary AS
SELECT
    c.id,
    c.workspace_id,
    c.first_name,
    c.last_name,
    c.email,
    c.phone,
    c.type,
    c.status,
    c.assigned_to,
    c.last_contacted_at,
    c.lead_score,
    c.created_at,
    COUNT(DISTINCT d.id) AS deals_count,
    COUNT(DISTINCT a.id) AS activities_count,
    COUNT(DISTINCT apt.id) AS appointments_count,
    COALESCE(SUM(CASE WHEN d.status = 'won' THEN d.value ELSE 0 END), 0) AS total_won_value
FROM public.crm_contacts c
LEFT JOIN public.crm_deals d ON c.id = d.contact_id
LEFT JOIN public.crm_activities a ON c.id = a.contact_id
LEFT JOIN public.crm_appointments apt ON c.id = apt.contact_id
GROUP BY c.id;

-- Deal pipeline view with stage info
CREATE OR REPLACE VIEW public.crm_deal_pipeline_view AS
SELECT
    d.id,
    d.workspace_id,
    d.title,
    d.value,
    d.status,
    d.expected_close_date,
    d.property_address,
    d.assigned_to,
    d.created_at,
    p.name AS pipeline_name,
    s.name AS stage_name,
    s.position AS stage_position,
    s.color AS stage_color,
    s.probability,
    c.first_name AS contact_first_name,
    c.last_name AS contact_last_name,
    c.email AS contact_email,
    c.phone AS contact_phone
FROM public.crm_deals d
INNER JOIN public.crm_pipelines p ON d.pipeline_id = p.id
INNER JOIN public.crm_pipeline_stages s ON d.stage_id = s.id
INNER JOIN public.crm_contacts c ON d.contact_id = c.id;

-- ============================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================

COMMENT ON TABLE public.crm_contacts IS 'CRM contacts - leads, buyers, sellers, investors';
COMMENT ON TABLE public.crm_pipelines IS 'Sales pipelines for deal tracking';
COMMENT ON TABLE public.crm_pipeline_stages IS 'Stages within each sales pipeline';
COMMENT ON TABLE public.crm_deals IS 'Real estate deals and transactions';
COMMENT ON TABLE public.crm_activities IS 'Activity tracking - calls, emails, meetings, tasks';
COMMENT ON TABLE public.crm_campaigns IS 'Marketing campaigns - email, SMS, drip';
COMMENT ON TABLE public.crm_workflows IS 'Automation workflows';
COMMENT ON TABLE public.crm_messages IS 'Email and SMS message history';
COMMENT ON TABLE public.crm_appointments IS 'Calendar appointments and property showings';
COMMENT ON TABLE public.crm_notes IS 'Notes for contacts and deals';
COMMENT ON TABLE public.crm_documents IS 'Document storage with DocuSign integration';
COMMENT ON TABLE public.crm_audit_logs IS 'Audit trail for CRM actions';
COMMENT ON TABLE public.crm_tags IS 'Centralized tag management';

COMMENT ON COLUMN public.crm_activities.call_id IS 'Links to callbot calls table for integrated call tracking';
COMMENT ON COLUMN public.crm_messages.sms_message_id IS 'Links to existing SMS messages from callbot system';
