"use client";

import { useState } from "react";
import { Plus, Trash2, Edit3, ChevronDown, ChevronRight, CheckCircle2 } from "lucide-react";
import {
  createRound,
  updateRoundStatus,
  createCriterion,
  updateCriterion,
  deleteCriterion,
  type RoundStatus,
} from "@/app/actions/admin-rounds";

export default function RoundsClientView({
  initialRounds,
  initialCriteria,
}: {
  initialRounds: any[];
  initialCriteria: any[];
}) {
  const [rounds, setRounds] = useState(initialRounds);
  const [criteria, setCriteria] = useState(initialCriteria);
  const [expandedRound, setExpandedRound] = useState<string | null>(
    initialRounds[0]?.id || null
  );

  // Round modal states
  const [isRoundModalOpen, setIsRoundModalOpen] = useState(false);
  const [roundTitle, setRoundTitle] = useState("");
  const [roundOrder, setRoundOrder] = useState<number>(initialRounds.length + 1);
  const [roundStatus, setRoundStatus] = useState<RoundStatus>("draft");

  // Criterion modal states
  const [isCriterionModalOpen, setIsCriterionModalOpen] = useState(false);
  const [selectedRoundId, setSelectedRoundId] = useState<string>("");
  const [editingCriterionId, setEditingCriterionId] = useState<string | null>(null);
  const [criterionTitle, setCriterionTitle] = useState("");
  const [criterionDesc, setCriterionDesc] = useState("");
  const [criterionMaxMarks, setCriterionMaxMarks] = useState<number>(10);
  const [criterionRequired, setCriterionRequired] = useState(true);

  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const handleCreateRound = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const created = await createRound({
        title: roundTitle,
        sequence_order: Number(roundOrder),
        status: roundStatus,
      });
      setRounds((prev) => [...prev, created || { id: crypto.randomUUID(), title: roundTitle, sequence_order: roundOrder, status: roundStatus }]);
      setIsRoundModalOpen(false);
      setRoundTitle("");
      setMsg("Round created successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to create round");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (roundId: string, newStatus: RoundStatus) => {
    try {
      await updateRoundStatus(roundId, newStatus);
      setRounds((prev) =>
        prev.map((r) => (r.id === roundId ? { ...r, status: newStatus } : r))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update round status");
    }
  };

  const handleOpenCriterionModal = (roundId: string, crit?: any) => {
    setSelectedRoundId(roundId);
    if (crit) {
      setEditingCriterionId(crit.id);
      setCriterionTitle(crit.title);
      setCriterionDesc(crit.description || "");
      setCriterionMaxMarks(crit.max_marks || 10);
      setCriterionRequired(crit.is_required ?? true);
    } else {
      setEditingCriterionId(null);
      setCriterionTitle("");
      setCriterionDesc("");
      setCriterionMaxMarks(10);
      setCriterionRequired(true);
    }
    setIsCriterionModalOpen(true);
  };

  const handleSaveCriterion = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingCriterionId) {
        await updateCriterion(editingCriterionId, {
          title: criterionTitle,
          description: criterionDesc,
          max_marks: Number(criterionMaxMarks),
          is_required: criterionRequired,
        });
        setCriteria((prev) =>
          prev.map((c) =>
            c.id === editingCriterionId
              ? {
                  ...c,
                  title: criterionTitle,
                  description: criterionDesc,
                  max_marks: criterionMaxMarks,
                  is_required: criterionRequired,
                }
              : c
          )
        );
      } else {
        const created = await createCriterion({
          round_id: selectedRoundId,
          title: criterionTitle,
          description: criterionDesc,
          max_marks: Number(criterionMaxMarks),
          is_required: criterionRequired,
        });
        setCriteria((prev) => [...prev, created || { id: crypto.randomUUID(), round_id: selectedRoundId, title: criterionTitle, description: criterionDesc, max_marks: criterionMaxMarks, is_required: criterionRequired }]);
      }
      setIsCriterionModalOpen(false);
    } catch (err: any) {
      alert(err.message || "Failed to save criterion");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCriterion = async (criterionId: string) => {
    if (!confirm("Are you sure you want to delete this criterion?")) return;
    try {
      await deleteCriterion(criterionId);
      setCriteria((prev) => prev.filter((c) => c.id !== criterionId));
    } catch (err: any) {
      alert(err.message || "Failed to delete criterion");
    }
  };

  return (
    <div className="space-y-6">
      {msg && (
        <div className="p-3 bg-status-success/10 border border-status-success text-status-success text-xs font-tech flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{msg}</span>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="font-heading text-xl text-text-primary uppercase m-0">
          Configured Rounds ({rounds.length})
        </h2>
        <button
          onClick={() => setIsRoundModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-accent-secondary hover:bg-accent-secondary/80 text-white font-tech font-bold uppercase tracking-wider text-xs transition-colors rounded-none"
        >
          <Plus size={16} />
          Create Round
        </button>
      </div>

      <div className="space-y-4">
        {rounds.length === 0 ? (
          <div className="glass-panel p-8 text-center text-text-secondary font-tech">
            No rounds configured yet. Click "Create Round" above to get started.
          </div>
        ) : (
          rounds.map((round) => {
            const isExpanded = expandedRound === round.id;
            const roundCriteria = criteria.filter((c) => c.round_id === round.id);

            return (
              <div
                key={round.id}
                className="glass-panel border border-border-color overflow-hidden"
              >
                <div className="p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-surface-color-light/30">
                  <div
                    className="flex items-center gap-3 cursor-pointer select-none"
                    onClick={() => setExpandedRound(isExpanded ? null : round.id)}
                  >
                    {isExpanded ? (
                      <ChevronDown size={20} className="text-accent-secondary" />
                    ) : (
                      <ChevronRight size={20} className="text-text-secondary" />
                    )}
                    <div>
                      <span className="font-tech text-xs text-accent-secondary font-bold mr-2 uppercase">
                        Sequence #{round.sequence_order}
                      </span>
                      <h3 className="font-heading text-lg text-text-primary inline uppercase m-0">
                        {round.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
                    <span className="font-tech text-xs text-text-secondary">
                      Status:
                    </span>
                    <select
                      value={round.status}
                      onChange={(e) =>
                        handleStatusChange(round.id, e.target.value as RoundStatus)
                      }
                      className="bg-surface-color border border-border-color text-text-primary font-tech text-xs px-2.5 py-1.5 focus:border-accent-secondary outline-none uppercase font-semibold"
                    >
                      <option value="draft">DRAFT</option>
                      <option value="open">OPEN</option>
                      <option value="closed">CLOSED</option>
                      <option value="locked">LOCKED</option>
                      <option value="reopened">REOPENED</option>
                    </select>

                    <button
                      onClick={() => handleOpenCriterionModal(round.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-surface-color border border-border-color hover:border-accent-tertiary text-text-primary font-tech font-bold uppercase text-xs transition-colors"
                    >
                      <Plus size={14} className="text-accent-tertiary" />
                      Add Criterion
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-border-color space-y-3 bg-[#050508]/40">
                    <div className="flex justify-between items-center">
                      <p className="font-tech text-xs uppercase tracking-wider text-text-secondary font-bold m-0">
                        Criteria Rubric ({roundCriteria.length})
                      </p>
                    </div>

                    {roundCriteria.length === 0 ? (
                      <p className="font-tech text-xs text-text-secondary italic">
                        No criteria configured for this round.
                      </p>
                    ) : (
                      <div className="divide-y divide-border-color/40">
                        {roundCriteria.map((c) => (
                          <div
                            key={c.id}
                            className="py-3 flex items-center justify-between gap-4"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-heading text-sm text-text-primary uppercase">
                                  {c.title}
                                </span>
                                <span className="font-tech text-[10px] px-2 py-0.5 bg-accent-primary/10 border border-accent-primary text-accent-primary font-bold">
                                  MAX: {c.max_marks} PTS
                                </span>
                                {c.is_required && (
                                  <span className="font-tech text-[10px] px-1.5 py-0.5 bg-status-error/10 border border-status-error text-status-error font-bold">
                                    REQUIRED
                                  </span>
                                )}
                              </div>
                              {c.description && (
                                <p className="font-tech text-xs text-text-secondary m-0 mt-1">
                                  {c.description}
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenCriterionModal(round.id, c)}
                                className="p-1.5 hover:text-accent-tertiary text-text-secondary transition-colors"
                                title="Edit Criterion"
                              >
                                <Edit3 size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteCriterion(c.id)}
                                className="p-1.5 hover:text-status-error text-text-secondary transition-colors"
                                title="Delete Criterion"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create Round Modal */}
      {isRoundModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full p-6 border border-accent-secondary/50 space-y-4">
            <h3 className="font-heading text-xl text-text-primary uppercase m-0">
              Create Evaluation Round
            </h3>
            <form onSubmit={handleCreateRound} className="space-y-4 font-tech">
              <div>
                <label className="block text-xs uppercase text-text-secondary mb-1">
                  Round Title
                </label>
                <input
                  type="text"
                  required
                  value={roundTitle}
                  onChange={(e) => setRoundTitle(e.target.value)}
                  placeholder="e.g. Round 1 - Preliminary Pitch"
                  className="w-full bg-surface-color border border-border-color p-2 text-text-primary text-sm focus:border-accent-secondary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-text-secondary mb-1">
                  Sequence Order
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={roundOrder}
                  onChange={(e) => setRoundOrder(Number(e.target.value))}
                  className="w-full bg-surface-color border border-border-color p-2 text-text-primary text-sm focus:border-accent-secondary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-text-secondary mb-1">
                  Initial Status
                </label>
                <select
                  value={roundStatus}
                  onChange={(e) => setRoundStatus(e.target.value as RoundStatus)}
                  className="w-full bg-surface-color border border-border-color p-2 text-text-primary text-sm focus:border-accent-secondary outline-none uppercase"
                >
                  <option value="draft">DRAFT</option>
                  <option value="open">OPEN</option>
                  <option value="closed">CLOSED</option>
                  <option value="locked">LOCKED</option>
                  <option value="reopened">REOPENED</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsRoundModalOpen(false)}
                  className="px-4 py-2 border border-border-color text-text-secondary hover:text-text-primary font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-accent-secondary hover:bg-accent-secondary/80 text-white font-bold uppercase text-xs"
                >
                  {loading ? "Creating..." : "Save Round"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Criterion Modal */}
      {isCriterionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full p-6 border border-accent-tertiary/50 space-y-4">
            <h3 className="font-heading text-xl text-text-primary uppercase m-0">
              {editingCriterionId ? "Edit Criterion" : "Add Evaluation Criterion"}
            </h3>
            <form onSubmit={handleSaveCriterion} className="space-y-4 font-tech">
              <div>
                <label className="block text-xs uppercase text-text-secondary mb-1">
                  Criterion Title
                </label>
                <input
                  type="text"
                  required
                  value={criterionTitle}
                  onChange={(e) => setCriterionTitle(e.target.value)}
                  placeholder="e.g. Technical Feasibility"
                  className="w-full bg-surface-color border border-border-color p-2 text-text-primary text-sm focus:border-accent-tertiary outline-none"
                />
              </div>

              <div>
                <label className="block text-xs uppercase text-text-secondary mb-1">
                  Description / Rubric Hint
                </label>
                <textarea
                  value={criterionDesc}
                  onChange={(e) => setCriterionDesc(e.target.value)}
                  placeholder="Details for judges on how to evaluate this aspect..."
                  className="w-full bg-surface-color border border-border-color p-2 text-text-primary text-sm focus:border-accent-tertiary outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs uppercase text-text-secondary mb-1">
                    Max Marks
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={criterionMaxMarks}
                    onChange={(e) => setCriterionMaxMarks(Number(e.target.value))}
                    className="w-full bg-surface-color border border-border-color p-2 text-text-primary text-sm focus:border-accent-tertiary outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 pt-6">
                  <input
                    type="checkbox"
                    id="reqCrit"
                    checked={criterionRequired}
                    onChange={(e) => setCriterionRequired(e.target.checked)}
                    className="accent-accent-tertiary"
                  />
                  <label htmlFor="reqCrit" className="text-xs uppercase text-text-secondary cursor-pointer">
                    Required Mark
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCriterionModalOpen(false)}
                  className="px-4 py-2 border border-border-color text-text-secondary hover:text-text-primary font-bold uppercase text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-accent-tertiary hover:bg-accent-tertiary/80 text-black font-bold uppercase text-xs"
                >
                  {loading ? "Saving..." : "Save Criterion"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
