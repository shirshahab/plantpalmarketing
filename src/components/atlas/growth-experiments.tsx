"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { AtlasExperiment } from "@/lib/types";

export function GrowthExperiments({ experiments }: { experiments: AtlasExperiment[] }) {
  if (experiments.length === 0) {
    return <p className="text-sm text-brand-muted">No experiments proposed. Run growth brief.</p>;
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {experiments.map((exp) => (
        <Card key={exp.id}>
          <CardContent className="py-5">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="info">{exp.status}</Badge>
              <Badge variant="muted">{exp.effort} effort</Badge>
              <Badge variant={exp.priorityScore >= 85 ? "danger" : "warning"}>Score {exp.priorityScore}</Badge>
            </div>
            <h4 className="mt-3 font-heading font-semibold text-brand-primary">{exp.name}</h4>
            <p className="mt-2 text-xs text-brand-muted"><span className="font-medium">Hypothesis:</span> {exp.hypothesis}</p>
            <p className="mt-1 text-xs text-emerald-800"><span className="font-medium">Expected:</span> {exp.expectedOutcome}</p>
            {exp.results && <p className="mt-2 text-xs text-brand-primary">Results: {exp.results}</p>}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
