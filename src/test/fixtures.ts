import type { Rng, SessionConfig } from '../domain/types';
import { CHALLENGES } from '../data/challenges.de';

/** Deterministischer Zufall für Tests (mulberry32). */
export function seededRng(seed = 42): Rng {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const ALL_IDS = CHALLENGES.map((c) => c.id);

export function config(over: Partial<SessionConfig> = {}): SessionConfig {
  return {
    mode: 'solo',
    confirmationMode: 'self',
    playerNames: ['Leonie', 'Mia'],
    rounds: 3,
    enabledChallengeIds: ALL_IDS,
    ...over,
  };
}
