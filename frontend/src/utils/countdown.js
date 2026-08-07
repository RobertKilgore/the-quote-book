const MS_DAY = 86_400_000;

export function normalizeDeadline(deadlineAt) {
  if (deadlineAt === null || deadlineAt === undefined || deadlineAt === '') {
    return null;
  }

  const normalizedValue = String(deadlineAt).trim();
  if (!normalizedValue || ['null', 'none', 'undefined'].includes(normalizedValue.toLowerCase())) {
    return null;
  }

  const parsed = new Date(deadlineAt);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function getCountdownText(deadlineAt, now = Date.now()) {
  const normalizedDeadline = normalizeDeadline(deadlineAt);
  if (!normalizedDeadline) return null;

  const diff = normalizedDeadline.getTime() - now;
  if (diff <= 0) return 'Expired';

  const days = Math.floor(diff / MS_DAY);
  const hours = Math.floor((diff / 3_600_000) % 24).toString().padStart(2, '0');
  const minutes = Math.floor((diff / 60_000) % 60).toString().padStart(2, '0');
  const seconds = Math.floor((diff / 1_000) % 60).toString().padStart(2, '0');

  return `${days}:${hours}:${minutes}:${seconds}`;
}

export function formatCountdown(deadlineAt, now = Date.now()) {
  const normalizedDeadline = normalizeDeadline(deadlineAt);
  if (!normalizedDeadline) return null;

  const diffMs = normalizedDeadline.getTime() - now;
  if (diffMs <= 0) return 'Expired';

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);

  return parts.join(' ');
}
