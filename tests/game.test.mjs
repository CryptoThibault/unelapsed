import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { newGame, advance, act, unavailable, parseGame, migrateGame, HOUR, FOOD_INTERVAL, FOOD_SHORTAGE_COST, AWAKE_DURATION, pendingWage, restPercent, sleepDuration, RENT_COST, RENT_DURATION, HOME_COST, CAREERS, profession, WORK_REWARD } from '../src/game.ts';
const WORK_RATE=2.9/2.5;
const SLEEP_DURATION = 25 * 60_000;
const stocked=()=>({...newGame(0),food:100,time:10*HOUR,courses:[1,2,3],equipment:[1,2,3]});
const atRest=p=>({...stocked(),restMs:AWAKE_DURATION*p/100});

test('new run has one hour, zero food, full rest and a meal due in fifteen minutes',()=>{
  const g=newGame(0);assert.equal(g.time,HOUR);assert.equal(g.food,0);assert.equal(restPercent(g),100);assert.equal(g.nextFoodAt,900_000);assert.equal(g.job,null);
});
test('one meal costs two minutes and can be stockpiled',()=>{
  const first=act(newGame(0),'eat',0);assert.equal(first.time,HOUR-120_000);assert.equal(first.food,1);
  assert.equal(act(first,'eat',0).food,2);
});
test('food purchases charge two minutes per selected meal and report one total expense',()=>{
  for(const quantity of [1,5,13,99]) {
    const source={...newGame(0),time:10*HOUR,food:3};
    const events=[];
    const bought=act(source,'eat',0,e=>events.push(e),quantity);
    assert.equal(bought.food,source.food+quantity);
    assert.equal(bought.time,source.time-quantity*120_000);
    assert.equal(bought.nextFoodAt,source.nextFoodAt);
    assert.deepEqual(events,[{amount:-quantity*120_000,reason:'Food',at:0}]);
    assert.deepEqual(parseGame(JSON.stringify(bought)),bought);
  }
});
test('invalid or unaffordable food quantities cannot change stock or spend time',()=>{
  const source=newGame(0);
  for(const quantity of [0,-1,1.5,NaN,Infinity,Number.MAX_SAFE_INTEGER,30,31]) {
    const events=[];
    assert.notEqual(unavailable(source,'eat',quantity),null);
    assert.deepEqual(act(source,'eat',0,e=>events.push(e),quantity),source);
    assert.deepEqual(events,[]);
  }
  const almost=act(source,'eat',0,undefined,29);
  assert.equal(almost.time,120_000);assert.equal(almost.food,29);
});
test('a selected food quantity is bought immediately during work without interrupting it',()=>{
  const working=act(stocked(),'work',0);
  const bought=act(working,'eat',1000,undefined,7);
  assert.equal(bought.food,working.food+7);
  assert.equal(bought.time,working.time-1000-7*120_000);
  assert.deepEqual(bought.job,advance(working,1000).job);
});
test('food is consumed every fifteen minutes, including while sleeping',()=>{
  const g=stocked();assert.equal(advance(g,899_999).food,100);assert.equal(advance(g,900_000).food,99);
  assert.equal(advance(g,30*60_000).food,98);assert.equal(advance(g,HOUR).food,96);
});
test('a batch covers 150 minutes and the next missed meal keeps its thirty-minute penalty',()=>{
  const source={...newGame(0),food:10,time:100*HOUR};
  const covered=advance(source,150*60_000);
  assert.equal(covered.food,0);assert.equal(covered.time,source.time-150*60_000);
  const missed=advance(covered,165*60_000);
  assert.equal(missed.time,source.time-165*60_000-FOOD_SHORTAGE_COST);
});
test('v16 migration preserves meal progress when moving from six to fifteen minutes',()=>{
  const source={...newGame(0),version:16,updatedAt:180_000,time:HOUR-180_000,food:2,nextFoodAt:360_000};
  const converted=migrateGame(JSON.stringify(source),180_000);
  assert.equal(converted.time,source.time);assert.equal(converted.food,2);
  assert.equal(converted.nextFoodAt,630_000);
  const meal=advance(converted,630_000);
  assert.equal(meal.food,1);assert.equal(meal.nextFoodAt,1_530_000);
});
test('missed meal deducts thirty minutes without a multiplier',()=>{
  assert.equal(FOOD_SHORTAGE_COST,30*60_000);
  assert.equal(advance(newGame(0),899_999).time,HOUR-899_999);
  assert.equal(advance(newGame(0),900_000).time,HOUR-900_000-FOOD_SHORTAGE_COST);
});
test('rest decreases to half after twenty-two and a half minutes awake',()=>{
  const g=advance(stocked(),AWAKE_DURATION/2);assert.equal(restPercent(g),50);assert.equal(g.job,null);
});
test('work has no deadline and accrues pay without crediting the balance',()=>{
  const g=act(stocked(),'work',0);
  assert.equal(g.job.workedMs,0);assert.equal(g.job.reward,180_000);
  const later=advance(g,300_000);
  assert.equal(later.job.kind,'work');assert.equal(later.job.workedMs,300_000);
  assert.equal(later.time,g.time-300_000);assert.equal(pendingWage(later),900_000);
});
test('sleep starts automatically at zero rest and lasts twenty-five minutes outdoors',()=>{
  const g=advance(stocked(),AWAKE_DURATION);
  assert.equal(g.restMs,0);assert.equal(g.job.kind,'sleep');assert.equal(g.job.endsAt,AWAKE_DURATION+SLEEP_DURATION);
  assert.ok(restPercent(advance(g,g.job.endsAt-1)) > 99.9);
  assert.equal(advance(g,g.job.endsAt-1).job.kind,'sleep');
  const awake=advance(g,g.job.endsAt);assert.equal(awake.restMs,AWAKE_DURATION);assert.equal(awake.job,null);
  assert.equal(awake.time,stocked().time-AWAKE_DURATION-SLEEP_DURATION);
});
test('after sleeping, fatigue begins declining again',()=>{
  const awake=advance(stocked(),AWAKE_DURATION+SLEEP_DURATION+60_000);assert.equal(awake.restMs,AWAKE_DURATION-60_000);
});
test('exhaustion pays accumulated work and resumes a fresh session after sleep',()=>{
  const source=act({...stocked(),restMs:15_000*WORK_RATE},'work',0);
  const asleep=advance(source,30_000);
  assert.equal(asleep.job.kind,'sleep');assert.equal(asleep.job.resumeWork,null);
  assert.equal(asleep.job.resumeTask,'work');
  const awake=advance(parseGame(JSON.stringify(asleep)),asleep.job.endsAt);
  assert.equal(awake.job.kind,'work');assert.equal(awake.job.workedMs,0);
  assert.equal(awake.time,source.time-awake.updatedAt+45_000);
  assert.equal(advance(awake,awake.updatedAt+30_000).job.workedMs,30_000);
});
test('sleep can complete offline over several day cycles',()=>{
  const g=advance(stocked(),2*(AWAKE_DURATION+SLEEP_DURATION));assert.equal(g.job,null);assert.equal(g.restMs,AWAKE_DURATION);assert.equal(g.food,92);
});
test('shop remains usable while sleeping but work is blocked',()=>{
  const sleep=advance(stocked(),AWAKE_DURATION);const bought=act(sleep,'eat',AWAKE_DURATION+1000);
  assert.equal(bought.food,sleep.food+1);assert.equal(bought.time,sleep.time-1000-120_000);assert.deepEqual(bought.job,sleep.job);
  assert.equal(unavailable(sleep,'work'),'Finish the current task first');
});
test('work cannot overlap and shop purchases do not interrupt it',()=>{
  const g=act(stocked(),'work',0);assert.deepEqual(act(g,'work',1000),advance(g,1000));assert.deepEqual(act(g,'eat',1000).job,advance(g,1000).job);
});
test('purchases cannot exhaust the balance',()=>{
  const g={...newGame(0),time:120_000};assert.equal(unavailable(g,'eat'),'Not enough time');assert.deepEqual(act(g,'eat',0),g);
});
test('buying before a meal preserves the deadline and prevents the penalty',()=>{
  const g=act(newGame(0),'eat',FOOD_INTERVAL-1);assert.equal(g.nextFoodAt,FOOD_INTERVAL);
  const end=advance(g,FOOD_INTERVAL);assert.equal(end.food,0);assert.equal(end.time,HOUR-120_000-FOOD_INTERVAL);
});
test('sleep never revives a player who runs out of life',()=>{
  const source={...stocked(),time:60_000,restMs:10_000};const dead=advance(source,600_000);
  assert.equal(dead.diedAt,60_000);assert.equal(dead.job,null);assert.equal(dead.time,0);
});
test('death at payday wins over the wage',()=>{
  const g=advance(act({...newGame(0),time:60_000},'work',0),60_000);assert.equal(g.time,0);assert.equal(g.diedAt,60_000);
});
test('meal penalty at payday can end the run before payment',()=>{
  const g=advance(act({...newGame(0),time:100_000,nextFoodAt:60_000},'work',0),60_000);assert.equal(g.time,0);
});
test('long absences and many ticks give identical fatigue, sleep, food and time',()=>{
  const source=act({...stocked(),restMs:15_000*WORK_RATE},'work',0);let split=source;
  for(let now=1000;now<=2*HOUR;now+=1000)split=advance(split,now);
  const whole = advance(source,2*HOUR);
  assert.ok(Math.abs(whole.restMs - split.restMs) < 1e-6);
  assert.deepEqual({ ...whole, restMs: 0 }, { ...split, restMs: 0 });
});
test('sleep and paused work survive saving and reload',()=>{
  const g=advance(act({...stocked(),restMs:15_000*WORK_RATE},'work',0),60_000);const saved=parseGame(JSON.stringify(g));assert.deepEqual(saved,g);assert.deepEqual(advance(saved,600_000),advance(g,600_000));
});
test('dead runs remain valid at an event boundary',()=>{
  const dead=advance({...newGame(0),time:360_000},360_000);assert.deepEqual(parseGame(JSON.stringify(dead)),dead);
});
test('invalid saves and impossible sleep states are rejected',()=>{
  for(const raw of ['null','{}','bad',JSON.stringify({...newGame(0),food:-1}),JSON.stringify({...newGame(0),restMs:AWAKE_DURATION+1}),JSON.stringify({...newGame(0),time:0}),JSON.stringify({...newGame(0),job:{kind:'sleep',duration:SLEEP_DURATION,endsAt:SLEEP_DURATION,reward:0,resumeWork:null}})])assert.equal(parseGame(raw),null);
});
test('previous prototype migrates balance, food and current work with full initial rest',()=>{
  const old={version:5,startedAt:0,updatedAt:0,time:HOUR,food:10,nextFoodAt:300_000,job:{endsAt:60_000,reward:120_000},diedAt:null};
  const g=migrateGame(JSON.stringify(old),1000);assert.equal(g.food,10);assert.equal(g.job.kind,'work');assert.equal(g.time,HOUR-1000);assert.equal(g.restMs,AWAKE_DURATION-1000*WORK_RATE);assert.equal(g.nextFoodAt,901_000);
});
test('backward device clock never grants time or rest',()=>{
  const g=advance(stocked(),1000);assert.deepEqual(advance(g,0),g);
});

