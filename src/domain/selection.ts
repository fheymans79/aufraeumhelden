import type { Challenge, Mode, Rng } from './types';
import { cryptoRng, randomIndex } from './random';

export function eligibleChallenges(all: Challenge[], enabledIds: string[], mode: Mode): Challenge[] {
  return all.filter((c) => enabledIds.includes(c.id) && c.supportedModes.includes(mode));
}

export interface Selection {
  challengeId: string;
  recentChallengeIds: string[];
}

/**
 * Wählt fair eine Challenge aus den geeigneten Aufgaben.
 * Wiederholt keine Aufgabe, bevor alle geeigneten einmal dran waren.
 * Nach Erschöpfung wird der Pool zurückgesetzt; dabei wird die zuletzt
 * gezogene Aufgabe (wenn möglich) nicht direkt erneut gezogen.
 */
export function selectChallenge(
  eligible: Challenge[],
  recentChallengeIds: string[],
  rng: Rng = cryptoRng,
): Selection {
  if (eligible.length === 0) throw new Error('Keine aktiven Aufgaben');
  const ids = eligible.map((c) => c.id);
  const recent = recentChallengeIds.filter((id) => ids.includes(id));
  let candidates = ids.filter((id) => !recent.includes(id));
  let base = recent;
  if (candidates.length === 0) {
    const last = recent[recent.length - 1];
    candidates = ids.length > 1 ? ids.filter((id) => id !== last) : ids;
    base = [];
  }
  const challengeId = candidates[randomIndex(candidates.length, rng)];
  return { challengeId, recentChallengeIds: [...base, challengeId] };
}
