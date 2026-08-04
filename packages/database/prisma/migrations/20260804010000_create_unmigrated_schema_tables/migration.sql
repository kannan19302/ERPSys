-- Additive reconciliation: create tables declared in the schema that have
-- never been migrated into the database.
--
-- Generated from `prisma migrate diff`, then filtered to additive statements
-- ONLY. The raw diff is unsafe: it wants to DROP users, roles, user_roles,
-- user_sessions, user_identities, user_profiles, api_keys,
-- password_reset_tokens, email_verification_tokens, push_subscriptions and
-- mfa_push_challenges, because the main schema and the IdP schema both target
-- `public` in the same database and each therefore sees the other's tables as
-- removable. That is an architectural problem to fix (separate Postgres schemas
-- or separate databases), not something a migration should act on.
--
-- Kept here: CREATE TABLE for 762 previously-missing tables, their
-- indexes, and foreign keys owned by those new tables.
-- Excluded: every DROP, and every ALTER against a pre-existing table.
--
-- RLS is applied to the new tenant-scoped tables at the end, so this migration
-- cannot leave a tenant table unprotected (BACKEND_SCHEMA § 4.4).

CREATE TABLE "document_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "approver_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approved_at" TIMESTAMP(3),

    CONSTRAINT "document_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_articles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "excerpt" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "author_id" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_articles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT DEFAULT 'BookOpen',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_article_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_article_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "knowledge_article_ratings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "article_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_article_ratings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "helpdesk_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT NOT NULL DEFAULT 'EMAIL',
    "category" TEXT DEFAULT 'GENERAL',
    "assigned_to" TEXT,
    "customer_id" TEXT NOT NULL,
    "customer_email" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "sla_breached" BOOLEAN NOT NULL DEFAULT false,
    "escalated_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "helpdesk_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "author_name" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "canned_responses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "shortcut" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "canned_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ticket_slas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "response_mins" INTEGER NOT NULL DEFAULT 60,
    "resolution_mins" INTEGER NOT NULL DEFAULT 240,
    "responded_at" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "breached" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ticket_slas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_satisfaction" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_satisfaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "omnichannel_conversations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "contact_name" TEXT NOT NULL,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "platform" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assigned_to" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "last_message_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "omnichannel_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "conversation_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'INBOUND',
    "content" TEXT NOT NULL,
    "contentType" TEXT NOT NULL DEFAULT 'TEXT',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "author_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "channel_integrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL DEFAULT 'EMAIL',
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_integrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "breakout_rooms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "host_id" TEXT NOT NULL,
    "participant_ids" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "breakout_rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "meeting_analytics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "total_participants" INTEGER NOT NULL DEFAULT 0,
    "peak_participants" INTEGER NOT NULL DEFAULT 0,
    "avg_duration_mins" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total_screen_shares" INTEGER NOT NULL DEFAULT 0,
    "total_messages" INTEGER NOT NULL DEFAULT 0,
    "total_reactions" INTEGER NOT NULL DEFAULT 0,
    "hand_raised_count" INTEGER NOT NULL DEFAULT 0,
    "recording_count" INTEGER NOT NULL DEFAULT 0,
    "participant_data" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "meeting_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voip_calls" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "caller_id" TEXT NOT NULL,
    "caller_name" TEXT NOT NULL,
    "caller_number" TEXT NOT NULL,
    "callee_number" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'INBOUND',
    "status" TEXT NOT NULL DEFAULT 'RINGING',
    "duration_secs" INTEGER NOT NULL DEFAULT 0,
    "recording_url" TEXT,
    "ivr_menu_id" TEXT,
    "assigned_to" TEXT,
    "notes" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voip_calls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voip_call_analytics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "call_id" TEXT NOT NULL,
    "total_calls" INTEGER NOT NULL DEFAULT 0,
    "answered_calls" INTEGER NOT NULL DEFAULT 0,
    "missed_calls" INTEGER NOT NULL DEFAULT 0,
    "avg_duration" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "max_duration" INTEGER NOT NULL DEFAULT 0,
    "total_duration" INTEGER NOT NULL DEFAULT 0,
    "date" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "voip_call_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "voicemails" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "call_id" TEXT,
    "caller_number" TEXT NOT NULL,
    "caller_name" TEXT,
    "duration_secs" INTEGER NOT NULL DEFAULT 0,
    "file_url" TEXT NOT NULL,
    "transcript" TEXT,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "assigned_to" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voicemails_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ivr_menus" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "greeting" TEXT NOT NULL,
    "timeout_secs" INTEGER NOT NULL DEFAULT 10,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ivr_menus_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ivr_options" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "menu_id" TEXT NOT NULL,
    "digit" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "action_value" TEXT,
    "label" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ivr_options_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_searches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "scope" TEXT NOT NULL DEFAULT 'ALL',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_searches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "search_history" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'ALL',
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "synonym_dictionaries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "synonyms" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "synonym_dictionaries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "collab_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_html" TEXT,
    "owner_id" TEXT NOT NULL,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "locked_by" TEXT,
    "collaborators" JSONB NOT NULL DEFAULT '[]',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "collab_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "collab_document_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "author_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collab_document_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whiteboards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "width" INTEGER NOT NULL DEFAULT 1920,
    "height" INTEGER NOT NULL DEFAULT 1080,
    "background" TEXT NOT NULL DEFAULT '#FFFFFF',
    "owner_id" TEXT NOT NULL,
    "collaborators" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whiteboards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "whiteboard_elements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "whiteboard_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'RECTANGLE',
    "properties" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whiteboard_elements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comm_surveys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "surveyType" TEXT NOT NULL DEFAULT 'FEEDBACK',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "template_id" TEXT,
    "response_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "published_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comm_surveys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comm_survey_questions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'TEXT',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" JSONB NOT NULL DEFAULT '[]',
    "validation" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comm_survey_questions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comm_survey_responses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "respondent_id" TEXT,
    "respondent_email" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comm_survey_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comm_survey_answers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "response_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comm_survey_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comm_survey_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "questions" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "is_built_in" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comm_survey_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "learning_courses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "duration_hours" DECIMAL(8,2),
    "provider" TEXT,
    "delivery_mode" TEXT NOT NULL DEFAULT 'ONLINE',
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "cost" DECIMAL(15,2),
    "max_attendees" INTEGER,
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_courses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "learning_modules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "content_type" TEXT NOT NULL DEFAULT 'VIDEO',
    "content_url" TEXT,
    "duration_min" INTEGER,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "learning_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENROLLED',
    "progress_pct" DECIMAL(5,2),
    "score" DECIMAL(8,2),
    "completed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "learning_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "certifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "issuing_body" TEXT NOT NULL,
    "credential_id" TEXT,
    "issue_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "never_expires" BOOLEAN NOT NULL DEFAULT false,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "verified_at" TIMESTAMP(3),
    "document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "certifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skill_matrices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_matrices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skill_gap_analyses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "current_level" TEXT NOT NULL,
    "required_level" TEXT NOT NULL,
    "gap_score" INTEGER NOT NULL DEFAULT 0,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notes" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_gap_analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "career_paths" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "from_position" TEXT NOT NULL,
    "to_position" TEXT NOT NULL,
    "typical_duration_months" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "career_paths_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "career_path_requirements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "career_path_id" TEXT NOT NULL,
    "skill_id" TEXT NOT NULL,
    "minimum_level" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "career_path_requirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mentoring_programs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "objectives" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "max_pairs" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentoring_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mentoring_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "mentor_id" TEXT NOT NULL,
    "mentee_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "session_topic" TEXT,
    "feedback" TEXT,
    "rating" INTEGER,
    "goals" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mentoring_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bonus_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "plan_type" TEXT NOT NULL,
    "eligibility_rule" TEXT,
    "calculation_basis" TEXT NOT NULL DEFAULT 'FIXED',
    "target_amount" DECIMAL(15,2),
    "max_amount" DECIMAL(15,2),
    "payout_frequency" TEXT NOT NULL DEFAULT 'ANNUAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bonus_payouts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "payout_date" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "payout_percentage" DECIMAL(5,2),
    "reason" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "is_paid" BOOLEAN NOT NULL DEFAULT false,
    "paid_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bonus_payouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "equity_grants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "grant_type" TEXT NOT NULL,
    "total_shares" DECIMAL(15,4) NOT NULL,
    "share_price" DECIMAL(15,4) NOT NULL,
    "grant_date" TIMESTAMP(3) NOT NULL,
    "cliff_months" INTEGER NOT NULL DEFAULT 12,
    "vesting_months" INTEGER NOT NULL DEFAULT 48,
    "vesting_schedule" TEXT NOT NULL DEFAULT 'EQUAL_MONTHLY',
    "status" TEXT NOT NULL DEFAULT 'GRANTED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "equity_grants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "equity_vesting_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "grant_id" TEXT NOT NULL,
    "vesting_date" TIMESTAMP(3) NOT NULL,
    "shares_vesting" DECIMAL(15,4) NOT NULL,
    "cumulative_vested" DECIMAL(15,4),
    "is_cliff" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "vested_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "equity_vesting_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "benefits_eligibility_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "benefit_type" TEXT NOT NULL,
    "employment_type" TEXT,
    "min_tenure_months" INTEGER,
    "min_hours_per_week" DECIMAL(5,2),
    "job_grade" TEXT,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "benefits_eligibility_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "flexible_benefit_credits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "total_credit" DECIMAL(15,2) NOT NULL,
    "used_credit" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "remaining_credit" DECIMAL(15,2),
    "allocations" JSONB DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flexible_benefit_credits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compensation_reviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "review_cycle" TEXT NOT NULL,
    "current_salary" DECIMAL(15,2) NOT NULL,
    "recommended_salary" DECIMAL(15,2),
    "increase_pct" DECIMAL(5,2),
    "effective_date" TIMESTAMP(3),
    "reviewer_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compensation_benchmarks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "position_title" TEXT NOT NULL,
    "market_source" TEXT NOT NULL,
    "p10" DECIMAL(15,2),
    "p25" DECIMAL(15,2),
    "p50" DECIMAL(15,2),
    "p75" DECIMAL(15,2),
    "p90" DECIMAL(15,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "geographic_area" TEXT,
    "data_year" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compensation_benchmarks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "total_rewards_statements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "statement_date" TIMESTAMP(3) NOT NULL,
    "base_salary" DECIMAL(15,2) NOT NULL,
    "bonus_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "benefits_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "equity_total" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "total_compensation" DECIMAL(15,2) NOT NULL,
    "breakdown" JSONB DEFAULT '{}',
    "pdf_url" TEXT,
    "is_generated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "total_rewards_statements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dispute_resolutions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "dispute_type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "initiating_party" TEXT NOT NULL,
    "respondent_id" TEXT,
    "mediator_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dispute_resolutions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "background_check_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "candidate_id" TEXT,
    "employee_id" TEXT,
    "check_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "vendor_name" TEXT,
    "requested_by" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "result" TEXT,
    "is_clear" BOOLEAN,
    "document_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_check_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "visa_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "visa_type" TEXT NOT NULL,
    "visa_number" TEXT NOT NULL,
    "issuing_country" TEXT NOT NULL,
    "issued_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_sponsored" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visa_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "immigration_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_number" TEXT NOT NULL,
    "issuing_authority" TEXT NOT NULL,
    "issued_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "is_permanent" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "immigration_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wellness_activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "activity_date" TIMESTAMP(3) NOT NULL,
    "duration_min" INTEGER,
    "metric_value" DECIMAL(10,2),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wellness_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dei_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'DIVERSITY',
    "dimension" TEXT NOT NULL,
    "value" DECIMAL(15,4) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "period" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dei_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dei_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_name" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "report_data" JSONB NOT NULL DEFAULT '{}',
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dei_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "turnover_predictions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "prediction_score" DECIMAL(5,2) NOT NULL,
    "risk_level" TEXT NOT NULL,
    "top_factors" JSONB NOT NULL DEFAULT '[]',
    "predicted_date" TIMESTAMP(3),
    "model_version" TEXT,
    "is_actioned" BOOLEAN NOT NULL DEFAULT false,
    "action_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "turnover_predictions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compliance_requirements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "regulation" TEXT NOT NULL,
    "description" TEXT,
    "jurisdiction" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'ANNUAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_requirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_compliance_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "requirement_id" TEXT NOT NULL,
    "report_name" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "submitted_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "filed_by" TEXT,
    "notes" TEXT,
    "document_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_compliance_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wellness_challenges" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "challenge_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "goal_metric" TEXT NOT NULL,
    "goal_value" DECIMAL(10,2) NOT NULL,
    "is_team_based" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wellness_challenges_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wellness_leaderboards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "challenge_id" TEXT NOT NULL,
    "employee_id" TEXT,
    "team_name" TEXT,
    "metric_value" DECIMAL(10,2) NOT NULL,
    "rank" INTEGER NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wellness_leaderboards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "enp_surveys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "surveyType" TEXT NOT NULL DEFAULT 'ENPS',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "response_count" INTEGER NOT NULL DEFAULT 0,
    "avg_score" DECIMAL(5,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enp_surveys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pulse_surveys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "frequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "questions" JSONB NOT NULL DEFAULT '[]',
    "department_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pulse_surveys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "alumni_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "last_position" TEXT NOT NULL,
    "last_department" TEXT,
    "employment_start" TIMESTAMP(3) NOT NULL,
    "employment_end" TIMESTAMP(3) NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "linkedin_url" TEXT,
    "is_active_alumni" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "alumni_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "organizer_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "event_date" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'NETWORKING',
    "max_attendees" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alumni_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "alumni_event_attendees" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "alumni_id" TEXT NOT NULL,
    "rsvp_status" TEXT NOT NULL DEFAULT 'PENDING',
    "attended" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "alumni_event_attendees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_folders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "parent_id" TEXT,
    "path" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_folders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_file_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "file_key" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_file_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_share_links" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'VIEW',
    "expires_at" TIMESTAMP(3),
    "max_downloads" INTEGER,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_share_links_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_quotas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "storage_used" BIGINT NOT NULL DEFAULT 0,
    "storage_limit" BIGINT NOT NULL DEFAULT 1073741824,
    "file_count" INTEGER NOT NULL DEFAULT 0,
    "folder_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "storage_quotas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_key_scopes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "api_key_id" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_key_scopes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_usage_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "api_key_id" TEXT,
    "endpoint" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_ms" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "endpoint_registries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "auth_required" BOOLEAN NOT NULL DEFAULT true,
    "rate_limit" INTEGER DEFAULT 60,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "endpoint_registries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locales" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "direction" TEXT NOT NULL DEFAULT 'ltr',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locales_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "translation_keys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "is_dynamic" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_keys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "translation_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "locale_id" TEXT NOT NULL,
    "key_id" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "is_override" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "translation_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "translation_imports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "locale_code" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "total_entries" INTEGER NOT NULL DEFAULT 0,
    "imported_count" INTEGER NOT NULL DEFAULT 0,
    "skipped_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_log" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "translation_imports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locale_formatting_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "locale_id" TEXT NOT NULL,
    "date_format" TEXT NOT NULL DEFAULT 'YYYY-MM-DD',
    "time_format" TEXT NOT NULL DEFAULT 'HH:mm',
    "number_format" TEXT NOT NULL DEFAULT '#,##0.00',
    "currency_code" TEXT NOT NULL DEFAULT 'USD',
    "currency_symbol" TEXT NOT NULL DEFAULT '$',
    "first_day_of_week" INTEGER NOT NULL DEFAULT 0,
    "timezone" TEXT NOT NULL DEFAULT 'UTC',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locale_formatting_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_forms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "formType" TEXT NOT NULL DEFAULT 'STANDARD',
    "fields" JSONB NOT NULL DEFAULT '[]',
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "calculatedFields" JSONB NOT NULL DEFAULT '[]',
    "pages" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "advanced_forms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_conditions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "field_id" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT,
    "action" TEXT NOT NULL,
    "target_field_id" TEXT NOT NULL,
    "target_value" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_conditions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_calculated_fields" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "label" TEXT,
    "formula" TEXT NOT NULL,
    "fieldType" TEXT NOT NULL DEFAULT 'number',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_calculated_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_pages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "fieldIds" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "form_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "pages" JSONB NOT NULL DEFAULT '[]',
    "changelog" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "form_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bpmn_process_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "bpmn_xml" TEXT,
    "elements" JSONB NOT NULL DEFAULT '[]',
    "flows" JSONB NOT NULL DEFAULT '[]',
    "slaConfig" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bpmn_process_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bpmn_process_instances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "variables" JSONB NOT NULL DEFAULT '{}',
    "currentElements" JSONB NOT NULL DEFAULT '[]',
    "history" JSONB NOT NULL DEFAULT '[]',
    "sla_deadline" TIMESTAMP(3),
    "sla_breached" BOOLEAN NOT NULL DEFAULT false,
    "started_by" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bpmn_process_instances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bpmn_activity_instances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "element_id" TEXT NOT NULL,
    "element_type" TEXT NOT NULL,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "assigned_to" TEXT,
    "variables" JSONB NOT NULL DEFAULT '{}',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "due_at" TIMESTAMP(3),
    "outcome" TEXT,

    CONSTRAINT "bpmn_activity_instances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bpmn_timer_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "element_id" TEXT NOT NULL,
    "timerType" TEXT NOT NULL,
    "timerValue" TEXT NOT NULL,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bpmn_timer_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_endpoints" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "source" TEXT NOT NULL DEFAULT 'CUSTOM',
    "requestSchema" JSONB NOT NULL DEFAULT '{}',
    "responseSchema" JSONB NOT NULL DEFAULT '{}',
    "mappings" JSONB NOT NULL DEFAULT '[]',
    "middleware" JSONB NOT NULL DEFAULT '[]',
    "cache_ttl" INTEGER,
    "rate_limit" INTEGER,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_endpoints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_endpoint_mappings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "source_field" TEXT NOT NULL,
    "target_field" TEXT NOT NULL,
    "transform" TEXT,
    "default_value" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_endpoint_mappings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_test_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "endpoint_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "request" JSONB NOT NULL DEFAULT '{}',
    "response" JSONB DEFAULT '{}',
    "assertions" JSONB NOT NULL DEFAULT '[]',
    "duration_ms" INTEGER,
    "error" TEXT,
    "run_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_test_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_test_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "test_name" TEXT NOT NULL,
    "passed" BOOLEAN NOT NULL DEFAULT false,
    "actual" JSONB DEFAULT '{}',
    "expected" JSONB DEFAULT '{}',
    "message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_test_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_tables" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "priority" INTEGER NOT NULL DEFAULT 1000,
    "hitPolicy" TEXT NOT NULL DEFAULT 'FIRST',
    "inputs" JSONB NOT NULL DEFAULT '[]',
    "outputs" JSONB NOT NULL DEFAULT '[]',
    "rules" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_tables_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "decision_table_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "inputValues" JSONB NOT NULL DEFAULT '[]',
    "outputValues" JSONB NOT NULL DEFAULT '[]',
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "decision_table_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rule_sets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "version" INTEGER NOT NULL DEFAULT 1,
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_sets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rule_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rule_set_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "condition" TEXT NOT NULL,
    "actions" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rule_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "rule_evaluation_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rule_set_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "input" JSONB NOT NULL DEFAULT '{}',
    "output" JSONB NOT NULL DEFAULT '{}',
    "matched" BOOLEAN NOT NULL DEFAULT false,
    "duration_ms" INTEGER,
    "triggered_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rule_evaluation_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "etl_data_sources" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_tested_at" TIMESTAMP(3),
    "test_result" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etl_data_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "etl_pipelines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "source_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "schedule" TEXT,
    "mappings" JSONB NOT NULL DEFAULT '[]',
    "transforms" JSONB NOT NULL DEFAULT '[]',
    "target" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "last_run_at" TIMESTAMP(3),
    "last_run_status" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "etl_pipelines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "etl_mappings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "source_field" TEXT NOT NULL,
    "target_field" TEXT NOT NULL,
    "transform" TEXT,
    "default_value" TEXT,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etl_mappings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "etl_job_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pipeline_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "input_rows" INTEGER NOT NULL DEFAULT 0,
    "output_rows" INTEGER NOT NULL DEFAULT 0,
    "error_rows" INTEGER NOT NULL DEFAULT 0,
    "duration_ms" INTEGER,
    "log" JSONB NOT NULL DEFAULT '[]',
    "error" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "triggered_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "etl_job_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mobile_apps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "platform" TEXT NOT NULL DEFAULT 'BOTH',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "build_number" INTEGER NOT NULL DEFAULT 1,
    "appConfig" JSONB NOT NULL DEFAULT '{}',
    "screens" JSONB NOT NULL DEFAULT '[]',
    "theme" JSONB NOT NULL DEFAULT '{}',
    "capabilities" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_apps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mobile_screens" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'FORM',
    "components" JSONB NOT NULL DEFAULT '[]',
    "layout" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_screens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mobile_notification_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'FCM',
    "credentials" JSONB NOT NULL DEFAULT '{}',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "templates" JSONB NOT NULL DEFAULT '[]',
    "topics" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mobile_notification_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mobile_builds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "build_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "artifact_url" TEXT,
    "build_log" TEXT,
    "file_size" INTEGER,
    "checksum" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error" TEXT,
    "triggered_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mobile_builds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "theme_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "tokens" JSONB NOT NULL DEFAULT '{}',
    "cssVariables" JSONB NOT NULL DEFAULT '{}',
    "typography" JSONB NOT NULL DEFAULT '{}',
    "spacing" JSONB NOT NULL DEFAULT '{}',
    "borderRadius" JSONB NOT NULL DEFAULT '{}',
    "shadows" JSONB NOT NULL DEFAULT '{}',
    "colors" JSONB NOT NULL DEFAULT '{}',
    "settings" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "theme_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "design_tokens" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "theme_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'string',
    "value" TEXT NOT NULL,
    "description" TEXT,
    "css_variable" TEXT,
    "reference" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "design_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "token_values" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'LIGHT',
    "value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_values_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "theme_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "theme_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "tokens" JSONB NOT NULL DEFAULT '{}',
    "css" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "theme_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ab_tests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "type" TEXT NOT NULL DEFAULT 'A_B',
    "page_id" TEXT,
    "page_path" TEXT,
    "goalType" TEXT NOT NULL DEFAULT 'CONVERSION',
    "goalConfig" JSONB NOT NULL DEFAULT '{}',
    "traffic_alloc" INTEGER NOT NULL DEFAULT 50,
    "min_sample_size" INTEGER,
    "confidence" DOUBLE PRECISION DEFAULT 0.95,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "results" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ab_tests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ab_test_variants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CONTROL',
    "changes" JSONB NOT NULL DEFAULT '{}',
    "weight" INTEGER NOT NULL DEFAULT 50,
    "views" INTEGER NOT NULL DEFAULT 0,
    "conversions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ab_test_variants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "audience_segments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "rules" JSONB NOT NULL DEFAULT '[]',
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audience_segments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "segment_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT,
    "logic" TEXT NOT NULL DEFAULT 'AND',
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "segment_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "personalization_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "segment_id" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "actions" JSONB NOT NULL DEFAULT '[]',
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "start_at" TIMESTAMP(3),
    "end_at" TIMESTAMP(3),
    "max_impressions" INTEGER,
    "impression_count" INTEGER NOT NULL DEFAULT 0,
    "conversion_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "personalization_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_app_versions" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "changelog" TEXT,
    "file_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_app_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_developer_submissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "developer_id" TEXT NOT NULL,
    "app_id" TEXT,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "icon" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submission_notes" TEXT,
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_developer_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_analytics" (
    "id" TEXT NOT NULL,
    "app_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "installs" INTEGER NOT NULL DEFAULT 0,
    "uninstalls" INTEGER NOT NULL DEFAULT 0,
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "marketplace_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_disposals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "disposal_date" TIMESTAMP(3) NOT NULL,
    "disposalType" TEXT NOT NULL,
    "sale_price" DECIMAL(15,2),
    "book_value_at_disposal" DECIMAL(15,2) NOT NULL,
    "gain_loss" DECIMAL(15,2),
    "reason" TEXT,
    "journal_id" TEXT,
    "approved_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_asset_disposals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "field_name" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "changed_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_asset_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blockchain_smart_contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "abi" JSONB NOT NULL DEFAULT '[]',
    "network" TEXT NOT NULL DEFAULT 'ethereum',
    "deployed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blockchain_smart_contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blockchain_audit_trails" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "transaction_hash" TEXT,
    "performed_by" TEXT NOT NULL,
    "metadata" JSONB DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_audit_trails_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blockchain_network_health" (
    "id" TEXT NOT NULL,
    "network" TEXT NOT NULL,
    "block_height" INTEGER NOT NULL DEFAULT 0,
    "peers" INTEGER NOT NULL DEFAULT 0,
    "sync_status" TEXT NOT NULL DEFAULT 'SYNCING',
    "last_checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_network_health_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "blockchain_transaction_explorers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transaction_hash" TEXT NOT NULL,
    "block_number" INTEGER,
    "from_address" TEXT,
    "to_address" TEXT,
    "value" TEXT DEFAULT '0',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockchain_transaction_explorers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agile_sprints" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "goal" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "velocity" INTEGER DEFAULT 0,
    "capacity" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agile_sprints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agile_backlog_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'STORY',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'BACKLOG',
    "story_points" INTEGER,
    "assignee_id" TEXT,
    "sprint_id" TEXT,
    "epic_id" TEXT,
    "acceptance_criteria" TEXT,
    "labels" TEXT,
    "order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agile_backlog_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agile_sprint_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sprint_id" TEXT NOT NULL,
    "backlog_item_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TODO',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "agile_sprint_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "agile_retrospectives" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sprint_id" TEXT NOT NULL,
    "went_well" TEXT,
    "to_improve" TEXT,
    "action_items" TEXT,
    "team_mood" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agile_retrospectives_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "skill_catalog" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "skill_catalog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evm_forecasts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "forecast_date" TIMESTAMP(3) NOT NULL,
    "eac" DECIMAL(15,2) NOT NULL,
    "etc" DECIMAL(15,2) NOT NULL,
    "vac" DECIMAL(15,2) NOT NULL,
    "tcpi" DECIMAL(5,2) NOT NULL,
    "bac" DECIMAL(15,2) NOT NULL,
    "cpi" DECIMAL(5,2) NOT NULL,
    "spi" DECIMAL(5,2) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'FORMULA',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evm_forecasts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evm_kpi_targets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "kpi" TEXT NOT NULL,
    "target_min" DECIMAL(5,2),
    "target_max" DECIMAL(5,2),
    "threshold" TEXT NOT NULL DEFAULT 'WARNING',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "evm_kpi_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evm_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "pv" DECIMAL(15,2) NOT NULL,
    "ev" DECIMAL(15,2) NOT NULL,
    "ac" DECIMAL(15,2) NOT NULL,
    "sv" DECIMAL(15,2) NOT NULL,
    "cv" DECIMAL(15,2) NOT NULL,
    "cpi" DECIMAL(5,2) NOT NULL,
    "spi" DECIMAL(5,2) NOT NULL,
    "eac" DECIMAL(15,2) NOT NULL,
    "etc" DECIMAL(15,2) NOT NULL,
    "vac" DECIMAL(15,2) NOT NULL,
    "tcpi" DECIMAL(5,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evm_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capex_projects" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "project_id" TEXT,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "justification" TEXT,
    "category" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_budget" DECIMAL(15,2) NOT NULL,
    "approved_budget" DECIMAL(15,2),
    "spent_to_date" DECIMAL(15,2) DEFAULT 0,
    "request_date" TIMESTAMP(3) NOT NULL,
    "approval_date" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "expected_life_years" INTEGER,
    "residual_value" DECIMAL(15,2),
    "depreciation_method" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capex_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capex_budget_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "capex_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "requested" DECIMAL(15,2) NOT NULL,
    "approved" DECIMAL(15,2) DEFAULT 0,
    "spent" DECIMAL(15,2) DEFAULT 0,
    "fiscal_year" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capex_budget_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capex_gate_reviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "capex_id" TEXT NOT NULL,
    "gateName" TEXT NOT NULL,
    "gate_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "review_date" TIMESTAMP(3),
    "reviewer_id" TEXT,
    "comments" TEXT,
    "score" INTEGER,
    "checklist" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capex_gate_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "capex_capitalizations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "capex_id" TEXT NOT NULL,
    "asset_name" TEXT NOT NULL,
    "asset_class" TEXT,
    "capital_amount" DECIMAL(15,2) NOT NULL,
    "capitalization_date" TIMESTAMP(3) NOT NULL,
    "useful_life_years" INTEGER NOT NULL,
    "salvage_value" DECIMAL(15,2),
    "depreciation_method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CAPITALIZED',
    "gl_account_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "capex_capitalizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "variation_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "claim_id" TEXT,
    "variation_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "changeType" TEXT NOT NULL DEFAULT 'SCOPE',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "cost_impact" DECIMAL(15,2),
    "schedule_impact" INTEGER,
    "requested_date" TIMESTAMP(3) NOT NULL,
    "approval_date" TIMESTAMP(3),
    "approved_by_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "variation_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "claim_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "claim_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'EVIDENCE',
    "file_url" TEXT,
    "mime_type" TEXT,
    "file_size" INTEGER,
    "uploaded_by_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "claim_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pmo_scorecards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "scorecard_date" TIMESTAMP(3) NOT NULL,
    "overall_score" DECIMAL(5,2),
    "healthColor" TEXT NOT NULL DEFAULT 'GREEN',
    "assessed_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pmo_scorecards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pmo_scorecard_dimensions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "scorecard_id" TEXT NOT NULL,
    "dimension" TEXT NOT NULL,
    "score" DECIMAL(5,2),
    "weight" DECIMAL(3,2) DEFAULT 1.0,
    "status" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pmo_scorecard_dimensions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "stage_gates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "gateName" TEXT NOT NULL,
    "gate_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "review_date" TIMESTAMP(3),
    "reviewer_id" TEXT,
    "decision" TEXT,
    "comments" TEXT,
    "score" INTEGER,
    "checklist" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stage_gates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gate_checklists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "gate_id" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "order" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gate_checklists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "discussion_replies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "discussion_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "is_solution" BOOLEAN NOT NULL DEFAULT false,
    "parent_reply_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discussion_replies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_reviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "document_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewer_id" TEXT,
    "due_date" TIMESTAMP(3),
    "comments" TEXT,
    "version" INTEGER DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "spc_charts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "chart_type" TEXT NOT NULL,
    "subgroup_id" TEXT,
    "target_mean" DECIMAL(15,6),
    "usl" DECIMAL(15,6),
    "lsl" DECIMAL(15,6),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spc_charts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "spc_samples" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "chart_id" TEXT NOT NULL,
    "sample_no" INTEGER NOT NULL,
    "values" JSONB NOT NULL DEFAULT '[]',
    "mean" DECIMAL(15,6),
    "range" DECIMAL(15,6),
    "std_dev" DECIMAL(15,6),
    "defective" INTEGER DEFAULT 0,
    "sampled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "spc_samples_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fmea_worksheets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DESIGN',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fmea_worksheets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fmea_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "worksheet_id" TEXT NOT NULL,
    "process_step" TEXT NOT NULL,
    "failure_mode" TEXT NOT NULL,
    "effect" TEXT NOT NULL,
    "cause" TEXT NOT NULL,
    "current_control" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 1,
    "occurrence" INTEGER NOT NULL DEFAULT 1,
    "detection" INTEGER NOT NULL DEFAULT 1,
    "rpn" INTEGER NOT NULL DEFAULT 0,
    "recommended_action" TEXT,
    "responsible" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fmea_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "apqp_projects" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "start_date" TIMESTAMP(3),
    "target_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apqp_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "apqp_phases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "phase_no" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "apqp_phases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppap_submissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "apqp_project_id" TEXT,
    "level" TEXT NOT NULL DEFAULT 'LEVEL_3',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submission_date" TIMESTAMP(3),
    "customer_id" TEXT,
    "documentsJson" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "submitted_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppap_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tooling_masters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TOOL',
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "location" TEXT,
    "max_life_cycles" INTEGER,
    "current_cycles" INTEGER NOT NULL DEFAULT 0,
    "calibration_frequency_days" INTEGER,
    "last_calibration_date" TIMESTAMP(3),
    "next_calibration_date" TIMESTAMP(3),
    "supplier_id" TEXT,
    "purchase_cost" DECIMAL(15,2),
    "assigned_to" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tooling_masters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tooling_calibrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "calibration_no" TEXT NOT NULL,
    "calibrated_by" TEXT,
    "calibration_date" TIMESTAMP(3) NOT NULL,
    "next_due_date" TIMESTAMP(3),
    "result" TEXT NOT NULL DEFAULT 'PASS',
    "standard" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tooling_calibrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tooling_usage_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tool_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "operation_id" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "cycles_used" INTEGER NOT NULL DEFAULT 0,
    "operator_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tooling_usage_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gage_rr_studies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "part_no" TEXT,
    "characteristic" TEXT,
    "appraisers" INTEGER NOT NULL DEFAULT 3,
    "trials" INTEGER NOT NULL DEFAULT 3,
    "parts" INTEGER NOT NULL DEFAULT 10,
    "tolerance" DECIMAL(15,6),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_gage_rr" DECIMAL(15,6),
    "gage_rr_pct" DECIMAL(8,2),
    "ndc" DECIMAL(8,2),
    "verdict" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gage_rr_studies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gage_rr_samples" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "study_id" TEXT NOT NULL,
    "appraiser" INTEGER NOT NULL,
    "trial" INTEGER NOT NULL,
    "part_no" INTEGER NOT NULL,
    "value" DECIMAL(15,6) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gage_rr_samples_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aps_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'FORWARD',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "horizon_days" INTEGER NOT NULL DEFAULT 30,
    "scheduleJson" JSONB NOT NULL DEFAULT '[]',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aps_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aps_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "workstation_id" TEXT,
    "sequence" INTEGER NOT NULL,
    "duration_min" INTEGER NOT NULL,
    "setup_min" INTEGER NOT NULL DEFAULT 0,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'UNSCHEDULED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aps_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aps_constraints" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CAPACITY',
    "resource_id" TEXT,
    "resource_type" TEXT,
    "max_load" DECIMAL(15,3),
    "priority" INTEGER NOT NULL DEFAULT 50,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aps_constraints_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aps_simulation_scenarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "base_schedule_id" TEXT,
    "whatIfJson" JSONB NOT NULL DEFAULT '{}',
    "result_json" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "aps_simulation_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "energy_meters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "meterType" TEXT NOT NULL DEFAULT 'ELECTRICITY',
    "location" TEXT,
    "workstation_id" TEXT,
    "multiplier" DECIMAL(10,4) NOT NULL DEFAULT 1,
    "unit" TEXT NOT NULL DEFAULT 'kWh',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "energy_meters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "energy_readings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "reading" DECIMAL(15,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kWh',
    "cost" DECIMAL(15,2),
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "recorded_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_readings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "energy_kpi_targets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "meter_id" TEXT,
    "kpi_type" TEXT NOT NULL,
    "target_value" DECIMAL(15,3) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'kWh',
    "period" TEXT NOT NULL DEFAULT 'MONTHLY',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_kpi_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "energy_cost_allocations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "meter_id" TEXT NOT NULL,
    "cost_center_id" TEXT,
    "work_order_id" TEXT,
    "amount" DECIMAL(15,2) NOT NULL,
    "allocation_pct" DECIMAL(5,2) NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "energy_cost_allocations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kanban_boards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "boardType" TEXT NOT NULL DEFAULT 'PRODUCTION',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "columns" JSONB NOT NULL DEFAULT '[]',
    "wip_limits" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_boards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "kanban_cards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "card_no" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "column_name" TEXT NOT NULL,
    "cardType" TEXT NOT NULL DEFAULT 'PRODUCTION',
    "source_stage" TEXT,
    "dest_stage" TEXT,
    "product_id" TEXT,
    "quantity" DECIMAL(15,3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "assigned_to" TEXT,
    "due_date" TIMESTAMP(3),
    "position" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kanban_cards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lean_improvements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PROCESS',
    "ideaType" TEXT NOT NULL DEFAULT 'KAIZEN',
    "benefit" TEXT,
    "estimated_savings" DECIMAL(15,2),
    "actual_savings" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submitted_by" TEXT,
    "implemented_by" TEXT,
    "implemented_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lean_improvements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "waste_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_order_id" TEXT,
    "waste_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" DECIMAL(15,3),
    "impact_cost" DECIMAL(15,2),
    "root_cause" TEXT,
    "action_taken" TEXT,
    "reported_by" TEXT,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waste_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "value_stream_map_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "map_name" TEXT NOT NULL,
    "step_no" INTEGER NOT NULL,
    "step_name" TEXT NOT NULL,
    "stepType" TEXT NOT NULL DEFAULT 'PROCESS',
    "cycle_time_min" DECIMAL(10,2),
    "changeover_min" DECIMAL(10,2),
    "uptime_pct" DECIMAL(5,2),
    "inventory_qty" DECIMAL(15,3),
    "operators" INTEGER,
    "is_value_add" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "value_stream_map_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tpm_pillars" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "pillarType" TEXT NOT NULL DEFAULT 'AUTONOMOUS',
    "description" TEXT,
    "score" DECIMAL(5,2) DEFAULT 0,
    "target_score" DECIMAL(5,2) DEFAULT 100,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tpm_pillars_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tpm_pillar_activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pillar_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "activity_type" TEXT NOT NULL,
    "step_no" INTEGER,
    "score" DECIMAL(5,2),
    "performed_by" TEXT,
    "performed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tpm_pillar_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tpm_audit_5s" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workstation_id" TEXT NOT NULL,
    "auditor_id" TEXT,
    "sort_score" INTEGER NOT NULL DEFAULT 0,
    "set_in_order_score" INTEGER NOT NULL DEFAULT 0,
    "shine_score" INTEGER NOT NULL DEFAULT 0,
    "standardize_score" INTEGER NOT NULL DEFAULT 0,
    "sustain_score" INTEGER NOT NULL DEFAULT 0,
    "total_score" INTEGER NOT NULL DEFAULT 0,
    "max_score" INTEGER NOT NULL DEFAULT 25,
    "status" TEXT NOT NULL DEFAULT 'PASSED',
    "findings" TEXT,
    "action_items" JSONB,
    "audited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tpm_audit_5s_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tpm_kpis" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pillar_id" TEXT,
    "workstation_id" TEXT,
    "kpi_type" TEXT NOT NULL,
    "value" DECIMAL(15,6) NOT NULL,
    "target" DECIMAL(15,6),
    "period" TEXT NOT NULL DEFAULT 'DAILY',
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tpm_kpis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_manufacturers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "contact_person" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "capabilities" JSONB NOT NULL DEFAULT '[]',
    "certifications" JSONB DEFAULT '[]',
    "rating" DECIMAL(3,2),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_approved" BOOLEAN NOT NULL DEFAULT false,
    "approved_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_manufacturers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outsourcing_purchase_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_no" TEXT NOT NULL,
    "contract_mfg_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "order_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expected_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "shipping_terms" TEXT,
    "payment_terms" TEXT,
    "total_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outsourcing_purchase_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outsourcing_po_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "po_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "quantity" DECIMAL(15,3) NOT NULL,
    "unit_price" DECIMAL(15,2) NOT NULL,
    "total_price" DECIMAL(15,2) NOT NULL,
    "received_qty" DECIMAL(15,3) NOT NULL DEFAULT 0,
    "bom_id" TEXT,
    "notes" TEXT,

    CONSTRAINT "outsourcing_po_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subcontracted_receipts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "receipt_no" TEXT NOT NULL,
    "po_id" TEXT NOT NULL,
    "contract_mfg_id" TEXT NOT NULL,
    "received_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "received_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_INSPECTION',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subcontracted_receipts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ddmrp_parts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "lead_time_days" INTEGER NOT NULL,
    "demand_time_fence_days" INTEGER NOT NULL DEFAULT 3,
    "ddmrpType" TEXT NOT NULL DEFAULT 'STOCKED',
    "zone" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ddmrp_parts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ddmrp_buffers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "green_zone" DECIMAL(15,3) NOT NULL,
    "yellow_zone" DECIMAL(15,3) NOT NULL,
    "red_zone" DECIMAL(15,3) NOT NULL,
    "top_of_green" DECIMAL(15,3) NOT NULL,
    "top_of_yellow" DECIMAL(15,3) NOT NULL,
    "top_of_red" DECIMAL(15,3) NOT NULL,
    "current_stock" DECIMAL(15,3) NOT NULL,
    "on_hand" DECIMAL(15,3) NOT NULL,
    "on_order" DECIMAL(15,3) NOT NULL,
    "qualified_demand" DECIMAL(15,3) NOT NULL,
    "net_flow_position" DECIMAL(15,3),
    "zoneStatus" TEXT NOT NULL DEFAULT 'GREEN',
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ddmrp_buffers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ddmrp_net_flow_statuses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "net_flow" DECIMAL(15,3) NOT NULL,
    "on_hand" DECIMAL(15,3) NOT NULL,
    "on_order" DECIMAL(15,3) NOT NULL,
    "qualified_demand" DECIMAL(15,3) NOT NULL,
    "daily_demand_rate" DECIMAL(15,3),
    "order_threshold" DECIMAL(15,3),
    "suggested_order" DECIMAL(15,3),
    "zone" TEXT NOT NULL DEFAULT 'GREEN',
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ddmrp_net_flow_statuses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ddmrp_recommendations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "part_id" TEXT NOT NULL,
    "recommendation" TEXT NOT NULL DEFAULT 'NO_ACTION',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "quantity" DECIMAL(15,3),
    "reason" TEXT,
    "actionType" TEXT,
    "acknowledged" BOOLEAN NOT NULL DEFAULT false,
    "acknowledged_by" TEXT,
    "acknowledged_at" TIMESTAMP(3),
    "target_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ddmrp_recommendations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "form_analytic" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "total_views" INTEGER NOT NULL DEFAULT 0,
    "total_submissions" INTEGER NOT NULL DEFAULT 0,
    "completion_rate" DOUBLE PRECISION,
    "avg_time_to_complete" INTEGER,
    "field_stats" JSONB,
    "daily_stats" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "form_analytic_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_transitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_node_id" TEXT NOT NULL,
    "to_node_id" TEXT NOT NULL,
    "condition" JSONB,
    "label" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_transitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "assignee_id" TEXT,
    "assignee_role" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "due_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "completed_by" TEXT,
    "comments" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_sla_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "node_id" TEXT NOT NULL,
    "sla_limit_hours" INTEGER NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notify_roles" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_sla_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_escalation_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sla_rule_id" TEXT NOT NULL,
    "escalate_after_minutes" INTEGER NOT NULL,
    "escalate_to_role" TEXT NOT NULL,
    "escalate_to_user" TEXT,
    "notifyChannel" TEXT NOT NULL DEFAULT 'EMAIL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_escalation_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "instance_id" TEXT,
    "task_id" TEXT,
    "action" TEXT NOT NULL,
    "actor_id" TEXT,
    "details" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_intent_training_examples" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "intent" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'en',
    "confidence" DOUBLE PRECISION DEFAULT 0,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_intent_training_examples_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_nlu_entities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "training_example_id" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "start_pos" INTEGER,
    "end_pos" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_nlu_entities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_model_accuracy_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_model_accuracy_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_kpi_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "formula" TEXT NOT NULL,
    "target" DOUBLE PRECISION,
    "unit" TEXT,
    "visualization" TEXT NOT NULL DEFAULT 'NUMBER',
    "category" TEXT,
    "sourceTable" TEXT,
    "sourceColumn" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_kpi_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_trend_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kpi_definition_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "previousValue" DOUBLE PRECISION,
    "changePercent" DOUBLE PRECISION,
    "trend" TEXT,
    "metadata" JSONB,
    "computed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_trend_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_cross_filter_dashboards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB NOT NULL DEFAULT '[]',
    "filters" JSONB NOT NULL DEFAULT '[]',
    "widgets" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_cross_filter_dashboards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_bi_metric_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "sourceTable" TEXT NOT NULL,
    "sourceColumn" TEXT NOT NULL,
    "aggregation" TEXT NOT NULL DEFAULT 'SUM',
    "dataType" TEXT NOT NULL DEFAULT 'NUMBER',
    "unit" TEXT,
    "category" TEXT,
    "formula" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_bi_metric_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "drive_folder_shares" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "shared_with_user_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'VIEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "drive_folder_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "drive_file_tags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',

    CONSTRAINT "drive_file_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "drive_file_tag_mappings" (
    "id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,

    CONSTRAINT "drive_file_tag_mappings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "drive_trash_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "deleted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "original_path" TEXT,
    "deleted_by" TEXT NOT NULL,

    CONSTRAINT "drive_trash_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dynamic_discount_offers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "discount_percent" DECIMAL(5,2) NOT NULL,
    "discount_days" INTEGER NOT NULL,
    "offer_amount" DECIMAL(15,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "offered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "responded_at" TIMESTAMP(3),
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dynamic_discount_offers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supply_chain_finance_programs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "program_type" TEXT NOT NULL,
    "funding_limit" DECIMAL(15,2) NOT NULL,
    "utilized_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "interest_rate" DECIMAL(5,2) NOT NULL,
    "fee_structure" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supply_chain_finance_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "close_task_dependencies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "depends_on_task_id" TEXT NOT NULL,
    "dependency_type" TEXT NOT NULL,
    "lag_days" INTEGER NOT NULL DEFAULT 0,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "close_task_dependencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "close_task_slas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "task_id" TEXT NOT NULL,
    "deadline_at" TIMESTAMP(3) NOT NULL,
    "sla_minutes" INTEGER NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "escalate_after" INTEGER NOT NULL DEFAULT 30,
    "escalation_level" INTEGER NOT NULL DEFAULT 1,
    "breached_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "close_task_slas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "close_calendar_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_at" TIMESTAMP(3) NOT NULL,
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "close_calendar_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "close_escalation_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "condition_field" TEXT NOT NULL,
    "condition_operator" TEXT NOT NULL,
    "condition_value" TEXT NOT NULL,
    "escalate_to_role" TEXT,
    "escalate_to_user" TEXT,
    "notify_method" TEXT NOT NULL DEFAULT 'EMAIL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "close_escalation_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "close_analytics_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "total_tasks" INTEGER NOT NULL,
    "completed_tasks" INTEGER NOT NULL,
    "overdue_tasks" INTEGER NOT NULL,
    "breached_slas" INTEGER NOT NULL,
    "avg_completion" DECIMAL(5,2),
    "cycle_time_hours" DECIMAL(10,2),
    "snapshot_data" JSONB,
    "captured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "close_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consolidation_groups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "group_type" TEXT NOT NULL,
    "base_currency" TEXT NOT NULL,
    "consolidation_method" TEXT NOT NULL,
    "ownership_threshold" DECIMAL(5,2) NOT NULL DEFAULT 50,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidation_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consolidation_group_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "ownership_percent" DECIMAL(5,2) NOT NULL,
    "consolidation_method" TEXT NOT NULL,
    "functional_currency" TEXT NOT NULL,
    "is_direct_subsidiary" BOOLEAN NOT NULL DEFAULT true,
    "consolidation_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidation_group_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consolidation_executions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "period_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "total_eliminations" INTEGER NOT NULL DEFAULT 0,
    "minority_interest" DECIMAL(15,2),
    "translation_adjustment" DECIMAL(15,2),
    "consolidated_revenue" DECIMAL(15,2),
    "consolidated_net_income" DECIMAL(15,2),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "reviewed_by" TEXT,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidation_executions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consolidation_elimination_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "rule_type" TEXT NOT NULL,
    "source_entity_id" TEXT,
    "target_entity_id" TEXT,
    "match_criteria" JSONB NOT NULL,
    "auto_post" BOOLEAN NOT NULL DEFAULT false,
    "tolerance_amount" DECIMAL(15,2),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidation_elimination_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consolidation_elimination_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "source_entity_id" TEXT,
    "target_entity_id" TEXT,
    "account_id" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "entry_type" TEXT NOT NULL,
    "elimination_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "consolidation_elimination_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "consolidation_translation_adjustments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "original_amount" DECIMAL(15,2) NOT NULL,
    "translated_amount" DECIMAL(15,2) NOT NULL,
    "exchange_rate" DECIMAL(12,6) NOT NULL,
    "translation_method" TEXT NOT NULL,
    "adjustment_amount" DECIMAL(15,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "consolidation_translation_adjustments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "minority_interest_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "nci_percentage" DECIMAL(5,2) NOT NULL,
    "net_income_share" DECIMAL(15,2) NOT NULL,
    "equity_share" DECIMAL(15,2) NOT NULL,
    "dividend_share" DECIMAL(15,2),
    "goodwill_amount" DECIMAL(15,2),
    "attribution_type" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "minority_interest_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_credit_scorecards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "score_range_min" INTEGER NOT NULL,
    "score_range_max" INTEGER NOT NULL,
    "weight_payment_history" DECIMAL(5,2) NOT NULL,
    "weight_credit_utilization" DECIMAL(5,2) NOT NULL,
    "weight_invoice_aging" DECIMAL(5,2) NOT NULL,
    "weight_order_frequency" DECIMAL(5,2) NOT NULL,
    "weight_company_health" DECIMAL(5,2) NOT NULL,
    "risk_rating_low" TEXT NOT NULL,
    "risk_rating_medium" TEXT NOT NULL,
    "risk_rating_high" TEXT NOT NULL,
    "risk_rating_critical" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_credit_scorecards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_credit_scores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "scorecard_id" TEXT NOT NULL,
    "overall_score" INTEGER NOT NULL,
    "risk_rating" TEXT NOT NULL,
    "payment_score" DECIMAL(5,2),
    "utilization_score" DECIMAL(5,2),
    "aging_score" DECIMAL(5,2),
    "frequency_score" DECIMAL(5,2),
    "health_score" DECIMAL(5,2),
    "recommended_limit" DECIMAL(15,2),
    "scored_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "customer_credit_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "vendor_risk_assessments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "vendor_id" TEXT NOT NULL,
    "assessment_type" TEXT NOT NULL,
    "risk_score" DECIMAL(5,2) NOT NULL,
    "risk_rating" TEXT NOT NULL,
    "assessment_data" JSONB,
    "assessor_id" TEXT,
    "assessed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "next_review_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_risk_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "market_risk_exposures" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "risk_type" TEXT NOT NULL,
    "exposure_amount" DECIMAL(15,2) NOT NULL,
    "currency" TEXT NOT NULL,
    "instrument_type" TEXT,
    "counterparty" TEXT,
    "maturity_date" TIMESTAMP(3),
    "hedging_strategy" TEXT,
    "fair_value" DECIMAL(15,2),
    "valuation_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "market_risk_exposures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "operational_risk_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "description" TEXT NOT NULL,
    "loss_amount" DECIMAL(15,2),
    "recovery_amount" DECIMAL(15,2),
    "root_cause" TEXT,
    "control_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "occurred_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "operational_risk_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "risk_control_measures" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "control_type" TEXT NOT NULL,
    "risk_category" TEXT NOT NULL,
    "description" TEXT,
    "control_owner" TEXT,
    "test_frequency" TEXT NOT NULL DEFAULT 'QUARTERLY',
    "last_tested_at" TIMESTAMP(3),
    "effectiveness" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "risk_control_measures_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "emission_source_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_name" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "category" TEXT,
    "fuel_type" TEXT,
    "quantity" DECIMAL(15,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "emission_factor" DECIMAL(10,6) NOT NULL,
    "co2e_kg" DECIMAL(15,4) NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "period" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emission_source_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "emission_offset_credits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "credit_type" TEXT NOT NULL,
    "quantity_tonnes" DECIMAL(10,2) NOT NULL,
    "credit_price" DECIMAL(10,2) NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "vintage_year" INTEGER NOT NULL,
    "registry_id" TEXT,
    "project_name" TEXT,
    "status" TEXT NOT NULL DEFAULT 'AVAILABLE',
    "retired_at" TIMESTAMP(3),
    "retirement_reason" TEXT,
    "purchased_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "emission_offset_credits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_kpi_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kpi_code" TEXT NOT NULL,
    "kpi_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sub_category" TEXT,
    "unit" TEXT NOT NULL,
    "description" TEXT,
    "calculation_method" TEXT,
    "target_direction" TEXT NOT NULL DEFAULT 'HIGHER_IS_BETTER',
    "reporting_framework" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esg_kpi_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_kpi_actual_values" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "kpi_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "period" TEXT,
    "actual_value" DECIMAL(15,4) NOT NULL,
    "target_value" DECIMAL(15,4),
    "variance" DECIMAL(15,4),
    "variance_percent" DECIMAL(5,2),
    "data_source" TEXT,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "verified_by" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esg_kpi_actual_values_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_report_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_name" TEXT NOT NULL,
    "reporting_framework" TEXT NOT NULL,
    "template_config" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "last_generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esg_report_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "esg_disclosure_mappings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "framework" TEXT NOT NULL,
    "standard_code" TEXT NOT NULL,
    "disclosure_name" TEXT NOT NULL,
    "mapped_kpi_id" TEXT,
    "mapped_field" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "esg_disclosure_mappings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sustainability_targets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "target_name" TEXT NOT NULL,
    "target_type" TEXT NOT NULL,
    "baseline_year" INTEGER NOT NULL,
    "baseline_value" DECIMAL(15,4) NOT NULL,
    "target_value" DECIMAL(15,4) NOT NULL,
    "target_year" INTEGER NOT NULL,
    "current_value" DECIMAL(15,4),
    "progress_percent" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'ON_TRACK',
    "target_unit" TEXT NOT NULL,
    "approved_by" TEXT,
    "achieved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sustainability_targets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tax_provision_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "period" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "effective_tax_rate" DECIMAL(5,2),
    "current_tax_expense" DECIMAL(15,2),
    "deferred_tax_expense" DECIMAL(15,2),
    "total_tax_provision" DECIMAL(15,2),
    "pretax_income" DECIMAL(15,2),
    "statutory_rate" DECIMAL(5,2),
    "reviewed_by" TEXT,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_provision_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "tax_provision_details" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "taxable_income" DECIMAL(15,2) NOT NULL,
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "current_tax_amount" DECIMAL(15,2) NOT NULL,
    "credits" DECIMAL(15,2) DEFAULT 0,
    "payments" DECIMAL(15,2) DEFAULT 0,
    "withholding" DECIMAL(15,2) DEFAULT 0,
    "net_tax_payable" DECIMAL(15,2),
    "temporary_differences" JSONB,
    "filingStatus" TEXT NOT NULL DEFAULT 'ESTIMATED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tax_provision_details_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deferred_tax_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "account_id" TEXT NOT NULL,
    "temporary_difference" DECIMAL(15,2) NOT NULL,
    "deferred_tax_asset" DECIMAL(15,2),
    "deferred_tax_liability" DECIMAL(15,2),
    "tax_rate" DECIMAL(5,2) NOT NULL,
    "reversal_year" INTEGER,
    "reversal_type" TEXT,
    "categorization" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deferred_tax_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "uncertain_tax_positions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "position_name" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "tax_amount_at_risk" DECIMAL(15,2) NOT NULL,
    "probability_of_loss" DECIMAL(5,2) NOT NULL,
    "expected_loss_amount" DECIMAL(15,2),
    "reserve_amount" DECIMAL(15,2),
    "status" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "evaluation_date" TIMESTAMP(3),
    "settlement_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "uncertain_tax_positions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "valuation_allowance_assessments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "deferred_tax_asset_id" TEXT,
    "allowance_amount" DECIMAL(15,2) NOT NULL,
    "assessment_type" TEXT NOT NULL,
    "positive_evidence" JSONB,
    "negative_evidence" JSONB,
    "conclusion" TEXT,
    "reviewer_id" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "valuation_allowance_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "approval_routing_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_event" TEXT NOT NULL,
    "condition_field" TEXT NOT NULL,
    "condition_operator" TEXT NOT NULL,
    "condition_value" TEXT NOT NULL,
    "approver_id" TEXT,
    "approver_role" TEXT,
    "chain_id" TEXT,
    "fallback_approver" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "approval_routing_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_forecast_scenarios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "scenario_name" TEXT NOT NULL,
    "scenario_type" TEXT NOT NULL,
    "forecast_horizon" TEXT NOT NULL,
    "base_currency" TEXT NOT NULL DEFAULT 'USD',
    "assumptions" JSONB,
    "confidence_level" DECIMAL(5,2),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "generated_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_forecast_scenarios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ai_forecast_scenario_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "scenario_id" TEXT NOT NULL,
    "period_date" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "sub_category" TEXT,
    "projected_amount" DECIMAL(15,2) NOT NULL,
    "actual_amount" DECIMAL(15,2),
    "variance_amount" DECIMAL(15,2),
    "variance_percent" DECIMAL(5,2),
    "driver_variable" TEXT,
    "driver_value" DECIMAL(15,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_forecast_scenario_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "anomaly_detection_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_name" TEXT NOT NULL,
    "detection_scope" TEXT NOT NULL,
    "algorithm_type" TEXT NOT NULL,
    "date_range_start" TIMESTAMP(3) NOT NULL,
    "date_range_end" TIMESTAMP(3) NOT NULL,
    "total_scanned" INTEGER NOT NULL DEFAULT 0,
    "anomalies_found" INTEGER NOT NULL DEFAULT 0,
    "false_positives" INTEGER NOT NULL DEFAULT 0,
    "sensitivity" DECIMAL(3,1) NOT NULL DEFAULT 2.0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anomaly_detection_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "anomaly_detection_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "anomaly_type" TEXT NOT NULL,
    "anomaly_score" DECIMAL(5,2) NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "suggested_action" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "anomaly_detection_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "smart_gl_coding_suggestions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "source_id" TEXT,
    "description" TEXT NOT NULL,
    "suggested_account_id" TEXT NOT NULL,
    "suggested_cost_center" TEXT,
    "confidence_score" DECIMAL(5,2) NOT NULL,
    "reasoning" TEXT,
    "was_accepted" BOOLEAN,
    "accepted_by" TEXT,
    "accepted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smart_gl_coding_suggestions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pricing_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ruleType" TEXT NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "appliedTo" TEXT NOT NULL DEFAULT 'PRODUCT',
    "target_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pricing_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "subtotal" DECIMAL(15,2) NOT NULL,
    "total_discount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "grandTotal" DECIMAL(15,2) NOT NULL,
    "created_by" TEXT NOT NULL,
    "change_note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quote_margins" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "quotation_id" TEXT NOT NULL,
    "total_cost" DECIMAL(15,2) NOT NULL,
    "total_price" DECIMAL(15,2) NOT NULL,
    "margin_amount" DECIMAL(15,2) NOT NULL,
    "margin_pct" DECIMAL(5,2) NOT NULL,
    "cost_breakdown" JSONB,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quote_margins_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "discount_approval_matrix" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "min_discount" DECIMAL(5,2) NOT NULL,
    "max_discount" DECIMAL(5,2) NOT NULL,
    "min_amount" DECIMAL(15,2),
    "max_amount" DECIMAL(15,2),
    "approver_role" TEXT NOT NULL,
    "approval_level" INTEGER NOT NULL DEFAULT 1,
    "requires_ceo" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "discount_approval_matrix_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "territory_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "fiscal_year" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "territory_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "territory_plan_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "territory_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "allocation" DECIMAL(5,2) NOT NULL DEFAULT 100.0,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "territory_plan_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "territory_rebalance_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "previous_json" JSONB NOT NULL,
    "new_json" JSONB NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'BALANCED',
    "summary" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "territory_rebalance_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "named_accounts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'STANDARD',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "target_revenue" DECIMAL(15,2),
    "strategy" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "named_accounts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "system_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TABLE',
    "config" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_template_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contract_template_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot" JSONB NOT NULL,
    "change_summary" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "contract_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_obligations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "contract_obligations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "contract_compliance_status" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT NOT NULL,
    "overall_compliance" INTEGER NOT NULL DEFAULT 100,
    "sla_met" INTEGER NOT NULL DEFAULT 0,
    "sla_missed" INTEGER NOT NULL DEFAULT 0,
    "last_audit_date" TIMESTAMP(3),
    "findings" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contract_compliance_status_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "social_media_posts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media_url" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "published_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "analytics" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "social_media_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "communication_opt_outs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "reason" TEXT,
    "opted_out_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "communication_opt_outs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "communication_preferences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "email" BOOLEAN NOT NULL DEFAULT true,
    "sms" BOOLEAN NOT NULL DEFAULT true,
    "whatsapp" BOOLEAN NOT NULL DEFAULT true,
    "push" BOOLEAN NOT NULL DEFAULT true,
    "marketing" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "communication_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipment_emissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shipment_id" TEXT,
    "transport_mode" TEXT NOT NULL,
    "distance_km" DECIMAL(15,4) NOT NULL,
    "weight_kg" DECIMAL(15,4) NOT NULL,
    "emission_factor" DECIMAL(10,6) NOT NULL,
    "emissions_kg" DECIMAL(15,4) NOT NULL,
    "emissions_tons" DECIMAL(10,4) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipment_emissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "carbon_offsets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "offset_type" TEXT NOT NULL,
    "quantity_tons" DECIMAL(15,4) NOT NULL,
    "cost" DECIMAL(15,2) NOT NULL,
    "supplier_name" TEXT NOT NULL,
    "project_name" TEXT,
    "certification" TEXT,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carbon_offsets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER,
    "shared_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SHARED',
    "shared_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "po_collaborations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "purchase_order_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "proposed_changes" JSONB,
    "attachment_url" TEXT,
    "created_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "response" TEXT,
    "responded_by" TEXT,
    "responded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "po_collaborations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "letters_of_credit" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lc_number" TEXT NOT NULL,
    "lc_type" TEXT NOT NULL DEFAULT 'DOCUMENTARY',
    "issuing_bank" TEXT,
    "beneficiary_id" TEXT,
    "applicant_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(19,4) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "place_of_expiry" TEXT,
    "incoterms" TEXT,
    "port_of_loading" TEXT,
    "port_of_discharge" TEXT,
    "description" TEXT,
    "special_conditions" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "presentation_days" INTEGER,
    "is_transferable" BOOLEAN NOT NULL DEFAULT false,
    "is_revocable" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "letters_of_credit_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lc_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lc_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "document_title" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "copies" INTEGER NOT NULL DEFAULT 1,
    "original_copies" INTEGER NOT NULL DEFAULT 0,
    "conditions" TEXT,
    "url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "submitted_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lc_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lc_amendments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lc_id" TEXT NOT NULL,
    "amendment_no" INTEGER NOT NULL,
    "description" TEXT NOT NULL,
    "changes" JSONB,
    "requested_by" TEXT,
    "approved_by" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lc_amendments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "lc_presentations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lc_id" TEXT NOT NULL,
    "presented_date" TIMESTAMP(3) NOT NULL,
    "documentary_credit" DECIMAL(19,4),
    "discrepancies" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PRESENTED',
    "accepted_at" TIMESTAMP(3),
    "rejected_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "paid_at" TIMESTAMP(3),
    "payment_amount" DECIMAL(19,4),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lc_presentations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "bank_guarantees" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "guarantee_number" TEXT NOT NULL,
    "guarantee_type" TEXT NOT NULL DEFAULT 'PERFORMANCE',
    "issuing_bank" TEXT,
    "beneficiary_id" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "amount" DECIMAL(19,4) NOT NULL,
    "expiry_date" TIMESTAMP(3),
    "purpose" TEXT,
    "contract_reference" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "claimed_amount" DECIMAL(19,4),
    "claimed_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bank_guarantees_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sop_cycles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNING',
    "facilitator" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sop_cycles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sop_demand_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sop_cycle_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_group" TEXT,
    "region" TEXT,
    "channel" TEXT,
    "forecast_units" DOUBLE PRECISION NOT NULL,
    "forecast_value" DECIMAL(19,4),
    "baseline_forecast" DOUBLE PRECISION,
    "market_intelligence" DOUBLE PRECISION,
    "sales_adjustment" DOUBLE PRECISION,
    "final_forecast" DOUBLE PRECISION,
    "confidence" DOUBLE PRECISION,
    "notes" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sop_demand_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sop_supply_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sop_cycle_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_group" TEXT,
    "plant_id" TEXT,
    "planned_production" DOUBLE PRECISION NOT NULL,
    "available_capacity" DOUBLE PRECISION,
    "constrained_capacity" DOUBLE PRECISION,
    "inventory_target" DECIMAL(19,4),
    "opening_stock" DOUBLE PRECISION,
    "closing_stock" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sop_supply_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sop_consensus_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sop_cycle_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_group" TEXT,
    "consensus_forecast" DOUBLE PRECISION NOT NULL,
    "revenue_plan" DECIMAL(19,4),
    "margin_plan" DECIMAL(19,4),
    "assumptions" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sop_consensus_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "logistics_providers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider_type" TEXT NOT NULL DEFAULT '3PL',
    "contact_name" TEXT,
    "contact_email" TEXT,
    "contact_phone" TEXT,
    "website" TEXT,
    "address" JSONB,
    "services" JSONB,
    "geographies" JSONB,
    "certifications" JSONB,
    "rating" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "contract_start" TIMESTAMP(3),
    "contract_end" TIMESTAMP(3),
    "contract_value" DECIMAL(19,4),
    "currency" TEXT DEFAULT 'USD',
    "billing_model" TEXT,
    "performance_sla" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "logistics_providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "logistics_provider_invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "invoice_no" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "due_date" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "line_items" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logistics_provider_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "logistics_provider_performance" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "otif_rate" DOUBLE PRECISION,
    "on_time_rate" DOUBLE PRECISION,
    "in_full_rate" DOUBLE PRECISION,
    "damage_rate" DOUBLE PRECISION,
    "cost_variance" DOUBLE PRECISION,
    "response_time" DOUBLE PRECISION,
    "claims_rate" DOUBLE PRECISION,
    "overall_score" DOUBLE PRECISION,
    "notes" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "logistics_provider_performance_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cold_chain_shipments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shipment_ref" TEXT NOT NULL,
    "product_id" TEXT,
    "origin" TEXT,
    "destination" TEXT,
    "required_temp_min" DOUBLE PRECISION,
    "required_temp_max" DOUBLE PRECISION,
    "humidity" DOUBLE PRECISION,
    "packaging_type" TEXT,
    "cooling_method" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "departed_at" TIMESTAMP(3),
    "arrived_at" TIMESTAMP(3),
    "total_excursions" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cold_chain_shipments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cold_chain_temperature_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "temperature" DOUBLE PRECISION NOT NULL,
    "humidity" DOUBLE PRECISION,
    "location" TEXT,
    "device_id" TEXT,
    "recorded_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cold_chain_temperature_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cold_chain_excursions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "shipment_id" TEXT NOT NULL,
    "excursion_type" TEXT NOT NULL,
    "detected_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "duration" INTEGER,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "max_deviation" DOUBLE PRECISION,
    "location" TEXT,
    "action" TEXT,
    "disposition_decision" TEXT,
    "approved_by" TEXT,

    CONSTRAINT "cold_chain_excursions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scem_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "alert_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "source" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT,
    "root_cause" TEXT,
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "escalated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scem_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scem_alert_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "entity_type" TEXT NOT NULL,
    "trigger_field" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "notify_users" JSONB,
    "notify_channels" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scem_alert_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supply_chain_risk_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "risk_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "affected_regions" JSONB,
    "affected_products" JSONB,
    "affected_suppliers" JSONB,
    "probability" DOUBLE PRECISION,
    "impact" DOUBLE PRECISION,
    "risk_score" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "mitigation" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    "source" TEXT,

    CONSTRAINT "supply_chain_risk_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scm_risk_mitigations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "risk_event_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "assigned_to" TEXT,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "cost" DECIMAL(19,4),
    "effectiveness" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scm_risk_mitigations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "trade_compliance_checks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "check_type" TEXT NOT NULL,
    "list_type" TEXT,
    "result" TEXT NOT NULL,
    "match_score" DOUBLE PRECISION,
    "matched_entry" JSONB,
    "override_reason" TEXT,
    "override_by" TEXT,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "trade_compliance_checks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "denied_party_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "list_name" TEXT NOT NULL,
    "list_source" TEXT NOT NULL,
    "entity_name" TEXT NOT NULL,
    "entity_type" TEXT,
    "country" TEXT,
    "aliases" JSONB,
    "reason" TEXT,
    "list_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "denied_party_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "export_licenses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "license_number" TEXT NOT NULL,
    "license_type" TEXT NOT NULL,
    "issuing_authority" TEXT NOT NULL,
    "applicant_id" TEXT,
    "destination_country" TEXT,
    "product_category" TEXT,
    "eccn_number" TEXT,
    "end_user" TEXT,
    "end_use" TEXT,
    "approved_value" DECIMAL(19,4),
    "used_value" DECIMAL(19,4),
    "issue_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "conditions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "export_licenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hs_code_classifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT NOT NULL,
    "hs_code" TEXT NOT NULL,
    "description" TEXT,
    "country" TEXT,
    "tariff_rate" DOUBLE PRECISION,
    "vat_rate" DOUBLE PRECISION,
    "restrictions" JSONB,
    "classified_by" TEXT,
    "classified_at" TIMESTAMP(3),
    "valid_from" TIMESTAMP(3),
    "valid_until" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hs_code_classifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "multimodal_transport_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_number" TEXT NOT NULL,
    "order_type" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "primary_mode" TEXT NOT NULL DEFAULT 'ROAD',
    "cargo_type" TEXT,
    "weight" DOUBLE PRECISION,
    "volume" DOUBLE PRECISION,
    "pieces" INTEGER,
    "hazmat" BOOLEAN NOT NULL DEFAULT false,
    "pickup_date" TIMESTAMP(3),
    "delivery_date" TIMESTAMP(3),
    "actual_pickup" TIMESTAMP(3),
    "actual_delivery" TIMESTAMP(3),
    "carrier_id" TEXT,
    "cost" DECIMAL(19,4),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "special_instructions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "multimodal_transport_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "multimodal_transport_legs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transport_order_id" TEXT NOT NULL,
    "leg_number" INTEGER NOT NULL,
    "mode" TEXT NOT NULL,
    "origin" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "carrier_name" TEXT,
    "flight_voyage_no" TEXT,
    "departure_plan" TIMESTAMP(3),
    "arrival_plan" TIMESTAMP(3),
    "departure_actual" TIMESTAMP(3),
    "arrival_actual" TIMESTAMP(3),
    "cost" DECIMAL(19,4),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',

    CONSTRAINT "multimodal_transport_legs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "multimodal_transport_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transport_order_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "location" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "description" TEXT,
    "source" TEXT,

    CONSTRAINT "multimodal_transport_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reverse_logistics_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "return_number" TEXT NOT NULL,
    "return_type" TEXT NOT NULL,
    "customer_id" TEXT,
    "supplier_id" TEXT,
    "original_order_id" TEXT,
    "reason" TEXT,
    "return_method" TEXT,
    "pickup_address" JSONB,
    "return_address" JSONB,
    "expected_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "credit_amount" DECIMAL(19,4),
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "disposition" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reverse_logistics_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reverse_logistics_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "return_order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "product_name" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "returned_qty" DOUBLE PRECISION,
    "unit_cost" DECIMAL(19,4),
    "condition" TEXT,
    "disposition" TEXT,
    "refurbishment_cost" DECIMAL(19,4),

    CONSTRAINT "reverse_logistics_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_zones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "geo_boundary" JSONB,
    "postal_codes" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "max_weight" DOUBLE PRECISION,
    "base_rate" DECIMAL(19,4),
    "rate_per_km" DECIMAL(19,4),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "delivery_zones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "delivery_time_slots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "zone_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "booked" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "delivery_time_slots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "last_mile_deliveries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "delivery_number" TEXT NOT NULL,
    "order_id" TEXT,
    "customer_id" TEXT,
    "zone_id" TEXT,
    "slot_id" TEXT,
    "delivery_address" JSONB NOT NULL,
    "driver_id" TEXT,
    "scheduled_date" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "proof_of_delivery" JSONB,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "feedback" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "last_mile_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scm_iot_devices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "warehouse_id" TEXT,
    "product_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_seen_at" TIMESTAMP(3),
    "battery_level" DOUBLE PRECISION,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scm_iot_devices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scm_iot_readings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "reading_type" TEXT NOT NULL,
    "value" DECIMAL(19,4) NOT NULL,
    "unit" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scm_iot_readings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "smart_replenishment_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "warehouse_id" TEXT,
    "triggered_by" TEXT NOT NULL,
    "current_stock" DOUBLE PRECISION NOT NULL,
    "reorder_point" DOUBLE PRECISION NOT NULL,
    "suggested_qty" DOUBLE PRECISION NOT NULL,
    "supplier_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUGGESTED',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "po_id" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "smart_replenishment_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dynamic_discount_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "original_amount" DECIMAL(19,4) NOT NULL,
    "due_date" TIMESTAMP(3) NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "discount_rate" DOUBLE PRECISION NOT NULL,
    "discount_amount" DECIMAL(19,4) NOT NULL,
    "net_amount" DECIMAL(19,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'OFFERED',
    "accepted_at" TIMESTAMP(3),
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dynamic_discount_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scm_financing_facilities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "facility_name" TEXT NOT NULL,
    "facility_type" TEXT NOT NULL,
    "financier" TEXT,
    "credit_limit" DECIMAL(19,4) NOT NULL,
    "available_limit" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "interest_rate" DOUBLE PRECISION,
    "maturity_days" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scm_financing_facilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scm_financing_drawdowns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "purpose" TEXT,
    "reference_id" TEXT,
    "drawn_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "repaid_at" TIMESTAMP(3),
    "interest" DECIMAL(19,4),
    "status" TEXT NOT NULL DEFAULT 'OUTSTANDING',

    CONSTRAINT "scm_financing_drawdowns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_development_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "objectives" TEXT,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget" DECIMAL(19,4),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "progress_pct" DOUBLE PRECISION,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "supplier_development_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_dev_milestones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "assigned_to" TEXT,

    CONSTRAINT "supplier_dev_milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_dev_surveys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "plan_id" TEXT,
    "survey_title" TEXT NOT NULL,
    "survey_type" TEXT NOT NULL,
    "questions" JSONB,
    "responses" JSONB,
    "score" DOUBLE PRECISION,
    "sent_at" TIMESTAMP(3),
    "responded_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_dev_surveys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "port_terminals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "terminal_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT,
    "city" TEXT,
    "port_type" TEXT NOT NULL DEFAULT 'SEA',
    "berths" INTEGER,
    "storage_area" DOUBLE PRECISION,
    "handling_capacity" DOUBLE PRECISION,
    "crane_count" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "port_terminals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "berth_slots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "terminal_id" TEXT NOT NULL,
    "berth_number" TEXT NOT NULL,
    "vessel_name" TEXT,
    "voyage_number" TEXT,
    "arrival_plan" TIMESTAMP(3),
    "departure_plan" TIMESTAMP(3),
    "arrival_actual" TIMESTAMP(3),
    "departure_actual" TIMESTAMP(3),
    "cargo" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',

    CONSTRAINT "berth_slots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scm_kpi_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "otif_rate" DOUBLE PRECISION,
    "on_time_delivery" DOUBLE PRECISION,
    "in_full_delivery" DOUBLE PRECISION,
    "fill_rate" DOUBLE PRECISION,
    "order_cycle_time" DOUBLE PRECISION,
    "perfect_order_rate" DOUBLE PRECISION,
    "return_rate" DOUBLE PRECISION,
    "inventory_turns" DOUBLE PRECISION,
    "days_inventory" DOUBLE PRECISION,
    "supplier_lead_time" DOUBLE PRECISION,
    "transport_cost_pct" DOUBLE PRECISION,
    "co2_per_shipment" DOUBLE PRECISION,
    "snapshot_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "scm_kpi_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_portal_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "supplier_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "last_active_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_portal_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "supplier_announcements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "target_suppliers" JSONB,
    "published_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "supplier_announcements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "master_production_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "planning_horizon" INTEGER NOT NULL,
    "planning_unit" TEXT NOT NULL DEFAULT 'WEEKS',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "frozen_period" INTEGER,
    "demand_source" TEXT NOT NULL DEFAULT 'SALES_ORDERS',
    "safety_stock_days" INTEGER,
    "created_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "master_production_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mps_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "mps_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "forecast_demand" DOUBLE PRECISION NOT NULL,
    "actual_demand" DOUBLE PRECISION,
    "open_orders" DOUBLE PRECISION,
    "planned_prod" DOUBLE PRECISION,
    "projected_inventory" DOUBLE PRECISION,
    "available_to_promise" DOUBLE PRECISION,

    CONSTRAINT "mps_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fmea_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fmea_type" TEXT NOT NULL DEFAULT 'DFMEA',
    "product_id" TEXT,
    "process_id" TEXT,
    "title" TEXT NOT NULL,
    "scope" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "revision_date" TIMESTAMP(3),
    "created_by" TEXT,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fmea_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fmea_modes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "fmea_id" TEXT NOT NULL,
    "process_step" TEXT NOT NULL,
    "failure_mode" TEXT NOT NULL,
    "failure_effect" TEXT NOT NULL,
    "failure_cause" TEXT NOT NULL,
    "severity" INTEGER NOT NULL DEFAULT 5,
    "occurrence" INTEGER NOT NULL DEFAULT 5,
    "detection" INTEGER NOT NULL DEFAULT 5,
    "rpn" INTEGER NOT NULL DEFAULT 0,
    "current_controls" TEXT,
    "recommended_actions" TEXT,
    "responsible_person" TEXT,
    "target_date" TIMESTAMP(3),
    "completed_actions" TEXT,
    "new_rpn" INTEGER,

    CONSTRAINT "fmea_modes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "aql_sampling_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "standard" TEXT NOT NULL DEFAULT 'ANSI/ASQ Z1.4',
    "aql_level" DOUBLE PRECISION NOT NULL,
    "inspection_level" TEXT NOT NULL DEFAULT 'GENERAL_II',
    "lot_size_min" INTEGER NOT NULL,
    "lot_size_max" INTEGER,
    "sample_size" INTEGER NOT NULL,
    "accept_number" INTEGER NOT NULL,
    "reject_number" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aql_sampling_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "job_cost_sheets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "product_id" TEXT,
    "planned_material_cost" DECIMAL(19,4),
    "planned_labor_cost" DECIMAL(19,4),
    "planned_overhead_cost" DECIMAL(19,4),
    "actual_material_cost" DECIMAL(19,4),
    "actual_labor_cost" DECIMAL(19,4),
    "actual_overhead_cost" DECIMAL(19,4),
    "scrap_cost" DECIMAL(19,4),
    "rework_cost" DECIMAL(19,4),
    "total_planned_cost" DECIMAL(19,4),
    "total_actual_cost" DECIMAL(19,4),
    "variance_pct" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_cost_sheets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "standard_costs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "effective_from" TIMESTAMP(3) NOT NULL,
    "effective_to" TIMESTAMP(3),
    "material_cost" DECIMAL(19,4) NOT NULL,
    "labor_cost" DECIMAL(19,4) NOT NULL,
    "overhead_cost" DECIMAL(19,4) NOT NULL,
    "total_cost" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "standard_costs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "formula_ingredients" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "formula_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "ingredient_type" TEXT NOT NULL DEFAULT 'RAW_MATERIAL',
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "scrap_factor" DOUBLE PRECISION,
    "is_optional" BOOLEAN NOT NULL DEFAULT false,
    "substitutes" JSONB,

    CONSTRAINT "formula_ingredients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "co_products" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "formula_id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "product_type" TEXT NOT NULL DEFAULT 'CO_PRODUCT',
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "value_factor" DOUBLE PRECISION,

    CONSTRAINT "co_products_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "manufacturing_machines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "machine_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "machine_type" TEXT NOT NULL,
    "manufacturer" TEXT,
    "model" TEXT,
    "serial_number" TEXT,
    "workstation_id" TEXT,
    "purchase_date" TIMESTAMP(3),
    "install_date" TIMESTAMP(3),
    "warranty_expiry" TIMESTAMP(3),
    "asset_value" DECIMAL(19,4),
    "nominal_capacity" DOUBLE PRECISION,
    "capacity_unit" TEXT,
    "cycle_time" DOUBLE PRECISION,
    "setup_time" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "oee_target" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "manufacturing_machines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "machine_oee_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "shift" TEXT,
    "record_date" TIMESTAMP(3) NOT NULL,
    "planned_run_time" DOUBLE PRECISION NOT NULL,
    "actual_run_time" DOUBLE PRECISION NOT NULL,
    "downtime" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "planned_units" DOUBLE PRECISION NOT NULL,
    "actual_units" DOUBLE PRECISION NOT NULL,
    "good_units" DOUBLE PRECISION NOT NULL,
    "defects" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "availability" DOUBLE PRECISION,
    "performance" DOUBLE PRECISION,
    "quality" DOUBLE PRECISION,
    "oee" DOUBLE PRECISION,

    CONSTRAINT "machine_oee_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "machine_maintenance_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "maintenance_type" TEXT NOT NULL,
    "description" TEXT,
    "technician" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "parts_used" JSONB,
    "cost" DECIMAL(19,4),
    "result" TEXT,
    "next_scheduled" TIMESTAMP(3),

    CONSTRAINT "machine_maintenance_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "machine_downtime" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "downtime_code" TEXT,
    "category" TEXT NOT NULL,
    "cause" TEXT,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "impact" TEXT NOT NULL DEFAULT 'PRODUCTION_STOP',
    "reported_by" TEXT,
    "resolved_by" TEXT,

    CONSTRAINT "machine_downtime_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "maintenance_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "machine_id" TEXT NOT NULL,
    "maintenance_type" TEXT NOT NULL DEFAULT 'PREVENTIVE',
    "frequency" TEXT NOT NULL,
    "interval_days" INTEGER,
    "last_done" TIMESTAMP(3),
    "next_due" TIMESTAMP(3),
    "checklist" JSONB,
    "estimated_duration" DOUBLE PRECISION,
    "required_parts" JSONB,
    "technician" TEXT,
    "instructions" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "spare_parts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "part_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "machine_types" JSONB,
    "location" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "reorder_point" DOUBLE PRECISION,
    "unit_cost" DECIMAL(19,4),
    "supplier_id" TEXT,
    "lead_time_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "spare_parts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "six_sigma_projects" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_code" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'DEFINE',
    "belt" TEXT,
    "champion" TEXT,
    "blackBelt" TEXT,
    "greenBelt" TEXT,
    "processOwner" TEXT,
    "problem_statement" TEXT,
    "goal_statement" TEXT,
    "scope" TEXT,
    "expected_benefit" DECIMAL(19,4),
    "actual_benefit" DECIMAL(19,4),
    "start_date" TIMESTAMP(3),
    "target_date" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "six_sigma_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "six_sigma_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "baseline" DOUBLE PRECISION,
    "target" DOUBLE PRECISION,
    "actual" DOUBLE PRECISION,
    "unit" TEXT,
    "is_critical" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "six_sigma_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "six_sigma_tools" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "tool_type" TEXT NOT NULL,
    "phase" TEXT NOT NULL,
    "data" JSONB,
    "findings" TEXT,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "six_sigma_tools_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shop_floor_transactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "transaction_type" TEXT NOT NULL,
    "work_order_id" TEXT,
    "machine_id" TEXT,
    "operator_id" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit" TEXT,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration" DOUBLE PRECISION,
    "scrap_qty" DOUBLE PRECISION,
    "scrap_reason" TEXT,
    "barcode_scanned" TEXT,
    "device_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shop_floor_transactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "quality_standards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "standard_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT,
    "issuer" TEXT,
    "scope" TEXT,
    "requirements" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "quality_standards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "compliance_audits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "standard_id" TEXT NOT NULL,
    "audit_type" TEXT NOT NULL,
    "scope" TEXT,
    "audit_date" TIMESTAMP(3) NOT NULL,
    "auditor_name" TEXT,
    "auditor_org" TEXT,
    "findings" JSONB,
    "non_conformities" INTEGER DEFAULT 0,
    "observations" INTEGER DEFAULT 0,
    "result" TEXT,
    "certification_no" TEXT,
    "cert_expiry" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "compliance_audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "gmp_batch_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "product_code" TEXT NOT NULL,
    "formula_version" TEXT,
    "batch_size" DOUBLE PRECISION NOT NULL,
    "process_steps" JSONB,
    "in_process_tests" JSONB,
    "deviations" JSONB,
    "released_by" TEXT,
    "released_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROCESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gmp_batch_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "haccp_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "product_line" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "scope" TEXT,
    "hazard_analysis" JSONB,
    "critical_control_points" JSONB,
    "monitoring_procedures" JSONB,
    "corrective_actions" JSONB,
    "verification" JSONB,
    "review_date" TIMESTAMP(3),
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "haccp_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_portfolios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "owner" TEXT,
    "strategic_goal" TEXT,
    "budget" DECIMAL(19,4),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "scorecard" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppm_portfolios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_portfolio_projects" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "portfolio_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "priority" INTEGER,
    "strategic_alignment" DOUBLE PRECISION,
    "risk_score" DOUBLE PRECISION,

    CONSTRAINT "ppm_portfolio_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_risk_registers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "risk_code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "probability" DOUBLE PRECISION,
    "impact" DOUBLE PRECISION,
    "risk_score" DOUBLE PRECISION,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "owner" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IDENTIFIED',
    "mitigation_plan" TEXT,
    "contingency_plan" TEXT,
    "residual_risk" DOUBLE PRECISION,
    "triggered_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppm_risk_registers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_raid_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "entry_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "owner" TEXT,
    "due_date" TIMESTAMP(3),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "resolution" TEXT,
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppm_raid_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evm_baselines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "baseline_type" TEXT NOT NULL DEFAULT 'ORIGINAL',
    "budget_at_completion" DECIMAL(19,4) NOT NULL,
    "schedule_baseline_start" TIMESTAMP(3),
    "schedule_baseline_end" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evm_baselines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "evm_measurements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "baseline_id" TEXT NOT NULL,
    "measurement_date" TIMESTAMP(3) NOT NULL,
    "planned_value" DECIMAL(19,4) NOT NULL,
    "earned_value" DECIMAL(19,4) NOT NULL,
    "actual_cost" DECIMAL(19,4) NOT NULL,
    "schedule_variance" DOUBLE PRECISION,
    "cost_variance" DECIMAL(19,4),
    "spi" DOUBLE PRECISION,
    "cpi" DOUBLE PRECISION,
    "eac" DOUBLE PRECISION,
    "etc" DOUBLE PRECISION,
    "tcpi" DOUBLE PRECISION,
    "percent_complete" DOUBLE PRECISION,

    CONSTRAINT "evm_measurements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_kanban_boards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "wip_limit" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppm_kanban_boards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_kanban_columns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "board_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "column_type" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "wip_limit" INTEGER,
    "color" TEXT,

    CONSTRAINT "ppm_kanban_columns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_kanban_cards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "column_id" TEXT NOT NULL,
    "task_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" DOUBLE PRECISION NOT NULL,
    "assignees" JSONB,
    "due_date" TIMESTAMP(3),
    "labels" JSONB,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "story_points" DOUBLE PRECISION,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppm_kanban_cards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_change_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "change_code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "change_type" TEXT NOT NULL,
    "requested_by" TEXT,
    "request_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "schedule_impact" INTEGER,
    "cost_impact" DECIMAL(19,4),
    "recommendation" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "rejection_reason" TEXT,
    "implemented_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppm_change_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_procurement_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "description" TEXT,
    "make_or_buy" JSONB,
    "total_budget" DECIMAL(19,4),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppm_procurement_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_procurement_requisitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION,
    "estimated_cost" DECIMAL(19,4),
    "required_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "po_id" TEXT,

    CONSTRAINT "ppm_procurement_requisitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_client_portals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "client_id" TEXT NOT NULL,
    "access_token" TEXT NOT NULL,
    "access_level" TEXT NOT NULL DEFAULT 'READ',
    "expires_at" TIMESTAMP(3),
    "last_accessed_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppm_client_portals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_client_approvals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "deliverable_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "submitted_to" TEXT NOT NULL,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reviewed_by" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "comments" TEXT,
    "signatures" JSONB,

    CONSTRAINT "ppm_client_approvals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_timesheets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "week_start" TIMESTAMP(3) NOT NULL,
    "week_end" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "total_hours" DOUBLE PRECISION,
    "billable_hours" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppm_timesheets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_timesheet_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "timesheet_id" TEXT NOT NULL,
    "project_id" TEXT,
    "task_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "hours" DOUBLE PRECISION NOT NULL,
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT,
    "activity_type" TEXT,

    CONSTRAINT "ppm_timesheet_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_quality_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "quality_objectives" TEXT,
    "standards" JSONB,
    "review_schedule" JSONB,
    "acceptance_criteria" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppm_quality_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_quality_inspections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "inspection_type" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3),
    "conducted_date" TIMESTAMP(3),
    "inspected_by" TEXT,
    "checklist" JSONB,
    "findings" JSONB,
    "defects_found" INTEGER DEFAULT 0,
    "result" TEXT NOT NULL DEFAULT 'PENDING',
    "comments" TEXT,

    CONSTRAINT "ppm_quality_inspections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "category" TEXT,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "file_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "owner" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "tags" JSONB,
    "access_level" TEXT NOT NULL DEFAULT 'PROJECT_TEAM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ppm_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ppm_document_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "file_url" TEXT,
    "change_notes" TEXT,
    "uploaded_by" TEXT,
    "uploaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ppm_document_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subcontractor_deliverables" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subcontractor_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "due_date" TIMESTAMP(3),
    "delivered_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "acceptance_status" TEXT,
    "comments" TEXT,

    CONSTRAINT "subcontractor_deliverables_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subcontractor_payment_milestones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subcontractor_id" TEXT NOT NULL,
    "milestone_title" TEXT NOT NULL,
    "amount" DECIMAL(19,4) NOT NULL,
    "due_date" TIMESTAMP(3),
    "trigger" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "invoice_ref" TEXT,

    CONSTRAINT "subcontractor_payment_milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_inboxes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email_address" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'SMTP',
    "config" JSONB,
    "user_id" TEXT,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "team_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "email_inboxes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "inbox_id" TEXT NOT NULL,
    "message_id" TEXT,
    "thread_id" TEXT,
    "subject" TEXT,
    "from_address" TEXT,
    "from_name" TEXT,
    "to_addresses" JSONB,
    "cc_addresses" JSONB,
    "body_text" TEXT,
    "body_html" TEXT,
    "attachments" JSONB,
    "labels" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "is_starred" BOOLEAN NOT NULL DEFAULT false,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "is_draft" BOOLEAN NOT NULL DEFAULT false,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "sent_at" TIMESTAMP(3),
    "received_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "email_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "inbox_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "conditions" JSONB NOT NULL,
    "actions" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "match_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "video_rooms" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "room_code" TEXT NOT NULL,
    "title" TEXT,
    "host_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3),
    "duration" INTEGER,
    "max_participants" INTEGER,
    "is_recorded" BOOLEAN NOT NULL DEFAULT false,
    "recording_url" TEXT,
    "transcript_url" TEXT,
    "password" TEXT,
    "waiting_room" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "started_at" TIMESTAMP(3),
    "ended_at" TIMESTAMP(3),
    "settings" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_rooms_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "video_room_participants" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" TEXT,
    "role" TEXT NOT NULL DEFAULT 'PARTICIPANT',
    "joined_at" TIMESTAMP(3),
    "left_at" TIMESTAMP(3),
    "duration" INTEGER,
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "is_camera_on" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "video_room_participants_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "video_recordings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size" INTEGER,
    "duration" INTEGER,
    "format" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PROCESSING',
    "url" TEXT,
    "transcript" TEXT,
    "summary" TEXT,
    "chapters" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "video_recordings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wiki_spaces" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" TEXT,
    "team_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_spaces_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wiki_pages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "space_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT,
    "content_format" TEXT NOT NULL DEFAULT 'MARKDOWN',
    "author_id" TEXT,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "is_locked" BOOLEAN NOT NULL DEFAULT false,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "tags" JSONB,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wiki_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "wiki_page_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "page_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "edited_by" TEXT,
    "change_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wiki_page_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_channels" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "channel_type" TEXT NOT NULL DEFAULT 'PUBLIC',
    "team_id" TEXT,
    "project_id" TEXT,
    "is_archived" BOOLEAN NOT NULL DEFAULT false,
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "settings" JSONB,
    "topic" TEXT,
    "purpose" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chat_channel_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "is_muted" BOOLEAN NOT NULL DEFAULT false,
    "last_read_at" TIMESTAMP(3),
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "chat_channel_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "intranet_posts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "media_urls" JSONB,
    "link_preview" JSONB,
    "visibility" TEXT NOT NULL DEFAULT 'EVERYONE',
    "tags" JSONB,
    "hashtags" JSONB,
    "mentions" JSONB,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_announcement" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "intranet_posts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "intranet_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "author_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" JSONB,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intranet_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "intranet_reactions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "emoji" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "intranet_reactions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "internal_surveys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "survey_type" TEXT NOT NULL DEFAULT 'PULSE',
    "questions" JSONB,
    "settings" JSONB,
    "target_audience" JSONB,
    "scheduled_at" TIMESTAMP(3),
    "ends_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "response_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "internal_surveys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "internal_survey_answers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "user_id" TEXT,
    "answers" JSONB,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "score" DOUBLE PRECISION,

    CONSTRAINT "internal_survey_answers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "company_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "event_type" TEXT NOT NULL DEFAULT 'MEETING',
    "organizer" TEXT,
    "location" TEXT,
    "virtual_link" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "is_all_day" BOOLEAN NOT NULL DEFAULT false,
    "max_attendees" INTEGER,
    "rsvp_required" BOOLEAN NOT NULL DEFAULT false,
    "rsvp_deadline" TIMESTAMP(3),
    "department" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "tags" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_rsvps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attendees" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "responded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comm_retention_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scope" JSONB,
    "retention_days" INTEGER NOT NULL,
    "delete_after" BOOLEAN NOT NULL DEFAULT false,
    "legal_basis" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comm_retention_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "legal_holds" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "matter" TEXT,
    "custodians" JSONB,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_holds_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "phone_extensions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "user_id" TEXT,
    "display_name" TEXT,
    "phone_number" TEXT,
    "pbx_server" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "voicemail_pin" TEXT,
    "call_forward" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "phone_extensions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "phone_call_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "extension_id" TEXT,
    "direction" TEXT NOT NULL,
    "from_number" TEXT,
    "to_number" TEXT,
    "duration" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "recording_url" TEXT,
    "transcript" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "phone_call_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comm_webhooks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" JSONB,
    "secret" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "fail_count" INTEGER NOT NULL DEFAULT 0,
    "last_triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comm_webhooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "comm_analytics_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "metrics" JSONB,
    "insights" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "comm_analytics_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_data_models" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "description" TEXT,
    "table_name" TEXT NOT NULL,
    "module" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "searchable" BOOLEAN NOT NULL DEFAULT true,
    "permissions" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_data_models_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_data_fields" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "field_type" TEXT NOT NULL,
    "is_required" BOOLEAN NOT NULL DEFAULT false,
    "is_unique" BOOLEAN NOT NULL DEFAULT false,
    "is_indexed" BOOLEAN NOT NULL DEFAULT false,
    "default_value" JSONB,
    "options" JSONB,
    "validation" JSONB,
    "visibility" JSONB,
    "order" INTEGER NOT NULL DEFAULT 0,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "linked_model_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builder_data_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_relationships" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_model_id" TEXT NOT NULL,
    "to_model_id" TEXT NOT NULL,
    "relationship_type" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "foreign_key" TEXT,
    "through_model" TEXT,
    "on_delete" TEXT NOT NULL DEFAULT 'SET_NULL',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builder_relationships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_data_views" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "view_type" TEXT NOT NULL DEFAULT 'LIST',
    "columns" JSONB,
    "filters" JSONB,
    "sort_by" JSONB,
    "group_by" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_shared" BOOLEAN NOT NULL DEFAULT true,
    "owner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builder_data_views_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "business_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rule_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "trigger_event" TEXT,
    "conditions" JSONB,
    "actions" JSONB,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "last_run_at" TIMESTAMP(3),
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "business_rule_executions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rule_id" TEXT NOT NULL,
    "entity_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUCCESS',
    "result" JSONB,
    "error" TEXT,
    "duration" DOUBLE PRECISION,
    "triggered_by" TEXT,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "business_rule_executions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_scripts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "script_type" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'JAVASCRIPT',
    "code" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "test_data" JSONB,
    "last_tested_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_scripts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "calculated_fields" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "model_id" TEXT,
    "form_id" TEXT,
    "name" TEXT NOT NULL,
    "display_name" TEXT,
    "formula" TEXT NOT NULL,
    "return_type" TEXT NOT NULL,
    "dependencies" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "calculated_fields_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_connectors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "connector_type" TEXT NOT NULL,
    "base_url" TEXT,
    "auth_type" TEXT NOT NULL DEFAULT 'API_KEY',
    "credentials" JSONB,
    "headers" JSONB,
    "timeout" INTEGER DEFAULT 30,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_ping" TIMESTAMP(3),
    "health" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integration_connectors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connector_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "direction" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "source_entity" TEXT,
    "target_endpoint" TEXT,
    "field_mappings" JSONB,
    "transformations" JSONB,
    "trigger_type" TEXT NOT NULL DEFAULT 'MANUAL',
    "schedule" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "last_status" TEXT,
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "integrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "integration_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "integration_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "records_processed" INTEGER,
    "records_failed" INTEGER,
    "duration" DOUBLE PRECISION,
    "error" TEXT,
    "payload" JSONB,
    "response" JSONB,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "integration_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "industry" TEXT,
    "template_type" TEXT NOT NULL,
    "content" JSONB,
    "preview" TEXT,
    "tags" JSONB,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_marketplace" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "published_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_permission_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "rule_type" TEXT NOT NULL,
    "scope" TEXT NOT NULL DEFAULT 'FIELD',
    "target_field" TEXT,
    "condition" JSONB,
    "role" TEXT,
    "user_id" TEXT,
    "access" TEXT NOT NULL DEFAULT 'ALLOW',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builder_permission_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_document_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "template_type" TEXT NOT NULL DEFAULT 'PDF',
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "settings" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_document_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_document_renders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "variables" JSONB,
    "output_format" TEXT NOT NULL,
    "file_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rendered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builder_document_renders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_apis" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "path" TEXT NOT NULL,
    "authentication" TEXT NOT NULL DEFAULT 'JWT',
    "authorization" JSONB,
    "request_schema" JSONB,
    "response_schema" JSONB,
    "handler" TEXT,
    "data_model_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "call_count" INTEGER NOT NULL DEFAULT 0,
    "version" TEXT NOT NULL DEFAULT 'v1',
    "rate_limit" INTEGER,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_apis_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_themes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "primary_color" TEXT,
    "secondary_color" TEXT,
    "accent_color" TEXT,
    "background_color" TEXT,
    "text_color" TEXT,
    "font_family" TEXT,
    "logo_url" TEXT,
    "favicon_url" TEXT,
    "custom_css" TEXT,
    "custom_js" TEXT,
    "settings" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "builder_themes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_environments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "env_type" TEXT NOT NULL DEFAULT 'DEVELOPMENT',
    "description" TEXT,
    "settings" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builder_environments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_deployments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "change_summary" TEXT,
    "artifacts" JSONB,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "deployed_by" TEXT,
    "deployed_at" TIMESTAMP(3),
    "rolled_back_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builder_deployments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "marketplace_packages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT,
    "name" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "tags" JSONB,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "content" JSONB,
    "screenshots" JSONB,
    "price" DECIMAL(19,4),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "downloads" INTEGER NOT NULL DEFAULT 0,
    "rating" DOUBLE PRECISION,
    "rating_count" INTEGER NOT NULL DEFAULT 0,
    "published_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publisher_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "marketplace_packages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_analytics_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "session_id" TEXT,
    "user_id" TEXT,
    "event_type" TEXT NOT NULL,
    "entity_type" TEXT,
    "entity_id" TEXT,
    "properties" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builder_analytics_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "builder_usage_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "metric_type" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "period" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "builder_usage_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chatbot_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "avatar_url" TEXT,
    "greeting" TEXT,
    "nlu_provider" TEXT,
    "language" TEXT NOT NULL DEFAULT 'en',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "deployed_on" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "chatbot_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chatbot_intents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "training_phrases" JSONB,
    "responses" JSONB,
    "action" JSONB,
    "entities" JSONB,
    "follow_up_intents" JSONB,

    CONSTRAINT "chatbot_intents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "chatbot_conversations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bot_id" TEXT NOT NULL,
    "session_id" TEXT NOT NULL,
    "user_id" TEXT,
    "messages" JSONB,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "handed_off" BOOLEAN NOT NULL DEFAULT false,
    "satisfaction" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),

    CONSTRAINT "chatbot_conversations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "event_code" TEXT NOT NULL,
    "description" TEXT,
    "entity_type" TEXT,
    "payload" JSONB,
    "is_system_event" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "event_triggers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "event_definition_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "trigger_type" TEXT NOT NULL,
    "conditions" JSONB,
    "actions" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "run_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "event_triggers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "scheduled_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cron_expression" TEXT NOT NULL,
    "action" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "run_count" INTEGER NOT NULL DEFAULT 0,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scheduled_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "report_type" TEXT NOT NULL DEFAULT 'TABLE',
    "data_source" TEXT,
    "query" JSONB,
    "columns" JSONB,
    "filters" JSONB,
    "group_by" JSONB,
    "sort_by" JSONB,
    "aggregations" JSONB,
    "charts" JSONB,
    "pivot_config" JSONB,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_scheduled" BOOLEAN NOT NULL DEFAULT false,
    "schedule" TEXT,
    "email_recipients" JSONB,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "row_count" INTEGER,
    "file_url" TEXT,
    "format" TEXT,
    "duration" DOUBLE PRECISION,
    "error" TEXT,
    "triggered_by" TEXT,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "report_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dashboard_definitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "layout" JSONB,
    "filters" JSONB,
    "auto_refresh" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "owner_id" TEXT,
    "shared_with" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "dashboard_definitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "dashboard_widgets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "dashboard_id" TEXT NOT NULL,
    "widget_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "data_source" TEXT,
    "query" JSONB,
    "chart_type" TEXT,
    "config" JSONB,
    "position" JSONB,
    "size" JSONB,
    "filters" JSONB,
    "drill_down" JSONB,
    "refresh_interval" INTEGER,

    CONSTRAINT "dashboard_widgets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_success_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "health_score" INTEGER NOT NULL DEFAULT 100,
    "arr" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "nrr_target" DECIMAL(5,2) NOT NULL DEFAULT 100,
    "churn_risk_level" TEXT NOT NULL DEFAULT 'LOW',
    "owner_id" TEXT,
    "target_date" TIMESTAMP(3),
    "goals" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_success_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "customer_success_milestones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "due_date" TIMESTAMP(3),
    "completion_date" TIMESTAMP(3),
    "owner_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "customer_success_milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_playbooks_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "stage" TEXT NOT NULL,
    "target_role" TEXT,
    "is_template" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "objection_handling" JSONB,
    "competitor_battlecards" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_playbooks_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_playbook_steps_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instruction" TEXT NOT NULL,
    "required_artifact_type" TEXT,
    "checklist" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_playbook_steps_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_intelligence_signals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "opportunity_id" TEXT,
    "signal_type" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "source" TEXT NOT NULL,
    "headline" TEXT NOT NULL,
    "payload" JSONB,
    "is_actioned" BOOLEAN NOT NULL DEFAULT false,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_intelligence_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_document_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'PROPOSAL',
    "content" TEXT NOT NULL,
    "variables" JSONB,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_document_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_document_generations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "customer_id" TEXT,
    "opportunity_id" TEXT,
    "title" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "document_url" TEXT,
    "metadata" JSONB,
    "generated_by" TEXT,
    "sent_at" TIMESTAMP(3),
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_document_generations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_return_orders_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "return_number" TEXT NOT NULL,
    "order_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'REQUESTED',
    "reason" TEXT NOT NULL,
    "total_refund_amount" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "restocking_fee" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "approved_by" TEXT,
    "items" JSONB,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_return_orders_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_gamification_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "leaderboards" JSONB,
    "streak_data" JSONB,
    "badge_awards" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_gamification_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sales_quota_attainments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sales_rep_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "quota_amount" DECIMAL(18,4) NOT NULL,
    "achieved_amount" DECIMAL(18,4) NOT NULL,
    "attainment_pct" DECIMAL(5,2) NOT NULL,
    "commission_earned" DECIMAL(18,4) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_quota_attainments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_tenant_tier_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tier_name" TEXT NOT NULL,
    "max_users" INTEGER NOT NULL DEFAULT 10,
    "max_storage_gb" INTEGER NOT NULL DEFAULT 50,
    "max_api_req_per_min" INTEGER NOT NULL DEFAULT 1000,
    "sla_tier" TEXT NOT NULL DEFAULT '99.9%',
    "features" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_tenant_tier_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_tenant_custom_quotas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "resource_key" TEXT NOT NULL,
    "quota_limit" BIGINT NOT NULL,
    "warning_threshold" BIGINT NOT NULL DEFAULT 80,
    "soft_enforce" BOOLEAN NOT NULL DEFAULT true,
    "effective_from" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "effective_to" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_tenant_custom_quotas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_metering_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "metric_code" TEXT NOT NULL,
    "unit_price" DECIMAL(18,6) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "aggregation_type" TEXT NOT NULL DEFAULT 'SUM',
    "free_tier_allowance" BIGINT NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_metering_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_usage_event_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_ref" TEXT NOT NULL,
    "event_count" INTEGER NOT NULL,
    "processed_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "payload" JSONB,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_usage_event_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_multi_tenant_clusters" (
    "id" TEXT NOT NULL,
    "cluster_name" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'AWS',
    "status" TEXT NOT NULL DEFAULT 'HEALTHY',
    "max_tenants" INTEGER NOT NULL DEFAULT 500,
    "active_tenants" INTEGER NOT NULL DEFAULT 0,
    "endpoint" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_multi_tenant_clusters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_tenant_node_routings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cluster_id" TEXT NOT NULL,
    "node_group" TEXT NOT NULL DEFAULT 'shared-workers',
    "database_host" TEXT NOT NULL,
    "redis_host" TEXT NOT NULL,
    "is_dedicated" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_tenant_node_routings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_white_label_domains" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "custom_domain" TEXT NOT NULL,
    "cname_target" TEXT NOT NULL DEFAULT 'app.unerp.io',
    "verification_token" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'PENDING_DNS',
    "branding_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_white_label_domains_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_ssl_certificates" (
    "id" TEXT NOT NULL,
    "domain_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'LETS_ENCRYPT',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "issued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_ssl_certificates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_partner_reseller_channels" (
    "id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "partner_name" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'SILVER',
    "commission_pct" DECIMAL(5,2) NOT NULL DEFAULT 20.00,
    "managed_tenants" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "contract_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_partner_reseller_channels_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_reseller_commissions" (
    "id" TEXT NOT NULL,
    "reseller_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "invoice_amount" DECIMAL(18,4) NOT NULL,
    "commission_pct" DECIMAL(5,2) NOT NULL,
    "earned_amount" DECIMAL(18,4) NOT NULL,
    "payout_status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_reseller_commissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_portal_account_profiles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "tax_id" TEXT,
    "billing_email" TEXT NOT NULL,
    "technical_email" TEXT,
    "address" TEXT,
    "country" TEXT NOT NULL DEFAULT 'US',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_portal_account_profiles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_portal_payment_methods" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "last4" TEXT NOT NULL,
    "exp_month" INTEGER NOT NULL,
    "exp_year" INTEGER NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "stripe_payment_method_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_portal_payment_methods_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_portal_subscription_upgrades" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "from_tier" TEXT NOT NULL,
    "to_tier" TEXT NOT NULL,
    "prorated_charge" DECIMAL(18,4) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "effective_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_portal_subscription_upgrades_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_portal_plan_downgrade_reasons" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reason_category" TEXT NOT NULL,
    "feedback" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_portal_plan_downgrade_reasons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_portal_usage_dashboards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "current_usage" BIGINT NOT NULL,
    "quota_limit" BIGINT NOT NULL,
    "percent_used" DECIMAL(5,2) NOT NULL,
    "period" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_portal_usage_dashboards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_portal_invoice_download_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "downloaded_by" TEXT NOT NULL,
    "downloaded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_portal_invoice_download_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_portal_support_tickets_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_number" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'BILLING',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saas_portal_support_tickets_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_portal_ticket_messages" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "sender_role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "message" TEXT NOT NULL,
    "attachments" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_portal_ticket_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_portal_feature_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "upvotes_count" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'UNDER_REVIEW',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_portal_feature_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saas_portal_feature_votes" (
    "id" TEXT NOT NULL,
    "request_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "voter_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saas_portal_feature_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_custom_dashboards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analytics_custom_dashboards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_dashboard_widgets_deep" (
    "id" TEXT NOT NULL,
    "dashboard_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "widget_type" TEXT NOT NULL,
    "query_config" JSONB NOT NULL,
    "layout_grid" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_dashboard_widgets_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_data_datasets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source_type" TEXT NOT NULL,
    "schema_json" JSONB NOT NULL,
    "refresh_interval" TEXT NOT NULL DEFAULT 'HOURLY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_data_datasets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_data_pipelines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "pipeline_name" TEXT NOT NULL,
    "source_dataset_id" TEXT NOT NULL,
    "target_dataset_id" TEXT NOT NULL,
    "transformation_sql" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_data_pipelines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_predictive_models" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "model_name" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL,
    "target_metric" TEXT NOT NULL,
    "accuracy_score" DECIMAL(5,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'TRAINED',
    "trained_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_predictive_models_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_forecast_runs" (
    "id" TEXT NOT NULL,
    "model_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "forecast_horizon" TEXT NOT NULL,
    "result_metrics" JSONB NOT NULL,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_forecast_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_cohort_analyses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cohort_name" TEXT NOT NULL,
    "grouping_rule" TEXT NOT NULL,
    "time_granularity" TEXT NOT NULL DEFAULT 'MONTHLY',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_cohort_analyses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_cohort_groups" (
    "id" TEXT NOT NULL,
    "analysis_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cohort_date" TEXT NOT NULL,
    "initial_users" INTEGER NOT NULL,
    "retention_rates" JSONB NOT NULL,

    CONSTRAINT "analytics_cohort_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_funnel_steps" (
    "id" TEXT NOT NULL,
    "funnel_name" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "step_order" INTEGER NOT NULL,
    "event_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_funnel_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "analytics_funnel_conversions" (
    "id" TEXT NOT NULL,
    "funnel_name" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "step_conversions" JSONB NOT NULL,
    "overall_dropoff" DECIMAL(5,2) NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "analytics_funnel_conversions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporting_templates_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "layout_html" TEXT NOT NULL,
    "header_footer" JSONB,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reporting_templates_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporting_template_sections" (
    "id" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "section_name" TEXT NOT NULL,
    "section_order" INTEGER NOT NULL,
    "data_source_sql" TEXT,
    "chart_config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_template_sections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporting_scheduled_jobs_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_name" TEXT NOT NULL,
    "template_id" TEXT NOT NULL,
    "cron_schedule" TEXT NOT NULL,
    "output_format" TEXT NOT NULL DEFAULT 'PDF',
    "recipients" JSONB NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_scheduled_jobs_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporting_execution_logs" (
    "id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "execution_ms" INTEGER NOT NULL,
    "file_size_kb" INTEGER,
    "error_message" TEXT,
    "executed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_execution_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporting_export_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "requested_by" TEXT NOT NULL,
    "report_type" TEXT NOT NULL,
    "export_format" TEXT NOT NULL,
    "filter_params" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "download_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_export_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporting_export_files" (
    "id" TEXT NOT NULL,
    "export_job_id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_size_bytes" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reporting_export_files_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporting_compliance_audits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_name" TEXT NOT NULL,
    "compliance_type" TEXT NOT NULL,
    "signoff_status" TEXT NOT NULL DEFAULT 'PENDING',
    "auditor_id" TEXT,
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_compliance_audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporting_signoff_history" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "signer_user_id" TEXT NOT NULL,
    "signature_hash" TEXT NOT NULL,
    "comments" TEXT,
    "signed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_signoff_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporting_distribution_lists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "list_name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_distribution_lists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "reporting_distribution_recipients" (
    "id" TEXT NOT NULL,
    "list_id" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "recipient_name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reporting_distribution_recipients_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_hr_learning_paths_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "path_name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "estimated_hours" INTEGER NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advanced_hr_learning_paths_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_hr_learning_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "path_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "progress_percent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "completed_at" TIMESTAMP(3),
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advanced_hr_learning_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_hr_succession_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "target_role_id" TEXT NOT NULL,
    "urgency_level" TEXT NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advanced_hr_succession_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_hr_succession_candidates" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "readiness_score" DECIMAL(5,2) NOT NULL,
    "readiness_level" TEXT NOT NULL,
    "nominated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advanced_hr_succession_candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_hr_workforce_analytics_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "reporting_period" TEXT NOT NULL,
    "headcount" INTEGER NOT NULL,
    "attrition_rate" DECIMAL(5,2) NOT NULL,
    "avg_tenure_years" DECIMAL(5,2) NOT NULL,
    "engagement_score" DECIMAL(5,2) NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advanced_hr_workforce_analytics_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_hr_compensation_bands_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "band_name" TEXT NOT NULL,
    "job_level" TEXT NOT NULL,
    "min_salary" DECIMAL(12,2) NOT NULL,
    "mid_salary" DECIMAL(12,2) NOT NULL,
    "max_salary" DECIMAL(12,2) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "effective_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advanced_hr_compensation_bands_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_hr_benefits_plans_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_name" TEXT NOT NULL,
    "plan_type" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "employee_cost" DECIMAL(10,2) NOT NULL,
    "employer_cost" DECIMAL(10,2) NOT NULL,
    "enrollment_open" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advanced_hr_benefits_plans_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_hr_benefits_enrollments" (
    "id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "enrolled_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',

    CONSTRAINT "advanced_hr_benefits_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_hr_org_chart_nodes_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "parent_node_id" TEXT,
    "job_title" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "reporting_level" INTEGER NOT NULL,
    "headcount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "advanced_hr_org_chart_nodes_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "advanced_hr_exit_interviews_deep" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "exit_date" TIMESTAMP(3) NOT NULL,
    "exit_reason" TEXT NOT NULL,
    "satisfaction_score" INTEGER NOT NULL,
    "would_rehire" BOOLEAN NOT NULL,
    "comments" TEXT,
    "conducted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "advanced_hr_exit_interviews_deep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "search_indexes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "keywords" JSONB NOT NULL DEFAULT '[]',
    "module" TEXT NOT NULL,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_indexes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "search_index_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "fields" JSONB NOT NULL DEFAULT '[]',
    "weight" INTEGER NOT NULL DEFAULT 1,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_index_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "search_query_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "filters" JSONB NOT NULL DEFAULT '{}',
    "result_count" INTEGER NOT NULL DEFAULT 0,
    "execution_ms" INTEGER NOT NULL DEFAULT 0,
    "entity_types" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_query_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "search_analytics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_queries" INTEGER NOT NULL DEFAULT 0,
    "unique_users" INTEGER NOT NULL DEFAULT 0,
    "avg_response_ms" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "topQueries" JSONB NOT NULL DEFAULT '[]',
    "topEntities" JSONB NOT NULL DEFAULT '[]',
    "zeroResultQueries" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_view_layouts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "view_id" TEXT NOT NULL,
    "layoutType" TEXT NOT NULL DEFAULT 'table',
    "columns" JSONB NOT NULL DEFAULT '[]',
    "groupBy" TEXT,
    "sortBy" JSONB NOT NULL DEFAULT '[]',
    "page_size" INTEGER NOT NULL DEFAULT 25,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_view_layouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_view_filters" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "view_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL DEFAULT 'eq',
    "value" JSONB NOT NULL,
    "logic" TEXT NOT NULL DEFAULT 'AND',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_view_filters_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_view_column_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "view_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "label" TEXT,
    "width" INTEGER,
    "sortable" BOOLEAN NOT NULL DEFAULT true,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL DEFAULT 0,
    "format" TEXT,
    "alignment" TEXT NOT NULL DEFAULT 'left',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_view_column_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_view_sharings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "view_id" TEXT NOT NULL,
    "shared_with_user_id" TEXT NOT NULL,
    "shared_by_user_id" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'view',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_view_sharings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "variables" JSONB NOT NULL DEFAULT '[]',
    "eventType" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "category" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "total_items" INTEGER NOT NULL DEFAULT 0,
    "sent_items" INTEGER NOT NULL DEFAULT 0,
    "failed_items" INTEGER NOT NULL DEFAULT 0,
    "template_id" TEXT,
    "scheduled_at" TIMESTAMP(3),
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_batch_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_msg" TEXT,
    "sent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_batch_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_digests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'DAILY',
    "channel" TEXT NOT NULL DEFAULT 'EMAIL',
    "last_sent_at" TIMESTAMP(3),
    "next_scheduled_at" TIMESTAMP(3),
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_digests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notification_delivery_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "notification_id" TEXT,
    "template_id" TEXT,
    "user_id" TEXT NOT NULL,
    "channel" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'QUEUED',
    "error_msg" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "sent_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "opened_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_delivery_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deployments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "application" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "strategy" TEXT NOT NULL DEFAULT 'ROLLING',
    "branch" TEXT,
    "commit_sha" TEXT,
    "commit_message" TEXT,
    "deployed_by" TEXT NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "rollback_from" TEXT,
    "rollback_to" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "dep_environment_id" TEXT,

    CONSTRAINT "deployments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deployment_stages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deployment_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration" INTEGER,
    "log_output" TEXT,
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployment_stages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "environments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'DEVELOPMENT',
    "application" TEXT,
    "base_url" TEXT,
    "health_url" TEXT,
    "region" TEXT,
    "cluster" TEXT,
    "namespace" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "config_version" INTEGER NOT NULL DEFAULT 1,
    "last_deploy_at" TIMESTAMP(3),
    "last_health_check_at" TIMESTAMP(3),
    "health_status" TEXT,
    "monitoring_enabled" BOOLEAN NOT NULL DEFAULT true,
    "auto_deploy_enabled" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "environment_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "environment_id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "valueType" TEXT NOT NULL DEFAULT 'STRING',
    "is_secret" BOOLEAN NOT NULL DEFAULT false,
    "description" TEXT,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environment_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "releases" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "application" TEXT NOT NULL,
    "description" TEXT,
    "releaseType" TEXT NOT NULL DEFAULT 'STANDARD',
    "environment_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "release_notes" TEXT,
    "changelog" JSONB NOT NULL DEFAULT '[]',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "released_by" TEXT,
    "released_at" TIMESTAMP(3),
    "branch" TEXT,
    "commit_sha" TEXT,
    "tag" TEXT,
    "is_rollback" BOOLEAN NOT NULL DEFAULT false,
    "rollback_from" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "releases_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "release_artifacts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "release_id" TEXT NOT NULL,
    "deployment_id" TEXT,
    "name" TEXT NOT NULL,
    "file_type" TEXT NOT NULL,
    "file_url" TEXT,
    "file_hash" TEXT,
    "file_size" INTEGER,
    "docker_tag" TEXT,
    "docker_image" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "release_artifacts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "build_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deployment_id" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "level" TEXT NOT NULL DEFAULT 'INFO',
    "message" TEXT NOT NULL,
    "source" TEXT,
    "line_number" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "build_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "deployment_analytics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "total_deployments" INTEGER NOT NULL DEFAULT 0,
    "successful_deployments" INTEGER NOT NULL DEFAULT 0,
    "failed_deployments" INTEGER NOT NULL DEFAULT 0,
    "rollback_count" INTEGER NOT NULL DEFAULT 0,
    "avg_duration" DOUBLE PRECISION,
    "p95_duration" DOUBLE PRECISION,
    "deployments_by_env" JSONB NOT NULL DEFAULT '{}',
    "deployments_by_app" JSONB NOT NULL DEFAULT '{}',
    "failure_reasons" JSONB NOT NULL DEFAULT '[]',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "deployment_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pwa_manifests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "description" TEXT,
    "start_url" TEXT NOT NULL DEFAULT '/',
    "display" TEXT NOT NULL DEFAULT 'standalone',
    "orientation" TEXT NOT NULL DEFAULT 'any',
    "theme_color" TEXT NOT NULL DEFAULT '#0f172a',
    "background_color" TEXT NOT NULL DEFAULT '#ffffff',
    "icon_url" TEXT,
    "icon_512_url" TEXT,
    "splash_icon_url" TEXT,
    "maskable_icon_url" TEXT,
    "lang" TEXT NOT NULL DEFAULT 'en',
    "dir" TEXT NOT NULL DEFAULT 'ltr',
    "scope" TEXT NOT NULL DEFAULT '/',
    "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "iarc_rating_id" TEXT,
    "screenshots" JSONB NOT NULL DEFAULT '[]',
    "shortcuts" JSONB NOT NULL DEFAULT '[]',
    "share_target" JSONB,
    "protocol_handlers" JSONB NOT NULL DEFAULT '[]',
    "edge_side_panel" JSONB,
    "prefer_related_applications" BOOLEAN NOT NULL DEFAULT false,
    "related_applications" JSONB NOT NULL DEFAULT '[]',
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pwa_manifests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pwa_service_workers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'sw.js',
    "script" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0.0',
    "cacheStrategy" TEXT NOT NULL DEFAULT 'CACHE_FIRST',
    "precache_urls" JSONB NOT NULL DEFAULT '[]',
    "runtime_cache_rules" JSONB NOT NULL DEFAULT '[]',
    "navigation_preload" BOOLEAN NOT NULL DEFAULT false,
    "push_enabled" BOOLEAN NOT NULL DEFAULT true,
    "background_sync" BOOLEAN NOT NULL DEFAULT true,
    "import_scripts" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "file_hash" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pwa_service_workers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pwa_offline_cache_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url_pattern" TEXT NOT NULL,
    "cache_strategy" TEXT NOT NULL DEFAULT 'CACHE_FIRST',
    "max_age_seconds" INTEGER DEFAULT 86400,
    "max_entries" INTEGER DEFAULT 100,
    "compression" BOOLEAN NOT NULL DEFAULT false,
    "method" TEXT NOT NULL DEFAULT 'GET',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pwa_offline_cache_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pwa_install_prompts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "promptStyle" TEXT NOT NULL DEFAULT 'BANNER',
    "title" TEXT NOT NULL DEFAULT 'Install App',
    "description" TEXT,
    "app_name" TEXT NOT NULL,
    "icon_url" TEXT,
    "cancel_text" TEXT NOT NULL DEFAULT 'Not Now',
    "install_text" TEXT NOT NULL DEFAULT 'Install',
    "max_dismissals" INTEGER NOT NULL DEFAULT 3,
    "days_between_prompts" INTEGER NOT NULL DEFAULT 7,
    "require_engagement" BOOLEAN NOT NULL DEFAULT true,
    "page_paths" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "analytics_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pwa_install_prompts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pwa_sync_queues" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_id" TEXT,
    "entity_type" TEXT NOT NULL,
    "entity_id" TEXT,
    "operation" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "max_retries" INTEGER NOT NULL DEFAULT 5,
    "last_error" TEXT,
    "conflict_resolution" TEXT,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pwa_sync_queues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pwa_push_subscriptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "endpoint" TEXT NOT NULL,
    "p256dh_key" TEXT NOT NULL,
    "auth_key" TEXT NOT NULL,
    "userAgent" TEXT,
    "device_type" TEXT,
    "browser" TEXT,
    "platform" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_pushed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pwa_push_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outbox_dlqs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "outbox_event_id" TEXT NOT NULL,
    "outbox_delivery_id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "failure_reason" TEXT,
    "error_stack_trace" TEXT,
    "failed_attempts" INTEGER NOT NULL DEFAULT 1,
    "last_attempted_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING_REVIEW',
    "requeue_count" INTEGER NOT NULL DEFAULT 0,
    "max_requeues" INTEGER NOT NULL DEFAULT 3,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_dlqs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outbox_dead_letter_messages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "outbox_dlq_id" TEXT,
    "outbox_event_id" TEXT NOT NULL,
    "outbox_delivery_id" TEXT NOT NULL,
    "destination" TEXT NOT NULL,
    "event_name" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB NOT NULL DEFAULT '{}',
    "failure_reason" TEXT,
    "original_created_at" TIMESTAMP(3),
    "dead_letter_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "action" TEXT,
    "actioned_by" TEXT,
    "actioned_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_dead_letter_messages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outbox_retry_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "outbox_delivery_id" TEXT NOT NULL,
    "attempt_number" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "response_code" INTEGER,
    "response_body" TEXT,
    "duration_ms" INTEGER,
    "error_message" TEXT,
    "triggeredBy" TEXT NOT NULL DEFAULT 'SYSTEM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "outbox_retry_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "outbox_dispatcher_states" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "dispatcher_name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "items_processed" INTEGER NOT NULL DEFAULT 0,
    "items_failed" INTEGER NOT NULL DEFAULT 0,
    "current_batch_size" INTEGER NOT NULL DEFAULT 0,
    "error_message" TEXT,
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "config" JSONB NOT NULL DEFAULT '{}',
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "outbox_dispatcher_states_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ext_connections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OUTBOUND',
    "base_url" TEXT,
    "api_key" TEXT,
    "api_secret" TEXT,
    "authType" TEXT NOT NULL DEFAULT 'API_KEY',
    "auth_config" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_tested_at" TIMESTAMP(3),
    "last_test_status" TEXT,
    "error_count" INTEGER NOT NULL DEFAULT 0,
    "rate_limit_per_min" INTEGER DEFAULT 60,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "retry_backoff_ms" INTEGER NOT NULL DEFAULT 1000,
    "webhook_enabled" BOOLEAN NOT NULL DEFAULT false,
    "webhook_url" TEXT,
    "webhook_secret" TEXT,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "health_endpoint" TEXT,
    "health_status" TEXT,
    "last_health_check_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ext_connections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ext_connection_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "direction" TEXT NOT NULL,
    "method" TEXT,
    "url" TEXT,
    "status_code" INTEGER,
    "request_body" JSONB,
    "response_body" JSONB,
    "error_message" TEXT,
    "duration_ms" INTEGER,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "success" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ext_connection_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ext_webhook_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "event_types" TEXT[],
    "secret" TEXT,
    "format" TEXT NOT NULL DEFAULT 'JSON',
    "headers" JSONB NOT NULL DEFAULT '{}',
    "retryPolicy" TEXT NOT NULL DEFAULT 'EXPONENTIAL',
    "max_retries" INTEGER NOT NULL DEFAULT 5,
    "retry_interval_ms" INTEGER NOT NULL DEFAULT 60000,
    "timeout" INTEGER NOT NULL DEFAULT 30000,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(3),
    "last_success_at" TIMESTAMP(3),
    "last_failure_at" TIMESTAMP(3),
    "consecutive_failure_count" INTEGER NOT NULL DEFAULT 0,
    "circuit_breaker_enabled" BOOLEAN NOT NULL DEFAULT true,
    "circuit_breaker_threshold" INTEGER NOT NULL DEFAULT 5,
    "circuit_breaker_reset_ms" INTEGER NOT NULL DEFAULT 300000,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ext_webhook_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ext_webhook_deliveries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "webhook_config_id" TEXT NOT NULL,
    "event_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "headers" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "status_code" INTEGER,
    "response_body" TEXT,
    "error_message" TEXT,
    "duration_ms" INTEGER,
    "scheduled_at" TIMESTAMP(3),
    "delivered_at" TIMESTAMP(3),
    "failed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ext_webhook_deliveries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ext_rate_limit_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "connection_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "strategy" TEXT NOT NULL DEFAULT 'TOKEN_BUCKET',
    "max_requests" INTEGER NOT NULL,
    "window_ms" INTEGER NOT NULL,
    "max_burst" INTEGER DEFAULT 0,
    "refill_rate" INTEGER,
    "refill_interval_ms" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ext_rate_limit_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ext_rate_limit_usages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rate_limit_config_id" TEXT NOT NULL,
    "window_start" TIMESTAMP(3) NOT NULL,
    "window_end" TIMESTAMP(3) NOT NULL,
    "request_count" INTEGER NOT NULL DEFAULT 0,
    "blocked_count" INTEGER NOT NULL DEFAULT 0,
    "remaining" INTEGER NOT NULL,
    "reset_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ext_rate_limit_usages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ext_integration_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "config_template" JSONB NOT NULL,
    "auth_types" TEXT[],
    "webhook_events" TEXT[],
    "rate_limit_suggestions" JSONB,
    "documentation_url" TEXT,
    "is_built_in" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ext_integration_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "people_competencies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'TECHNICAL',
    "description" TEXT,
    "proficiency_levels" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_competencies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "people_succession_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "position_title" TEXT NOT NULL,
    "current_incumbent_id" TEXT,
    "readinessRating" TEXT NOT NULL DEFAULT 'MEDIUM',
    "successors" JSONB NOT NULL DEFAULT '[]',
    "risk_of_loss" TEXT NOT NULL DEFAULT 'LOW',
    "impact_of_loss" TEXT NOT NULL DEFAULT 'HIGH',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_succession_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "people_performance_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "kpi_score" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "goals_completed" INTEGER NOT NULL DEFAULT 0,
    "goals_total" INTEGER NOT NULL DEFAULT 0,
    "feedback_rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "people_performance_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "search_index_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "searchable_fields" TEXT[],
    "boost_fields" JSONB NOT NULL DEFAULT '{}',
    "filter_fields" TEXT[],
    "is_auto_indexed" BOOLEAN NOT NULL DEFAULT true,
    "last_reindexed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_index_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "search_synonym_groups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "synonyms" TEXT[],
    "is_one_way" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "search_synonym_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asset_depreciation_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "starting_book_value" DECIMAL(65,30) NOT NULL,
    "depreciation_amount" DECIMAL(65,30) NOT NULL,
    "ending_book_value" DECIMAL(65,30) NOT NULL,
    "accumulated_depreciation" DECIMAL(65,30) NOT NULL,
    "is_posted" BOOLEAN NOT NULL DEFAULT false,
    "posted_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_depreciation_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asset_maintenance_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "maintenanceType" TEXT NOT NULL DEFAULT 'PREVENTIVE',
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "completed_date" TIMESTAMP(3),
    "assigned_to" TEXT,
    "cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "asset_maintenance_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "asset_disposal_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "disposal_date" TIMESTAMP(3) NOT NULL,
    "disposalType" TEXT NOT NULL DEFAULT 'SALE',
    "sale_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "book_value_at_disposal" DECIMAL(65,30) NOT NULL,
    "gain_or_loss" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "approved_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "asset_disposal_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_rate_limit_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "endpoint_path" TEXT NOT NULL,
    "limit_per_minute" INTEGER NOT NULL DEFAULT 60,
    "burst_limit" INTEGER NOT NULL DEFAULT 100,
    "clientTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_rate_limit_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_quota_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_app_id" TEXT NOT NULL,
    "daily_call_quota" INTEGER NOT NULL DEFAULT 10000,
    "monthly_call_quota" INTEGER NOT NULL DEFAULT 300000,
    "calls_today" INTEGER NOT NULL DEFAULT 0,
    "calls_this_month" INTEGER NOT NULL DEFAULT 0,
    "reset_date" TIMESTAMP(3) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "api_quota_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "api_usage_analytics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_app_id" TEXT,
    "endpoint" TEXT NOT NULL,
    "http_method" TEXT NOT NULL,
    "status_code" INTEGER NOT NULL,
    "response_time_ms" INTEGER NOT NULL,
    "request_size" INTEGER NOT NULL DEFAULT 0,
    "response_size" INTEGER NOT NULL DEFAULT 0,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_usage_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_plan_tiers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "monthly_price" DECIMAL(65,30) NOT NULL,
    "annual_price" DECIMAL(65,30) NOT NULL,
    "included_units" INTEGER NOT NULL DEFAULT 100,
    "overage_rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "features" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "plan_group_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_tiers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_usage_billings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "units_consumed" INTEGER NOT NULL DEFAULT 0,
    "billing_period" TEXT NOT NULL,
    "total_charge" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "is_billed" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_usage_billings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_churn_surveys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "reason_category" TEXT NOT NULL,
    "feedbackNotes" TEXT,
    "competitor_name" TEXT,
    "would_recommend" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_churn_surveys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_bucket_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bucket_name" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'S3',
    "region" TEXT NOT NULL DEFAULT 'us-east-1',
    "max_quota_gb" INTEGER NOT NULL DEFAULT 100,
    "current_size_gb" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "versioning" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_bucket_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_lifecycle_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bucket_name" TEXT NOT NULL,
    "rule_name" TEXT NOT NULL,
    "prefix" TEXT,
    "transition_days" INTEGER,
    "storage_class" TEXT,
    "expiration_days" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_lifecycle_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_access_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "bucket_name" TEXT NOT NULL,
    "role_or_user" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'READ',
    "allowed_ip_subnet" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_access_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pwa_offline_sync_queues" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action_type" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "error_message" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 0,
    "synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pwa_offline_sync_queues_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "pwa_manifest_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "app_name" TEXT NOT NULL,
    "short_name" TEXT NOT NULL,
    "theme_color" TEXT NOT NULL DEFAULT '#000000',
    "background_color" TEXT NOT NULL DEFAULT '#ffffff',
    "display_mode" TEXT NOT NULL DEFAULT 'standalone',
    "start_url" TEXT NOT NULL DEFAULT '/',
    "icons" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pwa_manifest_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_view_shares" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "view_id" TEXT NOT NULL,
    "shared_with" TEXT NOT NULL,
    "permission" TEXT NOT NULL DEFAULT 'READ',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_view_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_view_filter_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "view_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "logical_op" TEXT NOT NULL DEFAULT 'AND',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "saved_view_filter_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "saved_view_preferences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "module_name" TEXT NOT NULL,
    "default_view_id" TEXT,
    "pinned_views" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "saved_view_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "people_onboarding_tasks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "assignee_id" TEXT,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "people_onboarding_tasks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "people_time_off_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "leave_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "days" DECIMAL(5,2) NOT NULL,
    "reason" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "approver_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "people_time_off_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "people_peer_recognitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "giver_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "badge" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "points" INTEGER NOT NULL DEFAULT 10,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "people_peer_recognitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_insurance_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "policy_no" TEXT NOT NULL,
    "insurer" TEXT NOT NULL,
    "coverage_amount" DECIMAL(15,2) NOT NULL,
    "premium_amount" DECIMAL(15,2) NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_asset_insurance_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_revaluations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "old_value" DECIMAL(15,2) NOT NULL,
    "new_value" DECIMAL(15,2) NOT NULL,
    "revalued_by" TEXT NOT NULL,
    "revalued_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT NOT NULL,

    CONSTRAINT "fixed_asset_revaluations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_physical_audits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "audit_name" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "expected_location" TEXT NOT NULL,
    "found_location" TEXT NOT NULL,
    "condition" TEXT NOT NULL DEFAULT 'GOOD',
    "audited_by" TEXT NOT NULL,
    "audited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_asset_physical_audits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sm_service_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "priority" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "category_id" TEXT,
    "assignee_id" TEXT,
    "reporter_id" TEXT,
    "sla_policy_id" TEXT,
    "due_date" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sm_service_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sm_ticket_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "sm_ticket_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sm_ticket_sla_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "targets" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sm_ticket_sla_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sm_ticket_sla_breaches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "breachType" TEXT NOT NULL,
    "target_time" TIMESTAMP(3) NOT NULL,
    "breached_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sm_ticket_sla_breaches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sm_ticket_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "author_id" TEXT,
    "content" TEXT NOT NULL,
    "is_internal" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sm_ticket_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sm_ticket_activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "actor_id" TEXT,
    "action" TEXT NOT NULL,
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sm_ticket_activities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sm_knowledge_articles" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "author_id" TEXT,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sm_knowledge_articles_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "sm_survey_responses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "feedback" TEXT,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sm_survey_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_components" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "serial_no" TEXT,
    "part_no" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "installed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "warranty_expiry" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_asset_components_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_component_replacements" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "component_id" TEXT NOT NULL,
    "replaced_at" TIMESTAMP(3) NOT NULL,
    "old_serial_no" TEXT,
    "new_serial_no" TEXT,
    "cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "reason" TEXT,
    "performed_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_asset_component_replacements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_warranties" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "warranty_provider" TEXT NOT NULL,
    "warrantyType" TEXT NOT NULL DEFAULT 'MANUFACTURER',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "coverage_details" TEXT,
    "contract_value" DECIMAL(65,30),
    "claim_phone" TEXT,
    "claim_email" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_asset_warranties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_warranty_claims" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "warranty_id" TEXT NOT NULL,
    "claim_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT NOT NULL,
    "claim_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "approved_amount" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_asset_warranty_claims_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_impairments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "impairment_date" TIMESTAMP(3) NOT NULL,
    "carrying_amount" DECIMAL(65,30) NOT NULL,
    "recoverable_amount" DECIMAL(65,30) NOT NULL,
    "impairment_loss" DECIMAL(65,30) NOT NULL,
    "impairmentType" TEXT NOT NULL DEFAULT 'INDICATOR',
    "reason" TEXT NOT NULL,
    "approved_by" TEXT,
    "journal_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_asset_impairments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_condition_assessments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "assessment_date" TIMESTAMP(3) NOT NULL,
    "condition_score" INTEGER NOT NULL,
    "condition_rating" TEXT NOT NULL,
    "assessed_by" TEXT NOT NULL,
    "notes" TEXT,
    "remaining_life_estimate" INTEGER,
    "replacement_cost_estimate" DECIMAL(65,30),
    "next_assessment_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_asset_condition_assessments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_documents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_url" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_asset_documents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_utilization_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "metric_date" TIMESTAMP(3) NOT NULL,
    "metric_type" TEXT NOT NULL,
    "value" DECIMAL(65,30) NOT NULL,
    "unit" TEXT NOT NULL DEFAULT 'PERCENT',
    "recorded_by" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fixed_asset_utilization_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_groups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "parent_id" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_asset_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_group_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "group_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,

    CONSTRAINT "fixed_asset_group_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "fixed_asset_budget_allocations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "category_id" TEXT,
    "allocated_amount" DECIMAL(65,30) NOT NULL,
    "spent_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "fixed_asset_budget_allocations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_coupons" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "discount_type" TEXT NOT NULL,
    "discount_value" DECIMAL(65,30) NOT NULL,
    "max_redemptions" INTEGER,
    "current_redemptions" INTEGER NOT NULL DEFAULT 0,
    "appliesTo" TEXT NOT NULL DEFAULT 'ALL',
    "plan_id" TEXT,
    "valid_from" TIMESTAMP(3) NOT NULL,
    "valid_until" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_coupons_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_coupon_redemptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "coupon_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "discount_amount" DECIMAL(65,30) NOT NULL,
    "redeemed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_coupon_redemptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_plan_groups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_migrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "from_plan_tier_id" TEXT,
    "to_plan_tier_id" TEXT NOT NULL,
    "migration_type" TEXT NOT NULL,
    "effective_date" TIMESTAMP(3) NOT NULL,
    "prorated_credit" DECIMAL(65,30),
    "prorated_charge" DECIMAL(65,30),
    "previous_unit_amount" DECIMAL(65,30),
    "new_unit_amount" DECIMAL(65,30),
    "reason" TEXT,
    "initiated_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_migrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_billing_runs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "run_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "period_label" TEXT NOT NULL,
    "total_subs_processed" INTEGER NOT NULL DEFAULT 0,
    "total_billed" INTEGER NOT NULL DEFAULT 0,
    "total_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_failed" INTEGER NOT NULL DEFAULT 0,
    "total_trials" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'COMPLETED',
    "error_log" TEXT,
    "completed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_billing_runs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_billing_run_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "billing_run_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "invoice_number" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'BILLED',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_billing_run_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_dunning_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "invoice_status" TEXT NOT NULL,
    "days_overdue" INTEGER NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'SEND_REMINDER',
    "late_fee_type" TEXT,
    "late_fee_value" DECIMAL(65,30),
    "send_email" BOOLEAN NOT NULL DEFAULT true,
    "email_template_id" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_dunning_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_credit_notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "subscription_id" TEXT NOT NULL,
    "invoice_id" TEXT,
    "credit_note_no" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT NOT NULL,
    "reason_category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "applied_at" TIMESTAMP(3),
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_credit_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_auto_scale_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "subscription_id" TEXT,
    "metric_name" TEXT NOT NULL,
    "threshold_type" TEXT NOT NULL,
    "threshold_value" DECIMAL(65,30) NOT NULL,
    "scale_action" TEXT NOT NULL,
    "scale_amount" INTEGER NOT NULL DEFAULT 1,
    "cool_down_minutes" INTEGER NOT NULL DEFAULT 1440,
    "last_triggered_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_auto_scale_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "subscription_analytics_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "snapshot_date" TIMESTAMP(3) NOT NULL,
    "total_active" INTEGER NOT NULL DEFAULT 0,
    "total_trialing" INTEGER NOT NULL DEFAULT 0,
    "total_paused" INTEGER NOT NULL DEFAULT 0,
    "total_canceled" INTEGER NOT NULL DEFAULT 0,
    "total_expired" INTEGER NOT NULL DEFAULT 0,
    "mrr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "arr" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "new_subs" INTEGER NOT NULL DEFAULT 0,
    "churned_subs" INTEGER NOT NULL DEFAULT 0,
    "upgrades" INTEGER NOT NULL DEFAULT 0,
    "downgrades" INTEGER NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "avg_revenue_per_sub" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "churn_rate_pct" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "month_over_month_growth" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "subscription_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locale_translation_contexts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locale_translation_contexts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locale_glossary_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "context_id" TEXT,
    "definition" TEXT NOT NULL,
    "translation" TEXT,
    "usage" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locale_glossary_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locale_translation_memory_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "source_text" TEXT NOT NULL,
    "source_locale" TEXT NOT NULL,
    "target_locale" TEXT NOT NULL,
    "translated_text" TEXT NOT NULL,
    "context_id" TEXT,
    "matchType" TEXT NOT NULL DEFAULT 'EXACT',
    "match_score" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "usage_count" INTEGER NOT NULL DEFAULT 1,
    "approved" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locale_translation_memory_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locale_machine_translation_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "api_key" TEXT,
    "from_locale" TEXT,
    "to_locales" JSONB NOT NULL DEFAULT '[]',
    "model_name" TEXT,
    "max_chars_per_month" INTEGER NOT NULL DEFAULT 1000000,
    "chars_used_this_month" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locale_machine_translation_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locale_approval_workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "rules" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locale_approval_workflows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locale_translation_reviews" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "translation_id" TEXT NOT NULL,
    "reviewer_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "comment" TEXT,
    "reviewed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "locale_translation_reviews_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locale_fallback_chains" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "locale_code" TEXT NOT NULL,
    "fallback_order" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locale_fallback_chains_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "locale_content_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "content_key" TEXT NOT NULL,
    "source_locale" TEXT NOT NULL,
    "target_locales" JSONB NOT NULL DEFAULT '[]',
    "cron_expression" TEXT NOT NULL,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "locale_content_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "region_validation_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "region_code" TEXT NOT NULL,
    "entity_type" TEXT NOT NULL,
    "validation_rules" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "region_validation_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_bookmarks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "filter_state" JSONB DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_bookmarks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_shares" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "shared_by_id" TEXT NOT NULL,
    "shared_with_user_id" TEXT,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "share_link" TEXT,
    "expires_at" TIMESTAMP(3),
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "query_config" JSONB NOT NULL DEFAULT '{}',
    "snapshot" JSONB DEFAULT '{}',
    "created_by" TEXT,
    "change_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_execution_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "executed_by" TEXT,
    "executionType" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "row_count" INTEGER,
    "execution_time_ms" INTEGER,
    "export_formats" JSONB DEFAULT '[]',
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_execution_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_drill_path_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "field_name" TEXT NOT NULL,
    "target_report_id" TEXT,
    "drillType" TEXT NOT NULL DEFAULT 'DETAIL',
    "custom_url" TEXT,
    "param_mapping" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_drill_path_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_data_sources" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MODULE',
    "module_name" TEXT,
    "table_name" TEXT,
    "connection_string" TEXT,
    "credentials" JSONB DEFAULT '{}',
    "schema" JSONB DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_data_sources_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_cache_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "ttl_minutes" INTEGER NOT NULL DEFAULT 60,
    "invalidate_on_update" BOOLEAN NOT NULL DEFAULT true,
    "last_cached_at" TIMESTAMP(3),
    "cache_size_bytes" INTEGER DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_cache_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_alert_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "condition" JSONB NOT NULL DEFAULT '{}',
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "recipient_ids" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_alert_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_schedule_instances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "schedule_job_id" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "row_count" INTEGER,
    "export_formats" JSONB DEFAULT '[]',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_schedule_instances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_filter_presets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filter_state" JSONB NOT NULL DEFAULT '{}',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_filter_presets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "report_column_preferences" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "column_config" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "report_column_preferences_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_annotations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "version_id" TEXT,
    "page_number" INTEGER NOT NULL DEFAULT 1,
    "x" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "y" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "width" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "height" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "type" TEXT NOT NULL DEFAULT 'HIGHLIGHT',
    "content" TEXT,
    "color" TEXT DEFAULT '#FFEB3B',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_annotations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_comments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "parent_id" TEXT,
    "content" TEXT NOT NULL,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "edited_at" TIMESTAMP(3),
    "resolved" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "document_comments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_tags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#1976D2',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_tag_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_tag_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_locks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "locked_by" TEXT NOT NULL,
    "locked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reason" TEXT DEFAULT 'Manual lock',

    CONSTRAINT "document_locks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "initiated_by" TEXT NOT NULL,
    "initiated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "document_workflows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_exports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "format" TEXT NOT NULL DEFAULT 'PDF',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "file_url" TEXT,
    "file_size" INTEGER,
    "requested_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "document_exports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_audit_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "actor_id" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_audit_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_smart_collections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "query" JSONB NOT NULL DEFAULT '{}',
    "icon" TEXT DEFAULT 'folder',
    "color" TEXT DEFAULT '#1976D2',
    "created_by" TEXT NOT NULL,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "document_smart_collections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_favorites" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_favorites_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_recent_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "last_viewed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "view_count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "document_recent_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "document_watermarks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "document_id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "opacity" DOUBLE PRECISION NOT NULL DEFAULT 0.3,
    "position" TEXT NOT NULL DEFAULT 'CENTER',
    "rotation" INTEGER NOT NULL DEFAULT -45,
    "fontSize" INTEGER NOT NULL DEFAULT 48,
    "color" TEXT NOT NULL DEFAULT '#000000',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "document_watermarks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_encryptions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'AES-256-GCM',
    "key_id" TEXT NOT NULL,
    "encrypted_key" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ENCRYPTED',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_encryptions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_replications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "source_bucket" TEXT NOT NULL,
    "target_bucket" TEXT NOT NULL,
    "target_region" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "last_replicated" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_replications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_backups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'FULL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "file_url" TEXT,
    "file_size" BIGINT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_backups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_analytics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_files" INTEGER NOT NULL DEFAULT 0,
    "total_size" BIGINT NOT NULL DEFAULT 0,
    "fileTypes" JSONB NOT NULL DEFAULT '{}',
    "active_users" INTEGER NOT NULL DEFAULT 0,
    "operations" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_analytics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_alerts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "condition" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_triggered" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_alerts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_migrations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source_provider" TEXT NOT NULL,
    "target_provider" TEXT NOT NULL,
    "file_count" INTEGER NOT NULL DEFAULT 0,
    "total_size" BIGINT NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "error_log" JSONB,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_migrations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_compressions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "algorithm" TEXT NOT NULL DEFAULT 'GZIP',
    "original_size" BIGINT NOT NULL,
    "compressed_size" BIGINT NOT NULL,
    "ratio" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'COMPRESSED',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_compressions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_deduplications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_hash" TEXT NOT NULL,
    "file_count" INTEGER NOT NULL DEFAULT 1,
    "total_size" BIGINT NOT NULL,
    "saved_size" BIGINT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_deduplications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'MANUAL',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "file_count" INTEGER NOT NULL DEFAULT 0,
    "total_size" BIGINT NOT NULL DEFAULT 0,
    "metadata" JSONB DEFAULT '{}',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_retention_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "retention_days" INTEGER NOT NULL,
    "action" TEXT NOT NULL DEFAULT 'DELETE',
    "fileTypes" JSONB DEFAULT '[]',
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_retention_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_compliance_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "policy_id" TEXT,
    "file_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" JSONB,
    "checked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_compliance_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_caches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "file_id" TEXT NOT NULL,
    "cache_key" TEXT NOT NULL,
    "cacheType" TEXT NOT NULL DEFAULT 'THUMBNAIL',
    "file_size" INTEGER,
    "expires_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_accessed" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storage_caches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "storage_syncs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "source_provider" TEXT NOT NULL,
    "target_provider" TEXT NOT NULL,
    "syncDirection" TEXT NOT NULL DEFAULT 'BIDIRECTIONAL',
    "schedule" TEXT,
    "last_synced_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "storage_syncs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "triggerType" TEXT NOT NULL DEFAULT 'MANUAL',
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "is_built_in" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workflow_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT DEFAULT '#1976D2',
    "icon" TEXT DEFAULT 'folder',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "nodes" JSONB NOT NULL DEFAULT '[]',
    "edges" JSONB NOT NULL DEFAULT '[]',
    "settings" JSONB DEFAULT '{}',
    "change_log" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_conditions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "logic_group" TEXT DEFAULT 'AND',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_conditions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_loops" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "loop_field" TEXT NOT NULL,
    "max_iterations" INTEGER NOT NULL DEFAULT 100,
    "break_on" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_loops_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_subprocesses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "parent_definition_id" TEXT NOT NULL,
    "child_definition_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "input_mapping" JSONB NOT NULL DEFAULT '{}',
    "output_mapping" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_subprocesses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_error_handlers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "onError" TEXT NOT NULL DEFAULT 'ABORT',
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "retry_delay" INTEGER NOT NULL DEFAULT 60,
    "notify_roles" TEXT,
    "route_to_node" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_error_handlers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_notifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "recipients" JSONB NOT NULL DEFAULT '[]',
    "template" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_notifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_webhooks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'POST',
    "headers" JSONB NOT NULL DEFAULT '{}',
    "body_template" TEXT,
    "secret" TEXT,
    "retry_count" INTEGER NOT NULL DEFAULT 3,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_webhooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_metrics" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "executions" INTEGER NOT NULL DEFAULT 0,
    "avg_duration" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failure_count" INTEGER NOT NULL DEFAULT 0,
    "avg_sla_pct" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_metrics_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_tags" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT '#1976D2',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_tags_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "workflow_tag_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tag_id" TEXT NOT NULL,
    "definition_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workflow_tag_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_lead_routing_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "action" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_lead_routing_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_lead_routing_history" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lead_id" TEXT NOT NULL,
    "rule_id" TEXT,
    "assigned_to_id" TEXT,
    "assigned_by" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "previous_assignee_id" TEXT,
    "rule_matched" BOOLEAN NOT NULL DEFAULT false,
    "matched_rule_name" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_lead_routing_history_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_lead_round_robin_states" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "team_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "position" INTEGER NOT NULL DEFAULT 0,
    "last_assigned_at" TIMESTAMP(3),
    "total_assigned" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_lead_round_robin_states_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_enrichment_providers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "api_url" TEXT,
    "api_key_enc" TEXT,
    "config" JSONB NOT NULL DEFAULT '{}',
    "rate_limit" INTEGER,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "last_tested_at" TIMESTAMP(3),
    "last_test_result" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_enrichment_providers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_enrichment_workflows" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "provider_id" TEXT NOT NULL,
    "objectType" TEXT NOT NULL,
    "triggerType" TEXT NOT NULL,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "steps" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_enrichment_workflows_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_enrichment_jobs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "workflow_id" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "current_step" INTEGER NOT NULL DEFAULT 0,
    "total_steps" INTEGER NOT NULL DEFAULT 0,
    "result" JSONB DEFAULT '{}',
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_enrichment_jobs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_enrichment_job_steps" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "step_index" INTEGER NOT NULL,
    "provider_id" TEXT NOT NULL,
    "field_mappings" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "input_data" JSONB,
    "output_data" JSONB,
    "error_message" TEXT,
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "duration_ms" INTEGER,
    "retry_count" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "crm_enrichment_job_steps_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_enrichment_cache" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "object_id" TEXT NOT NULL,
    "object_type" TEXT NOT NULL,
    "provider_id" TEXT NOT NULL,
    "enriched_data" JSONB NOT NULL,
    "raw_response" JSONB,
    "confidence" DOUBLE PRECISION,
    "matched_to" TEXT,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_enrichment_cache_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_sales_playbooks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "methodology" TEXT NOT NULL DEFAULT 'MEDDPICC',
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "version" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_sales_playbooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_playbook_stages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "stage_name" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "required_fields" JSONB NOT NULL DEFAULT '[]',
    "exit_criteria" JSONB NOT NULL DEFAULT '[]',
    "guidance" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_playbook_stages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_playbook_actions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "playbook_id" TEXT NOT NULL,
    "stage_id" TEXT NOT NULL,
    "action_name" TEXT NOT NULL,
    "action_type" TEXT NOT NULL DEFAULT 'TASK',
    "is_mandatory" BOOLEAN NOT NULL DEFAULT false,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "template_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_playbook_actions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_deal_guidances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "playbook_id" TEXT,
    "current_stage_id" TEXT,
    "health_score" INTEGER NOT NULL DEFAULT 50,
    "risk_factors" JSONB NOT NULL DEFAULT '[]',
    "next_best_action" TEXT,
    "win_probability" DECIMAL(5,2) NOT NULL DEFAULT 0.5,
    "ai_summary" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_deal_guidances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_competitor_battlecards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "competitor_name" TEXT NOT NULL,
    "category" TEXT,
    "strengths" JSONB NOT NULL DEFAULT '[]',
    "weaknesses" JSONB NOT NULL DEFAULT '[]',
    "landmines" JSONB NOT NULL DEFAULT '[]',
    "pricing_info" TEXT,
    "key_differentiators" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_competitor_battlecards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_objection_handlers" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "battlecard_id" TEXT,
    "objection" TEXT NOT NULL,
    "category" TEXT,
    "suggested_response" TEXT NOT NULL,
    "success_rate" DECIMAL(5,2) NOT NULL DEFAULT 0.8,
    "tags" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_objection_handlers_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_omnichannel_campaigns" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "campaign_type" TEXT NOT NULL DEFAULT 'EMAIL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "budget" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "spend" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "target_audience" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_omnichannel_campaigns_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_campaign_nodes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "node_type" TEXT NOT NULL DEFAULT 'ACTION',
    "name" TEXT NOT NULL,
    "config" JSONB NOT NULL DEFAULT '{}',
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_campaign_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_audience_segment_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "segment_id" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "operator" TEXT NOT NULL DEFAULT 'EQUALS',
    "value" TEXT NOT NULL,
    "logical_op" TEXT NOT NULL DEFAULT 'AND',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_audience_segment_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_attribution_models" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "deal_id" TEXT NOT NULL,
    "campaign_id" TEXT NOT NULL,
    "attribution_type" TEXT NOT NULL DEFAULT 'LINEAR',
    "attributed_revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "weight_percentage" DECIMAL(5,4) NOT NULL DEFAULT 1.0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_attribution_models_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_marketing_assets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "asset_type" TEXT NOT NULL DEFAULT 'EBOOK',
    "file_url" TEXT,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "lead_gen_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_marketing_assets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_event_webinars" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "event_date" TIMESTAMP(3) NOT NULL,
    "duration_mins" INTEGER NOT NULL DEFAULT 60,
    "platform" TEXT NOT NULL DEFAULT 'ZOOM',
    "join_url" TEXT,
    "registrant_count" INTEGER NOT NULL DEFAULT 0,
    "attendee_count" INTEGER NOT NULL DEFAULT 0,
    "recording_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_event_webinars_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_abm_account_groups" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL DEFAULT 'TIER_1',
    "target_revenue" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "dedicated_rep_id" TEXT,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_abm_account_groups_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_intent_signals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'G2',
    "topic" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 50,
    "signal_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "raw_metadata" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_intent_signals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_buying_committee_members" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contact_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'DECISION_MAKER',
    "influence_level" TEXT NOT NULL DEFAULT 'HIGH',
    "sentiment" TEXT NOT NULL DEFAULT 'POSITIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_buying_committee_members_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_account_engagement_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "activity_type" TEXT NOT NULL,
    "engagement_points" INTEGER NOT NULL DEFAULT 10,
    "details" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_account_engagement_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_health_score_configs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "metric_name" TEXT NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 0.25,
    "threshold_warning" DECIMAL(5,2) NOT NULL DEFAULT 60,
    "threshold_critical" DECIMAL(5,2) NOT NULL DEFAULT 40,
    "calculation_logic" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_health_score_configs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_account_health_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "overall_health" TEXT NOT NULL DEFAULT 'HEALTHY',
    "usage_score" INTEGER NOT NULL DEFAULT 80,
    "support_score" INTEGER NOT NULL DEFAULT 90,
    "nps_score" INTEGER NOT NULL DEFAULT 85,
    "payment_score" INTEGER NOT NULL DEFAULT 95,
    "churn_probability" DECIMAL(5,4) NOT NULL DEFAULT 0.05,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_account_health_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_renewal_pipelines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "customer_id" TEXT NOT NULL,
    "renewal_date" TIMESTAMP(3) NOT NULL,
    "arr_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "expansion_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "stage" TEXT NOT NULL DEFAULT 'UPCOMING',
    "owner_id" TEXT,
    "risk_reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_renewal_pipelines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_customer_feedback_surveys" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "survey_type" TEXT NOT NULL DEFAULT 'NPS',
    "questions" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "response_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_customer_feedback_surveys_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_nps_responses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "score" INTEGER NOT NULL DEFAULT 10,
    "feedback" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PROMOTER',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_nps_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_field_visit_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rep_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "purpose" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "check_in_lat" DECIMAL(10,7),
    "check_in_lng" DECIMAL(10,7),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_field_visit_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_sales_route_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "rep_id" TEXT NOT NULL,
    "plan_date" TIMESTAMP(3) NOT NULL,
    "stops" JSONB NOT NULL DEFAULT '[]',
    "total_distance_km" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estimated_duration_mins" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_sales_route_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_partner_tier_benefits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "tier_name" TEXT NOT NULL,
    "mdf_budget" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "commission_rate" DECIMAL(5,4) NOT NULL DEFAULT 0.1,
    "discount_percentage" DECIMAL(5,2) NOT NULL DEFAULT 15,
    "required_certifications" INTEGER NOT NULL DEFAULT 1,
    "perks" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_partner_tier_benefits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_partner_certifications" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "partner_id" TEXT NOT NULL,
    "contact_id" TEXT,
    "certification_name" TEXT NOT NULL,
    "issued_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiry_date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "credential_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_partner_certifications_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_saved_reports" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "module" TEXT NOT NULL DEFAULT 'crm',
    "type" TEXT NOT NULL DEFAULT 'TABLE',
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB NOT NULL DEFAULT '{}',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "columns" JSONB NOT NULL DEFAULT '[]',
    "chart_config" JSONB,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "is_shared" BOOLEAN NOT NULL DEFAULT false,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "last_used_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_saved_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_report_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'WEEKLY',
    "cron_expr" TEXT,
    "recipients" JSONB NOT NULL DEFAULT '[]',
    "format" TEXT NOT NULL DEFAULT 'PDF',
    "filters" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_run_at" TIMESTAMP(3),
    "next_run_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_report_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_report_shares" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_report_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_dashboard_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "layout" JSONB NOT NULL DEFAULT '[]',
    "widgets" JSONB NOT NULL DEFAULT '[]',
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "is_system" BOOLEAN NOT NULL DEFAULT false,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "crm_dashboard_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "crm_dashboard_shares" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "dashboard_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "can_edit" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "crm_dashboard_shares_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_parents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "relation" TEXT NOT NULL DEFAULT 'PARENT',
    "is_primary" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_parents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_student_parents" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "parent_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_student_parents_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_enrollments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "semester" TEXT DEFAULT 'FALL',
    "enrollment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "grade" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_enrollments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_course_modules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "duration_hrs" DECIMAL(65,30),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_course_modules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_gradebooks" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "max_score" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_gradebooks_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_grade_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "gradebook_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "comment" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_grade_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_attendances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "topic" TEXT,
    "start_time" TEXT,
    "end_time" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_attendances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_fee_invoices" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "invoice_number" TEXT NOT NULL,
    "totalAmount" DECIMAL(65,30) NOT NULL,
    "paidAmount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "due_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_fee_invoices_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_fee_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "method" TEXT NOT NULL DEFAULT 'CASH',
    "reference" TEXT,
    "paid_by" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "education_fee_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_library_fines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "transaction_id" TEXT,
    "amount" DECIMAL(65,30) NOT NULL,
    "reason" TEXT DEFAULT 'OVERDUE',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "paid_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_library_fines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_exam_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "room" TEXT,
    "max_score" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "weight" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_exam_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_exam_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "exam_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "score" DECIMAL(65,30) NOT NULL,
    "grade" TEXT,
    "comments" TEXT,
    "is_passed" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_exam_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_report_cards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "gpa" DECIMAL(4,2) NOT NULL,
    "comments" TEXT,
    "published_at" TIMESTAMP(3),
    "grades_summary" JSONB NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_report_cards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_scholarships" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "academic_year" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "disbursed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "education_scholarships_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "education_assignment_submissions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "submission_url" TEXT,
    "content" TEXT,
    "score" DECIMAL(5,2),
    "feedback" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "graded_at" TIMESTAMP(3),

    CONSTRAINT "education_assignment_submissions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_slas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "response_time_min" INTEGER NOT NULL,
    "resolution_time_min" INTEGER NOT NULL,
    "escalationRules" JSONB NOT NULL DEFAULT '[]',
    "penaltyClause" TEXT,
    "max_escalations" INTEGER NOT NULL DEFAULT 3,
    "business_hours_only" BOOLEAN NOT NULL DEFAULT true,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_slas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_appointments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration" INTEGER,
    "check_in_time" TIMESTAMP(3),
    "check_out_time" TIMESTAMP(3),
    "customer_signature" TEXT,
    "signature_name" TEXT,
    "customer_rating" INTEGER,
    "customer_feedback" TEXT,
    "photos" JSONB NOT NULL DEFAULT '[]',
    "checklist_id" TEXT,
    "checklistResults" JSONB NOT NULL DEFAULT '{}',
    "partsUsed" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_appointments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_inventory_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'PARTS',
    "unit_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "unit_of_measure" TEXT NOT NULL DEFAULT 'EA',
    "quantity_on_van" INTEGER NOT NULL DEFAULT 0,
    "min_stock_level" INTEGER NOT NULL DEFAULT 5,
    "max_stock_level" INTEGER NOT NULL DEFAULT 50,
    "quantity_warehouse" INTEGER NOT NULL DEFAULT 0,
    "last_restocked" TIMESTAMP(3),
    "reorder_point" INTEGER NOT NULL DEFAULT 10,
    "reorder_qty" INTEGER NOT NULL DEFAULT 25,
    "supplier_info" TEXT,
    "manufacturer" TEXT,
    "model_number" TEXT,
    "serial_number" TEXT,
    "location" TEXT,
    "image_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'IN_STOCK',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_inventory_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_contracts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_email" TEXT,
    "customer_phone" TEXT,
    "customer_address" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "renewal_date" TIMESTAMP(3),
    "scope_of_work" TEXT,
    "billingType" TEXT NOT NULL DEFAULT 'FIXED',
    "billingFrequency" TEXT NOT NULL DEFAULT 'MONTHLY',
    "contract_value" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "monthly_recurring" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "slaLevel" TEXT NOT NULL DEFAULT 'STANDARD',
    "sla_id" TEXT,
    "auto_renewal" BOOLEAN NOT NULL DEFAULT false,
    "renewal_notice_days" INTEGER NOT NULL DEFAULT 30,
    "termination_clause" TEXT,
    "documents" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "total_invoiced" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_paid" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_contracts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_timesheets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "date_worked" TIMESTAMP(3) NOT NULL,
    "hours_worked" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtime_hours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "travel_time" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "hourly_rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "overtime_rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_pay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "billable_hours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "billable_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "description" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_timesheets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_parts_usage" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "part_number" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "warranty_applied" BOOLEAN NOT NULL DEFAULT false,
    "warranty_ref" TEXT,
    "serial_number" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_parts_usage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_technician_dashboards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "total_jobs" INTEGER NOT NULL DEFAULT 0,
    "completed_jobs" INTEGER NOT NULL DEFAULT 0,
    "cancelled_jobs" INTEGER NOT NULL DEFAULT 0,
    "total_hours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "travel_hours" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_revenue" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "parts_cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "on_time_rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "last_updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_technician_dashboards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "scheduled_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "duration_min" INTEGER NOT NULL DEFAULT 60,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_calendar_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "ticket_id" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "eventType" TEXT NOT NULL DEFAULT 'APPOINTMENT',
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "all_day" BOOLEAN NOT NULL DEFAULT false,
    "color" TEXT,
    "location" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_calendar_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_part_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT,
    "technician_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "part_number" TEXT,
    "quantity_requested" INTEGER NOT NULL DEFAULT 1,
    "quantity_approved" INTEGER,
    "quantity_fulfilled" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'WAREHOUSE',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "unit_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_price" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "requested_by" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "fulfilled_at" TIMESTAMP(3),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_part_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_van_stock" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "technician_id" TEXT NOT NULL,
    "item_id" TEXT NOT NULL,
    "item_name" TEXT NOT NULL,
    "quantity_on_van" INTEGER NOT NULL DEFAULT 0,
    "min_stock_level" INTEGER NOT NULL DEFAULT 5,
    "max_stock_level" INTEGER NOT NULL DEFAULT 20,
    "reorder_point" INTEGER NOT NULL DEFAULT 5,
    "last_restocked" TIMESTAMP(3),
    "last_counted" TIMESTAMP(3),
    "location" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_van_stock_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_warranties" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "asset_id" TEXT NOT NULL,
    "warranty_no" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "coverage_details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "field_service_warranties_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_work_order_expenses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "tech_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "receipt_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_service_work_order_expenses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "field_service_inspection_checklists" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "work_order_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "items" JSONB NOT NULL DEFAULT '[]',
    "completed_by" TEXT,
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "field_service_inspection_checklists_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_factoring_facilities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "facility_name" TEXT NOT NULL,
    "facility_limit" DECIMAL(15,2) NOT NULL,
    "utilized_amount" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "advance_rate" DECIMAL(5,2) NOT NULL,
    "discount_rate" DECIMAL(5,2) NOT NULL,
    "min_invoice_amount" DECIMAL(15,2),
    "max_invoice_amount" DECIMAL(15,2),
    "recourse_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_factoring_facilities_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_factoring_advances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "facility_id" TEXT NOT NULL,
    "invoice_id" TEXT NOT NULL,
    "invoice_amount" DECIMAL(15,2) NOT NULL,
    "advance_amount" DECIMAL(15,2) NOT NULL,
    "fee_amount" DECIMAL(15,2) NOT NULL,
    "net_advance" DECIMAL(15,2) NOT NULL,
    "advance_rate" DECIMAL(5,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'FUNDED',
    "funded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collected_at" TIMESTAMP(3),
    "settled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_factoring_advances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_capture_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_name" TEXT NOT NULL,
    "total_documents" INTEGER NOT NULL DEFAULT 0,
    "processed_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UPLOADED',
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_capture_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_capture_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_id" TEXT,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "confidence_score" DECIMAL(5,2),
    "extracted_data" JSONB,
    "validation_status" TEXT NOT NULL DEFAULT 'PENDING',
    "matched_invoice_id" TEXT,
    "po_number" TEXT,
    "vendor_id" TEXT,
    "invoice_number" TEXT,
    "invoice_date" TIMESTAMP(3),
    "due_date" TIMESTAMP(3),
    "total_amount" DECIMAL(15,2),
    "error_message" TEXT,
    "corrected_by" TEXT,
    "processed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_capture_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "invoice_match_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "match_type" TEXT NOT NULL,
    "tolerance_percent" DECIMAL(5,2),
    "tolerance_amount" DECIMAL(15,2),
    "auto_approve" BOOLEAN NOT NULL DEFAULT false,
    "auto_reject" BOOLEAN NOT NULL DEFAULT false,
    "priority" INTEGER NOT NULL DEFAULT 100,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invoice_match_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "payment_rail_optimizations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_id" TEXT,
    "payment_id" TEXT,
    "recommended_rail" TEXT NOT NULL,
    "estimated_cost" DECIMAL(10,2) NOT NULL,
    "estimated_speed" INTEGER NOT NULL,
    "actual_cost" DECIMAL(10,2),
    "savings_amount" DECIMAL(10,2),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "status" TEXT NOT NULL DEFAULT 'RECOMMENDED',
    "executed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_rail_optimizations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "financial_nlp_query_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "query_text" TEXT NOT NULL,
    "parsed_intent" TEXT,
    "generated_sql" TEXT,
    "result_summary" TEXT,
    "execution_time_ms" INTEGER,
    "was_successful" BOOLEAN NOT NULL DEFAULT true,
    "error_message" TEXT,
    "user_id" TEXT,
    "queried_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "financial_nlp_query_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "account_scores" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL DEFAULT 0,
    "factors" JSONB NOT NULL DEFAULT '[]',
    "scorecard" JSONB NOT NULL DEFAULT '{}',
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_scores_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_patient_allergies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "allergen" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MILD',
    "reaction" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_patient_allergies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_appointment_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "practitioner_id" TEXT NOT NULL,
    "day_of_week" INTEGER,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "frequency" TEXT NOT NULL DEFAULT 'ONCE',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "reason" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_appointment_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_prescription_items" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "prescription_id" TEXT NOT NULL,
    "drug_name" TEXT NOT NULL,
    "dosage" TEXT NOT NULL,
    "frequency" TEXT NOT NULL,
    "duration" TEXT,
    "route" TEXT DEFAULT 'ORAL',
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "refills" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_prescription_items_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_lab_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "practitioner_id" TEXT,
    "test_name" TEXT NOT NULL,
    "test_code" TEXT,
    "specimen_type" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'ROUTINE',
    "status" TEXT NOT NULL DEFAULT 'ORDERED',
    "ordered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "collected_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_lab_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_lab_results" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "order_id" TEXT NOT NULL,
    "parameter" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "unit" TEXT,
    "reference_range" TEXT,
    "is_abnormal" BOOLEAN NOT NULL DEFAULT false,
    "comments" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_lab_results_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_insurance_policies" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "provider_name" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "group_number" TEXT,
    "coverageType" TEXT NOT NULL DEFAULT 'MEDICAL',
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "deductible" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "copay" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "out_of_pocket_max" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_insurance_policies_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_insurance_claims" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "encounter_id" TEXT,
    "claim_number" TEXT NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "billed_amount" DECIMAL(65,30) NOT NULL,
    "paid_amount" DECIMAL(65,30),
    "denied_amount" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'SUBMITTED',
    "diagnosis_code" TEXT,
    "procedure_code" TEXT,
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_insurance_claims_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_pharmacy_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "drug_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "manufacturer" TEXT,
    "lot_number" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "remaining_qty" INTEGER NOT NULL DEFAULT 0,
    "manufacturing_date" TIMESTAMP(3),
    "expiry_date" TIMESTAMP(3),
    "received_date" TIMESTAMP(3),
    "unit_cost" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_pharmacy_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_controlled_substance_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "drug_id" TEXT NOT NULL,
    "batch_id" TEXT,
    "action" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "patient_id" TEXT,
    "administered_by" TEXT NOT NULL,
    "witnesses" TEXT,
    "dea_number" TEXT,
    "notes" TEXT,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_controlled_substance_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_doctor_schedules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "practitioner_id" TEXT NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "slot_duration_min" INTEGER NOT NULL DEFAULT 15,
    "is_available" BOOLEAN NOT NULL DEFAULT true,
    "location" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_doctor_schedules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_medical_records" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "recordType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT,
    "diagnosis" TEXT,
    "icd_code" TEXT,
    "provider_id" TEXT,
    "encounter_id" TEXT,
    "is_confidential" BOOLEAN NOT NULL DEFAULT false,
    "signed_by" TEXT,
    "signed_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_medical_records_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_clinical_notes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "subjective" TEXT NOT NULL,
    "objective" TEXT NOT NULL,
    "assessment" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "icd10_codes" TEXT[],
    "cpt_codes" TEXT[],
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "signed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_clinical_notes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_telemedicine_sessions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "doctor_id" TEXT NOT NULL,
    "meeting_id" TEXT NOT NULL,
    "join_url" TEXT NOT NULL,
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration_mins" INTEGER NOT NULL DEFAULT 30,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "recording_url" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_telemedicine_sessions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "healthcare_medical_bills" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "bill_number" TEXT NOT NULL,
    "total_amount" DECIMAL(15,2) NOT NULL,
    "insurance_pay" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "patient_pay" DECIMAL(15,2) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'UNPAID',
    "due_date" TIMESTAMP(3) NOT NULL,
    "line_items" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "healthcare_medical_bills_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_ticket_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "sla_hours" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_ticket_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_advanced_tickets" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "category_id" TEXT,
    "employee_id" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT,
    "source" TEXT NOT NULL DEFAULT 'PORTAL',
    "sla_deadline" TIMESTAMP(3),
    "resolved_at" TIMESTAMP(3),
    "resolution" TEXT,
    "satisfaction_score" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_advanced_tickets_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_ticket_assignments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "assignee_id" TEXT NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "note" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_ticket_assignments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_grievances" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "grievance_type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "assigned_to" TEXT,
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_grievances_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_wellness_programs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "program_type" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_wellness_programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_headcount_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "fiscal_year" INTEGER NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_headcount_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_headcount_plan_lines" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "department_id" TEXT,
    "position_title" TEXT NOT NULL,
    "headcount_requested" INTEGER NOT NULL DEFAULT 1,
    "headcount_approved" INTEGER,
    "headcount_filled" INTEGER,
    "employment_type" TEXT NOT NULL DEFAULT 'FULL_TIME',
    "budgeted_salary" DECIMAL(15,2),
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "justification" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_headcount_plan_lines_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_succession_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "position_id" TEXT NOT NULL,
    "risk_level" TEXT NOT NULL DEFAULT 'MEDIUM',
    "readiness" TEXT NOT NULL DEFAULT 'NOT_READY',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_succession_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_succession_candidates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "readiness_level" TEXT NOT NULL,
    "readiness_timeline" TEXT,
    "strengths" TEXT,
    "development_areas" TEXT,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "rank" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hr_succession_candidates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_recognitions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "award_id" TEXT,
    "recognized_by" TEXT NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'PEER',
    "title" TEXT NOT NULL,
    "message" TEXT,
    "points" INTEGER NOT NULL DEFAULT 0,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "recognized_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_recognitions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_recognition_awards" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'VALUE_BASED',
    "points" INTEGER NOT NULL DEFAULT 100,
    "icon_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_recognition_awards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "hr_survey_responses" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "survey_id" TEXT NOT NULL,
    "survey_type" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "responses" JSONB NOT NULL DEFAULT '{}',
    "score" INTEGER,
    "comments" TEXT,
    "is_anonymous" BOOLEAN NOT NULL DEFAULT true,
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hr_survey_responses_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "employee_journey_milestones" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "employee_id" TEXT NOT NULL,
    "milestone_type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "milestone_date" TIMESTAMP(3) NOT NULL,
    "is_completed" BOOLEAN NOT NULL DEFAULT false,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_journey_milestones_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "warehouse_network_designs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "scenario" TEXT NOT NULL DEFAULT 'CURRENT',
    "total_cost" DECIMAL(19,4),
    "transport_cost" DECIMAL(19,4),
    "storage_cost" DECIMAL(19,4),
    "handling_cost" DECIMAL(19,4),
    "service_level" DOUBLE PRECISION,
    "co2_footprint" DOUBLE PRECISION,
    "assumptions" JSONB,
    "recommendations" JSONB,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "warehouse_network_designs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "warehouse_network_nodes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "design_id" TEXT NOT NULL,
    "node_type" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "is_existing" BOOLEAN NOT NULL DEFAULT true,
    "capacity" DOUBLE PRECISION,
    "fixed_cost" DECIMAL(19,4),
    "variable_cost" DECIMAL(19,4),

    CONSTRAINT "warehouse_network_nodes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "routing_rules" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "conditions" JSONB NOT NULL DEFAULT '[]',
    "action" JSONB NOT NULL DEFAULT '{}',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "routing_rules_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mfg_spc_charts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "chart_type" TEXT NOT NULL,
    "product_id" TEXT,
    "process_id" TEXT,
    "characteristic" TEXT,
    "measurement_unit" TEXT,
    "nominal_value" DOUBLE PRECISION,
    "ucl" DOUBLE PRECISION,
    "lcl" DOUBLE PRECISION,
    "usl" DOUBLE PRECISION,
    "lsl" DOUBLE PRECISION,
    "sample_size" INTEGER,
    "sampling_freq" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mfg_spc_charts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mfg_spc_data_points" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "chart_id" TEXT NOT NULL,
    "sample_no" INTEGER NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,
    "mean" DOUBLE PRECISION,
    "range" DOUBLE PRECISION,
    "stdDev" DOUBLE PRECISION,
    "out_of_control" BOOLEAN NOT NULL DEFAULT false,
    "violation_type" TEXT,
    "work_order_id" TEXT,
    "operator_id" TEXT,
    "measured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfg_spc_data_points_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mfg_cost_entries" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "cost_sheet_id" TEXT NOT NULL,
    "cost_type" TEXT NOT NULL,
    "description" TEXT,
    "quantity" DOUBLE PRECISION,
    "unit_cost" DECIMAL(19,4),
    "amount" DECIMAL(19,4) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "resource_id" TEXT,
    "resource_type" TEXT,
    "posted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfg_cost_entries_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mfg_maintenance_work_orders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "schedule_id" TEXT,
    "machine_id" TEXT NOT NULL,
    "work_order_no" TEXT NOT NULL,
    "maintenance_type" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "description" TEXT,
    "checklist" JSONB,
    "assigned_to" TEXT,
    "scheduled_date" TIMESTAMP(3),
    "started_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "parts_used" JSONB,
    "labor_hours" DOUBLE PRECISION,
    "cost" DECIMAL(19,4),
    "findings" TEXT,

    CONSTRAINT "mfg_maintenance_work_orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mfg_document_controls" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "doc_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "doc_type" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT 'A',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "content" TEXT,
    "file_url" TEXT,
    "owner" TEXT,
    "effective_date" TIMESTAMP(3),
    "obsolete_date" TIMESTAMP(3),
    "review_date" TIMESTAMP(3),
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "mfg_document_controls_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "mfg_document_versions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "doc_id" TEXT NOT NULL,
    "revision" TEXT NOT NULL,
    "changes" TEXT,
    "file_url" TEXT,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "mfg_document_versions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "programs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "org_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "budget" DECIMAL(15,2),
    "actual_spend" DECIMAL(15,2) DEFAULT 0,
    "strategic_alignment" TEXT,
    "sponsor_id" TEXT,
    "manager_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "programs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "program_projects" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "program_projects_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "program_benefits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "metric" TEXT,
    "target_value" DECIMAL(15,2),
    "actual_value" DECIMAL(15,2),
    "target_date" TIMESTAMP(3),
    "achieved_at" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'TRACKING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_benefits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "program_financials" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "program_id" TEXT NOT NULL,
    "fiscal_year" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(15,2) NOT NULL,
    "period" TEXT,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "program_financials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_claims" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "claim_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "claimType" TEXT NOT NULL DEFAULT 'CONTRACTUAL',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "claimed_amount" DECIMAL(15,2) NOT NULL,
    "approved_amount" DECIMAL(15,2),
    "settlement_amount" DECIMAL(15,2),
    "submitted_date" TIMESTAMP(3),
    "resolved_date" TIMESTAMP(3),
    "assignee_id" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_claims_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_discussions" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "is_pinned" BOOLEAN NOT NULL DEFAULT false,
    "is_resolved" BOOLEAN NOT NULL DEFAULT false,
    "tags" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_discussions_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_wiki_pages" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_published" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_wiki_pages_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_feed_events" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_feed_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_batches" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "batch_number" TEXT NOT NULL,
    "work_order_id" TEXT,
    "product_id" TEXT NOT NULL,
    "planned_qty" DOUBLE PRECISION NOT NULL,
    "actual_qty" DOUBLE PRECISION,
    "scrap_qty" DOUBLE PRECISION,
    "yield_pct" DOUBLE PRECISION,
    "expiry_date" TIMESTAMP(3),
    "manufacture_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "quarantined" BOOLEAN NOT NULL DEFAULT false,
    "released_by" TEXT,
    "released_at" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_batches_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_formulas" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "formula_code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "output_quantity" DOUBLE PRECISION NOT NULL,
    "output_unit" TEXT NOT NULL,
    "version" TEXT NOT NULL DEFAULT '1.0',
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "process_type" TEXT,
    "instructions" TEXT,
    "quality_checks" JSONB,
    "shelf_life" INTEGER,
    "storage_conditions" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "production_formulas_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_shifts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plant_id" TEXT,
    "shift_name" TEXT NOT NULL,
    "shift_date" TIMESTAMP(3) NOT NULL,
    "start_time" TEXT NOT NULL,
    "end_time" TEXT NOT NULL,
    "supervisor_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_shifts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "production_analytics_snapshots" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "plant_id" TEXT,
    "total_production" DOUBLE PRECISION,
    "target_production" DOUBLE PRECISION,
    "efficiency" DOUBLE PRECISION,
    "oee_avg" DOUBLE PRECISION,
    "scrap_rate" DOUBLE PRECISION,
    "rework_rate" DOUBLE PRECISION,
    "first_pass_yield" DOUBLE PRECISION,
    "downtime_hours" DOUBLE PRECISION,
    "energy_consumption" DOUBLE PRECISION,
    "labor_productivity" DOUBLE PRECISION,
    "cost_per_unit" DOUBLE PRECISION,
    "snapshot_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "production_analytics_snapshots_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_issue_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "issue_code" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "reported_by" TEXT,
    "assigned_to" TEXT,
    "due_date" TIMESTAMP(3),
    "resolution" TEXT,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_issue_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_templates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "industry" TEXT,
    "category" TEXT,
    "phases" JSONB,
    "tasks" JSONB,
    "risks" JSONB,
    "milestones" JSONB,
    "resources" JSONB,
    "budget" DECIMAL(19,4),
    "duration" INTEGER,
    "is_public" BOOLEAN NOT NULL DEFAULT false,
    "times_used" INTEGER NOT NULL DEFAULT 0,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_templates_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_stakeholders" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "organization" TEXT,
    "role" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "interest" TEXT NOT NULL DEFAULT 'MEDIUM',
    "influence" TEXT NOT NULL DEFAULT 'MEDIUM',
    "attitude" TEXT NOT NULL DEFAULT 'NEUTRAL',
    "engagement_plan" TEXT,
    "last_contact_date" TIMESTAMP(3),
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_stakeholders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_benefits" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "benefit_type" TEXT NOT NULL,
    "owner" TEXT,
    "measurement_kpi" TEXT,
    "baseline_value" DECIMAL(19,4),
    "target_value" DECIMAL(19,4),
    "actual_value" DECIMAL(19,4),
    "realization_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_benefits_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_meetings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "meeting_type" TEXT NOT NULL DEFAULT 'STATUS',
    "scheduled_at" TIMESTAMP(3) NOT NULL,
    "duration" INTEGER,
    "location" TEXT,
    "organizer" TEXT,
    "attendees" JSONB,
    "agenda" JSONB,
    "minutes" TEXT,
    "action_items" JSONB,
    "decisions" JSONB,
    "status" TEXT NOT NULL DEFAULT 'SCHEDULED',
    "recording_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_meetings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "project_subcontractors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "vendor_id" TEXT,
    "name" TEXT NOT NULL,
    "scope" TEXT,
    "contract_value" DECIMAL(19,4),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "performance_score" DOUBLE PRECISION,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_subcontractors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_portfolios" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'RESIDENTIAL',
    "target_roi" DECIMAL(65,30),
    "total_value" DECIMAL(65,30) DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_portfolios_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_buildings" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "total_floors" INTEGER NOT NULL DEFAULT 1,
    "total_units" INTEGER NOT NULL DEFAULT 0,
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "yearBuilt" INTEGER,
    "parking_spaces" INTEGER,
    "has_elevator" BOOLEAN NOT NULL DEFAULT false,
    "has_security" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_buildings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_units" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "unit_number" TEXT NOT NULL,
    "floor" INTEGER,
    "bedrooms" INTEGER NOT NULL DEFAULT 0,
    "bathrooms" INTEGER NOT NULL DEFAULT 0,
    "sqft" INTEGER NOT NULL DEFAULT 0,
    "rent_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "deposit_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "market_value" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'VACANT',
    "features" JSONB NOT NULL DEFAULT '[]',
    "images" JSONB NOT NULL DEFAULT '[]',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_units_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_lease_payments" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "amount" DECIMAL(65,30) NOT NULL,
    "paid_amount" DECIMAL(65,30),
    "due_date" TIMESTAMP(3) NOT NULL,
    "paid_date" TIMESTAMP(3),
    "method" TEXT NOT NULL DEFAULT 'BANK_TRANSFER',
    "reference" TEXT,
    "period_start" TIMESTAMP(3),
    "period_end" TIMESTAMP(3),
    "late_fee" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "discount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "notes" TEXT,
    "receipt_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_lease_payments_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_maintenance_vendors" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contact_name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "specialties" JSONB NOT NULL DEFAULT '[]',
    "rating" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "license_number" TEXT,
    "insurance_info" TEXT,
    "hourly_rate" DECIMAL(65,30),
    "response_time" INTEGER,
    "is_preferred" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "contract_start" TIMESTAMP(3),
    "contract_end" TIMESTAMP(3),
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_maintenance_vendors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_commission_plans" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "agent_name" TEXT NOT NULL,
    "agent_email" TEXT,
    "agent_phone" TEXT,
    "agent_license" TEXT,
    "property_id" TEXT,
    "propertyTier" TEXT NOT NULL DEFAULT 'STANDARD',
    "commission_rate" DECIMAL(65,30) NOT NULL DEFAULT 3.0,
    "splitType" TEXT NOT NULL DEFAULT 'EQUAL',
    "splits" JSONB NOT NULL DEFAULT '[]',
    "base_amount" DECIMAL(65,30),
    "max_cap" DECIMAL(65,30),
    "terms" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_commission_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_commission_payouts" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "agent_name" TEXT NOT NULL,
    "deal_name" TEXT,
    "deal_value" DECIMAL(65,30),
    "amount" DECIMAL(65,30) NOT NULL,
    "commission_rate" DECIMAL(65,30) DEFAULT 0,
    "split_ratio" DECIMAL(65,30) NOT NULL DEFAULT 100,
    "split_amount" DECIMAL(65,30),
    "general_ledger_ref" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "payment_date" TIMESTAMP(3),
    "payment_method" TEXT,
    "invoice_ref" TEXT,
    "notes" TEXT,
    "paid_to" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_commission_payouts_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_valuations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "valuation_date" TIMESTAMP(3) NOT NULL,
    "appraised_value" DECIMAL(65,30) NOT NULL,
    "market_value" DECIMAL(65,30),
    "assessed_value" DECIMAL(65,30),
    "method" TEXT NOT NULL DEFAULT 'COMPARABLE',
    "appraiser" TEXT,
    "appraiser_license" TEXT,
    "condition_score" INTEGER,
    "location_score" INTEGER,
    "cap_rate" DECIMAL(65,30),
    "noi" DECIMAL(65,30),
    "adjustments" JSONB NOT NULL DEFAULT '{}',
    "comparableSales" JSONB NOT NULL DEFAULT '[]',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_valuations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_maintenance_requests" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "lease_id" TEXT,
    "requested_by" TEXT,
    "requested_name" TEXT,
    "requested_email" TEXT,
    "requested_phone" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL DEFAULT 'GENERAL',
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "vendor_id" TEXT,
    "assigned_to" TEXT,
    "estimated_cost" DECIMAL(65,30),
    "actual_cost" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "scheduled_date" TIMESTAMP(3),
    "completed_date" TIMESTAMP(3),
    "partsUsed" JSONB NOT NULL DEFAULT '[]',
    "images" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "resolution" TEXT,
    "is_billable" BOOLEAN NOT NULL DEFAULT true,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_maintenance_requests_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_lease_renewals" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "tenant_name" TEXT NOT NULL,
    "tenant_email" TEXT,
    "current_rent" DECIMAL(65,30) NOT NULL,
    "proposed_rent" DECIMAL(65,30) NOT NULL,
    "rent_change_percent" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "renewal_term_months" INTEGER NOT NULL DEFAULT 12,
    "current_end_date" TIMESTAMP(3) NOT NULL,
    "proposed_start_date" TIMESTAMP(3) NOT NULL,
    "proposed_end_date" TIMESTAMP(3) NOT NULL,
    "escalation_rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "concession_amount" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "executed_at" TIMESTAMP(3),
    "documents" JSONB NOT NULL DEFAULT '[]',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_lease_renewals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_rent_escalations" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "unit_id" TEXT,
    "schedule_name" TEXT NOT NULL,
    "escalationType" TEXT NOT NULL DEFAULT 'PERCENTAGE',
    "escalation_rate" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "frequency_months" INTEGER NOT NULL DEFAULT 12,
    "next_escalation_date" TIMESTAMP(3),
    "last_escalation_date" TIMESTAMP(3),
    "cap_rate" DECIMAL(65,30),
    "floor_rate" DECIMAL(65,30),
    "base_rent" DECIMAL(65,30) NOT NULL,
    "current_rent" DECIMAL(65,30) NOT NULL,
    "cpi_index_name" TEXT,
    "cpi_current_value" DECIMAL(65,30),
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_rent_escalations_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_property_financials" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "gross_rent_income" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "other_income" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_income" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "vacancy_loss" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "effective_income" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "operating_expenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "repairs_maintenance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "property_management" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "insurance" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "taxes" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "utilities" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "hoa_fees" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "other_expenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "total_expenses" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "net_operating_income" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "debt_service" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cash_flow_before_tax" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "capital_expenditures" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "net_cash_flow" DECIMAL(65,30) NOT NULL DEFAULT 0,
    "cap_rate" DECIMAL(65,30),
    "cash_on_cash_return" DECIMAL(65,30),
    "occupancy_rate" DECIMAL(65,30),
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_property_financials_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_expense_categories" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OPERATING',
    "is_tax_deductible" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "real_estate_expense_categories_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_property_inspections" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "inspector_id" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'MOVE_IN',
    "checklist" JSONB NOT NULL DEFAULT '[]',
    "passed" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "inspected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "real_estate_property_inspections_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_rent_collection_logs" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "lease_id" TEXT NOT NULL,
    "tenant_user" TEXT NOT NULL,
    "amount_paid" DECIMAL(15,2) NOT NULL,
    "payment_method" TEXT NOT NULL,
    "transaction_ref" TEXT,
    "paid_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "late_fee" DECIMAL(15,2) NOT NULL DEFAULT 0,

    CONSTRAINT "real_estate_rent_collection_logs_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "real_estate_listing_syndicates" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "property_id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "external_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "last_synced_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "real_estate_listing_syndicates_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "document_categories_tenant_id_idx" ON "document_categories"("tenant_id");

CREATE INDEX "document_categories_parent_id_idx" ON "document_categories"("parent_id");

CREATE INDEX "document_approvals_tenant_id_idx" ON "document_approvals"("tenant_id");

CREATE INDEX "document_approvals_document_id_idx" ON "document_approvals"("document_id");

CREATE INDEX "document_approvals_approver_id_idx" ON "document_approvals"("approver_id");

CREATE INDEX "knowledge_articles_tenant_id_idx" ON "knowledge_articles"("tenant_id");

CREATE INDEX "knowledge_articles_tenant_id_status_idx" ON "knowledge_articles"("tenant_id", "status");

CREATE INDEX "knowledge_articles_tenant_id_category_id_idx" ON "knowledge_articles"("tenant_id", "category_id");

CREATE UNIQUE INDEX "knowledge_articles_tenant_id_slug_key" ON "knowledge_articles"("tenant_id", "slug");

CREATE INDEX "knowledge_categories_tenant_id_idx" ON "knowledge_categories"("tenant_id");

CREATE INDEX "knowledge_categories_tenant_id_parent_id_idx" ON "knowledge_categories"("tenant_id", "parent_id");

CREATE UNIQUE INDEX "knowledge_categories_tenant_id_slug_key" ON "knowledge_categories"("tenant_id", "slug");

CREATE INDEX "knowledge_article_versions_tenant_id_article_id_idx" ON "knowledge_article_versions"("tenant_id", "article_id");

CREATE UNIQUE INDEX "knowledge_article_versions_tenant_id_article_id_version_key" ON "knowledge_article_versions"("tenant_id", "article_id", "version");

CREATE INDEX "knowledge_article_ratings_tenant_id_article_id_idx" ON "knowledge_article_ratings"("tenant_id", "article_id");

CREATE UNIQUE INDEX "knowledge_article_ratings_tenant_id_article_id_user_id_key" ON "knowledge_article_ratings"("tenant_id", "article_id", "user_id");

CREATE INDEX "helpdesk_tickets_tenant_id_idx" ON "helpdesk_tickets"("tenant_id");

CREATE INDEX "helpdesk_tickets_tenant_id_status_idx" ON "helpdesk_tickets"("tenant_id", "status");

CREATE INDEX "helpdesk_tickets_tenant_id_assigned_to_idx" ON "helpdesk_tickets"("tenant_id", "assigned_to");

CREATE INDEX "helpdesk_tickets_tenant_id_priority_idx" ON "helpdesk_tickets"("tenant_id", "priority");

CREATE INDEX "ticket_comments_tenant_id_ticket_id_idx" ON "ticket_comments"("tenant_id", "ticket_id");

CREATE UNIQUE INDEX "canned_responses_shortcut_key" ON "canned_responses"("shortcut");

CREATE INDEX "canned_responses_tenant_id_idx" ON "canned_responses"("tenant_id");

CREATE UNIQUE INDEX "ticket_slas_ticket_id_key" ON "ticket_slas"("ticket_id");

CREATE INDEX "ticket_slas_tenant_id_idx" ON "ticket_slas"("tenant_id");

CREATE UNIQUE INDEX "customer_satisfaction_ticket_id_key" ON "customer_satisfaction"("ticket_id");

CREATE INDEX "customer_satisfaction_tenant_id_idx" ON "customer_satisfaction"("tenant_id");

CREATE INDEX "omnichannel_conversations_tenant_id_idx" ON "omnichannel_conversations"("tenant_id");

CREATE INDEX "omnichannel_conversations_tenant_id_status_idx" ON "omnichannel_conversations"("tenant_id", "status");

CREATE INDEX "omnichannel_conversations_tenant_id_assigned_to_idx" ON "omnichannel_conversations"("tenant_id", "assigned_to");

CREATE INDEX "omnichannel_conversations_tenant_id_platform_idx" ON "omnichannel_conversations"("tenant_id", "platform");

CREATE INDEX "conversation_messages_tenant_id_conversation_id_idx" ON "conversation_messages"("tenant_id", "conversation_id");

CREATE INDEX "channel_integrations_tenant_id_idx" ON "channel_integrations"("tenant_id");

CREATE UNIQUE INDEX "channel_integrations_tenant_id_platform_name_key" ON "channel_integrations"("tenant_id", "platform", "name");

CREATE INDEX "breakout_rooms_tenant_id_meeting_id_idx" ON "breakout_rooms"("tenant_id", "meeting_id");

CREATE INDEX "meeting_analytics_tenant_id_idx" ON "meeting_analytics"("tenant_id");

CREATE UNIQUE INDEX "meeting_analytics_tenant_id_meeting_id_key" ON "meeting_analytics"("tenant_id", "meeting_id");

CREATE INDEX "voip_calls_tenant_id_idx" ON "voip_calls"("tenant_id");

CREATE INDEX "voip_calls_tenant_id_status_idx" ON "voip_calls"("tenant_id", "status");

CREATE INDEX "voip_calls_tenant_id_assigned_to_idx" ON "voip_calls"("tenant_id", "assigned_to");

CREATE INDEX "voip_calls_tenant_id_caller_number_idx" ON "voip_calls"("tenant_id", "caller_number");

CREATE UNIQUE INDEX "voip_call_analytics_call_id_key" ON "voip_call_analytics"("call_id");

CREATE INDEX "voip_call_analytics_tenant_id_idx" ON "voip_call_analytics"("tenant_id");

CREATE INDEX "voicemails_tenant_id_idx" ON "voicemails"("tenant_id");

CREATE INDEX "voicemails_tenant_id_is_read_idx" ON "voicemails"("tenant_id", "is_read");

CREATE INDEX "ivr_menus_tenant_id_idx" ON "ivr_menus"("tenant_id");

CREATE INDEX "ivr_options_tenant_id_menu_id_idx" ON "ivr_options"("tenant_id", "menu_id");

CREATE UNIQUE INDEX "ivr_options_tenant_id_menu_id_digit_key" ON "ivr_options"("tenant_id", "menu_id", "digit");

CREATE INDEX "saved_searches_tenant_id_user_id_idx" ON "saved_searches"("tenant_id", "user_id");

CREATE UNIQUE INDEX "saved_searches_tenant_id_user_id_name_key" ON "saved_searches"("tenant_id", "user_id", "name");

CREATE INDEX "search_history_tenant_id_user_id_idx" ON "search_history"("tenant_id", "user_id");

CREATE INDEX "synonym_dictionaries_tenant_id_idx" ON "synonym_dictionaries"("tenant_id");

CREATE UNIQUE INDEX "synonym_dictionaries_tenant_id_term_key" ON "synonym_dictionaries"("tenant_id", "term");

CREATE INDEX "collab_documents_tenant_id_idx" ON "collab_documents"("tenant_id");

CREATE INDEX "collab_documents_tenant_id_owner_id_idx" ON "collab_documents"("tenant_id", "owner_id");

CREATE INDEX "collab_document_versions_tenant_id_document_id_idx" ON "collab_document_versions"("tenant_id", "document_id");

CREATE UNIQUE INDEX "collab_document_versions_tenant_id_document_id_version_key" ON "collab_document_versions"("tenant_id", "document_id", "version");

CREATE INDEX "whiteboards_tenant_id_idx" ON "whiteboards"("tenant_id");

CREATE INDEX "whiteboards_tenant_id_owner_id_idx" ON "whiteboards"("tenant_id", "owner_id");

CREATE INDEX "whiteboard_elements_tenant_id_whiteboard_id_idx" ON "whiteboard_elements"("tenant_id", "whiteboard_id");

CREATE INDEX "comm_surveys_tenant_id_idx" ON "comm_surveys"("tenant_id");

CREATE INDEX "comm_surveys_tenant_id_status_idx" ON "comm_surveys"("tenant_id", "status");

CREATE INDEX "comm_survey_questions_tenant_id_survey_id_idx" ON "comm_survey_questions"("tenant_id", "survey_id");

CREATE INDEX "comm_survey_responses_tenant_id_survey_id_idx" ON "comm_survey_responses"("tenant_id", "survey_id");

CREATE INDEX "comm_survey_answers_tenant_id_response_id_idx" ON "comm_survey_answers"("tenant_id", "response_id");

CREATE UNIQUE INDEX "comm_survey_answers_tenant_id_response_id_question_id_key" ON "comm_survey_answers"("tenant_id", "response_id", "question_id");

CREATE INDEX "comm_survey_templates_tenant_id_idx" ON "comm_survey_templates"("tenant_id");

CREATE INDEX "learning_courses_tenant_id_category_idx" ON "learning_courses"("tenant_id", "category");

CREATE INDEX "learning_modules_tenant_id_course_id_idx" ON "learning_modules"("tenant_id", "course_id");

CREATE INDEX "learning_enrollments_tenant_id_employee_id_idx" ON "learning_enrollments"("tenant_id", "employee_id");

CREATE UNIQUE INDEX "learning_enrollments_tenant_id_course_id_employee_id_key" ON "learning_enrollments"("tenant_id", "course_id", "employee_id");

CREATE INDEX "certifications_tenant_id_employee_id_idx" ON "certifications"("tenant_id", "employee_id");

CREATE INDEX "skill_matrices_tenant_id_category_idx" ON "skill_matrices"("tenant_id", "category");

CREATE INDEX "skill_gap_analyses_tenant_id_employee_id_idx" ON "skill_gap_analyses"("tenant_id", "employee_id");

CREATE UNIQUE INDEX "skill_gap_analyses_tenant_id_employee_id_skill_id_key" ON "skill_gap_analyses"("tenant_id", "employee_id", "skill_id");

CREATE INDEX "career_paths_tenant_id_idx" ON "career_paths"("tenant_id");

CREATE INDEX "career_path_requirements_tenant_id_career_path_id_idx" ON "career_path_requirements"("tenant_id", "career_path_id");

CREATE UNIQUE INDEX "career_path_requirements_tenant_id_career_path_id_skill_id_key" ON "career_path_requirements"("tenant_id", "career_path_id", "skill_id");

CREATE INDEX "mentoring_programs_tenant_id_status_idx" ON "mentoring_programs"("tenant_id", "status");

CREATE INDEX "mentoring_sessions_tenant_id_program_id_idx" ON "mentoring_sessions"("tenant_id", "program_id");

CREATE INDEX "mentoring_sessions_tenant_id_mentor_id_idx" ON "mentoring_sessions"("tenant_id", "mentor_id");

CREATE INDEX "mentoring_sessions_tenant_id_mentee_id_idx" ON "mentoring_sessions"("tenant_id", "mentee_id");

CREATE INDEX "bonus_plans_tenant_id_plan_type_idx" ON "bonus_plans"("tenant_id", "plan_type");

CREATE INDEX "bonus_payouts_tenant_id_plan_id_idx" ON "bonus_payouts"("tenant_id", "plan_id");

CREATE INDEX "bonus_payouts_tenant_id_employee_id_idx" ON "bonus_payouts"("tenant_id", "employee_id");

CREATE INDEX "equity_grants_tenant_id_employee_id_idx" ON "equity_grants"("tenant_id", "employee_id");

CREATE INDEX "equity_vesting_schedules_tenant_id_grant_id_idx" ON "equity_vesting_schedules"("tenant_id", "grant_id");

CREATE INDEX "benefits_eligibility_rules_tenant_id_benefit_type_idx" ON "benefits_eligibility_rules"("tenant_id", "benefit_type");

CREATE UNIQUE INDEX "flexible_benefit_credits_tenant_id_employee_id_fiscal_year_key" ON "flexible_benefit_credits"("tenant_id", "employee_id", "fiscal_year");

CREATE INDEX "compensation_reviews_tenant_id_employee_id_idx" ON "compensation_reviews"("tenant_id", "employee_id");

CREATE INDEX "compensation_reviews_tenant_id_review_cycle_idx" ON "compensation_reviews"("tenant_id", "review_cycle");

CREATE INDEX "compensation_benchmarks_tenant_id_position_title_idx" ON "compensation_benchmarks"("tenant_id", "position_title");

CREATE INDEX "total_rewards_statements_tenant_id_employee_id_idx" ON "total_rewards_statements"("tenant_id", "employee_id");

CREATE INDEX "dispute_resolutions_tenant_id_status_idx" ON "dispute_resolutions"("tenant_id", "status");

CREATE INDEX "background_check_requests_tenant_id_status_idx" ON "background_check_requests"("tenant_id", "status");

CREATE INDEX "visa_records_tenant_id_employee_id_idx" ON "visa_records"("tenant_id", "employee_id");

CREATE INDEX "visa_records_tenant_id_status_idx" ON "visa_records"("tenant_id", "status");

CREATE INDEX "immigration_documents_tenant_id_employee_id_idx" ON "immigration_documents"("tenant_id", "employee_id");

CREATE INDEX "wellness_activities_tenant_id_program_id_idx" ON "wellness_activities"("tenant_id", "program_id");

CREATE INDEX "wellness_activities_tenant_id_employee_id_idx" ON "wellness_activities"("tenant_id", "employee_id");

CREATE INDEX "dei_metrics_tenant_id_category_fiscal_year_idx" ON "dei_metrics"("tenant_id", "category", "fiscal_year");

CREATE INDEX "dei_metrics_tenant_id_metric_name_period_idx" ON "dei_metrics"("tenant_id", "metric_name", "period");

CREATE INDEX "dei_reports_tenant_id_report_type_fiscal_year_idx" ON "dei_reports"("tenant_id", "report_type", "fiscal_year");

CREATE INDEX "turnover_predictions_tenant_id_risk_level_idx" ON "turnover_predictions"("tenant_id", "risk_level");

CREATE UNIQUE INDEX "turnover_predictions_tenant_id_employee_id_key" ON "turnover_predictions"("tenant_id", "employee_id");

CREATE INDEX "compliance_requirements_tenant_id_regulation_idx" ON "compliance_requirements"("tenant_id", "regulation");

CREATE INDEX "hr_compliance_reports_tenant_id_requirement_id_idx" ON "hr_compliance_reports"("tenant_id", "requirement_id");

CREATE INDEX "hr_compliance_reports_tenant_id_status_idx" ON "hr_compliance_reports"("tenant_id", "status");

CREATE INDEX "wellness_challenges_tenant_id_challenge_type_idx" ON "wellness_challenges"("tenant_id", "challenge_type");

CREATE INDEX "wellness_leaderboards_tenant_id_challenge_id_idx" ON "wellness_leaderboards"("tenant_id", "challenge_id");

CREATE INDEX "enp_surveys_tenant_id_surveyType_idx" ON "enp_surveys"("tenant_id", "surveyType");

CREATE INDEX "enp_surveys_tenant_id_start_date_end_date_idx" ON "enp_surveys"("tenant_id", "start_date", "end_date");

CREATE INDEX "pulse_surveys_tenant_id_department_id_idx" ON "pulse_surveys"("tenant_id", "department_id");

CREATE INDEX "alumni_records_tenant_id_is_active_alumni_idx" ON "alumni_records"("tenant_id", "is_active_alumni");

CREATE UNIQUE INDEX "alumni_records_tenant_id_employee_id_key" ON "alumni_records"("tenant_id", "employee_id");

CREATE INDEX "alumni_events_tenant_id_event_date_idx" ON "alumni_events"("tenant_id", "event_date");

CREATE INDEX "alumni_event_attendees_tenant_id_event_id_idx" ON "alumni_event_attendees"("tenant_id", "event_id");

CREATE UNIQUE INDEX "alumni_event_attendees_tenant_id_event_id_alumni_id_key" ON "alumni_event_attendees"("tenant_id", "event_id", "alumni_id");

CREATE INDEX "storage_folders_tenant_id_idx" ON "storage_folders"("tenant_id");

CREATE INDEX "storage_folders_parent_id_idx" ON "storage_folders"("parent_id");

CREATE INDEX "storage_file_versions_tenant_id_file_id_idx" ON "storage_file_versions"("tenant_id", "file_id");

CREATE UNIQUE INDEX "storage_share_links_token_key" ON "storage_share_links"("token");

CREATE INDEX "storage_share_links_tenant_id_idx" ON "storage_share_links"("tenant_id");

CREATE INDEX "storage_share_links_file_id_idx" ON "storage_share_links"("file_id");

CREATE INDEX "storage_share_links_token_idx" ON "storage_share_links"("token");

CREATE UNIQUE INDEX "storage_quotas_tenant_id_key" ON "storage_quotas"("tenant_id");

CREATE INDEX "api_key_scopes_tenant_id_idx" ON "api_key_scopes"("tenant_id");

CREATE INDEX "api_key_scopes_api_key_id_idx" ON "api_key_scopes"("api_key_id");

CREATE INDEX "api_usage_metrics_tenant_id_idx" ON "api_usage_metrics"("tenant_id");

CREATE INDEX "api_usage_metrics_api_key_id_idx" ON "api_usage_metrics"("api_key_id");

CREATE INDEX "api_usage_metrics_created_at_idx" ON "api_usage_metrics"("created_at");

CREATE INDEX "endpoint_registries_tenant_id_idx" ON "endpoint_registries"("tenant_id");

CREATE INDEX "endpoint_registries_tenant_id_module_idx" ON "endpoint_registries"("tenant_id", "module");

CREATE UNIQUE INDEX "endpoint_registries_tenant_id_path_method_key" ON "endpoint_registries"("tenant_id", "path", "method");

CREATE INDEX "locales_tenant_id_idx" ON "locales"("tenant_id");

CREATE UNIQUE INDEX "locales_tenant_id_code_key" ON "locales"("tenant_id", "code");

CREATE INDEX "translation_keys_tenant_id_idx" ON "translation_keys"("tenant_id");

CREATE INDEX "translation_keys_tenant_id_module_idx" ON "translation_keys"("tenant_id", "module");

CREATE UNIQUE INDEX "translation_keys_tenant_id_key_key" ON "translation_keys"("tenant_id", "key");

CREATE INDEX "translation_entries_tenant_id_idx" ON "translation_entries"("tenant_id");

CREATE INDEX "translation_entries_locale_id_idx" ON "translation_entries"("locale_id");

CREATE INDEX "translation_entries_key_id_idx" ON "translation_entries"("key_id");

CREATE UNIQUE INDEX "translation_entries_tenant_id_locale_id_key_id_key" ON "translation_entries"("tenant_id", "locale_id", "key_id");

CREATE INDEX "translation_imports_tenant_id_idx" ON "translation_imports"("tenant_id");

CREATE INDEX "locale_formatting_rules_tenant_id_idx" ON "locale_formatting_rules"("tenant_id");

CREATE UNIQUE INDEX "locale_formatting_rules_tenant_id_locale_id_key" ON "locale_formatting_rules"("tenant_id", "locale_id");

CREATE INDEX "advanced_forms_tenant_id_idx" ON "advanced_forms"("tenant_id");

CREATE UNIQUE INDEX "advanced_forms_tenant_id_slug_key" ON "advanced_forms"("tenant_id", "slug");

CREATE INDEX "form_conditions_tenant_id_form_id_idx" ON "form_conditions"("tenant_id", "form_id");

CREATE INDEX "form_calculated_fields_tenant_id_form_id_idx" ON "form_calculated_fields"("tenant_id", "form_id");

CREATE INDEX "form_pages_tenant_id_form_id_idx" ON "form_pages"("tenant_id", "form_id");

CREATE INDEX "form_versions_tenant_id_form_id_idx" ON "form_versions"("tenant_id", "form_id");

CREATE UNIQUE INDEX "form_versions_tenant_id_form_id_version_key" ON "form_versions"("tenant_id", "form_id", "version");

CREATE INDEX "bpmn_process_definitions_tenant_id_idx" ON "bpmn_process_definitions"("tenant_id");

CREATE UNIQUE INDEX "bpmn_process_definitions_tenant_id_key_key" ON "bpmn_process_definitions"("tenant_id", "key");

CREATE INDEX "bpmn_process_instances_tenant_id_definition_id_idx" ON "bpmn_process_instances"("tenant_id", "definition_id");

CREATE INDEX "bpmn_process_instances_tenant_id_status_idx" ON "bpmn_process_instances"("tenant_id", "status");

CREATE INDEX "bpmn_activity_instances_tenant_id_instance_id_idx" ON "bpmn_activity_instances"("tenant_id", "instance_id");

CREATE INDEX "bpmn_timer_definitions_tenant_id_definition_id_idx" ON "bpmn_timer_definitions"("tenant_id", "definition_id");

CREATE INDEX "api_endpoints_tenant_id_idx" ON "api_endpoints"("tenant_id");

CREATE UNIQUE INDEX "api_endpoints_tenant_id_path_method_key" ON "api_endpoints"("tenant_id", "path", "method");

CREATE INDEX "api_endpoint_mappings_tenant_id_endpoint_id_idx" ON "api_endpoint_mappings"("tenant_id", "endpoint_id");

CREATE INDEX "api_test_runs_tenant_id_endpoint_id_idx" ON "api_test_runs"("tenant_id", "endpoint_id");

CREATE INDEX "api_test_results_tenant_id_run_id_idx" ON "api_test_results"("tenant_id", "run_id");

CREATE INDEX "decision_tables_tenant_id_idx" ON "decision_tables"("tenant_id");

CREATE UNIQUE INDEX "decision_tables_tenant_id_name_key" ON "decision_tables"("tenant_id", "name");

CREATE INDEX "decision_table_rules_tenant_id_table_id_idx" ON "decision_table_rules"("tenant_id", "table_id");

CREATE INDEX "rule_sets_tenant_id_idx" ON "rule_sets"("tenant_id");

CREATE UNIQUE INDEX "rule_sets_tenant_id_name_key" ON "rule_sets"("tenant_id", "name");

CREATE INDEX "rule_definitions_tenant_id_rule_set_id_idx" ON "rule_definitions"("tenant_id", "rule_set_id");

CREATE INDEX "rule_evaluation_logs_tenant_id_rule_set_id_idx" ON "rule_evaluation_logs"("tenant_id", "rule_set_id");

CREATE INDEX "etl_data_sources_tenant_id_idx" ON "etl_data_sources"("tenant_id");

CREATE UNIQUE INDEX "etl_data_sources_tenant_id_name_key" ON "etl_data_sources"("tenant_id", "name");

CREATE INDEX "etl_pipelines_tenant_id_idx" ON "etl_pipelines"("tenant_id");

CREATE UNIQUE INDEX "etl_pipelines_tenant_id_name_key" ON "etl_pipelines"("tenant_id", "name");

CREATE INDEX "etl_mappings_tenant_id_pipeline_id_idx" ON "etl_mappings"("tenant_id", "pipeline_id");

CREATE INDEX "etl_job_runs_tenant_id_pipeline_id_idx" ON "etl_job_runs"("tenant_id", "pipeline_id");

CREATE INDEX "etl_job_runs_tenant_id_status_idx" ON "etl_job_runs"("tenant_id", "status");

CREATE INDEX "mobile_apps_tenant_id_idx" ON "mobile_apps"("tenant_id");

CREATE UNIQUE INDEX "mobile_apps_tenant_id_slug_key" ON "mobile_apps"("tenant_id", "slug");

CREATE INDEX "mobile_screens_tenant_id_app_id_idx" ON "mobile_screens"("tenant_id", "app_id");

CREATE INDEX "mobile_notification_configs_tenant_id_app_id_idx" ON "mobile_notification_configs"("tenant_id", "app_id");

CREATE INDEX "mobile_builds_tenant_id_app_id_idx" ON "mobile_builds"("tenant_id", "app_id");

CREATE INDEX "theme_configs_tenant_id_idx" ON "theme_configs"("tenant_id");

CREATE UNIQUE INDEX "theme_configs_tenant_id_slug_key" ON "theme_configs"("tenant_id", "slug");

CREATE INDEX "design_tokens_tenant_id_theme_id_idx" ON "design_tokens"("tenant_id", "theme_id");

CREATE UNIQUE INDEX "design_tokens_tenant_id_theme_id_name_key" ON "design_tokens"("tenant_id", "theme_id", "name");

CREATE INDEX "token_values_tenant_id_token_id_idx" ON "token_values"("tenant_id", "token_id");

CREATE UNIQUE INDEX "token_values_tenant_id_token_id_mode_key" ON "token_values"("tenant_id", "token_id", "mode");

CREATE INDEX "theme_snapshots_tenant_id_theme_id_idx" ON "theme_snapshots"("tenant_id", "theme_id");

CREATE UNIQUE INDEX "theme_snapshots_tenant_id_theme_id_version_key" ON "theme_snapshots"("tenant_id", "theme_id", "version");

CREATE INDEX "ab_tests_tenant_id_idx" ON "ab_tests"("tenant_id");

CREATE INDEX "ab_test_variants_tenant_id_test_id_idx" ON "ab_test_variants"("tenant_id", "test_id");

CREATE UNIQUE INDEX "ab_test_variants_tenant_id_test_id_name_key" ON "ab_test_variants"("tenant_id", "test_id", "name");

CREATE INDEX "audience_segments_tenant_id_idx" ON "audience_segments"("tenant_id");

CREATE UNIQUE INDEX "audience_segments_tenant_id_name_key" ON "audience_segments"("tenant_id", "name");

CREATE INDEX "segment_rules_tenant_id_segment_id_idx" ON "segment_rules"("tenant_id", "segment_id");

CREATE INDEX "personalization_rules_tenant_id_idx" ON "personalization_rules"("tenant_id");

CREATE INDEX "marketplace_app_versions_app_id_idx" ON "marketplace_app_versions"("app_id");

CREATE UNIQUE INDEX "marketplace_app_versions_app_id_version_key" ON "marketplace_app_versions"("app_id", "version");

CREATE INDEX "marketplace_developer_submissions_tenant_id_idx" ON "marketplace_developer_submissions"("tenant_id");

CREATE INDEX "marketplace_developer_submissions_status_idx" ON "marketplace_developer_submissions"("status");

CREATE INDEX "marketplace_analytics_app_id_idx" ON "marketplace_analytics"("app_id");

CREATE INDEX "marketplace_analytics_date_idx" ON "marketplace_analytics"("date");

CREATE UNIQUE INDEX "marketplace_analytics_app_id_date_key" ON "marketplace_analytics"("app_id", "date");

CREATE INDEX "fixed_asset_disposals_tenant_id_idx" ON "fixed_asset_disposals"("tenant_id");

CREATE INDEX "fixed_asset_disposals_asset_id_idx" ON "fixed_asset_disposals"("asset_id");

CREATE INDEX "fixed_asset_audit_logs_tenant_id_idx" ON "fixed_asset_audit_logs"("tenant_id");

CREATE INDEX "fixed_asset_audit_logs_asset_id_idx" ON "fixed_asset_audit_logs"("asset_id");

CREATE INDEX "blockchain_smart_contracts_tenant_id_idx" ON "blockchain_smart_contracts"("tenant_id");

CREATE INDEX "blockchain_smart_contracts_address_idx" ON "blockchain_smart_contracts"("address");

CREATE INDEX "blockchain_audit_trails_tenant_id_idx" ON "blockchain_audit_trails"("tenant_id");

CREATE INDEX "blockchain_audit_trails_tenant_id_entity_type_entity_id_idx" ON "blockchain_audit_trails"("tenant_id", "entity_type", "entity_id");

CREATE INDEX "blockchain_audit_trails_transaction_hash_idx" ON "blockchain_audit_trails"("transaction_hash");

CREATE INDEX "blockchain_network_health_network_last_checked_at_idx" ON "blockchain_network_health"("network", "last_checked_at");

CREATE UNIQUE INDEX "blockchain_network_health_network_key" ON "blockchain_network_health"("network");

CREATE INDEX "blockchain_transaction_explorers_tenant_id_idx" ON "blockchain_transaction_explorers"("tenant_id");

CREATE INDEX "blockchain_transaction_explorers_transaction_hash_idx" ON "blockchain_transaction_explorers"("transaction_hash");

CREATE INDEX "blockchain_transaction_explorers_tenant_id_from_address_idx" ON "blockchain_transaction_explorers"("tenant_id", "from_address");

CREATE INDEX "blockchain_transaction_explorers_tenant_id_to_address_idx" ON "blockchain_transaction_explorers"("tenant_id", "to_address");

CREATE INDEX "blockchain_transaction_explorers_tenant_id_status_idx" ON "blockchain_transaction_explorers"("tenant_id", "status");

CREATE INDEX "agile_sprints_tenant_id_idx" ON "agile_sprints"("tenant_id");

CREATE INDEX "agile_sprints_project_id_idx" ON "agile_sprints"("project_id");

CREATE INDEX "agile_backlog_items_tenant_id_idx" ON "agile_backlog_items"("tenant_id");

CREATE INDEX "agile_backlog_items_project_id_idx" ON "agile_backlog_items"("project_id");

CREATE INDEX "agile_backlog_items_sprint_id_idx" ON "agile_backlog_items"("sprint_id");

CREATE INDEX "agile_sprint_items_tenant_id_idx" ON "agile_sprint_items"("tenant_id");

CREATE INDEX "agile_sprint_items_sprint_id_idx" ON "agile_sprint_items"("sprint_id");

CREATE UNIQUE INDEX "agile_sprint_items_tenant_id_sprint_id_backlog_item_id_key" ON "agile_sprint_items"("tenant_id", "sprint_id", "backlog_item_id");

CREATE INDEX "agile_retrospectives_tenant_id_idx" ON "agile_retrospectives"("tenant_id");

CREATE INDEX "agile_retrospectives_sprint_id_idx" ON "agile_retrospectives"("sprint_id");

CREATE INDEX "skill_catalog_tenant_id_idx" ON "skill_catalog"("tenant_id");

CREATE UNIQUE INDEX "skill_catalog_tenant_id_name_key" ON "skill_catalog"("tenant_id", "name");

CREATE INDEX "evm_forecasts_tenant_id_idx" ON "evm_forecasts"("tenant_id");

CREATE INDEX "evm_forecasts_project_id_idx" ON "evm_forecasts"("project_id");

CREATE INDEX "evm_kpi_targets_tenant_id_idx" ON "evm_kpi_targets"("tenant_id");

CREATE UNIQUE INDEX "evm_kpi_targets_tenant_id_project_id_kpi_key" ON "evm_kpi_targets"("tenant_id", "project_id", "kpi");

CREATE INDEX "evm_snapshots_tenant_id_idx" ON "evm_snapshots"("tenant_id");

CREATE INDEX "evm_snapshots_project_id_idx" ON "evm_snapshots"("project_id");

CREATE INDEX "capex_projects_tenant_id_idx" ON "capex_projects"("tenant_id");

CREATE UNIQUE INDEX "capex_projects_tenant_id_org_id_code_key" ON "capex_projects"("tenant_id", "org_id", "code");

CREATE INDEX "capex_budget_lines_tenant_id_idx" ON "capex_budget_lines"("tenant_id");

CREATE INDEX "capex_budget_lines_capex_id_idx" ON "capex_budget_lines"("capex_id");

CREATE INDEX "capex_gate_reviews_tenant_id_idx" ON "capex_gate_reviews"("tenant_id");

CREATE INDEX "capex_gate_reviews_capex_id_idx" ON "capex_gate_reviews"("capex_id");

CREATE INDEX "capex_capitalizations_tenant_id_idx" ON "capex_capitalizations"("tenant_id");

CREATE INDEX "capex_capitalizations_capex_id_idx" ON "capex_capitalizations"("capex_id");

CREATE INDEX "variation_orders_tenant_id_idx" ON "variation_orders"("tenant_id");

CREATE INDEX "variation_orders_project_id_idx" ON "variation_orders"("project_id");

CREATE UNIQUE INDEX "variation_orders_tenant_id_variation_number_key" ON "variation_orders"("tenant_id", "variation_number");

CREATE INDEX "claim_documents_tenant_id_idx" ON "claim_documents"("tenant_id");

CREATE INDEX "claim_documents_claim_id_idx" ON "claim_documents"("claim_id");

CREATE INDEX "pmo_scorecards_tenant_id_idx" ON "pmo_scorecards"("tenant_id");

CREATE INDEX "pmo_scorecards_project_id_idx" ON "pmo_scorecards"("project_id");

CREATE INDEX "pmo_scorecard_dimensions_tenant_id_idx" ON "pmo_scorecard_dimensions"("tenant_id");

CREATE INDEX "pmo_scorecard_dimensions_scorecard_id_idx" ON "pmo_scorecard_dimensions"("scorecard_id");

CREATE INDEX "stage_gates_tenant_id_idx" ON "stage_gates"("tenant_id");

CREATE INDEX "stage_gates_project_id_idx" ON "stage_gates"("project_id");

CREATE INDEX "gate_checklists_tenant_id_idx" ON "gate_checklists"("tenant_id");

CREATE INDEX "gate_checklists_gate_id_idx" ON "gate_checklists"("gate_id");

CREATE INDEX "discussion_replies_tenant_id_idx" ON "discussion_replies"("tenant_id");

CREATE INDEX "discussion_replies_discussion_id_idx" ON "discussion_replies"("discussion_id");

CREATE INDEX "document_reviews_tenant_id_idx" ON "document_reviews"("tenant_id");

CREATE INDEX "document_reviews_project_id_idx" ON "document_reviews"("project_id");

CREATE INDEX "spc_charts_tenant_id_idx" ON "spc_charts"("tenant_id");

CREATE INDEX "spc_charts_product_id_idx" ON "spc_charts"("product_id");

CREATE UNIQUE INDEX "spc_charts_tenant_id_code_key" ON "spc_charts"("tenant_id", "code");

CREATE INDEX "spc_samples_tenant_id_idx" ON "spc_samples"("tenant_id");

CREATE INDEX "spc_samples_chart_id_idx" ON "spc_samples"("chart_id");

CREATE INDEX "fmea_worksheets_tenant_id_idx" ON "fmea_worksheets"("tenant_id");

CREATE INDEX "fmea_worksheets_product_id_idx" ON "fmea_worksheets"("product_id");

CREATE UNIQUE INDEX "fmea_worksheets_tenant_id_code_key" ON "fmea_worksheets"("tenant_id", "code");

CREATE INDEX "fmea_items_tenant_id_idx" ON "fmea_items"("tenant_id");

CREATE INDEX "fmea_items_worksheet_id_idx" ON "fmea_items"("worksheet_id");

CREATE INDEX "apqp_projects_tenant_id_idx" ON "apqp_projects"("tenant_id");

CREATE INDEX "apqp_projects_product_id_idx" ON "apqp_projects"("product_id");

CREATE UNIQUE INDEX "apqp_projects_tenant_id_code_key" ON "apqp_projects"("tenant_id", "code");

CREATE INDEX "apqp_phases_tenant_id_idx" ON "apqp_phases"("tenant_id");

CREATE INDEX "apqp_phases_project_id_idx" ON "apqp_phases"("project_id");

CREATE INDEX "ppap_submissions_tenant_id_idx" ON "ppap_submissions"("tenant_id");

CREATE INDEX "ppap_submissions_product_id_idx" ON "ppap_submissions"("product_id");

CREATE INDEX "ppap_submissions_apqp_project_id_idx" ON "ppap_submissions"("apqp_project_id");

CREATE INDEX "tooling_masters_tenant_id_idx" ON "tooling_masters"("tenant_id");

CREATE UNIQUE INDEX "tooling_masters_tenant_id_code_key" ON "tooling_masters"("tenant_id", "code");

CREATE INDEX "tooling_calibrations_tenant_id_idx" ON "tooling_calibrations"("tenant_id");

CREATE INDEX "tooling_calibrations_tool_id_idx" ON "tooling_calibrations"("tool_id");

CREATE UNIQUE INDEX "tooling_calibrations_tenant_id_calibration_no_key" ON "tooling_calibrations"("tenant_id", "calibration_no");

CREATE INDEX "tooling_usage_logs_tenant_id_idx" ON "tooling_usage_logs"("tenant_id");

CREATE INDEX "tooling_usage_logs_tool_id_idx" ON "tooling_usage_logs"("tool_id");

CREATE INDEX "gage_rr_studies_tenant_id_idx" ON "gage_rr_studies"("tenant_id");

CREATE UNIQUE INDEX "gage_rr_studies_tenant_id_code_key" ON "gage_rr_studies"("tenant_id", "code");

CREATE INDEX "gage_rr_samples_tenant_id_idx" ON "gage_rr_samples"("tenant_id");

CREATE INDEX "gage_rr_samples_study_id_idx" ON "gage_rr_samples"("study_id");

CREATE INDEX "aps_schedules_tenant_id_idx" ON "aps_schedules"("tenant_id");

CREATE INDEX "aps_jobs_tenant_id_idx" ON "aps_jobs"("tenant_id");

CREATE INDEX "aps_jobs_schedule_id_idx" ON "aps_jobs"("schedule_id");

CREATE INDEX "aps_constraints_tenant_id_idx" ON "aps_constraints"("tenant_id");

CREATE INDEX "aps_simulation_scenarios_tenant_id_idx" ON "aps_simulation_scenarios"("tenant_id");

CREATE INDEX "energy_meters_tenant_id_idx" ON "energy_meters"("tenant_id");

CREATE INDEX "energy_meters_workstation_id_idx" ON "energy_meters"("workstation_id");

CREATE UNIQUE INDEX "energy_meters_tenant_id_code_key" ON "energy_meters"("tenant_id", "code");

CREATE INDEX "energy_readings_tenant_id_idx" ON "energy_readings"("tenant_id");

CREATE INDEX "energy_readings_meter_id_idx" ON "energy_readings"("meter_id");

CREATE INDEX "energy_readings_recorded_at_idx" ON "energy_readings"("recorded_at");

CREATE INDEX "energy_kpi_targets_tenant_id_idx" ON "energy_kpi_targets"("tenant_id");

CREATE INDEX "energy_kpi_targets_meter_id_idx" ON "energy_kpi_targets"("meter_id");

CREATE INDEX "energy_cost_allocations_tenant_id_idx" ON "energy_cost_allocations"("tenant_id");

CREATE INDEX "energy_cost_allocations_meter_id_idx" ON "energy_cost_allocations"("meter_id");

CREATE INDEX "energy_cost_allocations_work_order_id_idx" ON "energy_cost_allocations"("work_order_id");

CREATE INDEX "kanban_boards_tenant_id_idx" ON "kanban_boards"("tenant_id");

CREATE UNIQUE INDEX "kanban_boards_tenant_id_code_key" ON "kanban_boards"("tenant_id", "code");

CREATE INDEX "kanban_cards_tenant_id_idx" ON "kanban_cards"("tenant_id");

CREATE INDEX "kanban_cards_board_id_idx" ON "kanban_cards"("board_id");

CREATE INDEX "kanban_cards_column_name_idx" ON "kanban_cards"("column_name");

CREATE UNIQUE INDEX "kanban_cards_tenant_id_card_no_key" ON "kanban_cards"("tenant_id", "card_no");

CREATE INDEX "lean_improvements_tenant_id_idx" ON "lean_improvements"("tenant_id");

CREATE INDEX "lean_improvements_status_idx" ON "lean_improvements"("status");

CREATE INDEX "waste_logs_tenant_id_idx" ON "waste_logs"("tenant_id");

CREATE INDEX "waste_logs_waste_type_idx" ON "waste_logs"("waste_type");

CREATE INDEX "value_stream_map_items_tenant_id_idx" ON "value_stream_map_items"("tenant_id");

CREATE INDEX "value_stream_map_items_product_id_idx" ON "value_stream_map_items"("product_id");

CREATE INDEX "tpm_pillars_tenant_id_idx" ON "tpm_pillars"("tenant_id");

CREATE UNIQUE INDEX "tpm_pillars_tenant_id_code_key" ON "tpm_pillars"("tenant_id", "code");

CREATE INDEX "tpm_pillar_activities_tenant_id_idx" ON "tpm_pillar_activities"("tenant_id");

CREATE INDEX "tpm_pillar_activities_pillar_id_idx" ON "tpm_pillar_activities"("pillar_id");

CREATE INDEX "tpm_audit_5s_tenant_id_idx" ON "tpm_audit_5s"("tenant_id");

CREATE INDEX "tpm_audit_5s_workstation_id_idx" ON "tpm_audit_5s"("workstation_id");

CREATE INDEX "tpm_kpis_tenant_id_idx" ON "tpm_kpis"("tenant_id");

CREATE INDEX "tpm_kpis_pillar_id_idx" ON "tpm_kpis"("pillar_id");

CREATE INDEX "tpm_kpis_workstation_id_idx" ON "tpm_kpis"("workstation_id");

CREATE INDEX "contract_manufacturers_tenant_id_idx" ON "contract_manufacturers"("tenant_id");

CREATE UNIQUE INDEX "contract_manufacturers_tenant_id_code_key" ON "contract_manufacturers"("tenant_id", "code");

CREATE INDEX "outsourcing_purchase_orders_tenant_id_idx" ON "outsourcing_purchase_orders"("tenant_id");

CREATE INDEX "outsourcing_purchase_orders_contract_mfg_id_idx" ON "outsourcing_purchase_orders"("contract_mfg_id");

CREATE UNIQUE INDEX "outsourcing_purchase_orders_tenant_id_order_no_key" ON "outsourcing_purchase_orders"("tenant_id", "order_no");

CREATE INDEX "outsourcing_po_items_tenant_id_idx" ON "outsourcing_po_items"("tenant_id");

CREATE INDEX "outsourcing_po_items_po_id_idx" ON "outsourcing_po_items"("po_id");

CREATE INDEX "outsourcing_po_items_product_id_idx" ON "outsourcing_po_items"("product_id");

CREATE INDEX "subcontracted_receipts_tenant_id_idx" ON "subcontracted_receipts"("tenant_id");

CREATE INDEX "subcontracted_receipts_po_id_idx" ON "subcontracted_receipts"("po_id");

CREATE INDEX "subcontracted_receipts_contract_mfg_id_idx" ON "subcontracted_receipts"("contract_mfg_id");

CREATE UNIQUE INDEX "subcontracted_receipts_tenant_id_receipt_no_key" ON "subcontracted_receipts"("tenant_id", "receipt_no");

CREATE INDEX "ddmrp_parts_tenant_id_idx" ON "ddmrp_parts"("tenant_id");

CREATE INDEX "ddmrp_parts_product_id_idx" ON "ddmrp_parts"("product_id");

CREATE UNIQUE INDEX "ddmrp_buffers_part_id_key" ON "ddmrp_buffers"("part_id");

CREATE INDEX "ddmrp_buffers_tenant_id_idx" ON "ddmrp_buffers"("tenant_id");

CREATE INDEX "ddmrp_buffers_part_id_idx" ON "ddmrp_buffers"("part_id");

CREATE INDEX "ddmrp_net_flow_statuses_tenant_id_idx" ON "ddmrp_net_flow_statuses"("tenant_id");

CREATE INDEX "ddmrp_net_flow_statuses_part_id_idx" ON "ddmrp_net_flow_statuses"("part_id");

CREATE INDEX "ddmrp_recommendations_tenant_id_idx" ON "ddmrp_recommendations"("tenant_id");

CREATE INDEX "ddmrp_recommendations_part_id_idx" ON "ddmrp_recommendations"("part_id");

CREATE INDEX "ddmrp_recommendations_priority_idx" ON "ddmrp_recommendations"("priority");

CREATE INDEX "form_analytic_tenant_id_idx" ON "form_analytic"("tenant_id");

CREATE INDEX "form_analytic_template_id_idx" ON "form_analytic"("template_id");

CREATE INDEX "workflow_transitions_tenant_id_idx" ON "workflow_transitions"("tenant_id");

CREATE INDEX "workflow_tasks_tenant_id_idx" ON "workflow_tasks"("tenant_id");

CREATE INDEX "workflow_tasks_instance_id_idx" ON "workflow_tasks"("instance_id");

CREATE INDEX "workflow_tasks_assignee_id_idx" ON "workflow_tasks"("assignee_id");

CREATE INDEX "workflow_sla_rules_tenant_id_idx" ON "workflow_sla_rules"("tenant_id");

CREATE INDEX "workflow_escalation_rules_tenant_id_idx" ON "workflow_escalation_rules"("tenant_id");

CREATE INDEX "workflow_audit_logs_tenant_id_idx" ON "workflow_audit_logs"("tenant_id");

CREATE INDEX "workflow_audit_logs_instance_id_idx" ON "workflow_audit_logs"("instance_id");

CREATE INDEX "ai_intent_training_examples_tenant_id_idx" ON "ai_intent_training_examples"("tenant_id");

CREATE INDEX "ai_intent_training_examples_tenant_id_intent_idx" ON "ai_intent_training_examples"("tenant_id", "intent");

CREATE INDEX "ai_nlu_entities_tenant_id_idx" ON "ai_nlu_entities"("tenant_id");

CREATE INDEX "ai_nlu_entities_training_example_id_idx" ON "ai_nlu_entities"("training_example_id");

CREATE INDEX "ai_model_accuracy_metrics_tenant_id_idx" ON "ai_model_accuracy_metrics"("tenant_id");

CREATE INDEX "ai_model_accuracy_metrics_model_id_idx" ON "ai_model_accuracy_metrics"("model_id");

CREATE INDEX "analytics_kpi_definitions_tenant_id_idx" ON "analytics_kpi_definitions"("tenant_id");

CREATE INDEX "analytics_kpi_definitions_tenant_id_category_idx" ON "analytics_kpi_definitions"("tenant_id", "category");

CREATE UNIQUE INDEX "analytics_kpi_definitions_tenant_id_code_key" ON "analytics_kpi_definitions"("tenant_id", "code");

CREATE INDEX "analytics_trend_results_tenant_id_idx" ON "analytics_trend_results"("tenant_id");

CREATE INDEX "analytics_trend_results_kpi_definition_id_idx" ON "analytics_trend_results"("kpi_definition_id");

CREATE INDEX "analytics_trend_results_period_start_period_end_idx" ON "analytics_trend_results"("period_start", "period_end");

CREATE UNIQUE INDEX "analytics_trend_results_kpi_definition_id_period_period_sta_key" ON "analytics_trend_results"("kpi_definition_id", "period", "period_start", "period_end");

CREATE INDEX "analytics_cross_filter_dashboards_tenant_id_idx" ON "analytics_cross_filter_dashboards"("tenant_id");

CREATE INDEX "analytics_bi_metric_definitions_tenant_id_idx" ON "analytics_bi_metric_definitions"("tenant_id");

CREATE INDEX "analytics_bi_metric_definitions_tenant_id_category_idx" ON "analytics_bi_metric_definitions"("tenant_id", "category");

CREATE UNIQUE INDEX "analytics_bi_metric_definitions_tenant_id_code_key" ON "analytics_bi_metric_definitions"("tenant_id", "code");

CREATE INDEX "drive_folder_shares_tenant_id_idx" ON "drive_folder_shares"("tenant_id");

CREATE INDEX "drive_folder_shares_folder_id_idx" ON "drive_folder_shares"("folder_id");

CREATE INDEX "drive_folder_shares_shared_with_user_id_idx" ON "drive_folder_shares"("shared_with_user_id");

CREATE INDEX "drive_file_tags_tenant_id_idx" ON "drive_file_tags"("tenant_id");

CREATE INDEX "drive_file_tag_mappings_file_id_idx" ON "drive_file_tag_mappings"("file_id");

CREATE INDEX "drive_file_tag_mappings_tag_id_idx" ON "drive_file_tag_mappings"("tag_id");

CREATE UNIQUE INDEX "drive_file_tag_mappings_file_id_tag_id_key" ON "drive_file_tag_mappings"("file_id", "tag_id");

CREATE INDEX "drive_trash_items_tenant_id_idx" ON "drive_trash_items"("tenant_id");

CREATE INDEX "drive_trash_items_file_id_idx" ON "drive_trash_items"("file_id");

CREATE INDEX "dynamic_discount_offers_tenant_id_invoice_id_idx" ON "dynamic_discount_offers"("tenant_id", "invoice_id");

CREATE INDEX "dynamic_discount_offers_tenant_id_status_idx" ON "dynamic_discount_offers"("tenant_id", "status");

CREATE INDEX "supply_chain_finance_programs_tenant_id_program_type_idx" ON "supply_chain_finance_programs"("tenant_id", "program_type");

CREATE INDEX "supply_chain_finance_programs_tenant_id_status_idx" ON "supply_chain_finance_programs"("tenant_id", "status");

CREATE INDEX "close_task_dependencies_tenant_id_task_id_idx" ON "close_task_dependencies"("tenant_id", "task_id");

CREATE INDEX "close_task_dependencies_tenant_id_depends_on_task_id_idx" ON "close_task_dependencies"("tenant_id", "depends_on_task_id");

CREATE INDEX "close_task_slas_tenant_id_task_id_idx" ON "close_task_slas"("tenant_id", "task_id");

CREATE INDEX "close_task_slas_tenant_id_status_idx" ON "close_task_slas"("tenant_id", "status");

CREATE INDEX "close_calendar_events_tenant_id_period_id_idx" ON "close_calendar_events"("tenant_id", "period_id");

CREATE INDEX "close_calendar_events_tenant_id_event_type_due_at_idx" ON "close_calendar_events"("tenant_id", "event_type", "due_at");

CREATE INDEX "close_escalation_rules_tenant_id_is_active_idx" ON "close_escalation_rules"("tenant_id", "is_active");

CREATE INDEX "close_analytics_snapshots_tenant_id_period_id_idx" ON "close_analytics_snapshots"("tenant_id", "period_id");

CREATE INDEX "consolidation_groups_tenant_id_group_type_idx" ON "consolidation_groups"("tenant_id", "group_type");

CREATE INDEX "consolidation_group_members_tenant_id_group_id_idx" ON "consolidation_group_members"("tenant_id", "group_id");

CREATE INDEX "consolidation_executions_tenant_id_group_id_period_id_idx" ON "consolidation_executions"("tenant_id", "group_id", "period_id");

CREATE INDEX "consolidation_executions_tenant_id_status_idx" ON "consolidation_executions"("tenant_id", "status");

CREATE INDEX "consolidation_elimination_rules_tenant_id_group_id_idx" ON "consolidation_elimination_rules"("tenant_id", "group_id");

CREATE INDEX "consolidation_elimination_entries_tenant_id_run_id_idx" ON "consolidation_elimination_entries"("tenant_id", "run_id");

CREATE INDEX "consolidation_translation_adjustments_tenant_id_run_id_idx" ON "consolidation_translation_adjustments"("tenant_id", "run_id");

CREATE INDEX "minority_interest_schedules_tenant_id_run_id_idx" ON "minority_interest_schedules"("tenant_id", "run_id");

CREATE INDEX "customer_credit_scorecards_tenant_id_is_default_idx" ON "customer_credit_scorecards"("tenant_id", "is_default");

CREATE INDEX "customer_credit_scores_tenant_id_customer_id_idx" ON "customer_credit_scores"("tenant_id", "customer_id");

CREATE INDEX "customer_credit_scores_tenant_id_risk_rating_idx" ON "customer_credit_scores"("tenant_id", "risk_rating");

CREATE INDEX "vendor_risk_assessments_tenant_id_vendor_id_idx" ON "vendor_risk_assessments"("tenant_id", "vendor_id");

CREATE INDEX "vendor_risk_assessments_tenant_id_risk_rating_idx" ON "vendor_risk_assessments"("tenant_id", "risk_rating");

CREATE INDEX "market_risk_exposures_tenant_id_risk_type_idx" ON "market_risk_exposures"("tenant_id", "risk_type");

CREATE INDEX "operational_risk_events_tenant_id_event_type_idx" ON "operational_risk_events"("tenant_id", "event_type");

CREATE INDEX "operational_risk_events_tenant_id_severity_status_idx" ON "operational_risk_events"("tenant_id", "severity", "status");

CREATE INDEX "risk_control_measures_tenant_id_control_type_idx" ON "risk_control_measures"("tenant_id", "control_type");

CREATE INDEX "emission_source_records_tenant_id_scope_fiscal_year_idx" ON "emission_source_records"("tenant_id", "scope", "fiscal_year");

CREATE INDEX "emission_source_records_tenant_id_fiscal_year_idx" ON "emission_source_records"("tenant_id", "fiscal_year");

CREATE INDEX "emission_offset_credits_tenant_id_status_idx" ON "emission_offset_credits"("tenant_id", "status");

CREATE INDEX "esg_kpi_definitions_tenant_id_category_idx" ON "esg_kpi_definitions"("tenant_id", "category");

CREATE UNIQUE INDEX "esg_kpi_definitions_tenant_id_kpi_code_key" ON "esg_kpi_definitions"("tenant_id", "kpi_code");

CREATE INDEX "esg_kpi_actual_values_tenant_id_kpi_id_fiscal_year_idx" ON "esg_kpi_actual_values"("tenant_id", "kpi_id", "fiscal_year");

CREATE INDEX "esg_report_templates_tenant_id_reporting_framework_idx" ON "esg_report_templates"("tenant_id", "reporting_framework");

CREATE INDEX "esg_disclosure_mappings_tenant_id_framework_idx" ON "esg_disclosure_mappings"("tenant_id", "framework");

CREATE INDEX "sustainability_targets_tenant_id_target_type_status_idx" ON "sustainability_targets"("tenant_id", "target_type", "status");

CREATE UNIQUE INDEX "tax_provision_runs_tenant_id_fiscal_year_period_key" ON "tax_provision_runs"("tenant_id", "fiscal_year", "period");

CREATE INDEX "tax_provision_details_tenant_id_run_id_idx" ON "tax_provision_details"("tenant_id", "run_id");

CREATE INDEX "deferred_tax_schedules_tenant_id_run_id_idx" ON "deferred_tax_schedules"("tenant_id", "run_id");

CREATE INDEX "uncertain_tax_positions_tenant_id_run_id_idx" ON "uncertain_tax_positions"("tenant_id", "run_id");

CREATE INDEX "valuation_allowance_assessments_tenant_id_run_id_idx" ON "valuation_allowance_assessments"("tenant_id", "run_id");

CREATE INDEX "approval_routing_rules_tenant_id_trigger_event_idx" ON "approval_routing_rules"("tenant_id", "trigger_event");

CREATE INDEX "ai_forecast_scenarios_tenant_id_scenario_type_status_idx" ON "ai_forecast_scenarios"("tenant_id", "scenario_type", "status");

CREATE INDEX "ai_forecast_scenario_lines_tenant_id_scenario_id_period_dat_idx" ON "ai_forecast_scenario_lines"("tenant_id", "scenario_id", "period_date");

CREATE INDEX "anomaly_detection_runs_tenant_id_status_idx" ON "anomaly_detection_runs"("tenant_id", "status");

CREATE INDEX "anomaly_detection_results_tenant_id_run_id_idx" ON "anomaly_detection_results"("tenant_id", "run_id");

CREATE INDEX "anomaly_detection_results_tenant_id_status_idx" ON "anomaly_detection_results"("tenant_id", "status");

CREATE INDEX "anomaly_detection_results_tenant_id_entity_type_severity_idx" ON "anomaly_detection_results"("tenant_id", "entity_type", "severity");

CREATE INDEX "smart_gl_coding_suggestions_tenant_id_source_type_idx" ON "smart_gl_coding_suggestions"("tenant_id", "source_type");

CREATE INDEX "smart_gl_coding_suggestions_tenant_id_suggested_account_id_idx" ON "smart_gl_coding_suggestions"("tenant_id", "suggested_account_id");

CREATE INDEX "pricing_rules_tenant_id_idx" ON "pricing_rules"("tenant_id");

CREATE INDEX "quote_versions_tenant_id_idx" ON "quote_versions"("tenant_id");

CREATE INDEX "quote_versions_quotation_id_idx" ON "quote_versions"("quotation_id");

CREATE INDEX "quote_margins_tenant_id_idx" ON "quote_margins"("tenant_id");

CREATE INDEX "quote_margins_quotation_id_idx" ON "quote_margins"("quotation_id");

CREATE INDEX "discount_approval_matrix_tenant_id_idx" ON "discount_approval_matrix"("tenant_id");

CREATE INDEX "territory_plans_tenant_id_idx" ON "territory_plans"("tenant_id");

CREATE INDEX "territory_plan_assignments_tenant_id_idx" ON "territory_plan_assignments"("tenant_id");

CREATE INDEX "territory_plan_assignments_plan_id_idx" ON "territory_plan_assignments"("plan_id");

CREATE INDEX "territory_plan_assignments_territory_id_idx" ON "territory_plan_assignments"("territory_id");

CREATE INDEX "territory_rebalance_logs_tenant_id_idx" ON "territory_rebalance_logs"("tenant_id");

CREATE INDEX "territory_rebalance_logs_plan_id_idx" ON "territory_rebalance_logs"("plan_id");

CREATE INDEX "named_accounts_tenant_id_idx" ON "named_accounts"("tenant_id");

CREATE UNIQUE INDEX "named_accounts_tenant_id_customer_id_key" ON "named_accounts"("tenant_id", "customer_id");

CREATE INDEX "report_categories_tenant_id_idx" ON "report_categories"("tenant_id");

CREATE INDEX "system_reports_tenant_id_idx" ON "system_reports"("tenant_id");

CREATE INDEX "system_reports_tenant_id_module_idx" ON "system_reports"("tenant_id", "module");

CREATE INDEX "contract_template_categories_tenant_id_idx" ON "contract_template_categories"("tenant_id");

CREATE UNIQUE INDEX "contract_template_categories_tenant_id_name_key" ON "contract_template_categories"("tenant_id", "name");

CREATE INDEX "contract_versions_tenant_id_idx" ON "contract_versions"("tenant_id");

CREATE INDEX "contract_versions_contract_id_idx" ON "contract_versions"("contract_id");

CREATE UNIQUE INDEX "contract_versions_tenant_id_contract_id_version_number_key" ON "contract_versions"("tenant_id", "contract_id", "version_number");

CREATE INDEX "contract_obligations_tenant_id_idx" ON "contract_obligations"("tenant_id");

CREATE INDEX "contract_obligations_contract_id_idx" ON "contract_obligations"("contract_id");

CREATE INDEX "contract_compliance_status_tenant_id_idx" ON "contract_compliance_status"("tenant_id");

CREATE UNIQUE INDEX "contract_compliance_status_tenant_id_contract_id_key" ON "contract_compliance_status"("tenant_id", "contract_id");

CREATE INDEX "social_media_posts_tenant_id_idx" ON "social_media_posts"("tenant_id");

CREATE INDEX "social_media_posts_tenant_id_status_idx" ON "social_media_posts"("tenant_id", "status");

CREATE INDEX "communication_opt_outs_tenant_id_idx" ON "communication_opt_outs"("tenant_id");

CREATE UNIQUE INDEX "communication_opt_outs_tenant_id_entity_type_entity_id_chan_key" ON "communication_opt_outs"("tenant_id", "entity_type", "entity_id", "channel");

CREATE INDEX "communication_preferences_tenant_id_idx" ON "communication_preferences"("tenant_id");

CREATE UNIQUE INDEX "communication_preferences_tenant_id_entity_type_entity_id_key" ON "communication_preferences"("tenant_id", "entity_type", "entity_id");

CREATE INDEX "shipment_emissions_tenant_id_idx" ON "shipment_emissions"("tenant_id");

CREATE INDEX "shipment_emissions_tenant_id_transport_mode_idx" ON "shipment_emissions"("tenant_id", "transport_mode");

CREATE INDEX "carbon_offsets_tenant_id_idx" ON "carbon_offsets"("tenant_id");

CREATE INDEX "carbon_offsets_tenant_id_status_idx" ON "carbon_offsets"("tenant_id", "status");

CREATE INDEX "supplier_documents_tenant_id_idx" ON "supplier_documents"("tenant_id");

CREATE INDEX "supplier_documents_tenant_id_supplier_id_idx" ON "supplier_documents"("tenant_id", "supplier_id");

CREATE INDEX "po_collaborations_tenant_id_idx" ON "po_collaborations"("tenant_id");

CREATE INDEX "po_collaborations_tenant_id_purchase_order_id_idx" ON "po_collaborations"("tenant_id", "purchase_order_id");

CREATE INDEX "po_collaborations_tenant_id_supplier_id_idx" ON "po_collaborations"("tenant_id", "supplier_id");

CREATE INDEX "letters_of_credit_tenant_id_idx" ON "letters_of_credit"("tenant_id");

CREATE INDEX "letters_of_credit_tenant_id_status_idx" ON "letters_of_credit"("tenant_id", "status");

CREATE INDEX "lc_documents_tenant_id_lc_id_idx" ON "lc_documents"("tenant_id", "lc_id");

CREATE INDEX "lc_amendments_tenant_id_lc_id_idx" ON "lc_amendments"("tenant_id", "lc_id");

CREATE INDEX "lc_presentations_tenant_id_lc_id_idx" ON "lc_presentations"("tenant_id", "lc_id");

CREATE INDEX "bank_guarantees_tenant_id_idx" ON "bank_guarantees"("tenant_id");

CREATE INDEX "sop_cycles_tenant_id_idx" ON "sop_cycles"("tenant_id");

CREATE INDEX "sop_demand_plans_tenant_id_sop_cycle_id_idx" ON "sop_demand_plans"("tenant_id", "sop_cycle_id");

CREATE INDEX "sop_supply_plans_tenant_id_sop_cycle_id_idx" ON "sop_supply_plans"("tenant_id", "sop_cycle_id");

CREATE INDEX "sop_consensus_plans_tenant_id_sop_cycle_id_idx" ON "sop_consensus_plans"("tenant_id", "sop_cycle_id");

CREATE INDEX "logistics_providers_tenant_id_idx" ON "logistics_providers"("tenant_id");

CREATE INDEX "logistics_provider_invoices_tenant_id_provider_id_idx" ON "logistics_provider_invoices"("tenant_id", "provider_id");

CREATE INDEX "logistics_provider_performance_tenant_id_provider_id_idx" ON "logistics_provider_performance"("tenant_id", "provider_id");

CREATE INDEX "cold_chain_shipments_tenant_id_idx" ON "cold_chain_shipments"("tenant_id");

CREATE INDEX "cold_chain_temperature_logs_tenant_id_shipment_id_idx" ON "cold_chain_temperature_logs"("tenant_id", "shipment_id");

CREATE INDEX "cold_chain_excursions_tenant_id_shipment_id_idx" ON "cold_chain_excursions"("tenant_id", "shipment_id");

CREATE INDEX "scem_alerts_tenant_id_idx" ON "scem_alerts"("tenant_id");

CREATE INDEX "scem_alerts_tenant_id_status_severity_idx" ON "scem_alerts"("tenant_id", "status", "severity");

CREATE INDEX "scem_alert_rules_tenant_id_idx" ON "scem_alert_rules"("tenant_id");

CREATE INDEX "supply_chain_risk_events_tenant_id_idx" ON "supply_chain_risk_events"("tenant_id");

CREATE INDEX "supply_chain_risk_events_tenant_id_status_severity_idx" ON "supply_chain_risk_events"("tenant_id", "status", "severity");

CREATE INDEX "scm_risk_mitigations_tenant_id_risk_event_id_idx" ON "scm_risk_mitigations"("tenant_id", "risk_event_id");

CREATE INDEX "trade_compliance_checks_tenant_id_idx" ON "trade_compliance_checks"("tenant_id");

CREATE INDEX "trade_compliance_checks_tenant_id_entity_type_entity_id_idx" ON "trade_compliance_checks"("tenant_id", "entity_type", "entity_id");

CREATE INDEX "denied_party_entries_tenant_id_idx" ON "denied_party_entries"("tenant_id");

CREATE INDEX "export_licenses_tenant_id_idx" ON "export_licenses"("tenant_id");

CREATE INDEX "hs_code_classifications_tenant_id_idx" ON "hs_code_classifications"("tenant_id");

CREATE INDEX "hs_code_classifications_tenant_id_product_id_idx" ON "hs_code_classifications"("tenant_id", "product_id");

CREATE INDEX "multimodal_transport_orders_tenant_id_idx" ON "multimodal_transport_orders"("tenant_id");

CREATE INDEX "multimodal_transport_orders_tenant_id_status_idx" ON "multimodal_transport_orders"("tenant_id", "status");

CREATE INDEX "multimodal_transport_legs_tenant_id_transport_order_id_idx" ON "multimodal_transport_legs"("tenant_id", "transport_order_id");

CREATE INDEX "multimodal_transport_events_tenant_id_transport_order_id_idx" ON "multimodal_transport_events"("tenant_id", "transport_order_id");

CREATE INDEX "reverse_logistics_orders_tenant_id_idx" ON "reverse_logistics_orders"("tenant_id");

CREATE INDEX "reverse_logistics_orders_tenant_id_status_idx" ON "reverse_logistics_orders"("tenant_id", "status");

CREATE INDEX "reverse_logistics_items_tenant_id_return_order_id_idx" ON "reverse_logistics_items"("tenant_id", "return_order_id");

CREATE INDEX "delivery_zones_tenant_id_idx" ON "delivery_zones"("tenant_id");

CREATE INDEX "delivery_time_slots_tenant_id_zone_id_idx" ON "delivery_time_slots"("tenant_id", "zone_id");

CREATE INDEX "last_mile_deliveries_tenant_id_idx" ON "last_mile_deliveries"("tenant_id");

CREATE INDEX "last_mile_deliveries_tenant_id_status_idx" ON "last_mile_deliveries"("tenant_id", "status");

CREATE INDEX "scm_iot_devices_tenant_id_idx" ON "scm_iot_devices"("tenant_id");

CREATE INDEX "scm_iot_readings_tenant_id_device_id_idx" ON "scm_iot_readings"("tenant_id", "device_id");

CREATE INDEX "smart_replenishment_orders_tenant_id_idx" ON "smart_replenishment_orders"("tenant_id");

CREATE INDEX "dynamic_discount_requests_tenant_id_idx" ON "dynamic_discount_requests"("tenant_id");

CREATE INDEX "scm_financing_facilities_tenant_id_idx" ON "scm_financing_facilities"("tenant_id");

CREATE INDEX "scm_financing_drawdowns_tenant_id_facility_id_idx" ON "scm_financing_drawdowns"("tenant_id", "facility_id");

CREATE INDEX "supplier_development_plans_tenant_id_supplier_id_idx" ON "supplier_development_plans"("tenant_id", "supplier_id");

CREATE INDEX "supplier_dev_milestones_tenant_id_plan_id_idx" ON "supplier_dev_milestones"("tenant_id", "plan_id");

CREATE INDEX "supplier_dev_surveys_tenant_id_supplier_id_idx" ON "supplier_dev_surveys"("tenant_id", "supplier_id");

CREATE INDEX "port_terminals_tenant_id_idx" ON "port_terminals"("tenant_id");

CREATE INDEX "berth_slots_tenant_id_terminal_id_idx" ON "berth_slots"("tenant_id", "terminal_id");

CREATE INDEX "scm_kpi_snapshots_tenant_id_idx" ON "scm_kpi_snapshots"("tenant_id");

CREATE UNIQUE INDEX "supplier_portal_sessions_token_key" ON "supplier_portal_sessions"("token");

CREATE INDEX "supplier_portal_sessions_tenant_id_supplier_id_idx" ON "supplier_portal_sessions"("tenant_id", "supplier_id");

CREATE INDEX "supplier_announcements_tenant_id_idx" ON "supplier_announcements"("tenant_id");

CREATE INDEX "master_production_schedules_tenant_id_idx" ON "master_production_schedules"("tenant_id");

CREATE INDEX "mps_entries_tenant_id_mps_id_idx" ON "mps_entries"("tenant_id", "mps_id");

CREATE INDEX "fmea_records_tenant_id_idx" ON "fmea_records"("tenant_id");

CREATE INDEX "fmea_modes_tenant_id_fmea_id_idx" ON "fmea_modes"("tenant_id", "fmea_id");

CREATE INDEX "aql_sampling_plans_tenant_id_idx" ON "aql_sampling_plans"("tenant_id");

CREATE INDEX "job_cost_sheets_tenant_id_idx" ON "job_cost_sheets"("tenant_id");

CREATE INDEX "job_cost_sheets_tenant_id_work_order_id_idx" ON "job_cost_sheets"("tenant_id", "work_order_id");

CREATE INDEX "standard_costs_tenant_id_product_id_idx" ON "standard_costs"("tenant_id", "product_id");

CREATE INDEX "formula_ingredients_tenant_id_formula_id_idx" ON "formula_ingredients"("tenant_id", "formula_id");

CREATE INDEX "co_products_tenant_id_formula_id_idx" ON "co_products"("tenant_id", "formula_id");

CREATE INDEX "manufacturing_machines_tenant_id_idx" ON "manufacturing_machines"("tenant_id");

CREATE INDEX "machine_oee_records_tenant_id_machine_id_idx" ON "machine_oee_records"("tenant_id", "machine_id");

CREATE INDEX "machine_maintenance_logs_tenant_id_machine_id_idx" ON "machine_maintenance_logs"("tenant_id", "machine_id");

CREATE INDEX "machine_downtime_tenant_id_machine_id_idx" ON "machine_downtime"("tenant_id", "machine_id");

CREATE INDEX "maintenance_schedules_tenant_id_machine_id_idx" ON "maintenance_schedules"("tenant_id", "machine_id");

CREATE INDEX "spare_parts_tenant_id_idx" ON "spare_parts"("tenant_id");

CREATE INDEX "six_sigma_projects_tenant_id_idx" ON "six_sigma_projects"("tenant_id");

CREATE INDEX "six_sigma_metrics_tenant_id_project_id_idx" ON "six_sigma_metrics"("tenant_id", "project_id");

CREATE INDEX "six_sigma_tools_tenant_id_project_id_idx" ON "six_sigma_tools"("tenant_id", "project_id");

CREATE INDEX "shop_floor_transactions_tenant_id_idx" ON "shop_floor_transactions"("tenant_id");

CREATE INDEX "shop_floor_transactions_tenant_id_work_order_id_idx" ON "shop_floor_transactions"("tenant_id", "work_order_id");

CREATE INDEX "quality_standards_tenant_id_idx" ON "quality_standards"("tenant_id");

CREATE INDEX "compliance_audits_tenant_id_idx" ON "compliance_audits"("tenant_id");

CREATE INDEX "gmp_batch_records_tenant_id_batch_id_idx" ON "gmp_batch_records"("tenant_id", "batch_id");

CREATE INDEX "haccp_plans_tenant_id_idx" ON "haccp_plans"("tenant_id");

CREATE INDEX "ppm_portfolios_tenant_id_idx" ON "ppm_portfolios"("tenant_id");

CREATE INDEX "ppm_portfolio_projects_tenant_id_portfolio_id_idx" ON "ppm_portfolio_projects"("tenant_id", "portfolio_id");

CREATE INDEX "ppm_risk_registers_tenant_id_project_id_idx" ON "ppm_risk_registers"("tenant_id", "project_id");

CREATE INDEX "ppm_raid_logs_tenant_id_project_id_idx" ON "ppm_raid_logs"("tenant_id", "project_id");

CREATE INDEX "evm_baselines_tenant_id_project_id_idx" ON "evm_baselines"("tenant_id", "project_id");

CREATE INDEX "evm_measurements_tenant_id_baseline_id_idx" ON "evm_measurements"("tenant_id", "baseline_id");

CREATE INDEX "ppm_kanban_boards_tenant_id_idx" ON "ppm_kanban_boards"("tenant_id");

CREATE INDEX "ppm_kanban_columns_tenant_id_board_id_idx" ON "ppm_kanban_columns"("tenant_id", "board_id");

CREATE INDEX "ppm_kanban_cards_tenant_id_column_id_idx" ON "ppm_kanban_cards"("tenant_id", "column_id");

CREATE INDEX "ppm_change_requests_tenant_id_project_id_idx" ON "ppm_change_requests"("tenant_id", "project_id");

CREATE INDEX "ppm_procurement_plans_tenant_id_project_id_idx" ON "ppm_procurement_plans"("tenant_id", "project_id");

CREATE INDEX "ppm_procurement_requisitions_tenant_id_plan_id_idx" ON "ppm_procurement_requisitions"("tenant_id", "plan_id");

CREATE UNIQUE INDEX "ppm_client_portals_access_token_key" ON "ppm_client_portals"("access_token");

CREATE INDEX "ppm_client_portals_tenant_id_project_id_idx" ON "ppm_client_portals"("tenant_id", "project_id");

CREATE INDEX "ppm_client_approvals_tenant_id_project_id_idx" ON "ppm_client_approvals"("tenant_id", "project_id");

CREATE INDEX "ppm_timesheets_tenant_id_user_id_idx" ON "ppm_timesheets"("tenant_id", "user_id");

CREATE INDEX "ppm_timesheet_entries_tenant_id_timesheet_id_idx" ON "ppm_timesheet_entries"("tenant_id", "timesheet_id");

CREATE INDEX "ppm_quality_plans_tenant_id_project_id_idx" ON "ppm_quality_plans"("tenant_id", "project_id");

CREATE INDEX "ppm_quality_inspections_tenant_id_plan_id_idx" ON "ppm_quality_inspections"("tenant_id", "plan_id");

CREATE INDEX "ppm_documents_tenant_id_project_id_idx" ON "ppm_documents"("tenant_id", "project_id");

CREATE INDEX "ppm_document_versions_tenant_id_document_id_idx" ON "ppm_document_versions"("tenant_id", "document_id");

CREATE INDEX "subcontractor_deliverables_tenant_id_subcontractor_id_idx" ON "subcontractor_deliverables"("tenant_id", "subcontractor_id");

CREATE INDEX "subcontractor_payment_milestones_tenant_id_subcontractor_id_idx" ON "subcontractor_payment_milestones"("tenant_id", "subcontractor_id");

CREATE INDEX "email_inboxes_tenant_id_idx" ON "email_inboxes"("tenant_id");

CREATE INDEX "email_messages_tenant_id_inbox_id_idx" ON "email_messages"("tenant_id", "inbox_id");

CREATE INDEX "email_rules_tenant_id_inbox_id_idx" ON "email_rules"("tenant_id", "inbox_id");

CREATE UNIQUE INDEX "video_rooms_room_code_key" ON "video_rooms"("room_code");

CREATE INDEX "video_rooms_tenant_id_idx" ON "video_rooms"("tenant_id");

CREATE INDEX "video_room_participants_tenant_id_room_id_idx" ON "video_room_participants"("tenant_id", "room_id");

CREATE INDEX "video_recordings_tenant_id_room_id_idx" ON "video_recordings"("tenant_id", "room_id");

CREATE INDEX "wiki_spaces_tenant_id_idx" ON "wiki_spaces"("tenant_id");

CREATE UNIQUE INDEX "wiki_spaces_tenant_id_slug_key" ON "wiki_spaces"("tenant_id", "slug");

CREATE INDEX "wiki_pages_tenant_id_space_id_idx" ON "wiki_pages"("tenant_id", "space_id");

CREATE INDEX "wiki_page_versions_tenant_id_page_id_idx" ON "wiki_page_versions"("tenant_id", "page_id");

CREATE INDEX "chat_channels_tenant_id_idx" ON "chat_channels"("tenant_id");

CREATE INDEX "chat_channel_members_tenant_id_channel_id_idx" ON "chat_channel_members"("tenant_id", "channel_id");

CREATE UNIQUE INDEX "chat_channel_members_channel_id_user_id_key" ON "chat_channel_members"("channel_id", "user_id");

CREATE INDEX "intranet_posts_tenant_id_idx" ON "intranet_posts"("tenant_id");

CREATE INDEX "intranet_comments_tenant_id_post_id_idx" ON "intranet_comments"("tenant_id", "post_id");

CREATE INDEX "intranet_reactions_tenant_id_post_id_idx" ON "intranet_reactions"("tenant_id", "post_id");

CREATE UNIQUE INDEX "intranet_reactions_post_id_user_id_emoji_key" ON "intranet_reactions"("post_id", "user_id", "emoji");

CREATE INDEX "internal_surveys_tenant_id_idx" ON "internal_surveys"("tenant_id");

CREATE INDEX "internal_survey_answers_tenant_id_survey_id_idx" ON "internal_survey_answers"("tenant_id", "survey_id");

CREATE INDEX "company_events_tenant_id_idx" ON "company_events"("tenant_id");

CREATE INDEX "event_rsvps_tenant_id_event_id_idx" ON "event_rsvps"("tenant_id", "event_id");

CREATE UNIQUE INDEX "event_rsvps_event_id_user_id_key" ON "event_rsvps"("event_id", "user_id");

CREATE INDEX "comm_retention_policies_tenant_id_idx" ON "comm_retention_policies"("tenant_id");

CREATE INDEX "legal_holds_tenant_id_idx" ON "legal_holds"("tenant_id");

CREATE INDEX "phone_extensions_tenant_id_idx" ON "phone_extensions"("tenant_id");

CREATE INDEX "phone_call_logs_tenant_id_idx" ON "phone_call_logs"("tenant_id");

CREATE INDEX "comm_webhooks_tenant_id_idx" ON "comm_webhooks"("tenant_id");

CREATE INDEX "comm_analytics_reports_tenant_id_idx" ON "comm_analytics_reports"("tenant_id");

CREATE INDEX "builder_data_models_tenant_id_idx" ON "builder_data_models"("tenant_id");

CREATE INDEX "builder_data_fields_tenant_id_model_id_idx" ON "builder_data_fields"("tenant_id", "model_id");

CREATE INDEX "builder_relationships_tenant_id_from_model_id_idx" ON "builder_relationships"("tenant_id", "from_model_id");

CREATE INDEX "builder_data_views_tenant_id_model_id_idx" ON "builder_data_views"("tenant_id", "model_id");

CREATE INDEX "business_rules_tenant_id_idx" ON "business_rules"("tenant_id");

CREATE INDEX "business_rule_executions_tenant_id_rule_id_idx" ON "business_rule_executions"("tenant_id", "rule_id");

CREATE INDEX "builder_scripts_tenant_id_idx" ON "builder_scripts"("tenant_id");

CREATE INDEX "calculated_fields_tenant_id_idx" ON "calculated_fields"("tenant_id");

CREATE INDEX "integration_connectors_tenant_id_idx" ON "integration_connectors"("tenant_id");

CREATE INDEX "integrations_tenant_id_idx" ON "integrations"("tenant_id");

CREATE INDEX "integration_logs_tenant_id_integration_id_idx" ON "integration_logs"("tenant_id", "integration_id");

CREATE INDEX "builder_templates_tenant_id_idx" ON "builder_templates"("tenant_id");

CREATE INDEX "builder_permission_rules_tenant_id_idx" ON "builder_permission_rules"("tenant_id");

CREATE INDEX "builder_document_templates_tenant_id_idx" ON "builder_document_templates"("tenant_id");

CREATE INDEX "builder_document_renders_tenant_id_template_id_idx" ON "builder_document_renders"("tenant_id", "template_id");

CREATE INDEX "builder_apis_tenant_id_idx" ON "builder_apis"("tenant_id");

CREATE INDEX "builder_themes_tenant_id_idx" ON "builder_themes"("tenant_id");

CREATE INDEX "builder_environments_tenant_id_idx" ON "builder_environments"("tenant_id");

CREATE INDEX "builder_deployments_tenant_id_environment_id_idx" ON "builder_deployments"("tenant_id", "environment_id");

CREATE INDEX "marketplace_packages_tenant_id_idx" ON "marketplace_packages"("tenant_id");

CREATE INDEX "builder_analytics_events_tenant_id_idx" ON "builder_analytics_events"("tenant_id");

CREATE INDEX "builder_usage_metrics_tenant_id_idx" ON "builder_usage_metrics"("tenant_id");

CREATE INDEX "chatbot_definitions_tenant_id_idx" ON "chatbot_definitions"("tenant_id");

CREATE INDEX "chatbot_intents_tenant_id_bot_id_idx" ON "chatbot_intents"("tenant_id", "bot_id");

CREATE INDEX "chatbot_conversations_tenant_id_bot_id_idx" ON "chatbot_conversations"("tenant_id", "bot_id");

CREATE INDEX "event_definitions_tenant_id_idx" ON "event_definitions"("tenant_id");

CREATE INDEX "event_triggers_tenant_id_event_definition_id_idx" ON "event_triggers"("tenant_id", "event_definition_id");

CREATE INDEX "scheduled_jobs_tenant_id_idx" ON "scheduled_jobs"("tenant_id");

CREATE INDEX "report_definitions_tenant_id_idx" ON "report_definitions"("tenant_id");

CREATE INDEX "report_runs_tenant_id_report_id_idx" ON "report_runs"("tenant_id", "report_id");

CREATE INDEX "dashboard_definitions_tenant_id_idx" ON "dashboard_definitions"("tenant_id");

CREATE INDEX "dashboard_widgets_tenant_id_dashboard_id_idx" ON "dashboard_widgets"("tenant_id", "dashboard_id");

CREATE INDEX "customer_success_plans_tenant_id_customer_id_idx" ON "customer_success_plans"("tenant_id", "customer_id");

CREATE INDEX "customer_success_plans_tenant_id_status_idx" ON "customer_success_plans"("tenant_id", "status");

CREATE INDEX "customer_success_milestones_tenant_id_plan_id_idx" ON "customer_success_milestones"("tenant_id", "plan_id");

CREATE INDEX "sales_playbooks_deep_tenant_id_stage_idx" ON "sales_playbooks_deep"("tenant_id", "stage");

CREATE INDEX "sales_playbook_steps_deep_tenant_id_playbook_id_idx" ON "sales_playbook_steps_deep"("tenant_id", "playbook_id");

CREATE INDEX "sales_intelligence_signals_tenant_id_customer_id_idx" ON "sales_intelligence_signals"("tenant_id", "customer_id");

CREATE INDEX "sales_intelligence_signals_tenant_id_opportunity_id_idx" ON "sales_intelligence_signals"("tenant_id", "opportunity_id");

CREATE INDEX "sales_intelligence_signals_tenant_id_signal_type_idx" ON "sales_intelligence_signals"("tenant_id", "signal_type");

CREATE INDEX "sales_document_templates_tenant_id_category_idx" ON "sales_document_templates"("tenant_id", "category");

CREATE INDEX "sales_document_generations_tenant_id_template_id_idx" ON "sales_document_generations"("tenant_id", "template_id");

CREATE INDEX "sales_document_generations_tenant_id_customer_id_idx" ON "sales_document_generations"("tenant_id", "customer_id");

CREATE UNIQUE INDEX "sales_return_orders_deep_return_number_key" ON "sales_return_orders_deep"("return_number");

CREATE INDEX "sales_return_orders_deep_tenant_id_customer_id_idx" ON "sales_return_orders_deep"("tenant_id", "customer_id");

CREATE INDEX "sales_return_orders_deep_tenant_id_status_idx" ON "sales_return_orders_deep"("tenant_id", "status");

CREATE UNIQUE INDEX "sales_gamification_deep_tenant_id_period_metric_key" ON "sales_gamification_deep"("tenant_id", "period", "metric");

CREATE UNIQUE INDEX "sales_quota_attainments_tenant_id_sales_rep_id_period_key" ON "sales_quota_attainments"("tenant_id", "sales_rep_id", "period");

CREATE UNIQUE INDEX "saas_tenant_tier_configs_tenant_id_tier_name_key" ON "saas_tenant_tier_configs"("tenant_id", "tier_name");

CREATE UNIQUE INDEX "saas_tenant_custom_quotas_tenant_id_resource_key_key" ON "saas_tenant_custom_quotas"("tenant_id", "resource_key");

CREATE UNIQUE INDEX "saas_usage_event_batches_batch_ref_key" ON "saas_usage_event_batches"("batch_ref");

CREATE UNIQUE INDEX "saas_multi_tenant_clusters_cluster_name_key" ON "saas_multi_tenant_clusters"("cluster_name");

CREATE UNIQUE INDEX "saas_tenant_node_routings_tenant_id_cluster_id_key" ON "saas_tenant_node_routings"("tenant_id", "cluster_id");

CREATE UNIQUE INDEX "saas_white_label_domains_custom_domain_key" ON "saas_white_label_domains"("custom_domain");

CREATE UNIQUE INDEX "saas_portal_account_profiles_tenant_id_key" ON "saas_portal_account_profiles"("tenant_id");

CREATE UNIQUE INDEX "saas_portal_usage_dashboards_tenant_id_metric_name_period_key" ON "saas_portal_usage_dashboards"("tenant_id", "metric_name", "period");

CREATE UNIQUE INDEX "saas_portal_support_tickets_deep_ticket_number_key" ON "saas_portal_support_tickets_deep"("ticket_number");

CREATE UNIQUE INDEX "saas_portal_feature_votes_request_id_voter_id_key" ON "saas_portal_feature_votes"("request_id", "voter_id");

CREATE INDEX "search_indexes_tenant_id_module_idx" ON "search_indexes"("tenant_id", "module");

CREATE INDEX "search_indexes_tenant_id_entity_type_idx" ON "search_indexes"("tenant_id", "entity_type");

CREATE INDEX "search_indexes_tenant_id_status_idx" ON "search_indexes"("tenant_id", "status");

CREATE UNIQUE INDEX "search_indexes_tenant_id_entity_type_entity_id_key" ON "search_indexes"("tenant_id", "entity_type", "entity_id");

CREATE INDEX "search_index_rules_tenant_id_module_is_active_idx" ON "search_index_rules"("tenant_id", "module", "is_active");

CREATE UNIQUE INDEX "search_index_rules_tenant_id_entity_type_key" ON "search_index_rules"("tenant_id", "entity_type");

CREATE INDEX "search_query_logs_tenant_id_user_id_idx" ON "search_query_logs"("tenant_id", "user_id");

CREATE INDEX "search_query_logs_tenant_id_created_at_idx" ON "search_query_logs"("tenant_id", "created_at");

CREATE INDEX "search_analytics_tenant_id_date_idx" ON "search_analytics"("tenant_id", "date");

CREATE UNIQUE INDEX "search_analytics_tenant_id_date_key" ON "search_analytics"("tenant_id", "date");

CREATE INDEX "saved_view_layouts_tenant_id_user_id_idx" ON "saved_view_layouts"("tenant_id", "user_id");

CREATE UNIQUE INDEX "saved_view_layouts_tenant_id_user_id_view_id_key" ON "saved_view_layouts"("tenant_id", "user_id", "view_id");

CREATE INDEX "saved_view_filters_tenant_id_view_id_idx" ON "saved_view_filters"("tenant_id", "view_id");

CREATE INDEX "saved_view_column_configs_tenant_id_view_id_idx" ON "saved_view_column_configs"("tenant_id", "view_id");

CREATE UNIQUE INDEX "saved_view_column_configs_tenant_id_view_id_field_user_id_key" ON "saved_view_column_configs"("tenant_id", "view_id", "field", "user_id");

CREATE INDEX "saved_view_sharings_tenant_id_shared_with_user_id_idx" ON "saved_view_sharings"("tenant_id", "shared_with_user_id");

CREATE UNIQUE INDEX "saved_view_sharings_tenant_id_view_id_shared_with_user_id_key" ON "saved_view_sharings"("tenant_id", "view_id", "shared_with_user_id");

CREATE INDEX "notification_templates_tenant_id_channel_is_active_idx" ON "notification_templates"("tenant_id", "channel", "is_active");

CREATE UNIQUE INDEX "notification_templates_tenant_id_name_key" ON "notification_templates"("tenant_id", "name");

CREATE INDEX "notification_batches_tenant_id_status_idx" ON "notification_batches"("tenant_id", "status");

CREATE INDEX "notification_batches_tenant_id_scheduled_at_idx" ON "notification_batches"("tenant_id", "scheduled_at");

CREATE INDEX "notification_batch_items_tenant_id_batch_id_idx" ON "notification_batch_items"("tenant_id", "batch_id");

CREATE INDEX "notification_batch_items_tenant_id_status_idx" ON "notification_batch_items"("tenant_id", "status");

CREATE INDEX "notification_digests_tenant_id_user_id_idx" ON "notification_digests"("tenant_id", "user_id");

CREATE UNIQUE INDEX "notification_digests_tenant_id_user_id_frequency_key" ON "notification_digests"("tenant_id", "user_id", "frequency");

CREATE INDEX "notification_delivery_logs_tenant_id_user_id_status_idx" ON "notification_delivery_logs"("tenant_id", "user_id", "status");

CREATE INDEX "notification_delivery_logs_tenant_id_channel_created_at_idx" ON "notification_delivery_logs"("tenant_id", "channel", "created_at");

CREATE INDEX "deployments_tenant_id_idx" ON "deployments"("tenant_id");

CREATE INDEX "deployments_tenant_id_environment_id_idx" ON "deployments"("tenant_id", "environment_id");

CREATE INDEX "deployments_tenant_id_status_idx" ON "deployments"("tenant_id", "status");

CREATE INDEX "deployment_stages_tenant_id_idx" ON "deployment_stages"("tenant_id");

CREATE INDEX "deployment_stages_deployment_id_idx" ON "deployment_stages"("deployment_id");

CREATE INDEX "environments_tenant_id_idx" ON "environments"("tenant_id");

CREATE UNIQUE INDEX "environments_tenant_id_slug_key" ON "environments"("tenant_id", "slug");

CREATE INDEX "environment_configs_tenant_id_idx" ON "environment_configs"("tenant_id");

CREATE UNIQUE INDEX "environment_configs_tenant_id_environment_id_key_key" ON "environment_configs"("tenant_id", "environment_id", "key");

CREATE INDEX "releases_tenant_id_idx" ON "releases"("tenant_id");

CREATE INDEX "releases_tenant_id_application_version_idx" ON "releases"("tenant_id", "application", "version");

CREATE INDEX "releases_tenant_id_status_idx" ON "releases"("tenant_id", "status");

CREATE INDEX "release_artifacts_tenant_id_idx" ON "release_artifacts"("tenant_id");

CREATE INDEX "release_artifacts_release_id_idx" ON "release_artifacts"("release_id");

CREATE INDEX "build_logs_tenant_id_idx" ON "build_logs"("tenant_id");

CREATE INDEX "build_logs_deployment_id_idx" ON "build_logs"("deployment_id");

CREATE INDEX "build_logs_tenant_id_level_idx" ON "build_logs"("tenant_id", "level");

CREATE INDEX "deployment_analytics_tenant_id_idx" ON "deployment_analytics"("tenant_id");

CREATE UNIQUE INDEX "deployment_analytics_tenant_id_period_period_start_key" ON "deployment_analytics"("tenant_id", "period", "period_start");

CREATE INDEX "pwa_manifests_tenant_id_idx" ON "pwa_manifests"("tenant_id");

CREATE INDEX "pwa_service_workers_tenant_id_idx" ON "pwa_service_workers"("tenant_id");

CREATE INDEX "pwa_offline_cache_rules_tenant_id_idx" ON "pwa_offline_cache_rules"("tenant_id");

CREATE INDEX "pwa_install_prompts_tenant_id_idx" ON "pwa_install_prompts"("tenant_id");

CREATE INDEX "pwa_sync_queues_tenant_id_idx" ON "pwa_sync_queues"("tenant_id");

CREATE INDEX "pwa_sync_queues_tenant_id_status_priority_idx" ON "pwa_sync_queues"("tenant_id", "status", "priority");

CREATE UNIQUE INDEX "pwa_push_subscriptions_endpoint_key" ON "pwa_push_subscriptions"("endpoint");

CREATE INDEX "pwa_push_subscriptions_tenant_id_idx" ON "pwa_push_subscriptions"("tenant_id");

CREATE INDEX "pwa_push_subscriptions_tenant_id_user_id_idx" ON "pwa_push_subscriptions"("tenant_id", "user_id");

CREATE INDEX "pwa_push_subscriptions_tenant_id_status_idx" ON "pwa_push_subscriptions"("tenant_id", "status");

CREATE INDEX "outbox_dlqs_tenant_id_idx" ON "outbox_dlqs"("tenant_id");

CREATE INDEX "outbox_dlqs_tenant_id_status_idx" ON "outbox_dlqs"("tenant_id", "status");

CREATE INDEX "outbox_dlqs_tenant_id_created_at_idx" ON "outbox_dlqs"("tenant_id", "created_at");

CREATE INDEX "outbox_dead_letter_messages_tenant_id_idx" ON "outbox_dead_letter_messages"("tenant_id");

CREATE INDEX "outbox_dead_letter_messages_tenant_id_outbox_dlq_id_idx" ON "outbox_dead_letter_messages"("tenant_id", "outbox_dlq_id");

CREATE INDEX "outbox_retry_logs_tenant_id_idx" ON "outbox_retry_logs"("tenant_id");

CREATE INDEX "outbox_retry_logs_outbox_delivery_id_idx" ON "outbox_retry_logs"("outbox_delivery_id");

CREATE INDEX "outbox_dispatcher_states_tenant_id_idx" ON "outbox_dispatcher_states"("tenant_id");

CREATE UNIQUE INDEX "outbox_dispatcher_states_tenant_id_dispatcher_name_key" ON "outbox_dispatcher_states"("tenant_id", "dispatcher_name");

CREATE INDEX "ext_connections_tenant_id_idx" ON "ext_connections"("tenant_id");

CREATE INDEX "ext_connections_tenant_id_provider_idx" ON "ext_connections"("tenant_id", "provider");

CREATE INDEX "ext_connections_tenant_id_status_idx" ON "ext_connections"("tenant_id", "status");

CREATE UNIQUE INDEX "ext_connections_tenant_id_slug_key" ON "ext_connections"("tenant_id", "slug");

CREATE INDEX "ext_connection_logs_tenant_id_idx" ON "ext_connection_logs"("tenant_id");

CREATE INDEX "ext_connection_logs_connection_id_idx" ON "ext_connection_logs"("connection_id");

CREATE INDEX "ext_connection_logs_tenant_id_created_at_idx" ON "ext_connection_logs"("tenant_id", "created_at");

CREATE INDEX "ext_webhook_configs_tenant_id_idx" ON "ext_webhook_configs"("tenant_id");

CREATE INDEX "ext_webhook_configs_connection_id_idx" ON "ext_webhook_configs"("connection_id");

CREATE INDEX "ext_webhook_configs_tenant_id_active_idx" ON "ext_webhook_configs"("tenant_id", "active");

CREATE INDEX "ext_webhook_deliveries_tenant_id_idx" ON "ext_webhook_deliveries"("tenant_id");

CREATE INDEX "ext_webhook_deliveries_webhook_config_id_idx" ON "ext_webhook_deliveries"("webhook_config_id");

CREATE INDEX "ext_webhook_deliveries_tenant_id_status_idx" ON "ext_webhook_deliveries"("tenant_id", "status");

CREATE INDEX "ext_webhook_deliveries_tenant_id_created_at_idx" ON "ext_webhook_deliveries"("tenant_id", "created_at");

CREATE INDEX "ext_rate_limit_configs_tenant_id_idx" ON "ext_rate_limit_configs"("tenant_id");

CREATE INDEX "ext_rate_limit_configs_connection_id_idx" ON "ext_rate_limit_configs"("connection_id");

CREATE INDEX "ext_rate_limit_usages_tenant_id_idx" ON "ext_rate_limit_usages"("tenant_id");

CREATE INDEX "ext_rate_limit_usages_rate_limit_config_id_idx" ON "ext_rate_limit_usages"("rate_limit_config_id");

CREATE INDEX "ext_integration_templates_tenant_id_idx" ON "ext_integration_templates"("tenant_id");

CREATE INDEX "ext_integration_templates_tenant_id_provider_idx" ON "ext_integration_templates"("tenant_id", "provider");

CREATE UNIQUE INDEX "ext_integration_templates_tenant_id_slug_key" ON "ext_integration_templates"("tenant_id", "slug");

CREATE INDEX "people_competencies_tenant_id_idx" ON "people_competencies"("tenant_id");

CREATE INDEX "people_competencies_tenant_id_category_idx" ON "people_competencies"("tenant_id", "category");

CREATE INDEX "people_succession_plans_tenant_id_idx" ON "people_succession_plans"("tenant_id");

CREATE INDEX "people_succession_plans_tenant_id_readinessRating_idx" ON "people_succession_plans"("tenant_id", "readinessRating");

CREATE INDEX "people_performance_metrics_tenant_id_idx" ON "people_performance_metrics"("tenant_id");

CREATE INDEX "people_performance_metrics_tenant_id_employee_id_idx" ON "people_performance_metrics"("tenant_id", "employee_id");

CREATE INDEX "people_performance_metrics_tenant_id_period_idx" ON "people_performance_metrics"("tenant_id", "period");

CREATE INDEX "search_index_configs_tenant_id_idx" ON "search_index_configs"("tenant_id");

CREATE UNIQUE INDEX "search_index_configs_tenant_id_entity_type_key" ON "search_index_configs"("tenant_id", "entity_type");

CREATE INDEX "search_synonym_groups_tenant_id_idx" ON "search_synonym_groups"("tenant_id");

CREATE INDEX "asset_depreciation_schedules_tenant_id_idx" ON "asset_depreciation_schedules"("tenant_id");

CREATE INDEX "asset_depreciation_schedules_tenant_id_asset_id_idx" ON "asset_depreciation_schedules"("tenant_id", "asset_id");

CREATE INDEX "asset_depreciation_schedules_tenant_id_period_idx" ON "asset_depreciation_schedules"("tenant_id", "period");

CREATE INDEX "asset_maintenance_schedules_tenant_id_idx" ON "asset_maintenance_schedules"("tenant_id");

CREATE INDEX "asset_maintenance_schedules_tenant_id_asset_id_idx" ON "asset_maintenance_schedules"("tenant_id", "asset_id");

CREATE INDEX "asset_maintenance_schedules_tenant_id_status_idx" ON "asset_maintenance_schedules"("tenant_id", "status");

CREATE INDEX "asset_disposal_logs_tenant_id_idx" ON "asset_disposal_logs"("tenant_id");

CREATE INDEX "asset_disposal_logs_tenant_id_asset_id_idx" ON "asset_disposal_logs"("tenant_id", "asset_id");

CREATE INDEX "api_rate_limit_rules_tenant_id_idx" ON "api_rate_limit_rules"("tenant_id");

CREATE INDEX "api_rate_limit_rules_tenant_id_endpoint_path_idx" ON "api_rate_limit_rules"("tenant_id", "endpoint_path");

CREATE INDEX "api_quota_policies_tenant_id_idx" ON "api_quota_policies"("tenant_id");

CREATE INDEX "api_quota_policies_tenant_id_client_app_id_idx" ON "api_quota_policies"("tenant_id", "client_app_id");

CREATE INDEX "api_usage_analytics_tenant_id_idx" ON "api_usage_analytics"("tenant_id");

CREATE INDEX "api_usage_analytics_tenant_id_timestamp_idx" ON "api_usage_analytics"("tenant_id", "timestamp");

CREATE INDEX "api_usage_analytics_tenant_id_endpoint_idx" ON "api_usage_analytics"("tenant_id", "endpoint");

CREATE INDEX "subscription_plan_tiers_tenant_id_idx" ON "subscription_plan_tiers"("tenant_id");

CREATE UNIQUE INDEX "subscription_plan_tiers_tenant_id_code_key" ON "subscription_plan_tiers"("tenant_id", "code");

CREATE INDEX "subscription_usage_billings_tenant_id_idx" ON "subscription_usage_billings"("tenant_id");

CREATE INDEX "subscription_usage_billings_tenant_id_subscription_id_idx" ON "subscription_usage_billings"("tenant_id", "subscription_id");

CREATE INDEX "subscription_usage_billings_tenant_id_billing_period_idx" ON "subscription_usage_billings"("tenant_id", "billing_period");

CREATE INDEX "subscription_churn_surveys_tenant_id_idx" ON "subscription_churn_surveys"("tenant_id");

CREATE INDEX "subscription_churn_surveys_tenant_id_subscription_id_idx" ON "subscription_churn_surveys"("tenant_id", "subscription_id");

CREATE INDEX "storage_bucket_configs_tenant_id_idx" ON "storage_bucket_configs"("tenant_id");

CREATE UNIQUE INDEX "storage_bucket_configs_tenant_id_bucket_name_key" ON "storage_bucket_configs"("tenant_id", "bucket_name");

CREATE INDEX "storage_lifecycle_rules_tenant_id_idx" ON "storage_lifecycle_rules"("tenant_id");

CREATE INDEX "storage_lifecycle_rules_tenant_id_bucket_name_idx" ON "storage_lifecycle_rules"("tenant_id", "bucket_name");

CREATE INDEX "storage_access_policies_tenant_id_idx" ON "storage_access_policies"("tenant_id");

CREATE INDEX "storage_access_policies_tenant_id_bucket_name_idx" ON "storage_access_policies"("tenant_id", "bucket_name");

CREATE INDEX "pwa_offline_sync_queues_tenant_id_idx" ON "pwa_offline_sync_queues"("tenant_id");

CREATE INDEX "pwa_offline_sync_queues_tenant_id_user_id_idx" ON "pwa_offline_sync_queues"("tenant_id", "user_id");

CREATE INDEX "pwa_offline_sync_queues_tenant_id_status_idx" ON "pwa_offline_sync_queues"("tenant_id", "status");

CREATE UNIQUE INDEX "pwa_manifest_configs_tenant_id_key" ON "pwa_manifest_configs"("tenant_id");

CREATE INDEX "saved_view_shares_tenant_id_idx" ON "saved_view_shares"("tenant_id");

CREATE INDEX "saved_view_shares_tenant_id_view_id_idx" ON "saved_view_shares"("tenant_id", "view_id");

CREATE INDEX "saved_view_filter_rules_tenant_id_idx" ON "saved_view_filter_rules"("tenant_id");

CREATE INDEX "saved_view_filter_rules_tenant_id_view_id_idx" ON "saved_view_filter_rules"("tenant_id", "view_id");

CREATE INDEX "saved_view_preferences_tenant_id_idx" ON "saved_view_preferences"("tenant_id");

CREATE INDEX "saved_view_preferences_tenant_id_user_id_idx" ON "saved_view_preferences"("tenant_id", "user_id");

CREATE UNIQUE INDEX "saved_view_preferences_tenant_id_user_id_module_name_key" ON "saved_view_preferences"("tenant_id", "user_id", "module_name");

CREATE INDEX "people_onboarding_tasks_tenant_id_idx" ON "people_onboarding_tasks"("tenant_id");

CREATE INDEX "people_onboarding_tasks_tenant_id_employee_id_idx" ON "people_onboarding_tasks"("tenant_id", "employee_id");

CREATE INDEX "people_time_off_requests_tenant_id_idx" ON "people_time_off_requests"("tenant_id");

CREATE INDEX "people_time_off_requests_tenant_id_employee_id_idx" ON "people_time_off_requests"("tenant_id", "employee_id");

CREATE INDEX "people_time_off_requests_tenant_id_status_idx" ON "people_time_off_requests"("tenant_id", "status");

CREATE INDEX "people_peer_recognitions_tenant_id_idx" ON "people_peer_recognitions"("tenant_id");

CREATE INDEX "people_peer_recognitions_tenant_id_receiver_id_idx" ON "people_peer_recognitions"("tenant_id", "receiver_id");

CREATE INDEX "fixed_asset_insurance_policies_tenant_id_idx" ON "fixed_asset_insurance_policies"("tenant_id");

CREATE INDEX "fixed_asset_insurance_policies_tenant_id_asset_id_idx" ON "fixed_asset_insurance_policies"("tenant_id", "asset_id");

CREATE UNIQUE INDEX "fixed_asset_insurance_policies_tenant_id_policy_no_key" ON "fixed_asset_insurance_policies"("tenant_id", "policy_no");

CREATE INDEX "fixed_asset_revaluations_tenant_id_idx" ON "fixed_asset_revaluations"("tenant_id");

CREATE INDEX "fixed_asset_revaluations_tenant_id_asset_id_idx" ON "fixed_asset_revaluations"("tenant_id", "asset_id");

CREATE INDEX "fixed_asset_physical_audits_tenant_id_idx" ON "fixed_asset_physical_audits"("tenant_id");

CREATE INDEX "fixed_asset_physical_audits_tenant_id_asset_id_idx" ON "fixed_asset_physical_audits"("tenant_id", "asset_id");

CREATE INDEX "sm_service_tickets_tenant_id_idx" ON "sm_service_tickets"("tenant_id");

CREATE INDEX "sm_service_tickets_tenant_id_status_idx" ON "sm_service_tickets"("tenant_id", "status");

CREATE INDEX "sm_service_tickets_tenant_id_assignee_id_idx" ON "sm_service_tickets"("tenant_id", "assignee_id");

CREATE UNIQUE INDEX "sm_service_tickets_tenant_id_number_key" ON "sm_service_tickets"("tenant_id", "number");

CREATE INDEX "sm_ticket_categories_tenant_id_idx" ON "sm_ticket_categories"("tenant_id");

CREATE UNIQUE INDEX "sm_ticket_categories_tenant_id_name_key" ON "sm_ticket_categories"("tenant_id", "name");

CREATE INDEX "sm_ticket_sla_policies_tenant_id_idx" ON "sm_ticket_sla_policies"("tenant_id");

CREATE INDEX "sm_ticket_sla_breaches_tenant_id_idx" ON "sm_ticket_sla_breaches"("tenant_id");

CREATE INDEX "sm_ticket_sla_breaches_ticket_id_idx" ON "sm_ticket_sla_breaches"("ticket_id");

CREATE INDEX "sm_ticket_comments_tenant_id_idx" ON "sm_ticket_comments"("tenant_id");

CREATE INDEX "sm_ticket_comments_ticket_id_idx" ON "sm_ticket_comments"("ticket_id");

CREATE INDEX "sm_ticket_activities_tenant_id_idx" ON "sm_ticket_activities"("tenant_id");

CREATE INDEX "sm_ticket_activities_ticket_id_idx" ON "sm_ticket_activities"("ticket_id");

CREATE INDEX "sm_knowledge_articles_tenant_id_idx" ON "sm_knowledge_articles"("tenant_id");

CREATE INDEX "sm_knowledge_articles_tenant_id_status_idx" ON "sm_knowledge_articles"("tenant_id", "status");

CREATE INDEX "sm_survey_responses_tenant_id_idx" ON "sm_survey_responses"("tenant_id");

CREATE UNIQUE INDEX "sm_survey_responses_tenant_id_ticket_id_key" ON "sm_survey_responses"("tenant_id", "ticket_id");

CREATE INDEX "fixed_asset_components_tenant_id_idx" ON "fixed_asset_components"("tenant_id");

CREATE INDEX "fixed_asset_components_tenant_id_asset_id_idx" ON "fixed_asset_components"("tenant_id", "asset_id");

CREATE INDEX "fixed_asset_component_replacements_tenant_id_idx" ON "fixed_asset_component_replacements"("tenant_id");

CREATE INDEX "fixed_asset_component_replacements_tenant_id_component_id_idx" ON "fixed_asset_component_replacements"("tenant_id", "component_id");

CREATE INDEX "fixed_asset_warranties_tenant_id_idx" ON "fixed_asset_warranties"("tenant_id");

CREATE INDEX "fixed_asset_warranties_tenant_id_asset_id_idx" ON "fixed_asset_warranties"("tenant_id", "asset_id");

CREATE INDEX "fixed_asset_warranty_claims_tenant_id_idx" ON "fixed_asset_warranty_claims"("tenant_id");

CREATE INDEX "fixed_asset_warranty_claims_tenant_id_warranty_id_idx" ON "fixed_asset_warranty_claims"("tenant_id", "warranty_id");

CREATE INDEX "fixed_asset_impairments_tenant_id_idx" ON "fixed_asset_impairments"("tenant_id");

CREATE INDEX "fixed_asset_impairments_tenant_id_asset_id_idx" ON "fixed_asset_impairments"("tenant_id", "asset_id");

CREATE INDEX "fixed_asset_condition_assessments_tenant_id_idx" ON "fixed_asset_condition_assessments"("tenant_id");

CREATE INDEX "fixed_asset_condition_assessments_tenant_id_asset_id_idx" ON "fixed_asset_condition_assessments"("tenant_id", "asset_id");

CREATE INDEX "fixed_asset_documents_tenant_id_idx" ON "fixed_asset_documents"("tenant_id");

CREATE INDEX "fixed_asset_documents_tenant_id_asset_id_idx" ON "fixed_asset_documents"("tenant_id", "asset_id");

CREATE INDEX "fixed_asset_utilization_metrics_tenant_id_idx" ON "fixed_asset_utilization_metrics"("tenant_id");

CREATE INDEX "fixed_asset_utilization_metrics_tenant_id_asset_id_idx" ON "fixed_asset_utilization_metrics"("tenant_id", "asset_id");

CREATE INDEX "fixed_asset_utilization_metrics_tenant_id_asset_id_metric_d_idx" ON "fixed_asset_utilization_metrics"("tenant_id", "asset_id", "metric_date");

CREATE INDEX "fixed_asset_groups_tenant_id_idx" ON "fixed_asset_groups"("tenant_id");

CREATE UNIQUE INDEX "fixed_asset_groups_tenant_id_name_key" ON "fixed_asset_groups"("tenant_id", "name");

CREATE INDEX "fixed_asset_group_members_tenant_id_idx" ON "fixed_asset_group_members"("tenant_id");

CREATE INDEX "fixed_asset_group_members_tenant_id_group_id_idx" ON "fixed_asset_group_members"("tenant_id", "group_id");

CREATE UNIQUE INDEX "fixed_asset_group_members_tenant_id_group_id_asset_id_key" ON "fixed_asset_group_members"("tenant_id", "group_id", "asset_id");

CREATE INDEX "fixed_asset_budget_allocations_tenant_id_idx" ON "fixed_asset_budget_allocations"("tenant_id");

CREATE INDEX "fixed_asset_budget_allocations_tenant_id_fiscal_year_idx" ON "fixed_asset_budget_allocations"("tenant_id", "fiscal_year");

CREATE INDEX "subscription_coupons_tenant_id_idx" ON "subscription_coupons"("tenant_id");

CREATE UNIQUE INDEX "subscription_coupons_tenant_id_code_key" ON "subscription_coupons"("tenant_id", "code");

CREATE INDEX "subscription_coupon_redemptions_tenant_id_idx" ON "subscription_coupon_redemptions"("tenant_id");

CREATE INDEX "subscription_coupon_redemptions_tenant_id_coupon_id_idx" ON "subscription_coupon_redemptions"("tenant_id", "coupon_id");

CREATE INDEX "subscription_plan_groups_tenant_id_idx" ON "subscription_plan_groups"("tenant_id");

CREATE UNIQUE INDEX "subscription_plan_groups_tenant_id_name_key" ON "subscription_plan_groups"("tenant_id", "name");

CREATE INDEX "subscription_migrations_tenant_id_idx" ON "subscription_migrations"("tenant_id");

CREATE INDEX "subscription_migrations_tenant_id_subscription_id_idx" ON "subscription_migrations"("tenant_id", "subscription_id");

CREATE INDEX "subscription_billing_runs_tenant_id_idx" ON "subscription_billing_runs"("tenant_id");

CREATE INDEX "subscription_billing_runs_tenant_id_run_date_idx" ON "subscription_billing_runs"("tenant_id", "run_date");

CREATE INDEX "subscription_billing_run_lines_tenant_id_idx" ON "subscription_billing_run_lines"("tenant_id");

CREATE INDEX "subscription_billing_run_lines_tenant_id_billing_run_id_idx" ON "subscription_billing_run_lines"("tenant_id", "billing_run_id");

CREATE INDEX "subscription_dunning_rules_tenant_id_idx" ON "subscription_dunning_rules"("tenant_id");

CREATE UNIQUE INDEX "subscription_dunning_rules_tenant_id_name_key" ON "subscription_dunning_rules"("tenant_id", "name");

CREATE INDEX "subscription_credit_notes_tenant_id_idx" ON "subscription_credit_notes"("tenant_id");

CREATE INDEX "subscription_credit_notes_tenant_id_subscription_id_idx" ON "subscription_credit_notes"("tenant_id", "subscription_id");

CREATE UNIQUE INDEX "subscription_credit_notes_tenant_id_credit_note_no_key" ON "subscription_credit_notes"("tenant_id", "credit_note_no");

CREATE INDEX "subscription_auto_scale_rules_tenant_id_idx" ON "subscription_auto_scale_rules"("tenant_id");

CREATE INDEX "subscription_auto_scale_rules_tenant_id_subscription_id_idx" ON "subscription_auto_scale_rules"("tenant_id", "subscription_id");

CREATE INDEX "subscription_analytics_snapshots_tenant_id_idx" ON "subscription_analytics_snapshots"("tenant_id");

CREATE INDEX "subscription_analytics_snapshots_tenant_id_snapshot_date_idx" ON "subscription_analytics_snapshots"("tenant_id", "snapshot_date");

CREATE INDEX "locale_translation_contexts_tenant_id_idx" ON "locale_translation_contexts"("tenant_id");

CREATE UNIQUE INDEX "locale_translation_contexts_tenant_id_name_key" ON "locale_translation_contexts"("tenant_id", "name");

CREATE INDEX "locale_glossary_entries_tenant_id_idx" ON "locale_glossary_entries"("tenant_id");

CREATE UNIQUE INDEX "locale_glossary_entries_tenant_id_term_key" ON "locale_glossary_entries"("tenant_id", "term");

CREATE INDEX "locale_translation_memory_entries_tenant_id_idx" ON "locale_translation_memory_entries"("tenant_id");

CREATE INDEX "locale_translation_memory_entries_tenant_id_source_locale_t_idx" ON "locale_translation_memory_entries"("tenant_id", "source_locale", "target_locale");

CREATE INDEX "locale_translation_memory_entries_tenant_id_context_id_idx" ON "locale_translation_memory_entries"("tenant_id", "context_id");

CREATE INDEX "locale_machine_translation_configs_tenant_id_idx" ON "locale_machine_translation_configs"("tenant_id");

CREATE UNIQUE INDEX "locale_machine_translation_configs_tenant_id_provider_key" ON "locale_machine_translation_configs"("tenant_id", "provider");

CREATE INDEX "locale_approval_workflows_tenant_id_idx" ON "locale_approval_workflows"("tenant_id");

CREATE UNIQUE INDEX "locale_approval_workflows_tenant_id_name_key" ON "locale_approval_workflows"("tenant_id", "name");

CREATE INDEX "locale_translation_reviews_tenant_id_idx" ON "locale_translation_reviews"("tenant_id");

CREATE INDEX "locale_translation_reviews_tenant_id_translation_id_idx" ON "locale_translation_reviews"("tenant_id", "translation_id");

CREATE INDEX "locale_fallback_chains_tenant_id_idx" ON "locale_fallback_chains"("tenant_id");

CREATE UNIQUE INDEX "locale_fallback_chains_tenant_id_locale_code_key" ON "locale_fallback_chains"("tenant_id", "locale_code");

CREATE INDEX "locale_content_schedules_tenant_id_idx" ON "locale_content_schedules"("tenant_id");

CREATE INDEX "region_validation_rules_tenant_id_idx" ON "region_validation_rules"("tenant_id");

CREATE UNIQUE INDEX "region_validation_rules_tenant_id_region_code_entity_type_key" ON "region_validation_rules"("tenant_id", "region_code", "entity_type");

CREATE INDEX "report_bookmarks_tenant_id_idx" ON "report_bookmarks"("tenant_id");

CREATE INDEX "report_bookmarks_tenant_id_user_id_idx" ON "report_bookmarks"("tenant_id", "user_id");

CREATE INDEX "report_shares_tenant_id_idx" ON "report_shares"("tenant_id");

CREATE INDEX "report_shares_tenant_id_report_id_idx" ON "report_shares"("tenant_id", "report_id");

CREATE INDEX "report_shares_tenant_id_shared_with_user_id_idx" ON "report_shares"("tenant_id", "shared_with_user_id");

CREATE INDEX "report_versions_tenant_id_idx" ON "report_versions"("tenant_id");

CREATE INDEX "report_versions_tenant_id_report_id_idx" ON "report_versions"("tenant_id", "report_id");

CREATE UNIQUE INDEX "report_versions_tenant_id_report_id_version_key" ON "report_versions"("tenant_id", "report_id", "version");

CREATE INDEX "report_execution_logs_tenant_id_idx" ON "report_execution_logs"("tenant_id");

CREATE INDEX "report_execution_logs_tenant_id_report_id_idx" ON "report_execution_logs"("tenant_id", "report_id");

CREATE INDEX "report_execution_logs_tenant_id_status_idx" ON "report_execution_logs"("tenant_id", "status");

CREATE INDEX "report_drill_path_configs_tenant_id_idx" ON "report_drill_path_configs"("tenant_id");

CREATE INDEX "report_drill_path_configs_tenant_id_report_id_idx" ON "report_drill_path_configs"("tenant_id", "report_id");

CREATE INDEX "report_data_sources_tenant_id_idx" ON "report_data_sources"("tenant_id");

CREATE UNIQUE INDEX "report_data_sources_tenant_id_name_key" ON "report_data_sources"("tenant_id", "name");

CREATE INDEX "report_cache_configs_tenant_id_idx" ON "report_cache_configs"("tenant_id");

CREATE UNIQUE INDEX "report_cache_configs_tenant_id_report_id_key" ON "report_cache_configs"("tenant_id", "report_id");

CREATE INDEX "report_alert_rules_tenant_id_idx" ON "report_alert_rules"("tenant_id");

CREATE INDEX "report_alert_rules_tenant_id_report_id_idx" ON "report_alert_rules"("tenant_id", "report_id");

CREATE INDEX "report_schedule_instances_tenant_id_idx" ON "report_schedule_instances"("tenant_id");

CREATE INDEX "report_schedule_instances_tenant_id_schedule_job_id_idx" ON "report_schedule_instances"("tenant_id", "schedule_job_id");

CREATE INDEX "report_schedule_instances_tenant_id_status_idx" ON "report_schedule_instances"("tenant_id", "status");

CREATE INDEX "report_audit_logs_tenant_id_idx" ON "report_audit_logs"("tenant_id");

CREATE INDEX "report_audit_logs_tenant_id_report_id_idx" ON "report_audit_logs"("tenant_id", "report_id");

CREATE INDEX "report_audit_logs_tenant_id_user_id_idx" ON "report_audit_logs"("tenant_id", "user_id");

CREATE INDEX "report_filter_presets_tenant_id_idx" ON "report_filter_presets"("tenant_id");

CREATE INDEX "report_filter_presets_tenant_id_report_id_idx" ON "report_filter_presets"("tenant_id", "report_id");

CREATE UNIQUE INDEX "report_filter_presets_tenant_id_report_id_name_key" ON "report_filter_presets"("tenant_id", "report_id", "name");

CREATE INDEX "report_column_preferences_tenant_id_idx" ON "report_column_preferences"("tenant_id");

CREATE INDEX "report_column_preferences_tenant_id_user_id_idx" ON "report_column_preferences"("tenant_id", "user_id");

CREATE UNIQUE INDEX "report_column_preferences_tenant_id_user_id_report_id_key" ON "report_column_preferences"("tenant_id", "user_id", "report_id");

CREATE INDEX "document_annotations_tenant_id_document_id_idx" ON "document_annotations"("tenant_id", "document_id");

CREATE INDEX "document_annotations_tenant_id_created_by_idx" ON "document_annotations"("tenant_id", "created_by");

CREATE INDEX "document_comments_tenant_id_document_id_idx" ON "document_comments"("tenant_id", "document_id");

CREATE UNIQUE INDEX "document_tags_tenant_id_name_key" ON "document_tags"("tenant_id", "name");

CREATE INDEX "document_tag_assignments_tenant_id_document_id_idx" ON "document_tag_assignments"("tenant_id", "document_id");

CREATE UNIQUE INDEX "document_tag_assignments_tenant_id_tag_id_document_id_key" ON "document_tag_assignments"("tenant_id", "tag_id", "document_id");

CREATE UNIQUE INDEX "document_locks_document_id_key" ON "document_locks"("document_id");

CREATE INDEX "document_workflows_tenant_id_document_id_idx" ON "document_workflows"("tenant_id", "document_id");

CREATE INDEX "document_exports_tenant_id_document_id_idx" ON "document_exports"("tenant_id", "document_id");

CREATE INDEX "document_audit_logs_tenant_id_document_id_idx" ON "document_audit_logs"("tenant_id", "document_id");

CREATE INDEX "document_audit_logs_tenant_id_action_idx" ON "document_audit_logs"("tenant_id", "action");

CREATE INDEX "document_audit_logs_tenant_id_created_at_idx" ON "document_audit_logs"("tenant_id", "created_at");

CREATE UNIQUE INDEX "document_smart_collections_tenant_id_name_key" ON "document_smart_collections"("tenant_id", "name");

CREATE UNIQUE INDEX "document_favorites_tenant_id_user_id_document_id_key" ON "document_favorites"("tenant_id", "user_id", "document_id");

CREATE INDEX "document_recent_items_tenant_id_user_id_last_viewed_idx" ON "document_recent_items"("tenant_id", "user_id", "last_viewed");

CREATE UNIQUE INDEX "document_recent_items_tenant_id_user_id_document_id_key" ON "document_recent_items"("tenant_id", "user_id", "document_id");

CREATE UNIQUE INDEX "document_watermarks_tenant_id_document_id_key" ON "document_watermarks"("tenant_id", "document_id");

CREATE UNIQUE INDEX "storage_encryptions_tenant_id_file_id_key" ON "storage_encryptions"("tenant_id", "file_id");

CREATE INDEX "storage_replications_tenant_id_file_id_idx" ON "storage_replications"("tenant_id", "file_id");

CREATE INDEX "storage_backups_tenant_id_idx" ON "storage_backups"("tenant_id");

CREATE UNIQUE INDEX "storage_analytics_tenant_id_date_key" ON "storage_analytics"("tenant_id", "date");

CREATE INDEX "storage_alerts_tenant_id_idx" ON "storage_alerts"("tenant_id");

CREATE INDEX "storage_migrations_tenant_id_idx" ON "storage_migrations"("tenant_id");

CREATE INDEX "storage_compressions_tenant_id_file_id_idx" ON "storage_compressions"("tenant_id", "file_id");

CREATE UNIQUE INDEX "storage_deduplications_tenant_id_file_hash_key" ON "storage_deduplications"("tenant_id", "file_hash");

CREATE INDEX "storage_snapshots_tenant_id_idx" ON "storage_snapshots"("tenant_id");

CREATE INDEX "storage_retention_policies_tenant_id_idx" ON "storage_retention_policies"("tenant_id");

CREATE INDEX "storage_compliance_logs_tenant_id_file_id_idx" ON "storage_compliance_logs"("tenant_id", "file_id");

CREATE INDEX "storage_compliance_logs_tenant_id_action_idx" ON "storage_compliance_logs"("tenant_id", "action");

CREATE INDEX "storage_caches_tenant_id_file_id_cacheType_idx" ON "storage_caches"("tenant_id", "file_id", "cacheType");

CREATE INDEX "storage_caches_tenant_id_expires_at_idx" ON "storage_caches"("tenant_id", "expires_at");

CREATE INDEX "storage_syncs_tenant_id_idx" ON "storage_syncs"("tenant_id");

CREATE INDEX "workflow_templates_tenant_id_category_idx" ON "workflow_templates"("tenant_id", "category");

CREATE UNIQUE INDEX "workflow_templates_tenant_id_name_key" ON "workflow_templates"("tenant_id", "name");

CREATE UNIQUE INDEX "workflow_categories_tenant_id_name_key" ON "workflow_categories"("tenant_id", "name");

CREATE INDEX "workflow_versions_tenant_id_definition_id_idx" ON "workflow_versions"("tenant_id", "definition_id");

CREATE UNIQUE INDEX "workflow_versions_tenant_id_definition_id_version_key" ON "workflow_versions"("tenant_id", "definition_id", "version");

CREATE INDEX "workflow_conditions_tenant_id_definition_id_idx" ON "workflow_conditions"("tenant_id", "definition_id");

CREATE INDEX "workflow_loops_tenant_id_definition_id_idx" ON "workflow_loops"("tenant_id", "definition_id");

CREATE INDEX "workflow_subprocesses_tenant_id_parent_definition_id_idx" ON "workflow_subprocesses"("tenant_id", "parent_definition_id");

CREATE INDEX "workflow_error_handlers_tenant_id_definition_id_idx" ON "workflow_error_handlers"("tenant_id", "definition_id");

CREATE INDEX "workflow_notifications_tenant_id_definition_id_idx" ON "workflow_notifications"("tenant_id", "definition_id");

CREATE INDEX "workflow_webhooks_tenant_id_definition_id_idx" ON "workflow_webhooks"("tenant_id", "definition_id");

CREATE UNIQUE INDEX "workflow_metrics_tenant_id_definition_id_date_key" ON "workflow_metrics"("tenant_id", "definition_id", "date");

CREATE UNIQUE INDEX "workflow_tags_tenant_id_name_key" ON "workflow_tags"("tenant_id", "name");

CREATE INDEX "workflow_tag_assignments_tenant_id_definition_id_idx" ON "workflow_tag_assignments"("tenant_id", "definition_id");

CREATE UNIQUE INDEX "workflow_tag_assignments_tenant_id_tag_id_definition_id_key" ON "workflow_tag_assignments"("tenant_id", "tag_id", "definition_id");

CREATE INDEX "crm_lead_routing_rules_tenant_id_idx" ON "crm_lead_routing_rules"("tenant_id");

CREATE INDEX "crm_lead_routing_rules_tenant_id_is_active_idx" ON "crm_lead_routing_rules"("tenant_id", "is_active");

CREATE INDEX "crm_lead_routing_history_tenant_id_idx" ON "crm_lead_routing_history"("tenant_id");

CREATE INDEX "crm_lead_routing_history_lead_id_idx" ON "crm_lead_routing_history"("lead_id");

CREATE INDEX "crm_lead_routing_history_tenant_id_created_at_idx" ON "crm_lead_routing_history"("tenant_id", "created_at");

CREATE INDEX "crm_lead_round_robin_states_tenant_id_team_id_idx" ON "crm_lead_round_robin_states"("tenant_id", "team_id");

CREATE UNIQUE INDEX "crm_lead_round_robin_states_tenant_id_team_id_user_id_key" ON "crm_lead_round_robin_states"("tenant_id", "team_id", "user_id");

CREATE INDEX "crm_enrichment_providers_tenant_id_idx" ON "crm_enrichment_providers"("tenant_id");

CREATE INDEX "crm_enrichment_workflows_tenant_id_idx" ON "crm_enrichment_workflows"("tenant_id");

CREATE INDEX "crm_enrichment_workflows_tenant_id_objectType_idx" ON "crm_enrichment_workflows"("tenant_id", "objectType");

CREATE INDEX "crm_enrichment_jobs_tenant_id_idx" ON "crm_enrichment_jobs"("tenant_id");

CREATE INDEX "crm_enrichment_jobs_tenant_id_status_idx" ON "crm_enrichment_jobs"("tenant_id", "status");

CREATE INDEX "crm_enrichment_jobs_object_id_object_type_idx" ON "crm_enrichment_jobs"("object_id", "object_type");

CREATE INDEX "crm_enrichment_jobs_workflow_id_idx" ON "crm_enrichment_jobs"("workflow_id");

CREATE INDEX "crm_enrichment_job_steps_tenant_id_idx" ON "crm_enrichment_job_steps"("tenant_id");

CREATE INDEX "crm_enrichment_job_steps_job_id_idx" ON "crm_enrichment_job_steps"("job_id");

CREATE INDEX "crm_enrichment_cache_tenant_id_idx" ON "crm_enrichment_cache"("tenant_id");

CREATE INDEX "crm_enrichment_cache_expires_at_idx" ON "crm_enrichment_cache"("expires_at");

CREATE UNIQUE INDEX "crm_enrichment_cache_tenant_id_object_id_object_type_provid_key" ON "crm_enrichment_cache"("tenant_id", "object_id", "object_type", "provider_id");

CREATE INDEX "crm_sales_playbooks_tenant_id_idx" ON "crm_sales_playbooks"("tenant_id");

CREATE INDEX "crm_playbook_stages_tenant_id_playbook_id_idx" ON "crm_playbook_stages"("tenant_id", "playbook_id");

CREATE INDEX "crm_playbook_actions_tenant_id_playbook_id_idx" ON "crm_playbook_actions"("tenant_id", "playbook_id");

CREATE INDEX "crm_playbook_actions_tenant_id_stage_id_idx" ON "crm_playbook_actions"("tenant_id", "stage_id");

CREATE INDEX "crm_deal_guidances_tenant_id_deal_id_idx" ON "crm_deal_guidances"("tenant_id", "deal_id");

CREATE INDEX "crm_competitor_battlecards_tenant_id_idx" ON "crm_competitor_battlecards"("tenant_id");

CREATE INDEX "crm_objection_handlers_tenant_id_idx" ON "crm_objection_handlers"("tenant_id");

CREATE INDEX "crm_omnichannel_campaigns_tenant_id_idx" ON "crm_omnichannel_campaigns"("tenant_id");

CREATE INDEX "crm_campaign_nodes_tenant_id_campaign_id_idx" ON "crm_campaign_nodes"("tenant_id", "campaign_id");

CREATE INDEX "crm_audience_segment_rules_tenant_id_segment_id_idx" ON "crm_audience_segment_rules"("tenant_id", "segment_id");

CREATE INDEX "crm_attribution_models_tenant_id_deal_id_idx" ON "crm_attribution_models"("tenant_id", "deal_id");

CREATE INDEX "crm_attribution_models_tenant_id_campaign_id_idx" ON "crm_attribution_models"("tenant_id", "campaign_id");

CREATE INDEX "crm_marketing_assets_tenant_id_idx" ON "crm_marketing_assets"("tenant_id");

CREATE INDEX "crm_event_webinars_tenant_id_idx" ON "crm_event_webinars"("tenant_id");

CREATE INDEX "crm_abm_account_groups_tenant_id_idx" ON "crm_abm_account_groups"("tenant_id");

CREATE INDEX "crm_intent_signals_tenant_id_customer_id_idx" ON "crm_intent_signals"("tenant_id", "customer_id");

CREATE INDEX "crm_buying_committee_members_tenant_id_customer_id_idx" ON "crm_buying_committee_members"("tenant_id", "customer_id");

CREATE INDEX "crm_buying_committee_members_tenant_id_contact_id_idx" ON "crm_buying_committee_members"("tenant_id", "contact_id");

CREATE INDEX "crm_account_engagement_logs_tenant_id_customer_id_idx" ON "crm_account_engagement_logs"("tenant_id", "customer_id");

CREATE INDEX "crm_health_score_configs_tenant_id_idx" ON "crm_health_score_configs"("tenant_id");

CREATE INDEX "crm_account_health_records_tenant_id_customer_id_idx" ON "crm_account_health_records"("tenant_id", "customer_id");

CREATE INDEX "crm_renewal_pipelines_tenant_id_customer_id_idx" ON "crm_renewal_pipelines"("tenant_id", "customer_id");

CREATE INDEX "crm_customer_feedback_surveys_tenant_id_idx" ON "crm_customer_feedback_surveys"("tenant_id");

CREATE INDEX "crm_nps_responses_tenant_id_survey_id_idx" ON "crm_nps_responses"("tenant_id", "survey_id");

CREATE INDEX "crm_nps_responses_tenant_id_customer_id_idx" ON "crm_nps_responses"("tenant_id", "customer_id");

CREATE INDEX "crm_field_visit_schedules_tenant_id_rep_id_idx" ON "crm_field_visit_schedules"("tenant_id", "rep_id");

CREATE INDEX "crm_field_visit_schedules_tenant_id_customer_id_idx" ON "crm_field_visit_schedules"("tenant_id", "customer_id");

CREATE INDEX "crm_sales_route_plans_tenant_id_rep_id_idx" ON "crm_sales_route_plans"("tenant_id", "rep_id");

CREATE INDEX "crm_partner_tier_benefits_tenant_id_idx" ON "crm_partner_tier_benefits"("tenant_id");

CREATE INDEX "crm_partner_certifications_tenant_id_partner_id_idx" ON "crm_partner_certifications"("tenant_id", "partner_id");

CREATE INDEX "crm_saved_reports_tenant_id_idx" ON "crm_saved_reports"("tenant_id");

CREATE INDEX "crm_saved_reports_tenant_id_module_idx" ON "crm_saved_reports"("tenant_id", "module");

CREATE INDEX "crm_saved_reports_category_id_idx" ON "crm_saved_reports"("category_id");

CREATE INDEX "crm_report_schedules_tenant_id_idx" ON "crm_report_schedules"("tenant_id");

CREATE INDEX "crm_report_schedules_report_id_idx" ON "crm_report_schedules"("report_id");

CREATE INDEX "crm_report_shares_tenant_id_idx" ON "crm_report_shares"("tenant_id");

CREATE UNIQUE INDEX "crm_report_shares_tenant_id_report_id_user_id_key" ON "crm_report_shares"("tenant_id", "report_id", "user_id");

CREATE INDEX "crm_dashboard_templates_tenant_id_idx" ON "crm_dashboard_templates"("tenant_id");

CREATE INDEX "crm_dashboard_templates_tenant_id_category_idx" ON "crm_dashboard_templates"("tenant_id", "category");

CREATE INDEX "crm_dashboard_shares_tenant_id_idx" ON "crm_dashboard_shares"("tenant_id");

CREATE UNIQUE INDEX "crm_dashboard_shares_tenant_id_dashboard_id_user_id_key" ON "crm_dashboard_shares"("tenant_id", "dashboard_id", "user_id");

CREATE INDEX "education_parents_tenant_id_idx" ON "education_parents"("tenant_id");

CREATE INDEX "education_parents_email_idx" ON "education_parents"("email");

CREATE INDEX "education_student_parents_tenant_id_idx" ON "education_student_parents"("tenant_id");

CREATE UNIQUE INDEX "education_student_parents_student_id_parent_id_key" ON "education_student_parents"("student_id", "parent_id");

CREATE INDEX "education_enrollments_tenant_id_idx" ON "education_enrollments"("tenant_id");

CREATE INDEX "education_enrollments_student_id_idx" ON "education_enrollments"("student_id");

CREATE INDEX "education_enrollments_course_id_idx" ON "education_enrollments"("course_id");

CREATE UNIQUE INDEX "education_enrollments_tenant_id_student_id_course_id_academ_key" ON "education_enrollments"("tenant_id", "student_id", "course_id", "academic_year", "semester");

CREATE INDEX "education_course_modules_tenant_id_idx" ON "education_course_modules"("tenant_id");

CREATE INDEX "education_course_modules_course_id_idx" ON "education_course_modules"("course_id");

CREATE INDEX "education_gradebooks_tenant_id_idx" ON "education_gradebooks"("tenant_id");

CREATE INDEX "education_gradebooks_course_id_idx" ON "education_gradebooks"("course_id");

CREATE INDEX "education_grade_entries_tenant_id_idx" ON "education_grade_entries"("tenant_id");

CREATE INDEX "education_grade_entries_gradebook_id_idx" ON "education_grade_entries"("gradebook_id");

CREATE INDEX "education_grade_entries_student_id_idx" ON "education_grade_entries"("student_id");

CREATE UNIQUE INDEX "education_grade_entries_gradebook_id_student_id_key" ON "education_grade_entries"("gradebook_id", "student_id");

CREATE INDEX "education_attendances_tenant_id_idx" ON "education_attendances"("tenant_id");

CREATE INDEX "education_attendances_course_id_idx" ON "education_attendances"("course_id");

CREATE UNIQUE INDEX "education_attendances_tenant_id_course_id_date_key" ON "education_attendances"("tenant_id", "course_id", "date");

CREATE UNIQUE INDEX "education_fee_invoices_invoice_number_key" ON "education_fee_invoices"("invoice_number");

CREATE INDEX "education_fee_invoices_tenant_id_idx" ON "education_fee_invoices"("tenant_id");

CREATE INDEX "education_fee_invoices_student_id_idx" ON "education_fee_invoices"("student_id");

CREATE INDEX "education_fee_invoices_status_idx" ON "education_fee_invoices"("status");

CREATE INDEX "education_fee_payments_tenant_id_idx" ON "education_fee_payments"("tenant_id");

CREATE INDEX "education_fee_payments_invoice_id_idx" ON "education_fee_payments"("invoice_id");

CREATE INDEX "education_library_fines_tenant_id_idx" ON "education_library_fines"("tenant_id");

CREATE INDEX "education_library_fines_student_id_idx" ON "education_library_fines"("student_id");

CREATE INDEX "education_exam_schedules_tenant_id_idx" ON "education_exam_schedules"("tenant_id");

CREATE INDEX "education_exam_schedules_course_id_idx" ON "education_exam_schedules"("course_id");

CREATE INDEX "education_exam_schedules_exam_date_idx" ON "education_exam_schedules"("exam_date");

CREATE INDEX "education_exam_results_tenant_id_idx" ON "education_exam_results"("tenant_id");

CREATE INDEX "education_exam_results_exam_id_idx" ON "education_exam_results"("exam_id");

CREATE INDEX "education_exam_results_student_id_idx" ON "education_exam_results"("student_id");

CREATE UNIQUE INDEX "education_exam_results_exam_id_student_id_key" ON "education_exam_results"("exam_id", "student_id");

CREATE INDEX "education_report_cards_tenant_id_idx" ON "education_report_cards"("tenant_id");

CREATE INDEX "education_report_cards_tenant_id_student_id_idx" ON "education_report_cards"("tenant_id", "student_id");

CREATE INDEX "education_scholarships_tenant_id_idx" ON "education_scholarships"("tenant_id");

CREATE INDEX "education_scholarships_tenant_id_student_id_idx" ON "education_scholarships"("tenant_id", "student_id");

CREATE INDEX "education_assignment_submissions_tenant_id_idx" ON "education_assignment_submissions"("tenant_id");

CREATE INDEX "education_assignment_submissions_tenant_id_assignment_id_idx" ON "education_assignment_submissions"("tenant_id", "assignment_id");

CREATE INDEX "education_assignment_submissions_tenant_id_student_id_idx" ON "education_assignment_submissions"("tenant_id", "student_id");

CREATE INDEX "field_service_slas_tenant_id_idx" ON "field_service_slas"("tenant_id");

CREATE INDEX "field_service_slas_tenant_id_priority_idx" ON "field_service_slas"("tenant_id", "priority");

CREATE INDEX "field_service_appointments_tenant_id_idx" ON "field_service_appointments"("tenant_id");

CREATE INDEX "field_service_appointments_ticket_id_idx" ON "field_service_appointments"("ticket_id");

CREATE INDEX "field_service_appointments_technician_id_idx" ON "field_service_appointments"("technician_id");

CREATE INDEX "field_service_appointments_start_time_idx" ON "field_service_appointments"("start_time");

CREATE INDEX "field_service_inventory_items_tenant_id_idx" ON "field_service_inventory_items"("tenant_id");

CREATE INDEX "field_service_inventory_items_tenant_id_sku_idx" ON "field_service_inventory_items"("tenant_id", "sku");

CREATE INDEX "field_service_inventory_items_tenant_id_category_idx" ON "field_service_inventory_items"("tenant_id", "category");

CREATE INDEX "field_service_inventory_items_tenant_id_status_idx" ON "field_service_inventory_items"("tenant_id", "status");

CREATE UNIQUE INDEX "field_service_inventory_items_tenant_id_sku_key" ON "field_service_inventory_items"("tenant_id", "sku");

CREATE INDEX "field_service_contracts_tenant_id_idx" ON "field_service_contracts"("tenant_id");

CREATE INDEX "field_service_contracts_tenant_id_status_idx" ON "field_service_contracts"("tenant_id", "status");

CREATE INDEX "field_service_contracts_tenant_id_start_date_end_date_idx" ON "field_service_contracts"("tenant_id", "start_date", "end_date");

CREATE INDEX "field_service_timesheets_tenant_id_idx" ON "field_service_timesheets"("tenant_id");

CREATE INDEX "field_service_timesheets_ticket_id_idx" ON "field_service_timesheets"("ticket_id");

CREATE INDEX "field_service_timesheets_technician_id_idx" ON "field_service_timesheets"("technician_id");

CREATE INDEX "field_service_timesheets_tenant_id_date_worked_idx" ON "field_service_timesheets"("tenant_id", "date_worked");

CREATE INDEX "field_service_timesheets_tenant_id_status_idx" ON "field_service_timesheets"("tenant_id", "status");

CREATE INDEX "field_service_parts_usage_tenant_id_idx" ON "field_service_parts_usage"("tenant_id");

CREATE INDEX "field_service_parts_usage_ticket_id_idx" ON "field_service_parts_usage"("ticket_id");

CREATE INDEX "field_service_parts_usage_item_id_idx" ON "field_service_parts_usage"("item_id");

CREATE INDEX "field_service_technician_dashboards_tenant_id_idx" ON "field_service_technician_dashboards"("tenant_id");

CREATE INDEX "field_service_technician_dashboards_technician_id_idx" ON "field_service_technician_dashboards"("technician_id");

CREATE INDEX "field_service_technician_dashboards_tenant_id_date_idx" ON "field_service_technician_dashboards"("tenant_id", "date");

CREATE INDEX "field_service_technician_dashboards_tenant_id_technician_id_idx" ON "field_service_technician_dashboards"("tenant_id", "technician_id", "date");

CREATE INDEX "field_service_schedules_tenant_id_idx" ON "field_service_schedules"("tenant_id");

CREATE INDEX "field_service_schedules_technician_id_idx" ON "field_service_schedules"("technician_id");

CREATE INDEX "field_service_schedules_ticket_id_idx" ON "field_service_schedules"("ticket_id");

CREATE INDEX "field_service_schedules_tenant_id_scheduled_date_idx" ON "field_service_schedules"("tenant_id", "scheduled_date");

CREATE INDEX "field_service_schedules_tenant_id_status_idx" ON "field_service_schedules"("tenant_id", "status");

CREATE INDEX "field_service_calendar_events_tenant_id_idx" ON "field_service_calendar_events"("tenant_id");

CREATE INDEX "field_service_calendar_events_technician_id_idx" ON "field_service_calendar_events"("technician_id");

CREATE INDEX "field_service_calendar_events_tenant_id_start_time_end_time_idx" ON "field_service_calendar_events"("tenant_id", "start_time", "end_time");

CREATE INDEX "field_service_part_requests_tenant_id_idx" ON "field_service_part_requests"("tenant_id");

CREATE INDEX "field_service_part_requests_technician_id_idx" ON "field_service_part_requests"("technician_id");

CREATE INDEX "field_service_part_requests_ticket_id_idx" ON "field_service_part_requests"("ticket_id");

CREATE INDEX "field_service_part_requests_tenant_id_status_idx" ON "field_service_part_requests"("tenant_id", "status");

CREATE INDEX "field_service_van_stock_tenant_id_idx" ON "field_service_van_stock"("tenant_id");

CREATE INDEX "field_service_van_stock_technician_id_idx" ON "field_service_van_stock"("technician_id");

CREATE UNIQUE INDEX "field_service_van_stock_tenant_id_technician_id_item_id_key" ON "field_service_van_stock"("tenant_id", "technician_id", "item_id");

CREATE INDEX "field_service_warranties_tenant_id_idx" ON "field_service_warranties"("tenant_id");

CREATE INDEX "field_service_warranties_tenant_id_asset_id_idx" ON "field_service_warranties"("tenant_id", "asset_id");

CREATE UNIQUE INDEX "field_service_warranties_tenant_id_warranty_no_key" ON "field_service_warranties"("tenant_id", "warranty_no");

CREATE INDEX "field_service_work_order_expenses_tenant_id_idx" ON "field_service_work_order_expenses"("tenant_id");

CREATE INDEX "field_service_work_order_expenses_tenant_id_work_order_id_idx" ON "field_service_work_order_expenses"("tenant_id", "work_order_id");

CREATE INDEX "field_service_inspection_checklists_tenant_id_idx" ON "field_service_inspection_checklists"("tenant_id");

CREATE INDEX "field_service_inspection_checklists_tenant_id_work_order_id_idx" ON "field_service_inspection_checklists"("tenant_id", "work_order_id");

CREATE INDEX "invoice_factoring_facilities_tenant_id_status_idx" ON "invoice_factoring_facilities"("tenant_id", "status");

CREATE INDEX "invoice_factoring_advances_tenant_id_facility_id_idx" ON "invoice_factoring_advances"("tenant_id", "facility_id");

CREATE INDEX "invoice_factoring_advances_tenant_id_status_idx" ON "invoice_factoring_advances"("tenant_id", "status");

CREATE INDEX "invoice_capture_batches_tenant_id_status_idx" ON "invoice_capture_batches"("tenant_id", "status");

CREATE INDEX "invoice_capture_results_tenant_id_batch_id_idx" ON "invoice_capture_results"("tenant_id", "batch_id");

CREATE INDEX "invoice_capture_results_tenant_id_validation_status_idx" ON "invoice_capture_results"("tenant_id", "validation_status");

CREATE INDEX "invoice_match_rules_tenant_id_match_type_idx" ON "invoice_match_rules"("tenant_id", "match_type");

CREATE INDEX "payment_rail_optimizations_tenant_id_status_idx" ON "payment_rail_optimizations"("tenant_id", "status");

CREATE INDEX "financial_nlp_query_logs_tenant_id_parsed_intent_idx" ON "financial_nlp_query_logs"("tenant_id", "parsed_intent");

CREATE INDEX "financial_nlp_query_logs_tenant_id_queried_at_idx" ON "financial_nlp_query_logs"("tenant_id", "queried_at");

CREATE INDEX "account_scores_tenant_id_idx" ON "account_scores"("tenant_id");

CREATE UNIQUE INDEX "account_scores_tenant_id_customer_id_key" ON "account_scores"("tenant_id", "customer_id");

CREATE INDEX "healthcare_patient_allergies_tenant_id_idx" ON "healthcare_patient_allergies"("tenant_id");

CREATE INDEX "healthcare_patient_allergies_patient_id_idx" ON "healthcare_patient_allergies"("patient_id");

CREATE INDEX "healthcare_appointment_schedules_tenant_id_idx" ON "healthcare_appointment_schedules"("tenant_id");

CREATE INDEX "healthcare_appointment_schedules_patient_id_idx" ON "healthcare_appointment_schedules"("patient_id");

CREATE INDEX "healthcare_appointment_schedules_practitioner_id_idx" ON "healthcare_appointment_schedules"("practitioner_id");

CREATE INDEX "healthcare_prescription_items_tenant_id_idx" ON "healthcare_prescription_items"("tenant_id");

CREATE INDEX "healthcare_prescription_items_prescription_id_idx" ON "healthcare_prescription_items"("prescription_id");

CREATE INDEX "healthcare_lab_orders_tenant_id_idx" ON "healthcare_lab_orders"("tenant_id");

CREATE INDEX "healthcare_lab_orders_patient_id_idx" ON "healthcare_lab_orders"("patient_id");

CREATE INDEX "healthcare_lab_orders_practitioner_id_idx" ON "healthcare_lab_orders"("practitioner_id");

CREATE INDEX "healthcare_lab_orders_status_idx" ON "healthcare_lab_orders"("status");

CREATE INDEX "healthcare_lab_results_tenant_id_idx" ON "healthcare_lab_results"("tenant_id");

CREATE INDEX "healthcare_lab_results_order_id_idx" ON "healthcare_lab_results"("order_id");

CREATE INDEX "healthcare_insurance_policies_tenant_id_idx" ON "healthcare_insurance_policies"("tenant_id");

CREATE INDEX "healthcare_insurance_policies_patient_id_idx" ON "healthcare_insurance_policies"("patient_id");

CREATE UNIQUE INDEX "healthcare_insurance_claims_claim_number_key" ON "healthcare_insurance_claims"("claim_number");

CREATE INDEX "healthcare_insurance_claims_tenant_id_idx" ON "healthcare_insurance_claims"("tenant_id");

CREATE INDEX "healthcare_insurance_claims_policy_id_idx" ON "healthcare_insurance_claims"("policy_id");

CREATE INDEX "healthcare_insurance_claims_status_idx" ON "healthcare_insurance_claims"("status");

CREATE INDEX "healthcare_pharmacy_batches_tenant_id_idx" ON "healthcare_pharmacy_batches"("tenant_id");

CREATE INDEX "healthcare_pharmacy_batches_drug_id_idx" ON "healthcare_pharmacy_batches"("drug_id");

CREATE INDEX "healthcare_pharmacy_batches_batch_number_idx" ON "healthcare_pharmacy_batches"("batch_number");

CREATE INDEX "healthcare_pharmacy_batches_expiry_date_idx" ON "healthcare_pharmacy_batches"("expiry_date");

CREATE INDEX "healthcare_controlled_substance_logs_tenant_id_idx" ON "healthcare_controlled_substance_logs"("tenant_id");

CREATE INDEX "healthcare_controlled_substance_logs_drug_id_idx" ON "healthcare_controlled_substance_logs"("drug_id");

CREATE INDEX "healthcare_controlled_substance_logs_logged_at_idx" ON "healthcare_controlled_substance_logs"("logged_at");

CREATE INDEX "healthcare_doctor_schedules_tenant_id_idx" ON "healthcare_doctor_schedules"("tenant_id");

CREATE INDEX "healthcare_doctor_schedules_practitioner_id_idx" ON "healthcare_doctor_schedules"("practitioner_id");

CREATE INDEX "healthcare_medical_records_tenant_id_idx" ON "healthcare_medical_records"("tenant_id");

CREATE INDEX "healthcare_medical_records_patient_id_idx" ON "healthcare_medical_records"("patient_id");

CREATE INDEX "healthcare_medical_records_recordType_idx" ON "healthcare_medical_records"("recordType");

CREATE INDEX "healthcare_clinical_notes_tenant_id_idx" ON "healthcare_clinical_notes"("tenant_id");

CREATE INDEX "healthcare_clinical_notes_tenant_id_patient_id_idx" ON "healthcare_clinical_notes"("tenant_id", "patient_id");

CREATE INDEX "healthcare_clinical_notes_tenant_id_doctor_id_idx" ON "healthcare_clinical_notes"("tenant_id", "doctor_id");

CREATE INDEX "healthcare_telemedicine_sessions_tenant_id_idx" ON "healthcare_telemedicine_sessions"("tenant_id");

CREATE INDEX "healthcare_telemedicine_sessions_tenant_id_patient_id_idx" ON "healthcare_telemedicine_sessions"("tenant_id", "patient_id");

CREATE INDEX "healthcare_telemedicine_sessions_tenant_id_status_idx" ON "healthcare_telemedicine_sessions"("tenant_id", "status");

CREATE INDEX "healthcare_medical_bills_tenant_id_idx" ON "healthcare_medical_bills"("tenant_id");

CREATE INDEX "healthcare_medical_bills_tenant_id_patient_id_idx" ON "healthcare_medical_bills"("tenant_id", "patient_id");

CREATE INDEX "healthcare_medical_bills_tenant_id_status_idx" ON "healthcare_medical_bills"("tenant_id", "status");

CREATE UNIQUE INDEX "healthcare_medical_bills_tenant_id_bill_number_key" ON "healthcare_medical_bills"("tenant_id", "bill_number");

CREATE INDEX "hr_ticket_categories_tenant_id_idx" ON "hr_ticket_categories"("tenant_id");

CREATE INDEX "hr_advanced_tickets_tenant_id_status_idx" ON "hr_advanced_tickets"("tenant_id", "status");

CREATE INDEX "hr_advanced_tickets_tenant_id_employee_id_idx" ON "hr_advanced_tickets"("tenant_id", "employee_id");

CREATE INDEX "hr_advanced_tickets_tenant_id_assigned_to_idx" ON "hr_advanced_tickets"("tenant_id", "assigned_to");

CREATE INDEX "hr_ticket_assignments_tenant_id_ticket_id_idx" ON "hr_ticket_assignments"("tenant_id", "ticket_id");

CREATE INDEX "hr_ticket_assignments_tenant_id_assignee_id_idx" ON "hr_ticket_assignments"("tenant_id", "assignee_id");

CREATE INDEX "employee_grievances_tenant_id_employee_id_idx" ON "employee_grievances"("tenant_id", "employee_id");

CREATE INDEX "employee_grievances_tenant_id_status_idx" ON "employee_grievances"("tenant_id", "status");

CREATE INDEX "employee_wellness_programs_tenant_id_program_type_idx" ON "employee_wellness_programs"("tenant_id", "program_type");

CREATE INDEX "hr_headcount_plans_tenant_id_fiscal_year_idx" ON "hr_headcount_plans"("tenant_id", "fiscal_year");

CREATE INDEX "hr_headcount_plan_lines_tenant_id_plan_id_idx" ON "hr_headcount_plan_lines"("tenant_id", "plan_id");

CREATE INDEX "hr_succession_plans_tenant_id_status_idx" ON "hr_succession_plans"("tenant_id", "status");

CREATE UNIQUE INDEX "hr_succession_plans_tenant_id_position_id_key" ON "hr_succession_plans"("tenant_id", "position_id");

CREATE INDEX "hr_succession_candidates_tenant_id_plan_id_idx" ON "hr_succession_candidates"("tenant_id", "plan_id");

CREATE UNIQUE INDEX "hr_succession_candidates_tenant_id_plan_id_employee_id_key" ON "hr_succession_candidates"("tenant_id", "plan_id", "employee_id");

CREATE INDEX "employee_recognitions_tenant_id_employee_id_idx" ON "employee_recognitions"("tenant_id", "employee_id");

CREATE INDEX "employee_recognitions_tenant_id_category_idx" ON "employee_recognitions"("tenant_id", "category");

CREATE INDEX "employee_recognition_awards_tenant_id_category_idx" ON "employee_recognition_awards"("tenant_id", "category");

CREATE INDEX "hr_survey_responses_tenant_id_survey_id_idx" ON "hr_survey_responses"("tenant_id", "survey_id");

CREATE INDEX "hr_survey_responses_tenant_id_employee_id_idx" ON "hr_survey_responses"("tenant_id", "employee_id");

CREATE UNIQUE INDEX "hr_survey_responses_tenant_id_survey_id_survey_type_employe_key" ON "hr_survey_responses"("tenant_id", "survey_id", "survey_type", "employee_id");

CREATE INDEX "employee_journey_milestones_tenant_id_employee_id_idx" ON "employee_journey_milestones"("tenant_id", "employee_id");

CREATE INDEX "employee_journey_milestones_tenant_id_milestone_type_idx" ON "employee_journey_milestones"("tenant_id", "milestone_type");

CREATE INDEX "warehouse_network_designs_tenant_id_idx" ON "warehouse_network_designs"("tenant_id");

CREATE INDEX "warehouse_network_nodes_tenant_id_design_id_idx" ON "warehouse_network_nodes"("tenant_id", "design_id");

CREATE INDEX "routing_rules_tenant_id_idx" ON "routing_rules"("tenant_id");

CREATE INDEX "mfg_spc_charts_tenant_id_idx" ON "mfg_spc_charts"("tenant_id");

CREATE INDEX "mfg_spc_data_points_tenant_id_chart_id_idx" ON "mfg_spc_data_points"("tenant_id", "chart_id");

CREATE INDEX "mfg_cost_entries_tenant_id_cost_sheet_id_idx" ON "mfg_cost_entries"("tenant_id", "cost_sheet_id");

CREATE INDEX "mfg_maintenance_work_orders_tenant_id_idx" ON "mfg_maintenance_work_orders"("tenant_id");

CREATE INDEX "mfg_maintenance_work_orders_tenant_id_machine_id_idx" ON "mfg_maintenance_work_orders"("tenant_id", "machine_id");

CREATE INDEX "mfg_document_controls_tenant_id_idx" ON "mfg_document_controls"("tenant_id");

CREATE INDEX "mfg_document_versions_tenant_id_doc_id_idx" ON "mfg_document_versions"("tenant_id", "doc_id");

CREATE INDEX "programs_tenant_id_idx" ON "programs"("tenant_id");

CREATE UNIQUE INDEX "programs_tenant_id_org_id_code_key" ON "programs"("tenant_id", "org_id", "code");

CREATE INDEX "program_projects_tenant_id_idx" ON "program_projects"("tenant_id");

CREATE INDEX "program_projects_program_id_idx" ON "program_projects"("program_id");

CREATE UNIQUE INDEX "program_projects_tenant_id_program_id_project_id_key" ON "program_projects"("tenant_id", "program_id", "project_id");

CREATE INDEX "program_benefits_tenant_id_idx" ON "program_benefits"("tenant_id");

CREATE INDEX "program_benefits_program_id_idx" ON "program_benefits"("program_id");

CREATE INDEX "program_financials_tenant_id_idx" ON "program_financials"("tenant_id");

CREATE INDEX "program_financials_program_id_idx" ON "program_financials"("program_id");

CREATE INDEX "project_claims_tenant_id_idx" ON "project_claims"("tenant_id");

CREATE INDEX "project_claims_project_id_idx" ON "project_claims"("project_id");

CREATE UNIQUE INDEX "project_claims_tenant_id_claim_number_key" ON "project_claims"("tenant_id", "claim_number");

CREATE INDEX "project_discussions_tenant_id_idx" ON "project_discussions"("tenant_id");

CREATE INDEX "project_discussions_project_id_idx" ON "project_discussions"("project_id");

CREATE INDEX "project_wiki_pages_tenant_id_idx" ON "project_wiki_pages"("tenant_id");

CREATE INDEX "project_wiki_pages_project_id_idx" ON "project_wiki_pages"("project_id");

CREATE UNIQUE INDEX "project_wiki_pages_tenant_id_project_id_slug_key" ON "project_wiki_pages"("tenant_id", "project_id", "slug");

CREATE INDEX "project_feed_events_tenant_id_idx" ON "project_feed_events"("tenant_id");

CREATE INDEX "project_feed_events_project_id_idx" ON "project_feed_events"("project_id");

CREATE INDEX "project_feed_events_created_at_idx" ON "project_feed_events"("created_at");

CREATE INDEX "production_batches_tenant_id_idx" ON "production_batches"("tenant_id");

CREATE INDEX "production_batches_tenant_id_product_id_idx" ON "production_batches"("tenant_id", "product_id");

CREATE INDEX "production_formulas_tenant_id_idx" ON "production_formulas"("tenant_id");

CREATE INDEX "production_shifts_tenant_id_idx" ON "production_shifts"("tenant_id");

CREATE INDEX "production_analytics_snapshots_tenant_id_idx" ON "production_analytics_snapshots"("tenant_id");

CREATE INDEX "project_issue_logs_tenant_id_project_id_idx" ON "project_issue_logs"("tenant_id", "project_id");

CREATE INDEX "project_templates_tenant_id_idx" ON "project_templates"("tenant_id");

CREATE INDEX "project_stakeholders_tenant_id_project_id_idx" ON "project_stakeholders"("tenant_id", "project_id");

CREATE INDEX "project_benefits_tenant_id_project_id_idx" ON "project_benefits"("tenant_id", "project_id");

CREATE INDEX "project_meetings_tenant_id_project_id_idx" ON "project_meetings"("tenant_id", "project_id");

CREATE INDEX "project_subcontractors_tenant_id_project_id_idx" ON "project_subcontractors"("tenant_id", "project_id");

CREATE INDEX "real_estate_portfolios_tenant_id_idx" ON "real_estate_portfolios"("tenant_id");

CREATE INDEX "real_estate_portfolios_tenant_id_type_idx" ON "real_estate_portfolios"("tenant_id", "type");

CREATE INDEX "real_estate_buildings_tenant_id_idx" ON "real_estate_buildings"("tenant_id");

CREATE INDEX "real_estate_units_tenant_id_idx" ON "real_estate_units"("tenant_id");

CREATE INDEX "real_estate_units_property_id_idx" ON "real_estate_units"("property_id");

CREATE INDEX "real_estate_units_tenant_id_status_idx" ON "real_estate_units"("tenant_id", "status");

CREATE INDEX "real_estate_lease_payments_tenant_id_idx" ON "real_estate_lease_payments"("tenant_id");

CREATE INDEX "real_estate_lease_payments_lease_id_idx" ON "real_estate_lease_payments"("lease_id");

CREATE INDEX "real_estate_lease_payments_tenant_id_status_idx" ON "real_estate_lease_payments"("tenant_id", "status");

CREATE INDEX "real_estate_lease_payments_tenant_id_due_date_idx" ON "real_estate_lease_payments"("tenant_id", "due_date");

CREATE INDEX "real_estate_maintenance_vendors_tenant_id_idx" ON "real_estate_maintenance_vendors"("tenant_id");

CREATE INDEX "real_estate_maintenance_vendors_tenant_id_status_idx" ON "real_estate_maintenance_vendors"("tenant_id", "status");

CREATE INDEX "real_estate_commission_plans_tenant_id_idx" ON "real_estate_commission_plans"("tenant_id");

CREATE INDEX "real_estate_commission_plans_property_id_idx" ON "real_estate_commission_plans"("property_id");

CREATE INDEX "real_estate_commission_plans_tenant_id_agent_name_idx" ON "real_estate_commission_plans"("tenant_id", "agent_name");

CREATE INDEX "real_estate_commission_payouts_tenant_id_idx" ON "real_estate_commission_payouts"("tenant_id");

CREATE INDEX "real_estate_commission_payouts_plan_id_idx" ON "real_estate_commission_payouts"("plan_id");

CREATE INDEX "real_estate_commission_payouts_tenant_id_status_idx" ON "real_estate_commission_payouts"("tenant_id", "status");

CREATE INDEX "real_estate_valuations_tenant_id_idx" ON "real_estate_valuations"("tenant_id");

CREATE INDEX "real_estate_valuations_property_id_idx" ON "real_estate_valuations"("property_id");

CREATE INDEX "real_estate_valuations_tenant_id_valuation_date_idx" ON "real_estate_valuations"("tenant_id", "valuation_date");

CREATE INDEX "real_estate_maintenance_requests_tenant_id_idx" ON "real_estate_maintenance_requests"("tenant_id");

CREATE INDEX "real_estate_maintenance_requests_property_id_idx" ON "real_estate_maintenance_requests"("property_id");

CREATE INDEX "real_estate_maintenance_requests_vendor_id_idx" ON "real_estate_maintenance_requests"("vendor_id");

CREATE INDEX "real_estate_maintenance_requests_tenant_id_status_idx" ON "real_estate_maintenance_requests"("tenant_id", "status");

CREATE INDEX "real_estate_maintenance_requests_tenant_id_priority_idx" ON "real_estate_maintenance_requests"("tenant_id", "priority");

CREATE INDEX "real_estate_maintenance_requests_tenant_id_category_idx" ON "real_estate_maintenance_requests"("tenant_id", "category");

CREATE INDEX "real_estate_lease_renewals_tenant_id_idx" ON "real_estate_lease_renewals"("tenant_id");

CREATE INDEX "real_estate_lease_renewals_lease_id_idx" ON "real_estate_lease_renewals"("lease_id");

CREATE INDEX "real_estate_lease_renewals_property_id_idx" ON "real_estate_lease_renewals"("property_id");

CREATE INDEX "real_estate_lease_renewals_tenant_id_status_idx" ON "real_estate_lease_renewals"("tenant_id", "status");

CREATE INDEX "real_estate_rent_escalations_tenant_id_idx" ON "real_estate_rent_escalations"("tenant_id");

CREATE INDEX "real_estate_rent_escalations_lease_id_idx" ON "real_estate_rent_escalations"("lease_id");

CREATE INDEX "real_estate_rent_escalations_property_id_idx" ON "real_estate_rent_escalations"("property_id");

CREATE INDEX "real_estate_rent_escalations_tenant_id_next_escalation_date_idx" ON "real_estate_rent_escalations"("tenant_id", "next_escalation_date");

CREATE INDEX "real_estate_property_financials_tenant_id_idx" ON "real_estate_property_financials"("tenant_id");

CREATE INDEX "real_estate_property_financials_property_id_idx" ON "real_estate_property_financials"("property_id");

CREATE INDEX "real_estate_property_financials_tenant_id_period_start_peri_idx" ON "real_estate_property_financials"("tenant_id", "period_start", "period_end");

CREATE INDEX "real_estate_expense_categories_tenant_id_idx" ON "real_estate_expense_categories"("tenant_id");

CREATE UNIQUE INDEX "real_estate_expense_categories_tenant_id_code_key" ON "real_estate_expense_categories"("tenant_id", "code");

CREATE INDEX "real_estate_property_inspections_tenant_id_idx" ON "real_estate_property_inspections"("tenant_id");

CREATE INDEX "real_estate_property_inspections_tenant_id_property_id_idx" ON "real_estate_property_inspections"("tenant_id", "property_id");

CREATE INDEX "real_estate_rent_collection_logs_tenant_id_idx" ON "real_estate_rent_collection_logs"("tenant_id");

CREATE INDEX "real_estate_rent_collection_logs_tenant_id_lease_id_idx" ON "real_estate_rent_collection_logs"("tenant_id", "lease_id");

CREATE INDEX "real_estate_listing_syndicates_tenant_id_idx" ON "real_estate_listing_syndicates"("tenant_id");

CREATE INDEX "real_estate_listing_syndicates_tenant_id_property_id_idx" ON "real_estate_listing_syndicates"("tenant_id", "property_id");

ALTER TABLE "document_categories" ADD CONSTRAINT "document_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "document_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "document_approvals" ADD CONSTRAINT "document_approvals_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_articles" ADD CONSTRAINT "knowledge_articles_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "knowledge_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "knowledge_categories" ADD CONSTRAINT "knowledge_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "knowledge_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "knowledge_article_versions" ADD CONSTRAINT "knowledge_article_versions_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "knowledge_article_ratings" ADD CONSTRAINT "knowledge_article_ratings_article_id_fkey" FOREIGN KEY ("article_id") REFERENCES "knowledge_articles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_comments" ADD CONSTRAINT "ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "helpdesk_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ticket_slas" ADD CONSTRAINT "ticket_slas_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "helpdesk_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "customer_satisfaction" ADD CONSTRAINT "customer_satisfaction_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "helpdesk_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversation_messages" ADD CONSTRAINT "conversation_messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "omnichannel_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "voip_call_analytics" ADD CONSTRAINT "voip_call_analytics_call_id_fkey" FOREIGN KEY ("call_id") REFERENCES "voip_calls"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ivr_options" ADD CONSTRAINT "ivr_options_menu_id_fkey" FOREIGN KEY ("menu_id") REFERENCES "ivr_menus"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "collab_document_versions" ADD CONSTRAINT "collab_document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "collab_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "whiteboard_elements" ADD CONSTRAINT "whiteboard_elements_whiteboard_id_fkey" FOREIGN KEY ("whiteboard_id") REFERENCES "whiteboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comm_surveys" ADD CONSTRAINT "comm_surveys_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "comm_survey_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "comm_survey_questions" ADD CONSTRAINT "comm_survey_questions_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "comm_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comm_survey_responses" ADD CONSTRAINT "comm_survey_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "comm_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comm_survey_answers" ADD CONSTRAINT "comm_survey_answers_response_id_fkey" FOREIGN KEY ("response_id") REFERENCES "comm_survey_responses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "comm_survey_answers" ADD CONSTRAINT "comm_survey_answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "comm_survey_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "learning_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "learning_enrollments" ADD CONSTRAINT "learning_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "learning_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "skill_gap_analyses" ADD CONSTRAINT "skill_gap_analyses_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill_matrices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "career_path_requirements" ADD CONSTRAINT "career_path_requirements_career_path_id_fkey" FOREIGN KEY ("career_path_id") REFERENCES "career_paths"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "career_path_requirements" ADD CONSTRAINT "career_path_requirements_skill_id_fkey" FOREIGN KEY ("skill_id") REFERENCES "skill_matrices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mentoring_sessions" ADD CONSTRAINT "mentoring_sessions_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "mentoring_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bonus_payouts" ADD CONSTRAINT "bonus_payouts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "bonus_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "equity_vesting_schedules" ADD CONSTRAINT "equity_vesting_schedules_grant_id_fkey" FOREIGN KEY ("grant_id") REFERENCES "equity_grants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wellness_activities" ADD CONSTRAINT "wellness_activities_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "employee_wellness_programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hr_compliance_reports" ADD CONSTRAINT "hr_compliance_reports_requirement_id_fkey" FOREIGN KEY ("requirement_id") REFERENCES "compliance_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "wellness_leaderboards" ADD CONSTRAINT "wellness_leaderboards_challenge_id_fkey" FOREIGN KEY ("challenge_id") REFERENCES "wellness_challenges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "alumni_events" ADD CONSTRAINT "alumni_events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "alumni_records"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "alumni_event_attendees" ADD CONSTRAINT "alumni_event_attendees_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "alumni_events"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "alumni_event_attendees" ADD CONSTRAINT "alumni_event_attendees_alumni_id_fkey" FOREIGN KEY ("alumni_id") REFERENCES "alumni_records"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "storage_folders" ADD CONSTRAINT "storage_folders_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "storage_folders"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "storage_folders" ADD CONSTRAINT "storage_folders_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "storage_file_versions" ADD CONSTRAINT "storage_file_versions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "storage_share_links" ADD CONSTRAINT "storage_share_links_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "storage_quotas" ADD CONSTRAINT "storage_quotas_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "api_key_scopes" ADD CONSTRAINT "api_key_scopes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "api_usage_metrics" ADD CONSTRAINT "api_usage_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "endpoint_registries" ADD CONSTRAINT "endpoint_registries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "locales" ADD CONSTRAINT "locales_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "translation_keys" ADD CONSTRAINT "translation_keys_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "translation_entries" ADD CONSTRAINT "translation_entries_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "translation_entries" ADD CONSTRAINT "translation_entries_locale_id_fkey" FOREIGN KEY ("locale_id") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "translation_entries" ADD CONSTRAINT "translation_entries_key_id_fkey" FOREIGN KEY ("key_id") REFERENCES "translation_keys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "translation_imports" ADD CONSTRAINT "translation_imports_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "locale_formatting_rules" ADD CONSTRAINT "locale_formatting_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "locale_formatting_rules" ADD CONSTRAINT "locale_formatting_rules_locale_id_fkey" FOREIGN KEY ("locale_id") REFERENCES "locales"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bpmn_process_instances" ADD CONSTRAINT "bpmn_process_instances_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "bpmn_process_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "bpmn_activity_instances" ADD CONSTRAINT "bpmn_activity_instances_instance_id_fkey" FOREIGN KEY ("instance_id") REFERENCES "bpmn_process_instances"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "etl_pipelines" ADD CONSTRAINT "etl_pipelines_source_id_fkey" FOREIGN KEY ("source_id") REFERENCES "etl_data_sources"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "etl_job_runs" ADD CONSTRAINT "etl_job_runs_pipeline_id_fkey" FOREIGN KEY ("pipeline_id") REFERENCES "etl_pipelines"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "marketplace_app_versions" ADD CONSTRAINT "marketplace_app_versions_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "marketplace_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "marketplace_developer_submissions" ADD CONSTRAINT "marketplace_developer_submissions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "marketplace_analytics" ADD CONSTRAINT "marketplace_analytics_app_id_fkey" FOREIGN KEY ("app_id") REFERENCES "marketplace_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fixed_asset_disposals" ADD CONSTRAINT "fixed_asset_disposals_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fixed_asset_disposals" ADD CONSTRAINT "fixed_asset_disposals_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fixed_asset_audit_logs" ADD CONSTRAINT "fixed_asset_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fixed_asset_audit_logs" ADD CONSTRAINT "fixed_asset_audit_logs_asset_id_fkey" FOREIGN KEY ("asset_id") REFERENCES "fixed_assets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blockchain_smart_contracts" ADD CONSTRAINT "blockchain_smart_contracts_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blockchain_audit_trails" ADD CONSTRAINT "blockchain_audit_trails_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "blockchain_transaction_explorers" ADD CONSTRAINT "blockchain_transaction_explorers_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agile_sprints" ADD CONSTRAINT "agile_sprints_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agile_backlog_items" ADD CONSTRAINT "agile_backlog_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agile_sprint_items" ADD CONSTRAINT "agile_sprint_items_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "agile_sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agile_sprint_items" ADD CONSTRAINT "agile_sprint_items_backlog_item_id_fkey" FOREIGN KEY ("backlog_item_id") REFERENCES "agile_backlog_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "agile_retrospectives" ADD CONSTRAINT "agile_retrospectives_sprint_id_fkey" FOREIGN KEY ("sprint_id") REFERENCES "agile_sprints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evm_forecasts" ADD CONSTRAINT "evm_forecasts_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evm_kpi_targets" ADD CONSTRAINT "evm_kpi_targets_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "evm_snapshots" ADD CONSTRAINT "evm_snapshots_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "capex_projects" ADD CONSTRAINT "capex_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "capex_budget_lines" ADD CONSTRAINT "capex_budget_lines_capex_id_fkey" FOREIGN KEY ("capex_id") REFERENCES "capex_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "capex_gate_reviews" ADD CONSTRAINT "capex_gate_reviews_capex_id_fkey" FOREIGN KEY ("capex_id") REFERENCES "capex_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "capex_capitalizations" ADD CONSTRAINT "capex_capitalizations_capex_id_fkey" FOREIGN KEY ("capex_id") REFERENCES "capex_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "variation_orders" ADD CONSTRAINT "variation_orders_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "variation_orders" ADD CONSTRAINT "variation_orders_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "project_claims"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "claim_documents" ADD CONSTRAINT "claim_documents_claim_id_fkey" FOREIGN KEY ("claim_id") REFERENCES "project_claims"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pmo_scorecards" ADD CONSTRAINT "pmo_scorecards_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "pmo_scorecard_dimensions" ADD CONSTRAINT "pmo_scorecard_dimensions_scorecard_id_fkey" FOREIGN KEY ("scorecard_id") REFERENCES "pmo_scorecards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "stage_gates" ADD CONSTRAINT "stage_gates_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gate_checklists" ADD CONSTRAINT "gate_checklists_gate_id_fkey" FOREIGN KEY ("gate_id") REFERENCES "stage_gates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "discussion_replies" ADD CONSTRAINT "discussion_replies_discussion_id_fkey" FOREIGN KEY ("discussion_id") REFERENCES "project_discussions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_reviews" ADD CONSTRAINT "document_reviews_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "spc_charts" ADD CONSTRAINT "spc_charts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "spc_samples" ADD CONSTRAINT "spc_samples_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "spc_charts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fmea_worksheets" ADD CONSTRAINT "fmea_worksheets_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fmea_items" ADD CONSTRAINT "fmea_items_worksheet_id_fkey" FOREIGN KEY ("worksheet_id") REFERENCES "fmea_worksheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "apqp_projects" ADD CONSTRAINT "apqp_projects_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "apqp_phases" ADD CONSTRAINT "apqp_phases_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "apqp_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ppap_submissions" ADD CONSTRAINT "ppap_submissions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tooling_calibrations" ADD CONSTRAINT "tooling_calibrations_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tooling_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "tooling_usage_logs" ADD CONSTRAINT "tooling_usage_logs_tool_id_fkey" FOREIGN KEY ("tool_id") REFERENCES "tooling_masters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "gage_rr_samples" ADD CONSTRAINT "gage_rr_samples_study_id_fkey" FOREIGN KEY ("study_id") REFERENCES "gage_rr_studies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "aps_jobs" ADD CONSTRAINT "aps_jobs_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "aps_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "energy_readings" ADD CONSTRAINT "energy_readings_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "energy_meters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "energy_cost_allocations" ADD CONSTRAINT "energy_cost_allocations_meter_id_fkey" FOREIGN KEY ("meter_id") REFERENCES "energy_meters"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "kanban_boards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "kanban_cards" ADD CONSTRAINT "kanban_cards_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "value_stream_map_items" ADD CONSTRAINT "value_stream_map_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "tpm_pillar_activities" ADD CONSTRAINT "tpm_pillar_activities_pillar_id_fkey" FOREIGN KEY ("pillar_id") REFERENCES "tpm_pillars"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "outsourcing_purchase_orders" ADD CONSTRAINT "outsourcing_purchase_orders_contract_mfg_id_fkey" FOREIGN KEY ("contract_mfg_id") REFERENCES "contract_manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "outsourcing_po_items" ADD CONSTRAINT "outsourcing_po_items_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "outsourcing_purchase_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "outsourcing_po_items" ADD CONSTRAINT "outsourcing_po_items_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subcontracted_receipts" ADD CONSTRAINT "subcontracted_receipts_po_id_fkey" FOREIGN KEY ("po_id") REFERENCES "outsourcing_purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subcontracted_receipts" ADD CONSTRAINT "subcontracted_receipts_contract_mfg_id_fkey" FOREIGN KEY ("contract_mfg_id") REFERENCES "contract_manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ddmrp_parts" ADD CONSTRAINT "ddmrp_parts_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ddmrp_buffers" ADD CONSTRAINT "ddmrp_buffers_part_id_fkey" FOREIGN KEY ("part_id") REFERENCES "ddmrp_parts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_transitions" ADD CONSTRAINT "workflow_transitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_tasks" ADD CONSTRAINT "workflow_tasks_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_sla_rules" ADD CONSTRAINT "workflow_sla_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_escalation_rules" ADD CONSTRAINT "workflow_escalation_rules_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_audit_logs" ADD CONSTRAINT "workflow_audit_logs_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_intent_training_examples" ADD CONSTRAINT "ai_intent_training_examples_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_nlu_entities" ADD CONSTRAINT "ai_nlu_entities_training_example_id_fkey" FOREIGN KEY ("training_example_id") REFERENCES "ai_intent_training_examples"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_model_accuracy_metrics" ADD CONSTRAINT "ai_model_accuracy_metrics_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "ai_models"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ai_model_accuracy_metrics" ADD CONSTRAINT "ai_model_accuracy_metrics_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analytics_kpi_definitions" ADD CONSTRAINT "analytics_kpi_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analytics_trend_results" ADD CONSTRAINT "analytics_trend_results_kpi_definition_id_fkey" FOREIGN KEY ("kpi_definition_id") REFERENCES "analytics_kpi_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analytics_cross_filter_dashboards" ADD CONSTRAINT "analytics_cross_filter_dashboards_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "analytics_bi_metric_definitions" ADD CONSTRAINT "analytics_bi_metric_definitions_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "drive_folder_shares" ADD CONSTRAINT "drive_folder_shares_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "drive_folders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "drive_file_tag_mappings" ADD CONSTRAINT "drive_file_tag_mappings_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "drive_file_tag_mappings" ADD CONSTRAINT "drive_file_tag_mappings_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "drive_file_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "drive_trash_items" ADD CONSTRAINT "drive_trash_items_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "drive_files"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "territory_plan_assignments" ADD CONSTRAINT "territory_plan_assignments_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "territory_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "territory_rebalance_logs" ADD CONSTRAINT "territory_rebalance_logs_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "territory_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "named_accounts" ADD CONSTRAINT "named_accounts_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contract_versions" ADD CONSTRAINT "contract_versions_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contract_obligations" ADD CONSTRAINT "contract_obligations_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "contract_compliance_status" ADD CONSTRAINT "contract_compliance_status_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "crm_contracts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "lc_documents" ADD CONSTRAINT "lc_documents_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lc_amendments" ADD CONSTRAINT "lc_amendments_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "lc_presentations" ADD CONSTRAINT "lc_presentations_lc_id_fkey" FOREIGN KEY ("lc_id") REFERENCES "letters_of_credit"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sop_demand_plans" ADD CONSTRAINT "sop_demand_plans_sop_cycle_id_fkey" FOREIGN KEY ("sop_cycle_id") REFERENCES "sop_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sop_supply_plans" ADD CONSTRAINT "sop_supply_plans_sop_cycle_id_fkey" FOREIGN KEY ("sop_cycle_id") REFERENCES "sop_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "sop_consensus_plans" ADD CONSTRAINT "sop_consensus_plans_sop_cycle_id_fkey" FOREIGN KEY ("sop_cycle_id") REFERENCES "sop_cycles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "logistics_provider_invoices" ADD CONSTRAINT "logistics_provider_invoices_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "logistics_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "logistics_provider_performance" ADD CONSTRAINT "logistics_provider_performance_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "logistics_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cold_chain_temperature_logs" ADD CONSTRAINT "cold_chain_temperature_logs_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "cold_chain_shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "cold_chain_excursions" ADD CONSTRAINT "cold_chain_excursions_shipment_id_fkey" FOREIGN KEY ("shipment_id") REFERENCES "cold_chain_shipments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "multimodal_transport_legs" ADD CONSTRAINT "multimodal_transport_legs_transport_order_id_fkey" FOREIGN KEY ("transport_order_id") REFERENCES "multimodal_transport_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "multimodal_transport_events" ADD CONSTRAINT "multimodal_transport_events_transport_order_id_fkey" FOREIGN KEY ("transport_order_id") REFERENCES "multimodal_transport_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "reverse_logistics_items" ADD CONSTRAINT "reverse_logistics_items_return_order_id_fkey" FOREIGN KEY ("return_order_id") REFERENCES "reverse_logistics_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "delivery_time_slots" ADD CONSTRAINT "delivery_time_slots_zone_id_fkey" FOREIGN KEY ("zone_id") REFERENCES "delivery_zones"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "scm_iot_readings" ADD CONSTRAINT "scm_iot_readings_device_id_fkey" FOREIGN KEY ("device_id") REFERENCES "scm_iot_devices"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "scm_financing_drawdowns" ADD CONSTRAINT "scm_financing_drawdowns_facility_id_fkey" FOREIGN KEY ("facility_id") REFERENCES "scm_financing_facilities"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "supplier_dev_milestones" ADD CONSTRAINT "supplier_dev_milestones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "supplier_development_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "supplier_dev_surveys" ADD CONSTRAINT "supplier_dev_surveys_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "supplier_development_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "berth_slots" ADD CONSTRAINT "berth_slots_terminal_id_fkey" FOREIGN KEY ("terminal_id") REFERENCES "port_terminals"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mps_entries" ADD CONSTRAINT "mps_entries_mps_id_fkey" FOREIGN KEY ("mps_id") REFERENCES "master_production_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "fmea_modes" ADD CONSTRAINT "fmea_modes_fmea_id_fkey" FOREIGN KEY ("fmea_id") REFERENCES "fmea_records"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "formula_ingredients" ADD CONSTRAINT "formula_ingredients_formula_id_fkey" FOREIGN KEY ("formula_id") REFERENCES "production_formulas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "co_products" ADD CONSTRAINT "co_products_formula_id_fkey" FOREIGN KEY ("formula_id") REFERENCES "production_formulas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "machine_oee_records" ADD CONSTRAINT "machine_oee_records_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "manufacturing_machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "machine_maintenance_logs" ADD CONSTRAINT "machine_maintenance_logs_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "manufacturing_machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "machine_downtime" ADD CONSTRAINT "machine_downtime_machine_id_fkey" FOREIGN KEY ("machine_id") REFERENCES "manufacturing_machines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "six_sigma_metrics" ADD CONSTRAINT "six_sigma_metrics_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "six_sigma_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "six_sigma_tools" ADD CONSTRAINT "six_sigma_tools_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "six_sigma_projects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ppm_portfolio_projects" ADD CONSTRAINT "ppm_portfolio_projects_portfolio_id_fkey" FOREIGN KEY ("portfolio_id") REFERENCES "ppm_portfolios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "evm_measurements" ADD CONSTRAINT "evm_measurements_baseline_id_fkey" FOREIGN KEY ("baseline_id") REFERENCES "evm_baselines"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ppm_kanban_columns" ADD CONSTRAINT "ppm_kanban_columns_board_id_fkey" FOREIGN KEY ("board_id") REFERENCES "ppm_kanban_boards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ppm_kanban_cards" ADD CONSTRAINT "ppm_kanban_cards_column_id_fkey" FOREIGN KEY ("column_id") REFERENCES "ppm_kanban_columns"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ppm_procurement_requisitions" ADD CONSTRAINT "ppm_procurement_requisitions_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "ppm_procurement_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ppm_timesheet_entries" ADD CONSTRAINT "ppm_timesheet_entries_timesheet_id_fkey" FOREIGN KEY ("timesheet_id") REFERENCES "ppm_timesheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ppm_quality_inspections" ADD CONSTRAINT "ppm_quality_inspections_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "ppm_quality_plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ppm_document_versions" ADD CONSTRAINT "ppm_document_versions_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "ppm_documents"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subcontractor_deliverables" ADD CONSTRAINT "subcontractor_deliverables_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "project_subcontractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "subcontractor_payment_milestones" ADD CONSTRAINT "subcontractor_payment_milestones_subcontractor_id_fkey" FOREIGN KEY ("subcontractor_id") REFERENCES "project_subcontractors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "email_messages" ADD CONSTRAINT "email_messages_inbox_id_fkey" FOREIGN KEY ("inbox_id") REFERENCES "email_inboxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "email_rules" ADD CONSTRAINT "email_rules_inbox_id_fkey" FOREIGN KEY ("inbox_id") REFERENCES "email_inboxes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "video_room_participants" ADD CONSTRAINT "video_room_participants_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "video_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "video_recordings" ADD CONSTRAINT "video_recordings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "video_rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_space_id_fkey" FOREIGN KEY ("space_id") REFERENCES "wiki_spaces"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "wiki_pages" ADD CONSTRAINT "wiki_pages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "wiki_pages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "wiki_page_versions" ADD CONSTRAINT "wiki_page_versions_page_id_fkey" FOREIGN KEY ("page_id") REFERENCES "wiki_pages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chat_channel_members" ADD CONSTRAINT "chat_channel_members_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "chat_channels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "intranet_comments" ADD CONSTRAINT "intranet_comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "intranet_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "intranet_comments" ADD CONSTRAINT "intranet_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "intranet_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "intranet_reactions" ADD CONSTRAINT "intranet_reactions_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "intranet_posts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "internal_survey_answers" ADD CONSTRAINT "internal_survey_answers_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "internal_surveys"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "company_events"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "phone_call_logs" ADD CONSTRAINT "phone_call_logs_extension_id_fkey" FOREIGN KEY ("extension_id") REFERENCES "phone_extensions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "builder_data_fields" ADD CONSTRAINT "builder_data_fields_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "builder_data_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "builder_relationships" ADD CONSTRAINT "builder_relationships_from_model_id_fkey" FOREIGN KEY ("from_model_id") REFERENCES "builder_data_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "builder_data_views" ADD CONSTRAINT "builder_data_views_model_id_fkey" FOREIGN KEY ("model_id") REFERENCES "builder_data_models"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "business_rule_executions" ADD CONSTRAINT "business_rule_executions_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "business_rules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "integrations" ADD CONSTRAINT "integrations_connector_id_fkey" FOREIGN KEY ("connector_id") REFERENCES "integration_connectors"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "integration_logs" ADD CONSTRAINT "integration_logs_integration_id_fkey" FOREIGN KEY ("integration_id") REFERENCES "integrations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "builder_document_renders" ADD CONSTRAINT "builder_document_renders_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "builder_document_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "builder_deployments" ADD CONSTRAINT "builder_deployments_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "builder_environments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chatbot_intents" ADD CONSTRAINT "chatbot_intents_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "chatbot_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "chatbot_conversations" ADD CONSTRAINT "chatbot_conversations_bot_id_fkey" FOREIGN KEY ("bot_id") REFERENCES "chatbot_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "event_triggers" ADD CONSTRAINT "event_triggers_event_definition_id_fkey" FOREIGN KEY ("event_definition_id") REFERENCES "event_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "report_runs" ADD CONSTRAINT "report_runs_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "report_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "dashboard_widgets" ADD CONSTRAINT "dashboard_widgets_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "dashboard_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "customer_success_milestones" ADD CONSTRAINT "customer_success_milestones_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "customer_success_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_playbook_steps_deep" ADD CONSTRAINT "sales_playbook_steps_deep_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "sales_playbooks_deep"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sales_document_generations" ADD CONSTRAINT "sales_document_generations_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "sales_document_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "saved_view_layouts" ADD CONSTRAINT "saved_view_layouts_view_id_fkey" FOREIGN KEY ("view_id") REFERENCES "saved_views"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_view_filters" ADD CONSTRAINT "saved_view_filters_view_id_fkey" FOREIGN KEY ("view_id") REFERENCES "saved_views"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_view_column_configs" ADD CONSTRAINT "saved_view_column_configs_view_id_fkey" FOREIGN KEY ("view_id") REFERENCES "saved_views"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "saved_view_sharings" ADD CONSTRAINT "saved_view_sharings_view_id_fkey" FOREIGN KEY ("view_id") REFERENCES "saved_views"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "notification_batch_items" ADD CONSTRAINT "notification_batch_items_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "notification_batches"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "deployments" ADD CONSTRAINT "deployments_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "deployment_stages"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "deployments" ADD CONSTRAINT "deployments_dep_environment_id_fkey" FOREIGN KEY ("dep_environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "deployment_stages" ADD CONSTRAINT "deployment_stages_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "environment_configs" ADD CONSTRAINT "environment_configs_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "releases" ADD CONSTRAINT "releases_environment_id_fkey" FOREIGN KEY ("environment_id") REFERENCES "environments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "release_artifacts" ADD CONSTRAINT "release_artifacts_release_id_fkey" FOREIGN KEY ("release_id") REFERENCES "releases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "release_artifacts" ADD CONSTRAINT "release_artifacts_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "build_logs" ADD CONSTRAINT "build_logs_deployment_id_fkey" FOREIGN KEY ("deployment_id") REFERENCES "deployments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ext_connection_logs" ADD CONSTRAINT "ext_connection_logs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "ext_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ext_webhook_configs" ADD CONSTRAINT "ext_webhook_configs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "ext_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ext_webhook_deliveries" ADD CONSTRAINT "ext_webhook_deliveries_webhook_config_id_fkey" FOREIGN KEY ("webhook_config_id") REFERENCES "ext_webhook_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ext_rate_limit_configs" ADD CONSTRAINT "ext_rate_limit_configs_connection_id_fkey" FOREIGN KEY ("connection_id") REFERENCES "ext_connections"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ext_rate_limit_usages" ADD CONSTRAINT "ext_rate_limit_usages_rate_limit_config_id_fkey" FOREIGN KEY ("rate_limit_config_id") REFERENCES "ext_rate_limit_configs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_plan_tiers" ADD CONSTRAINT "subscription_plan_tiers_plan_group_id_fkey" FOREIGN KEY ("plan_group_id") REFERENCES "subscription_plan_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sm_service_tickets" ADD CONSTRAINT "sm_service_tickets_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sm_service_tickets" ADD CONSTRAINT "sm_service_tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "sm_ticket_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sm_service_tickets" ADD CONSTRAINT "sm_service_tickets_sla_policy_id_fkey" FOREIGN KEY ("sla_policy_id") REFERENCES "sm_ticket_sla_policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sm_ticket_categories" ADD CONSTRAINT "sm_ticket_categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "sm_ticket_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "sm_ticket_sla_breaches" ADD CONSTRAINT "sm_ticket_sla_breaches_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "sm_service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sm_ticket_sla_breaches" ADD CONSTRAINT "sm_ticket_sla_breaches_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "sm_ticket_sla_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sm_ticket_comments" ADD CONSTRAINT "sm_ticket_comments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "sm_service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sm_ticket_activities" ADD CONSTRAINT "sm_ticket_activities_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "sm_service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "sm_survey_responses" ADD CONSTRAINT "sm_survey_responses_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "sm_service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fixed_asset_component_replacements" ADD CONSTRAINT "fixed_asset_component_replacements_component_id_fkey" FOREIGN KEY ("component_id") REFERENCES "fixed_asset_components"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fixed_asset_warranty_claims" ADD CONSTRAINT "fixed_asset_warranty_claims_warranty_id_fkey" FOREIGN KEY ("warranty_id") REFERENCES "fixed_asset_warranties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "fixed_asset_groups" ADD CONSTRAINT "fixed_asset_groups_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "fixed_asset_groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "fixed_asset_group_members" ADD CONSTRAINT "fixed_asset_group_members_group_id_fkey" FOREIGN KEY ("group_id") REFERENCES "fixed_asset_groups"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_coupon_redemptions" ADD CONSTRAINT "subscription_coupon_redemptions_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "subscription_coupons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_coupon_redemptions" ADD CONSTRAINT "subscription_coupon_redemptions_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "subscription_billing_run_lines" ADD CONSTRAINT "subscription_billing_run_lines_billing_run_id_fkey" FOREIGN KEY ("billing_run_id") REFERENCES "subscription_billing_runs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_annotations" ADD CONSTRAINT "document_annotations_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_comments" ADD CONSTRAINT "document_comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "document_comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "document_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_tag_assignments" ADD CONSTRAINT "document_tag_assignments_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_locks" ADD CONSTRAINT "document_locks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_workflows" ADD CONSTRAINT "document_workflows_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_exports" ADD CONSTRAINT "document_exports_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_audit_logs" ADD CONSTRAINT "document_audit_logs_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_favorites" ADD CONSTRAINT "document_favorites_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_recent_items" ADD CONSTRAINT "document_recent_items_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "document_watermarks" ADD CONSTRAINT "document_watermarks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_versions" ADD CONSTRAINT "workflow_versions_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_conditions" ADD CONSTRAINT "workflow_conditions_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_loops" ADD CONSTRAINT "workflow_loops_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_subprocesses" ADD CONSTRAINT "workflow_subprocesses_parent_definition_id_fkey" FOREIGN KEY ("parent_definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_subprocesses" ADD CONSTRAINT "workflow_subprocesses_child_definition_id_fkey" FOREIGN KEY ("child_definition_id") REFERENCES "workflow_definitions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "workflow_error_handlers" ADD CONSTRAINT "workflow_error_handlers_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_notifications" ADD CONSTRAINT "workflow_notifications_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_webhooks" ADD CONSTRAINT "workflow_webhooks_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_tag_assignments" ADD CONSTRAINT "workflow_tag_assignments_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "workflow_tags"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "workflow_tag_assignments" ADD CONSTRAINT "workflow_tag_assignments_definition_id_fkey" FOREIGN KEY ("definition_id") REFERENCES "workflow_definitions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_lead_routing_history" ADD CONSTRAINT "crm_lead_routing_history_rule_id_fkey" FOREIGN KEY ("rule_id") REFERENCES "crm_lead_routing_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_enrichment_workflows" ADD CONSTRAINT "crm_enrichment_workflows_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "crm_enrichment_providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "crm_enrichment_jobs" ADD CONSTRAINT "crm_enrichment_jobs_workflow_id_fkey" FOREIGN KEY ("workflow_id") REFERENCES "crm_enrichment_workflows"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_enrichment_job_steps" ADD CONSTRAINT "crm_enrichment_job_steps_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "crm_enrichment_jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_playbook_stages" ADD CONSTRAINT "crm_playbook_stages_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "crm_sales_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_playbook_actions" ADD CONSTRAINT "crm_playbook_actions_playbook_id_fkey" FOREIGN KEY ("playbook_id") REFERENCES "crm_sales_playbooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_playbook_actions" ADD CONSTRAINT "crm_playbook_actions_stage_id_fkey" FOREIGN KEY ("stage_id") REFERENCES "crm_playbook_stages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_objection_handlers" ADD CONSTRAINT "crm_objection_handlers_battlecard_id_fkey" FOREIGN KEY ("battlecard_id") REFERENCES "crm_competitor_battlecards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_campaign_nodes" ADD CONSTRAINT "crm_campaign_nodes_campaign_id_fkey" FOREIGN KEY ("campaign_id") REFERENCES "crm_omnichannel_campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_nps_responses" ADD CONSTRAINT "crm_nps_responses_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "crm_customer_feedback_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_saved_reports" ADD CONSTRAINT "crm_saved_reports_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "report_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "crm_report_schedules" ADD CONSTRAINT "crm_report_schedules_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "crm_saved_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_report_shares" ADD CONSTRAINT "crm_report_shares_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "crm_saved_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "crm_dashboard_shares" ADD CONSTRAINT "crm_dashboard_shares_dashboard_id_fkey" FOREIGN KEY ("dashboard_id") REFERENCES "crm_dashboards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_student_parents" ADD CONSTRAINT "education_student_parents_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "education_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_student_parents" ADD CONSTRAINT "education_student_parents_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "education_parents"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_enrollments" ADD CONSTRAINT "education_enrollments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "education_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_enrollments" ADD CONSTRAINT "education_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "education_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_course_modules" ADD CONSTRAINT "education_course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "education_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_gradebooks" ADD CONSTRAINT "education_gradebooks_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "education_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_grade_entries" ADD CONSTRAINT "education_grade_entries_gradebook_id_fkey" FOREIGN KEY ("gradebook_id") REFERENCES "education_gradebooks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_grade_entries" ADD CONSTRAINT "education_grade_entries_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "education_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_attendances" ADD CONSTRAINT "education_attendances_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "education_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_fee_invoices" ADD CONSTRAINT "education_fee_invoices_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "education_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_fee_payments" ADD CONSTRAINT "education_fee_payments_invoice_id_fkey" FOREIGN KEY ("invoice_id") REFERENCES "education_fee_invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_library_fines" ADD CONSTRAINT "education_library_fines_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "education_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_library_fines" ADD CONSTRAINT "education_library_fines_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "book_transactions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "education_exam_schedules" ADD CONSTRAINT "education_exam_schedules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "education_courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_exam_results" ADD CONSTRAINT "education_exam_results_exam_id_fkey" FOREIGN KEY ("exam_id") REFERENCES "education_exam_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "education_exam_results" ADD CONSTRAINT "education_exam_results_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "education_students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "field_service_appointments" ADD CONSTRAINT "field_service_appointments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "field_service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "field_service_appointments" ADD CONSTRAINT "field_service_appointments_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "field_service_technicians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "field_service_contracts" ADD CONSTRAINT "field_service_contracts_sla_id_fkey" FOREIGN KEY ("sla_id") REFERENCES "field_service_slas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "field_service_timesheets" ADD CONSTRAINT "field_service_timesheets_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "field_service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "field_service_timesheets" ADD CONSTRAINT "field_service_timesheets_technician_id_fkey" FOREIGN KEY ("technician_id") REFERENCES "field_service_technicians"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "field_service_parts_usage" ADD CONSTRAINT "field_service_parts_usage_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "field_service_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "account_scores" ADD CONSTRAINT "account_scores_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_patient_allergies" ADD CONSTRAINT "healthcare_patient_allergies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "healthcare_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_appointment_schedules" ADD CONSTRAINT "healthcare_appointment_schedules_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "healthcare_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_appointment_schedules" ADD CONSTRAINT "healthcare_appointment_schedules_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "healthcare_practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_prescription_items" ADD CONSTRAINT "healthcare_prescription_items_prescription_id_fkey" FOREIGN KEY ("prescription_id") REFERENCES "healthcare_prescriptions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_lab_orders" ADD CONSTRAINT "healthcare_lab_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "healthcare_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_lab_orders" ADD CONSTRAINT "healthcare_lab_orders_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "healthcare_practitioners"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "healthcare_lab_results" ADD CONSTRAINT "healthcare_lab_results_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "healthcare_lab_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_insurance_policies" ADD CONSTRAINT "healthcare_insurance_policies_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "healthcare_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_insurance_claims" ADD CONSTRAINT "healthcare_insurance_claims_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "healthcare_insurance_policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_pharmacy_batches" ADD CONSTRAINT "healthcare_pharmacy_batches_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "healthcare_drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_controlled_substance_logs" ADD CONSTRAINT "healthcare_controlled_substance_logs_drug_id_fkey" FOREIGN KEY ("drug_id") REFERENCES "healthcare_drugs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_controlled_substance_logs" ADD CONSTRAINT "healthcare_controlled_substance_logs_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "healthcare_pharmacy_batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "healthcare_doctor_schedules" ADD CONSTRAINT "healthcare_doctor_schedules_practitioner_id_fkey" FOREIGN KEY ("practitioner_id") REFERENCES "healthcare_practitioners"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "healthcare_medical_records" ADD CONSTRAINT "healthcare_medical_records_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "healthcare_patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hr_advanced_tickets" ADD CONSTRAINT "hr_advanced_tickets_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "hr_ticket_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "hr_ticket_assignments" ADD CONSTRAINT "hr_ticket_assignments_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "hr_advanced_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hr_headcount_plan_lines" ADD CONSTRAINT "hr_headcount_plan_lines_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "hr_headcount_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "hr_succession_candidates" ADD CONSTRAINT "hr_succession_candidates_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "hr_succession_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "employee_recognitions" ADD CONSTRAINT "employee_recognitions_award_id_fkey" FOREIGN KEY ("award_id") REFERENCES "employee_recognition_awards"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "warehouse_network_nodes" ADD CONSTRAINT "warehouse_network_nodes_design_id_fkey" FOREIGN KEY ("design_id") REFERENCES "warehouse_network_designs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mfg_spc_data_points" ADD CONSTRAINT "mfg_spc_data_points_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "mfg_spc_charts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mfg_cost_entries" ADD CONSTRAINT "mfg_cost_entries_cost_sheet_id_fkey" FOREIGN KEY ("cost_sheet_id") REFERENCES "job_cost_sheets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "mfg_maintenance_work_orders" ADD CONSTRAINT "mfg_maintenance_work_orders_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "maintenance_schedules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "mfg_document_versions" ADD CONSTRAINT "mfg_document_versions_doc_id_fkey" FOREIGN KEY ("doc_id") REFERENCES "mfg_document_controls"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "program_projects" ADD CONSTRAINT "program_projects_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "program_projects" ADD CONSTRAINT "program_projects_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "program_benefits" ADD CONSTRAINT "program_benefits_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "program_financials" ADD CONSTRAINT "program_financials_program_id_fkey" FOREIGN KEY ("program_id") REFERENCES "programs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_claims" ADD CONSTRAINT "project_claims_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_discussions" ADD CONSTRAINT "project_discussions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_wiki_pages" ADD CONSTRAINT "project_wiki_pages_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "project_feed_events" ADD CONSTRAINT "project_feed_events_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "real_estate_units" ADD CONSTRAINT "real_estate_units_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "real_estate_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "real_estate_lease_payments" ADD CONSTRAINT "real_estate_lease_payments_lease_id_fkey" FOREIGN KEY ("lease_id") REFERENCES "real_estate_leases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "real_estate_commission_plans" ADD CONSTRAINT "real_estate_commission_plans_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "real_estate_properties"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "real_estate_commission_payouts" ADD CONSTRAINT "real_estate_commission_payouts_plan_id_fkey" FOREIGN KEY ("plan_id") REFERENCES "real_estate_commission_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "real_estate_valuations" ADD CONSTRAINT "real_estate_valuations_property_id_fkey" FOREIGN KEY ("property_id") REFERENCES "real_estate_properties"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- Enable + FORCE row-level security and attach the standard tenant predicate to
-- every table created above that carries a tenant_id. Mirrors the catalogue
-- loop used by the earlier RLS catch-up migrations, and uses the same
-- per-table policy name the proof suite asserts.
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT c.relname AS tbl
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname <> '_prisma_migrations'
      AND EXISTS (
        SELECT 1 FROM information_schema.columns col
        WHERE col.table_schema = 'public'
          AND col.table_name = c.relname
          AND col.column_name = 'tenant_id'
      )
      AND (c.relrowsecurity = false OR c.relforcerowsecurity = false)
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tbl);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', r.tbl);
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public' AND tablename = r.tbl
        AND policyname = 'tenant_isolation_' || r.tbl
    ) THEN
      EXECUTE format(
        'CREATE POLICY %I ON public.%I USING (tenant_id = current_tenant_id()) WITH CHECK (tenant_id = current_tenant_id())',
        'tenant_isolation_' || r.tbl, r.tbl
      );
    END IF;
  END LOOP;
END $$;
