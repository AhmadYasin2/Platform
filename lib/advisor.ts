// lib/advisor.ts
import Groq from "groq-sdk";

export type Stage = "idea" | "mvp" | "post-mvp" | "scale";

export type Service = {
  id: string;
  name: string;
  category?: string;
  credits?: number;            // cost in your system units
  durationWeeks?: number;      // rough estimate
  prerequisites?: string[];    // service IDs that must come first
  stageFit?: Partial<Record<Stage, number>>; // 0..1 per stage
  impact?: Partial<Record<"pmf"|"gtm"|"tech"|"fundraising", number>>; // 0..1
};

export type StartupProfile = {
  name?: string;
  stage: Stage;
  sector?: string;
  goals: string[];            // e.g., ["validate PMF", "raise pre-seed"]
  constraints: {
    maxServices: number;
    maxCredits?: number;
    timelineWeeks?: number;
  };
};

export type AdvisorInput = {
  profile: StartupProfile;
  servicesCatalog: Service[];       // all available services (minimal metadata is fine)
  selectedServiceIds: string[];     // chosen by the startup (candidate set)
};

export type AdvisorPlan = {
  version: "1.0";
  rationale: string;
  recommended: {
    id: string;
    reason: string;
    score: number;
  }[];
  swaps: {
    dropId: string;
    addId?: string;
    reason: string;
  }[];
  phases: {
    title: string;          // e.g., "Phase 1: Weeks 0-4"
    weeks?: [number, number];
    goals: string[];
    services: { id: string; note?: string }[];
  }[];
  risks: string[];
  metrics: string[];
};

function dot(a: Record<string, number>, b: Record<string, number>): number {
  let s = 0;
  for (const k of Object.keys(a)) s += (a[k] ?? 0) * (b[k] ?? 0);
  return s;
}

function toImpactWeights(goals: string[]): Record<string, number> {
  const w: Record<string, number> = { pmf: 0, gtm: 0, tech: 0, fundraising: 0 };
  const text = goals.join(" ").toLowerCase();
  if (/pmf|product[- ]market|validation|mvp/.test(text)) w.pmf += 1;
  if (/growth|acquisition|gtm|marketing|sales/.test(text)) w.gtm += 1;
  if (/tech|scal(ing|able)|architecture|quality/.test(text)) w.tech += 1;
  if (/fund|raise|investor|pre[- ]?seed|seed|series/.test(text)) w.fundraising += 1;
  const sum = Object.values(w).reduce((a, b) => a + b, 0) || 1;
  for (const k of Object.keys(w)) w[k] = w[k] / sum;
  return w;
}

function baseScore(svc: Service, profile: StartupProfile, weights: Record<string, number>): number {
  const impactVec: Record<string, number> = {
    pmf: svc.impact?.pmf ?? 0,
    gtm: svc.impact?.gtm ?? 0,
    tech: svc.impact?.tech ?? 0,
    fundraising: svc.impact?.fundraising ?? 0,
  };
  const stage = svc.stageFit?.[profile.stage] ?? 0.5;
  const impactScore = dot(impactVec, weights);
  return 0.6 * impactScore + 0.4 * stage;
}

function pickSubset(
  candidates: Service[],
  profile: StartupProfile,
  weights: Record<string, number>
): { picked: Service[]; scored: Array<{svc: Service; score: number}> } {
  const scored = candidates.map((svc) => ({
    svc,
    score: baseScore(svc, profile, weights),
  }));

  const withRatio = scored.map((x) => ({
    ...x,
    ratio: x.score / (x.svc.credits && x.svc.credits > 0 ? x.svc.credits : 1),
  }));

  withRatio.sort((a, b) => b.ratio - a.ratio);

  const picked: Service[] = [];
  let usedCredits = 0;
  for (const it of withRatio) {
    if (picked.length >= profile.constraints.maxServices) break;
    if (
      typeof profile.constraints.maxCredits === "number" &&
      typeof it.svc.credits === "number"
    ) {
      if (usedCredits + (it.svc.credits ?? 0) > (profile.constraints.maxCredits ?? Infinity)) continue;
      usedCredits += it.svc.credits ?? 0;
    }
    picked.push(it.svc);
  }
  return { picked, scored };
}

function topoSortWithPrereqs(services: Service[]): Service[] {
  const map = new Map(services.map((s) => [s.id, s]));
  const visited = new Set<string>();
  const stack = new Set<string>();
  const out: Service[] = [];

  function visit(id: string) {
    if (visited.has(id)) return;
    if (stack.has(id)) return; // skip cycles
    stack.add(id);
    const svc = map.get(id);
    if (svc?.prerequisites) for (const pre of svc.prerequisites) if (map.has(pre)) visit(pre);
    stack.delete(id);
    visited.add(id);
    const s = map.get(id);
    if (s) out.push(s);
  }

  for (const s of services) visit(s.id);
  return out;
}

