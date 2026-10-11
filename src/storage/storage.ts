import type { BadgeId, GameSession, Mode, TimerState } from '../domain/types';
import { freezeTimer } from '../domain/timer';
import { scoreboard } from '../domain/gameEngine';

export const SCHEMA_VERSION = 1;
export const STORAGE_KEY = 'aufraeumhelden';

export interface Settings {
  reduceMotion: boolean;
  sound: boolean;
  disabledChallengeIds: string[];
}

export interface Profile {
  name: string;
  badges: BadgeId[];
  coins: number;
  points: number;
}

export interface CompletedSessionSummary {
  id: string;
  mode: Mode;
  finishedAt: string;
  scores: { name: string; points: number; coins: number }[];
}

export interface StoredData {
  schemaVersion: typeof SCHEMA_VERSION;
  settings: Settings;
  profiles: Record<string, Profile>;
  activeSession: GameSession | null;
  completedSessions: CompletedSessionSummary[];
}

export const DEFAULT_SETTINGS: Settings = { reduceMotion: false, sound: false, disabledChallengeIds: [] };

export function emptyData(): StoredData {
  return { schemaVersion: SCHEMA_VERSION, settings: { ...DEFAULT_SETTINGS }, profiles: {}, activeSession: null, completedSessions: [] };
}

const MODES: Mode[] = ['solo', 'coop', 'competition-turn', 'competition-simultaneous'];
const PHASES = ['wheel', 'challenge', 'reward', 'results'];
const BADGE_IDS: BadgeId[] = ['first-mission', 'tidy-hero'];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown): v is string => typeof v === 'string';
const isStrArr = (v: unknown): v is string[] => Array.isArray(v) && v.every(isStr);

function validTimer(t: unknown): t is TimerState {
  return isObj(t) && isNum(t.durationMs) && isNum(t.remainingMs) && typeof t.running === 'boolean' && typeof t.started === 'boolean' && typeof t.unlimited === 'boolean';
}

export function isValidSession(v: unknown): v is GameSession {
  if (!isObj(v)) return false;
  if (!isStr(v.id) || !MODES.includes(v.mode as Mode) || !PHASES.includes(v.phase as string)) return false;
  if (v.confirmationMode !== 'self' && v.confirmationMode !== 'adult') return false;
  if (![3, 5, 7].includes(v.roundsPerPlayerOrTeam as number) || !isNum(v.currentRound)) return false;
  const expectedPlayers = v.mode === 'solo' ? 1 : 2;
  if (!Array.isArray(v.players) || v.players.length !== expectedPlayers) return false;
  if (!v.players.every((p) => isObj(p) && isStr(p.id) && isStr(p.name) && isNum(p.points) && isNum(p.coins) && isStrArr(p.badges))) return false;
  if (!Array.isArray(v.results) || !isStrArr(v.recentChallengeIds) || !isStrArr(v.enabledChallengeIds) || v.enabledChallengeIds.length === 0) return false;
  if (!isObj(v.teamScore) || !isNum(v.teamScore.points) || !isNum(v.teamScore.coins)) return false;
  if (!Array.isArray(v.earnedBadges)) return false;
  if (v.timer !== undefined && !validTimer(v.timer)) return false;
  if (v.phase === 'challenge' && (!isObj(v.currentResult) || !validTimer(v.timer))) return false;
  return true;
}

function sanitizeSettings(v: unknown): Settings {
  if (!isObj(v)) return { ...DEFAULT_SETTINGS };
  return {
    reduceMotion: typeof v.reduceMotion === 'boolean' ? v.reduceMotion : DEFAULT_SETTINGS.reduceMotion,
    sound: typeof v.sound === 'boolean' ? v.sound : DEFAULT_SETTINGS.sound,
    disabledChallengeIds: isStrArr(v.disabledChallengeIds) ? v.disabledChallengeIds : [],
  };
}

function sanitizeProfiles(v: unknown): Record<string, Profile> {
  const out: Record<string, Profile> = {};
  if (!isObj(v)) return out;
  for (const [key, p] of Object.entries(v)) {
    if (!isObj(p) || !isStr(p.name)) continue;
    out[key] = {
      name: p.name,
      badges: isStrArr(p.badges) ? (p.badges.filter((b) => BADGE_IDS.includes(b as BadgeId)) as BadgeId[]) : [],
      coins: isNum(p.coins) ? p.coins : 0,
      points: isNum(p.points) ? p.points : 0,
    };
  }
  return out;
}

