import { describe, expect, it } from 'vitest';
import {
  TEAM_ID,
  advance,
  awardCompletion,
  computeWinner,
  createSession,
  isRoundFinished,
  nextTurn,
  revealChallenge,
  sanitizeName,
  skipChallenge,
  spinWheel,
  totalRounds,
} from '../../domain/gameEngine';
import type { GameSession } from '../../domain/types';
import { CHALLENGES } from '../../data/challenges.de';
import { config, seededRng } from '../fixtures';

const rng = seededRng(5);
const toChallenge = (s: GameSession) => revealChallenge(spinWheel(s, CHALLENGES, rng, 0), CHALLENGES, 0);

describe('createSession', () => {
  it('setzt Standardnamen und kürzt auf 20 Zeichen', () => {
    const s = createSession(config({ mode: 'coop', playerNames: ['', 'A'.repeat(30)] }), 0, rng);
    expect(s.players.map((p) => p.name)).toEqual(['Held 1', 'A'.repeat(20)]);
    expect(s.phase).toBe('wheel');
  });

  it('Solo hat einen Spieler, alle anderen Modi zwei', () => {
    expect(createSession(config({ mode: 'solo' }), 0, rng).players).toHaveLength(1);
    expect(createSession(config({ mode: 'competition-simultaneous' }), 0, rng).players).toHaveLength(2);
  });

  it('entfernt Steuerzeichen aus Namen', () => {
    expect(sanitizeName('Le\u0000o\nnie', 'x')).toBe('Leonie');
  });

  it('verlangt mindestens eine aktive Aufgabe', () => {
    expect(() => createSession(config({ enabledChallengeIds: [] }), 0, rng)).toThrow();
  });
});

describe('Spinnen und Phasen', () => {
  it('zieht genau einmal und verhindert doppeltes Drehen', () => {
    const s = spinWheel(createSession(config(), 0, rng), CHALLENGES, rng, 0);
    const again = spinWheel(s, CHALLENGES, rng, 0);
    expect(again).toBe(s);
    expect(s.activeChallengeId).toBeDefined();
  });

  it('Bestätigung ist nur in der Challenge-Phase erlaubt', () => {
    const s = createSession(config(), 0, rng);
    expect(awardCompletion(s, 'p1', 0)).toBe(s);
  });
});

describe('awardCompletion', () => {
  it('vergibt 10 Punkte und 1 Münze und ist idempotent', () => {
    let s = toChallenge(createSession(config(), 0, rng));
    s = awardCompletion(s, 'p1', 1);
    const twice = awardCompletion(s, 'p1', 2);
    expect(twice).toBe(s);
    expect(s.players[0]).toMatchObject({ points: 10, coins: 1 });
    expect(s.phase).toBe('reward');
  });

  it('vergibt „Erster Einsatz“ nur einmal je Profil', () => {
    let s = toChallenge(createSession(config(), 0, rng));
    s = awardCompletion(s, 'p1', 1);
    expect(s.earnedBadges).toEqual([{ playerId: 'p1', badge: 'first-mission', round: 0 }]);
    s = toChallenge(advance(s, 2));
    s = awardCompletion(s, 'p1', 3);
    expect(s.earnedBadges).toHaveLength(1);

    const known = createSession(config({ knownBadges: { Leonie: ['first-mission'] } }), 0, rng);
    const after = awardCompletion(toChallenge(known), 'p1', 1);
    expect(after.earnedBadges).toHaveLength(0);
  });

  it('Kooperation bucht aufs Teamkonto, nicht doppelt je Kind', () => {
    let s = toChallenge(createSession(config({ mode: 'coop' }), 0, rng));
    expect(Object.keys(s.currentResult!.playerResults)).toEqual([TEAM_ID]);
    s = awardCompletion(s, TEAM_ID, 1);
    expect(s.teamScore).toEqual({ points: 10, coins: 1 });
    expect(s.players.every((p) => p.points === 0)).toBe(true);
  });

  it('Überspringen gibt 0 Punkte und schliesst den Zug ab', () => {
    let s = toChallenge(createSession(config(), 0, rng));
    s = skipChallenge(s, 'p1', 1);
    expect(s.players[0].points).toBe(0);
    expect(s.results[0].playerResults.p1.status).toBe('skipped');
    expect(s.phase).toBe('reward');
  });
});

describe('nextTurn / Wechselmodus', () => {
  it('alterniert strikt A/B/A/B/A/B bei 3 Runden je Spieler', () => {
    let s = createSession(config({ mode: 'competition-turn' }), 0, rng);
    expect(totalRounds(s)).toBe(6);
    const order: string[] = [];
    while (s.phase !== 'results') {
      s = toChallenge(s);
      order.push(s.activePlayerId!);
      s = advance(awardCompletion(s, s.activePlayerId!, 1), 2);
    }
    expect(order).toEqual(['p1', 'p2', 'p1', 'p2', 'p1', 'p2']);
    expect(s.players.map((p) => p.points)).toEqual([30, 30]);
    expect(nextTurn({ ...s, currentRound: 0 })).toBe('p2');
  });
});

describe('isRoundFinished / Simultanmodus', () => {
  it('wartet auf beide Spieler', () => {
    let s = toChallenge(createSession(config({ mode: 'competition-simultaneous' }), 0, rng));
    s = awardCompletion(s, 'p1', 1);
    expect(s.phase).toBe('challenge');
    expect(isRoundFinished(s.currentResult)).toBe(false);
    expect(advance(s, 2)).toBe(s);
    s = skipChallenge(s, 'p2', 3);
    expect(s.phase).toBe('reward');
    expect(s.results[0].challengeId).toBeDefined();
  });

  it('beide Spieler bekommen dieselbe Aufgabe', () => {
    const s = toChallenge(createSession(config({ mode: 'competition-simultaneous' }), 0, rng));
    expect(Object.keys(s.currentResult!.playerResults)).toEqual(['p1', 'p2']);
  });
});

describe('computeWinner', () => {
  const play = (pattern: ('c' | 's')[][]) => {
    let s = createSession(config({ mode: 'competition-simultaneous' }), 0, rng);
    for (const round of pattern) {
      s = toChallenge(s);
      round.forEach((r, i) => {
        s = r === 'c' ? awardCompletion(s, `p${i + 1}`, 1) : skipChallenge(s, `p${i + 1}`, 1);
      });
      s = advance(s, 2);
    }
    return s;
  };

  it('erkennt Sieg', () => {
    const s = play([['c', 'c'], ['c', 's'], ['c', 'c']]);
    expect(s.phase).toBe('results');
    expect(computeWinner(s)).toEqual({ kind: 'winner', playerId: 'p1' });
  });

  it('erkennt Gleichstand', () => {
    expect(computeWinner(play([['c', 's'], ['s', 'c'], ['c', 'c']]))).toEqual({ kind: 'tie' });
  });

  it('kein Gewinner ausserhalb des Wettkampfs', () => {
    expect(computeWinner(createSession(config({ mode: 'coop' }), 0, rng))).toEqual({ kind: 'none' });
  });
});

describe('Session-Ende', () => {
  it('vergibt „AufräumHeld“ nach vollständiger Session', () => {
    let s = createSession(config({ rounds: 3 }), 0, rng);
    for (let i = 0; i < 3; i++) s = advance(awardCompletion(toChallenge(s), 'p1', 1), 2);
    expect(s.phase).toBe('results');
    expect(s.players[0].badges).toEqual(['first-mission', 'tidy-hero']);
    expect(s.players[0]).toMatchObject({ points: 30, coins: 3 });
  });
});
