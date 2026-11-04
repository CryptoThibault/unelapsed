export const STANDARD_DURATION_MS = 60 * 60 * 1_000;
export const TEST_DURATION_MS = 30 * 1_000;
export const INITIAL_DURATION_MS = STANDARD_DURATION_MS;
export const STORAGE_KEY = 'jeu-web.run.v1';

export interface Run {
  startedAt: number;
  deadline: number;
}

export function createRun(now = Date.now()): Run {
  return { startedAt: now, deadline: now + INITIAL_DURATION_MS };
}

export function remainingMs(run: Run, now = Date.now()): number {
  return Math.max(0, run.deadline - now);
}

export function survivalMs(run: Run, now = Date.now()): number {
  return Math.max(0, Math.min(now, run.deadline) - run.startedAt);
}

export function formatTime(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1_000);
  return [Math.floor(seconds / 3_600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, '0'))
    .join(':');
}

export function parseRun(raw: string | null): Run | null {
  if (raw === null) return null;
  try {
    const value: unknown = JSON.parse(raw);
    if (typeof value !== 'object' || value === null) return null;
    const candidate = value as Partial<Run>;
    if (
      typeof candidate.startedAt !== 'number' ||
      typeof candidate.deadline !== 'number' ||
      !Number.isFinite(candidate.startedAt) ||
      !Number.isFinite(candidate.deadline) ||
      candidate.startedAt < 0 ||
      candidate.deadline <= candidate.startedAt
    ) return null;
    return { startedAt: candidate.startedAt, deadline: candidate.deadline };
  } catch {
    return null;
  }
}

// Days are fixed 24-hour durations, avoiding ambiguous calendar months.
export function formatReserve(ms: number): string {
  const seconds = Math.ceil(Math.max(0, ms) / 1000);
  const days = Math.floor(seconds / 86_400);
  if (!days) return formatTime(ms);
  return `${days}d ${formatTime((seconds % 86_400) * 1000)}`;
}
