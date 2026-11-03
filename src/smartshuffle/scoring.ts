export const CONFIG = {
  priorA: 2, priorB: 2,
  earlySkipSeconds: 30,
  completeFraction: 0.9,
  earlySkipWeight: 2.5,
  lateSkipWeight: 0.7,
  likeBonus: 2,
  recencyHalfLifeHours: 48,
};

export type Outcome = 'complete' | 'skip_early' | 'skip_late';

export function classify(secondsPlayed: number, durationMs: number): Outcome {
  const dur = durationMs / 1000;
  const early = Math.min(CONFIG.earlySkipSeconds, dur * 0.2);
  if (secondsPlayed >= dur * CONFIG.completeFraction || dur - secondsPlayed <= 8) return 'complete';
  if (secondsPlayed < early) return 'skip_early';
  return 'skip_late';
}

export function betaScore(c: {
  completions: number; early_skips: number; late_skips: number; liked: number;
}): number {
  const pos = c.completions + (c.liked ? CONFIG.likeBonus : 0);
  const neg = c.early_skips * CONFIG.earlySkipWeight + c.late_skips * CONFIG.lateSkipWeight;
  return (CONFIG.priorA + pos) / (CONFIG.priorA + CONFIG.priorB + pos + neg);
}

// 0 right after playing, rising toward 1; null (never played) = 1.
export function recencyFactor(lastPlayedAt: number | null, now = Date.now()): number {
  if (!lastPlayedAt) return 1;
  const hours = Math.max(0, (now - lastPlayedAt) / 3.6e6);
  return 1 - Math.exp((-hours * Math.LN2) / CONFIG.recencyHalfLifeHours);
}
