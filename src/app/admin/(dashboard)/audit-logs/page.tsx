import { supabaseAdmin } from "@/lib/supabase/admin";
import AuditLogsClientView, { AuditLogItem } from "./audit-logs-client";

export const dynamic = "force-dynamic";

export default async function AdminAuditLogsPage() {
  let logs: AuditLogItem[] = [];

  try {
    const fetchLogsData = async () => {
      const { data } = await supabaseAdmin
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      return (data || []) as AuditLogItem[];
    };

    const timeoutPromise = new Promise<AuditLogItem[]>((resolve) =>
      setTimeout(() => resolve([]), 2500)
    );

    logs = await Promise.race([fetchLogsData(), timeoutPromise]);
  } catch (err) {
    console.error("Failed to load audit logs:", err);
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="border-b border-border-color pb-6">
        <p className="font-tech text-xs uppercase tracking-[3px] text-accent-secondary font-bold mb-1">
          Administration // Security & Compliance
        </p>
        <h1 className="text-3xl md:text-5xl font-heading text-text-primary tracking-wider uppercase m-0">
          Audit Logs
        </h1>
        <p className="font-tech text-text-secondary text-sm mt-2 max-w-2xl">
          Complete chronological record of administrative actions, evaluations overrides, and result updates.
        </p>
      </div>

      <AuditLogsClientView initialLogs={logs} />
    </div>
  );
}
