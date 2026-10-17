import { getJudgeAssignmentsData } from "@/app/actions/admin-assignments";
import ClubJudgesRosterClient from "./roster-client";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Judges Roster & Team Allocations | Club Operations",
  description: "Club members live directory of jury members, evaluators, and allotted teams.",
};

export default async function OpsJudgesRosterPage() {
  const data = await getJudgeAssignmentsData();

  return (
    <div className="space-y-6">
      <div className="border-b border-border-color pb-5">
        <div className="flex items-center gap-2 mb-1.5">
          <span className="w-2 h-2 rounded-full bg-accent-tertiary animate-pulse" />
          <p className="font-tech text-xs uppercase tracking-[3px] text-accent-tertiary font-bold m-0">
            Operations // Jury Telemetry
          </p>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading text-text-primary tracking-wider uppercase m-0">
          Judges Roster & Allocations
        </h1>
        <p className="font-tech text-text-secondary text-xs mt-1.5 m-0">
          Real-time visibility into active jury evaluators, their assigned teams, and judging coverage matrix.
        </p>
      </div>

      <ClubJudgesRosterClient initialData={data} />
    </div>
  );
}
