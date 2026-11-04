import test from 'node:test';
import assert from 'node:assert/strict';
import { act, advance, newGame, parseGame, unavailable, shopOwned, FOOD_DISPENSER_COST, FOOD_INTERVAL, FOOD_SHORTAGE_COST, SUPPLY_COST_MS } from '../src/game.ts';
import { fundedGame } from './helpers.mjs';

test('food dispenser is a unique three-day purchase and restart removes it', () => {
  const source = fundedGame();
  const events = [];
  const bought = act(source, 'food-dispenser', 0, event => events.push(event));
  assert.equal(FOOD_DISPENSER_COST, 3 * 24 * 3_600_000);
  assert.equal(bought.autoFood, true);
  assert.equal(bought.time, source.time - FOOD_DISPENSER_COST);
  assert.equal(shopOwned(bought, 'food-dispenser'), true);
  assert.deepEqual(events, [{amount: -FOOD_DISPENSER_COST, reason: 'Food dispenser', at: 0}]);
  assert.deepEqual(act(bought, 'food-dispenser', 0), bought);
  assert.equal(newGame(0).autoFood, false);
  assert.equal(unavailable({...source, time: FOOD_DISPENSER_COST}, 'food-dispenser'), 'Not enough time');
});

test('automatic food uses existing stock first then pays for exactly one meal per deadline', () => {
  const source = fundedGame({autoFood: true, food: 1});
  const events = [];
  const first = advance(source, FOOD_INTERVAL, event => events.push(event));
  assert.equal(first.food, 0);
  assert.equal(first.time, source.time - FOOD_INTERVAL);
  assert.deepEqual(events, []);
  const next = advance(first, 2 * FOOD_INTERVAL, event => events.push(event));
  assert.equal(next.food, 0);
  assert.equal(next.time, source.time - 2 * FOOD_INTERVAL - SUPPLY_COST_MS);
  assert.deepEqual(events, [{amount: -SUPPLY_COST_MS, reason: 'Automatic food', at: 2 * FOOD_INTERVAL}]);
});

test('automatic food persists and handles multiple meals offline including sleep', () => {
  const source = act(fundedGame({autoFood: true, food: 0, restMs: 1}), 'sleep', 0);
  const restored = parseGame(JSON.stringify(source));
  assert.equal(restored.autoFood, true);
  const offline = advance(restored, 3 * FOOD_INTERVAL);
  assert.equal(offline.time, source.time - 3 * FOOD_INTERVAL - 3 * SUPPLY_COST_MS);
  let ticks = source;
  for (let now = 60_000; now <= 3 * FOOD_INTERVAL; now += 60_000) ticks = advance(ticks, now);
  assert.deepEqual(ticks, offline);
});

test('without the object or enough funds the usual missed-meal penalty applies', () => {
  const source = fundedGame({food: 0});
  assert.equal(advance(source, FOOD_INTERVAL).time, source.time - FOOD_INTERVAL - FOOD_SHORTAGE_COST);
  const poor = {...source, autoFood: true, time: FOOD_INTERVAL + SUPPLY_COST_MS};
  const events = [];
  const dead = advance(poor, FOOD_INTERVAL, event => events.push(event));
  assert.equal(dead.time, 0);
  assert.equal(dead.diedAt, FOOD_INTERVAL);
  assert.equal(events[0].reason, 'Missed meal');
});

test('older saves default to no dispenser and invalid ownership is rejected', () => {
  const old = newGame(0);
  delete old.autoFood;
  assert.equal(parseGame(JSON.stringify(old)).autoFood, false);
  for (const value of [null, 1, 'true', {}]) {
    assert.equal(parseGame(JSON.stringify({...old, autoFood: value})), null);
  }
});
