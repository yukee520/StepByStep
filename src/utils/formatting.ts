export function formatScore(score: number): string {
  if (!Number.isFinite(score) || score < 0) {
    return '0000000';
  }
  return Math.floor(score).toString().padStart(7, '0');
}

export function formatCombo(combo: number): string {
  if (!Number.isFinite(combo) || combo < 0) {
    return '0';
  }
  return Math.floor(combo).toString();
}

export function formatPercent(value: number, digits = 2): string {
  if (!Number.isFinite(value)) {
    return '0.00%';
  }
  return `${value.toFixed(digits)}%`;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B';
  }
  const units = ['B', 'KB', 'MB', 'GB'];
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );
  const value = bytes / Math.pow(1024, exponent);
  const digits = exponent === 0 ? 0 : value < 10 ? 1 : 0;
  return `${value.toFixed(digits)} ${units[exponent]}`;
}

export function formatSignedMs(ms: number): string {
  if (!Number.isFinite(ms)) {
    return '0 ms';
  }
  const rounded = Math.round(ms);
  if (rounded > 0) {
    return `+${rounded} ms`;
  }
  return `${rounded} ms`;
}

export function formatDate(timestamp: number): string {
  if (!Number.isFinite(timestamp) || timestamp <= 0) {
    return '—';
  }
  const d = new Date(timestamp);
  const year = d.getFullYear();
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}