import type { Challenge, Mode } from '../domain/types';

const ALL_MODES: Mode[] = ['solo', 'coop', 'competition-turn', 'competition-simultaneous'];

export const CHALLENGES: Challenge[] = [
  { id: 'blocks', title: 'Baustein-Alarm', instruction: 'Räume herumliegende Bausteine weg.', icon: '🧱', durationSeconds: 120, enabledByDefault: true, supportedModes: ALL_MODES },
  { id: 'books', title: 'Bücher-Rettung', instruction: 'Stelle die Bücher zurück ins Regal.', icon: '📚', durationSeconds: 90, enabledByDefault: true, supportedModes: ALL_MODES },
  { id: 'clothes', title: 'Kleider-Mission', instruction: 'Bringe Kleidungsstücke an ihren Platz.', icon: '👕', durationSeconds: 120, enabledByDefault: true, supportedModes: ALL_MODES },
  { id: 'plush', title: 'Kuscheltier-Einsatz', instruction: 'Sammle die Kuscheltiere ein.', icon: '🧸', durationSeconds: 90, enabledByDefault: true, supportedModes: ALL_MODES },
  { id: 'floor', title: 'Boden-Blitz', instruction: 'Räume fünf Dinge vom Boden weg.', icon: '✋', durationSeconds: 120, enabledByDefault: true, supportedModes: ALL_MODES },
  { id: 'desk', title: 'Schreibtisch-Rettung', instruction: 'Räume drei Dinge vom Tisch an ihren Platz.', icon: '✏️', durationSeconds: 90, enabledByDefault: true, supportedModes: ALL_MODES },
  { id: 'shoes', title: 'Schuh-Patrouille', instruction: 'Stelle alle Schuhe ordentlich hin.', icon: '👟', durationSeconds: 90, enabledByDefault: true, supportedModes: ALL_MODES },
  { id: 'toys', title: 'Spielzeug-Station', instruction: 'Sortiere eine Spielzeugart an ihren Platz.', icon: '🚗', durationSeconds: 120, enabledByDefault: true, supportedModes: ALL_MODES },
];

export function getChallenge(id: string | undefined): Challenge | undefined {
  return CHALLENGES.find((c) => c.id === id);
}
