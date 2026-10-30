<script lang="ts">
  import reports from '#lib/data/reports-4471.json';
  import notes from '#lib/data/desk-notes.json';
  import tickets from '#lib/data/tickets-4471.json';
  import { uniqueById, type Report } from '#lib/kb/causes';
  import { groupByProblem } from '#lib/kb/problems';
  import { tenantOf } from '#lib/kb/locales';

  let { ticket }: { ticket: number } = $props();

  const merged = $derived(uniqueById(reports as Report[]).filter((r) => r.mergedInto === ticket));
  const groups = $derived(groupByProblem(merged, tenantOf, notes.oneDayMove));
  const filed = (p: string) => (tickets.problems as Record<string, { issue: number; title: string }>)[p];
  const tags = (rs: Report[]) =>
    rs.reduce<Record<string, number>>((n, r) => ({ ...n, [r.meta.intakeTag]: (n[r.meta.intakeTag] ?? 0) + 1 }), {});
  const channels = (c: Record<string, number>) =>
    Object.entries(c)
      .sort((a, b) => b[1] - a[1])
      .map(([ch, n]) => `${ch} ×${n}`)
      .join(' · ');
</script>

<p class="sum">
  <strong>{merged.length}</strong> reports in #{ticket} ·
  <strong>{groups.length}</strong> {groups.length === 1 ? 'problem' : 'problems'} ·
  <strong>{groups.reduce((n, g) => n + g.reports.length, 0)}</strong> placed
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>intake tagged</th><th>seen</th><th>ticket</th></tr>
  </thead>
  <tbody>
    {#each groups as g (g.problem)}
      {@const t = filed(g.problem)}
      <tr class:missing={!t}>
        <td><code>{g.problem}</code></td>
        <td><strong>{g.reports.length}</strong></td>
        <td>{g.tenants.length}</td>
        <td class="muted">{channels(g.channels)}</td>
        <td class="muted">{channels(tags(g.reports))}</td>
        <td>{g.firstSeen} → {g.lastSeen}</td>
        <td>
          {#if t}<a href="{tickets.repo}/issues/{t.issue}">#{t.issue}</a> {t.title}{:else}no ticket yet{/if}
        </td>
      </tr>
    {/each}
  </tbody>
</table>

{#each groups as g (g.problem)}
  {#if g.problem === 'shift'}
    <p class="muted">One-day moves: {g.reports.map((r) => r.id).join(', ')}.</p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .missing td { background: var(--warn-bg); }
</style>
