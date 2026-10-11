import type { BadgeId } from './types';

export interface BadgeInfo {
  id: BadgeId;
  title: string;
  description: string;
  icon: string;
}

export const BADGES: Record<BadgeId, BadgeInfo> = {
  'first-mission': { id: 'first-mission', title: 'Erster Einsatz', description: 'Die erste Aufgabe geschafft!', icon: '🌟' },
  'tidy-hero': { id: 'tidy-hero', title: 'AufräumHeld', description: 'Eine ganze Runde durchgespielt!', icon: '🦸' },
};
