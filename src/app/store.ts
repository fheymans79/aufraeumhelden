import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { GameSession, Mode, SessionConfig } from '../domain/types';
import { createSession } from '../domain/gameEngine';
import {
  clearLocalStorage,
  commitSession,
  emptyData,
  knownBadges,
  loadFromLocalStorage,
  saveToLocalStorage,
  type Settings,
  type StoredData,
} from '../storage/storage';

export type Screen = 'home' | 'mode' | 'setup' | 'settings';

export interface AppState {
  data: StoredData;
  screen: Screen;
  draftMode: Mode;
  /** Abgeschlossene Session für den Ergebnisbildschirm (bereits in Profile übertragen). */
  finished: GameSession | null;
  lastConfig: SessionConfig | null;
  recovered: boolean;
}

type Action =
  | { type: 'navigate'; screen: Screen }
  | { type: 'chooseMode'; mode: Mode }
  | { type: 'start'; config: SessionConfig; now: number }
  | { type: 'game'; update: (s: GameSession) => GameSession; now: number }
  | { type: 'abort'; now: number }
  | { type: 'leaveResults'; screen: Screen }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'reset' }
  | { type: 'dismissRecovered' };

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'navigate':
      return { ...state, screen: action.screen };
    case 'chooseMode':
      return { ...state, draftMode: action.mode, screen: 'setup' };
    case 'start': {
      if (state.data.activeSession) return state;
      const config = { ...action.config, knownBadges: knownBadges(state.data) };
      const session = createSession(config, action.now);
      return { ...state, finished: null, lastConfig: action.config, data: { ...state.data, activeSession: session } };
    }
    case 'game': {
      const current = state.data.activeSession;
      if (!current) return state;
      const next = action.update(current);
      if (next === current) return state;
      if (next.phase === 'results') {
        return { ...state, finished: next, data: commitSession(state.data, next, true, action.now) };
      }
      return { ...state, data: { ...state.data, activeSession: next } };
    }
    case 'abort': {
      const current = state.data.activeSession;
      if (!current) return state;
      return { ...state, screen: 'home', data: commitSession(state.data, current, false, action.now) };
    }
    case 'leaveResults':
      return { ...state, finished: null, screen: action.screen };
    case 'settings':
      return { ...state, data: { ...state.data, settings: { ...state.data.settings, ...action.patch } } };
    case 'reset':
      return { ...state, data: emptyData(), finished: null, lastConfig: null, screen: 'home' };
    case 'dismissRecovered':
      return { ...state, recovered: false };
  }
}

export function initState(): AppState {
  const { data, recovered } = loadFromLocalStorage();
  return { data, screen: 'home', draftMode: 'solo', finished: null, lastConfig: null, recovered };
}

export function useAppState() {
  const [state, dispatch] = useReducer(reducer, undefined, initState);
  const dataRef = useRef(state.data);
  dataRef.current = state.data;

  // Jede Änderung speichern; ein laufender Timer wird dabei mit Restzeit eingefroren.
  useEffect(() => {
    saveToLocalStorage(state.data);
  }, [state.data]);

  // Während der Timer läuft, regelmässig die Restzeit sichern; beim Verlassen der Seite ebenfalls.
  const timerRunning = state.data.activeSession?.timer?.running ?? false;
  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => saveToLocalStorage(dataRef.current), 1000);
    return () => window.clearInterval(id);
  }, [timerRunning]);

  useEffect(() => {
    const save = () => saveToLocalStorage(dataRef.current);
    const onVisibility = () => document.visibilityState === 'hidden' && save();
    window.addEventListener('pagehide', save);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('pagehide', save);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, []);

  const game = useCallback((update: (s: GameSession) => GameSession) => dispatch({ type: 'game', update, now: Date.now() }), []);
  const reset = useCallback(() => {
    clearLocalStorage();
    dispatch({ type: 'reset' });
  }, []);

  return { state, dispatch, game, reset };
}
