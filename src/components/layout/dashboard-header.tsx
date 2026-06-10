import { Bell, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LogoutButton } from "@/components/auth/logout-button";

export function DashboardHeader() {
  return (
    <header className="hidden items-center justify-between border-b border-brand-border bg-white px-8 py-4 lg:flex">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-brand-sage">
          Grow with confidence
        </p>
        <p className="text-sm text-brand-muted">
          PlantPal HQ — mission control for growth
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-muted" />
          <input
            type="search"
            placeholder="Search drafts, creators..."
            className="w-64 rounded-xl border border-brand-border bg-brand-bg py-2 pl-9 pr-4 text-sm outline-none transition focus:border-brand-sage focus:ring-2 focus:ring-brand-sage/20"
          />
        </div>
        <button className="relative rounded-xl border border-brand-border p-2.5 text-brand-muted transition hover:bg-brand-bg hover:text-brand-primary">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-brand-accent text-[10px] font-bold text-white">
            3
          </span>
        </button>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-1.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
              PP
            </div>
            <div className="text-left">
              <p className="text-xs font-medium text-brand-primary">Founder</p>
              <Badge variant="muted" className="mt-0.5 text-[10px]">
                Private HQ
              </Badge>
            </div>
          </div>
          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
