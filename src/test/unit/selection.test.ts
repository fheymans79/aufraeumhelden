import { describe, expect, it } from 'vitest';
import { eligibleChallenges, selectChallenge } from '../../domain/selection';
import { CHALLENGES } from '../../data/challenges.de';
import { ALL_IDS, seededRng } from '../fixtures';

describe('selectChallenge', () => {
  it('wählt nur aktive und für den Modus geeignete Aufgaben', () => {
    const custom = [...CHALLENGES, { ...CHALLENGES[0], id: 'solo-only', supportedModes: ['solo' as const] }];
    const eligible = eligibleChallenges(custom, ['books', 'solo-only'], 'coop');
    expect(eligible.map((c) => c.id)).toEqual(['books']);
    const rng = seededRng(1);
    for (let i = 0; i < 20; i++) expect(selectChallenge(eligible, [], rng).challengeId).toBe('books');
  });

  it('wiederholt keine Aufgabe, bevor alle einmal dran waren', () => {
    const rng = seededRng(7);
    let recent: string[] = [];
    const seen: string[] = [];
    for (let i = 0; i < ALL_IDS.length; i++) {
      const sel = selectChallenge(CHALLENGES, recent, rng);
      seen.push(sel.challengeId);
      recent = sel.recentChallengeIds;
    }
    expect(new Set(seen).size).toBe(ALL_IDS.length);
  });

  it('setzt den Pool nach Erschöpfung zurück, ohne die letzte Aufgabe direkt zu wiederholen', () => {
    const rng = seededRng(3);
    const recent = [...ALL_IDS];
    const sel = selectChallenge(CHALLENGES, recent, rng);
    expect(sel.challengeId).not.toBe(ALL_IDS[ALL_IDS.length - 1]);
    expect(sel.recentChallengeIds).toEqual([sel.challengeId]);
  });

  it('kommt mit nur einer aktiven Aufgabe ohne Endlosschleife aus', () => {
    const one = eligibleChallenges(CHALLENGES, ['shoes'], 'solo');
    let recent: string[] = [];
    for (let i = 0; i < 5; i++) {
      const sel = selectChallenge(one, recent, seededRng(i));
      expect(sel.challengeId).toBe('shoes');
      recent = sel.recentChallengeIds;
    }
  });

  it('ist ungefähr gleichverteilt', () => {
    const rng = seededRng(99);
    const counts: Record<string, number> = {};
    for (let i = 0; i < 8000; i++) {
      const id = selectChallenge(CHALLENGES, [], rng).challengeId;
      counts[id] = (counts[id] ?? 0) + 1;
    }
    for (const id of ALL_IDS) expect(counts[id]).toBeGreaterThan(850);
  });

  it('wirft bei leerem Pool', () => {
    expect(() => selectChallenge([], [], seededRng())).toThrow();
  });
});
