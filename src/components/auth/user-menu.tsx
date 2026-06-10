import { LogoutButton } from "@/components/auth/logout-button";
import { Badge } from "@/components/ui/badge";

function initials(email: string) {
  const local = email.split("@")[0] ?? "U";
  const parts = local.split(/[._-]/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return local.slice(0, 2).toUpperCase();
}

export function UserMenu({
  email,
  compact = false,
}: {
  email: string | null | undefined;
  compact?: boolean;
}) {
  const displayEmail = email ?? "Signed in";
  const label = email?.split("@")[0] ?? "Team";

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
          {initials(displayEmail)}
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate text-xs font-medium text-brand-primary">{label}</p>
          <p className="truncate text-[10px] text-brand-muted">{displayEmail}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-2 rounded-xl border border-brand-border px-3 py-1.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-primary text-xs font-bold text-white">
          {initials(displayEmail)}
        </div>
        <div className="min-w-0 text-left">
          <p className="truncate text-xs font-medium text-brand-primary">{label}</p>
          <p className="max-w-[10rem] truncate text-[10px] text-brand-muted">{displayEmail}</p>
          <Badge variant="muted" className="mt-0.5 text-[10px]">
            PlantPal HQ
          </Badge>
        </div>
      </div>
      <LogoutButton />
    </div>
  );
}
