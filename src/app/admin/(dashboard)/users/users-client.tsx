"use client";

import React, { useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Users,
  Search,
  UserPlus,
  Shield,
  Gavel,
  Crown,
  Trash2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Lock,
  Mail,
  User,
  ShieldCheck,
  LucideIcon,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  UserProfileItem,
  AllowedUserRole,
  updateUserRole,
  createUser,
  deleteUser,
  TeamHierarchyItem,
} from "@/app/actions/admin-users";

interface UsersClientProps {
  initialUsers: UserProfileItem[];
  initialTeamsHierarchy?: TeamHierarchyItem[];
  currentUserEmail?: string;
  currentUserId?: string;
}

const roleBadges: Record<
  AllowedUserRole,
  { label: string; badgeClass: string; icon: LucideIcon }
> = {
  admin: {
    label: "Admin",
    badgeClass: "bg-accent-secondary/15 text-accent-secondary border-accent-secondary/40",
    icon: ShieldCheck,
  },
  judge: {
    label: "Judge",
    badgeClass: "bg-accent-tertiary/15 text-accent-tertiary border-accent-tertiary/40",
    icon: Gavel,
  },
  staff: {
    label: "Staff",
    badgeClass: "bg-status-success/15 text-status-success border-status-success/40",
    icon: Shield,
  },
  organizer: {
    label: "Organizer",
    badgeClass: "bg-purple-500/15 text-purple-400 border-purple-500/40",
    icon: Shield,
  },
  leader: {
    label: "Team Leader",
    badgeClass: "bg-accent-primary/15 text-accent-primary border-accent-primary/40",
    icon: Crown,
  },
  participant: {
    label: "Participant",
    badgeClass: "bg-surface-color-light text-text-secondary border-border-color",
    icon: Users,
  },
};

const filterTabs = [
  { id: "all", label: "All Users" },
  { id: "teams", label: "Teams & Members" },
  { id: "participant", label: "Participants" },
  { id: "leader", label: "Team Leaders" },
  { id: "judge", label: "Judges" },
  { id: "staff", label: "Staff & Club" },
  { id: "admin", label: "Admins" },
];

