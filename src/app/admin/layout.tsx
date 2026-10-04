import { requireAdmin } from "@/lib/auth/admin";
import AdminSidebar from "@/components/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch (error: any) {
    // If running in development without credentials or failing role check, render structured access fallback
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#050508] p-6 text-center">
        <div className="glass-panel max-w-md w-full p-8 border border-status-error/40 shadow-2xl relative">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-status-error/10 border border-status-error flex items-center justify-center">
            <span className="font-heading text-2xl text-status-error">403</span>
          </div>
          <h1 className="font-heading text-2xl text-text-primary uppercase mb-2">Access Denied</h1>
          <p className="font-tech text-text-secondary text-sm mb-6">
            {error?.message || "Admin authorization required to access mission control."}
          </p>
          <a
            href="/"
            className="inline-block px-6 py-3 bg-surface-color-light border border-border-color hover:border-accent-secondary font-tech font-bold uppercase tracking-wider text-xs text-text-primary transition-all"
          >
            Return to Dashboard
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050508]">
      <AdminSidebar />
      <main
        className="flex-1 p-5 md:p-10 overflow-y-auto"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(255, 0, 127, 0.08), transparent 500px), radial-gradient(circle at bottom left, rgba(0, 240, 255, 0.05), transparent 500px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
