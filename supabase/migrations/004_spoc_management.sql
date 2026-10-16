-- 004_spoc_management.sql
-- Create table for managing SPOCs (Single Point of Contact) and team allotments

CREATE TABLE IF NOT EXISTS public.spocs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    department TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for allotting teams to SPOCs
-- With UNIQUE constraint on team_id so each team is assigned to at most one SPOC
CREATE TABLE IF NOT EXISTS public.team_spoc_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    spoc_id UUID NOT NULL REFERENCES public.spocs(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    allotted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_team_spoc UNIQUE (team_id)
);

-- Indexes for lightning fast lookups
CREATE INDEX IF NOT EXISTS idx_team_spoc_spoc_id ON public.team_spoc_assignments(spoc_id);
CREATE INDEX IF NOT EXISTS idx_team_spoc_team_id ON public.team_spoc_assignments(team_id);

-- Enable Row Level Security
ALTER TABLE public.spocs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_spoc_assignments ENABLE ROW LEVEL SECURITY;

-- Policies for SPOCs
DROP POLICY IF EXISTS "Admins can manage spocs" ON public.spocs;
CREATE POLICY "Admins can manage spocs"
    ON public.spocs
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view spocs" ON public.spocs;
CREATE POLICY "Authenticated users can view spocs"
    ON public.spocs
    FOR SELECT
    TO authenticated
    USING (true);

-- Policies for team_spoc_assignments
DROP POLICY IF EXISTS "Admins can manage spoc assignments" ON public.team_spoc_assignments;
CREATE POLICY "Admins can manage spoc assignments"
    ON public.team_spoc_assignments
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Authenticated users can view spoc assignments" ON public.team_spoc_assignments;
CREATE POLICY "Authenticated users can view spoc assignments"
    ON public.team_spoc_assignments
    FOR SELECT
    TO authenticated
    USING (true);
