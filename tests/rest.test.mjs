import test from 'node:test';
import assert from 'node:assert/strict';
import {act,advance,migrateGame,parseGame,restPercent,restLossPerHour,timeUntilSleep,REST_LOSS_PER_HOUR,PASSIVE_ENERGY_PER_MINUTE,workEnergyPerMinute,fullRecoveryDuration,sleepDuration,CAREERS,HOUR,AWAKE_DURATION} from '../src/game.ts';

import { qualifiedGame as funded } from './helpers.mjs';

test('idle lasts forty minutes before automatic sleep',()=>{
  const source=funded();
  assert.equal(restLossPerHour(source),REST_LOSS_PER_HOUR);
  assert.equal(restPercent(advance(source,AWAKE_DURATION/2)),50);
  assert.equal(advance(source,AWAKE_DURATION-1).job,null);
  const asleep=advance(source,AWAKE_DURATION);
  assert.equal(asleep.job.kind,'sleep');assert.equal(restPercent(asleep),0);
  assert.equal(restLossPerHour(asleep),0);
});

test('work fatigue varies by profession against the sixteen-character-hour idle reserve',()=>{
  for(let level=0;level<4;level++) {
    const source={...funded(),careerLevel:level};
    const career=CAREERS[level];
    const working=act(source,'work',0);
    assert.equal(restLossPerHour(working),workEnergyPerMinute(level)*60);
    const ongoing=advance(working,10*60_000);
    assert.equal(ongoing.job.kind,'work');
    assert.equal(ongoing.time,source.time-10*60_000);
    assert.ok(Math.abs(restPercent(ongoing)-(100-10*workEnergyPerMinute(level)))<1e-8);
    const done=act(ongoing,'cancel-work',10*60_000);
    assert.equal(done.time,source.time-10*60_000+10*career.reward);
    const later=advance(done,11*60_000);
    assert.ok(Math.abs(restPercent(done)-restPercent(later)-PASSIVE_ENERGY_PER_MINUTE)<1e-8);
    assert.deepEqual(parseGame(JSON.stringify(done)),done);
  }
});

test('training always consumes 2.8 energy per minute',()=>{
  for(let level=0;level<4;level++) {
    const source={...funded(),qualifications:[],careerLevel:0};
    if(level) { source.qualifications=[level];source.careerLevel=level; }
    const target=level===3?1:3;
    const training=act(source,`train-${target}`,0);
    assert.equal(restLossPerHour(training),2.8*60);
    const done=advance(training,10*60_000);
    assert.equal(done.job.kind,'training');assert.ok(Math.abs(restPercent(done)-(100-10*2.8))<1e-8);
  }
});

test('working drains rest faster and stopping returns to the idle rate',()=>{
  let g=act(funded(),'work',0);
  g=act(g,'cancel-work',30_000);
  const afterFirst=restPercent(g);
  g=advance(g,90_000);
  assert.ok(Math.abs(afterFirst-restPercent(g)-PASSIVE_ENERGY_PER_MINUTE)<1e-8);
  g=act(g,'recruit-3',90_000);
  const restBefore=restPercent(g);
  g=advance(act(g,'work',90_000),150_000);
  assert.ok(Math.abs(restBefore-restPercent(g)-workEnergyPerMinute(3))<1e-8);
});

test('v14 migration preserves the rest percentage, life and sleeping recovery',()=>{
  for(const percent of [1,50,100]) {
    const source={...funded(),version:14,restMs:1_000_000*percent/100};
    const converted=migrateGame(JSON.stringify(source),0);
    assert.equal(restPercent(converted),percent);
    assert.equal(converted.time,source.time);
    assert.deepEqual(parseGame(JSON.stringify(converted)),converted);
  }
  const old={...funded(),version:14,restMs:500_000,job:{kind:'sleep',duration:300_000,endsAt:300_000,reward:0,resumeWork:null}};
  const converted=migrateGame(JSON.stringify(old),60_000);
  assert.ok(Math.abs(restPercent(converted)-54)<1e-9);assert.equal(converted.job.endsAt,750_000);
  assert.equal(advance(converted,750_000).restMs,AWAKE_DURATION);
});

