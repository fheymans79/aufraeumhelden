import type {
  BadgeId,
  Challenge,
  GameSession,
  Player,
  PlayerRoundResult,
  RoundResult,
  Rng,
  SessionConfig,
} from './types';
import { COINS_PER_CHALLENGE, POINTS_PER_CHALLENGE } from './scoring';
import { eligibleChallenges, selectChallenge } from './selection';
import { createId, cryptoRng } from './random';
import { createTimer, pauseTimer, removeLimit, resumeTimer, startTimer } from './timer';

/** Akteur-ID für das gemeinsame Teamkonto im Kooperationsmodus. */
export const TEAM_ID = 'team';
export const MAX_NAME_LENGTH = 20;

export function playerCountFor(mode: GameSession['mode']): 1 | 2 {
  return mode === 'solo' ? 1 : 2;
}

export function sanitizeName(raw: string, fallback: string): string {
  const cleaned = raw.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, MAX_NAME_LENGTH);
  return cleaned.length > 0 ? cleaned : fallback;
}

export function createSession(config: SessionConfig, now: number = Date.now(), rng: Rng = cryptoRng): GameSession {
  const count = playerCountFor(config.mode);
  if (config.enabledChallengeIds.length === 0) throw new Error('Mindestens eine Aufgabe muss aktiv sein');
  const players: Player[] = Array.from({ length: count }, (_, i) => {
    const name = sanitizeName(config.playerNames[i] ?? '', `Held ${i + 1}`);
    return { id: `p${i + 1}`, name, points: 0, coins: 0, badges: [...(config.knownBadges?.[name] ?? [])] };
  });
  const iso = new Date(now).toISOString();
  return {
    id: createId(rng),
    mode: config.mode,
    confirmationMode: config.confirmationMode,
    players,
    roundsPerPlayerOrTeam: config.rounds,
    phase: 'wheel',
    currentRound: 0,
    activePlayerId: players[0].id,
    results: [],
    recentChallengeIds: [],
    enabledChallengeIds: [...config.enabledChallengeIds],
    teamScore: { points: 0, coins: 0 },
    earnedBadges: [],
    startedAt: iso,
    updatedAt: iso,
  };
}

/** Gesamtzahl Runden bzw. Züge. Im Wechselmodus gilt die Anzahl pro Spieler. */
export function totalRounds(s: GameSession): number {
  return s.mode === 'competition-turn' ? s.roundsPerPlayerOrTeam * 2 : s.roundsPerPlayerOrTeam;
}

/** Wer in der laufenden Runde eine Aufgabe abschliessen muss. */
export function actorsForRound(s: GameSession): string[] {
  switch (s.mode) {
    case 'solo':
      return [s.players[0].id];
    case 'coop':
      return [TEAM_ID];
    case 'competition-turn':
      return [s.activePlayerId ?? s.players[0].id];
    case 'competition-simultaneous':
      return s.players.map((p) => p.id);
  }
}

/** Nächster Spieler im Wechselmodus: strikt abwechselnd. */
export function nextTurn(s: GameSession): string | undefined {
  if (s.mode !== 'competition-turn') return s.players[0].id;
  return s.players[(s.currentRound + 1) % s.players.length].id;
}

export function isRoundFinished(result: RoundResult | undefined): boolean {
  if (!result) return false;
  return Object.values(result.playerResults).every((r) => r.status !== 'pending');
}

function touch(s: GameSession, now: number): GameSession {
  return { ...s, updatedAt: new Date(now).toISOString() };
}

export function canSpin(s: GameSession): boolean {
  return s.phase === 'wheel' && s.activeChallengeId === undefined;
}

/** Zieht die Challenge einmalig vor der Animation. */
export function spinWheel(s: GameSession, catalog: Challenge[], rng: Rng = cryptoRng, now = Date.now()): GameSession {
  if (!canSpin(s)) return s;
  const eligible = eligibleChallenges(catalog, s.enabledChallengeIds, s.mode);
  const sel = selectChallenge(eligible, s.recentChallengeIds, rng);
  return touch({ ...s, activeChallengeId: sel.challengeId, recentChallengeIds: sel.recentChallengeIds }, now);
}

export function revealChallenge(s: GameSession, catalog: Challenge[], now = Date.now()): GameSession {
  if (s.phase !== 'wheel' || !s.activeChallengeId) return s;
  const challenge = catalog.find((c) => c.id === s.activeChallengeId);
  if (!challenge) return s;
  const playerResults: Record<string, PlayerRoundResult> = {};
  for (const id of actorsForRound(s)) playerResults[id] = { status: 'pending', pointsAwarded: 0, coinsAwarded: 0 };
  return touch(
    {
      ...s,
      phase: 'challenge',
      timer: createTimer(challenge.durationSeconds),
      currentResult: { roundId: `${s.id}-r${s.currentRound + 1}`, challengeId: challenge.id, playerResults },
    },
    now,
  );
}

function withTimer(s: GameSession, fn: (t: NonNullable<GameSession['timer']>) => GameSession['timer'], now: number) {
  if (s.phase !== 'challenge' || !s.timer) return s;
  const timer = fn(s.timer);
  return timer === s.timer ? s : touch({ ...s, timer }, now);
}

