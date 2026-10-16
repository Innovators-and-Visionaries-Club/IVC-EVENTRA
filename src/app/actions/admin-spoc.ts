"use server";

import { requireAdmin } from "@/lib/auth/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export interface SpocItem {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  department: string | null;
  notes: string | null;
  created_at: string;
  assigned_team_ids: string[];
}

export interface SpocTeamOption {
  id: string;
  name: string;
  code?: string | null;
  track?: string | null;
  assigned_spoc_id?: string | null;
  assigned_spoc_name?: string | null;
}

export interface SpocPortalData {
  spocs: SpocItem[];
  teams: SpocTeamOption[];
}

// 1. Fetch SPOCs and Teams data
export async function getSpocPortalData(): Promise<SpocPortalData> {
  try {
    await requireAdmin();
  } catch (err) {
    console.warn("getSpocPortalData auth notice:", err);
    return { spocs: [], teams: [] };
  }

  const fetchData = async (): Promise<SpocPortalData> => {
    const [spocsRes, teamsRes, assignmentsRes] = await Promise.all([
      supabaseAdmin
        .from("spocs")
        .select("*")
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("teams")
        .select("id, name, code, track")
        .order("name", { ascending: true }),
      supabaseAdmin
        .from("team_spoc_assignments")
        .select("spoc_id, team_id"),
    ]);

    const spocsList = spocsRes.data || [];
    const teamsList = teamsRes.data || [];
    const assignments = assignmentsRes.data || [];

    // Map spoc_id -> team_id[]
    const spocToTeams = new Map<string, string[]>();
    // Map team_id -> spoc_id
    const teamToSpoc = new Map<string, string>();

    for (const a of assignments) {
      if (!spocToTeams.has(a.spoc_id)) spocToTeams.set(a.spoc_id, []);
      spocToTeams.get(a.spoc_id)!.push(a.team_id);
      teamToSpoc.set(a.team_id, a.spoc_id);
    }

    const spocNameMap = new Map<string, string>();
    spocsList.forEach((s) => {
      spocNameMap.set(s.id, s.name);
    });

    const spocs: SpocItem[] = spocsList.map((s) => ({
      id: s.id,
      name: s.name,
      email: s.email,
      phone: s.phone,
      department: s.department,
      notes: s.notes,
      created_at: s.created_at,
      assigned_team_ids: spocToTeams.get(s.id) || [],
    }));

    const teams: SpocTeamOption[] = teamsList.map((t) => {
      const assignedSpocId = teamToSpoc.get(t.id) || null;
      return {
        id: t.id,
        name: t.name,
        code: t.code,
        track: t.track,
        assigned_spoc_id: assignedSpocId,
        assigned_spoc_name: assignedSpocId ? spocNameMap.get(assignedSpocId) || "SPOC" : null,
      };
    });

    return { spocs, teams };
  };

  const timeoutPromise = new Promise<SpocPortalData>((resolve) =>
    setTimeout(() => resolve({ spocs: [], teams: [] }), 3000)
  );

  return Promise.race([fetchData(), timeoutPromise]);
}

// 2. Create SPOC
export async function createSpoc(data: {
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  notes?: string;
}) {
  const { user } = await requireAdmin();

  if (!data.name || data.name.trim() === "") {
    throw new Error("SPOC name is required.");
  }

  const { data: newSpoc, error } = await supabaseAdmin
    .from("spocs")
    .insert([
      {
        name: data.name.trim(),
        email: data.email?.trim() || null,
        phone: data.phone?.trim() || null,
        department: data.department?.trim() || null,
        notes: data.notes?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create SPOC: ${error.message}`);
  }

  // Audit log
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "CREATE_SPOC",
      entity_type: "spoc",
      entity_id: newSpoc.id,
      admin_id: user.id,
      details: { name: newSpoc.name, email: newSpoc.email, department: newSpoc.department },
      created_at: new Date().toISOString(),
    },
  ]);

  revalidatePath("/admin/spoc");
  return newSpoc;
}

// 3. Update SPOC Details
export async function updateSpoc(data: {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  department?: string;
  notes?: string;
}) {
  const { user } = await requireAdmin();

  const { data: updatedSpoc, error } = await supabaseAdmin
    .from("spocs")
    .update({
      name: data.name.trim(),
      email: data.email?.trim() || null,
      phone: data.phone?.trim() || null,
      department: data.department?.trim() || null,
      notes: data.notes?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update SPOC: ${error.message}`);
  }

  // Audit log
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "UPDATE_SPOC",
      entity_type: "spoc",
      entity_id: data.id,
      admin_id: user.id,
      details: data,
      created_at: new Date().toISOString(),
    },
  ]);

  revalidatePath("/admin/spoc");
  return updatedSpoc;
}

// 4. Delete SPOC
export async function deleteSpoc(spocId: string) {
  const { user } = await requireAdmin();

  // 1. Fetch info for audit log
  const { data: spoc } = await supabaseAdmin
    .from("spocs")
    .select("name, email")
    .eq("id", spocId)
    .maybeSingle();

  // 2. Delete SPOC (team_spoc_assignments cascade delete)
  const { error } = await supabaseAdmin
    .from("spocs")
    .delete()
    .eq("id", spocId);

  if (error) {
    throw new Error(`Failed to delete SPOC: ${error.message}`);
  }

  // Audit log
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "DELETE_SPOC",
      entity_type: "spoc",
      entity_id: spocId,
      admin_id: user.id,
      details: { name: spoc?.name, email: spoc?.email },
      created_at: new Date().toISOString(),
    },
  ]);

  revalidatePath("/admin/spoc");
  return { success: true };
}

// 5. Update SPOC Team Allotments
export async function updateSpocTeams(data: {
  spocId: string;
  teamIds: string[];
}) {
  const { user } = await requireAdmin();

  // 1. Delete all existing allotments for this SPOC
  const { error: deleteError } = await supabaseAdmin
    .from("team_spoc_assignments")
    .delete()
    .eq("spoc_id", data.spocId);

  if (deleteError) {
    throw new Error(`Failed to reset existing SPOC allotments: ${deleteError.message}`);
  }

  // 2. If assigning new teams, delete any prior allotments for these specific teams (exclusive allotment)
  if (data.teamIds.length > 0) {
    await supabaseAdmin
      .from("team_spoc_assignments")
      .delete()
      .in("team_id", data.teamIds);

    const rows = data.teamIds.map((tId) => ({
      spoc_id: data.spocId,
      team_id: tId,
      allotted_at: new Date().toISOString(),
    }));

    const { error: insertError } = await supabaseAdmin
      .from("team_spoc_assignments")
      .insert(rows);

    if (insertError) {
      throw new Error(`Failed to save SPOC team allotments: ${insertError.message}`);
    }
  }

  // Audit log
  await supabaseAdmin.from("audit_logs").insert([
    {
      action: "UPDATE_SPOC_ASSIGNMENTS",
      entity_type: "team_spoc_assignments",
      entity_id: data.spocId,
      admin_id: user.id,
      details: {
        spoc_id: data.spocId,
        allotted_team_ids: data.teamIds,
        count: data.teamIds.length,
      },
      created_at: new Date().toISOString(),
    },
  ]);

  revalidatePath("/admin/spoc");
  return { success: true };
}
