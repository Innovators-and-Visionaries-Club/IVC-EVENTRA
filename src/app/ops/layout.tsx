import { redirect } from "next/navigation";
import { requireOperationsRole } from "@/lib/auth/operations";
import OpsSidebar from "@/components/ops/Sidebar";

export const dynamic = "force-dynamic";

export default async function OpsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireOperationsRole();
  } catch {
    redirect("/login");
  }

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#050508] text-text-primary">
      <OpsSidebar />
      <main
        className="flex-1 p-6 md:p-10 overflow-y-auto"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(0, 240, 255, 0.05), transparent 500px), radial-gradient(circle at bottom left, rgba(251, 200, 21, 0.04), transparent 500px)",
        }}
      >
        <div className="max-w-6xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
