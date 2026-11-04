import test from 'node:test';
import assert from 'node:assert/strict';
import { newGame, act, advance, parseGame, migrateGame, unavailable, careerEligible, shopOwned, CAREERS, HOUR, TRAINING_DURATION } from '../src/game.ts';
import { newClock, setSpeed, clockNow, parseClock } from '../src/clock.ts';

import { fundedGame as funded } from './helpers.mjs';
const purchase = level => act(funded(),`course-${level}`,0);
// Follow the course across automatic sleep and resume cycles.
function finish(source, level) {
  let g=act(source,`train-${level}`,source.updatedAt);
  while(!g.qualifications.includes(level)) {
    assert.ok(g.job);
    g=advance(g,g.job.kind==='training' ? Math.min(g.job.endsAt,g.updatedAt+g.restMs/(2.8/2.5)) : g.job.endsAt);
    if(g.job?.kind==='sleep')g=advance(g,g.job.endsAt);
    if(!g.qualifications.includes(level))g=act(g,`train-${level}`,g.updatedAt);
  }
  return g;
}

test('new runs own no courses and cannot study before buying one',()=>{
  const source=newGame(0);
  assert.deepEqual(source.courses,[]);
  for(const level of [1,2,3]) {
    assert.equal(unavailable(source,`train-${level}`),'Buy this training in the shop');
    assert.deepEqual(act(source,`train-${level}`,0),source);
  }
});

test('shop sells every course independently for ten minutes, one hour and four hours',()=>{
  for(const level of [1,2,3]) {
    const source=funded();const bought=act(source,`course-${level}`,0);
    assert.equal(CAREERS[level].cost,[0,600_000,HOUR,4*HOUR][level]);
    assert.equal(bought.time,source.time-CAREERS[level].cost);
    assert.deepEqual(bought.courses,[level]);assert.equal(bought.job,null);
    assert.equal(unavailable(bought,`course-${level}`),'Owned');
    assert.deepEqual(act(bought,`course-${level}`,0),bought);
    const poor={...source,time:CAREERS[level].cost};
    assert.equal(unavailable(poor,`course-${level}`),'Not enough time');
    assert.deepEqual(act(poor,`course-${level}`,0),poor);
  }
});

test('each purchased course requires thirty active minutes without further payment',()=>{
  for(const level of [1,2,3]) {
    const source=purchase(level);const started=act(source,`train-${level}`,0);
    assert.equal(started.time,source.time);assert.equal(started.job.duration,1_800_000);
    assert.equal(started.job.trainingLevel,level);
    const done=finish(source,level);
    assert.deepEqual(done.qualifications,[level]);assert.equal(done.careerLevel,0);
    assert.equal(done.updatedAt,30*60_000); // A full charge covers the thirty-minute course.
    assert.equal(done.time,source.time-done.updatedAt);
    assert.deepEqual(parseGame(JSON.stringify(done)),done);
    assert.equal(unavailable(done,`train-${level}`),'Qualified');
  }
});

test('qualification and matching equipment are necessary in either purchase order',()=>{
  for(const level of [1,2,3])for(const buyFirst of [false,true]) {
    let g=purchase(level);
    if(buyFirst)g=act(g,`equipment-${level}`,0);
    assert.equal(g.careerLevel,0);
    g=finish(g,level);
    assert.equal(g.careerLevel,0);
    if(!buyFirst)g=act(g,`equipment-${level}`,g.updatedAt);
    assert.equal(g.careerLevel,0);
    assert.equal(careerEligible(g,level),true);
    g=act(g,`recruit-${level}`,g.updatedAt);
    assert.equal(g.careerLevel,level);
    assert.equal(act(g,'work',g.updatedAt).job.reward,CAREERS[level].reward);
    assert.deepEqual(parseGame(JSON.stringify(g)),g);
  }
});

test('highest career can be reached directly and later qualifications never downgrade it',()=>{
  let g=finish(purchase(3),3);
  g=act(g,'equipment-3',g.updatedAt);g=act(g,'recruit-3',g.updatedAt);
  assert.equal(g.careerLevel,3);assert.deepEqual(g.qualifications,[3]);assert.deepEqual(g.equipment,[3]);
  g=act(g,'course-1',g.updatedAt);g=finish(g,1);g=act(g,'equipment-1',g.updatedAt);
  assert.equal(g.careerLevel,3);
});

