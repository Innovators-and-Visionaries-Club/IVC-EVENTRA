"use client";

import { useState } from "react";
import {
  FileText,
  Github,
  Presentation,
  Laptop,
  FolderPlus,
  Lock,
  CheckCircle2,
  AlertCircle,
  Upload,
} from "lucide-react";
import { upsertTeamSubmission } from "@/app/actions/team-submission";

export default function TeamSubmissionClientView({
  teamId,
  activeRound,
  currentSubmission,
  isLocked,
  isLeader,
}: {
  teamId: string;
  activeRound: any;
  currentSubmission: any;
  isLocked: boolean;
  isLeader: boolean;
}) {
  const [pptUrl, setPptUrl] = useState(currentSubmission?.ppt_url || "");
  const [githubUrl, setGithubUrl] = useState(currentSubmission?.github_url || "");
  const [pitchDeckUrl, setPitchDeckUrl] = useState(currentSubmission?.pitch_deck_url || "");
  const [prototypeUrl, setPrototypeUrl] = useState(currentSubmission?.prototype_url || "");
  const [additionalUrl, setAdditionalUrl] = useState(currentSubmission?.additional_material_url || "");

  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRound?.id) {
      setErrorMsg("No active round available for submission.");
      return;
    }

    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await upsertTeamSubmission({
        team_id: teamId,
        round_id: activeRound.id,
        ppt_url: pptUrl,
        github_url: githubUrl,
        pitch_deck_url: pitchDeckUrl,
        prototype_url: prototypeUrl,
        additional_material_url: additionalUrl,
      });

      setSuccessMsg("Team deliverables successfully updated and submitted for evaluation!");
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to submit deliverables");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Round & Lock Status Header */}
      <div className="glass-panel p-4 border border-border-color flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-tech text-xs uppercase tracking-wider text-text-secondary font-bold">
            Target Round
          </span>
          <p className="font-heading text-lg text-accent-secondary uppercase m-0 mt-0.5">
            {activeRound?.title || "Evaluation Stage"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isLocked ? (
            <span className="px-3 py-1 bg-status-error/15 border border-status-error text-status-error font-tech text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Lock size={14} /> SUBMISSIONS LOCKED
            </span>
          ) : (
            <span className="px-3 py-1 bg-status-success/15 border border-status-success text-status-success font-tech text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={14} /> OPEN FOR SUBMISSION
            </span>
          )}
        </div>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 bg-status-success/15 border border-status-success text-status-success font-tech text-xs flex items-center gap-2">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-status-error/15 border border-status-error text-status-error font-tech text-xs flex items-center gap-2">
          <AlertCircle size={18} />
          <span>{errorMsg}</span>
        </div>
      )}

      {!isLeader && (
        <div className="p-4 bg-status-warning/15 border border-status-warning text-status-warning font-tech text-xs flex items-center gap-2">
          <AlertCircle size={18} />
          <span>You are viewing in read-only mode. Only the designated Team Leader can submit or modify deliverables.</span>
        </div>
      )}

      {/* Submission Form */}
      <form onSubmit={handleSubmit} className="glass-panel p-6 border border-border-color space-y-6 font-tech">
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
            onChange={(e) => setPptUrl(e.target.value)}
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
            onChange={(e) => setGithubUrl(e.target.value)}
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
            onChange={(e) => setPitchDeckUrl(e.target.value)}
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
            onChange={(e) => setPrototypeUrl(e.target.value)}
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
            onChange={(e) => setAdditionalUrl(e.target.value)}
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
    </div>
  );
}
