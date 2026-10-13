"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export type AllowedUserRole = "admin" | "judge" | "staff" | "organizer" | "participant" | "leader";

export interface UserProfileItem {
  id: string;
  email: string | null;
  full_name: string | null;
  role: AllowedUserRole;
  created_at: string;
  team_name?: string | null;
  team_role?: string | null;
}

export async function getUsersList(params?: {
  role?: string;
  search?: string;
}): Promise<UserProfileItem[]> {
  await requireAdmin();

  let query = supabaseAdmin
    .from("profiles")
    .select(`
      id,
      email,
      full_name,
      role,
      created_at
    `)
    .order("created_at", { ascending: false });

  if (params?.role && params.role !== "all") {
    if (params.role === "staff") {
      query = query.in("role", ["staff", "organizer"]);
    } else {
      query = query.eq("role", params.role);
    }
  }

  if (params?.search && params.search.trim() !== "") {
    const s = `%${params.search.trim()}%`;
    query = query.or(`full_name.ilike.${s},email.ilike.${s}`);
  }

  const { data: profiles, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`);
  }

  if (!profiles || profiles.length === 0) {
    return [];
  }

  // Fetch team memberships for team name display
  const userIds = profiles.map((p) => p.id);
  const { data: teamMembers } = await supabaseAdmin
    .from("team_members")
    .select(`
      user_id,
      role,
      teams (
        name,
        code
      )
    `)
    .in("user_id", userIds);

  const teamMap = new Map<string, { team_name: string; team_role: string }>();
  if (teamMembers) {
    (
      teamMembers as unknown as Array<{
        user_id: string;
        role?: string | null;
        teams?:
          | { name?: string | null; code?: string | null }
          | Array<{ name?: string | null; code?: string | null }>
          | null;
      }>
    ).forEach((tm) => {
      const teamObj = Array.isArray(tm.teams) ? tm.teams[0] : tm.teams;
      teamMap.set(tm.user_id, {
        team_name: teamObj?.name || teamObj?.code || "",
        team_role: tm.role || "",
      });
    });
  }

  return profiles.map((p) => {
    const tm = teamMap.get(p.id);
    return {
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      role: p.role as AllowedUserRole,
      created_at: p.created_at,
      team_name: tm?.team_name || null,
      team_role: tm?.team_role || null,
    };
  });
}

export async function updateUserRole(data: {
  userId: string;
  newRole: AllowedUserRole;
}) {
  const { user } = await requireAdmin();

  if (user.id === data.userId && data.newRole !== "admin") {
    throw new Error("Security Alert: You cannot demote your own active admin account.");
  }

  // 1. Fetch current profile to capture previous role for audit logs
  const { data: currentProfile, error: fetchErr } = await supabaseAdmin
    .from("profiles")
    .select("role, email, full_name")
    .eq("id", data.userId)
    .single();

  if (fetchErr || !currentProfile) {
    throw new Error("User profile not found.");
  }

  const previousRole = currentProfile.role;

  // 2. Update role in public.profiles table
  const { error: updateErr } = await supabaseAdmin
    .from("profiles")
    .update({ role: data.newRole })
    .eq("id", data.userId);

  if (updateErr) {
    throw new Error(`Failed to update role in profiles: ${updateErr.message}`);
  }

  // 3. Keep auth.users metadata in sync
  try {
    await supabaseAdmin.auth.admin.updateUserById(data.userId, {
      user_metadata: {
        role: data.newRole,
      },
    });
  } catch (err) {
    console.warn("Could not update auth metadata:", err);
  }

  // 4. Record entry in audit_logs
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "UPDATE_USER_ROLE",
      entity_type: "profile",
      entity_id: data.userId,
      admin_id: user.id,
      details: {
        target_email: currentProfile.email,
        target_name: currentProfile.full_name,
        previous_role: previousRole,
        new_role: data.newRole,
      },
    },
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/users");

  return { success: true, message: `Role updated to ${data.newRole}` };
}

export async function createUser(data: {
  email: string;
  password: string;
  fullName: string;
  role: AllowedUserRole;
}) {
  const { user } = await requireAdmin();

  if (!data.email || !data.password || !data.fullName) {
    throw new Error("Missing required user fields (email, password, full name).");
  }

  if (data.password.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  // 1. Create account via Supabase Admin API
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email: data.email,
    password: data.password,
    email_confirm: true,
    user_metadata: {
      full_name: data.fullName,
      role: data.role,
    },
  });

  if (createError || !newUser?.user) {
    throw new Error(`Failed to create user: ${createError?.message || "Unknown error"}`);
  }

  const newUserId = newUser.user.id;

  // 2. Ensure role in profiles is assigned the intended role
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: newUserId,
      email: data.email,
      full_name: data.fullName,
      role: data.role,
    });

  if (profileError) {
    throw new Error(`User created in auth, but failed to update profile: ${profileError.message}`);
  }

  // 3. Record in audit_logs
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "CREATE_USER",
      entity_type: "user",
      entity_id: newUserId,
      admin_id: user.id,
      details: {
        email: data.email,
        full_name: data.fullName,
        assigned_role: data.role,
      },
    },
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/users");

  return { success: true, user: newUser.user };
}

export async function deleteUser(userId: string) {
  const { user } = await requireAdmin();

  if (user.id === userId) {
    throw new Error("Security Alert: You cannot delete your own admin account.");
  }

  // 1. Fetch user info for audit logging
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email, full_name, role")
    .eq("id", userId)
    .single();

  // 2. Delete user from auth.users (cascades to public.profiles)
  const { error: deleteAuthError } = await supabaseAdmin.auth.admin.deleteUser(userId);

  if (deleteAuthError) {
    // If not found in auth.users, remove from public.profiles directly
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
  } else {
    // Explicit cleanup guarantee
    await supabaseAdmin.from("profiles").delete().eq("id", userId);
  }

  // 3. Record in audit_logs
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "DELETE_USER",
      entity_type: "user",
      entity_id: userId,
      admin_id: user.id,
      details: {
        deleted_email: profile?.email || null,
        deleted_name: profile?.full_name || null,
        deleted_role: profile?.role || null,
      },
    },
  ]);

  revalidatePath("/admin");
  revalidatePath("/admin/users");

  return { success: true };
}