test('manual sleep duration is proportional and restores rest continuously',()=>{
  const source=atRest(60);const sleep=act(source,'sleep',0);
  assert.equal(sleep.time,source.time);assert.equal(restPercent(sleep),60);assert.equal(sleep.job.kind,'sleep');assert.equal(sleep.job.endsAt,600_000);
  assert.equal(restPercent(advance(sleep,150_000)),70);
  const awake=advance(sleep,600_000);assert.equal(awake.restMs,AWAKE_DURATION);assert.equal(awake.job,null);assert.equal(awake.time,source.time-600_000);
});
test('manual sleep cannot interrupt work or restart ongoing sleep',()=>{
  const working=act(atRest(60),'work',0);assert.deepEqual(act(working,'sleep',1000),advance(working,1000));
  const sleep=act(atRest(60),'sleep',0);assert.deepEqual(act(sleep,'sleep',1000),advance(sleep,1000));
});
test('full rest and game over prevent manual sleep',()=>{
  assert.equal(unavailable(newGame(0),'sleep'),'Energy full');
  const dead=advance({...newGame(0),time:1000},1000);assert.deepEqual(act(dead,'sleep',2000),dead);
});
test('manual sleep is saved and still allows purchases',()=>{
  const sleep=act(atRest(60),'sleep',0);const saved=parseGame(JSON.stringify(sleep));assert.deepEqual(saved,sleep);
  const bought=act(saved,'eat',1000);assert.deepEqual(bought.job,sleep.job);assert.equal(bought.food,101);
});

