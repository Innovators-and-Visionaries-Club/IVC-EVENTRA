import { requireAuthenticatedTeamUser } from "@/lib/auth/team";
import { supabaseAdmin } from "@/lib/supabase/admin";
import TeamQrClientView from "./qr-client";

export const dynamic = "force-dynamic";

export default async function TeamQrPage() {
  const { teamId } = await requireAuthenticatedTeamUser();
  const effectiveTeamId = teamId || "00000000-0000-0000-0000-000000000010";

  interface TeamInfo {
    id: string;
    name: string;
    track?: string | null;
    leader_name?: string | null;
  }

  let teamInfo: TeamInfo | null = null;
  try {
    const { data } = await supabaseAdmin
      .from("teams")
      .select("id, name, track, leader_name")
      .eq("id", effectiveTeamId)
      .single();
    if (data) teamInfo = data;
  } catch (err) {
    console.error("Failed to load team data for QR:", err);
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto">
      <div className="border-b border-border-color pb-6 text-center">
        <p className="font-tech text-xs uppercase tracking-[3px] text-accent-secondary font-bold mb-1">
          Team Identity // Official Access Pass
        </p>
        <h1 className="text-3xl md:text-4xl font-heading text-text-primary tracking-wider uppercase m-0">
          Team QR Pass
        </h1>
        <p className="font-tech text-text-secondary text-xs mt-2">
          Present this official QR badge at check-in, kit distribution, lunch counters, and refreshments booths.
        </p>
      </div>

      <TeamQrClientView
        teamId={effectiveTeamId}
        teamName={teamInfo?.name || "Team Alpha"}
        track={teamInfo?.track || "Innovation Track"}
        leaderName={teamInfo?.leader_name || "Team Leader"}
      />
    </div>
  );
}