test('equipment must match, cannot be bought twice and cannot exhaust life',()=>{
  const source=purchase(1);
  const equipped=act(source,'equipment-2',0);
  assert.equal(equipped.time,source.time-CAREERS[2].equipmentCost);
  assert.equal(unavailable(equipped,'equipment-2'),'Owned');
  assert.deepEqual(act(equipped,'equipment-2',0),equipped);
  assert.equal(finish(equipped,1).careerLevel,0);
  const poor={...funded(),time:CAREERS[1].equipmentCost};
  assert.deepEqual(act(poor,'equipment-1',0),poor);
});

test('buying courses or equipment during work does not interrupt or reprice that session',()=>{
  let g=finish(purchase(3),3);const now=g.updatedAt;
  g=act(g,'work',now);
  g=act(g,'course-1',now+1000);g=act(g,'equipment-3',now+2000);
  assert.equal(g.careerLevel,0);assert.equal(g.job.kind,'work');assert.equal(g.job.reward,180_000);
  assert.equal(unavailable(g,'recruit-3'),'Finish the current work first');
  assert.deepEqual(act(g,'recruit-3',now+2000),g);
  const paid=act(g,'cancel-work',now+60_000);
  assert.equal(paid.time,g.time-58_000+180_000);
  const hired=act(paid,'recruit-3',paid.updatedAt);
  assert.equal(act(hired,'work',paid.updatedAt).job.reward,8*60_000);
});

test('courses keep separate paid progress through pause, sleep, switching and reload',()=>{
  let g=act(purchase(3),'course-1',0);
  g=act(act(g,'train-3',0),'cancel',60_000);
  g=act(act(g,'train-1',60_000),'cancel',120_000);
  assert.equal(g.trainingProgress[3].remaining,1_740_000);
  assert.equal(g.trainingProgress[1].remaining,1_740_000);
  g=advance(act(g,'sleep',120_000),240_000);
  assert.equal(g.job,null);
  g=parseGame(JSON.stringify(g));assert.ok(g);
  const balance=g.time;g=act(g,'train-3',240_000);
  assert.equal(g.time,balance);assert.equal(g.job.trainingLevel,3);
  assert.equal(g.trainingProgress[3],undefined);
  assert.equal(g.trainingProgress[1].remaining,1_740_000);
  assert.equal(unavailable(g,'train-1'),'Finish the current task first');
  assert.deepEqual(act(g,'train-1',240_000),g);
});

test('exhaustion resumes the chosen course after sleep without repayment',()=>{
  let g=advance(act({...purchase(3),restMs:15_000*(2.8/2.5)},'train-3',0),30_000);
  assert.equal(g.job.kind,'sleep');assert.equal(g.job.resumeWork,null);
  assert.equal(g.trainingProgress[3].remaining,1_785_000);
  assert.equal(g.job.resumeTask,3);
  const wakeAt=g.job.endsAt;
  const resumed=advance(parseGame(JSON.stringify(g)),wakeAt);
  assert.equal(resumed.time,g.time-(wakeAt-g.updatedAt));
  assert.equal(resumed.job.trainingLevel,3);
  assert.equal(resumed.job.endsAt-wakeAt,1_785_000);
});

test('v13 migration keeps earned careers and converts paid study progress to thirty minutes',()=>{
  const base={...funded(),version:13,restMs:1_000_000,careerLevel:1,qualifications:[1],equipment:[1]};delete base.courses;
  const active={...base,job:{kind:'training',trainingLevel:3,endsAt:480_000,duration:600_000,reward:0,resumeWork:null}};
  const converted=migrateGame(JSON.stringify(active),0);
  assert.equal(converted.careerLevel,1);assert.deepEqual(converted.courses,[1,3]);
  assert.equal(converted.job.trainingLevel,3);assert.equal(converted.job.duration,TRAINING_DURATION);
  assert.equal(converted.job.endsAt,1_440_000);assert.equal(converted.time,base.time);
  const paused=migrateGame(JSON.stringify({...base,trainingProgress:{2:{remaining:480_000,duration:600_000}}}),0);
  assert.equal(paused.trainingProgress[2].remaining,1_440_000);
  assert.equal(act(paused,'train-2',0).time,base.time);
  const noCourse=migrateGame(JSON.stringify({...funded(),version:13,restMs:1_000_000}),0);
  assert.deepEqual(noCourse.courses,[]);
});