export interface LoadResult {
  data: StoredData;
  /** true, wenn gespeicherte Daten beschädigt waren und (teilweise) verworfen wurden. */
  recovered: boolean;
}

/**
 * Liest gespeicherte Daten defensiv. Unbekannte Versionen oder kaputtes
 * JSON führen zu einem frischen Stand; ein ungültiger Spielstand wird
 * verworfen, Einstellungen und Profile bleiben wenn möglich erhalten.
 */
export function parseStoredData(raw: string | null): LoadResult {
  if (raw === null) return { data: emptyData(), recovered: false };
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { data: emptyData(), recovered: true };
  }
  if (!isObj(parsed) || parsed.schemaVersion !== SCHEMA_VERSION) return { data: emptyData(), recovered: true };
  let recovered = false;
  let activeSession: GameSession | null = null;
  if (parsed.activeSession !== null && parsed.activeSession !== undefined) {
    if (isValidSession(parsed.activeSession)) activeSession = restoreSession(parsed.activeSession);
    else recovered = true;
  }
  return {
    data: {
      schemaVersion: SCHEMA_VERSION,
      settings: sanitizeSettings(parsed.settings),
      profiles: sanitizeProfiles(parsed.profiles),
      activeSession,
      completedSessions: Array.isArray(parsed.completedSessions) ? (parsed.completedSessions as CompletedSessionSummary[]).slice(-20) : [],
    },
    recovered,
  };
}

/** Nach einem Reload ist der Timer immer pausiert, mit der gespeicherten Restzeit. */
export function restoreSession(s: GameSession): GameSession {
  if (!s.timer) return s;
  return { ...s, timer: { ...s.timer, running: false, lastResumedAt: undefined } };
}

export function serialize(data: StoredData, now: number = Date.now()): string {
  const session = data.activeSession;
  const frozen = session?.timer ? { ...session, timer: freezeTimer(session.timer, now) } : session;
  return JSON.stringify({ ...data, activeSession: frozen });
}

/** Überträgt Münzen, Punkte und Abzeichen einer beendeten oder abgebrochenen Session in die Profile. */
export function commitSession(data: StoredData, session: GameSession, finished: boolean, now = Date.now()): StoredData {
  const profiles = { ...data.profiles };
  const bump = (name: string, points: number, coins: number, badges: BadgeId[]) => {
    const prev = profiles[name] ?? { name, badges: [], coins: 0, points: 0 };
    profiles[name] = {
      name,
      points: prev.points + points,
      coins: prev.coins + coins,
      badges: Array.from(new Set([...prev.badges, ...badges])),
    };
  };
  if (session.mode === 'coop') {
    for (const p of session.players) bump(p.name, 0, 0, p.badges);
    const team = scoreboard(session)[0];
    bump(`Team ${team.name}`, team.points, team.coins, []);
  } else {
    for (const p of session.players) bump(p.name, p.points, p.coins, p.badges);
  }
  const completedSessions = finished
    ? [
        ...data.completedSessions,
        { id: session.id, mode: session.mode, finishedAt: new Date(now).toISOString(), scores: scoreboard(session).map(({ name, points, coins }) => ({ name, points, coins })) },
      ].slice(-20)
    : data.completedSessions;
  return { ...data, profiles, completedSessions, activeSession: null };
}

export function knownBadges(data: StoredData): Record<string, BadgeId[]> {
  return Object.fromEntries(Object.values(data.profiles).map((p) => [p.name, p.badges]));
}

export function loadFromLocalStorage(): LoadResult {
  try {
    return parseStoredData(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { data: emptyData(), recovered: false };
  }
}

export function saveToLocalStorage(data: StoredData, now = Date.now()): void {
  try {
    localStorage.setItem(STORAGE_KEY, serialize(data, now));
  } catch {
    // Speicher voll oder blockiert (z. B. privater Modus): Spiel läuft ohne Speicherung weiter.
  }
}

export function clearLocalStorage(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignorieren */
  }
}
