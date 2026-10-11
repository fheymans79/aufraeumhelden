import { describe, expect, it } from 'vitest';
import { createTimer, freezeTimer, isExpired, pauseTimer, remainingMs, removeLimit, resumeTimer, startTimer } from '../../domain/timer';

describe('Timer', () => {
  it('zählt anhand realer Zeit herunter', () => {
    const t = startTimer(createTimer(90), 1000);
    expect(remainingMs(t, 1000)).toBe(90_000);
    expect(remainingMs(t, 31_000)).toBe(60_000);
  });

  it('Pause stoppt die Zeit, Fortsetzen läuft weiter', () => {
    let t = startTimer(createTimer(60), 0);
    t = pauseTimer(t, 10_000);
    expect(remainingMs(t, 50_000)).toBe(50_000);
    t = resumeTimer(t, 50_000);
    expect(remainingMs(t, 55_000)).toBe(45_000);
  });

  it('Reload: eingefrorener Timer ist pausiert und zählt nicht verdeckt weiter', () => {
    const t = startTimer(createTimer(60), 0);
    const frozen = freezeTimer(t, 20_000);
    expect(frozen.running).toBe(false);
    expect(remainingMs(frozen, 999_999)).toBe(40_000);
  });

  it('Zeitablauf wird erkannt und fällt nicht unter 0', () => {
    const t = startTimer(createTimer(10), 0);
    expect(isExpired(t, 9_000)).toBe(false);
    expect(isExpired(t, 11_000)).toBe(true);
    expect(remainingMs(t, 20_000)).toBe(0);
  });

  it('ohne Zeitlimit läuft nichts ab', () => {
    const t = removeLimit(startTimer(createTimer(10), 0), 5_000);
    expect(t.unlimited).toBe(true);
    expect(isExpired(t, 100_000)).toBe(false);
    expect(resumeTimer(t, 6000).running).toBe(false);
  });

  it('doppelter Start ändert nichts', () => {
    const t = startTimer(createTimer(10), 0);
    expect(startTimer(t, 5000)).toBe(t);
  });
});
