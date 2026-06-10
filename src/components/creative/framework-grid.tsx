import { CONTENT_TYPES } from "@/lib/creative/framework";

export function FrameworkGrid() {
  return (
    <div className="mb-8">
      <h2 className="font-heading mb-4 text-lg font-semibold text-brand-primary">
        Content Framework
      </h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {CONTENT_TYPES.map((type) => (
          <div
            key={type.key}
            className="rounded-2xl border border-brand-border bg-white p-4 transition hover:border-brand-sage hover:shadow-sm"
          >
            <h3 className="font-heading text-sm font-semibold text-brand-primary">
              {type.label}
            </h3>
            <p className="mt-1 text-xs text-brand-muted">{type.description}</p>
            <ul className="mt-2 space-y-0.5">
              {type.examples.map((ex) => (
                <li key={ex} className="text-xs text-brand-sage">
                  · {ex}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
