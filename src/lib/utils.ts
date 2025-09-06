export function formatDate(dateIso: string): string {
  return new Date(dateIso).toLocaleDateString();
}

export function enhanceSummary(summary: string): string {
  const s = summary?.trim() || '';
  return s.length < 10 ? `Refined: ${s}` : `${s} — refined`;
}

export function generateDetails(
  templateFields: { id: string; name: string; prompt?: string; type: string }[],
  context: { worldSummary?: string; entitySummary?: string; links?: { label: string; toName: string }[] }
): Record<string, unknown> {
  const base = `${context.entitySummary ?? ''} | ${context.worldSummary ?? ''} | ${(context.links ?? []).map(l => `${l.label}:${l.toName}`).join(', ')}`.trim();
  const out: Record<string, unknown> = {};
  for (const f of templateFields) {
    const isSelect = f.type === 'select' || f.type === 'multiSelect';
    out[f.id] = f.prompt
      ? `${f.prompt}: ${base}`
      : isSelect
        ? ''
        : `Auto: ${f.name} — ${base}`;
  }
  return out;
}
