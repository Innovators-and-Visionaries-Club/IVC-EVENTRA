-- ==============================================================================
-- IVC PULSE: Comprehensive Database Schema Alignment & Compatibility Patch
-- Migration: 003_schema_alignment.sql
-- Synchronizes database schema with all Next.js application queries & actions
-- ==============================================================================

-- 1. EXTEND TEAMS TABLE WITH MISSING FIELDS (track, leader_name, status)
ALTER TABLE IF EXISTS public.teams
  ADD COLUMN IF NOT EXISTS track TEXT,
  ADD COLUMN IF NOT EXISTS leader_name TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- 2. EXTEND AUDIT_LOGS TABLE WITH APPLIED FIELD NAMES (entity_type, entity_id, details)
ALTER TABLE IF EXISTS public.audit_logs
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Backfill entity columns from existing columns if available
UPDATE public.audit_logs
SET
  entity_type = COALESCE(entity_type, target_entity),
  entity_id = COALESCE(entity_id, target_id::text),
  details = COALESCE(details, metadata)
WHERE entity_type IS NULL OR entity_id IS NULL OR details IS NULL;

-- 3. EXTEND EVENT_RESULTS WITH STATISTICAL & AUDIT FIELDS
ALTER TABLE IF EXISTS public.event_results
  ADD COLUMN IF NOT EXISTS average_score NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS evaluations_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- 4. EXTEND EVALUATIONS TABLE WITH SCORES BREAKDOWN & EVENT LINK
ALTER TABLE IF EXISTS public.evaluations
  ADD COLUMN IF NOT EXISTS event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS scores_breakdown JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

-- 5. HARMONIZE EVALUATION CRITERIA TABLE & ALIAS VIEW
DO $$ BEGIN
  -- If table criteria exists but evaluation_criteria does not, rename criteria
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'criteria')
     AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evaluation_criteria') THEN
    ALTER TABLE public.criteria RENAME TO evaluation_criteria;
  END IF;

  -- If neither exists, create evaluation_criteria table
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'evaluation_criteria') THEN
    CREATE TABLE public.evaluation_criteria (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      round_id UUID NOT NULL REFERENCES public.evaluation_rounds(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      description TEXT,
      max_marks NUMERIC NOT NULL CHECK (max_marks > 0),
      is_required BOOLEAN NOT NULL DEFAULT true,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  END IF;
END $$;

-- Ensure evaluation_criteria has updated_at column
ALTER TABLE IF EXISTS public.evaluation_criteria
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Create or replace compatibility view for 'criteria' pointing to 'evaluation_criteria'
CREATE OR REPLACE VIEW public.criteria AS
  SELECT * FROM public.evaluation_criteria;

-- 6. EXTEND TEAM_MEMBERS WITH CONTACT FIELDS
ALTER TABLE IF EXISTS public.team_members
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- 7. SUBMISSIONS COMPATIBILITY VIEW (ALIASES team_submissions to submissions)
CREATE OR REPLACE VIEW public.submissions AS
  SELECT * FROM public.team_submissions;

-- 8. ROW LEVEL SECURITY & POLICY UPDATES
ALTER TABLE IF EXISTS public.evaluation_criteria ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Evaluation criteria readable by authenticated" ON public.evaluation_criteria;
CREATE POLICY "Evaluation criteria readable by authenticated"
  ON public.evaluation_criteria
  FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "Admins can manage evaluation criteria" ON public.evaluation_criteria;
CREATE POLICY "Admins can manage evaluation criteria"
  ON public.evaluation_criteria
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Ensure audit_logs is readable by admins
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Ensure audit_logs can be inserted by service_role and admins
DROP POLICY IF EXISTS "Admins and service can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins and service can insert audit logs"
  ON public.audit_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

-- Storage Bucket for team deliverable files (PPT, PPTX, PDF, DOCX)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-deliverables',
  'team-deliverables',
  true,
  52428800,
  ARRAY[
    'application/pdf',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800;

-- Storage public read policy
DROP POLICY IF EXISTS "Public can view team deliverables" ON storage.objects;
CREATE POLICY "Public can view team deliverables"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'team-deliverables');

-- Storage authenticated insert policy
DROP POLICY IF EXISTS "Authenticated users can upload team deliverables" ON storage.objects;
CREATE POLICY "Authenticated users can upload team deliverables"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'team-deliverables');

-- Add Problem & Solution fields to team_submissions
ALTER TABLE public.team_submissions
  ADD COLUMN IF NOT EXISTS problem_statement TEXT,
  ADD COLUMN IF NOT EXISTS problem_description TEXT,
  ADD COLUMN IF NOT EXISTS proposed_solution TEXT,
  ADD COLUMN IF NOT EXISTS solution_description TEXT;

-- Refresh submissions view
CREATE OR REPLACE VIEW public.submissions AS
  SELECT * FROM public.team_submissions;

