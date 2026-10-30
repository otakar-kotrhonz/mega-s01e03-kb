// What #4471 is made of, problem by problem. causes.ts says which code path flipped a date;
// this file also keeps the reports where no date flipped at all: they moved by one day.
import { causeOf, type Report, type Tenant } from '#lib/kb/causes';

export type Problem = 'parser' | 'hint' | 'shift';

// `shift` is the desk's own reading (desk-notes.json, oneDayMove): the date lands one day early,
// day and month are not swapped. Neither code path in causes.ts produces that. The desk counts
// these where they are filed (by tenant, so mostly `parser`) and lists them again as `shift`.
export function problemsOf(r: Report, t: Tenant | undefined, oneDayMove: readonly string[]): (Problem | 'unplaced')[] {
  const filed = causeOf(r, t) ?? 'unplaced';
  return oneDayMove.includes(r.id) ? [filed, 'shift'] : [filed];
}

export type ProblemGroup = {
  problem: Problem | 'unplaced';
  reports: Report[];
  tenants: string[];
  channels: Record<string, number>;
  firstSeen: string;
  lastSeen: string;
};

export function groupByProblem(
  reports: Report[],
  tenantOf: (r: Report) => Tenant | undefined,
  oneDayMove: readonly string[],
): ProblemGroup[] {
  const by = new Map<ProblemGroup['problem'], Report[]>();
  for (const r of reports) {
    for (const p of problemsOf(r, tenantOf(r), oneDayMove)) by.set(p, [...(by.get(p) ?? []), r]);
  }
  return [...by.entries()]
    .map(([problem, rs]) => {
      const days = rs.map((r) => r.receivedAt.slice(0, 10)).sort();
      return {
        problem,
        reports: rs,
        tenants: [...new Set(rs.map((r) => r.tenant))].sort(),
        channels: rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.channel]: (n[r.channel] ?? 0) + 1 }), {}),
        firstSeen: days[0],
        lastSeen: days[days.length - 1],
      };
    })
    .sort((a, b) => b.reports.length - a.reports.length);
}
