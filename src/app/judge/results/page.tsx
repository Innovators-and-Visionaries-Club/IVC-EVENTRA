import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireJudgeAuth } from "@/lib/auth/judge";
import { Trophy, Award, Medal, Users, ArrowUpRight, BarChart3, Clock, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

interface LeaderboardItem {
  id: string;
  team_id?: string;
  rank?: number | null;
  total_score?: number | null;
  evaluations_count?: number | null;
  average_score?: number | null;
  award_title?: string | null;
  is_published?: boolean;
  teams?: {
    id: string;
    name: string;
    track?: string | null;
    leader_name?: string | null;
  } | null;
}

export default async function JudgeLeaderboardPage() {
  try {
    await requireJudgeAuth();
  } catch {
    // layout handles redirect
  }

  let results: LeaderboardItem[] = [];
  let isPublished = false;

  try {
    const { data: resultsData } = await supabaseAdmin
      .from("event_results")
      .select("*, teams(id, name, track, leader_name)")
      .order("rank", { ascending: true, nullsFirst: false });

    if (resultsData && resultsData.length > 0) {
      results = resultsData;
      isPublished = resultsData.some((r) => r.is_published);
    } else {
      // Fallback: fetch teams and calculate preliminary averages from evaluations if event_results not populated yet
      const [{ data: teamsData }, { data: evalsData }] = await Promise.all([
        supabaseAdmin.from("teams").select("id, name, track, leader_name"),
        supabaseAdmin.from("evaluations").select("team_id, total_score, status").eq("status", "submitted"),
      ]);

      if (teamsData) {
        const teamScoreMap = new Map<string, { total: number; count: number }>();
        evalsData?.forEach((e) => {
          if (e.team_id && e.total_score != null) {
            const current = teamScoreMap.get(e.team_id) || { total: 0, count: 0 };
            teamScoreMap.set(e.team_id, {
              total: current.total + Number(e.total_score),
              count: current.count + 1,
            });
          }
        });

        const sorted = teamsData.map((t) => {
          const stats = teamScoreMap.get(t.id) || { total: 0, count: 0 };
          const avg = stats.count > 0 ? stats.total / stats.count : 0;
          return {
            id: t.id,
            team_id: t.id,
            total_score: stats.total,
            evaluations_count: stats.count,
            average_score: Math.round(avg * 10) / 10,
            teams: t,
            is_published: false,
          };
        }).sort((a, b) => (b.total_score || 0) - (a.total_score || 0));

        results = sorted.map((item, idx) => ({
          ...item,
          rank: item.evaluations_count > 0 ? idx + 1 : null,
        }));
      }
    }
  } catch (err) {
    console.error("Failed to load judge leaderboard:", err);
  }

  return (
    <div className="space-y-8 animate-fade-in font-tech">
      {/* Page Header */}
      <div className="border-b border-border-color pb-6">
        <p className="text-xs uppercase tracking-[3px] text-accent-primary font-bold mb-1">
          Jury Overview // Event Standings
        </p>
        <h1 className="text-3xl md:text-5xl font-heading text-text-primary tracking-wider uppercase m-0">
          Leaderboard & Standings
        </h1>
        <p className="text-text-secondary text-sm mt-2 max-w-2xl">
          Live compilation of team standings, evaluation averages, and official rankings across all rounds.
        </p>
      </div>

      {/* Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 glass-panel border border-border-color">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-accent-primary/10 border border-accent-primary/40 text-accent-primary">
            <Trophy size={18} />
          </div>
          <div>
            <span className="text-[10px] text-text-secondary uppercase tracking-wider font-mono">
              Publication Status
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isPublished ? "bg-status-success animate-pulse" : "bg-status-warning"}`} />
              <span className="font-heading text-sm uppercase text-text-primary">
                {isPublished ? "Officially Published by Admin" : "Preliminary Live Scores"}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="px-3 py-1.5 bg-surface-color-light border border-border-color">
            <span className="text-text-secondary">Teams: </span>
            <span className="font-bold text-text-primary">{results.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-surface-color-light border border-border-color">
            <span className="text-text-secondary">Evaluated: </span>
            <span className="font-bold text-accent-primary">
              {results.filter((r) => (r.evaluations_count || 0) > 0).length}
            </span>
          </div>
        </div>
      </div>

      {/* Standings Table */}
      <div className="glass-panel border border-border-color overflow-hidden">
        <div className="p-4 border-b border-border-color bg-surface-color/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-accent-primary" />
            <h2 className="font-heading text-base text-text-primary uppercase m-0">
              Rankings Table
            </h2>
          </div>
          <span className="text-[10px] font-mono text-text-secondary uppercase">
            Sorted by rank & total score
          </span>
        </div>

        {results.length === 0 ? (
          <div className="p-12 text-center text-text-secondary text-sm">
            <Users size={36} className="mx-auto mb-3 opacity-40" />
            <p>No team results recorded yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border-color bg-surface-color-light/40 text-text-secondary uppercase tracking-wider text-[11px]">
                  <th className="p-3.5 pl-5">Rank</th>
                  <th className="p-3.5">Team Name</th>
                  <th className="p-3.5">Track</th>
                  <th className="p-3.5 text-center">Evaluations</th>
                  <th className="p-3.5 text-center">Average Score</th>
                  <th className="p-3.5 text-center">Total Score</th>
                  <th className="p-3.5 text-right pr-5">Evaluate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/30">
                {results.map((r, idx) => {
                  const rank = r.rank ?? (r.evaluations_count ? idx + 1 : null);
                  const isTop3 = rank !== null && rank <= 3;
                  const rankBadgeClass =
                    rank === 1
                      ? "bg-amber-400/20 text-amber-300 border-amber-400/60"
                      : rank === 2
                      ? "bg-slate-300/20 text-slate-200 border-slate-300/60"
                      : rank === 3
                      ? "bg-amber-700/20 text-amber-500 border-amber-700/60"
                      : "bg-surface-color-light text-text-secondary border-border-color";

                  return (
                    <tr
                      key={r.id || idx}
                      className="hover:bg-surface-color-light/20 transition-colors"
                    >
                      <td className="p-3.5 pl-5 font-mono">
                        {rank ? (
                          <span
                            className={`inline-flex items-center justify-center w-7 h-7 text-xs font-bold border rounded ${rankBadgeClass}`}
                          >
                            {rank === 1 ? (
                              <Medal size={14} />
                            ) : (
                              `#${rank}`
                            )}
                          </span>
                        ) : (
                          <span className="text-text-secondary/50 italic text-[11px]">—</span>
                        )}
                      </td>
                      <td className="p-3.5">
                        <p className="font-heading text-sm text-text-primary uppercase m-0">
                          {r.teams?.name || "Unnamed Team"}
                        </p>
                        {r.teams?.leader_name && (
                          <p className="text-[11px] text-text-secondary m-0">
                            Lead: {r.teams.leader_name}
                          </p>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-surface-color-light border border-border-color text-[10px] text-text-secondary uppercase">
                          {r.teams?.track || "Innovation"}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono">
                        <span className="text-text-primary font-bold">
                          {r.evaluations_count || 0}
                        </span>
                      </td>
                      <td className="p-3.5 text-center font-mono">
                        <span className="text-accent-secondary font-bold">
                          {r.average_score != null ? Number(r.average_score).toFixed(1) : "—"}
                        </span>
                        {r.average_score != null && (
                          <span className="text-[10px] text-text-secondary ml-0.5">pts</span>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-mono">
                        <span className="text-accent-primary font-bold text-sm">
                          {r.total_score != null ? r.total_score : "—"}
                        </span>
                        {r.total_score != null && (
                          <span className="text-[10px] text-text-secondary ml-0.5">pts</span>
                        )}
                      </td>
                      <td className="p-3.5 text-right pr-5">
                        {r.teams?.id ? (
                          <Link
                            href={`/judge/evaluate/${r.teams.id}`}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-accent-primary hover:text-accent-primary/80 uppercase"
                          >
                            Scorecard <ArrowUpRight size={13} />
                          </Link>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