export default function UsersClientView({
  initialUsers,
  initialTeamsHierarchy = [],
  currentUserId,
}: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role") || "all";

  const [activeTab, setActiveTab] = useState<string>(initialRoleParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [usersList, setUsersList] = useState<UserProfileItem[]>(initialUsers);
  const [teamsHierarchy, setTeamsHierarchy] = useState<TeamHierarchyItem[]>(initialTeamsHierarchy);
  const [expandedTeams, setExpandedTeams] = useState<Record<string, boolean>>({});
  const [isPending, startTransition] = useTransition();

  // Toggle tree expansion
  const toggleTeamExpand = (teamId: string) => {
    setExpandedTeams((prev) => ({
      ...prev,
      [teamId]: prev[teamId] === undefined ? false : !prev[teamId], // default expanded unless toggled
    }));
  };

  const isTeamExpanded = (teamId: string) => {
    return expandedTeams[teamId] !== false; // expanded by default
  };

  React.useEffect(() => {
    setTeamsHierarchy(initialTeamsHierarchy);
  }, [initialTeamsHierarchy]);

  React.useEffect(() => {
    const roleParam = searchParams.get("role") || "all";
    setActiveTab(roleParam);
  }, [searchParams]);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfileItem | null>(null);

  // Notifications
  const [notification, setNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  // New User Form State
  const [newUserData, setNewUserData] = useState({
    fullName: "",
    email: "",
    password: "",
    role: "participant" as AllowedUserRole,
  });
  const [formLoading, setFormLoading] = useState(false);

  // Sync users list if parent re-renders with fresh data
  React.useEffect(() => {
    setUsersList(initialUsers);
  }, [initialUsers]);

  // Handle Tab Switch & URL parameter sync
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    if (tabId === "all") {
      router.replace("/admin/users", { scroll: false });
    } else {
      router.replace(`/admin/users?role=${encodeURIComponent(tabId)}`, { scroll: false });
    }
  };

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return usersList.filter((u) => {
      // Role filter
      if (activeTab !== "all") {
        if (activeTab === "staff") {
          if (!["staff", "organizer"].includes(u.role)) return false;
        } else if (u.role !== activeTab) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim() !== "") {
        const query = searchQuery.toLowerCase();
        const nameMatch = u.full_name?.toLowerCase().includes(query);
        const emailMatch = u.email?.toLowerCase().includes(query);
        const teamMatch = u.team_name?.toLowerCase().includes(query);
        if (!nameMatch && !emailMatch && !teamMatch) return false;
      }

      return true;
    });
  }, [usersList, activeTab, searchQuery]);

  // Filtered Teams List
  const filteredTeams = useMemo(() => {
    if (activeTab !== "teams") return [];
    if (!searchQuery.trim()) return teamsHierarchy;
    const q = searchQuery.toLowerCase();
    return teamsHierarchy.filter((t) => {
      const matchName = t.name.toLowerCase().includes(q);
      const matchCode = t.code.toLowerCase().includes(q);
      const matchTrack = t.track?.toLowerCase().includes(q);
      const matchLeader =
        t.leader?.full_name?.toLowerCase().includes(q) ||
        t.leader?.email.toLowerCase().includes(q) ||
        t.leader_name?.toLowerCase().includes(q);
      const matchMember = t.members.some(
        (m) =>
          m.full_name?.toLowerCase().includes(q) ||
          m.email.toLowerCase().includes(q)
      );
      return matchName || matchCode || matchTrack || matchLeader || matchMember;
    });
  }, [teamsHierarchy, activeTab, searchQuery]);

  // Role Update Handler
  const handleRoleChange = async (userId: string, newRole: AllowedUserRole) => {
    setNotification(null);
    startTransition(async () => {
      try {
        const res = await updateUserRole({ userId, newRole });
        setUsersList((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
        setNotification({ type: "success", message: res.message });
        router.refresh();
      } catch (err: unknown) {
        setNotification({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to update user role",
        });
      }
    });
  };

  // Create User Handler
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setNotification(null);

    try {
      await createUser(newUserData);
      setNotification({
        type: "success",
        message: `Account created for ${newUserData.email} with role ${newUserData.role}`,
      });
      setIsAddModalOpen(false);
      setNewUserData({
        fullName: "",
        email: "",
        password: "",
        role: "participant",
      });
      router.refresh();
    } catch (err: unknown) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Failed to create user account.",
      });
    } finally {
      setFormLoading(false);
    }
  };

  // Delete User Handler
  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    setNotification(null);
    const target = userToDelete;
    setUserToDelete(null);

    startTransition(async () => {
      try {
        await deleteUser(target.id);
        setUsersList((prev) => prev.filter((u) => u.id !== target.id));
        setNotification({
          type: "success",
          message: `User ${target.email || target.full_name} deleted successfully.`,
        });
        router.refresh();
      } catch (err: unknown) {
        setNotification({
          type: "error",
          message: err instanceof Error ? err.message : "Failed to delete user account.",
        });
      }
    });
  };

  return (
    <div className="space-y-6 animate-fade-in font-tech">
      {/* Top Banner with Add User Button */}
      <div className="border-b border-border-color pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2 h-2 rounded-full bg-accent-secondary animate-pulse" />
            <p className="font-tech text-xs uppercase tracking-[3px] text-accent-secondary font-bold m-0">
              Administration // Access Control
            </p>
          </div>
          <h1 className="text-3xl md:text-5xl font-heading text-text-primary tracking-wider uppercase m-0 flex items-center gap-3">
            <Users className="w-8 h-8 md:w-10 md:h-10 text-accent-secondary" />
            User Management
          </h1>
          <p className="font-tech text-text-secondary text-sm mt-2 max-w-2xl m-0">
            Directory of registered participants, team leaders, judges, and administrative staff. Provision new users or adjust permission tiers with full audit trail logging.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-accent-secondary to-accent-primary text-black font-tech font-bold uppercase tracking-wider text-xs transition-all hover:opacity-90 shadow-[0_0_20px_rgba(255,0,127,0.3)] cursor-pointer"
          >
            <UserPlus size={16} />
            <span>Add New User</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 border flex items-center justify-between text-xs transition-all animate-fade-in ${
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
            className="text-text-secondary hover:text-text-primary"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Role Tabs */}
        <div className="flex flex-wrap gap-1 bg-surface-color p-1 border border-border-color">
          {filterTabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  isActive
                    ? "bg-accent-secondary text-black shadow-sm"
                    : "text-text-secondary hover:text-text-primary hover:bg-surface-color-light"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3 top-3 text-text-secondary" />
          <input
            type="text"
            placeholder="Search by name, email or team..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-color border border-border-color py-2 pl-9 pr-3 text-xs text-text-primary placeholder:text-text-secondary outline-none focus:border-accent-secondary transition-colors font-sans tracking-normal"
          />
        </div>
      </div>

      {/* View Content: Either Teams Hierarchy or Users Data Table */}
      {activeTab === "teams" ? (
        <div className="space-y-4">
          {filteredTeams.length === 0 ? (
            <div className="glass-panel p-12 text-center border border-border-color">
              <Users className="w-10 h-10 text-text-secondary mx-auto mb-3 opacity-40" />
              <p className="text-text-secondary font-tech text-sm uppercase tracking-wider m-0">
                No teams found matching search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6">
              {filteredTeams.map((team) => {
                const expanded = isTeamExpanded(team.id);
                return (
                  <div
                    key={team.id}
                    className="glass-panel p-0 border border-border-color hover:border-accent-secondary/50 transition-all rounded bg-surface-color/40 overflow-hidden"
                  >
                    {/* Expandable Team Top Header */}
                    <div
                      onClick={() => toggleTeamExpand(team.id)}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer select-none bg-surface-color-light/30 hover:bg-surface-color-light/60 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="p-1 rounded hover:bg-surface-color text-text-secondary hover:text-text-primary transition-colors"
                          aria-label={expanded ? "Collapse team" : "Expand team"}
                        >
                          {expanded ? (
                            <ChevronDown size={18} className="text-accent-secondary" />
                          ) : (
                            <ChevronRight size={18} className="text-text-secondary" />
                          )}
                        </button>

                        <div className="w-9 h-9 rounded bg-accent-primary/10 border border-accent-primary/30 flex items-center justify-center font-heading text-accent-primary font-bold">
                          {team.name.charAt(0).toUpperCase()}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-heading text-base text-text-primary tracking-wide m-0">
                              {team.name}
                            </h3>
                            <span className="font-mono text-xs px-2 py-0.5 bg-surface-color border border-border-color text-accent-secondary uppercase font-bold">
                              #{team.code}
                            </span>
                          </div>
                          {team.track && (
                            <p className="font-tech text-xs text-text-secondary uppercase tracking-wider m-0 mt-0.5">
                              Track: <span className="text-accent-primary">{team.track}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {team.leader && (
                          <div className="hidden md:flex items-center gap-1.5 px-2 py-1 bg-accent-primary/10 border border-accent-primary/30 text-accent-primary text-xs font-tech">
                            <Crown size={12} />
                            <span>Leader: {team.leader.full_name || team.leader.email}</span>
                          </div>
                        )}
                        <span className="font-tech text-xs uppercase px-2.5 py-1 bg-surface-color-light border border-border-color text-text-secondary">
                          Roster: <strong className="text-text-primary">{team.totalMembersCount}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Expandable Body: Leader & Members Tree */}
                    {expanded && (
                      <div className="p-5 border-t border-border-color/60 space-y-4 animate-fade-in">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
                          {/* Team Leader Box */}
                          <div className="lg:col-span-5 bg-accent-primary/5 border border-accent-primary/30 rounded p-4 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-accent-primary text-black font-tech font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 flex items-center gap-1">
                              <Crown size={12} />
                              Team Leader
                            </div>

                            <p className="font-tech text-[10px] text-accent-primary uppercase tracking-widest font-bold mb-3 m-0">
                              Designated Leader
                            </p>

                            {team.leader ? (
                              <div className="flex items-start gap-3">
                                <div className="w-9 h-9 rounded bg-accent-primary/20 border border-accent-primary/40 flex items-center justify-center font-heading text-accent-primary font-bold text-sm shrink-0">
                                  {team.leader.full_name ? team.leader.full_name.charAt(0).toUpperCase() : "L"}
                                </div>
                                <div className="min-w-0">
                                  <h4 className="font-heading text-sm text-text-primary truncate m-0 font-bold">
                                    {team.leader.full_name || team.leader_name || "Team Leader"}
                                  </h4>
                                  <p className="text-xs text-text-secondary truncate m-0 flex items-center gap-1.5 mt-0.5">
                                    <Mail size={12} className="text-accent-primary/70 shrink-0" />
                                    <span className="truncate">{team.leader.email}</span>
                                  </p>
                                  <span className="inline-block mt-2 font-mono text-[10px] px-2 py-0.5 bg-accent-primary/20 text-accent-primary border border-accent-primary/30 uppercase">
                                    Primary Contact
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-text-secondary italic py-2">
                                {team.leader_name ? (
                                  <div>
                                    <p className="text-text-primary font-bold m-0">{team.leader_name}</p>
                                    <span className="text-[11px] text-text-secondary">(Leader profile not yet registered)</span>
                                  </div>
                                ) : (
                                  "No designated leader assigned"
                                )}
                              </div>
                            )}
                          </div>

                          {/* Team Members Box */}
                          <div className="lg:col-span-7 bg-surface-color/60 border border-border-color rounded p-4">
                            <div className="flex items-center justify-between mb-3">
                              <p className="font-tech text-[10px] text-text-secondary uppercase tracking-widest font-bold m-0 flex items-center gap-1.5">
                                <Users size={12} className="text-accent-secondary" />
                                Team Members ({team.members.length})
                              </p>
                            </div>

                            {team.members.length === 0 ? (
                              <div className="text-xs text-text-secondary italic py-2">
                                No additional team members enrolled yet.
                              </div>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                                {team.members.map((member) => (
                                  <div
                                    key={member.id}
                                    className="p-2.5 bg-surface-color-light/40 border border-border-color/80 rounded flex items-center gap-2.5 hover:border-accent-secondary/40 transition-colors"
                                  >
                                    <div className="w-7 h-7 rounded bg-surface-color border border-border-color flex items-center justify-center font-heading text-xs text-text-secondary shrink-0 uppercase">
                                      {member.full_name ? member.full_name.charAt(0) : "M"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="font-medium text-xs text-text-primary truncate m-0">
                                        {member.full_name || "Member"}
                                      </p>
                                      <p className="text-[11px] text-text-secondary truncate m-0">
                                        {member.email}
                                      </p>
                                    </div>
                                    <span className="text-[9px] font-mono px-1.5 py-0.5 bg-surface-color border border-border-color text-text-secondary uppercase shrink-0">
                                      Member
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Users Data Table */
        <div className="glass-panel p-0 overflow-hidden border border-border-color">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border-color bg-surface-color-light/50 text-[11px] text-accent-primary uppercase tracking-wider font-bold">
                <th className="p-4">User</th>
                <th className="p-4">Assigned Role</th>
                <th className="p-4">Team Association</th>
                <th className="p-4">Enrolled At</th>
                <th className="p-4 text-right">Actions & Role Elevation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-color/60 text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-text-secondary">
                    <p className="m-0 text-sm">No users found matching the filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleConfig = roleBadges[user.role] || roleBadges.participant;
                  const Icon = roleConfig.icon;
                  const isSelf = user.id === currentUserId;

                  return (
                    <tr
                      key={user.id}
                      className="hover:bg-white/[0.02] transition-colors duration-150"
                    >
                      {/* Name & Email */}
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded bg-surface-color-light border border-border-color flex items-center justify-center font-heading font-bold text-accent-primary uppercase">
                            {user.full_name ? user.full_name.charAt(0) : "U"}
                          </div>
                          <div>
                            <div className="font-bold text-text-primary flex items-center gap-2">
                              <span>{user.full_name || "Unnamed User"}</span>
                              {isSelf && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/40 font-mono">
                                  YOU
                                </span>
                              )}
                            </div>
                            <div className="text-text-secondary text-[11px] font-mono mt-0.5">
                              {user.email || "No email available"}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Current Role Badge */}
                      <td className="p-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider border ${roleConfig.badgeClass}`}
                        >
                          <Icon size={12} />
                          <span>{roleConfig.label}</span>
                        </span>
                      </td>

                      {/* Team Association */}
                      <td className="p-4 text-text-secondary">
                        {user.team_name ? (
                          <div>
                            <span className="text-text-primary font-semibold">
                              {user.team_name}
                            </span>
                            {user.team_role && (
                              <span className="text-[10px] text-accent-primary block uppercase">
                                ({user.team_role})
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="opacity-60 italic text-[11px]">Unassigned</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="p-4 text-text-secondary text-[11px]">
                        {new Date(user.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>

                      {/* Actions: Role Selector Dropdown & Delete Button */}
                      <td className="p-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Role Select Dropdown */}
                          <select
                            disabled={isPending || isSelf}
                            value={user.role}
                            onChange={(e) =>
                              handleRoleChange(user.id, e.target.value as AllowedUserRole)
                            }
                            className="bg-surface-color border border-border-color hover:border-accent-primary py-1 px-2 text-[11px] font-tech text-text-primary uppercase tracking-wider outline-none focus:border-accent-secondary disabled:opacity-40 cursor-pointer"
                            title={isSelf ? "You cannot modify your own role" : "Elevate or alter role"}
                          >
                            <option value="participant">Participant</option>
                            <option value="leader">Team Leader</option>
                            <option value="judge">Judge</option>
                            <option value="staff">Staff</option>
                            <option value="organizer">Organizer</option>
                            <option value="admin">Admin</option>
                          </select>

                          {/* Delete Button */}
                          <button
                            disabled={isPending || isSelf}
                            onClick={() => setUserToDelete(user)}
                            className="p-1.5 bg-status-error/10 border border-status-error/30 text-status-error hover:bg-status-error hover:text-white transition-colors disabled:opacity-30 cursor-pointer"
                            title={isSelf ? "Cannot delete your own account" : "Delete user"}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      )}

      {/* ADD USER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-md w-full p-6 border border-accent-secondary/60 shadow-2xl relative space-y-5">
            <div className="flex items-center justify-between border-b border-border-color pb-3">
              <div className="flex items-center gap-2">
                <UserPlus size={18} className="text-accent-secondary" />
                <h3 className="font-heading text-lg text-text-primary uppercase tracking-wider m-0">
                  Provision New Account
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-text-secondary hover:text-text-primary"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-xs uppercase text-text-secondary font-bold">
                  Full Name
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-2.5 text-text-secondary" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Mercer"
                    value={newUserData.fullName}
                    onChange={(e) =>
                      setNewUserData((p) => ({ ...p, fullName: e.target.value }))
                    }
                    className="w-full bg-surface-color border border-border-color py-2 pl-9 pr-3 text-xs text-text-primary focus:border-accent-secondary outline-none font-sans tracking-normal"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs uppercase text-text-secondary font-bold">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-2.5 text-text-secondary" />
                  <input
                    type="email"
                    required
                    placeholder="e.g. alex@ivcpulse.com"
                    value={newUserData.email}
                    onChange={(e) =>
                      setNewUserData((p) => ({ ...p, email: e.target.value }))
                    }
                    className="w-full bg-surface-color border border-border-color py-2 pl-9 pr-3 text-xs text-text-primary focus:border-accent-secondary outline-none font-sans tracking-normal"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs uppercase text-text-secondary font-bold">
                  Temporary Password
                </label>
                <div className="relative">
                  <Lock size={15} className="absolute left-3 top-2.5 text-text-secondary" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    placeholder="Min 6 characters..."
                    value={newUserData.password}
                    onChange={(e) =>
                      setNewUserData((p) => ({ ...p, password: e.target.value }))
                    }
                    className="w-full bg-surface-color border border-border-color py-2 pl-9 pr-3 text-xs text-text-primary focus:border-accent-secondary outline-none font-sans tracking-normal"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs uppercase text-text-secondary font-bold">
                  Initial Role Assignment
                </label>
                <select
                  value={newUserData.role}
                  onChange={(e) =>
                    setNewUserData((p) => ({
                      ...p,
                      role: e.target.value as AllowedUserRole,
                    }))
                  }
                  className="w-full bg-surface-color border border-border-color py-2 px-3 text-xs text-text-primary focus:border-accent-secondary outline-none uppercase font-bold"
                >
                  <option value="participant">Participant</option>
                  <option value="leader">Team Leader</option>
                  <option value="judge">Judge</option>
                  <option value="staff">Staff</option>
                  <option value="organizer">Organizer</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-border-color text-text-secondary hover:text-text-primary text-xs uppercase font-bold tracking-wider cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-gradient-to-r from-accent-secondary to-accent-primary text-black font-bold uppercase tracking-wider text-xs hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {formLoading && <RefreshCw size={14} className="animate-spin" />}
                  <span>{formLoading ? "Creating..." : "Provision User"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {userToDelete && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="glass-panel max-w-sm w-full p-6 border border-status-error/60 shadow-2xl relative space-y-4">
            <div className="flex items-center gap-3 text-status-error">
              <div className="p-2 rounded bg-status-error/15 border border-status-error/40">
                <Trash2 size={20} />
              </div>
              <h3 className="font-heading text-lg uppercase tracking-wider m-0">
                Confirm Deletion
              </h3>
            </div>

            <p className="text-xs text-text-secondary leading-relaxed m-0">
              Are you sure you want to permanently delete{" "}
              <strong className="text-text-primary">
                {userToDelete.email || userToDelete.full_name}
              </strong>
              ? This removes their authentication credentials and all profile records.
            </p>

            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 border border-border-color text-text-secondary hover:text-text-primary text-xs uppercase font-bold tracking-wider cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-status-error text-white font-bold uppercase tracking-wider text-xs hover:bg-status-error/90 transition-all cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
