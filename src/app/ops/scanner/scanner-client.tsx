"use client";

import { useEffect, useRef, useState } from "react";
import {
  QrCode,
  CheckCircle2,
  AlertCircle,
  Camera,
  Coffee,
  Utensils,
  Gift,
  UserCheck,
  Search,
  RefreshCw,
} from "lucide-react";
import {
  fetchTeamMembersForScan,
  recordMemberAction,
} from "@/app/actions/operations";
import type { ActionType } from "@/lib/validations/operations";
import ScannerDesk from "@/components/ops/ScannerDesk";

export default function ScannerClientView() {
  const [scanning, setScanning] = useState(false);
  const [manualId, setManualId] = useState("");
  const [teamData, setTeamData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const html5QrCodeRef = useRef<any>(null);

  const startScanner = async () => {
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      setErrorMsg(null);
      const scanner = new Html5Qrcode("qr-reader-container");
      html5QrCodeRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleDetectedCode(decodedText);
          stopScanner();
        },
        () => {
          // Frame error ignored
        }
      );
      setScanning(true);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to initialize camera scanner");
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (html5QrCodeRef.current && scanning) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.warn("Camera stop error:", err);
      }
    }
    setScanning(false);
  };

  const handleDetectedCode = async (rawCode: string) => {
    let teamId = rawCode.trim();
    // Support JSON QR payloads like {"team_id":"..."} or plain UUID
    if (teamId.startsWith("{")) {
      try {
        const parsed = JSON.parse(teamId);
        teamId = parsed.team_id || parsed.id || teamId;
      } catch {}
    }
    loadTeamData(teamId);
  };

  const loadTeamData = async (teamId: string) => {
    if (!teamId) return;
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetchTeamMembersForScan(teamId);
      setTeamData(res);
      setSuccessMsg(`Loaded roster for team "${res.team.name}"`);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to fetch team details");
      setTeamData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = async (
    participantId: string,
    actionType: ActionType
  ) => {
    if (!teamData?.team?.id) return;
    const actionKey = `${participantId}-${actionType}`;
    setActionLoading(actionKey);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      await recordMemberAction({
        team_id: teamData.team.id,
        participant_id: participantId,
        action_type: actionType,
      });

      // Update state locally
      setTeamData((prev: any) => ({
        ...prev,
        activityLogs: [
          ...prev.activityLogs,
          {
            participant_id: participantId,
            action_type: actionType,
            created_at: new Date().toISOString(),
          },
        ],
      }));

      setSuccessMsg(`Successfully claimed "${actionType.toUpperCase()}"!`);
    } catch (err: any) {
      setErrorMsg(err.message || "Action claim failed");
    } finally {
      setActionLoading(null);
    }
  };

  const isClaimed = (participantId: string, actionType: string) => {
    return teamData?.activityLogs?.some(
      (log: any) =>
        log.participant_id === participantId && log.action_type === actionType
    );
  };

  useEffect(() => {
    return () => {
      if (html5QrCodeRef.current) {
        try {
          html5QrCodeRef.current.stop();
        } catch {}
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
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

      <ScannerDesk
        scanning={scanning}
        manualId={manualId}
        loading={loading}
        onStartScanner={startScanner}
        onStopScanner={stopScanner}
        onManualIdChange={setManualId}
        onLookup={loadTeamData}
      />

      {/* Scanned Team Roster Panel */}
      {teamData && (
        <div className="glass-panel p-6 border border-accent-tertiary/40 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-color pb-4">
            <div>
              <span className="font-tech text-[10px] text-accent-tertiary uppercase font-bold tracking-wider px-2 py-0.5 bg-accent-tertiary/10 border border-accent-tertiary">
                {teamData.team.track || "GENERAL"}
              </span>
              <h2 className="font-heading text-2xl text-text-primary uppercase m-0 mt-2">
                {teamData.team.name}
              </h2>
              <p className="font-tech text-xs text-text-secondary m-0 mt-0.5">
                Leader: <span className="text-text-primary">{teamData.team.leader_name}</span> | Team ID:{" "}
                <span className="font-mono text-text-primary">{teamData.team.id}</span>
              </p>
            </div>
          </div>

          {/* Members Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-tech text-xs">
              <thead>
                <tr className="border-b border-border-color bg-surface-color-light/40 text-text-secondary uppercase tracking-wider">
                  <th className="p-3">Participant</th>
                  <th className="p-3">Role</th>
                  <th className="p-3 text-center">Registration</th>
                  <th className="p-3 text-center">Goodies / Kit</th>
                  <th className="p-3 text-center">Lunch</th>
                  <th className="p-3 text-center">Snacks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-color/30">
                {teamData.members.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-text-secondary italic">
                      No registered members mapped in roster.
                    </td>
                  </tr>
                ) : (
                  teamData.members.map((m: any) => {
                    const regDone = isClaimed(m.id, "registration");
                    const goodiesDone = isClaimed(m.id, "goodies");
                    const lunchDone = isClaimed(m.id, "lunch");
                    const snacksDone = isClaimed(m.id, "snacks");

                    return (
                      <tr key={m.id} className="hover:bg-surface-color-light/20 transition-colors">
                        <td className="p-3">
                          <p className="font-heading text-sm text-text-primary uppercase m-0">
                            {m.name || "Member"}
                          </p>
                          <span className="font-mono text-[10px] text-text-secondary">
                            {m.id.slice(0, 8)}...
                          </span>
                        </td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 border text-[10px] uppercase font-bold ${
                              m.role === "leader"
                                ? "bg-accent-secondary/15 text-accent-secondary border-accent-secondary"
                                : "bg-surface-color text-text-secondary border-border-color"
                            }`}
                          >
                            {m.role || "Member"}
                          </span>
                        </td>

                        {/* Registration Button */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleActionClick(m.id, "registration")}
                            disabled={regDone || actionLoading === `${m.id}-registration`}
                            className={`px-3 py-1 text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1 mx-auto ${
                              regDone
                                ? "bg-status-success/15 text-status-success border border-status-success cursor-default"
                                : "bg-surface-color hover:bg-accent-tertiary hover:text-black border border-border-color"
                            }`}
                          >
                            <UserCheck size={13} />
                            {regDone ? "Checked-In" : "Check In"}
                          </button>
                        </td>

                        {/* Goodies Button */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleActionClick(m.id, "goodies")}
                            disabled={goodiesDone || actionLoading === `${m.id}-goodies`}
                            className={`px-3 py-1 text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1 mx-auto ${
                              goodiesDone
                                ? "bg-status-success/15 text-status-success border border-status-success cursor-default"
                                : "bg-surface-color hover:bg-accent-primary hover:text-black border border-border-color"
                            }`}
                          >
                            <Gift size={13} />
                            {goodiesDone ? "Claimed" : "Distribute"}
                          </button>
                        </td>

                        {/* Lunch Button */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleActionClick(m.id, "lunch")}
                            disabled={lunchDone || actionLoading === `${m.id}-lunch`}
                            className={`px-3 py-1 text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1 mx-auto ${
                              lunchDone
                                ? "bg-status-success/15 text-status-success border border-status-success cursor-default"
                                : "bg-surface-color hover:bg-accent-secondary hover:text-white border border-border-color"
                            }`}
                          >
                            <Utensils size={13} />
                            {lunchDone ? "Claimed" : "Claim"}
                          </button>
                        </td>

                        {/* Snacks Button */}
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleActionClick(m.id, "snacks")}
                            disabled={snacksDone || actionLoading === `${m.id}-snacks`}
                            className={`px-3 py-1 text-[11px] font-bold uppercase transition-all flex items-center justify-center gap-1 mx-auto ${
                              snacksDone
                                ? "bg-status-success/15 text-status-success border border-status-success cursor-default"
                                : "bg-surface-color hover:bg-accent-tertiary hover:text-black border border-border-color"
                            }`}
                          >
                            <Coffee size={13} />
                            {snacksDone ? "Claimed" : "Claim"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
