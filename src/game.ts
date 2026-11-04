export const GAME_KEY = 'unelapsed.game.v21';
export const PREVIOUS_GAME_KEYS = Array.from({ length: 19 }, (_, i) => `unelapsed.game.v${20 - i}`);
export const HOUR = 3_600_000;
export const CHARACTER_HOURS_PER_TIMER_HOUR = 24;
export const FOOD_INTERVAL = 15 * 60_000;
export const FOOD_SHORTAGE_COST = 30 * 60_000;
export const SUPPLY_COST_MS = 2 * 60_000;
export const FOOD_DISPENSER_COST = 3 * 24 * HOUR;
export const WORK_REWARD = 3 * 60_000;
export const SKILLED_WORK_REWARD = 4 * 60_000;
export const TRAINING_COST = 10 * 60_000;
export const TRAINING_DURATION = 30 * 60_000;
export const CAREERS = [
  { name: 'Warehouse worker', energyCostPerMinute: 2.9, reward: WORK_REWARD, course: '', cost: 0, equipment: '', equipmentCost: 0 },
  { name: 'Machine operator', energyCostPerMinute: 2.8, reward: SKILLED_WORK_REWARD, course: 'Machine operation', cost: TRAINING_COST, equipment: 'Safety gear', equipmentCost: 10 * 60_000 },
  { name: 'Maintenance technician', energyCostPerMinute: 2.7, reward: 6 * 60_000, course: 'Technical maintenance', cost: HOUR, equipment: 'Tool kit', equipmentCost: HOUR },
  { name: 'Production supervisor', energyCostPerMinute: 2.6, reward: 8 * 60_000, course: 'Production management', cost: 4 * HOUR, equipment: 'Professional outfit', equipmentCost: 4 * HOUR },
] as const;
const VALID_WAGES = [2 * HOUR, 180_000, 240_000, 360_000, 480_000, 66_000, 75_000, 120_000, 960_000, 1_440_000, ...CAREERS.map(c => c.reward)];
export interface TimeChange { amount: number; reason: string; at: number }
export interface TrainingCompleted { kind: 'training-completed'; course: string; at: number }
export type GameNotification = TimeChange | TrainingCompleted;
export type GameNotificationListener = (change: GameNotification) => void;
function reportTimeChange(g: Game, amount: number, reason: string, notify?: GameNotificationListener): void {
  if (amount !== 0) notify?.({ amount, reason, at: g.updatedAt });
}
function spendTime(g: Game, cost: number, reason: string, notify?: GameNotificationListener): void {
  g.time -= cost;
  reportTimeChange(g, -cost, reason, notify);
}
export interface TrainingProgress { remaining: number; duration: number }

