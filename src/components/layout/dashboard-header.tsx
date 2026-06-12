import { NotificationBell } from "@/components/notifications/notification-bell";
import { UserMenu } from "@/components/auth/user-menu";

export function DashboardHeader({
  userEmail,
  notificationCount = 0,
}: {
  userEmail: string | null;
  notificationCount?: number;
}) {
  return (
    <header className="hidden items-center justify-between border-b border-brand-border bg-white px-8 py-4 lg:flex">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-brand-sage">
          PlantPal Marketing OS
        </p>
        <p className="text-sm text-brand-muted">Mission control — every item has a destination</p>
      </div>
      <div className="flex items-center gap-3">
        <NotificationBell initialCount={notificationCount} />
        <UserMenu email={userEmail} />
      </div>
    </header>
  );
}
