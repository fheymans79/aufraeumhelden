import { useState } from 'react';
import type { Mode } from '../domain/types';
import { useFocusOnMount } from '../app/hooks';

interface Props {
  onChoose: (mode: Mode) => void;
  onBack: () => void;
}

export function ModeSelect({ onChoose, onBack }: Props) {
  const titleRef = useFocusOnMount<HTMLHeadingElement>();
  const [competition, setCompetition] = useState(false);
  return (
    <main className="screen">
      <div className="topbar">
        <button type="button" className="btn btn-ghost" onClick={onBack}>
          ← Zurück
        </button>
      </div>
      <h1 ref={titleRef} tabIndex={-1} className="screen-title">
        Wie wollt ihr spielen?
      </h1>
      <div className="mode-list">
        <button type="button" className="mode-card mode-blue" onClick={() => onChoose('solo')}>
          <span className="mode-icon" aria-hidden="true">🦸</span>
          <span className="mode-text">
            <span className="mode-name">Allein</span>
            <span className="mode-desc">Ein Held räumt auf</span>
          </span>
        </button>
        <button type="button" className="mode-card mode-pink" onClick={() => onChoose('coop')}>
          <span className="mode-icon" aria-hidden="true">🤝</span>
          <span className="mode-text">
            <span className="mode-name">Gemeinsam</span>
            <span className="mode-desc">Zwei Helden, ein Team</span>
          </span>
        </button>
        <button
          type="button"
          className="mode-card mode-yellow"
          aria-expanded={competition}
          aria-controls="competition-options"
          onClick={() => setCompetition((v) => !v)}
        >
          <span className="mode-icon" aria-hidden="true">🏆</span>
          <span className="mode-text">
            <span className="mode-name">Wettkampf</span>
            <span className="mode-desc">Zwei Helden treten an</span>
          </span>
        </button>
        {competition && (
          <div id="competition-options" className="mode-sub" role="group" aria-label="Wettkampf-Variante">
            <button type="button" className="btn btn-secondary btn-block" onClick={() => onChoose('competition-turn')}>
              <span aria-hidden="true">🔁</span> Abwechselnd
            </button>
            <button type="button" className="btn btn-secondary btn-block" onClick={() => onChoose('competition-simultaneous')}>
              <span aria-hidden="true">⚡</span> Gleichzeitig
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
