"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { FernExperiment } from "@/lib/types";

export function ExperimentTracker({ experiments }: { experiments: FernExperiment[] }) {
  if (experiments.length === 0) {
    return <p className="text-sm text-brand-muted">No experiments proposed.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {experiments.map((exp) => (
        <Card key={exp.id}>
          <CardContent className="py-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{exp.status}</Badge>
              <Badge variant="muted">{exp.effort} effort</Badge>
              <Badge variant={exp.expectedImpact >= 85 ? "danger" : "warning"}>Impact {exp.expectedImpact}</Badge>
            </div>
            <h4 className="mt-3 font-heading font-semibold text-brand-primary">{exp.name}</h4>
            <p className="mt-2 text-xs text-brand-muted">{exp.hypothesis}</p>
            {exp.results && <p className="mt-2 text-xs text-brand-primary">Results: {exp.results}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
