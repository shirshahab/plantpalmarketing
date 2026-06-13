"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export interface ToastAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export interface ToastPayload {
  id: string;
  title: string;
  message: string;
  destination?: string;
  destinationLabel?: string;
  nextOwner?: string;
  nextStep?: string;
  tone?: "success" | "warning" | "info";
  actions?: ToastAction[];
  autoRedirectMs?: number;
  autoRedirectHref?: string;
}

interface ToastContextValue {
  toasts: ToastPayload[];
  showToast: (t: Omit<ToastPayload, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

function ToastCard({
  toast,
  onDismiss,
}: {
  toast: ToastPayload;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const stayHereRef = useRef(false);
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!toast.autoRedirectHref || !toast.autoRedirectMs) return;
    redirectTimer.current = setTimeout(() => {
      if (!stayHereRef.current) router.push(toast.autoRedirectHref!);
      onDismiss();
    }, toast.autoRedirectMs);
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current);
    };
  }, [toast.autoRedirectHref, toast.autoRedirectMs, router, onDismiss]);

  function handleStayHere() {
    stayHereRef.current = true;
    if (redirectTimer.current) clearTimeout(redirectTimer.current);
    onDismiss();
  }

  return (
    <div
      className={`pointer-events-auto w-[min(100vw-2rem,24rem)] rounded-xl border px-4 py-3 shadow-lg ${
        toast.tone === "warning"
          ? "border-amber-200 bg-amber-50 text-amber-950"
          : toast.tone === "info"
            ? "border-sky-200 bg-sky-50 text-sky-950"
            : "border-emerald-200 bg-emerald-50 text-emerald-950"
      }`}
    >
      <p className="text-sm font-semibold">{toast.title}</p>
      <p className="mt-0.5 break-words text-xs opacity-90">{toast.message}</p>
      {(toast.destinationLabel || toast.destination || toast.nextOwner) && (
        <div className="mt-2 space-y-0.5 text-[11px] opacity-80">
          {toast.destinationLabel && <p>Sent to {toast.destinationLabel}</p>}
          {toast.nextOwner && <p>Owner: {toast.nextOwner}</p>}
          {toast.nextStep && <p>Next: {toast.nextStep}</p>}
        </div>
      )}
      {toast.actions && toast.actions.length > 0 && (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {toast.actions.map((action) =>
            action.href ? (
              <Link
                key={action.label}
                href={action.href}
                onClick={() => {
                  stayHereRef.current = true;
                  if (redirectTimer.current) clearTimeout(redirectTimer.current);
                  onDismiss();
                }}
                className={`rounded-lg px-3 py-1.5 text-center text-[11px] font-semibold ${
                  action.variant === "primary"
                    ? "bg-brand-primary text-white"
                    : "border border-current/20 bg-white/60"
                }`}
              >
                {action.label}
              </Link>
            ) : (
              <button
                key={action.label}
                type="button"
                onClick={() => {
                  if (action.label === "Stay Here") {
                    handleStayHere();
                  } else {
                    action.onClick?.();
                    onDismiss();
                  }
                }}
                className="rounded-lg border border-current/20 bg-white/60 px-3 py-1.5 text-[11px] font-semibold"
              >
                {action.label}
              </button>
            )
          )}
        </div>
      )}
      {(!toast.actions || toast.actions.length === 0) && (
        <button
          type="button"
          onClick={onDismiss}
          className="mt-2 text-[10px] font-medium underline opacity-70"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (t: Omit<ToastPayload, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-3), { ...t, id }]);
      if (!t.actions?.length) {
        setTimeout(() => dismissToast(id), 8000);
      }
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 left-4 right-4 z-[100] flex flex-col items-end gap-2 pb-[env(safe-area-inset-bottom)] sm:left-auto sm:right-4 sm:max-w-sm">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDismiss={() => dismissToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/** Show a destination toast with workflow navigation actions. */
export function showDestinationToast(
  showToast: ToastContextValue["showToast"],
  opts: {
    message: string;
    destination?: string;
    destinationLabel?: string;
    destinationUrl?: string;
    bloomUrl?: string;
    videoUrl?: string;
    seoUrl?: string;
    workflowUrl?: string;
    nextOwner?: string;
    nextStep?: string;
    tone?: ToastPayload["tone"];
    withNavigation?: boolean;
  }
) {
  const actions: ToastAction[] | undefined = opts.withNavigation
    ? [
        ...(opts.bloomUrl ?? opts.destinationUrl
          ? [{ label: "Open Bloom", href: opts.bloomUrl ?? opts.destinationUrl!, variant: "primary" as const }]
          : []),
        ...(opts.videoUrl
          ? [{ label: "Open Video", href: opts.videoUrl, variant: "secondary" as const }]
          : []),
        ...(opts.seoUrl
          ? [{ label: "Open SEO", href: opts.seoUrl, variant: "secondary" as const }]
          : []),
        ...(opts.workflowUrl
          ? [{ label: "View Workflow", href: opts.workflowUrl, variant: "secondary" as const }]
          : []),
        { label: "Stay Here", variant: "secondary" as const },
      ]
    : undefined;

  showToast({
    title: "Approved",
    message: opts.message,
    destination: opts.destination,
    destinationLabel: opts.destinationLabel ?? "Now in:",
    nextOwner: opts.nextOwner,
    nextStep: opts.nextStep,
    tone: opts.tone ?? "success",
    actions,
    autoRedirectMs: opts.withNavigation && (opts.bloomUrl ?? opts.destinationUrl) ? 5000 : undefined,
    autoRedirectHref: opts.withNavigation ? (opts.bloomUrl ?? opts.destinationUrl) : undefined,
  });
}
