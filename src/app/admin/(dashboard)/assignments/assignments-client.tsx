"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  UserCheck,
  Search,
  Users,
  CheckCircle2,
  AlertCircle,
  FolderKanban,
  Check,
  Shield,
  Layers,
  Sparkles,
} from "lucide-react";
import {
  JudgeOption,
  TeamOption,
  updateJudgeTeams,
} from "@/app/actions/admin-assignments";

interface AssignmentsClientProps {
  initialJudges: JudgeOption[];
  initialTeams: TeamOption[];
}

export default function AssignmentsClientView({
  initialJudges,
  initialTeams,
}: AssignmentsClientProps) {
  const [judges, setJudges] = useState<JudgeOption[]>(initialJudges);
  const [teams, setTeams] = useState<TeamOption[]>(initialTeams);

  // Selected Judge
  const [selectedJudgeId, setSelectedJudgeId] = useState<string>(
    initialJudges[0]?.id || ""
  );

  // Search & Filter state
  const [judgeSearch, setJudgeSearch] = useState("");
  const [teamSearch, setTeamSearch] = useState("");
  const [trackFilter, setTrackFilter] = useState("all");

  const [isPending, startTransition] = useTransition();
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // Active selected judge object
  const activeJudge = useMemo(
    () => judges.find((j) => j.id === selectedJudgeId) || null,
    [judges, selectedJudgeId]
  );

  // Selected teams for the active judge
  const assignedTeamIds = useMemo(
    () => new Set(activeJudge?.assigned_team_ids || []),
    [activeJudge]
  );

  // Distinct tracks
  const tracks = useMemo(() => {
    const set = new Set<string>();
    teams.forEach((t) => {
      if (t.track) set.add(t.track);
    });
    return Array.from(set);
  }, [teams]);

  // Filtered judges
  const filteredJudges = useMemo(() => {
    return judges.filter((j) => {
      const q = judgeSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        j.full_name?.toLowerCase().includes(q) ||
        j.email?.toLowerCase().includes(q)
      );
    });
  }, [judges, judgeSearch]);

  // Filter & view mode state
  const [showOtherAssigned, setShowOtherAssigned] = useState(false);

  // Filtered teams:
  // A team is available for this judge if:
  // 1) It is currently assigned to this judge (so they can unassign it)
  // 2) OR it is not assigned to ANY other judge (assigned_judge_ids is empty)
  // If showOtherAssigned is checked, all teams are shown with assignment badges.
  const filteredTeams = useMemo(() => {
    return teams.filter((t) => {
      if (trackFilter !== "all" && t.track !== trackFilter) return false;

      // Exclusion rule: If team is already assigned to a DIFFERENT judge, hide unless showOtherAssigned is true
      const assignedToOther = t.assigned_judge_ids.some((id) => id !== selectedJudgeId);
      const assignedToThis = t.assigned_judge_ids.includes(selectedJudgeId);

      if (!showOtherAssigned && assignedToOther && !assignedToThis) {
        return false;
      }

      const q = teamSearch.toLowerCase().trim();
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.code?.toLowerCase().includes(q)
      );
    });
  }, [teams, teamSearch, trackFilter, selectedJudgeId, showOtherAssigned]);

  // Toggle team assignment for active judge
  const handleToggleTeam = (team: TeamOption) => {
    if (!activeJudge) return;

    const teamId = team.id;
    const isAssignedToOther = team.assigned_judge_ids.some((id) => id !== activeJudge.id);

    // If assigned to another judge and not currently assigned to this judge, prompt or block
    if (isAssignedToOther && !activeJudge.assigned_team_ids.includes(teamId)) {
      const otherNames = (team.assigned_judge_names || []).join(", ");
      const confirmReassign = window.confirm(
        `This team is already assigned to ${otherNames || "another judge"}. Do you want to reassign this team exclusively to ${activeJudge.full_name || "this judge"}?`
      );
      if (!confirmReassign) return;
    }

    const currentIds = new Set(activeJudge.assigned_team_ids);
    const wasAssigned = currentIds.has(teamId);
    if (wasAssigned) {
      currentIds.delete(teamId);
    } else {
      currentIds.add(teamId);
    }
    const nextArray = Array.from(currentIds);

    // Optimistically update
    setJudges((prev) =>
      prev.map((j) => {
        if (j.id === activeJudge.id) {
          return { ...j, assigned_team_ids: nextArray };
        }
        // If reassigning from another judge, remove from that judge
        if (!wasAssigned && j.assigned_team_ids.includes(teamId)) {
          return {
            ...j,
            assigned_team_ids: j.assigned_team_ids.filter((id) => id !== teamId),
          };
        }
        return j;
      })
    );

    setTeams((prev) =>
      prev.map((t) => {
        if (t.id === teamId) {
          if (wasAssigned) {
            return {
              ...t,
              assigned_judge_ids: t.assigned_judge_ids.filter((id) => id !== activeJudge.id),
              assigned_judge_names: (t.assigned_judge_names || []).filter(
                (n) => n !== (activeJudge.full_name || activeJudge.email)
              ),
            };
          } else {
            // Exclusively assigned to this judge
            return {
              ...t,
              assigned_judge_ids: [activeJudge.id],
              assigned_judge_names: [activeJudge.full_name || activeJudge.email || "Judge"],
            };
          }
        }
        return t;
      })
    );

    // Save to database
    startTransition(async () => {
      try {
        await updateJudgeTeams({
          judgeId: activeJudge.id,
          teamIds: nextArray,
        });
        setNotification({
          type: "success",
          message: wasAssigned
            ? `Unassigned ${team.name} from ${activeJudge.full_name || "judge"}.`
            : `Assigned ${team.name} exclusively to ${activeJudge.full_name || "judge"}.`,
        });
      } catch (err: unknown) {
        setNotification({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to update assignments.",
        });
      }
    });
  };

  // Bulk select all filtered teams for active judge
  const handleSelectAllFiltered = () => {
    if (!activeJudge) return;
    const current = new Set(activeJudge.assigned_team_ids);
    filteredTeams.forEach((t) => current.add(t.id));
    const nextArray = Array.from(current);

    setJudges((prev) =>
      prev.map((j) => (j.id === activeJudge.id ? { ...j, assigned_team_ids: nextArray } : j))
    );

    startTransition(async () => {
      try {
        await updateJudgeTeams({ judgeId: activeJudge.id, teamIds: nextArray });
        setNotification({ type: "success", message: `All filtered teams assigned.` });
      } catch (err: unknown) {
        setNotification({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to assign teams.",
        });
      }
    });
  };

  // Bulk clear all teams for active judge
  const handleClearAll = () => {
    if (!activeJudge) return;
    setJudges((prev) =>
      prev.map((j) => (j.id === activeJudge.id ? { ...j, assigned_team_ids: [] } : j))
    );

    startTransition(async () => {
      try {
        await updateJudgeTeams({ judgeId: activeJudge.id, teamIds: [] });
        setNotification({ type: "success", message: `Cleared all team assignments.` });
      } catch (err: unknown) {
        setNotification({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to clear assignments.",
        });
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in font-tech">
      {/* Notifications */}
      {notification && (
        <div
          className={`p-4 border flex items-center justify-between text-xs transition-all ${
            notification.type === "success"
              ? "bg-status-success/15 border-status-success text-status-success"
              : "bg-status-error/15 border-status-error text-status-error"
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === "success" ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span className="font-bold tracking-wide">{notification.message}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-text-secondary hover:text-text-primary uppercase text-[10px] tracking-wider cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Dual-Panel Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Judge Selector (4 cols) */}
        <div className="lg:col-span-4 border border-border-color bg-surface-color/50 rounded-lg p-5 flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border-color/60">
            <div className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-accent-secondary" />
              <h2 className="font-heading text-lg text-text-primary uppercase m-0">
                Judges ({judges.length})
              </h2>
            </div>
          </div>

          {/* Judge Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <input
              type="text"
              placeholder="Search judge by name/email..."
              value={judgeSearch}
              onChange={(e) => setJudgeSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-surface-color border border-border-color rounded text-xs text-text-primary placeholder:text-text-secondary/60 focus:border-accent-secondary outline-none font-mono"
            />
          </div>

          {/* Judges List */}
          <div className="space-y-2 overflow-y-auto max-h-[620px] pr-1">
            {filteredJudges.length === 0 ? (
              <div className="p-6 text-center text-text-secondary text-xs">
                No judges found.
              </div>
            ) : (
              filteredJudges.map((j) => {
                const isSelected = j.id === selectedJudgeId;
                const assignedCount = j.assigned_team_ids.length;

                return (
                  <button
                    key={j.id}
                    onClick={() => setSelectedJudgeId(j.id)}
                    className={`w-full text-left p-3.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                      isSelected
                        ? "bg-accent-secondary/15 border-accent-secondary shadow-[0_0_15px_rgba(255,0,127,0.2)]"
                        : "bg-surface-color/40 border-border-color/70 hover:border-accent-secondary/50 hover:bg-surface-color"
                    }`}
                  >
                    <div>
                      <p className="font-heading text-sm text-text-primary m-0 uppercase tracking-wide">
                        {j.full_name || "Unnamed Judge"}
                      </p>
                      <p className="text-[11px] text-text-secondary font-mono m-0 truncate max-w-[200px]">
                        {j.email}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider font-mono ${
                          assignedCount > 0
                            ? "bg-accent-primary/20 text-accent-primary border border-accent-primary/40"
                            : "bg-surface-color-light text-text-secondary border border-border-color"
                        }`}
                      >
                        {assignedCount} {assignedCount === 1 ? "Team" : "Teams"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Teams Allocation Matrix (8 cols) */}
        <div className="lg:col-span-8 border border-border-color bg-surface-color/50 rounded-lg p-5 flex flex-col space-y-4">
          {activeJudge ? (
            <>
              {/* Active Judge Status Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-color/60">
                <div>
                  <span className="font-tech text-[10px] uppercase tracking-[2px] text-accent-secondary font-bold">
                    Active Assignee
                  </span>
                  <h2 className="font-heading text-xl text-text-primary uppercase m-0 flex items-center gap-2">
                    <Shield className="w-5 h-5 text-accent-secondary" />
                    {activeJudge.full_name || "Judge"}
                    <span className="text-xs font-mono text-text-secondary normal-case">
                      ({activeJudge.email})
                    </span>
                  </h2>
                </div>

                {/* Bulk Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleSelectAllFiltered}
                    disabled={isPending || filteredTeams.length === 0}
                    className="px-3 py-1.5 bg-surface-color-light border border-border-color hover:border-accent-primary text-text-primary text-xs uppercase font-bold tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Assign Filtered ({filteredTeams.length})
                  </button>
                  <button
                    onClick={handleClearAll}
                    disabled={isPending || activeJudge.assigned_team_ids.length === 0}
                    className="px-3 py-1.5 bg-status-error/10 border border-status-error/40 hover:bg-status-error/20 text-status-error text-xs uppercase font-bold tracking-wider rounded transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Filters for Teams */}
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
                  <input
                    type="text"
                    placeholder="Search available teams by name or code..."
                    value={teamSearch}
                    onChange={(e) => setTeamSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 bg-surface-color border border-border-color rounded text-xs text-text-primary placeholder:text-text-secondary/60 focus:border-accent-primary outline-none font-mono"
                  />
                </div>

                {/* Track Filter */}
                <select
                  value={trackFilter}
                  onChange={(e) => setTrackFilter(e.target.value)}
                  className="bg-surface-color border border-border-color rounded text-xs text-text-primary px-3 py-2 font-mono outline-none focus:border-accent-primary uppercase"
                >
                  <option value="all">All Tracks</option>
                  {tracks.map((tr) => (
                    <option key={tr} value={tr}>
                      Track: {tr}
                    </option>
                  ))}
                </select>

                {/* Show All Toggle */}
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-text-secondary hover:text-text-primary shrink-0 px-2 py-1 bg-surface-color/40 border border-border-color rounded">
                  <input
                    type="checkbox"
                    checked={showOtherAssigned}
                    onChange={(e) => setShowOtherAssigned(e.target.checked)}
                    className="accent-accent-secondary cursor-pointer"
                  />
                  <span>Show already allotted</span>
                </label>
              </div>

              {/* Teams Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto max-h-[580px] pr-1">
                {filteredTeams.length === 0 ? (
                  <div className="sm:col-span-2 p-10 text-center text-text-secondary text-xs">
                    No unassigned teams available for allotment. All teams are allocated or filtered.
                  </div>
                ) : (
                  filteredTeams.map((team) => {
                    const isAssignedToThis = assignedTeamIds.has(team.id);
                    const isAssignedToOther = team.assigned_judge_ids.some(
                      (id) => id !== activeJudge.id
                    );
                    const otherJudgeNames = isAssignedToOther
                      ? (team.assigned_judge_names || []).join(", ")
                      : "";

                    return (
                      <div
                        key={team.id}
                        onClick={() => handleToggleTeam(team)}
                        className={`p-3.5 rounded border transition-all cursor-pointer flex items-center justify-between ${
                          isAssignedToThis
                            ? "bg-gradient-to-r from-accent-primary/15 to-transparent border-accent-primary shadow-[0_0_15px_rgba(0,240,255,0.15)]"
                            : isAssignedToOther
                            ? "bg-surface-color/20 border-status-warning/40 opacity-75 hover:opacity-100"
                            : "bg-surface-color/40 border-border-color/70 hover:border-accent-primary/40 hover:bg-surface-color"
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-heading text-sm text-text-primary uppercase tracking-wide">
                              {team.name}
                            </span>
                            {team.code && (
                              <span className="font-mono text-[10px] text-accent-tertiary px-1.5 py-0.2 bg-accent-tertiary/10 border border-accent-tertiary/30 rounded">
                                {team.code}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 text-[10px] font-mono text-text-secondary">
                            {team.track && (
                              <span className="uppercase text-accent-secondary">
                                [{team.track}]
                              </span>
                            )}
                            {isAssignedToOther && (
                              <>
                                <span>•</span>
                                <span className="text-status-warning font-semibold">
                                  Allotted to: {otherJudgeNames || "Other Judge"}
                                </span>
                              </>
                            )}
                            {!isAssignedToOther && !isAssignedToThis && (
                              <>
                                <span>•</span>
                                <span className="text-status-success font-semibold">
                                  Available for Allotment
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Checkbox indicator */}
                        <div
                          className={`w-6 h-6 rounded flex items-center justify-center border transition-all ${
                            isAssignedToThis
                              ? "bg-accent-primary border-accent-primary text-black"
                              : isAssignedToOther
                              ? "border-status-warning/60 bg-status-warning/10 text-status-warning text-xs font-bold"
                              : "border-border-color/80 bg-surface-color/60 text-transparent"
                          }`}
                        >
                          {isAssignedToThis ? (
                            <Check size={14} className="stroke-[3]" />
                          ) : isAssignedToOther ? (
                            "!"
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          ) : (
            <div className="p-16 text-center text-text-secondary font-tech">
              Please register or select a Judge on the left to configure assignments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
