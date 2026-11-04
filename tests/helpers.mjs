import assert from 'node:assert/strict';
import { newGame, HOUR } from '../src/game.ts';

// Each call creates independent state; ordinary new-game tests use newGame directly.
export function fundedGame(overrides = {}) {
  return { ...newGame(0), food: 100, time: 100 * HOUR, ...overrides };
}

export function qualifiedGame(careerLevel = 0) {
  return fundedGame({ courses: [1, 2, 3], qualifications: [1, 2, 3], equipment: [1, 2, 3], careerLevel });
}

export function close(actual, expected) {
  assert.ok(Math.abs(actual - expected) < 1e-8, `${actual} ≠ ${expected}`);
}
