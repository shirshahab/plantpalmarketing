"use client";

import { Component, type ReactNode } from "react";

/**
 * Phase 33 — client error boundary. Wrap any interactive panel that renders
 * live data so one malformed item never takes down the whole page.
 */
export class PanelErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error("[PanelErrorBoundary]", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="rounded-2xl border border-brand-border/50 bg-white/90 px-4 py-3 text-xs text-brand-muted shadow">
            No pulse data yet. Agents will report here after their next run.
          </div>
        )
      );
    }
    return this.props.children;
  }
}
