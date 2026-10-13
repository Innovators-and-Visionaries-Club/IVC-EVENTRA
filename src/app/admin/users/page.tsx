import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUsersList } from "@/app/actions/admin-users";
import UsersClientView from "./users-client";
import { Users, Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialUsers: any[] = [];
  try {
    initialUsers = await getUsersList();
  } catch (err) {
    console.error("Failed to load initial users:", err);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
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
          <p className="font-tech text-text-secondary text-sm mt-2 max-w-2xl">
            Directory of registered participants, team leaders, judges, and administrative staff. Provision new users or adjust permission tiers with full audit trail logging.
          </p>
        </div>
      </div>

      {/* Main Client View with Suspense for URL search params */}
      <Suspense
        fallback={
          <div className="min-h-[400px] flex flex-col items-center justify-center border border-border-color bg-surface-color/50 rounded p-8">
            <Loader2 className="w-8 h-8 text-accent-primary animate-spin mb-3" />
            <p className="font-tech text-text-secondary text-sm uppercase tracking-wider">
              Loading user directory...
            </p>
          </div>
        }
      >
        <UsersClientView
          initialUsers={initialUsers}
          currentUserEmail={user?.email}
          currentUserId={user?.id}
        />
      </Suspense>
    </div>
  );
}
