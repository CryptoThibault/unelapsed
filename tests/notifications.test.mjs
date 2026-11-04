import test from 'node:test';
import assert from 'node:assert/strict';
import {newGame,act,advance,parseGame,TRAINING_DURATION,FOOD_INTERVAL,FOOD_SHORTAGE_COST,SUPPLY_COST_MS,RENT_COST,HOME_COST,CAREERS,HOUR} from '../src/game.ts';

import { fundedGame as funded } from './helpers.mjs';

test('each successful purchase reports its exact cost and reason once',()=>{
  const cases=[['eat',SUPPLY_COST_MS,'Food'],['rent',RENT_COST,'Rent home'],['home',HOME_COST,'Buy home']];
  for(const level of [1,2,3]) {
    cases.push([`course-${level}`,CAREERS[level].cost,`Training · ${CAREERS[level].course}`]);
    cases.push([`equipment-${level}`,CAREERS[level].equipmentCost,CAREERS[level].equipment]);
  }
  for(const [action,cost,reason] of cases) {
    const events=[];const source={...funded(),time:HOME_COST+100*HOUR};
    const after=act(source,action,1000,event=>events.push(event));
    assert.deepEqual(events,[{amount:-cost,reason,at:1000}]);
    assert.equal(after.time,source.time-1000-cost);
  }
});

test('failed or repeated unique purchases emit no notification',()=>{
  const events=[];const notify=e=>events.push(e);
  act(newGame(0),'home',0,notify);
  const owned=act(funded(),'equipment-1',0);
  act(owned,'equipment-1',0,notify);
  assert.deepEqual(events,[]);
});

test('natural countdown, pending wages and a stocked meal are silent',()=>{
  const events=[];const notify=e=>events.push(e);
  advance(funded(),FOOD_INTERVAL,notify);
  const working=act(funded(),'work',0,notify);
  const ongoing=advance(working,FOOD_INTERVAL,notify);
  assert.equal(ongoing.job.kind,'work');assert.deepEqual(events,[]);
});

test('stopping work reports only the collected wage, once',()=>{
  const events=[];const notify=e=>events.push(e);
  const working=act(funded(),'work',0,notify);
  const stopped=act(working,'cancel-work',90_000,notify);
  act(stopped,'cancel-work',90_000,notify);
  advance(stopped,100_000,notify);
  assert.deepEqual(events,[{amount:270_000,reason:'Work pay',at:90_000}]);
});

test('missed meals report penalties chronologically, including offline',()=>{
  const source={...funded(),food:0};
  const events=[];
  const after=advance(source,2*FOOD_INTERVAL,e=>events.push(e));
  assert.deepEqual(events,[
    {amount:-FOOD_SHORTAGE_COST,reason:'Missed meal',at:FOOD_INTERVAL},
    {amount:-FOOD_SHORTAGE_COST,reason:'Missed meal',at:2*FOOD_INTERVAL},
  ]);
  assert.equal(after.time,source.time-2*FOOD_INTERVAL-2*FOOD_SHORTAGE_COST);
});

test('simultaneous penalty and automatic payday stay separate and do not repeat',()=>{
  const source={...funded(),food:0,restMs:FOOD_INTERVAL*(2.9/2.5)};
  const events=[];const notify=e=>events.push(e);
  const after=advance(act(source,'work',0),FOOD_INTERVAL,notify);
  assert.deepEqual(events,[
    {amount:-FOOD_SHORTAGE_COST,reason:'Missed meal',at:FOOD_INTERVAL},
    {amount:FOOD_INTERVAL*3,reason:'Work pay',at:FOOD_INTERVAL},
  ]);
  assert.equal(after.job.kind,'sleep');
  act(after,'cancel-work',FOOD_INTERVAL,notify);
  advance(after,FOOD_INTERVAL,notify);
  assert.equal(events.length,2);
});

test('fatal meal notifications report only the life actually lost',()=>{
  const source={...newGame(0),time:FOOD_INTERVAL+60_000};
  const events=[];
  const dead=advance(source,FOOD_INTERVAL,e=>events.push(e));
  assert.equal(dead.time,0);
  assert.deepEqual(events,[{amount:-60_000,reason:'Missed meal',at:FOOD_INTERVAL}]);
});

test('starting and resuming a purchased course never reports a second charge',()=>{
  const events=[];const notify=e=>events.push(e);
  const source=act(funded(),'course-1',0);
  const paused=act(act(source,'train-1',0,notify),'pause-training',1000,notify);
  act(paused,'train-1',2000,notify);
  assert.deepEqual(events,[]);
});

test('each certification emits one completion notification, including after pause and reload',()=>{
  for(const level of [1,2,3]) {
    const events=[];const notify=e=>events.push(e);
    const source={...funded(),courses:[level],trainingProgress:{[level]:{remaining:600_000,duration:TRAINING_DURATION}}};
    const started=act(source,`train-${level}`,0,notify);
    const paused=act(started,'pause-training',60_000,notify);
    const restored=parseGame(JSON.stringify(paused));assert.ok(restored);
    const resumed=act(restored,`train-${level}`,120_000,notify);
    const endsAt=600_000+60_000;
    const almost=advance(resumed,endsAt-1,notify);
    assert.deepEqual(events,[]);
    const done=advance(almost,endsAt,notify);
    assert.deepEqual(done.qualifications,[level]);
    assert.deepEqual(events,[{kind:'training-completed',course:CAREERS[level].course,at:endsAt}]);
    advance(done,endsAt+1000,notify);
    act(done,`train-${level}`,endsAt,notify);
    assert.equal(events.length,1);
  }
});

test('death at the training deadline grants neither certification nor a completion notification',()=>{
  const events=[];const notify=e=>events.push(e);
  const source={...funded(),time:TRAINING_DURATION,courses:[1]};
  const dead=advance(act(source,'train-1',0),TRAINING_DURATION,notify);
  assert.equal(dead.time,0);assert.deepEqual(dead.qualifications,[]);assert.deepEqual(events,[]);
});
