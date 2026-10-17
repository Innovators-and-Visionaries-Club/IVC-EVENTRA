-- ==============================================================================
-- IVC PULSE: Real-time QR Verification, Live Synchronization & Anti-Fraud
-- Migration: 006_realtime_activity_logs.sql
-- Enables live Supabase broadcast & replica identity for QR desks and fraud guards
-- ==============================================================================

-- 1. ADD QR TELEMETRY & ANTI-FRAUD TOKENS TO TEAMS TABLE
ALTER TABLE IF EXISTS public.teams
  ADD COLUMN IF NOT EXISTS qr_token TEXT,
  ADD COLUMN IF NOT EXISTS last_scanned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_scanned_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 2. ENSURE REPLICA IDENTITY FULL FOR LIVE PAYLOAD TRANSMISSION
ALTER TABLE IF EXISTS public.event_activity_logs REPLICA IDENTITY FULL;
ALTER TABLE IF EXISTS public.teams REPLICA IDENTITY FULL;

-- 3. ENABLE SUPABASE REALTIME PUBLICATION FOR LOGS & TEAMS
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'event_activity_logs'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.event_activity_logs;
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables 
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'teams'
    ) THEN
      ALTER PUBLICATION supabase_realtime ADD TABLE public.teams;
    END IF;
  END IF;
END $$;

-- 4. PERMIT TEAM PARTICIPANTS TO SELECT OWN TEAM'S ACTIVITY LOGS FOR LIVE QR
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'event_activity_logs' 
      AND policyname = 'Team participants can view own team activity logs'
  ) THEN
    CREATE POLICY "Team participants can view own team activity logs"
    ON public.event_activity_logs FOR SELECT TO authenticated
    USING (
      team_id IN (
        SELECT team_id FROM public.team_members WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- 5. ENSURE STAFF AND ADMINS CAN READ AND INSERT ACTIVITY LOGS
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'event_activity_logs' 
      AND policyname = 'Staff and admins can manage event activity logs'
  ) THEN
    CREATE POLICY "Staff and admins can manage event activity logs"
    ON public.event_activity_logs FOR ALL TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role IN ('admin', 'staff', 'organizer')
      )
    );
  END IF;
END $$;
