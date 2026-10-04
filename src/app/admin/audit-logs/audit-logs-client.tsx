"use client";

import { useState } from "react";
import { Search, ShieldAlert, Clock } from "lucide-react";

export default function AuditLogsClientView({ initialLogs }: { initialLogs: any[] }) {
  const [logs] = useState(initialLogs);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    const action = log.action?.toLowerCase() || "";
    const admin = log.admin_id?.toLowerCase() || "";
    const entity = log.entity_id?.toLowerCase() || "";
    const reason = typeof log.details === "object" ? JSON.stringify(log.details).toLowerCase() : "";
    return action.includes(q) || admin.includes(q) || entity.includes(q) || reason.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="glass-panel p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-text-secondary text-xs font-tech">
          <ShieldAlert size={16} className="text-accent-secondary" />
          <span className="uppercase font-bold">Total Logs Captured: {logs.length}</span>
        </div>

        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-2.5 text-text-secondary" />
          <input
            type="text"
            placeholder="Search action, admin, or target ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-surface-color border border-border-color text-text-primary text-xs font-tech pl-9 pr-3 py-1.5 focus:border-accent-secondary outline-none"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="glass-panel overflow-x-auto">
        <table className="w-full text-left border-collapse font-tech text-xs">
          <thead>
            <tr className="border-b border-border-color bg-surface-color-light/40 text-text-secondary uppercase tracking-wider">
              <th className="p-3">Timestamp</th>
              <th className="p-3">Action</th>
              <th className="p-3">Admin ID</th>
              <th className="p-3">Target / Entity</th>
              <th className="p-3">Reason / Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-color/30">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-text-secondary italic">
                  No audit log entries recorded matching current criteria.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const details = typeof log.details === "object" ? log.details : null;
                const reason = details?.reason || details?.action || "-";

                return (
                  <tr key={log.id} className="hover:bg-surface-color-light/20 transition-colors">
                    <td className="p-3 text-text-secondary whitespace-nowrap flex items-center gap-1.5">
                      <Clock size={13} className="text-accent-secondary" />
                      {new Date(log.created_at || Date.now()).toLocaleString()}
                    </td>
                    <td className="p-3 font-bold text-accent-tertiary">
                      {log.action}
                    </td>
                    <td className="p-3 font-mono text-text-primary">
                      {log.admin_id ? log.admin_id.slice(0, 8) + "..." : "System"}
                    </td>
                    <td className="p-3 font-mono text-text-secondary">
                      {log.entity_id ? log.entity_id.slice(0, 8) + "..." : log.entity_type || "-"}
                    </td>
                    <td className="p-3 text-text-secondary max-w-xs truncate" title={JSON.stringify(details || {})}>
                      {reason}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