test('large time reserves have no game cap and can still gain wages',()=>{
  const source={...newGame(0),time:90*24*HOUR,food:10};
  const paid=act(act(source,'work',0),'cancel-work',60_000);
  assert.equal(paid.time,source.time+120_000);
  assert.deepEqual(parseGame(JSON.stringify(paid)),paid);
});

test('wake up retains recovered rest and stops the sleep task',()=>{
  const source=act(atRest(40),'sleep',0);const stopped=act(source,'cancel',360_000);
  assert.equal(restPercent(stopped),64);assert.equal(stopped.job,null);assert.equal(stopped.time,source.time-360_000);
  assert.equal(advance(stopped,361_000).restMs,stopped.restMs-1000);
});
test('stopping work pays accrued wages once',()=>{
  const source=act(stocked(),'work',0);const stopped=act(source,'cancel',30_000);
  assert.equal(stopped.job,null);assert.equal(stopped.time,source.time-30_000+90_000);
  assert.equal(advance(stopped,120_000).time,source.time-120_000+90_000);
});
test('stopping an already stopped session cannot pay twice',()=>{
  const source=act(stocked(),'work',0);const stopped=act(source,'cancel',60_000);
  assert.equal(stopped.time,source.time+120_000);assert.equal(stopped.job,null);assert.deepEqual(act(stopped,'cancel',60_000),stopped);
});
test('housing restores full rest in twenty minutes',()=>{
  const source={...atRest(40),housing:'housed'};assert.equal(sleepDuration(source),720_000);
  const sleep=act(source,'sleep',0);assert.ok(Math.abs(restPercent(advance(sleep,240_000))-60)<1e-9);
  assert.equal(advance(sleep,720_000).restMs,AWAKE_DURATION);
});
test('recovered rest persists through reload, cancellation and offline time',()=>{
  const sleeping=advance(act(atRest(40),'sleep',0),60_000);
  const restored=parseGame(JSON.stringify(sleeping));assert.deepEqual(restored,sleeping);
  const awake=act(restored,'cancel',360_000);assert.equal(restPercent(awake),64);
});

