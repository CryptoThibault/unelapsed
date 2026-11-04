import test from 'node:test';
import assert from 'node:assert/strict';
import {act,advance,parseGame,pendingWage,CAREERS,AWAKE_DURATION} from '../src/game.ts';
import {newClock,setSpeed,clockNow} from '../src/clock.ts';

import { qualifiedGame as funded } from './helpers.mjs';

test('all careers pay proportionally for arbitrary session lengths, only when stopped',()=>{
  for(let level=0;level<4;level++) {
    const source=funded(level);
    const working=advance(act(source,'work',0),123_456);
    const wage=123_456*[3,4,6,8][level];
    assert.equal(working.job.kind,'work');assert.equal(pendingWage(working),wage);
    assert.equal(working.time,source.time-123_456);
    assert.equal('endsAt' in working.job,false);assert.equal('duration' in working.job,false);
    const stopped=act(working,'cancel-work',123_456);
    assert.equal(stopped.job,null);assert.equal(stopped.time,working.time+wage);
    assert.equal(pendingWage(stopped),0);
    assert.deepEqual(act(stopped,'cancel-work',123_456),stopped);
    assert.equal(advance(stopped,124_456).time,stopped.time-1000);
  }
});

test('unpaid earnings survive saving, reload and an offline continuation without duplication',()=>{
  const source=act(funded(2),'work',0);
  const partial=advance(source,120_000);
  const restored=parseGame(JSON.stringify(partial));assert.ok(restored);
  const continued=advance(restored,240_000);
  assert.equal(continued.job.workedMs,240_000);
  assert.equal(pendingWage(continued),24*60_000);
  const stopped=act(continued,'cancel-work',240_000);
  assert.equal(stopped.time,source.time-240_000+24*60_000);
  assert.deepEqual(advance(source,240_000),continued);
  assert.equal(source.job.workedMs,0);
});

test('exhaustion pays each profession once and resumes work after sleep',()=>{
  for(let level=0;level<4;level++) {
    const source=funded(level);
    const exhaustion=100/CAREERS[level].energyCostPerMinute*60_000;
    const sleeping=advance(act(source,'work',0),exhaustion+1000);
    assert.equal(sleeping.job.kind,'sleep');assert.equal(sleeping.job.resumeWork,null);
    assert.ok(Math.abs(sleeping.time-(source.time-exhaustion-1000+exhaustion/60_000*CAREERS[level].reward))<.001);
    assert.equal(sleeping.job.resumeTask,'work');
    const awake=advance(parseGame(JSON.stringify(sleeping)),sleeping.job.endsAt);
    assert.equal(awake.job.kind,'work');assert.equal(awake.job.workedMs,0);
    assert.equal(awake.restMs,AWAKE_DURATION);
    assert.equal(pendingWage(awake),0);
    assert.deepEqual(parseGame(JSON.stringify(awake)),awake);
  }
});

test('a stop coinciding with forced sleep cannot double-pay or wake the player',()=>{
  const source=act({...funded(0),restMs:30_000*(2.9/2.5)},'work',0);
  const stopped=act(source,'cancel-work',30_000);
  assert.equal(stopped.job.kind,'sleep');assert.equal(stopped.time,source.time-30_000+90_000);
  assert.deepEqual(act(stopped,'cancel-work',30_000),stopped);
});

test('unpaid earnings cannot revive a player who reaches zero life before stopping',()=>{
  const source=act({...funded(3),time:1000},'work',0);
  const dead=act(source,'cancel-work',1000);
  assert.equal(dead.diedAt,1000);assert.equal(dead.time,0);assert.equal(dead.job,null);
  assert.deepEqual(act(dead,'cancel-work',2000),dead);
});

test('changing test speed preserves accrued work and applies the new speed prospectively',()=>{
  let clock=newClock(0);
  const source=act(funded(0),'work',0);
  const partial=advance(source,clockNow(clock,30_000));
  clock=setSpeed(clock,32,30_000);
  const end=clockNow(clock,60_000);
  const stopped=act(partial,'cancel-work',end);
  assert.equal(stopped.time,source.time-end+end*3);
});

test('invalid continuous work saves cannot forge duration or earning rates',()=>{
  const working=advance(act(funded(0),'work',0),1000);
  for(const patch of [{workedMs:-1},{workedMs:1001},{workedMs:null},{reward:100_000}]) {
    assert.equal(parseGame(JSON.stringify({...working,job:{...working.job,...patch}})),null);
  }
});
