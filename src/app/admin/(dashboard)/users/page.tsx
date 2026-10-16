import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getUsersList, getTeamsHierarchyData, UserProfileItem, TeamHierarchyItem } from "@/app/actions/admin-users";
import UsersClientView from "./users-client";
import { Loader2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let initialUsers: UserProfileItem[] = [];
  let initialTeamsHierarchy: TeamHierarchyItem[] = [];

  try {
    const [usersRes, teamsRes] = await Promise.all([
      getUsersList(),
      getTeamsHierarchyData(),
    ]);
    initialUsers = usersRes;
    initialTeamsHierarchy = teamsRes;
  } catch (err) {
    console.error("Failed to load initial users/teams:", err);
  }

  return (
    <div className="space-y-8 animate-fade-in">
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
          initialTeamsHierarchy={initialTeamsHierarchy}
          currentUserEmail={user?.email}
          currentUserId={user?.id}
        />
      </Suspense>
    </div>
  );
}