test('initial work consumes energy faster than idle',()=>{
  const source=stocked();
  const idle=advance(source,60_000);
  const worked=advance(act(source,'work',0),60_000);
  assert.equal(source.restMs-idle.restMs,60_000);
  assert.ok(Math.abs(source.restMs-worked.restMs-60_000*WORK_RATE)<1e-6);
});
test('stopping work returns to the slower idle fatigue rate',()=>{
  const source=stocked();const cancelled=act(act(source,'work',0),'cancel',20_000);
  const later=advance(cancelled,40_000);assert.ok(Math.abs(source.restMs-later.restMs-(20_000*WORK_RATE+20_000))<1e-6);
});


test('rent costs four hours and lasts twenty-four hours',()=>{
  const source=stocked();const rented=act(source,'rent',0);
  assert.equal(RENT_COST,4*HOUR);assert.equal(RENT_DURATION,24*HOUR);
  assert.equal(rented.time,source.time-RENT_COST);assert.equal(rented.rentUntil,RENT_DURATION);
  assert.equal(advance(rented,RENT_DURATION).rentUntil,RENT_DURATION);
});
test('rent restores full rest in twenty minutes and remains active after waking',()=>{
  const rented=act(atRest(40),'rent',0);const sleep=act(rented,'sleep',0);
  assert.equal(sleep.job.duration,720_000);assert.equal(restPercent(advance(sleep,60_000)),45);
  const awake=act(sleep,'cancel',60_000);assert.equal(awake.rentUntil,RENT_DURATION);
  assert.equal(act(awake,'sleep',60_000).job.duration,660_000);
});
test('rent expiration during sleep immediately restores outdoor recovery',()=>{
  // Use valid zero-rest automatic sleep source via exhaustion.
  const rented={...atRest(1),restMs:10_000,rentUntil:70_000};
  const sleep=advance(rented,10_000);assert.equal(sleep.job.kind,'sleep');
  const partial=advance(sleep,70_000);assert.equal(restPercent(partial),5);
  assert.equal(partial.job.endsAt,1_495_000);
  assert.ok(Math.abs(restPercent(advance(partial,130_000))-9)<1e-9);
  assert.equal(advance(partial,1_495_000).restMs,AWAKE_DURATION);
});
test('renewal extends active rent and updates sleep completion',()=>{
  const rented=act(atRest(40),'rent',0);const renewed=act(rented,'rent',60_000);
  assert.equal(renewed.rentUntil,2*RENT_DURATION);
  const sleep=act({...atRest(0),restMs:1,rentUntil:1000},'sleep',0);
  const extended=act(sleep,'rent',500);assert.ok(extended.job.endsAt<sleep.job.endsAt);
});
test('rent bought during outdoor sleep speeds recovery immediately',()=>{
  const sleep=act(atRest(40),'sleep',0);const rented=act(sleep,'rent',60_000);
  assert.ok(Math.abs(restPercent(rented)-44)<1e-9);assert.equal(rented.job.endsAt,732_000);
  assert.equal(advance(rented,732_000).restMs,AWAKE_DURATION);
});
test('owning a home is a one-time twelve-day purchase with permanent twenty-minute recovery',()=>{
  assert.equal(HOME_COST,12*24*HOUR);
  const source={...atRest(40),time:HOME_COST+HOUR};const home=act(source,'home',0);
  assert.equal(home.time,HOUR);assert.equal(home.housing,'housed');assert.equal(unavailable(home,'home'),'Already owned');assert.equal(unavailable(home,'rent'),'Already owned');
  assert.equal(act(home,'sleep',0).job.duration,720_000);assert.deepEqual(parseGame(JSON.stringify(home)),home);
});
test('rent and home cannot spend all remaining life',()=>{
  for(const [action,cost] of [['rent',RENT_COST],['home',HOME_COST]]) {
    const source={...stocked(),time:cost};assert.equal(unavailable(source,action),'Not enough time');assert.deepEqual(act(source,action,0),source);
  }
});
test('rent expiration is identical online, offline and after reload',()=>{
  const source=act({...atRest(1),rentUntil:60_000},'sleep',0);let ticks=source;
  for(let t=1000;t<=600_000;t+=1000)ticks=advance(ticks,t);
  const whole=advance(source,600_000);
  assert.ok(Math.abs(whole.restMs-ticks.restMs)<.001);assert.equal(whole.time,ticks.time);
  const saved=parseGame(JSON.stringify(advance(source,30_000)));assert.deepEqual(advance(saved,600_000),whole);
});
test('unused legacy tickets are refunded when migrating to rentals',()=>{
  const old={...newGame(0),version:8,restMs:1_000_000,innTickets:2};delete old.rentUntil;
  const migrated=migrateGame(JSON.stringify(old),0);assert.equal(migrated.time,HOUR+600_000);assert.equal(migrated.rentUntil,0);
});

