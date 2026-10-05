import { redirect } from "next/navigation";
import { requireOperationsRole } from "@/lib/auth/operations";
import OpsHeader from "@/components/ops/Header";

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
    <div className="min-h-screen bg-[#050508] text-text-primary flex flex-col">
      <OpsHeader />
      <main
        className="flex-1 p-6 md:p-10 max-w-6xl mx-auto w-full"
        style={{
          background:
            "radial-gradient(circle at top right, rgba(0, 240, 255, 0.05), transparent 500px), radial-gradient(circle at bottom left, rgba(251, 200, 21, 0.04), transparent 500px)",
        }}
      >
        {children}
      </main>
    </div>
  );
}
