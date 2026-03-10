/**
 * validateSaju.ts
 * Validation engine for Saju calculation accuracy.
 */

export interface SajuResult {
  year: { stem: string; branch: string };
  month: { stem: string; branch: string };
  day: { stem: string; branch: string };
  hour: { stem: string; branch: string };
  originalInput: { year: number; month: number; day: number; hour: number; minute: number };
}

export interface ValidationEntry {
  input: { year: number; month: number; day: number; hour: number; minute: number };
  expected: {
    year: { stem: string; branch: string };
    month: { stem: string; branch: string };
    day: { stem: string; branch: string };
    hour: { stem: string; branch: string };
  };
}

export function validateSajuResult(computed: SajuResult, expected: ValidationEntry['expected']) {
  const checks = {
    yearMatch: computed.year.stem === expected.year.stem && computed.year.branch === expected.year.branch,
    monthMatch: computed.month.stem === expected.month.stem && computed.month.branch === expected.month.branch,
    dayMatch: computed.day.stem === expected.day.stem && computed.day.branch === expected.day.branch,
    hourMatch: computed.hour.stem === expected.hour.stem && computed.hour.branch === expected.hour.branch,
  };

  const allValid = Object.values(checks).every(v => v);

  return {
    status: allValid ? "VALID" : "INVALID",
    checks
  };
}
