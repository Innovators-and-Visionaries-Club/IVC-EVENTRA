-- ==============================================================================
-- IVC PULSE: Initial Database Schema & RLS Policies Migration
-- File: supabase/migrations/001_initial_schema.sql
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. PROFILES TABLE (Linked with Supabase auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'participant' CHECK (role IN ('admin', 'judge', 'staff', 'organizer', 'participant')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 2. EVENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 3. TEAMS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    track TEXT DEFAULT 'Innovation',
    leader_name TEXT,
    status TEXT NOT NULL DEFAULT 'registered' CHECK (status IN ('registered', 'checked_in', 'disqualified', 'finalist')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 4. TEAM MEMBERS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('leader', 'member')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_team_member UNIQUE (team_id, user_id)
);

-- ------------------------------------------------------------------------------
-- 5. EVALUATION ROUNDS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluation_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sequence_order INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed', 'locked', 'reopened')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_round_sequence UNIQUE (event_id, sequence_order)
);

-- ------------------------------------------------------------------------------
-- 6. EVALUATION CRITERIA TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluation_criteria (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES public.evaluation_rounds(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    max_marks NUMERIC(5, 2) NOT NULL DEFAULT 10.00 CHECK (max_marks > 0),
    is_required BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ------------------------------------------------------------------------------
-- 7. JUDGE ASSIGNMENTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.judge_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    round_id UUID REFERENCES public.evaluation_rounds(id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_judge_team_round UNIQUE (judge_id, team_id, round_id)
);

-- ------------------------------------------------------------------------------
-- 8. EVALUATIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id UUID NOT NULL REFERENCES public.evaluation_rounds(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    judge_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    total_score NUMERIC(6, 2) DEFAULT 0.00,
    scores_breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
    feedback TEXT,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'locked', 'reopened')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_eval_round_team_judge UNIQUE (round_id, team_id, judge_id)
);

-- ------------------------------------------------------------------------------
-- 9. TEAM SUBMISSIONS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.team_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    round_id UUID NOT NULL REFERENCES public.evaluation_rounds(id) ON DELETE CASCADE,
    ppt_url TEXT NOT NULL,
    github_url TEXT,
    pitch_deck_url TEXT,
    prototype_url TEXT,
    additional_material_url TEXT,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_team_submission_round UNIQUE (team_id, round_id)
);

-- ------------------------------------------------------------------------------
-- 10. EVENT RESULTS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    total_score NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    average_score NUMERIC(6, 2) NOT NULL DEFAULT 0.00,
    evaluations_count INT NOT NULL DEFAULT 0,
    rank INT,
    is_published BOOLEAN NOT NULL DEFAULT false,
    is_locked BOOLEAN NOT NULL DEFAULT false,
    published_at TIMESTAMPTZ,
    locked_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_event_team_result UNIQUE (event_id, team_id)
);

-- ------------------------------------------------------------------------------
-- 11. EVENT ACTIVITY LOGS TABLE (With Unique Constraint for Duplicate Prevention)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.event_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('registration', 'goodies', 'lunch', 'snacks')),
    scanned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_participant_action UNIQUE (participant_id, action_type)
);

-- ------------------------------------------------------------------------------
-- 12. AUDIT LOGS TABLE
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluation_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.judge_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an admin
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
CREATE POLICY "Public profiles are viewable by authenticated users"
ON public.profiles FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- 2. Events Policies
CREATE POLICY "Events are viewable by anyone"
ON public.events FOR SELECT USING (true);

CREATE POLICY "Admins can manage events"
ON public.events FOR ALL TO authenticated USING (public.is_admin());

-- 3. Teams Policies
CREATE POLICY "Teams are viewable by authenticated users"
ON public.teams FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage teams"
ON public.teams FOR ALL TO authenticated USING (public.is_admin());

-- 4. Team Members Policies
CREATE POLICY "Team members viewable by authenticated users"
ON public.team_members FOR SELECT TO authenticated USING (true);

-- 5. Evaluation Rounds Policies
CREATE POLICY "Rounds are viewable by authenticated users"
ON public.evaluation_rounds FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage rounds"
ON public.evaluation_rounds FOR ALL TO authenticated USING (public.is_admin());

-- 6. Evaluation Criteria Policies
CREATE POLICY "Criteria are viewable by authenticated users"
ON public.evaluation_criteria FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage criteria"
ON public.evaluation_criteria FOR ALL TO authenticated USING (public.is_admin());

-- 7. Judge Assignments Policies
CREATE POLICY "Judges can view their own assignments"
ON public.judge_assignments FOR SELECT TO authenticated
USING (judge_id = auth.uid() OR public.is_admin());

-- 8. Evaluations Policies
CREATE POLICY "Judges can view and manage their evaluations"
ON public.evaluations FOR SELECT TO authenticated
USING (judge_id = auth.uid() OR public.is_admin());

-- 9. Team Submissions Policies
CREATE POLICY "Submissions viewable by team members, judges, and admins"
ON public.team_submissions FOR SELECT TO authenticated
USING (
  public.is_admin() OR
  EXISTS (SELECT 1 FROM public.team_members WHERE team_id = team_submissions.team_id AND user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.judge_assignments WHERE team_id = team_submissions.team_id AND judge_id = auth.uid())
);

-- 10. Event Results Policies
CREATE POLICY "Published results viewable by team members or admins"
ON public.event_results FOR SELECT TO authenticated
USING (
  public.is_admin() OR
  (is_published = true AND EXISTS (SELECT 1 FROM public.team_members WHERE team_id = event_results.team_id AND user_id = auth.uid()))
);

-- 11. Event Activity Logs Policies
CREATE POLICY "Operations staff and admins can view and insert activity logs"
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
