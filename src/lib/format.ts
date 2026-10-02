export function pct(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function pctPoints(value: number): string {
  const pts = Math.round(value * 100);
  return `${pts > 0 ? "+" : ""}${pts} pts`;
}

export function formatRank(value: number | null): string {
  if (value === null || Number.isNaN(value)) return "—";
  return value.toFixed(1);
}
