import { useEffect, useMemo, useState } from 'react';
import type { GameSession } from '../domain/types';
import { CHALLENGES, getChallenge } from '../data/challenges.de';
import { eligibleChallenges } from '../domain/selection';
import {
  TEAM_ID,
  actorName,
  actorsForRound,
  advance,
  awardCompletion,
  isSessionComplete,
  nextTurn,
  pauseChallengeTimer,
  removeTimeLimit,
  resumeChallengeTimer,
  revealChallenge,
  scoreboard,
  skipChallenge,
  spinWheel,
  startChallengeTimer,
  totalRounds,
} from '../domain/gameEngine';
import { formatTime, isExpired, remainingMs } from '../domain/timer';
import { BADGES } from '../domain/badges';
import { ScoreBoard } from '../components/ScoreBoard';
import { Modal } from '../components/Modal';
import { Wheel, type SpinKind } from '../components/Wheel';
import { useFocusOnMount, useNow } from '../app/hooks';
import { playChime } from '../app/sound';

type GameFn = (update: (s: GameSession) => GameSession) => void;

interface Props {
  session: GameSession;
  game: GameFn;
  reduceMotion: boolean;
  sound: boolean;
  onAbort: () => void;
  abortRequested: boolean;
  setAbortRequested: (v: boolean) => void;
}

function roundLabel(s: GameSession): string {
  const total = totalRounds(s);
  const n = Math.min(s.currentRound + 1, total);
  return s.mode === 'competition-turn' ? `Zug ${n} von ${total}` : `Aufgabe ${n} von ${total}`;
}

export function Game({ session, game, reduceMotion, sound, onAbort, abortRequested, setAbortRequested }: Props) {
  const activeId =
    session.mode === 'competition-turn' ? session.activePlayerId : session.mode === 'coop' ? TEAM_ID : undefined;
  return (
    <main className="screen game">
      <div className="topbar">
        <span className="pill" data-testid="round-label">
          {roundLabel(session)}
        </span>
        <button type="button" className="btn btn-ghost" onClick={() => setAbortRequested(true)}>
          Spiel beenden
        </button>
      </div>
      <ScoreBoard entries={scoreboard(session)} activeId={activeId} label={session.mode === 'coop' ? 'Teamkonto' : 'Punktestand'} />

      {session.phase === 'wheel' && <WheelPhase session={session} game={game} reduceMotion={reduceMotion} />}
      {session.phase === 'challenge' && <ChallengePhase session={session} game={game} />}
      {session.phase === 'reward' && <RewardPhase session={session} game={game} sound={sound} />}

      {abortRequested && (
        <Modal
          title="Spiel beenden?"
          confirmLabel="Ja, beenden"
          cancelLabel="Weiterspielen"
          onCancel={() => setAbortRequested(false)}
          onConfirm={() => {
            setAbortRequested(false);
            onAbort();
          }}
        >
          Die gesammelten Münzen und Abzeichen bleiben erhalten. Die Runde ist dann vorbei.
        </Modal>
      )}
    </main>
  );
}

function WheelPhase({ session, game, reduceMotion }: { session: GameSession; game: GameFn; reduceMotion: boolean }) {
  const titleRef = useFocusOnMount<HTMLHeadingElement>();
  const [spinKind, setSpinKind] = useState<SpinKind>(null);
  const eligible = useMemo(() => eligibleChallenges(CHALLENGES, session.enabledChallengeIds, session.mode), [session.enabledChallengeIds, session.mode]);
  const who = session.mode === 'competition-turn' ? actorName(session, session.activePlayerId ?? '') : null;

  if (eligible.length === 0) {
    return (
      <div className="card stack center" role="alert">
        <p>Es sind keine Aufgaben aktiv. Beende das Spiel und wähle im Setup mindestens eine Aufgabe aus.</p>
      </div>
    );
  }

  return (
    <section className="stack center" aria-labelledby="wheel-title">
      <h1 id="wheel-title" ref={titleRef} tabIndex={-1} className="screen-title">
        {who ? (
          <>
            <span className="t-yellow">{who}</span> ist dran!
          </>
        ) : (
          'Dreh das Glücksrad!'
        )}
      </h1>
      <Wheel
        eligible={eligible}
        selectedId={session.activeChallengeId}
        spinKind={spinKind}
        reduceMotion={reduceMotion}
        onSpin={(kind) => {
          setSpinKind(kind);
          game((s) => spinWheel(s, CHALLENGES));
        }}
        onDone={() => game((s) => revealChallenge(s, CHALLENGES))}
      />
    </section>
  );
}

