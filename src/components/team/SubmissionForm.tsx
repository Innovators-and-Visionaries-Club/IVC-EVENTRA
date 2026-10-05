"use client";

import React from "react";
import {
  FileText,
  Github,
  Presentation,
  Laptop,
  FolderPlus,
  Upload,
} from "lucide-react";

interface SubmissionFormProps {
  pptUrl: string;
  githubUrl: string;
  pitchDeckUrl: string;
  prototypeUrl: string;
  additionalUrl: string;
  isLocked: boolean;
  isLeader: boolean;
  loading: boolean;
  onPptChange: (v: string) => void;
  onGithubChange: (v: string) => void;
  onPitchDeckChange: (v: string) => void;
  onPrototypeChange: (v: string) => void;
  onAdditionalChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function SubmissionForm({
  pptUrl,
  githubUrl,
  pitchDeckUrl,
  prototypeUrl,
  additionalUrl,
  isLocked,
  isLeader,
  loading,
  onPptChange,
  onGithubChange,
  onPitchDeckChange,
  onPrototypeChange,
  onAdditionalChange,
  onSubmit,
}: SubmissionFormProps) {
  return (
    <form onSubmit={onSubmit} className="glass-panel p-6 border border-border-color space-y-6 font-tech">
      {/* Mandatory PPT */}
      <div className="space-y-2">
        <label className="block text-xs uppercase text-text-primary font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText size={16} className="text-accent-secondary" />
            Presentation Slides (PPT / Canva / Slides URL) *
          </span>
          <span className="text-[10px] text-accent-secondary uppercase font-bold">MANDATORY</span>
        </label>
        <input
          type="url"
          required
          disabled={isLocked || !isLeader}
          value={pptUrl}
          onChange={(e) => onPptChange(e.target.value)}
          placeholder="https://docs.google.com/presentation/d/... or OneDrive / Canva Link"
          className="w-full bg-surface-color border border-border-color p-3 text-text-primary text-sm focus:border-accent-secondary outline-none disabled:opacity-60"
        />
        <p className="text-[11px] text-text-secondary m-0">
          Ensure viewing permissions are public or set to "Anyone with the link can view".
        </p>
      </div>

      {/* GitHub URL */}
      <div className="space-y-2">
        <label className="block text-xs uppercase text-text-secondary font-bold flex items-center gap-2">
          <Github size={16} />
          GitHub Repository URL (Optional)
        </label>
        <input
          type="url"
          disabled={isLocked || !isLeader}
          value={githubUrl}
          onChange={(e) => onGithubChange(e.target.value)}
          placeholder="https://github.com/organization/repo"
          className="w-full bg-surface-color border border-border-color p-3 text-text-primary text-sm focus:border-accent-secondary outline-none disabled:opacity-60"
        />
      </div>

      {/* Pitch Deck URL */}
      <div className="space-y-2">
        <label className="block text-xs uppercase text-text-secondary font-bold flex items-center gap-2">
          <Presentation size={16} />
          Secondary Pitch Deck / Executive Summary URL (Optional)
        </label>
        <input
          type="url"
          disabled={isLocked || !isLeader}
          value={pitchDeckUrl}
          onChange={(e) => onPitchDeckChange(e.target.value)}
          placeholder="https://..."
          className="w-full bg-surface-color border border-border-color p-3 text-text-primary text-sm focus:border-accent-secondary outline-none disabled:opacity-60"
        />
      </div>

      {/* Live Prototype */}
      <div className="space-y-2">
        <label className="block text-xs uppercase text-text-secondary font-bold flex items-center gap-2">
          <Laptop size={16} />
          Live Deployment / Prototype URL (Optional)
        </label>
        <input
          type="url"
          disabled={isLocked || !isLeader}
          value={prototypeUrl}
          onChange={(e) => onPrototypeChange(e.target.value)}
          placeholder="https://my-app.vercel.app or Figma prototype"
          className="w-full bg-surface-color border border-border-color p-3 text-text-primary text-sm focus:border-accent-secondary outline-none disabled:opacity-60"
        />
      </div>

      {/* Additional Material */}
      <div className="space-y-2">
        <label className="block text-xs uppercase text-text-secondary font-bold flex items-center gap-2">
          <FolderPlus size={16} />
          Additional Material / Drive Folder URL (Optional)
        </label>
        <input
          type="url"
          disabled={isLocked || !isLeader}
          value={additionalUrl}
          onChange={(e) => onAdditionalChange(e.target.value)}
          placeholder="https://drive.google.com/drive/folders/..."
          className="w-full bg-surface-color border border-border-color p-3 text-text-primary text-sm focus:border-accent-secondary outline-none disabled:opacity-60"
        />
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-border-color flex justify-end">
        <button
          type="submit"
          disabled={loading || isLocked || !isLeader}
          className="flex items-center gap-2 px-6 py-3 bg-accent-secondary hover:bg-accent-secondary/80 text-white font-bold uppercase text-xs transition-colors disabled:opacity-50 shadow-lg shadow-accent-secondary/20"
        >
          <Upload size={16} />
          {loading ? "Submitting Deliverables..." : "Submit Deliverables"}
        </button>
      </div>
    </form>
  );
}