test('full recovery takes twenty-five minutes homeless or twenty minutes with a home or rental',()=>{
  for(const [patch,duration] of [[{},1_500_000],[{housing:'housed'},1_200_000],[{rentUntil:6*HOUR},1_200_000]]) {
    const source={...funded(),...patch,restMs:1};
    const sleeping=advance(source,1);
    assert.equal(restPercent(sleeping),0);
    assert.equal(fullRecoveryDuration(sleeping),duration);
    assert.equal(sleeping.job.endsAt,1+duration);
    const halfway=advance(sleeping,1+duration/2);
    assert.ok(Math.abs(restPercent(halfway)-50)<1e-8);
    const saved=parseGame(JSON.stringify(halfway));assert.ok(saved);
    assert.equal(advance(saved,1+duration-1).job.kind,'sleep');
    const awake=advance(saved,1+duration);
    assert.equal(awake.restMs,AWAKE_DURATION);assert.equal(awake.job,null);
    assert.equal(awake.time,source.time-1-duration);
  }
});
test('partial recovery duration remains proportional to missing rest',()=>{
  for(const [housing,duration] of [['homeless',1_500_000],['housed',1_200_000]]) {
    const source={...funded(),housing,restMs:AWAKE_DURATION*.25};
    assert.equal(sleepDuration(source),duration*.75);
    const sleeping=act(source,'sleep',0);
    const halfway=advance(sleeping,duration*.375);
    assert.equal(restPercent(halfway),62.5);
    const awake=act(halfway,'wake',halfway.updatedAt);
    assert.equal(restPercent(awake),62.5);assert.equal(awake.job,null);
  }
});

test('housing never changes exhaustion timing, while work uses the career fatigue rate',()=>{
  const configurations=[{}, {housing:'housed'}, {rentUntil:24*HOUR}, {rentUntil:10*60_000}];
  for(const housing of configurations)for(const action of [null,'work']) {
    const source={...funded(),...housing,courses:[1],qualifications:[],equipment:[]};
    const started=action?act(source,action,0):source;
    const deadline=action?100/2.9*60_000:40*60_000;
    const halfway=advance(started,deadline/2);
    assert.ok(Math.abs(restPercent(halfway)-50)<1e-8);
    const almost=advance(started,deadline-1);
    assert.notEqual(almost.job?.kind,'sleep');
    const asleep=advance(started,deadline);
    assert.equal(asleep.job.kind,'sleep');assert.equal(restPercent(asleep),0);
    const sheltered=housing.housing==='housed' || (housing.rentUntil??0)>deadline;
    assert.equal(asleep.job.endsAt,deadline+(sheltered?20:25)*60_000);
  }
});

test('v17 migration keeps rest percentage instead of resetting the sixteen-character-hour reserve',()=>{
  for(const percent of [1,50,100])for(const housing of ['homeless','housed']) {
    const source={...funded(),version:17,housing,restMs:2*HOUR*percent/100};
    const converted=migrateGame(JSON.stringify(source),0);
    assert.equal(restPercent(converted),percent);assert.equal(converted.time,source.time);
    const deadline=40*60_000*percent/100;
    assert.notEqual(advance(converted,deadline-1).job?.kind,'sleep');
    assert.equal(advance(converted,deadline).job.kind,'sleep');
    assert.deepEqual(parseGame(JSON.stringify(converted)),converted);
  }
});

test('sleep countdown follows remaining rest and the current activity',()=>{
  const source=funded();
  assert.equal(timeUntilSleep(source),40*60_000);
  const working=advance(act(source,'work',0),10*60_000);
  assert.ok(Math.abs(timeUntilSleep(working)-(100/2.9-10)*60_000)<1e-6);
  const stopped=act(working,'cancel-work',10*60_000);
  assert.ok(Math.abs(timeUntilSleep(stopped)-(100-10*2.9)/2.5*60_000)<1e-6);
  const sleeping=act(stopped,'sleep',10*60_000);
  assert.equal(timeUntilSleep(sleeping),0);
});

test('v18 migration preserves energy while adopting the integer rates',()=>{
  for(const percent of [1,50,100]) {
    const old={...funded(),version:18,restMs:45*60_000*percent/100};
    const converted=migrateGame(JSON.stringify(old),0);
    assert.equal(restPercent(converted),percent);assert.equal(converted.time,old.time);
    assert.equal(converted.restMs,AWAKE_DURATION*percent/100);
    assert.deepEqual(parseGame(JSON.stringify(converted)),converted);
  }
});
