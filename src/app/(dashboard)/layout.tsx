import { unstable_noStore as noStore } from "next/cache";
import { connection } from "next/server";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { getServerUser } from "@/lib/auth/get-user";
import { isNextBuildPhase } from "@/lib/build-phase";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  noStore();

  const user = isNextBuildPhase() ? null : await getServerUser();
  const userEmail = user?.email ?? null;

  return (
    <div className="flex min-h-screen bg-brand-bg">
      <Sidebar userEmail={userEmail} />
      <div className="flex min-w-0 flex-1 flex-col">
        <MobileNav userEmail={userEmail} />
        <DashboardHeader userEmail={userEmail} />
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
