import { describe, expect, it } from 'vitest';
import { commitSession, emptyData, parseStoredData, serialize } from '../../storage/storage';
import { advance, awardCompletion, createSession, revealChallenge, spinWheel, startChallengeTimer } from '../../domain/gameEngine';
import { remainingMs } from '../../domain/timer';
import { CHALLENGES } from '../../data/challenges.de';
import { config, seededRng } from '../fixtures';

const rng = seededRng(11);

describe('restoreSession / parseStoredData', () => {
  it('liefert frische Daten ohne gespeicherten Stand', () => {
    expect(parseStoredData(null)).toEqual({ data: emptyData(), recovered: false });
  });

  it('stellt eine gültige Session mit pausiertem Timer wieder her', () => {
    let s = revealChallenge(spinWheel(createSession(config(), 0, rng), CHALLENGES, rng, 0), CHALLENGES, 0);
    s = startChallengeTimer(s, 1000);
    const raw = serialize({ ...emptyData(), activeSession: s }, 31_000);
    const { data, recovered } = parseStoredData(raw);
    expect(recovered).toBe(false);
    const t = data.activeSession!.timer!;
    expect(t.running).toBe(false);
    expect(remainingMs(t, 10_000_000)).toBe(s.timer!.durationMs - 30_000);
  });

  it('verwirft kaputtes JSON', () => {
    expect(parseStoredData('{kaputt').recovered).toBe(true);
  });

  it('verwirft alte Schema-Versionen', () => {
    const r = parseStoredData(JSON.stringify({ schemaVersion: 0, activeSession: null }));
    expect(r.recovered).toBe(true);
    expect(r.data).toEqual(emptyData());
  });

  it('verwirft eine ungültige Session, behält aber Einstellungen', () => {
    const raw = JSON.stringify({ ...emptyData(), settings: { reduceMotion: true, sound: true, disabledChallengeIds: ['books'] }, activeSession: { id: 1 } });
    const r = parseStoredData(raw);
    expect(r.recovered).toBe(true);
    expect(r.data.activeSession).toBeNull();
    expect(r.data.settings).toEqual({ reduceMotion: true, sound: true, disabledChallengeIds: ['books'] });
  });
});

describe('commitSession', () => {
  it('sammelt Münzen und Abzeichen im Profil', () => {
    let s = createSession(config({ rounds: 3 }), 0, rng);
    for (let i = 0; i < 3; i++) {
      s = revealChallenge(spinWheel(s, CHALLENGES, rng, 0), CHALLENGES, 0);
      s = advance(awardCompletion(s, 'p1', 1), 2);
    }
    let data = commitSession({ ...emptyData(), activeSession: s }, s, true);
    data = commitSession(data, s, true);
    expect(data.profiles.Leonie).toMatchObject({ coins: 6, points: 60, badges: ['first-mission', 'tidy-hero'] });
    expect(data.activeSession).toBeNull();
    expect(data.completedSessions).toHaveLength(2);
  });
});