function groupIntoPhases(ordered: Service[], totalWeeks = 12) {
  const phases: { title: string; weeks: [number, number]; services: Service[] }[] = [];
  let cursor = 0;
  let phaseIdx = 1;
  let remaining = totalWeeks;

  for (const s of ordered) {
    const len = Math.max(1, Math.min(s.durationWeeks ?? 2, remaining));
    const start = cursor;
    const end = Math.min(totalWeeks, cursor + len);
    if (!phases.length || phases[phases.length - 1].weeks[1] < start) {
      phases.push({ title: `Phase ${phaseIdx++}`, weeks: [start, end], services: [s] });
    } else {
      phases[phases.length - 1].services.push(s);
      phases[phases.length - 1].weeks[1] = end;
    }
    cursor = end;
    remaining = Math.max(0, totalWeeks - cursor);
  }
  return phases;
}

function toCompactCatalog(services: Service[]) {
  return services.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category,
    credits: s.credits,
    durationWeeks: s.durationWeeks,
    prerequisites: s.prerequisites ?? [],
    impact: s.impact ?? {},
  }));
}

function systemPrompt() {
  return `You are an incubation advisor. The user gives:
- A startup profile (stage, sector, goals, constraints).
- A service catalog.
- A preselected candidate set.

TASK:
1) Validate and (if needed) swap candidates to better fit goals and constraints.
2) Sequence the final services into phases across the timeline.
3) Return STRICT JSON ONLY in the schema below. No prose outside JSON.

SCHEMA:
{
  "version":"1.0",
  "rationale":"string",
  "recommended":[{"id":"string","reason":"string","score":0.0}],
  "swaps":[{"dropId":"string","addId":"string","reason":"string"}],
  "phases":[{"title":"string","weeks":[start,end],"goals":["string"],"services":[{"id":"string","note":"string"}]}],
  "risks":["string"],
  "metrics":["string"]
}

GUIDELINES:
- Respect maxServices and maxCredits if provided.
- Prefer services with strong impact on the user's stated goals and stage.
- Satisfy prerequisites and order accordingly.
- Keep phases simple (2-4 services each) and goal-focused.
- Use service IDs consistently.`;
}

export async function generatePlanWithGroq(input: AdvisorInput): Promise<AdvisorPlan> {
  const weights = toImpactWeights(input.profile.goals);
  const candidates = input.servicesCatalog.filter(s => input.selectedServiceIds.includes(s.id));
  const { picked, scored } = pickSubset(candidates, input.profile, weights);
  const ordered = topoSortWithPrereqs(picked);
  const phases = groupIntoPhases(ordered, input.profile.constraints.timelineWeeks ?? 12);

  const planningContext = {
    profile: input.profile,
    catalog: toCompactCatalog(input.servicesCatalog),
    selectedServiceIds: input.selectedServiceIds,
    preselectionScores: scored.map(x => ({ id: x.svc.id, score: Number(x.score.toFixed(3)) })),
    preliminaryPhases: phases.map(p => ({
      title: p.title,
      weeks: p.weeks,
      services: p.services.map(s => ({ id: s.id })),
    })),
  };

  try {
    // ✅ Guard: if no key, trigger fallback
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) throw new Error("NO_GROQ_KEY");

    // ✅ Create client only after we know a key exists
    const groq = new Groq({ apiKey });

    const resp = await groq.chat.completions.create({
      model: "qwen/qwen3-32b",
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt() },
        { role: "user", content: JSON.stringify(planningContext) },
      ],
    } as any);

    const json = resp.choices?.[0]?.message?.content || "{}";
    const parsed = JSON.parse(json) as AdvisorPlan;
    if (!parsed?.recommended || !Array.isArray(parsed.phases)) throw new Error("Plan schema mismatch");
    return parsed;
  } catch (err: any) {
    // ✅ Fallback: heuristic plan if Groq is missing/unavailable/invalid output
    console.warn("Groq unavailable, using heuristic fallback:", err?.message ?? err);
    return {
      version: "1.0",
      rationale:
        "Fallback plan (LLM unavailable). Selected highest-impact services within constraints and ordered by prerequisites.",
      recommended: ordered.map(s => ({
        id: s.id,
        reason: "High heuristic score for current goals and stage.",
        score: Number(baseScore(s, input.profile, toImpactWeights(input.profile.goals)).toFixed(3)),
      })),
      swaps: [],
      phases: groupIntoPhases(ordered, input.profile.constraints.timelineWeeks ?? 12).map(p => ({
        title: `${p.title}: Weeks ${p.weeks[0]}-${p.weeks[1]}`,
        weeks: p.weeks,
        goals: input.profile.goals.slice(0, 2),
        services: p.services.map(s => ({ id: s.id })),
      })),
      risks: [
        "Prerequisite accuracy may be incomplete.",
        "Fixed-duration bucketing may not match real availability.",
      ],
      metrics: [
        "Activation rate",
        "Time-to-first-customer feedback",
        "Retention proxy (repeat usage)",
        "Fundraising readiness checklist coverage",
      ],
    };
  }
}
