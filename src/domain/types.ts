export type Mode = 'solo' | 'coop' | 'competition-turn' | 'competition-simultaneous';
export type ConfirmationMode = 'self' | 'adult';
export type PlayerStatus = 'pending' | 'completed' | 'skipped';
export type SessionPhase = 'setup' | 'wheel' | 'challenge' | 'reward' | 'results';
export type RoundCount = 3 | 5 | 7;

export type BadgeId = 'first-mission' | 'tidy-hero';

export interface Player {
  id: string;
  name: string;
  points: number;
  coins: number;
  badges: BadgeId[];
}

export interface Challenge {
  id: string;
  title: string;
  instruction: string;
  icon: string;
  durationSeconds: number;
  enabledByDefault: boolean;
  supportedModes: Mode[];
}

export interface PlayerRoundResult {
  status: PlayerStatus;
  confirmedAt?: string;
  pointsAwarded: number;
  coinsAwarded: number;
}

export interface RoundResult {
  roundId: string;
  challengeId: string;
  playerResults: Record<string, PlayerRoundResult>;
}

/**
 * Timer-Zustand. Die Zeitberechnung basiert auf realen Zeitstempeln,
 * nicht auf der Anzahl Intervall-Ticks.
 */
export interface TimerState {
  durationMs: number;
  /** Restzeit zum Zeitpunkt `lastResumedAt` bzw. beim letzten Pausieren. */
  remainingMs: number;
  running: boolean;
  started: boolean;
  /** Epoch-Millisekunden des letzten Starts/Fortsetzens. */
  lastResumedAt?: number;
  unlimited: boolean;
}

export interface TeamScore {
  points: number;
  coins: number;
}

export interface EarnedBadge {
  playerId: string;
  badge: BadgeId;
  /** Runde, in der das Abzeichen verdient wurde. */
  round: number;
}

export interface GameSession {
  id: string;
  mode: Mode;
  confirmationMode: ConfirmationMode;
  players: Player[];
  roundsPerPlayerOrTeam: RoundCount;
  phase: SessionPhase;
  /** Index der laufenden Runde bzw. des laufenden Zuges (0-basiert). */
  currentRound: number;
  activePlayerId?: string;
  activeChallengeId?: string;
  /** Ergebnis der laufenden Runde, solange sie nicht abgeschlossen ist. */
  currentResult?: RoundResult;
  results: RoundResult[];
  recentChallengeIds: string[];
  enabledChallengeIds: string[];
  teamScore: TeamScore;
  timer?: TimerState;
  earnedBadges: EarnedBadge[];
  startedAt: string;
  updatedAt: string;
}

export interface SessionConfig {
  mode: Mode;
  confirmationMode: ConfirmationMode;
  playerNames: string[];
  rounds: RoundCount;
  enabledChallengeIds: string[];
  /** Bereits früher verdiente Abzeichen je Spielername. */
  knownBadges?: Record<string, BadgeId[]>;
}

export type Rng = () => number;
