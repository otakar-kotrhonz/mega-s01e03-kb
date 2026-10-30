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
  type Filed = { issue: number; title: string; outcome: string; note: string; of?: string };
  const filed = (p: string) => (tickets.problems as Record<string, Filed>)[p];
  // How a ticket closed, from the engineering update; a duplicate names the ticket it merged into.
  const outcome = (t: Filed) => (t.of ? `merged into #${filed(t.of).issue}` : t.outcome);
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
  #{tickets.update.ticket} closed {tickets.update.closed} ({tickets.update.from})
</p>

<table>
  <thead>
    <tr><th>problem</th><th>reports</th><th>tenants</th><th>channels</th><th>intake tagged</th><th>seen</th><th>ticket</th><th>closed as</th></tr>
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
        <td>{#if t}<strong>{outcome(t)}</strong> <span class="muted">· {t.note}</span>{/if}</td>
      </tr>
    {/each}
  </tbody>
</table>

<ul class="muted">
  {#each groups as g (g.problem)}
    <li>
      <code>{g.problem}</code>: {g.tenants.map((h) => `${h} (${tenantOf({ tenant: h })?.form ?? 'no form on file'})`).join(', ')}
      · e.g. {g.reports[0].id}: “{g.reports[0].body}”
    </li>
  {/each}
</ul>

{#each groups as g (g.problem)}
  {#if g.problem === 'shift'}
    <p class="muted">
      One-day moves: {g.reports.map((r) => r.id).join(', ')}. Counted as the desk counts them: also in the
      row of the cause they are filed under.
    </p>
  {/if}
{/each}

<style>
  .sum { font-size: 1.1rem; }
  .muted { color: var(--muted); font-size: 0.85em; }
  .missing td { background: var(--warn-bg); }
</style>