function ChallengePhase({ session, game }: { session: GameSession; game: GameFn }) {
  const titleRef = useFocusOnMount<HTMLHeadingElement>();
  const challenge = getChallenge(session.activeChallengeId);
  const timer = session.timer!;
  const now = useNow(timer.running);
  const [confirmFor, setConfirmFor] = useState<string | null>(null);
  const [skipFor, setSkipFor] = useState<string | null>(null);
  const actors = actorsForRound(session);
  const results = session.currentResult?.playerResults ?? {};
  const expired = isExpired(timer, now);
  const left = remainingMs(timer, now);

  if (!challenge) return null;

  const complete = (actorId: string) => {
    if (session.confirmationMode === 'adult') setConfirmFor(actorId);
    else game((s) => awardCompletion(s, actorId));
  };

  return (
    <section className="stack challenge" aria-labelledby="challenge-title">
      <div className="card challenge-card">
        <div className="challenge-icon" aria-hidden="true">
          {challenge.icon}
        </div>
        <h1 id="challenge-title" ref={titleRef} tabIndex={-1} className="screen-title">
          {challenge.title}
        </h1>
        <p className="challenge-instruction">{challenge.instruction}</p>
        {session.mode === 'competition-turn' && (
          <p className="muted">
            Für <strong className="t-yellow">{actorName(session, actors[0])}</strong>
          </p>
        )}
        {session.mode === 'competition-simultaneous' && <p className="muted">Beide Helden machen dieselbe Aufgabe.</p>}
      </div>

      {!timer.started ? (
        <div className="stack center">
          <p className="muted">
            Zeitvorschlag: <strong>{formatTime(timer.durationMs)}</strong> Minuten
          </p>
          <button type="button" className="btn btn-primary btn-xl btn-block" onClick={() => game((s) => startChallengeTimer(s))}>
            <span aria-hidden="true">🚀</span> Start
          </button>
          <SkipLinks session={session} actors={actors} results={results} onSkip={setSkipFor} />
        </div>
      ) : (
        <>
          <div className={`card timer-card ${expired ? 'is-expired' : ''}`}>
            {timer.unlimited ? (
              <p className="timer-text">
                <span aria-hidden="true">♾️</span> Ohne Zeitlimit
              </p>
            ) : (
              <p className="timer-value" role="timer" aria-label={`Restzeit ${formatTime(left)}`} data-testid="timer">
                {formatTime(left)}
              </p>
            )}
            {expired && (
              <p className="timer-text" role="status">
                Die Zeit ist um – kein Problem! Mach in Ruhe fertig.
              </p>
            )}
            {!timer.unlimited && !timer.running && !expired && <p className="timer-text">Pause</p>}
            <div className="row timer-controls">
              {!timer.unlimited && !expired &&
                (timer.running ? (
                  <button type="button" className="btn btn-secondary" onClick={() => game((s) => pauseChallengeTimer(s))}>
                    <span aria-hidden="true">⏸</span> Pause
                  </button>
                ) : (
                  <button type="button" className="btn btn-secondary" onClick={() => game((s) => resumeChallengeTimer(s))}>
                    <span aria-hidden="true">▶</span> Fortsetzen
                  </button>
                ))}
              {!timer.unlimited && (
                <button type="button" className="btn btn-secondary" onClick={() => game((s) => removeTimeLimit(s))}>
                  Ohne Zeitlimit weitermachen
                </button>
              )}
            </div>
          </div>

          <div className={`actors actors-${actors.length}`}>
            {actors.map((id) => {
              const r = results[id];
              const name = actors.length > 1 ? actorName(session, id) : null;
              return (
                <div key={id} className={`card actor actor-${r?.status ?? 'pending'}`}>
                  {name && <h2 className="actor-name">{name}</h2>}
                  {r?.status === 'completed' && (
                    <p className="actor-status" role="status">
                      <span aria-hidden="true">✅</span> Geschafft!
                    </p>
                  )}
                  {r?.status === 'skipped' && (
                    <p className="actor-status" role="status">
                      <span aria-hidden="true">⏭️</span> Übersprungen
                    </p>
                  )}
                  {r?.status === 'pending' && (
                    <div className="stack">
                      {actors.length > 1 && <p className="actor-status muted">Läuft …</p>}
                      <button
                        type="button"
                        className="btn btn-pink btn-xl btn-block"
                        onClick={() => complete(id)}
                        aria-label={name ? `${session.confirmationMode === 'adult' ? 'Erwachsene bestätigen' : 'Geschafft'} für ${name}` : undefined}
                      >
                        {session.confirmationMode === 'adult' ? (
                          <>
                            <span aria-hidden="true">🧑</span> Erwachsene bestätigen
                          </>
                        ) : (
                          <>
                            <span aria-hidden="true">🎉</span> Geschafft!
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => setSkipFor(id)}
                        aria-label={name ? `Überspringen für ${name}` : undefined}
                      >
                        Überspringen
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {confirmFor && (
        <Modal
          title="Ist die Aufgabe erledigt?"
          confirmLabel="Ja, erledigt"
          cancelLabel="Noch nicht"
          onCancel={() => setConfirmFor(null)}
          onConfirm={() => {
            const id = confirmFor;
            setConfirmFor(null);
            game((s) => awardCompletion(s, id));
          }}
        >
          Bitte schaut kurz gemeinsam nach{actors.length > 1 ? ` (${actorName(session, confirmFor)})` : ''}.
        </Modal>
      )}
      {skipFor && (
        <Modal
          title="Aufgabe überspringen?"
          confirmLabel="Überspringen"
          cancelLabel="Zurück"
          onCancel={() => setSkipFor(null)}
          onConfirm={() => {
            const id = skipFor;
            setSkipFor(null);
            game((s) => skipChallenge(s, id));
          }}
        >
          Passt die Aufgabe gerade nicht? Kein Problem. Dafür gibt es keine Punkte.
        </Modal>
      )}
    </section>
  );
}

function SkipLinks({
  session,
  actors,
  results,
  onSkip,
}: {
  session: GameSession;
  actors: string[];
  results: Record<string, { status: string }>;
  onSkip: (id: string) => void;
}) {
  // Vor dem Start: im Simultanmodus beide gemeinsam überspringen ist nicht sinnvoll; je Akteur anbieten.
  return (
    <div className="row center skip-links">
      {actors
        .filter((id) => results[id]?.status === 'pending')
        .map((id) => (
          <button key={id} type="button" className="btn btn-ghost" onClick={() => onSkip(id)}>
            {actors.length > 1 ? `Überspringen für ${actorName(session, id)}` : 'Aufgabe passt nicht – überspringen'}
          </button>
        ))}
    </div>
  );
}

function RewardPhase({ session, game, sound }: { session: GameSession; game: GameFn; sound: boolean }) {
  const titleRef = useFocusOnMount<HTMLHeadingElement>();
  const last = session.results[session.results.length - 1];
  const entries = Object.entries(last?.playerResults ?? {});
  const anyCompleted = entries.some(([, r]) => r.status === 'completed');
  const newBadges = session.earnedBadges.filter((b) => b.round === session.currentRound);
  const done = isSessionComplete(session);
  const upNext = session.mode === 'competition-turn' && !done ? actorName(session, nextTurn(session) ?? '') : null;

  useEffect(() => {
    if (sound && anyCompleted) playChime();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="stack center reward" aria-labelledby="reward-title">
      <div className={`reward-burst ${anyCompleted ? 'is-win' : ''}`} aria-hidden="true">
        {anyCompleted ? '🌟' : '👍'}
      </div>
      <h1 id="reward-title" ref={titleRef} tabIndex={-1} className="screen-title">
        {anyCompleted ? 'Super gemacht!' : 'Kein Problem – weiter geht’s!'}
      </h1>
      <ul className="reward-list">
        {entries.map(([id, r]) => (
          <li key={id} className="card reward-item">
            <span className="reward-name">{id === TEAM_ID ? 'Team' : actorName(session, id)}</span>
            {r.status === 'completed' ? (
              <span className="reward-gain">
                +{r.pointsAwarded} <span aria-hidden="true">⭐</span>
                <span className="sr-only">Punkte</span> · +{r.coinsAwarded} <span aria-hidden="true">🪙</span>
                <span className="sr-only">Münze</span>
              </span>
            ) : (
              <span className="muted">übersprungen</span>
            )}
          </li>
        ))}
      </ul>
      {newBadges.length > 0 && (
        <div className="card badge-card" role="status">
          {newBadges.map((b) => (
            <p key={`${b.playerId}-${b.badge}`}>
              <span aria-hidden="true">{BADGES[b.badge].icon}</span> Neues Abzeichen für {actorName(session, b.playerId)}:{' '}
              <strong>{BADGES[b.badge].title}</strong>
            </p>
          ))}
        </div>
      )}
      {upNext && (
        <p className="muted">
          Als Nächstes ist <strong className="t-yellow">{upNext}</strong> dran.
        </p>
      )}
      <button type="button" className="btn btn-primary btn-xl btn-block" onClick={() => game((s) => advance(s))}>
        {done ? 'Zum Ergebnis' : 'Nächste Aufgabe'}
      </button>
    </section>
  );
}