export const startChallengeTimer = (s: GameSession, now = Date.now()) => withTimer(s, (t) => startTimer(t, now), now);
export const pauseChallengeTimer = (s: GameSession, now = Date.now()) => withTimer(s, (t) => pauseTimer(t, now), now);
export const resumeChallengeTimer = (s: GameSession, now = Date.now()) => withTimer(s, (t) => resumeTimer(t, now), now);
export const removeTimeLimit = (s: GameSession, now = Date.now()) => withTimer(s, (t) => removeLimit(t, now), now);

function grantBadge(s: GameSession, playerId: string, badge: BadgeId): GameSession {
  const player = s.players.find((p) => p.id === playerId);
  if (!player || player.badges.includes(badge)) return s;
  return {
    ...s,
    players: s.players.map((p) => (p.id === playerId ? { ...p, badges: [...p.badges, badge] } : p)),
    earnedBadges: [...s.earnedBadges, { playerId, badge, round: s.currentRound }],
  };
}

function finishRoundIfDone(s: GameSession, now: number): GameSession {
  if (!isRoundFinished(s.currentResult) || !s.currentResult) return s;
  return {
    ...s,
    phase: 'reward',
    results: [...s.results, s.currentResult],
    currentResult: undefined,
    timer: s.timer ? pauseTimer(s.timer, now) : undefined,
  };
}

function settle(
  s: GameSession,
  actorId: string,
  status: 'completed' | 'skipped',
  now: number,
): GameSession {
  if (s.phase !== 'challenge' || !s.currentResult) return s;
  const current = s.currentResult.playerResults[actorId];
  // Idempotenz: bereits abgeschlossene Akteure werden nie erneut gebucht.
  if (!current || current.status !== 'pending') return s;

  const completed = status === 'completed';
  const points = completed ? POINTS_PER_CHALLENGE : 0;
  const coins = completed ? COINS_PER_CHALLENGE : 0;
  let next: GameSession = {
    ...s,
    currentResult: {
      ...s.currentResult,
      playerResults: {
        ...s.currentResult.playerResults,
        [actorId]: {
          status,
          confirmedAt: completed ? new Date(now).toISOString() : undefined,
          pointsAwarded: points,
          coinsAwarded: coins,
        },
      },
    },
  };

  if (completed) {
    if (actorId === TEAM_ID) {
      next = { ...next, teamScore: { points: next.teamScore.points + points, coins: next.teamScore.coins + coins } };
      for (const p of next.players) next = grantBadge(next, p.id, 'first-mission');
    } else {
      next = {
        ...next,
        players: next.players.map((p) =>
          p.id === actorId ? { ...p, points: p.points + points, coins: p.coins + coins } : p,
        ),
      };
      next = grantBadge(next, actorId, 'first-mission');
    }
  }
  return touch(finishRoundIfDone(next, now), now);
}

/** Bestätigte Erledigung: +10 Punkte, +1 Münze. Idempotent. */
export const awardCompletion = (s: GameSession, actorId: string, now = Date.now()) => settle(s, actorId, 'completed', now);

/** Überspringen: 0 Punkte, zählt als Zug. */
export const skipChallenge = (s: GameSession, actorId: string, now = Date.now()) => settle(s, actorId, 'skipped', now);

export function isSessionComplete(s: GameSession): boolean {
  return s.results.length >= totalRounds(s);
}

/** Nach der Belohnung: nächste Runde oder Ergebnis. */
export function advance(s: GameSession, now = Date.now()): GameSession {
  if (s.phase !== 'reward') return s;
  if (isSessionComplete(s)) {
    let done: GameSession = { ...s, phase: 'results', activeChallengeId: undefined, timer: undefined };
    for (const p of done.players) done = grantBadge(done, p.id, 'tidy-hero');
    return touch(done, now);
  }
  return touch(
    {
      ...s,
      phase: 'wheel',
      activePlayerId: nextTurn(s),
      currentRound: s.currentRound + 1,
      activeChallengeId: undefined,
      timer: undefined,
    },
    now,
  );
}

export type WinnerResult = { kind: 'winner'; playerId: string } | { kind: 'tie' } | { kind: 'none' };

export function computeWinner(s: GameSession): WinnerResult {
  if (s.mode !== 'competition-turn' && s.mode !== 'competition-simultaneous') return { kind: 'none' };
  const [a, b] = s.players;
  if (a.points === b.points) return { kind: 'tie' };
  return { kind: 'winner', playerId: a.points > b.points ? a.id : b.id };
}

/** Punkte- und Münzanzeige je Spieler bzw. für das Team. */
export function scoreboard(s: GameSession): { id: string; name: string; points: number; coins: number }[] {
  if (s.mode === 'coop') {
    return [{ id: TEAM_ID, name: s.players.map((p) => p.name).join(' & '), ...s.teamScore }];
  }
  return s.players.map((p) => ({ id: p.id, name: p.name, points: p.points, coins: p.coins }));
}

export function actorName(s: GameSession, actorId: string): string {
  if (actorId === TEAM_ID) return 'Team';
  return s.players.find((p) => p.id === actorId)?.name ?? '';
}