test('existing active rentals are corrected from six minutes to six real hours',()=>{
  const old={...stocked(),version:9,restMs:1_000_000,rentUntil:360_000};
  const migrated=migrateGame(JSON.stringify(old),1000);
  assert.equal(migrated.rentUntil,6*HOUR);
});

test('training pauses manually with progress saved and no extra fee on resume',()=>{
  const source=stocked();const started=act(source,'train-2',0);
  assert.equal(started.time,source.time);assert.equal(started.job.duration,1_800_000);
  const paused=act(started,'cancel',60_000);
  assert.equal(paused.job,null);assert.equal(paused.trainingProgress[2].remaining,1_740_000);
  const restored=parseGame(JSON.stringify(paused));assert.ok(restored);
  const resumed=act(restored,'train-2',120_000);
  assert.equal(resumed.time,source.time-120_000);assert.equal(resumed.job.trainingLevel,2);
});
test('exhaustion preserves training and automatically resumes it after sleep',()=>{
  const source=act({...stocked(),restMs:15_000*(2.8/2.5)},'train-3',0);
  const asleep=advance(source,30_000);
  assert.equal(asleep.job.kind,'sleep');assert.equal(asleep.job.resumeWork,null);
  assert.equal(asleep.trainingProgress[3].remaining,1_785_000);
  assert.equal(asleep.job.resumeTask,3);
  const awake=advance(parseGame(JSON.stringify(asleep)),asleep.job.endsAt);
  assert.equal(awake.job.kind,'training');assert.equal(awake.job.trainingLevel,3);
  assert.equal(awake.job.endsAt-awake.updatedAt,1_785_000);
  assert.equal(awake.trainingProgress[3],undefined);assert.equal(awake.careerLevel,0);
  const completed=advance(awake,awake.job.endsAt);
  assert.deepEqual(completed.qualifications,[3]);assert.equal(completed.job,null);
});
test('waking early leaves training paused',()=>{
  const source=act({...stocked(),restMs:500*(2.8/2.5)},'train-1',0);
  const awake=act(source,'wake',61_000);
  assert.equal(awake.job,null);assert.equal(awake.trainingProgress[1].remaining,1_799_500);
});
test('death during training grants no qualification',()=>{
  const source=act({...stocked(),time:1000},'train-3',0);
  const dead=advance(source,1000);
  assert.equal(dead.time,0);assert.equal(dead.job,null);assert.deepEqual(dead.qualifications,[]);
});
test('four careers use their continuous per-minute wages',()=>{
  for(let level=0;level<4;level++) {
    const source={...stocked(),careerLevel:level,qualifications:[1,2,3].filter(n=>n<=level)};
    const working=act(source,'work',0);
    assert.equal(working.job.workedMs,0);
    assert.equal(working.job.reward,CAREERS[level].reward);
    assert.equal(profession(source),CAREERS[level].name);
  }
});
test('legacy qualifications and balance remain accessible after migration',()=>{
  const old={...stocked(),version:11,restMs:1_000_000,trained:true};delete old.careerLevel;
  const migrated=migrateGame(JSON.stringify(old),0);
  assert.equal(migrated.careerLevel,1);assert.deepEqual(migrated.courses,[1]);
  assert.equal(migrated.time,old.time);
});

