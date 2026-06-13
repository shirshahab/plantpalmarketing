import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { ToastProvider } from "@/components/shared/toast-provider";
import { getServerUser } from "@/lib/auth/get-user";
import { getNavBadgeCounts } from "@/lib/nav/badge-counts";
import { isNextBuildPhase } from "@/lib/build-phase";
import { unstable_noStore as noStore } from "next/cache";
import { connection } from "next/server";

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
  const badges = isNextBuildPhase() ? undefined : await getNavBadgeCounts().catch(() => undefined);

  return (
    <ToastProvider>
      <div className="flex min-h-screen bg-brand-bg">
        <Sidebar userEmail={userEmail} badges={badges} />
        <div className="flex min-w-0 flex-1 flex-col">
          <MobileNav userEmail={userEmail} />
          <DashboardHeader userEmail={userEmail} notificationCount={badges?.notifications ?? 0} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 pb-[calc(env(safe-area-inset-bottom)+2rem)] sm:px-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </ToastProvider>
  );
}
