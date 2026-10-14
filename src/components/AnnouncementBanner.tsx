"use client";

import { useState } from "react";
import {
  Bell,
  AlertTriangle,
  Info,
  Flame,
  ChevronDown,
  ChevronUp,
  Radio,
} from "lucide-react";
import type { AnnouncementItem } from "@/app/actions/announcements";

interface AnnouncementBannerProps {
  announcements: AnnouncementItem[];
  portalName?: string;
}

export default function AnnouncementBanner({
  announcements = [],
  portalName = "Event Broadcast",
}: AnnouncementBannerProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!announcements || announcements.length === 0) {
    return null;
  }

  const latest = announcements[0];
  const urgentCount = announcements.filter((a) => a.priority === "urgent").length;

  return (
    <div className="space-y-2 font-tech">
      {/* Primary Highlight Banner */}
      <div
        className={`p-3.5 border transition-all rounded ${
          latest.priority === "urgent"
            ? "bg-status-error/15 border-status-error text-status-error"
            : latest.priority === "important"
            ? "bg-accent-secondary/15 border-accent-secondary text-text-primary"
            : "bg-surface-color-light/60 border-border-color text-text-primary"
        } flex flex-col sm:flex-row sm:items-center justify-between gap-3`}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div
            className={`p-1.5 rounded shrink-0 ${
              latest.priority === "urgent"
                ? "bg-status-error/20 text-status-error"
                : "bg-accent-secondary/20 text-accent-secondary"
            }`}
          >
            {latest.priority === "urgent" ? (
              <Flame size={16} className="animate-pulse" />
            ) : latest.priority === "important" ? (
              <AlertTriangle size={16} />
            ) : (
              <Radio size={16} className="text-accent-tertiary" />
            )}
          </div>

          <div className="truncate">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.2 border bg-surface-color font-mono">
                {latest.priority.toUpperCase()} BROADCAST
              </span>
              <p className="font-heading text-xs uppercase m-0 tracking-wide text-text-primary truncate">
                {latest.title}
              </p>
            </div>
            <p className="text-[11px] text-text-secondary truncate m-0 mt-0.5">
              {latest.message}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          {announcements.length > 1 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="px-2.5 py-1 text-[11px] bg-surface-color border border-border-color hover:border-accent-secondary font-bold uppercase transition-colors flex items-center gap-1"
            >
              <span>{announcements.length} Alerts</span>
              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
          )}
        </div>
      </div>

      {/* Expanded Multi-Announcement Drawer */}
      {isExpanded && announcements.length > 1 && (
        <div className="glass-panel p-4 border border-border-color space-y-3 animate-fade-in bg-surface-color/90">
          <p className="text-[10px] uppercase tracking-wider text-text-secondary font-bold m-0 border-b border-border-color/60 pb-1.5">
            Event Broadcast History ({announcements.length})
          </p>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {announcements.map((item) => (
              <div
                key={item.id}
                className="p-3 bg-surface-color border border-border-color/80 rounded flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[9px] px-1.5 py-0.5 uppercase font-bold tracking-wider ${
                        item.priority === "urgent"
                          ? "bg-status-error/15 text-status-error border border-status-error/40"
                          : item.priority === "important"
                          ? "bg-accent-secondary/15 text-accent-secondary border border-accent-secondary/40"
                          : "bg-surface-color-light text-text-secondary border border-border-color"
                      }`}
                    >
                      {item.priority}
                    </span>
                    <p className="font-heading text-xs text-text-primary uppercase m-0">
                      {item.title}
                    </p>
                  </div>
                  <p className="text-xs text-text-secondary mt-1 m-0">
                    {item.message}
                  </p>
                </div>
                <span className="text-[10px] font-mono text-text-secondary shrink-0">
                  {new Date(item.created_at).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
