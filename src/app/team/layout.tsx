import { requireAuthenticatedTeamUser } from "@/lib/auth/team";
import TeamHeader from "@/components/team/Header";

export const dynamic = "force-dynamic";

export default async function TeamLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAuthenticatedTeamUser();
  } catch (error: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508] p-6 text-center">
        <div className="glass-panel max-w-md w-full p-8 border border-status-error/40 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-error/10 border border-status-error flex items-center justify-center">
            <span className="font-heading text-2xl text-status-error">403</span>
          </div>
          <h1 className="font-heading text-2xl text-text-primary uppercase mb-2">Team Authentication Required</h1>
          <p className="font-tech text-text-secondary text-sm mb-6">
            {error?.message || "Please sign in with an authorized team member account to access the team portal."}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-surface-color-light border border-border-color hover:border-accent-secondary font-tech font-bold uppercase tracking-wider text-xs text-text-primary transition-all"
          >
            Return to Home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#050508] text-text-primary flex flex-col">
      <TeamHeader />
      <main
        className="flex-1 p-6 md:p-10 max-w-5xl mx-auto w-full"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(0, 240, 255, 0.04), transparent 500px), radial-gradient(circle at bottom left, rgba(255, 0, 127, 0.04), transparent 500px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
