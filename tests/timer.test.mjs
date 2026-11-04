import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, formatTime, formatReserve, parseRun, remainingMs, survivalMs } from '../src/timer.ts';

test('new run starts with one hour', () => {
  const run = createRun(1_000);
  assert.equal(remainingMs(run, 1_000), 3_600_000);
});
test('time continues while away, including after restoring a saved run', () => {
  const run = parseRun(JSON.stringify(createRun(1_000)));
  assert.equal(remainingMs(run, 16_000), 3_585_000);
  assert.equal(remainingMs(run, 3_700_000), 0);
  assert.equal(survivalMs(run, 3_700_000), 3_600_000);
});
test('zero occurs at the exact deadline and never becomes negative', () => {
  const run = createRun(1_000);
  assert.equal(remainingMs(run, 3_600_999), 1);
  assert.equal(remainingMs(run, 3_601_000), 0);
  assert.equal(remainingMs(run, 3_900_000), 0);
});
test('display rounds up until the actual deadline and supports one hour', () => {
  assert.equal(formatTime(1), '00:00:01');
  assert.equal(formatTime(0), '00:00:00');
  assert.equal(formatTime(3_600_000), '01:00:00');
});
test('invalid saves are rejected', () => {
  for (const raw of [null, 'bad json', '{}', 'null', '{"startedAt":50,"deadline":20}', '{"startedAt":"1","deadline":20}']) {
    assert.equal(parseRun(raw), null);
  }
});

test('reserve display supports days and months worth of time without a maximum', () => {
  assert.equal(formatReserve(3_600_000), '01:00:00');
  assert.equal(formatReserve(86_399_001), '1d 00:00:00');
  assert.equal(formatReserve(90 * 86_400_000 + 3_661_000), '90d 01:01:01');
  assert.equal(formatReserve(365 * 86_400_000), '365d 00:00:00');
});
