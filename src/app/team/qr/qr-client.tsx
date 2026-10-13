"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Download } from "lucide-react";

export default function TeamQrClientView({
  teamId,
  teamName,
  track,
  leaderName,
}: {
  teamId: string;
  teamName: string;
  track: string;
  leaderName: string;
}) {
  const [qrUrl, setQrUrl] = useState<string>("");

  useEffect(() => {
    // Generate clean QR code data URI
    QRCode.toDataURL(
      JSON.stringify({ team_id: teamId, name: teamName }),
      {
        width: 320,
        margin: 2,
        color: {
          dark: "#050508",
          light: "#ffffff",
        },
      },
      (err: Error | null | undefined, url: string) => {
        if (!err && url) {
          setQrUrl(url);
        }
      }
    );
  }, [teamId, teamName]);

  return (
    <div className="glass-panel p-8 border border-accent-secondary/40 space-y-6 text-center shadow-2xl relative overflow-hidden">
      <div className="space-y-1">
        <span className="font-tech text-xs text-accent-secondary uppercase font-bold tracking-wider px-2 py-0.5 bg-accent-secondary/15 border border-accent-secondary inline-block">
          {track}
        </span>
        <h2 className="font-heading text-2xl text-text-primary uppercase m-0 pt-2">
          {teamName}
        </h2>
        <p className="font-tech text-xs text-text-secondary m-0">
          Leader: <span className="text-text-primary font-bold">{leaderName}</span>
        </p>
      </div>

      {/* QR Render */}
      <div className="flex justify-center my-4">
        <div className="p-4 bg-white rounded-lg shadow-xl inline-block border-2 border-accent-primary">
          {qrUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={qrUrl}
              alt="Team Official QR Code"
              className="w-56 h-56 object-contain"
            />
          ) : (
            <div className="w-56 h-56 flex items-center justify-center font-tech text-black text-xs">
              Generating QR...
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2 font-tech">
        <p className="text-[11px] text-text-secondary font-mono m-0">
          UUID: {teamId}
        </p>
        <p className="text-xs text-text-secondary">
          Scannable across all 4 operational distribution stations.
        </p>
      </div>

      {qrUrl && (
        <div className="pt-2">
          <a
            href={qrUrl}
            download={`team-${teamName.toLowerCase().replace(/\s+/g, "-")}-qr.png`}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent-primary hover:bg-accent-primary/80 text-black font-tech font-bold uppercase text-xs transition-colors"
          >
            <Download size={15} />
            <span>Save Badge Image</span>
          </a>
        </div>
      )}
    </div>
  );
}
