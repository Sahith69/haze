import { describe, it, expect } from 'vitest';
import { classify, betaScore, recencyFactor } from './scoring';

const zero = { completions: 0, early_skips: 0, late_skips: 0, liked: 0 };

describe('classify (200s track)', () => {
  it.each([
    [10, 'skip_early'], [29, 'skip_early'], [30, 'skip_late'], [150, 'skip_late'],
    [185, 'complete'], [195, 'complete'], [200, 'complete'],
  ])('%is -> %s', (secs, outcome) => {
    expect(classify(secs, 200_000)).toBe(outcome);
  });
  it('scales the early-skip window for short tracks (60s)', () => {
    expect(classify(10, 60_000)).toBe('skip_early');
    expect(classify(13, 60_000)).toBe('skip_late');
  });
});

describe('betaScore', () => {
  it('is neutral with no data', () => expect(betaScore(zero)).toBeCloseTo(0.5, 10));
  it('rises with completions', () => {
    expect(betaScore({ ...zero, completions: 1 })).toBeCloseTo(3 / 5, 10);
    expect(betaScore({ ...zero, completions: 10 })).toBeGreaterThan(betaScore({ ...zero, completions: 1 }));
  });
  it('early skips hurt more than late skips', () => {
    expect(betaScore({ ...zero, early_skips: 1 })).toBeCloseTo(2 / 6.5, 10);
    expect(betaScore({ ...zero, early_skips: 1 })).toBeLessThan(betaScore({ ...zero, late_skips: 1 }));
  });
  it('a like adds a bonus', () => {
    expect(betaScore({ ...zero, liked: 1 })).toBeCloseTo(4 / 6, 10);
  });
  it('stays strictly between 0 and 1', () => {
    const s = betaScore({ ...zero, early_skips: 1000 });
    expect(s).toBeGreaterThan(0); expect(s).toBeLessThan(1);
  });
});

describe('recencyFactor', () => {
  const now = 1_700_000_000_000;
  it('is 1 when never played', () => expect(recencyFactor(null, now)).toBe(1));
  it('is 0 right after playing', () => expect(recencyFactor(now, now)).toBeCloseTo(0, 10));
  it('is 0.5 after one half-life (48h)', () => expect(recencyFactor(now - 48 * 3.6e6, now)).toBeCloseTo(0.5, 10));
  it('is 0.75 after two half-lives', () => expect(recencyFactor(now - 96 * 3.6e6, now)).toBeCloseTo(0.75, 10));
  it('does not go negative if the clock moved backwards', () => {
    expect(recencyFactor(now + 1000, now)).toBeGreaterThanOrEqual(0);
  });
});
