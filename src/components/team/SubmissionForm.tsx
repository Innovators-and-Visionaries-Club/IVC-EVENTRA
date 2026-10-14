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
  pptFileName?: string;
  fileUploading?: boolean;
  onFileSelect?: (file: File) => void;
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
  pptFileName,
  fileUploading,
  onFileSelect,
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
      {/* Mandatory Presentation File Upload */}
      <div className="space-y-3">
        <label className="block text-xs uppercase text-text-primary font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <FileText size={16} className="text-accent-secondary" />
            Presentation File (PPT / PPTX / PDF / DOCX) *
          </span>
          <span className="text-[10px] text-accent-secondary uppercase font-bold">MANDATORY FILE</span>
        </label>

        <div className="border-2 border-dashed border-border-color hover:border-accent-secondary/60 transition-colors p-6 rounded bg-surface-color/40 flex flex-col items-center justify-center text-center">
          <Upload className="text-accent-secondary mb-3 opacity-80" size={32} />
          
          <input
            type="file"
            id="ppt-file-input"
            accept=".ppt,.pptx,.pdf,.doc,.docx,application/pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            disabled={isLocked || !isLeader || fileUploading}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file && onFileSelect) {
                onFileSelect(file);
              }
            }}
            className="hidden"
          />

          <label
            htmlFor="ppt-file-input"
            className={`px-4 py-2 bg-surface-color-light border border-border-color hover:border-accent-secondary text-text-primary text-xs uppercase font-bold cursor-pointer transition-all ${
              isLocked || !isLeader || fileUploading ? "opacity-50 pointer-events-none" : ""
            }`}
          >
            {fileUploading ? "Uploading File..." : "Select Presentation File"}
          </label>

          <p className="text-[11px] text-text-secondary mt-2 mb-0">
            Supported formats: <span className="text-text-primary font-mono font-bold">.PPT, .PPTX, .PDF, .DOC, .DOCX</span> (Max 50MB)
          </p>

          {/* Current file status */}
          {pptUrl ? (
            <div className="mt-4 p-3 bg-surface-color border border-accent-secondary/50 w-full flex items-center justify-between text-left">
              <div className="flex items-center gap-2 overflow-hidden">
                <FileText size={16} className="text-accent-secondary shrink-0" />
                <div className="truncate">
                  <p className="text-xs font-mono text-text-primary truncate m-0">
                    {pptFileName || pptUrl.split("/").pop() || "Presentation Deliverable"}
                  </p>
                  <span className="text-[10px] text-status-success font-bold uppercase tracking-wider">
                    File Attached & Ready
                  </span>
                </div>
              </div>
              <a
                href={pptUrl}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-accent-secondary hover:underline uppercase font-bold shrink-0 ml-3"
              >
                View
              </a>
            </div>
          ) : (
            <p className="text-[11px] text-status-error mt-2 font-mono">
              * No file selected yet. Please upload your presentation file before submitting.
            </p>
          )}
        </div>
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
          className="w-full bg-surface-color border border-border-color p-3 text-text-primary text-sm font-sans tracking-normal focus:border-accent-secondary outline-none disabled:opacity-60"
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
          className="w-full bg-surface-color border border-border-color p-3 text-text-primary text-sm font-sans tracking-normal focus:border-accent-secondary outline-none disabled:opacity-60"
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
          className="w-full bg-surface-color border border-border-color p-3 text-text-primary text-sm font-sans tracking-normal focus:border-accent-secondary outline-none disabled:opacity-60"
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
          className="w-full bg-surface-color border border-border-color p-3 text-text-primary text-sm font-sans tracking-normal focus:border-accent-secondary outline-none disabled:opacity-60"
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
