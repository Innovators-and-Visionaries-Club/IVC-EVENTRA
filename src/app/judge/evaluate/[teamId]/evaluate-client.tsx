"use client";

import { useState } from "react";
import {
  FileText,
  Github,
  ExternalLink,
  Presentation,
  CheckCircle2,
  AlertCircle,
  Save,
  Send,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { saveOrSubmitEvaluation } from "@/app/actions/judge-evaluation";
import ScoringSlider from "@/components/judge/ScoringSlider";

export default function EvaluateClientView({
  teamId,
  team,
  submission,
  activeRound,
  criteria,
  existingEvaluation,
}: {
  teamId: string;
  team: any;
  submission: any;
  activeRound: any;
  criteria: any[];
  existingEvaluation: any;
}) {
  // Prepopulate existing scores or set empty
  const initialScores: Record<string, number> = {};
  if (existingEvaluation?.scores_breakdown && Array.isArray(existingEvaluation.scores_breakdown)) {
    for (const item of existingEvaluation.scores_breakdown) {
      if (item.criterion_id) {
        initialScores[item.criterion_id] = item.score;
      }
    }
  }

  const [scores, setScores] = useState<Record<string, number>>(initialScores);
  const [feedback, setFeedback] = useState<string>(existingEvaluation?.feedback || "");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isLocked = existingEvaluation?.status === "locked";

  const totalScore = criteria.reduce((sum, c) => sum + (scores[c.id] || 0), 0);
  const maxPossibleScore = criteria.reduce((sum, c) => sum + (c.max_marks || 0), 0);

  const handleScoreChange = (criterionId: string, val: number, max: number) => {
    const clamped = Math.max(0, Math.min(val, max));
    setScores((prev) => ({ ...prev, [criterionId]: clamped }));
  };

  const handleSave = async (isDraft: boolean) => {
    setLoading(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const scoreItems = criteria.map((c) => ({
        criterion_id: c.id,
        score: scores[c.id] || 0,
      }));

      if (!isDraft && scoreItems.length === 0) {
        throw new Error("Cannot submit evaluation without scoring criteria");
      }

      const result = await saveOrSubmitEvaluation({
        round_id: activeRound.id,
        team_id: teamId,
        scores: scoreItems,
        feedback,
        is_draft: isDraft,
      });

      setSuccessMsg(
        isDraft
          ? "Draft saved successfully."
          : "Evaluation officially submitted and recorded!"
      );
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to process evaluation");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Navigation & Header */}
      <div>
        <Link
          href="/judge"
          className="inline-flex items-center gap-1.5 font-tech text-xs uppercase text-text-secondary hover:text-text-primary mb-4 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Assigned Teams</span>
        </Link>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border-color pb-6">
          <div>
            <span className="font-tech text-xs uppercase tracking-[2px] text-accent-secondary font-bold">
              {team?.track || "INNOVATION TRACK"}
            </span>
            <h1 className="text-3xl md:text-4xl font-heading text-text-primary uppercase m-0 mt-1">
              {team?.name || `Team ${teamId.slice(0, 8)}`}
            </h1>
            <p className="font-tech text-xs text-text-secondary mt-1 m-0">
              Leader: <span className="text-text-primary">{team?.leader_name || "N/A"}</span> | Members:{" "}
              <span className="text-text-primary">{team?.member_count || 4}</span>
            </p>
          </div>

          <div className="glass-panel px-4 py-2 border border-accent-primary/40 text-right">
            <span className="font-tech text-[10px] text-text-secondary uppercase font-bold block">
              Active Round
            </span>
            <span className="font-heading text-sm text-accent-primary uppercase">
              {activeRound?.title || "Preliminary Round"}
            </span>
          </div>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Submission Assets Panel */}
      <div className="glass-panel p-6 border border-border-color space-y-4">
        <h2 className="font-heading text-lg text-text-primary uppercase m-0 flex items-center gap-2">
          <Presentation className="text-accent-tertiary" size={20} />
          Team Submission Assets
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* PPT Link */}
          <div className="p-4 bg-surface-color-light/40 border border-border-color flex flex-col justify-between">
            <div>
              <span className="font-tech text-[10px] text-accent-primary uppercase font-bold block mb-1">
                Mandatory Deck
              </span>
              <p className="font-heading text-sm text-text-primary uppercase m-0 flex items-center gap-1.5">
                <FileText size={16} className="text-accent-primary" />
                Pitch Presentation
              </p>
            </div>
            <div className="pt-4 mt-2">
              <a
                href={submission?.ppt_url || "#"}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 font-tech text-xs text-accent-primary hover:underline font-bold uppercase"
              >
                <span>View Slides</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>

          {/* GitHub Repo */}
          <div className="p-4 bg-surface-color-light/40 border border-border-color flex flex-col justify-between">
            <div>
              <span className="font-tech text-[10px] text-text-secondary uppercase font-bold block mb-1">
                Source Code
              </span>
              <p className="font-heading text-sm text-text-primary uppercase m-0 flex items-center gap-1.5">
                <Github size={16} />
                GitHub Repository
              </p>
            </div>
            <div className="pt-4 mt-2">
              {submission?.github_url ? (
                <a
                  href={submission.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-tech text-xs text-text-primary hover:text-accent-secondary font-bold uppercase"
                >
                  <span>Open Repo</span>
                  <ExternalLink size={13} />
                </a>
              ) : (
                <span className="font-tech text-xs text-text-secondary italic">Not provided</span>
              )}
            </div>
          </div>

          {/* Live Prototype */}
          <div className="p-4 bg-surface-color-light/40 border border-border-color flex flex-col justify-between">
            <div>
              <span className="font-tech text-[10px] text-text-secondary uppercase font-bold block mb-1">
                Interactive Demo
              </span>
              <p className="font-heading text-sm text-text-primary uppercase m-0 flex items-center gap-1.5">
                <ExternalLink size={16} className="text-accent-secondary" />
                Live Demo / Prototype
              </p>
            </div>
            <div className="pt-4 mt-2">
              {submission?.demo_url ? (
                <a
                  href={submission.demo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 font-tech text-xs text-accent-secondary hover:underline font-bold uppercase"
                >
                  <span>Launch Demo</span>
                  <ExternalLink size={13} />
                </a>
              ) : (
                <span className="font-tech text-xs text-text-secondary italic">Not provided</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Scoring Form */}
      <div className="glass-panel p-6 border border-border-color space-y-6">
        <div className="flex items-center justify-between border-b border-border-color pb-4">
          <div>
            <h2 className="font-heading text-xl text-text-primary uppercase m-0">
              Evaluation Rubric
            </h2>
            <p className="font-tech text-xs text-text-secondary m-0 mt-0.5">
              Score each criterion within its bounded range.
            </p>
          </div>

          <div className="text-right">
            <span className="font-tech text-xs text-text-secondary uppercase block">
              Cumulative Score
            </span>
            <span className="font-heading text-2xl text-accent-primary">
              {totalScore} / {maxPossibleScore} PTS
            </span>
          </div>
        </div>

        {criteria.length === 0 ? (
          <p className="font-tech text-xs text-text-secondary italic p-4 text-center">
            No evaluation criteria configured for this round.
          </p>
        ) : (
          <div className="space-y-6">
            {criteria.map((criterion, idx) => (
              <ScoringSlider
                key={criterion.id}
                index={idx}
                criterionId={criterion.id}
                criterionTitle={criterion.title}
                description={criterion.description}
                maxMarks={criterion.max_marks}
                value={scores[criterion.id] ?? 0}
                disabled={isLocked}
                onChange={handleScoreChange}
              />
            ))}

            {/* Qualitative Feedback */}
            <div className="space-y-2 pt-2">
              <label className="block font-tech text-xs uppercase tracking-wider text-text-secondary font-bold">
                Judge Qualitative Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                disabled={isLocked}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Provide constructive feedback, strengths, and areas for improvement..."
                className="w-full bg-surface-color border border-border-color p-3 text-text-primary text-xs font-tech h-24 focus:border-accent-secondary outline-none"
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border-color">
          <p className="font-tech text-xs text-text-secondary m-0">
            {isLocked
              ? "This evaluation is locked by administrator. Modifications are disabled."
              : "Drafts can be adjusted anytime before round locking."}
          </p>

          {!isLocked && (
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={() => handleSave(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2.5 bg-surface-color-light border border-border-color hover:border-text-secondary text-text-primary font-tech font-bold uppercase text-xs transition-colors"
              >
                <Save size={15} />
                Save Draft
              </button>

              <button
                type="button"
                onClick={() => handleSave(false)}
                disabled={loading}
                className="flex items-center gap-2 px-5 py-2.5 bg-accent-secondary hover:bg-accent-secondary/80 text-white font-tech font-bold uppercase text-xs transition-colors shadow-lg shadow-accent-secondary/20"
              >
                <Send size={15} />
                Submit Final Evaluation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
