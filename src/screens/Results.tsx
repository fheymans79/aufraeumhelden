import type { GameSession } from '../domain/types';
import { actorName, computeWinner, scoreboard } from '../domain/gameEngine';
import { BADGES } from '../domain/badges';
import type { Profile } from '../storage/storage';
import { ScoreBoard } from '../components/ScoreBoard';
import { Teddy } from '../components/Teddy';
import { useFocusOnMount } from '../app/hooks';

interface Props {
  session: GameSession;
  profiles: Record<string, Profile>;
  onAgain: () => void;
  onHome: () => void;
}

function headline(s: GameSession): string {
  const w = computeWinner(s);
  if (w.kind === 'winner') return `${actorName(s, w.playerId)} gewinnt diese Runde!`;
  if (w.kind === 'tie') return 'Unentschieden – ihr seid beide Helden!';
  if (s.mode === 'coop') return 'Ihr seid ein tolles Team!';
  return `Super gemacht, ${s.players[0].name}!`;
}

export function Results({ session, profiles, onAgain, onHome }: Props) {
  const titleRef = useFocusOnMount<HTMLHeadingElement>();
  const w = computeWinner(session);
  const totals =
    session.mode === 'coop'
      ? [{ name: `Team ${scoreboard(session)[0].name}`, label: 'Team' }]
      : session.players.map((p) => ({ name: p.name, label: p.name }));

  return (
    <main className="screen center results">
      <Teddy size={150} className="results-teddy" />
      <h1 ref={titleRef} tabIndex={-1} className="screen-title" data-testid="results-title">
        {headline(session)}
      </h1>
      {w.kind === 'winner' && <p className="muted">Danke an beide fürs Mithelfen!</p>}
      <ScoreBoard entries={scoreboard(session)} label={session.mode === 'coop' ? 'Teamkonto' : 'Ergebnis'} />

      {session.earnedBadges.length > 0 && (
        <section className="card stack badge-card" aria-labelledby="badges-title">
          <h2 id="badges-title">Neue Abzeichen</h2>
          <ul className="badge-list">
            {session.earnedBadges.map((b) => (
              <li key={`${b.playerId}-${b.badge}`}>
                <span aria-hidden="true" className="badge-icon">
                  {BADGES[b.badge].icon}
                </span>
                <span>
                  <strong>{BADGES[b.badge].title}</strong>
                  {session.players.length > 1 && <> · {actorName(session, b.playerId)}</>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card stack" aria-labelledby="coins-title">
        <h2 id="coins-title">Münzen gesammelt</h2>
        <ul className="coin-totals">
          {totals.map((t) => (
            <li key={t.name}>
              {t.label}: <span aria-hidden="true">🪙</span> <strong data-testid={`total-coins-${t.label}`}>{profiles[t.name]?.coins ?? 0}</strong>{' '}
              insgesamt
            </li>
          ))}
        </ul>
      </section>

      <div className="stack results-actions">
        <button type="button" className="btn btn-primary btn-xl btn-block" onClick={onAgain}>
          Noch eine Runde
        </button>
        <button type="button" className="btn btn-secondary btn-block" onClick={onHome}>
          Zum Start
        </button>
      </div>
    </main>
  );
}
