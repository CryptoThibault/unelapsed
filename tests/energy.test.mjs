import test from 'node:test';
import assert from 'node:assert/strict';
import {act,advance,migrateGame,parseGame,ENERGY_MAX,PASSIVE_ENERGY_PER_MINUTE,TRAINING_ENERGY_PER_MINUTE,energyLevel,workEnergyPerMinute,energyUsePerMinute,energyRecoveryPerMinute,characterHoursToTimerMs,AWAKE_DURATION} from '../src/game.ts';

import { qualifiedGame as funded, close } from './helpers.mjs';

test('energy starts at one hundred and passive use matches the displayed per-minute rate',()=>{
  const g=funded();
  assert.equal(ENERGY_MAX,100);assert.equal(energyLevel(g),100);
  close(PASSIVE_ENERGY_PER_MINUTE,2.5);
  close(energyUsePerMinute(g),2.5);
  close(energyLevel(advance(g,60_000)),100-energyUsePerMinute(g));
});

test('work energy costs include passive use and match actual consumption for every career',()=>{
  for(let level=0;level<4;level++) {
    const g=act({...funded(),careerLevel:level},'work',0);
    close(workEnergyPerMinute(level),[2.9,2.8,2.7,2.6][level]);
    close(energyUsePerMinute(g),workEnergyPerMinute(level));
    close(energyLevel(advance(g,60_000)),100-workEnergyPerMinute(level));
  }
});

test('sleep recovers energy at its stated rate and has no passive drain',()=>{
  for(const housing of ['homeless','housed']) {
    const source={...funded(),housing,restMs:AWAKE_DURATION/2};
    const g=act(source,'sleep',0);
    assert.equal(energyUsePerMinute(g),0);
    close(energyRecoveryPerMinute(g),housing==='housed'?5:4);
    close(energyLevel(advance(g,60_000)),50+energyRecoveryPerMinute(g));
  }
});

test('work never costs less than passive use and sleep rates stay unchanged',()=>{
  close(PASSIVE_ENERGY_PER_MINUTE,2.5);
  for(let level=0;level<4;level++) {
    assert.ok(workEnergyPerMinute(level)>=PASSIVE_ENERGY_PER_MINUTE);
  }
  for(const housing of ['homeless','housed'])assert.ok(Number.isInteger(energyRecoveryPerMinute({...funded(),housing})));
});

test('explicit energy rates match exhaustion deadlines for all careers and housing states',()=>{
  const epoch=1793650000000;
  const rates=[2.9,2.8,2.7,2.6];
  assert.equal(characterHoursToTimerMs(17),42.5*60_000);
  for(const housing of ['homeless','housed']) {
    for(let level=0;level<4;level++) {
      const source={...funded(),startedAt:epoch,updatedAt:epoch,nextFoodAt:epoch+15*60_000,housing,careerLevel:level};
      const working=act(source,'work',epoch);
      const deadline=100/rates[level]*60_000;
      assert.equal(advance(working,epoch+deadline-1).job.kind,'work');
      const halfway=advance(working,epoch+deadline/2);
      close(energyLevel(halfway),50);
      const exhausted=advance(working,epoch+deadline+1);
      assert.equal(exhausted.job.kind,'sleep');
      close(exhausted.job.endsAt,epoch+deadline+(housing==='housed'?20:25)*60_000);
      assert.ok(parseGame(JSON.stringify(exhausted)));
    }
  }
});

test('training consumes exactly 2.8 energy per minute regardless of profession',()=>{
  assert.equal(TRAINING_ENERGY_PER_MINUTE,2.8);
  const source={...funded(),qualifications:[]};
  const training=act(source,'train-1',0);
  close(energyLevel(advance(training,100/2.8/2*60_000)),50);
  const completed=advance(training,30*60_000);
  assert.equal(completed.job,null);
  close(energyLevel(completed),16);
});

test('v19 migration preserves existing energy and recovery while applying character-hour budgets',()=>{
  for(const percent of [1,50,100]) {
    const old={...funded(),version:19,restMs:50*60_000*percent/100};
    const converted=migrateGame(JSON.stringify(old),0);
    close(energyLevel(converted),percent);assert.equal(converted.time,old.time);
    assert.equal(energyRecoveryPerMinute(converted),4);
    assert.deepEqual(parseGame(JSON.stringify(converted)),converted);
  }
});
