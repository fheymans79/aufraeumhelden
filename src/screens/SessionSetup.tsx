import { useState } from 'react';
import type { ConfirmationMode, Mode, RoundCount, SessionConfig } from '../domain/types';
import { CHALLENGES } from '../data/challenges.de';
import { MAX_NAME_LENGTH, playerCountFor } from '../domain/gameEngine';
import { useFocusOnMount } from '../app/hooks';
import { MODE_LABEL } from './labels';

interface Props {
  mode: Mode;
  disabledChallengeIds: string[];
  previous: SessionConfig | null;
  onStart: (config: SessionConfig, disabledChallengeIds: string[]) => void;
  onBack: () => void;
}

export function SessionSetup({ mode, disabledChallengeIds, previous, onStart, onBack }: Props) {
  const titleRef = useFocusOnMount<HTMLHeadingElement>();
  const count = playerCountFor(mode);
  const [names, setNames] = useState<string[]>(() => [previous?.playerNames[0] ?? '', previous?.playerNames[1] ?? '']);
  const [confirmation, setConfirmation] = useState<ConfirmationMode>(previous?.confirmationMode ?? 'self');
  const [rounds, setRounds] = useState<RoundCount>(previous?.rounds ?? 5);
  const [disabled, setDisabled] = useState<string[]>(disabledChallengeIds);
  const enabledIds = CHALLENGES.filter((c) => !disabled.includes(c.id) && c.supportedModes.includes(mode)).map((c) => c.id);

  const toggle = (id: string) => {
    setDisabled((d) => {
      if (d.includes(id)) return d.filter((x) => x !== id);
      // Mindestens eine Aufgabe muss aktiv bleiben.
      if (enabledIds.length <= 1) return d;
      return [...d, id];
    });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (enabledIds.length === 0) return;
    onStart({ mode, confirmationMode: confirmation, playerNames: names.slice(0, count), rounds, enabledChallengeIds: enabledIds }, disabled);
  };

  return (
    <main className="screen">
      <div className="topbar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Zurück
        </button>
        <span className="pill">{MODE_LABEL[mode]}</span>
      </div>
      <h1 ref={titleRef} tabIndex={-1} className="screen-title">
        Spiel vorbereiten
      </h1>
      <form className="stack setup" onSubmit={submit}>
        <fieldset className="card fieldset">
          <legend>{count === 1 ? 'Wer spielt?' : 'Wer spielt mit?'}</legend>
          {Array.from({ length: count }, (_, i) => (
            <label key={i} className="field">
              <span>Name Held {i + 1}</span>
              <input
                type="text"
                value={names[i]}
                maxLength={MAX_NAME_LENGTH}
                placeholder={`Held ${i + 1}`}
                autoComplete="off"
                onChange={(e) => setNames((n) => n.map((v, j) => (j === i ? e.target.value : v)))}
              />
            </label>
          ))}
        </fieldset>

        <fieldset className="card fieldset">
          <legend>Wer bestätigt, dass die Aufgabe erledigt ist?</legend>
          <div className="choice-row">
            <label className={`choice ${confirmation === 'self' ? 'is-on' : ''}`}>
              <input type="radio" name="confirmation" checked={confirmation === 'self'} onChange={() => setConfirmation('self')} />
              <span aria-hidden="true">🙋</span> Ich bestätige selbst
            </label>
            <label className={`choice ${confirmation === 'adult' ? 'is-on' : ''}`}>
              <input type="radio" name="confirmation" checked={confirmation === 'adult'} onChange={() => setConfirmation('adult')} />
              <span aria-hidden="true">🧑</span> Erwachsene bestätigen
            </label>
          </div>
        </fieldset>

        <fieldset className="card fieldset">
          <legend>{mode === 'competition-turn' ? 'Wie viele Aufgaben pro Held?' : 'Wie viele Aufgaben?'}</legend>
          <div className="choice-row">
            {([3, 5, 7] as const).map((n) => (
              <label key={n} className={`choice choice-num ${rounds === n ? 'is-on' : ''}`}>
                <input type="radio" name="rounds" checked={rounds === n} onChange={() => setRounds(n)} />
                {n}
              </label>
            ))}
          </div>
        </fieldset>

        <details className="card details">
          <summary>Aufgaben auswählen (für Erwachsene)</summary>
          <p className="muted small">Passt eine Aufgabe nicht zu eurem Zimmer, schaltet sie hier aus. Mindestens eine bleibt aktiv.</p>
          <ul className="task-list">
            {CHALLENGES.filter((c) => c.supportedModes.includes(mode)).map((c) => {
              const on = enabledIds.includes(c.id);
              return (
                <li key={c.id}>
                  <label className="task-toggle">
                    <input type="checkbox" checked={on} disabled={on && enabledIds.length <= 1} onChange={() => toggle(c.id)} />
                    <span aria-hidden="true" className="task-icon">
                      {c.icon}
                    </span>
                    {c.title}
                  </label>
                </li>
              );
            })}
          </ul>
        </details>

        <button type="submit" className="btn btn-primary btn-xl btn-block" disabled={enabledIds.length === 0}>
          Los geht’s!
        </button>
      </form>
    </main>
  );
}
