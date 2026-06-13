"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

const CLASSIFICATION_LABELS: Record<string, string> = {
  community_opportunity: "Community",
  content_idea: "Content idea",
  seo_topic: "SEO topic",
  competitor_alert: "Competitor",
  creator_opportunity: "Creator",
  product_feedback: "Product feedback",
  ignore: "Ignore",
};

export function IntelligenceAlertsFilters({
  options,
}: {
  options: {
    statuses: string[];
    classifications: string[];
    priorities: string[];
    agents: string[];
  };
}) {
  const searchParams = useSearchParams();
  const current = {
    status: searchParams.get("status") ?? "",
    classification: searchParams.get("classification") ?? "",
    priority: searchParams.get("priority") ?? "",
    assigned_agent: searchParams.get("assigned_agent") ?? "",
  };

  function hrefFor(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    return qs ? `/intelligence?${qs}` : "/intelligence";
  }

  const hasFilters = Object.values(current).some(Boolean);

  return (
    <div className="mb-6 flex flex-wrap items-end gap-3 rounded-2xl border border-brand-border bg-white p-4">
      <FilterSelect
        label="Status"
        paramKey="status"
        value={current.status}
        options={options.statuses}
        hrefFor={hrefFor}
      />
      <FilterSelect
        label="Classification"
        paramKey="classification"
        value={current.classification}
        options={options.classifications}
        labels={CLASSIFICATION_LABELS}
        hrefFor={hrefFor}
      />
      <FilterSelect
        label="Priority"
        paramKey="priority"
        value={current.priority}
        options={options.priorities}
        hrefFor={hrefFor}
      />
      <FilterSelect
        label="Assigned agent"
        paramKey="assigned_agent"
        value={current.assigned_agent}
        options={options.agents}
        hrefFor={hrefFor}
      />
      {hasFilters && (
        <Link
          href="/intelligence"
          className="rounded-lg border border-brand-border px-3 py-2 text-xs font-medium text-brand-muted hover:bg-brand-bg"
        >
          Clear filters
        </Link>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  paramKey,
  value,
  options,
  labels,
  hrefFor,
}: {
  label: string;
  paramKey: string;
  value: string;
  options: string[];
  labels?: Record<string, string>;
  hrefFor: (key: string, value: string) => string;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs">
      <span className="font-semibold text-brand-muted">{label}</span>
      <select
        className="min-w-[140px] rounded-lg border border-brand-border bg-white px-2 py-1.5 text-sm text-brand-primary"
        value={value}
        onChange={(e) => {
          window.location.href = hrefFor(paramKey, e.target.value);
        }}
      >
        <option value="">All</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {labels?.[opt] ?? opt}
          </option>
        ))}
      </select>
    </label>
  );
}