test('real epoch timestamps do not stall when exhaustion falls below clock precision',()=>{
  const epoch=1793650000000;
  for(const work of [false,true]) {
    let source={...newGame(epoch),food:10};
    if(work)source=act(source,'work',epoch);
    source.restMs=0.00005;
    const settled=advance(source,epoch+1000);
    assert.equal(settled.job.kind,'sleep');assert.equal(settled.updatedAt,epoch+1000);
    assert.ok(settled.restMs>0);
  }
});
test('real epoch timestamps resolve a tiny lifetime remainder without stalling',()=>{
  const epoch=1793650000000;
  const settled=advance({...newGame(epoch),time:0.00005},epoch+1000);
  assert.equal(settled.time,0);assert.equal(settled.diedAt,epoch);assert.equal(settled.job,null);
});

test('the Working cross collects pay once even when exhaustion intervenes before the click',()=>{
  const epoch=1793650000000;
  const source={...newGame(epoch),food:100,time:10*HOUR,courses:[1,2,3],equipment:[1,2,3],restMs:30_000*WORK_RATE};
  const working=act(source,'work',epoch);
  for(const delay of [20_000,30_000,30_100]) {
    const cancelled=act(working,'cancel-work',epoch+delay);
    assert.equal(cancelled.job?.resumeWork??null,null);
    assert.equal(cancelled.job?.kind??null,delay<30_000?null:'sleep');
    const later=advance(cancelled,epoch+2_000_000);
    assert.equal(later.time,source.time-2_000_000+Math.min(delay,30_000)*3);
    assert.equal(later.job,null);
    assert.ok(parseGame(JSON.stringify(later)));
  }
});

