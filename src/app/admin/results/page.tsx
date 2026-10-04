import { supabaseAdmin } from "@/lib/supabase/admin";
import ResultsClientView from "./results-client";

export const dynamic = "force-dynamic";

export default async function AdminResultsPage() {
  let results: any[] = [];
  let isPublished = false;
  let isLocked = false;
  const eventId = "00000000-0000-0000-0000-000000000001"; // Default flagship event UUID

  try {
    const { data, error } = await supabaseAdmin
      .from("event_results")
      .select("*")
      .order("total_score", { ascending: false });

    if (data) {
      results = data;
      isPublished = data.some((r) => r.is_published);
      isLocked = data.some((r) => r.is_locked);
    }
  } catch (err) {
    console.error("Failed to load results data:", err);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-border-color pb-6">
        <p className="font-tech text-xs uppercase tracking-[3px] text-accent-secondary font-bold mb-1">
          Administration // Tabulation & Finals
        </p>
        <h1 className="text-3xl md:text-5xl font-heading text-text-primary tracking-wider uppercase m-0">
          Results Engine
        </h1>
        <p className="font-tech text-text-secondary text-sm mt-2 max-w-2xl">
          Control scoring calculations, freeze standings, and manage the official leaderboard publication state.
        </p>
      </div>

      <ResultsClientView
        eventId={eventId}
        initialResults={results}
        initialIsPublished={isPublished}
        initialIsLocked={isLocked}
      />
    </div>
  );
}