test('v12 migration preserves the profession and already paid course',()=>{
  const old={...funded(),version:12,restMs:1_000_000,careerLevel:1,pausedTraining:{remaining:480_000,duration:600_000}};
  delete old.courses;delete old.qualifications;delete old.equipment;delete old.trainingProgress;
  const converted=migrateGame(JSON.stringify(old),0);
  assert.equal(converted.careerLevel,1);assert.deepEqual(converted.equipment,[1]);
  assert.deepEqual(converted.courses,[1,2]);assert.equal(converted.trainingProgress[2].remaining,1_440_000);
});

test('invalid ownership, qualifications and training progress are rejected',()=>{
  const source=funded();
  for(const patch of [
    {courses:[4]}, {courses:[1,1]}, {qualifications:[1]}, {equipment:[1,1]}, {careerLevel:3},
    {trainingProgress:{1:{remaining:10,duration:TRAINING_DURATION}}},
    {job:{kind:'training',trainingLevel:1,endsAt:TRAINING_DURATION,duration:TRAINING_DURATION,reward:0,resumeWork:null}},
  ])assert.equal(parseGame(JSON.stringify({...source,...patch})),null);
});

test('x16 through x512 persist and accelerate the thirty-minute course consistently',()=>{
  for(const speed of [16,32,64,128,256,512]) {
    const clock=parseClock(JSON.stringify(setSpeed(newClock(0),speed,0)));
    const source=act(purchase(3),'train-3',0);
    assert.deepEqual(advance(source,clockNow(clock,600_000/speed)),advance(source,600_000));
    assert.equal(source.job.duration,TRAINING_DURATION);
  }
});

test('recruitment requires the matching certification and equipment, with a free return to the initial job',()=>{
  for(const level of [1,2,3]) {
    const source=funded();
    for(const patch of [{}, {equipment:[level]}, {courses:[level],qualifications:[level]}]) {
      const g={...source,...patch};
      assert.equal(careerEligible(g,level),false);
      assert.deepEqual(act(g,`recruit-${level}`,0),g);
    }
    const eligible={...source,courses:[level],qualifications:[level],equipment:[level]};
    const hired=act(eligible,`recruit-${level}`,0);
    assert.equal(hired.careerLevel,level);assert.equal(hired.time,source.time);
    assert.deepEqual(parseGame(JSON.stringify(hired)),hired);
    const back=act(hired,'recruit-0',0);
    assert.equal(back.careerLevel,0);assert.deepEqual(parseGame(JSON.stringify(back)),back);
    assert.equal(unavailable(back,'recruit-0'),'Current job');
  }
});
test('only purchased unique items count as owned shop entries',()=>{
  let g={...funded(),time:20*24*HOUR};
  for(const action of ['home','course-1','equipment-1'])assert.equal(shopOwned(g,action),false);
  g=act(act(act(g,'course-1',0),'equipment-1',0),'home',0);
  for(const action of ['home','course-1','equipment-1'])assert.equal(shopOwned(g,action),true);
  for(const action of ['eat','rent','course-2','equipment-2'])assert.equal(shopOwned(g,action),false);
  assert.deepEqual(parseGame(JSON.stringify(g)),g);
});
test('new sessions use the four continuous earning rates',()=>{
  for(let level=0;level<4;level++) {
    const g={...funded(),courses:[1,2,3],qualifications:[1,2,3],equipment:[1,2,3],careerLevel:level};
    const working=act(g,'work',0);
    assert.equal(working.job.workedMs,0);
    assert.equal(working.job.reward,[3,4,6,8][level]*60_000);
  }
});
test('v15 work migration keeps elapsed work as an unpaid continuous session',()=>{
  const g={...funded(),version:15,updatedAt:30_000,job:{kind:'work',duration:60_000,endsAt:60_000,reward:240_000,resumeWork:null}};
  const restored=migrateGame(JSON.stringify(g),30_000);assert.ok(restored);
  assert.equal(restored.job.workedMs,30_000);assert.equal(restored.job.reward,180_000);
  assert.equal(restored.time,g.time);
  const done=act(restored,'cancel-work',60_000);
  assert.equal(done.time,g.time-30_000+180_000);
});
