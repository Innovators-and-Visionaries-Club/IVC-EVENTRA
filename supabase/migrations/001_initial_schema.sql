-- ==============================================================================
-- IVC PULSE: Complete Self-Contained Database Architecture Migration
-- Target: Supabase PostgreSQL (auth schema integration + RLS + Triggers)
-- File: supabase/migrations/001_initial_schema.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. ENUM TYPES
-- ------------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'judge', 'staff', 'organizer', 'participant');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE team_member_role AS ENUM ('leader', 'member');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE round_status AS ENUM ('draft', 'open', 'closed', 'locked', 'reopened');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE evaluation_status AS ENUM ('draft', 'submitted', 'locked', 'reopened');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE action_type AS ENUM ('registration', 'goodies', 'lunch', 'snacks');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ------------------------------------------------------------------------------
-- 2. TABLE SCHEMAS & CONSTRAINTS
-- ------------------------------------------------------------------------------

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    role user_role NOT NULL DEFAULT 'participant',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. EVENTS
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. TEAMS
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    code TEXT UNIQUE,
    track TEXT,
    leader_name TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. TEAM MEMBERS
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role team_member_role NOT NULL DEFAULT 'member',
    name TEXT,
    email TEXT,
    joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_team_member UNIQUE (team_id, user_id)
);

-- 5. EVALUATION ROUNDS
CREATE TABLE IF NOT EXISTS public.evaluation_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    status round_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. EVALUATION CRITERIA (WITH criteria ALIAS VIEW)
CREATE TABLE IF NOT EXISTS public.evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.evaluation_rounds(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    max_marks NUMERIC NOT NULL CHECK (max_marks > 0),
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE VIEW public.criteria AS
    SELECT * FROM public.evaluation_criteria;

-- 7. JUDGE ASSIGNMENTS
CREATE TABLE IF NOT EXISTS public.judge_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_judge_team UNIQUE (judge_id, team_id)
);

-- 8. EVALUATIONS
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    round_id UUID NOT NULL REFERENCES public.evaluation_rounds(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    scores_breakdown JSONB DEFAULT '[]'::jsonb,
    total_score NUMERIC DEFAULT 0,
    status evaluation_status NOT NULL DEFAULT 'draft',
    feedback TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_round_team_judge UNIQUE (round_id, team_id, judge_id)
);

-- 9. TEAM SUBMISSIONS (WITH submissions ALIAS VIEW)
CREATE TABLE IF NOT EXISTS public.team_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES public.evaluation_rounds(id) ON DELETE CASCADE,
    ppt_url TEXT NOT NULL,
    github_url TEXT,
    pitch_deck_url TEXT,
    prototype_url TEXT,
    additional_material_url TEXT,
    demo_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_team_round_submission UNIQUE (team_id, round_id)
);

CREATE OR REPLACE VIEW public.submissions AS
    SELECT * FROM public.team_submissions;

-- 10. EVENT RESULTS
CREATE TABLE IF NOT EXISTS public.event_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    total_score NUMERIC DEFAULT 0,
    average_score NUMERIC DEFAULT 0,
    evaluations_count INT DEFAULT 0,
    rank INT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now(),
    calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_event_team UNIQUE (event_id, team_id)
);

-- 11. EVENT ACTIVITY LOGS (Duplicate claim prevention via unique index)
CREATE TABLE IF NOT EXISTS public.event_activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type action_type NOT NULL,
    scanned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_participant_action UNIQUE (participant_id, action_type)
);

-- 12. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id TEXT,
    target_entity TEXT,
    target_id UUID,
    reason TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ------------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ------------------------------------------------------------------------------

-- Enable RLS across all 12 tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function: check if authenticated user has admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Profiles Policies
CREATE POLICY "Profiles readable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Events Policies
CREATE POLICY "Events readable by all"
ON public.events FOR SELECT USING (true);

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL TO authenticated USING (public.is_admin());

-- 3. Teams Policies
CREATE POLICY "Teams readable by authenticated users"
ON public.teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage teams"
ON public.teams FOR ALL TO authenticated USING (public.is_admin());

-- 4. Team Members Policies
CREATE POLICY "Team members readable by authenticated users"
ON public.team_members FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage team members"
ON public.team_members FOR ALL TO authenticated USING (public.is_admin());

-- 5. Evaluation Rounds Policies
CREATE POLICY "Rounds readable by authenticated users"
ON public.evaluation_rounds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage rounds"
ON public.evaluation_rounds FOR ALL TO authenticated USING (public.is_admin());

-- 6. Criteria Policies
CREATE POLICY "Criteria readable by authenticated users"
ON public.criteria FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage criteria"
ON public.criteria FOR ALL TO authenticated USING (public.is_admin());

-- 7. Judge Assignments Policies
CREATE POLICY "Judges and admins can view assignments"
ON public.judge_assignments FOR SELECT TO authenticated
USING (judge_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins can manage judge assignments"
ON public.judge_assignments FOR ALL TO authenticated USING (public.is_admin());

-- 8. Evaluations Policies
CREATE POLICY "Judges can view and manage their evaluations"
ON public.evaluations FOR ALL TO authenticated
USING (judge_id = auth.uid() OR public.is_admin());

-- 9. Team Submissions Policies
CREATE POLICY "Team members and judges can view submissions"
ON public.team_submissions FOR SELECT TO authenticated
USING (
  public.is_admin() OR
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_submissions.team_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.judge_assignments WHERE team_id = team_submissions.team_id AND judge_id = auth.uid())
);

CREATE POLICY "Team leaders can manage submissions"
ON public.team_submissions FOR ALL TO authenticated
USING (
  public.is_admin() OR
  EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_submissions.team_id
      AND user_id = auth.uid()
      AND role = 'leader'
  )
);

-- 10. Event Results Policies
CREATE POLICY "Results viewable when published or by admin"
ON public.event_results FOR SELECT TO authenticated
USING (
  public.is_admin() OR
  (is_published = true AND EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = event_results.team_id AND user_id = auth.uid()
  ))
);

-- 11. Event Activity Logs Policies
CREATE POLICY "Staff and admins can view and record activity logs"
ON public.event_activity_logs FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'staff', 'organizer')
  )
);

-- 12. Audit Logs Policies
CREATE POLICY "Audit logs only viewable by admins"
ON public.audit_logs FOR SELECT TO authenticated
USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- 4. TRIGGERS (Auto-Profile Creation on auth.users Signup)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role, created_at)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'participant'::user_role),
    now()
  )
  ON CONFLICT (id) DO UPDATE
  SET
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to prevent duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger attached to auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
