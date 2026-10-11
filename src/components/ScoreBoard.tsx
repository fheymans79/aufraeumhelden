interface Entry {
  id: string;
  name: string;
  points: number;
  coins: number;
}

export function ScoreBoard({ entries, activeId, label }: { entries: Entry[]; activeId?: string; label?: string }) {
  return (
    <ul className="scoreboard" aria-label={label ?? 'Punktestand'}>
      {entries.map((e) => (
        <li key={e.id} className={`score ${e.id === activeId ? 'is-active' : ''}`} aria-current={e.id === activeId ? 'true' : undefined}>
          <span className="score-name">
            {e.id === activeId && <span aria-hidden="true">▶ </span>}
            {e.name}
            {e.id === activeId && <span className="sr-only"> ist dran</span>}
          </span>
          <span className="score-values">
            <span data-testid={`points-${e.id}`}>
              <span aria-hidden="true">⭐</span> {e.points} <span className="sr-only">Punkte</span>
            </span>
            <span data-testid={`coins-${e.id}`}>
              <span aria-hidden="true">🪙</span> {e.coins} <span className="sr-only">Münzen</span>
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
