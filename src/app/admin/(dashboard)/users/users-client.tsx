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
} from "lucide-react";
import {
  UserProfileItem,
  AllowedUserRole,
  updateUserRole,
  createUser,
  deleteUser,
} from "@/app/actions/admin-users";

interface UsersClientProps {
  initialUsers: UserProfileItem[];
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
  { id: "participant", label: "Participants" },
  { id: "leader", label: "Team Leaders" },
  { id: "judge", label: "Judges" },
  { id: "staff", label: "Staff & Club" },
  { id: "admin", label: "Admins" },
];

export default function UsersClientView({
  initialUsers,
  currentUserId,
}: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialRoleParam = searchParams.get("role") || "all";

  const [activeTab, setActiveTab] = useState<string>(initialRoleParam);
  const [searchQuery, setSearchQuery] = useState("");
  const [usersList, setUsersList] = useState<UserProfileItem[]>(initialUsers);
  const [isPending, startTransition] = useTransition();

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
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-border-color pb-6">
        <div>
          <p className="font-tech text-xs uppercase tracking-[3px] text-accent-secondary font-bold mb-1">
            Access Control // Identity Directory
          </p>
          <h1 className="text-3xl md:text-5xl font-heading text-text-primary tracking-wider uppercase m-0">
            User Management
          </h1>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Users Data Table */}
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
