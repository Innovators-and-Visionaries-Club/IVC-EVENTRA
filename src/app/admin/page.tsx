import { supabaseAdmin } from "@/lib/supabase/admin";
import { Users, Gavel, Layers, Clock, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Fetch real-time summary counts using supabaseAdmin with safe fallback defaults
  let totalTeams = 0;
  let totalJudges = 0;
  let activeRounds = 0;
  let pendingEvaluations = 0;
  let isResultsPublished = false;

  try {
    const [
      teamsRes,
      judgesRes,
      roundsRes,
      evalsRes,
      resultsRes,
    ] = await Promise.allSettled([
      supabaseAdmin.from("teams").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "judge"),
      supabaseAdmin.from("evaluation_rounds").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("evaluations").select("id", { count: "exact", head: true }).eq("status", "draft"),
      supabaseAdmin.from("event_results").select("is_published").eq("is_published", true).limit(1),
    ]);

    if (teamsRes.status === "fulfilled" && teamsRes.value.count !== null) {
      totalTeams = teamsRes.value.count;
    }
    if (judgesRes.status === "fulfilled" && judgesRes.value.count !== null) {
      totalJudges = judgesRes.value.count;
    }
    if (roundsRes.status === "fulfilled" && roundsRes.value.count !== null) {
      activeRounds = roundsRes.value.count;
    }
    if (evalsRes.status === "fulfilled" && evalsRes.value.count !== null) {
      pendingEvaluations = evalsRes.value.count;
    }
    if (resultsRes.status === "fulfilled" && resultsRes.value.data && resultsRes.value.data.length > 0) {
      isResultsPublished = true;
    }
  } catch (err) {
    console.error("Failed to load live admin metrics:", err);
  }

  const metricCards = [
    {
      label: "Registered Teams",
      value: totalTeams,
      icon: Users,
      color: "text-accent-secondary",
      borderColor: "border-accent-secondary/30",
      link: "/participants",
    },
    {
      label: "Active Judges",
      value: totalJudges,
      icon: Gavel,
      color: "text-accent-tertiary",
      borderColor: "border-accent-tertiary/30",
      link: "/judges",
    },
    {
      label: "Active Rounds",
      value: activeRounds,
      icon: Layers,
      color: "text-accent-primary",
      borderColor: "border-accent-primary/30",
      link: "/admin/rounds",
    },
    {
      label: "Pending Evaluations",
      value: pendingEvaluations,
      icon: Clock,
      color: "text-status-warning",
      borderColor: "border-status-warning/30",
      link: "/admin/evaluations",
    },
    {
      label: "Results Engine",
      value: isResultsPublished ? "Published" : "Draft / Unreleased",
      icon: ShieldCheck,
      color: isResultsPublished ? "text-status-success" : "text-text-secondary",
      borderColor: isResultsPublished ? "border-status-success/30" : "border-border-color",
      link: "/admin/results",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-color pb-6">
        <div>
          <p className="font-tech text-xs uppercase tracking-[3px] text-accent-secondary font-bold mb-1">
            Vice Verse 1.0 // Command Center
          </p>
          <h1 className="text-3xl md:text-5xl font-heading text-text-primary tracking-wider uppercase m-0">
            Admin Overview
          </h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-2 px-3 py-1 bg-status-success/10 border border-status-success text-status-success text-xs font-tech font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
            System Live
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {metricCards.map((card, idx) => (
          <div
            key={idx}
            className={`glass-panel p-6 border ${card.borderColor} flex flex-col justify-between transition-all hover:scale-[1.02]`}
          >
            <div className="flex items-center justify-between mb-4">
              <span className="font-tech text-xs uppercase tracking-wider text-text-secondary font-semibold">
                {card.label}
              </span>
              <card.icon className={`${card.color} w-6 h-6`} />
            </div>
            <div className="my-2">
              <p className={`font-heading text-3xl md:text-4xl ${card.color} m-0`}>
                {card.value}
              </p>
            </div>
            <div className="pt-4 mt-2 border-t border-border-color/60 flex justify-end">
              <Link
                href={card.link}
                className="inline-flex items-center gap-1 font-tech text-xs uppercase font-bold text-text-secondary hover:text-text-primary transition-colors"
              >
                Inspect
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        ))}
      </div>

      <div className="glass-panel p-6 border border-border-color space-y-4">
        <h2 className="font-heading text-xl text-text-primary uppercase tracking-wider m-0">
          Quick Navigation
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <Link
            href="/admin/rounds"
            className="p-4 bg-surface-color-light/40 border border-border-color hover:border-accent-secondary transition-all"
          >
            <h3 className="font-heading text-sm text-text-primary mb-1 uppercase">
              Rounds & Criteria
            </h3>
            <p className="font-tech text-xs text-text-secondary m-0">
              Configure rubric, sequence, and manage round states.
            </p>
          </Link>
          <Link
            href="/admin/evaluations"
            className="p-4 bg-surface-color-light/40 border border-border-color hover:border-accent-secondary transition-all"
          >
            <h3 className="font-heading text-sm text-text-primary mb-1 uppercase">
              Evaluation Overrides
            </h3>
            <p className="font-tech text-xs text-text-secondary m-0">
              Inspect judge scores, reopen or lock evaluations with audit trails.
            </p>
          </Link>
          <Link
            href="/admin/results"
            className="p-4 bg-surface-color-light/40 border border-border-color hover:border-accent-secondary transition-all"
          >
            <h3 className="font-heading text-sm text-text-primary mb-1 uppercase">
              Results Engine
            </h3>
            <p className="font-tech text-xs text-text-secondary m-0">
              Recalculate leaderboard scores, freeze or publish finals.
            </p>
          </Link>
          <Link
            href="/admin/audit-logs"
            className="p-4 bg-surface-color-light/40 border border-border-color hover:border-accent-secondary transition-all"
          >
            <h3 className="font-heading text-sm text-text-primary mb-1 uppercase">
              Audit Logs
            </h3>
            <p className="font-tech text-xs text-text-secondary m-0">
              Trace all administrative actions, timestamps, and justification.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}
