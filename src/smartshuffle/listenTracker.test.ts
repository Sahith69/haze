import { describe, it, expect } from 'vitest';
import { ListenTracker } from './listenTracker';

const run = (t: ListenTracker, from: number, to: number, step = 0.5, playing = true) => {
  for (let x = from; x <= to + 1e-9; x += step) t.update(x, playing);
};

describe('ListenTracker', () => {
  it('counts continuous playback', () => {
    const t = new ListenTracker(); t.start('a');
    run(t, 0, 10);
    expect(t.seconds()).toBeCloseTo(10, 5);
  });

  it('ignores a forward scrub', () => {
    const t = new ListenTracker(); t.start('a');
    run(t, 0, 5); run(t, 200, 205);
    expect(t.seconds()).toBeCloseTo(10, 5);
  });

  it('ignores a backward seek and counts from the new position', () => {
    const t = new ListenTracker(); t.start('a');
    run(t, 100, 110); run(t, 20, 25);
    expect(t.seconds()).toBeCloseTo(15, 5);
  });

  it('does not count paused time', () => {
    const t = new ListenTracker(); t.start('a');
    run(t, 0, 5);
    run(t, 5, 5, 0.5, false); t.update(5, false); t.update(5, false);
    run(t, 5, 8);
    expect(t.seconds()).toBeCloseTo(8, 5);
  });

  it('does not count a stalled position (buffering)', () => {
    const t = new ListenTracker(); t.start('a');
    t.update(0, true); t.update(1, true);
    for (let i = 0; i < 20; i++) t.update(1, true);
    expect(t.seconds()).toBeCloseTo(1, 5);
  });

  it('ignores updates before start and non-finite times', () => {
    const t = new ListenTracker();
    t.update(5, true);
    expect(t.seconds()).toBe(0);
    t.start('a'); t.update(NaN, true); t.update(Infinity, true);
    expect(t.seconds()).toBe(0);
  });

  it('stop() returns the total once, then null', () => {
    const t = new ListenTracker(); t.start('a'); run(t, 0, 4);
    expect(t.stop()).toEqual({ id: 'a', seconds: expect.closeTo(4, 5) });
    expect(t.stop()).toBeNull();
    expect(t.activeId()).toBeNull();
  });

  it('start() resets everything', () => {
    const t = new ListenTracker(); t.start('a'); run(t, 0, 4);
    t.start('b'); expect(t.seconds()).toBe(0);
    run(t, 50, 52); expect(t.seconds()).toBeCloseTo(2, 5);
  });
});
