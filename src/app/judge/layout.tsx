import { requireJudge } from "@/lib/auth/judge";
import JudgeHeader from "@/components/judge/Header";

export const dynamic = "force-dynamic";

export default async function JudgeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireJudge();
  } catch (error: any) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508] p-6 text-center">
        <div className="glass-panel max-w-md w-full p-8 border border-status-error/40 shadow-2xl">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-error/10 border border-status-error flex items-center justify-center">
            <span className="font-heading text-2xl text-status-error">403</span>
          </div>
          <h1 className="font-heading text-2xl text-text-primary uppercase mb-2">Judge Access Required</h1>
          <p className="font-tech text-text-secondary text-sm mb-6">
            {error?.message || "You must be authenticated as a verified judge to access this portal."}
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
      <JudgeHeader />
      <main
        className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(251, 200, 21, 0.04), transparent 500px), radial-gradient(circle at bottom left, rgba(255, 0, 127, 0.04), transparent 500px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
