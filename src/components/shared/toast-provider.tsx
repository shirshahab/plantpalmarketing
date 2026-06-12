"use client";

import { createContext, useCallback, useContext, useState } from "react";

export interface ToastPayload {
  id: string;
  title: string;
  message: string;
  destination?: string;
  nextOwner?: string;
  nextStep?: string;
  tone?: "success" | "warning" | "info";
}

interface ToastContextValue {
  toasts: ToastPayload[];
  showToast: (t: Omit<ToastPayload, "id">) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastPayload[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (t: Omit<ToastPayload, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setToasts((prev) => [...prev.slice(-4), { ...t, id }]);
      setTimeout(() => dismissToast(id), 6000);
    },
    [dismissToast]
  );

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex max-w-sm flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto rounded-xl border px-4 py-3 shadow-lg ${
              t.tone === "warning"
                ? "border-amber-200 bg-amber-50 text-amber-950"
                : t.tone === "info"
                  ? "border-sky-200 bg-sky-50 text-sky-950"
                  : "border-emerald-200 bg-emerald-50 text-emerald-950"
            }`}
          >
            <p className="text-sm font-semibold">{t.title}</p>
            <p className="mt-0.5 text-xs opacity-90">{t.message}</p>
            {(t.destination || t.nextOwner) && (
              <p className="mt-1 text-[11px] opacity-75">
                {t.destination ? `→ ${t.destination}` : ""}
                {t.nextOwner ? ` · Owner: ${t.nextOwner}` : ""}
                {t.nextStep ? ` · Next: ${t.nextStep}` : ""}
              </p>
            )}
            <button
              type="button"
              onClick={() => dismissToast(t.id)}
              className="mt-1 text-[10px] font-medium underline opacity-70"
            >
              Dismiss
            </button>
          </div>
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

/** Convenience — show a Phase 40 destination toast from server action results. */
export function showDestinationToast(
  showToast: ToastContextValue["showToast"],
  opts: {
    message: string;
    destination?: string;
    nextOwner?: string;
    nextStep?: string;
    tone?: ToastPayload["tone"];
  }
) {
  showToast({
    title: opts.message.split(".")[0] || opts.message,
    message: opts.message,
    destination: opts.destination,
    nextOwner: opts.nextOwner,
    nextStep: opts.nextStep,
    tone: opts.tone ?? "success",
  });
}