test('a delayed wake-up click does not start work after automatic sleep',()=>{
  const working=act({...stocked(),restMs:30_000*WORK_RATE},'work',0);
  const sleeping=advance(working,30_000);
  const resumed=act(sleeping,'wake',630_100);
  assert.equal(resumed.job,null);
});

test('repeated work, exhaustion, sleep and reload do not freeze at any test speed',()=>{
  // Isolate the synchronous simulation so a regression fails instead of hanging
  // the test runner, as it previously hung the browser's main thread.
  const result=spawnSync(process.execPath,['--input-type=module','-e',`
    import assert from 'node:assert/strict';
    import {newGame,act,advance,parseGame,HOUR} from ${JSON.stringify(new URL('../src/game.ts',import.meta.url).href)};
    const epoch=1793650000000;
    for(const speed of [1,2,4,8,16,32,64,128,256,512]) {
      // Cover the full simulated duration, including x512, without starvation.
      let g={...newGame(epoch),food:10000,time:100*HOUR};
      let sleeps=0,previous=null;
      for(let real=0;real<6000000;real+=101) {
        const now=epoch+real*speed;
        if(!g.job)g=act(g,'work',now);
        g=advance(g,now);
        assert.equal(g.updatedAt,now);
        if(g.job?.kind==='sleep' && previous!=='sleep')sleeps++;
        previous=g.job?.kind;
        if(real%10100===0) {
          g=parseGame(JSON.stringify(g));
          assert.ok(g);
        }
      }
      assert.ok(sleeps>0);
    }
  `],{timeout:10000,encoding:'utf8'});
  assert.equal(result.error,undefined,result.error?.message);
  assert.equal(result.status,0,result.stderr);
});

 test('older sleep saves drop queued work and keep queued training manually paused',()=>{
  for(const kind of ['work','training']) {
    const source=act({...stocked(),restMs:30_000},'sleep',0);
    source.job.resumeWork={kind,remaining:30_000,duration:60_000,reward:kind==='work'?WORK_REWARD:0};
    const restored=parseGame(JSON.stringify(source));assert.ok(restored);
    const settled=advance(restored,0);
    assert.equal(settled.job.resumeWork,null);
    assert.equal(settled.trainingProgress[1]?.remaining??null,kind==='training'?30_000:null);
    const awake=advance(settled,settled.job.endsAt);
    assert.equal(awake.job,null);assert.equal(awake.careerLevel,0);
    assert.equal(awake.time,source.time-awake.updatedAt);
  }
});

test('training consumes 2.8 energy per minute',()=>{
  const source=act(stocked(),'train',0);
  const trained=advance(source,60_000);
  assert.ok(Math.abs(restPercent(trained)-(100-2.8))<1e-9);
  const paused=act(trained,'pause-training',60_000);
  assert.ok(Math.abs(restPercent(advance(paused,120_000))-(100-2.8-2.5))<1e-9);
});
