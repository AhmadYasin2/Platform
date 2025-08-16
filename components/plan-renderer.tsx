// components/plan-renderer.tsx
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { AdvisorPlan, Service } from "@/lib/advisor";

type Props = {
  plan: AdvisorPlan;
  catalogById: Record<string, Service>;
};

export default function PlanRenderer({ plan, catalogById }: Props) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Advisor Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm text-muted-foreground">{plan.rationale}</p>
          {plan.metrics?.length ? (
            <div className="text-sm">
              <span className="font-medium">Metrics:</span>{" "}
              {plan.metrics.map((m, i) => (
                <Badge key={i} variant="secondary" className="ml-1">{m}</Badge>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      {plan.swaps?.length ? (
        <Card>
          <CardHeader>
            <CardTitle>Suggested Swaps</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {plan.swaps.map((s, i) => (
              <div key={i} className="text-sm leading-relaxed">
                <span className="font-medium">
                  Drop: {catalogById[s.dropId]?.name ?? s.dropId}
                </span>
                {s.addId ? (
                  <>
                    {"  →  "}
                    <span className="font-medium">
                      Add: {catalogById[s.addId]?.name ?? s.addId}
                    </span>
                  </>
                ) : null}
                <div className="text-muted-foreground">{s.reason}</div>
                {i !== plan.swaps.length - 1 ? <Separator className="my-2" /> : null}
              </div>
            ))}
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2">
        {plan.phases.map((p, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {p.title}
                {Array.isArray(p.weeks) ? (
                  <Badge variant="outline">
                    Weeks {p.weeks[0]}–{p.weeks[1]}
                  </Badge>
                ) : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {p.goals?.length ? (
                <div className="text-sm">
                  <span className="font-medium">Goals:</span>{" "}
                  {p.goals.map((g, gi) => (
                    <Badge key={gi} variant="secondary" className="ml-1">{g}</Badge>
                  ))}
                </div>
              ) : null}
              <ul className="space-y-2">
                {p.services.map((s, si) => {
                  const svc = catalogById[s.id];
                  return (
                    <li key={si} className="text-sm">
                      <span className="font-medium">{svc?.name ?? s.id}</span>
                      {s.note ? <span className="text-muted-foreground"> — {s.note}</span> : null}
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
