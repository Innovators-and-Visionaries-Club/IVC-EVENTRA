import ScannerClientView from "./scanner-client";
import { getActiveAnnouncements } from "@/app/actions/announcements";
import AnnouncementBanner from "@/components/AnnouncementBanner";

export const dynamic = "force-dynamic";

export default async function OpsScannerPage() {
  const announcements = await getActiveAnnouncements("ops");

  return (
    <div className="space-y-6 animate-fade-in font-tech">
      <AnnouncementBanner announcements={announcements} portalName="Operations Desk" />

      <div className="border-b border-border-color pb-6">
        <p className="font-tech text-xs uppercase tracking-[3px] text-accent-tertiary font-bold mb-1">
          Logistics Desk // Live Verification
        </p>
        <h1 className="text-3xl md:text-5xl font-heading text-text-primary tracking-wider uppercase m-0">
          QR Verification Desk
        </h1>
        <p className="font-tech text-text-secondary text-sm mt-2 max-w-2xl">
          Scan participant team QR badges using device camera or manual UUID entry to record check-in, kit distribution, lunch, and snack claims.
        </p>
      </div>

      <ScannerClientView />
    </div>
  );
}
