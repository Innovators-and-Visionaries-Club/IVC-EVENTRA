"use client";

import React from "react";
import Link from "next/link";
import { LucideIcon, ArrowUpRight } from "lucide-react";

interface StatCardProps {
  label: string;
  count: number;
  role: string;
  icon: LucideIcon;
  colorScheme: "pink" | "yellow" | "cyan" | "green" | "purple";
  description?: string;
}

const colorStyles = {
  pink: {
    border: "border-accent-secondary/30 hover:border-accent-secondary",
    glow: "hover:shadow-[0_0_25px_rgba(255,0,127,0.25)]",
    bgBadge: "bg-accent-secondary/10 text-accent-secondary border-accent-secondary/30",
    textCount: "text-accent-secondary",
    accentGlow: "rgba(255, 0, 127, 0.15)",
  },
  yellow: {
    border: "border-accent-primary/30 hover:border-accent-primary",
    glow: "hover:shadow-[0_0_25px_rgba(251,200,21,0.25)]",
    bgBadge: "bg-accent-primary/10 text-accent-primary border-accent-primary/30",
    textCount: "text-accent-primary",
    accentGlow: "rgba(251, 200, 21, 0.15)",
  },
  cyan: {
    border: "border-accent-tertiary/30 hover:border-accent-tertiary",
    glow: "hover:shadow-[0_0_25px_rgba(0,240,255,0.25)]",
    bgBadge: "bg-accent-tertiary/10 text-accent-tertiary border-accent-tertiary/30",
    textCount: "text-accent-tertiary",
    accentGlow: "rgba(0, 240, 255, 0.15)",
  },
  green: {
    border: "border-status-success/30 hover:border-status-success",
    glow: "hover:shadow-[0_0_25px_rgba(16,185,129,0.25)]",
    bgBadge: "bg-status-success/10 text-status-success border-status-success/30",
    textCount: "text-status-success",
    accentGlow: "rgba(16, 185, 129, 0.15)",
  },
  purple: {
    border: "border-purple-500/30 hover:border-purple-500",
    glow: "hover:shadow-[0_0_25px_rgba(168,85,247,0.25)]",
    bgBadge: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    textCount: "text-purple-400",
    accentGlow: "rgba(168, 85, 247, 0.15)",
  },
};

export default function StatCard({
  label,
  count,
  role,
  icon: Icon,
  colorScheme,
  description,
}: StatCardProps) {
  const styles = colorStyles[colorScheme] || colorStyles.pink;
  const href = role ? `/admin/users?role=${encodeURIComponent(role)}` : "/admin/users";

  return (
    <Link
      href={href}
      className={`group relative glass-panel p-6 border ${styles.border} ${styles.glow} transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between overflow-hidden cursor-pointer`}
      style={{
        background: `radial-gradient(circle at top right, ${styles.accentGlow}, transparent 70%)`,
      }}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between gap-4">
        <span className="font-tech text-xs uppercase tracking-[1.5px] text-text-secondary font-bold">
          {label}
        </span>
        <div
          className={`w-11 h-11 rounded-lg border flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${styles.bgBadge}`}
        >
          <Icon size={20} />
        </div>
      </div>

      {/* Main Stat Counter */}
      <div className="my-4">
        <div className="flex items-baseline gap-2">
          <span className={`font-heading text-4xl md:text-5xl font-bold tracking-tight ${styles.textCount}`}>
            {count.toLocaleString()}
          </span>
          <span className="font-tech text-xs uppercase tracking-wider text-text-secondary">
            Enrolled
          </span>
        </div>
        {description && (
          <p className="font-tech text-[11px] text-text-secondary mt-1.5 line-clamp-1">
            {description}
          </p>
        )}
      </div>

      {/* Card Footer with Quick Navigation Hint */}
      <div className="pt-3 border-t border-border-color/60 flex items-center justify-between text-xs font-tech">
        <span className="text-text-secondary group-hover:text-text-primary transition-colors uppercase font-bold tracking-wider text-[11px]">
          Manage {label}
        </span>
        <span className="inline-flex items-center gap-1 text-accent-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform duration-200">
          <span className="text-[10px] uppercase font-bold">Inspect</span>
          <ArrowUpRight size={14} />
        </span>
      </div>
    </Link>
  );
}
