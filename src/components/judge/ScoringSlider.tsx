"use client";

import React from "react";

interface ScoringSliderProps {
  criterionId: string;
  criterionTitle: string;
  description?: string;
  maxMarks: number;
  value: number;
  disabled?: boolean;
  onChange: (criterionId: string, value: number, maxMarks: number) => void;
  index: number;
}

export default function ScoringSlider({
  criterionId,
  criterionTitle,
  description,
  maxMarks,
  value,
  disabled = false,
  onChange,
  index,
}: ScoringSliderProps) {
  return (
    <div className="p-4 bg-surface-color-light/30 border border-border-color space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <span className="font-tech text-[11px] text-accent-secondary font-bold mr-2 uppercase">
            Criterion #{index + 1}
          </span>
          <h3 className="font-heading text-base text-text-primary inline uppercase m-0">
            {criterionTitle}
          </h3>
        </div>

        <span className="font-tech text-xs text-accent-primary font-bold">
          Max Marks: {maxMarks} PTS
        </span>
      </div>

      {description && (
        <p className="font-tech text-xs text-text-secondary m-0">{description}</p>
      )}

      <div className="pt-2 flex items-center gap-4">
        <input
          type="range"
          min="0"
          max={maxMarks}
          value={value || 0}
          disabled={disabled}
          onChange={(e) => onChange(criterionId, Number(e.target.value), maxMarks)}
          className="flex-1 accent-accent-secondary cursor-pointer"
        />
        <input
          type="number"
          min="0"
          max={maxMarks}
          value={value ?? 0}
          disabled={disabled}
          onChange={(e) => onChange(criterionId, Number(e.target.value), maxMarks)}
          className="w-20 bg-surface-color border border-border-color text-text-primary font-heading text-sm text-center py-1.5 focus:border-accent-secondary outline-none"
        />
      </div>
    </div>
  );
}
