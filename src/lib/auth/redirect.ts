import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

/**
 * Resolves the appropriate portal redirect URL based on user role and team membership.
 * Features instant metadata resolution, timeout protection against stalling queries,
 * and deterministic fallbacks so the authentication flow never hangs.
 */
export async function getRoleRedirectUrl(
  userOrId: User | string,
  fallbackMetadataRole?: string
): Promise<string> {
  let userId: string;
  let metadataRole: string | undefined = fallbackMetadataRole;

  if (typeof userOrId === "object" && userOrId !== null) {
    userId = userOrId.id;
    metadataRole =
      metadataRole ||
      (userOrId.user_metadata?.role as string | undefined) ||
      (userOrId.app_metadata?.role as string | undefined);
  } else {
    userId = userOrId;
  }

  // 1. Instant Fast-Path for Known Roles from Auth Metadata
  if (metadataRole === "admin") {
    return "/admin";
  }
  if (metadataRole === "judge") {
    return "/judge";
  }
  if (metadataRole === "staff" || metadataRole === "organizer") {
    return "/ops/scanner";
  }

  const supabase = createClient();

  // 2. Query public.profiles with a strict 1.5-second timeout safety net
  try {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", userId)
          .maybeSingle();
        if (error) return null;
        return (data as { role?: string } | null)?.role || null;
      } catch {
        return null;
      }
    };

    const timeoutPromise = new Promise<null>((resolve) =>
      setTimeout(() => resolve(null), 1500)
    );

    const fetchedRole = await Promise.race([fetchProfile(), timeoutPromise]);
    const effectiveRole = fetchedRole || metadataRole || "participant";

    switch (effectiveRole) {
      case "admin":
        return "/admin";
      case "judge":
        return "/judge";
      case "staff":
      case "organizer":
        return "/ops/scanner";
      case "leader":
      case "participant": {
        // Query team membership with a 1-second timeout
        try {
          const fetchMember = async () => {
            const { data } = await supabase
              .from("team_members")
              .select("team_id")
              .eq("user_id", userId)
              .limit(1)
              .maybeSingle();
            return !!data;
          };

          const memberTimeout = new Promise<boolean>((resolve) =>
            setTimeout(() => resolve(false), 1000)
          );

          const hasTeam = await Promise.race([fetchMember(), memberTimeout]);
          if (hasTeam) {
            return "/team/submission";
          }
        } catch {
          // Fallback to participants portal on any error or timeout
        }
        return "/participants";
      }
      default:
        return "/participants";
    }
  } catch (err) {
    console.warn("Profile role resolution error, utilizing safe fallback:", err);
    if (metadataRole === "admin") return "/admin";
    if (metadataRole === "judge") return "/judge";
    if (metadataRole === "staff" || metadataRole === "organizer") return "/ops/scanner";
    return "/participants";
  }
}