export const ENERGY_MAX = 100;
export const PASSIVE_ENERGY_DURATION_HOURS = 16;
export function characterHoursToTimerMs(hours: number): number { return hours * HOUR / CHARACTER_HOURS_PER_TIMER_HOUR; }
export const AWAKE_DURATION = characterHoursToTimerMs(PASSIVE_ENERGY_DURATION_HOURS);
export const PASSIVE_ENERGY_PER_MINUTE = ENERGY_MAX * 60_000 / AWAKE_DURATION;
export const TRAINING_ENERGY_PER_MINUTE = 2.8;
export const REST_LOSS_PER_HOUR = 100 * HOUR / AWAKE_DURATION;
const PREVIOUS_AWAKE_DURATION = 1_000_000;
export function restLossPerHour(g: Game): number {
  return g.job?.kind === 'sleep' ? 0 : g.job?.kind === 'work' ? workEnergyPerMinute(g.careerLevel) * 60 : g.job?.kind === 'training' ? TRAINING_ENERGY_PER_MINUTE * 60 : REST_LOSS_PER_HOUR;
}
export function timeUntilSleep(g: Game): number {
  return g.job?.kind === 'sleep' ? 0 : g.restMs / (g.job?.kind === 'work' ? workEnergyPerMinute(g.careerLevel) / PASSIVE_ENERGY_PER_MINUTE : g.job?.kind === 'training' ? TRAINING_ENERGY_PER_MINUTE / PASSIVE_ENERGY_PER_MINUTE : 1);
}
export const HOMELESS_SLEEP_DURATION = ENERGY_MAX / 4 * 60_000;
export const HOUSED_SLEEP_DURATION = ENERGY_MAX / 5 * 60_000;
export function energyLevel(g: Game): number { return restPercent(g); }
export function workEnergyPerMinute(level: number): number { return CAREERS[level]!.energyCostPerMinute; }
export function energyUsePerMinute(g: Game): number { return restLossPerHour(g) / 60; }
export function energyRecoveryPerMinute(g: Game): number { return ENERGY_MAX * 60_000 / fullRecoveryDuration(g); }
export const RENT_COST = 4 * HOUR;
export const RENT_DURATION = 24 * HOUR;
export const HOME_COST = 12 * 24 * HOUR;
export interface PausedWork { kind?: 'work' | 'training'; remaining: number; duration: number; reward: number; trainingLevel?: number }
export interface WorkTask { kind: 'work'; workedMs: number; reward: number; resumeWork: null }
export interface TimedTask { kind: 'sleep' | 'training'; endsAt: number; duration: number; reward: number; resumeWork: PausedWork | null; trainingLevel?: number; recovery?: number; resumeTask?: 'work' | CareerLevel }
export type Task = WorkTask | TimedTask;
export type CareerLevel = 1 | 2 | 3;
export type Action = `recruit-${0 | CareerLevel}` | `train-${CareerLevel}` | `equipment-${CareerLevel}` | `course-${CareerLevel}` | 'work' | 'eat' | 'sleep' | 'cancel' | 'rent' | 'home' | 'train' | 'pause-training' | 'cancel-work' | 'wake' | 'food-dispenser';
export interface Game {
  version: 21;
  startedAt: number;
  updatedAt: number;
  time: number;
  food: number;
  autoFood: boolean;
  careerLevel: number;
  courses: number[];
  qualifications: number[];
  equipment: number[];
  trainingProgress: Partial<Record<number, TrainingProgress>>;
  rentUntil: number;
  restMs: number;
  housing: 'homeless' | 'housed';
  nextFoodAt: number;
  job: Task | null;
  diedAt: number | null;
}
export function newGame(now = Date.now()): Game {
  return { version: 21, startedAt: now, updatedAt: now, time: HOUR, food: 0, autoFood: false, careerLevel: 0, courses: [], qualifications: [], equipment: [], trainingProgress: {}, rentUntil: 0, restMs: AWAKE_DURATION, housing: 'homeless', nextFoodAt: now + FOOD_INTERVAL, job: null, diedAt: null };
}
export function restPercent(g: Game): number { return Math.max(0, Math.min(100, g.restMs / AWAKE_DURATION * 100)); }
export function fullRecoveryDuration(g: Game): number { return g.housing === 'housed' || g.rentUntil > g.updatedAt ? HOUSED_SLEEP_DURATION : HOMELESS_SLEEP_DURATION; }
export function sleepDuration(g: Game): number {
  const missing = Math.max(0, AWAKE_DURATION - g.restMs);
  const slowRate = AWAKE_DURATION / HOMELESS_SLEEP_DURATION;
  const fastRate = AWAKE_DURATION / HOUSED_SLEEP_DURATION;
  if (g.housing === 'housed') return missing / fastRate;
  const fastTime = Math.min(Math.max(0, g.rentUntil - g.updatedAt), missing / fastRate);
  return fastTime + Math.max(0, missing - fastTime * fastRate) / slowRate;
}
function refreshSleep(g: Game): void {
  if (g.job?.kind !== 'sleep') return;
  const startedAt = g.job.endsAt - g.job.duration;
  g.job.endsAt = g.updatedAt + sleepDuration(g);
  g.job.duration = g.job.endsAt - startedAt;
}
function startSleep(g: Game, resumeTask?: 'work' | CareerLevel): void {
  const duration = sleepDuration(g);
  g.job = { kind: 'sleep', endsAt: g.updatedAt + duration, duration, reward: 0, resumeWork: null, ...(resumeTask !== undefined ? { resumeTask } : {}) };
}
export function workReward(g: Game): number { return CAREERS[g.careerLevel]!.reward; }
export function profession(g: Game): string { return CAREERS[g.careerLevel]!.name; }
export function nextTraining(g: Game) { return CAREERS.find((_, level) => level > 0 && !g.qualifications.includes(level)) ?? null; }
function trainingLevel(g: Game, action: Action): number { return action === 'train' ? CAREERS.indexOf(nextTraining(g)!) : Number(action.slice(6)); }
export function careerEligible(g: Game, level: number): boolean {
  return Number.isInteger(level) && level >= 0 && level < CAREERS.length && (level === 0 || g.qualifications.includes(level) && g.equipment.includes(level));
}
export function shopOwned(g: Game, action: Action): boolean {
  if (action === 'home') return g.housing === 'housed';
  if (action === 'food-dispenser') return g.autoFood;
  if (action.startsWith('course-')) return g.courses.includes(Number(action.slice(7)));
  if (action.startsWith('equipment-')) return g.equipment.includes(Number(action.slice(10)));
  return false;
}
function startWork(g: Game): void {
  g.job = { kind: 'work', workedMs: 0, reward: workReward(g), resumeWork: null };
}
function startTraining(g: Game, level: number): void {
  const progress = g.trainingProgress[level];
  g.job = { kind: 'training', trainingLevel: level, endsAt: g.updatedAt + (progress?.remaining ?? TRAINING_DURATION), duration: progress?.duration ?? TRAINING_DURATION, reward: 0, resumeWork: null };
  delete g.trainingProgress[level];
}
function pauseTraining(g: Game): void {
  if (g.job?.kind !== 'training') return;
  g.trainingProgress[g.job.trainingLevel!] = { remaining: g.job.endsAt - g.updatedAt, duration: g.job.duration };
}
export function pendingWage(g: Game): number { return g.job?.kind === 'work' ? g.job.workedMs * (g.job.reward / 60_000) : 0; }
function finishWork(g: Game, notify?: GameNotificationListener): void {
  if (g.job?.kind !== 'work') return;
  const wage = pendingWage(g);
  g.time += wage;
  reportTimeChange(g, wage, 'Work pay', notify);
  g.job = null;
}
export function advance(source: Game, now = Date.now(), notify?: GameNotificationListener): Game {
  const g: Game = { ...source, courses: [...source.courses], qualifications: [...source.qualifications], equipment: [...source.equipment], trainingProgress: { ...source.trainingProgress }, job: source.job?.kind === 'work' ? { ...source.job } : source.job ? { ...source.job, resumeWork: source.job.resumeWork ? { ...source.job.resumeWork } : null } : null };
  if (g.diedAt !== null) return g;
  // Remove automatic resumptions from older saves as well.
  if (g.job?.kind === 'sleep' && g.job.resumeWork) {
    const pending = g.job.resumeWork;
    if (pending.kind === 'training') g.trainingProgress[pending.trainingLevel ?? g.careerLevel + 1] = { remaining: pending.remaining, duration: pending.duration };
    g.job.resumeWork = null;
  }
  const target = Math.max(g.updatedAt, now);
  const die = () => { g.time = 0; g.diedAt = g.updatedAt; g.job = null; };
  while (g.updatedAt < target) {
    refreshSleep(g);
    const fatigueRate = energyUsePerMinute(g) / PASSIVE_ENERGY_PER_MINUTE;
    const exhaustionAt = g.job?.kind === 'sleep' ? Infinity : g.updatedAt + g.restMs / fatigueRate;
    const deathAt = g.updatedAt + g.time;
    const next = Math.min(target, g.nextFoodAt, g.job && g.job.kind !== 'work' ? g.job.endsAt : Infinity, deathAt, exhaustionAt, g.rentUntil > g.updatedAt ? g.rentUntil : Infinity);
    const elapsed = next - g.updatedAt;
    if (g.job?.kind === 'work') g.job.workedMs += elapsed;
    if (g.job?.kind === 'sleep') g.restMs = Math.min(AWAKE_DURATION, g.restMs + elapsed * (AWAKE_DURATION / fullRecoveryDuration(g)));
    else g.restMs = Math.max(0, g.restMs - elapsed * fatigueRate);
    // Epoch timestamps cannot represent tiny fractional milliseconds. Resolve
    // the selected boundary even when adding the remainder rounds back to now.
    if (next >= exhaustionAt || g.restMs < 1e-6) g.restMs = 0;
    g.time = Math.max(0, g.time - elapsed);
    g.updatedAt = next;
    if (next >= deathAt || g.time <= 0) { die(); break; }
    if (next >= g.nextFoodAt) {
      if (g.food > 0) g.food -= 1;
      else if (g.autoFood && g.time > SUPPLY_COST_MS) spendTime(g, SUPPLY_COST_MS, 'Automatic food', notify);
      else {
        const loss = Math.min(g.time, FOOD_SHORTAGE_COST);
        g.time -= FOOD_SHORTAGE_COST;
        reportTimeChange(g, -loss, 'Missed meal', notify);
      }
      g.nextFoodAt += FOOD_INTERVAL;
    }
    // Death, including a missed meal, wins a tie with payday.
    if (g.time <= 0) { die(); break; }
    if (g.job && g.job.kind !== 'work' && next >= g.job.endsAt) {
      if (g.job.kind === 'sleep') {
        const resumeTask = g.job.resumeTask;
        g.restMs = AWAKE_DURATION;
        g.job = null;
        if (resumeTask === 'work') startWork(g);
        else if (resumeTask !== undefined) startTraining(g, resumeTask);
      } else {
        const level = g.job.trainingLevel!;
        g.qualifications.push(level);
        notify?.({ kind: 'training-completed', course: CAREERS[level]!.course, at: g.updatedAt });
        g.job = null;
      }
    }
    if (g.restMs <= 0 && g.job?.kind !== 'sleep') {
      const resumeTask = g.job?.kind === 'work' ? 'work' : g.job?.kind === 'training' ? g.job.trainingLevel as CareerLevel : undefined;
      finishWork(g, notify);
      pauseTraining(g);
      startSleep(g, resumeTask);
    }
  }
  return g;
}
export function unavailable(g: Game, action: Action, foodQuantity = 1): string | null {
  if (g.diedAt !== null || g.time <= 0) return 'Game over';
  if (action.startsWith('recruit-')) {
    const level = Number(action.slice(8));
    if (!careerEligible(g, level)) return 'Certification and equipment required';
    if (g.careerLevel === level) return 'Current job';
    return g.job?.kind === 'work' ? 'Finish the current work first' : null;
  }
  if (action === 'pause-training') return g.job?.kind === 'training' || g.job?.resumeWork?.kind === 'training' || g.job?.kind === 'sleep' && typeof g.job.resumeTask === 'number' ? null : 'No active training';
  if (action === 'cancel-work') return g.job?.kind === 'work' || g.job?.kind === 'sleep' && g.job.resumeTask === 'work' || (g.job?.kind === 'sleep' && g.job.resumeWork && g.job.resumeWork.kind !== 'training') ? null : 'No active work';
  if (action === 'wake') return g.job?.kind === 'sleep' ? null : 'Not sleeping';
  if (action === 'cancel') return g.job ? null : 'No active task';
  if (action === 'work' || action === 'sleep' || action === 'train' || action.startsWith('train-')) {
    if (g.job) return 'Finish the current task first';
    if (action === 'train' || action.startsWith('train-')) {
      const level = trainingLevel(g, action);
      if (![1,2,3].includes(level)) return 'All training completed';
      if (g.qualifications.includes(level)) return 'Qualified';
      return g.courses.includes(level) ? null : 'Buy this training in the shop';
    }
    if (action === 'sleep' && g.restMs >= AWAKE_DURATION) return 'Energy full';
    return null;
  }
  if (action === 'food-dispenser') return g.autoFood ? 'Owned' : FOOD_DISPENSER_COST >= g.time ? 'Not enough time' : null;
  if ((action === 'home' || action === 'rent') && g.housing === 'housed') return 'Already owned';
  if (action.startsWith('course-')) {
    const level = Number(action.slice(7));
    if (![1,2,3].includes(level)) return 'Unknown training';
    if (g.courses.includes(level)) return 'Owned';
    return CAREERS[level]!.cost >= g.time ? 'Not enough time' : null;
  }
  if (action.startsWith('equipment-')) {
    const level = Number(action.slice(10));
    if (![1,2,3].includes(level)) return 'Unknown equipment';
    if (g.equipment.includes(level)) return 'Owned';
    return CAREERS[level]!.equipmentCost >= g.time ? 'Not enough time' : null;
  }
  if (action === 'eat' && (!Number.isSafeInteger(foodQuantity) || foodQuantity < 1 || !Number.isSafeInteger(g.food + foodQuantity) || !Number.isSafeInteger(foodQuantity * SUPPLY_COST_MS))) return 'Choose a whole number of meals';
  const cost = action === 'rent' ? RENT_COST : action === 'home' ? HOME_COST : foodQuantity * SUPPLY_COST_MS;
  return cost >= g.time ? 'Not enough time' : null;
}
export function act(source: Game, action: Action, now = Date.now(), notify?: GameNotificationListener, foodQuantity = 1): Game {
  const g = advance(source, now, notify);
  if (unavailable(g, action, foodQuantity)) return g;
  if (action.startsWith('recruit-')) g.careerLevel = Number(action.slice(8));
  if (action === 'work') startWork(g);
  if (action === 'train' || action.startsWith('train-')) startTraining(g, trainingLevel(g, action));
  if (action.startsWith('course-')) {
    const level = Number(action.slice(7));
    const career = CAREERS[level]!;
    spendTime(g, career.cost, `Training · ${career.course}`, notify);
    g.courses.push(level);
  }
  if (action.startsWith('equipment-')) {
    const level = Number(action.slice(10));
    const career = CAREERS[level]!;
    spendTime(g, career.equipmentCost, career.equipment, notify);
    g.equipment.push(level);
  }
  if (action === 'food-dispenser') {
    spendTime(g, FOOD_DISPENSER_COST, 'Food dispenser', notify);
    g.autoFood = true;
  }
  if (action === 'sleep') startSleep(g);
  if (action === 'pause-training' || (action === 'cancel' && g.job?.kind === 'training')) {
    if (g.job?.kind === 'training') {
      pauseTraining(g);
      g.job = null;
    } else if (g.job?.resumeWork?.kind === 'training') {
      const pending = g.job.resumeWork;
      g.trainingProgress[pending.trainingLevel ?? g.careerLevel + 1] = { remaining: pending.remaining, duration: pending.duration };
      g.job.resumeWork = null;
    }
    if (g.job?.kind === 'sleep') delete g.job.resumeTask;
    return g;
  }
  if (action === 'cancel-work') {
    finishWork(g, notify);
    if (g.job?.kind === 'sleep') delete g.job.resumeTask;
    return g;
  }
  if (action === 'cancel' || action === 'wake') {
    if (g.job?.kind === 'work') { finishWork(g, notify); return g; }
    if (g.job?.kind === 'sleep' && g.restMs <= 0) return g;
    g.job = null;
    // At exactly zero rest the automatic sleep rule still applies.
    if (g.restMs <= 0) startSleep(g);
  }
  if (action === 'rent') { spendTime(g, RENT_COST, 'Rent home', notify); g.rentUntil = Math.max(g.updatedAt, g.rentUntil) + RENT_DURATION; }
  if (action === 'home') { spendTime(g, HOME_COST, 'Buy home', notify); g.housing = 'housed'; }
  if (action === 'eat') {
    const cost = foodQuantity * SUPPLY_COST_MS;
    g.time -= cost;
    g.food += foodQuantity;
    reportTimeChange(g, -cost, 'Food', notify);
  }
  refreshSleep(g);
  return g;
}
export function parseGame(raw: string | null): Game | null {
  if (!raw) return null;
  try {
    const g = JSON.parse(raw) as Game;
    if (!g || g.version !== 21 || !Number.isInteger(g.careerLevel) || g.careerLevel < 0 || g.careerLevel >= CAREERS.length) return null;
    if (g.autoFood === undefined) g.autoFood = false;
    if (typeof g.autoFood !== 'boolean') return null;
    for (const list of [g.courses, g.qualifications, g.equipment]) {
      if (!Array.isArray(list) || list.some(level => !Number.isInteger(level) || level < 1 || level > 3) || new Set(list).size !== list.length) return null;
    }
    if (g.qualifications.some(level => !g.courses.includes(level))) return null;
    if (!careerEligible(g, g.careerLevel)) return null;
    for (const n of [g.startedAt, g.updatedAt, g.time, g.food, g.rentUntil, g.restMs, g.nextFoodAt]) if (typeof n !== 'number' || !Number.isFinite(n) || n < 0) return null;
    if (!['homeless','housed'].includes(g.housing)) return null;
    if (g.updatedAt < g.startedAt || g.restMs > AWAKE_DURATION || !Number.isInteger(g.food) || (g.diedAt === null && g.nextFoodAt <= g.updatedAt)) return null;
    if (g.diedAt !== null && (typeof g.diedAt !== 'number' || !Number.isFinite(g.diedAt) || g.diedAt < g.startedAt || g.diedAt > g.updatedAt || g.time !== 0 || g.job !== null)) return null;
    if (g.time === 0 && g.diedAt === null) return null;
    if (g.job !== null) {
      const job = g.job;
      if (!job) return null;
      if ('resumeTask' in job && job.kind !== 'sleep') return null;
      if (job.kind !== 'work' && (!Number.isFinite(job.endsAt) || job.endsAt <= g.updatedAt || !Number.isFinite(job.duration) || job.duration <= 0 || job.endsAt - g.updatedAt > job.duration + 1e-3)) return null;
      if (job.kind === 'work') {
        if (!CAREERS.some(c => c.reward === job.reward) || !Number.isFinite(job.workedMs) || job.workedMs < 0 || job.workedMs > g.updatedAt - g.startedAt + 1e-3 || job.resumeWork !== null || g.restMs <= 0) return null;
      } else if (job.kind === 'training') {
        if (job.reward !== 0 || !Number.isInteger(job.trainingLevel) || job.trainingLevel! < 1 || job.trainingLevel! > 3 || g.qualifications.includes(job.trainingLevel!) || !g.courses.includes(job.trainingLevel!) || job.resumeWork !== null || g.restMs <= 0) return null;
      } else if (job.kind === 'sleep') {
        if (job.reward !== 0 || g.restMs >= AWAKE_DURATION) return null;
        if (job.resumeTask !== undefined && job.resumeTask !== 'work') {
          const level = job.resumeTask;
          if (![1,2,3].includes(level) || !g.courses.includes(level) || g.qualifications.includes(level) || !g.trainingProgress?.[level]) return null;
        }
        if (job.resumeTask !== undefined && job.resumeWork !== null) return null;
        const paused = job.resumeWork;
        if (paused !== null) {
          if (!paused || !Number.isFinite(paused.remaining) || paused.remaining <= 0 || !Number.isFinite(paused.duration) || paused.duration < paused.remaining) return null;
          if (paused.kind === 'training') { if (paused.reward !== 0 || !nextTraining(g)) return null; }
          else if ((paused.kind !== undefined && paused.kind !== 'work') || !VALID_WAGES.includes(paused.reward)) return null;
        }
      } else return null;
    } else if (g.diedAt === null && g.restMs <= 0) return null;
    if (!g.trainingProgress || typeof g.trainingProgress !== 'object' || Array.isArray(g.trainingProgress)) return null;
    for (const [key, pending] of Object.entries(g.trainingProgress)) {
      const level = Number(key);
      if (![1,2,3].includes(level) || String(level) !== key || g.qualifications.includes(level) || !g.courses.includes(level) || g.job?.kind === 'training' && g.job.trainingLevel === level) return null;
      if (!pending || !Number.isFinite(pending.remaining) || pending.remaining <= 0 || !Number.isFinite(pending.duration) || pending.duration < pending.remaining) return null;
    }
    return g;
  } catch { return null; }
}
// Old prototypes retain their saved balance and food; removed tasks are cancelled.
// The new food schedule starts at the update, without retroactive shortage charges.
export function migrateGame(raw: string | null, now = Date.now()): Game | null {
  if (!raw) return null;
  try {
    const old = JSON.parse(raw);
    if (old?.version === 20) {
      const previousCapacity = characterHoursToTimerMs(17);
      if (!Number.isFinite(old.restMs) || old.restMs < 0 || old.restMs > previousCapacity) return null;
      const restMs = old.restMs / previousCapacity * AWAKE_DURATION;
      const converted = parseGame(JSON.stringify({ ...old, version: 21, restMs }));
      return converted ? advance(converted, now) : null;
    }
    if (old?.version === 19) {
      if (!Number.isFinite(old.restMs) || old.restMs < 0 || old.restMs > 50 * 60_000) return null;
      const restMs = old.restMs / (50 * 60_000) * characterHoursToTimerMs(17);
      const converted = migrateGame(JSON.stringify({ ...old, version: 20, restMs }), old.updatedAt);
      return converted ? advance(converted, now) : null;
    }
    if (old?.version === 18) {
      if (!Number.isFinite(old.restMs) || old.restMs < 0 || old.restMs > 45 * 60_000) return null;
      const restMs = old.restMs / (45 * 60_000) * (50 * 60_000);
      const converted = migrateGame(JSON.stringify({ ...old, version: 19, restMs }), old.updatedAt);
      return converted ? advance(converted, now) : null;
    }
    if (old?.version === 17) {
      if (!Number.isFinite(old.restMs) || old.restMs < 0 || old.restMs > 2 * HOUR) return null;
      const restMs = old.restMs / (2 * HOUR) * (45 * 60_000);
      const converted = migrateGame(JSON.stringify({ ...old, version: 18, restMs }), old.updatedAt);
      return converted ? advance(converted, now) : null;
    }
    if (old?.version === 16) {
      const nextFoodAt = old.diedAt === null ? old.updatedAt + (old.nextFoodAt - old.updatedAt) * FOOD_INTERVAL / 360_000 : old.nextFoodAt;
      const converted = migrateGame(JSON.stringify({ ...old, version: 17, nextFoodAt }), old.updatedAt);
      return converted ? advance(converted, now) : null;
    }
    if (old?.version === 15) {
      let job = old.job;
      if (job?.kind === 'work') {
        if (!Number.isFinite(job.duration) || job.duration <= 0 || !Number.isFinite(job.endsAt)) return null;
        job = { kind: 'work', workedMs: Math.max(0, job.duration - (job.endsAt - old.updatedAt)), reward: CAREERS[old.careerLevel as number]?.reward, resumeWork: null };
      }
      const converted = migrateGame(JSON.stringify({ ...old, version: 16, job }), old.updatedAt);
      return converted ? advance(converted, now) : null;
    }
    if (old?.version === 14) {
      if (!Number.isFinite(old.restMs) || old.restMs < 0 || old.restMs > PREVIOUS_AWAKE_DURATION) return null;
      const restMs = old.restMs / PREVIOUS_AWAKE_DURATION * (2 * HOUR);
      const converted = migrateGame(JSON.stringify({ ...old, version: 15, restMs }), old.updatedAt);
      return converted ? advance(converted, now) : null;
    }
    if (old?.version === 13) {
      const courses = [...new Set([...(old.qualifications ?? []), ...Object.keys(old.trainingProgress ?? {}).map(Number), ...(old.job?.kind === 'training' ? [old.job.trainingLevel] : []), ...(old.job?.resumeWork?.kind === 'training' ? [old.job.resumeWork.trainingLevel ?? old.careerLevel + 1] : [])])];
      const trainingProgress = Object.fromEntries(Object.entries(old.trainingProgress ?? {}).map(([level, progress]) => {
        const p = progress as TrainingProgress;
        return [level, { remaining: p.remaining / p.duration * TRAINING_DURATION, duration: TRAINING_DURATION }];
      }));
      const job = old.job ? { ...old.job } : null;
      if (job?.kind === 'training') {
        job.endsAt = old.updatedAt + (job.endsAt - old.updatedAt) / job.duration * TRAINING_DURATION;
        job.duration = TRAINING_DURATION;
      }
      if (job?.kind === 'sleep' && job.resumeWork?.kind === 'training') {
        const pending = job.resumeWork;
        job.resumeWork = { ...pending, remaining: pending.remaining / pending.duration * TRAINING_DURATION, duration: TRAINING_DURATION };
      }
      const converted = migrateGame(JSON.stringify({ ...old, version: 14, courses, trainingProgress, job }), old.updatedAt);
      return converted ? advance(converted, now) : null;
    }
    if (old?.version === 9 || old?.version === 10 || old?.version === 11 || old?.version === 12) {
      const level = old.version === 12 ? old.careerLevel : old.trained === true ? 1 : 0;
      if (!Number.isInteger(level) || level < 0 || level > 3) return null;
      const unlocked = [1,2,3].filter(n => n <= level);
      const job = old.job ? { ...old.job } : null;
      if (job?.kind === 'training') job.trainingLevel = level + 1;
      const trainingProgress = old.version === 12 && old.pausedTraining ? { [level + 1]: old.pausedTraining } : {};
      const converted = migrateGame(JSON.stringify({ ...old, version: 13, careerLevel: level, qualifications: unlocked, equipment: unlocked, trainingProgress, job }), old.updatedAt);
      if (!converted) return null;
      if (old.version === 9 && converted.rentUntil > converted.updatedAt) converted.rentUntil += 6 * HOUR - 6 * 60_000;
      return advance(converted, now);
    }
    if (!old || ![2,3,4,5,6,7,8].includes(old.version)) return null;
    for (const value of [old.startedAt,old.updatedAt,old.time,old.food]) if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return null;
    if (old.updatedAt < old.startedAt || (old.diedAt !== null && (typeof old.diedAt !== 'number' || !Number.isFinite(old.diedAt) || old.diedAt < old.startedAt || old.diedAt > old.updatedAt))) return null;
    const g = newGame(old.updatedAt);
    g.startedAt = old.startedAt;
    g.time = old.time;
    if (old.version === 8) {
      if (!Number.isInteger(old.innTickets) || old.innTickets < 0) return null;
      g.time += old.innTickets * 300_000; // Refund unused items removed from the shop.
      if (old.job?.kind === 'sleep' && old.job.recovery === 15) g.rentUntil = old.updatedAt + 6 * HOUR;
    }
    g.food = old.version === 2 ? 0 : Math.ceil(old.food);
    g.diedAt = old.diedAt;
    if (old.housing === 'housed') g.housing = 'housed';
    if (old.version >= 6) {
      if (!Number.isFinite(old.restMs) || old.restMs < 0 || old.restMs > PREVIOUS_AWAKE_DURATION) return null;
      g.restMs = old.restMs / PREVIOUS_AWAKE_DURATION * AWAKE_DURATION;
    }
    if (old.version >= 6 && old.job?.kind === 'sleep') {
      if (old.job.resumeWork?.kind === 'training') g.trainingProgress[1] = { remaining: old.job.resumeWork.remaining, duration: old.job.resumeWork.duration };
      if (g.trainingProgress[1]) g.courses.push(1);
      startSleep(g);
    } else if (old.job && old.job.kind !== 'train') {
      if (!Number.isFinite(old.job.endsAt) || old.job.endsAt <= old.updatedAt || !VALID_WAGES.includes(old.job.reward)) return null;
      g.job = { kind: 'work', workedMs: Math.max(0, (old.job.duration ?? 60_000) - (old.job.endsAt - old.updatedAt)), reward: workReward(g), resumeWork: null };
    }
    g.nextFoodAt = Math.max(now,old.updatedAt) + FOOD_INTERVAL;
    const valid = parseGame(JSON.stringify(g));
    return valid ? advance(valid,now) : null;
  } catch { return null; }
}
