export const CLOCK_KEY = 'unelapsed.dev-clock.v1';
export const SPEEDS = [1, 2, 4, 8, 16, 32, 64, 128, 256, 512] as const;
export type Speed = typeof SPEEDS[number];
export interface GameClock { realAt: number; gameAt: number; speed: Speed }
export function newClock(now = Date.now()): GameClock { return { realAt: now, gameAt: now, speed: 1 }; }
export function clockNow(clock: GameClock, realNow = Date.now()): number {
  return clock.gameAt + Math.max(0, realNow - clock.realAt) * clock.speed;
}
export function setSpeed(clock: GameClock, speed: Speed, realNow = Date.now()): GameClock {
  if (!SPEEDS.includes(speed)) throw new Error('Unsupported speed');
  return { realAt: Math.max(clock.realAt, realNow), gameAt: clockNow(clock, realNow), speed };
}
export function parseClock(raw: string | null): GameClock | null {
  try {
    if (!raw) return null;
    const c = JSON.parse(raw) as GameClock;
    if (!c || !SPEEDS.includes(c.speed)) return null;
    for (const n of [c.realAt, c.gameAt]) if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
    return { realAt: c.realAt, gameAt: c.gameAt, speed: c.speed };
  } catch { return null; }
}
