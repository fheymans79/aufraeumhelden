import type { TimerState } from './types';

export function createTimer(durationSeconds: number): TimerState {
  const durationMs = durationSeconds * 1000;
  return { durationMs, remainingMs: durationMs, running: false, started: false, unlimited: false };
}

export function remainingMs(t: TimerState, now: number): number {
  if (!t.running || t.lastResumedAt === undefined) return Math.max(0, t.remainingMs);
  return Math.max(0, t.remainingMs - Math.max(0, now - t.lastResumedAt));
}

export function isExpired(t: TimerState, now: number): boolean {
  return !t.unlimited && t.started && remainingMs(t, now) === 0;
}

export function startTimer(t: TimerState, now: number): TimerState {
  if (t.started) return t;
  return { ...t, started: true, running: true, lastResumedAt: now };
}

export function pauseTimer(t: TimerState, now: number): TimerState {
  if (!t.running) return t;
  return { ...t, running: false, remainingMs: remainingMs(t, now), lastResumedAt: undefined };
}

export function resumeTimer(t: TimerState, now: number): TimerState {
  if (t.running || !t.started || t.unlimited) return t;
  return { ...t, running: true, lastResumedAt: now };
}

/** Zeitlimit aufheben: der Countdown verschwindet, die Aufgabe läuft weiter. */
export function removeLimit(t: TimerState, now: number): TimerState {
  return { ...pauseTimer(t, now), started: true, unlimited: true };
}

/**
 * Zustand für die Speicherung: Ein laufender Timer wird mit der aktuellen
 * Restzeit eingefroren. Nach einem Reload ist er pausiert und zählt nicht
 * verdeckt weiter.
 */
export function freezeTimer(t: TimerState, now: number): TimerState {
  return pauseTimer(t, now);
}

export function formatTime(ms: number): string {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}
