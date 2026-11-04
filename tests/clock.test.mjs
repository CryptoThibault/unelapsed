import test from 'node:test';
import assert from 'node:assert/strict';
import { newClock, clockNow, setSpeed, parseClock } from '../src/clock.ts';
import { newGame, act, advance, HOUR, AWAKE_DURATION, TRAINING_DURATION } from '../src/game.ts';

test('all supported speeds multiply elapsed time',()=>{
  for (const speed of [1,2,4,8,16,32,64,128,256,512]) assert.equal(clockNow(setSpeed(newClock(1000),speed,1000),2000),1000+1000*speed);
});
test('switching speed never jumps or reapplies earlier elapsed time',()=>{
  let c=newClock(1000);c=setSpeed(c,2,2000);assert.equal(clockNow(c,2000),2000);
  c=setSpeed(c,8,3000);assert.equal(clockNow(c,3000),4000);assert.equal(clockNow(c,4000),12000);
  c=setSpeed(c,1,4000);assert.equal(clockNow(c,5000),13000);
});
test('speed and elapsed offline time survive restoring the clock',()=>{
  const c=setSpeed(newClock(0),4,0);const restored=parseClock(JSON.stringify(c));assert.deepEqual(restored,c);assert.equal(clockNow(restored,10_000),40_000);
});
test('clock rejects invalid saves and handles a backwards device clock',()=>{
  for (const raw of ['null','{}','bad','{"realAt":0,"gameAt":0,"speed":100}','{"realAt":-1,"gameAt":0,"speed":1}'])assert.equal(parseClock(raw),null);
  assert.equal(clockNow(newClock(1000),0),1000);
});
test('at eight times speed work accrues a minute of pay in seven and a half seconds',()=>{
  const c=setSpeed(newClock(0),8,0);const started=act({...newGame(0),food:10},'work',clockNow(c,0));
  assert.ok(advance(started,clockNow(c,7499)).job);
  const paid=act(started,'cancel-work',clockNow(c,7500));assert.equal(paid.job,null);assert.equal(paid.time,HOUR-60_000+180_000);
});
test('speed applies equally to food, fatigue, rental expiry and life',()=>{
  const c=setSpeed(newClock(0),8,0);const source={...newGame(0),food:10,rentUntil:900_000};
  const fast=advance(source,clockNow(c,112_500));const normal=advance(source,900_000);
  assert.deepEqual(fast,normal);assert.equal(fast.food,9);assert.equal(fast.restMs,AWAKE_DURATION-900_000);assert.equal(fast.time,HOUR-900_000);assert.equal(fast.rentUntil,fast.updatedAt);
});
test('training progress accelerates at eight times speed',()=>{
  const c=setSpeed(newClock(0),8,0);
  const source=act({...newGame(0),time:10*HOUR,food:10,courses:[1]},'train-1',0);
  assert.equal(TRAINING_DURATION,1_800_000);
  const fast=advance(source,clockNow(c,75_000));
  assert.deepEqual(fast,advance(source,600_000));assert.equal(fast.job.kind,'training');
});
test('switching speed midway through a task preserves its progress',()=>{
  let c=newClock(0);const source=act({...newGame(0),food:10},'work',0);
  const partial=advance(source,clockNow(c,30_000));c=setSpeed(c,4,30_000);
  const stopped=act(partial,'cancel-work',clockNow(c,37_500));assert.equal(stopped.job,null);assert.equal(stopped.time,HOUR-60_000+180_000);
});
