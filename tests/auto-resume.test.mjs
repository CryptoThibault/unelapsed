import test from 'node:test';
import assert from 'node:assert/strict';
import { act, advance, parseGame, HOUR, AWAKE_DURATION } from '../src/game.ts';
import { fundedGame } from './helpers.mjs';

function exhausted(action) {
  const rate = action === 'work' ? 2.9 : 2.8;
  return advance(act(fundedGame({ courses: [1], restMs: 1000 * rate / 2.5 }), action, 0), 1000);
}

test('offline work resumes across repeated sleep cycles exactly as incremental play', () => {
  const source = act(fundedGame({ food: 1000 }), 'work', 0);
  const end = 6 * HOUR;
  const events = [], ticks = [];
  const offline = advance(source, end, event => events.push(event));
  let incremental = source;
  for (let now = 60_000; now <= end; now += 60_000) {
    incremental = advance(incremental, now, event => ticks.push(event));
    incremental = parseGame(JSON.stringify(incremental));
    assert.ok(incremental);
  }
  assert.equal(incremental.job.kind, offline.job.kind);
  assert.ok(Math.abs(incremental.time - offline.time) < .01);
  assert.ok(Math.abs(incremental.restMs - offline.restMs) < .01);
  assert.equal(incremental.food, offline.food);
  assert.equal(ticks.length, events.length);
  assert.ok(events.length > 1);
});

test('manual waking cancels automatic resumption and preserves paused study', () => {
  for (const action of ['work', 'train-1']) {
    const sleeping = exhausted(action);
    const awake = act(sleeping, 'wake', 61_000);
    assert.equal(awake.job, null);
    assert.ok(awake.restMs > 0);
    assert.equal(advance(awake, 62_000).job, null);
    if (action === 'train-1') assert.equal(awake.trainingProgress[1].remaining, 1_799_000);
  }
});

test('cancelling a suspended task keeps sleeping and removes only its automatic restart', () => {
  for (const [action, stop] of [['work', 'cancel-work'], ['train-1', 'pause-training']]) {
    const sleeping = exhausted(action);
    const cancelled = act(sleeping, stop, 1000);
    assert.equal(cancelled.job.kind, 'sleep');
    assert.equal(cancelled.job.resumeTask, undefined);
    const awake = advance(parseGame(JSON.stringify(cancelled)), cancelled.job.endsAt);
    assert.equal(awake.job, null);
    if (action === 'train-1') assert.equal(awake.trainingProgress[1].remaining, 1_799_000);
  }
});

test('death at wake-up prevents automatic work or training resumption', () => {
  for (const action of ['work', 'train-1']) {
    const sleeping = exhausted(action);
    sleeping.time = sleeping.job.endsAt - sleeping.updatedAt;
    const dead = advance(sleeping, sleeping.job.endsAt);
    assert.equal(dead.diedAt, sleeping.job.endsAt);
    assert.equal(dead.job, null);
    assert.equal(dead.time, 0);
  }
});

test('manual sleep has no automatic task and invalid resume targets are rejected', () => {
  const sleeping = act(fundedGame({ restMs: AWAKE_DURATION / 2 }), 'sleep', 0);
  assert.equal(sleeping.job.resumeTask, undefined);
  assert.equal(advance(sleeping, sleeping.job.endsAt).job, null);
  for (const resumeTask of [0, 1, 4, null, 'training', {}, true]) {
    assert.equal(parseGame(JSON.stringify({ ...sleeping, job: { ...sleeping.job, resumeTask } })), null);
  }
  const working = act(fundedGame(), 'work', 0);
  assert.equal(parseGame(JSON.stringify({ ...working, job: { ...working.job, resumeTask: 'work' } })), null);
});
