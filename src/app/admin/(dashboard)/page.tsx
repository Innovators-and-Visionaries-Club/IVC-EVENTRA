import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  Users,
  Gavel,
  Shield,
  Crown,
  Layers,
  Clock,
  ShieldCheck,
  ArrowRight,
  UserCog,
} from "lucide-react";
import Link from "next/link";
import StatCard from "@/components/admin/StatCard";
import AdminAnnouncementModal from "@/components/admin/AdminAnnouncementModal";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import { getActiveAnnouncements } from "@/app/actions/announcements";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // 1. User Role Counts
  let participantCount = 0;
  let leaderCount = 0;
  let judgeCount = 0;
  let staffCount = 0;

  // 2. Event Metrics Counts
  let totalTeams = 0;
  let activeRounds = 0;
  let pendingEvaluations = 0;
  let isResultsPublished = false;
  let announcements: any[] = [];

  try {
    const [
      participantsRes,
      leadersRes,
      profilesLeaderRes,
      judgesRes,
      staffRes,
      teamsRes,
      roundsRes,
      evalsRes,
      resultsRes,
      annRes,
    ] = await Promise.allSettled([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "participant"),
      supabaseAdmin.from("team_members").select("id", { count: "exact", head: true }).eq("role", "leader"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "leader"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).eq("role", "judge"),
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }).in("role", ["staff", "organizer"]),
      supabaseAdmin.from("teams").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("evaluation_rounds").select("id", { count: "exact", head: true }).eq("status", "open"),
      supabaseAdmin.from("evaluations").select("id", { count: "exact", head: true }).eq("status", "draft"),
      supabaseAdmin.from("event_results").select("is_published").eq("is_published", true).limit(1),
      getActiveAnnouncements("all"),
    ]);

    if (participantsRes.status === "fulfilled" && participantsRes.value && typeof participantsRes.value.count === "number") {
      participantCount = participantsRes.value.count;
    }
    
    // Leader count: team_members with role 'leader' or profiles with role 'leader'
    let tmLeaders = 0;
    let profLeaders = 0;
    if (leadersRes.status === "fulfilled" && leadersRes.value && typeof leadersRes.value.count === "number") {
      tmLeaders = leadersRes.value.count;
    }
    if (profilesLeaderRes.status === "fulfilled" && profilesLeaderRes.value && typeof profilesLeaderRes.value.count === "number") {
      profLeaders = profilesLeaderRes.value.count;
    }
    leaderCount = Math.max(tmLeaders, profLeaders);

    if (judgesRes.status === "fulfilled" && judgesRes.value && typeof judgesRes.value.count === "number") {
      judgeCount = judgesRes.value.count;
    }
    if (staffRes.status === "fulfilled" && staffRes.value && typeof staffRes.value.count === "number") {
      staffCount = staffRes.value.count;
    }
    if (teamsRes.status === "fulfilled" && teamsRes.value && typeof teamsRes.value.count === "number") {
      totalTeams = teamsRes.value.count;
    }
    if (roundsRes.status === "fulfilled" && roundsRes.value && typeof roundsRes.value.count === "number") {
      activeRounds = roundsRes.value.count;
    }
    if (evalsRes.status === "fulfilled" && evalsRes.value && typeof evalsRes.value.count === "number") {
      pendingEvaluations = evalsRes.value.count;
    }
    if (
      resultsRes.status === "fulfilled" &&
      resultsRes.value &&
      "data" in resultsRes.value &&
      Array.isArray(resultsRes.value.data) &&
      resultsRes.value.data.length > 0
    ) {
      isResultsPublished = true;
    }
    if (annRes.status === "fulfilled" && Array.isArray(annRes.value)) {
      announcements = annRes.value;
    }
  } catch (err) {
    console.error("Failed to load live admin metrics:", err);
  }

  const eventMetricCards = [
    {
      label: "Registered Teams",
      value: totalTeams,
      icon: Users,
      color: "text-accent-secondary",
      borderColor: "border-accent-secondary/30",
      link: "/admin/users?role=participant",
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
    <div className="space-y-8 animate-fade-in font-tech">
      {/* Live Announcement Banner */}
      <AnnouncementBanner announcements={announcements} portalName="Global Broadcast" />

      {/* Header Banner */}
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
          <AdminAnnouncementModal />
          <Link
            href="/admin/users"
            className="inline-flex items-center gap-2 px-4 py-2 bg-accent-secondary/15 border border-accent-secondary text-accent-secondary hover:bg-accent-secondary hover:text-black transition-all font-tech text-xs uppercase font-bold tracking-wider"
          >
            <UserCog size={15} />
            <span>Manage Users</span>
          </Link>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-status-success/10 border border-status-success text-status-success text-xs font-tech font-bold uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-status-success animate-ping" />
            System Live
          </span>
        </div>
      </div>

      {/* SECTION 1: User Roles Overview (Interactive Stat Cards) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h2 className="font-heading text-xl text-text-primary uppercase tracking-wider m-0 flex items-center gap-2">
              <UserCog className="text-accent-secondary" size={20} />
              <span>Role Demographics & Portal Roster</span>
            </h2>
            <p className="font-tech text-xs text-text-secondary m-0">
              Click any card to inspect and manage users by role.
            </p>
          </div>
          <Link
            href="/admin/users"
            className="font-tech text-xs text-accent-primary hover:underline uppercase tracking-wider font-bold hidden sm:inline"
          >
            View All Users &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            label="Participants"
            count={participantCount}
            role="participant"
            icon={Users}
            colorScheme="pink"
            description="Active hackers and ideathon builders"
          />
          <StatCard
            label="Team Leaders"
            count={leaderCount}
            role="leader"
            icon={Crown}
            colorScheme="yellow"
            description="Captains leading ideathon squads"
          />
          <StatCard
            label="Judges"
            count={judgeCount}
            role="judge"
            icon={Gavel}
            colorScheme="cyan"
            description="Evaluators scoring project criteria"
          />
          <StatCard
            label="Staff & Club"
            count={staffCount}
            role="staff"
            icon={Shield}
            colorScheme="green"
            description="Volunteers, scan desk & event organizers"
          />
        </div>
      </div>

      {/* SECTION 2: Event Core Metrics */}
      <div className="space-y-4">
        <h2 className="font-heading text-xl text-text-primary uppercase tracking-wider m-0">
          Event Operations Metrics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {eventMetricCards.map((card, idx) => {
            const IconComponent = card.icon;
            return (
              <div
                key={idx}
                className={`glass-panel p-6 border ${card.borderColor} flex flex-col justify-between transition-all hover:scale-[1.02]`}
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="font-tech text-xs uppercase tracking-wider text-text-secondary font-semibold">
                    {card.label}
                  </span>
                  <IconComponent className={`${card.color} w-6 h-6`} />
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
            );
          })}
        </div>
      </div>

      {/* SECTION 3: Quick Navigation */}
      <div className="glass-panel p-6 border border-border-color space-y-4">
        <h2 className="font-heading text-xl text-text-primary uppercase tracking-wider m-0">
          Mission Control Modules
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <Link
            href="/admin/users"
            className="p-4 bg-surface-color-light/40 border border-border-color hover:border-accent-secondary transition-all"
          >
            <h3 className="font-heading text-sm text-text-primary mb-1 uppercase">
              User Management
            </h3>
            <p className="font-tech text-xs text-text-secondary m-0">
              Role promotion, user provisioning, and profile directory.
            </p>
          </Link>
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
        </div>
      </div>
    </div>
  );
}
