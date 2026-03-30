import { describe, it, expect } from 'vitest';
import { calculateSaju } from '../calculateSaju.ts';
import { calculateZiwei } from '../lib/ziweiEngine.ts';
import { analyzeSajuStructure } from '../aiSajuAnalysis.ts';
import { buildEnginePrompts } from '../integratedReadingEngine.ts';

/**
 * P2-14: Snapshot Test Suite
 * captures core engine outputs to prevent logic regression.
 */
describe('Engine Symbolic Snapshots', () => {

  // 1. Jehun Case (Standard Solar, Male)
  it('Snapshots: Jehun (1987-07-17 15:30 M Solar)', async () => {
    const year = 1987, month = 7, day = 17, hour = 15, minute = 30;
    const gender = 'M';
    const lng = 126.978; // Seoul

    const sajuRaw = calculateSaju(year, month, day, hour, minute, gender, lng, true, 'keep_day', false);
    const sajuAnalysis = await analyzeSajuStructure(sajuRaw);
    
    // Ziwei requires Lunar date for the calculation logic
    // 1987-07-17 Solar -> 1987-06-22 Lunar
    const ziweiRaw = calculateZiwei(year, 6, 22, hour, minute, 'male');
    
    const input = { 
      birthInfo: { year, month, day, hour, minute, gender, isLunar: false },
      sajuData: {} 
    };
    const prompts = buildEnginePrompts(input, sajuRaw, sajuAnalysis, ziweiRaw);

    // Snapshot individual components
    expect(sajuRaw.year).toMatchSnapshot('saju_year');
    expect(sajuRaw.month).toMatchSnapshot('saju_month');
    expect(sajuRaw.day).toMatchSnapshot('saju_day');
    expect(sajuRaw.hour).toMatchSnapshot('saju_hour');
    expect(sajuAnalysis.dayMaster).toMatchSnapshot('day_master');
    expect(sajuAnalysis.elements).toMatchSnapshot('elements');
    expect(ziweiRaw.mingGong).toMatchSnapshot('ziwei_minggong');
    expect(ziweiRaw.bureau).toMatchSnapshot('ziwei_bureau');
    
    // Snapshot combined prompts
    expect(prompts.sajuSymbolic).toMatchSnapshot('saju_prompt');
    expect(prompts.ziweiPrompt).toMatchSnapshot('ziwei_prompt');
  });

  // 2. Lunar Case (1990-05-05 10:00 F Lunar)
  it('Snapshots: Lunar Profile (1990-05-05 10:00 F Lunar)', async () => {
    // 1990-05-05 Lunar -> 1990-05-29 Solar
    const sYear = 1990, sMonth = 5, sDay = 29;
    const lMonth = 5, lDay = 5;
    const hour = 10, minute = 0;
    const gender = 'F';

    const sajuRaw = calculateSaju(sYear, sMonth, sDay, hour, minute, gender, 126.978, true, 'keep_day', false);
    const sajuAnalysis = await analyzeSajuStructure(sajuRaw);
    const ziweiRaw = calculateZiwei(sYear, lMonth, lDay, hour, minute, 'female');

    const input = { 
      birthInfo: { year: 1990, month: 5, day: 5, hour, minute, gender, isLunar: true },
      sajuData: {} 
    };
    const prompts = buildEnginePrompts(input, sajuRaw, sajuAnalysis, ziweiRaw);

    expect(sajuRaw.year).toMatchSnapshot('lunar_saju_year');
    expect(prompts.sajuSymbolic).toMatchSnapshot('lunar_saju_prompt');
    expect(prompts.ziweiPrompt).toMatchSnapshot('lunar_ziwei_prompt');
  });

  // 3. Midnight Transition (Yajasi Check)
  it('Snapshots: Midnight Transition (2000-01-01 00:01 F Solar)', async () => {
    const year = 2000, month = 1, day = 1, hour = 0, minute = 1;
    const gender = 'F';

    // Yajasi mode test: 'keep_day' (traditional)
    const sajuRaw = calculateSaju(year, month, day, hour, minute, gender, 126.978, true, 'keep_day', false);
    const sajuAnalysis = await analyzeSajuStructure(sajuRaw);
    
    // 2000-01-01 Solar -> 1999-11-25 Lunar
    const ziweiRaw = calculateZiwei(year, 11, 25, hour, minute, 'female');

    const input = { 
      birthInfo: { year, month, day, hour, minute, gender, isLunar: false },
      sajuData: {} 
    };
    const prompts = buildEnginePrompts(input, sajuRaw, sajuAnalysis, ziweiRaw);

    expect(sajuRaw.year).toMatchSnapshot('midnight_saju_year');
    expect(prompts.sajuSymbolic).toMatchSnapshot('midnight_saju_prompt');
  });

});
