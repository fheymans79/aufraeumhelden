import { useCallback, useEffect, useState } from 'react';
import { useAppState } from './store';
import { usePrefersReducedMotion } from './hooks';
import { useRegisterSW } from './pwa';
import { Home } from '../screens/Home';
import { ModeSelect } from '../screens/ModeSelect';
import { SessionSetup } from '../screens/SessionSetup';
import { Settings } from '../screens/Settings';
import { Game } from '../screens/Game';
import { Results } from '../screens/Results';

export function App() {
  const { state, dispatch, game, reset } = useAppState();
  const systemReduced = usePrefersReducedMotion();
  const reduceMotion = state.data.settings.reduceMotion || systemReduced;
  const session = state.data.activeSession;
  const [abortRequested, setAbortRequested] = useState(false);
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  // Zurück-Navigation (Browser/Wischgeste) während eines Spiels: Warnung statt stillem Abbruch.
  const inGame = session !== null;
  useEffect(() => {
    if (!inGame) return;
    window.history.pushState({ game: true }, '');
    const onPop = () => {
      window.history.pushState({ game: true }, '');
      setAbortRequested(true);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [inGame]);

  const abort = useCallback(() => dispatch({ type: 'abort', now: Date.now() }), [dispatch]);

  let content;
  if (session) {
    content = (
      <Game
        session={session}
        game={game}
        reduceMotion={reduceMotion}
        sound={state.data.settings.sound}
        onAbort={abort}
        abortRequested={abortRequested}
        setAbortRequested={setAbortRequested}
      />
    );
  } else if (state.finished) {
    const finished = state.finished;
    content = (
      <Results
        session={finished}
        profiles={state.data.profiles}
        onHome={() => dispatch({ type: 'leaveResults', screen: 'home' })}
        onAgain={() => {
          if (state.lastConfig) dispatch({ type: 'start', config: state.lastConfig, now: Date.now() });
          else dispatch({ type: 'leaveResults', screen: 'mode' });
        }}
      />
    );
  } else {
    switch (state.screen) {
      case 'mode':
        content = (
          <ModeSelect onBack={() => dispatch({ type: 'navigate', screen: 'home' })} onChoose={(mode) => dispatch({ type: 'chooseMode', mode })} />
        );
        break;
      case 'setup':
        content = (
          <SessionSetup
            key={state.draftMode}
            mode={state.draftMode}
            previous={state.lastConfig}
            disabledChallengeIds={state.data.settings.disabledChallengeIds}
            onBack={() => dispatch({ type: 'navigate', screen: 'mode' })}
            onStart={(config, disabledChallengeIds) => {
              dispatch({ type: 'settings', patch: { disabledChallengeIds } });
              dispatch({ type: 'start', config, now: Date.now() });
            }}
          />
        );
        break;
      case 'settings':
        content = (
          <Settings
            settings={state.data.settings}
            profiles={Object.values(state.data.profiles)}
            onChange={(patch) => dispatch({ type: 'settings', patch })}
            onReset={reset}
            onBack={() => dispatch({ type: 'navigate', screen: 'home' })}
          />
        );
        break;
      default:
        content = (
          <Home
            onStart={() => dispatch({ type: 'navigate', screen: 'mode' })}
            onSettings={() => dispatch({ type: 'navigate', screen: 'settings' })}
            updateAvailable={needRefresh}
            onUpdate={() => void updateServiceWorker(true)}
          />
        );
    }
  }

  return (
    <div className={`app ${reduceMotion ? 'reduce-motion' : ''}`}>
      {state.recovered && (
        <div className="banner" role="alert">
          <span>Der gespeicherte Spielstand war beschädigt und wurde zurückgesetzt.</span>
          <button type="button" className="btn btn-secondary" onClick={() => dispatch({ type: 'dismissRecovered' })}>
            OK
          </button>
        </div>
      )}
      {content}
    </div>
  );
}
