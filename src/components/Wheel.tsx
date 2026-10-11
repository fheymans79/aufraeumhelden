import { useEffect, useMemo, useRef, useState } from 'react';
import type { Challenge } from '../domain/types';
import { cryptoRng, randomIndex } from '../domain/random';
import './Wheel.css';

export const SPIN_DURATION_MS = 2600;
const COLORS = ['#3ad7ff', '#ff5cbf', '#ffd43b', '#9b7bff'];

/** Segmente für die Anzeige: mindestens 4, bei wenigen Aufgaben mehrfach. */
export function buildSegments(eligible: Challenge[]): Challenge[] {
  if (eligible.length === 0) return [];
  const out: Challenge[] = [];
  while (out.length < 4 || out.length % eligible.length !== 0) out.push(eligible[out.length % eligible.length]);
  return out;
}

/** Drehwinkel (im Uhrzeigersinn), bei dem die Mitte von Segment `index` oben am Zeiger steht. */
export function rotationFor(index: number, count: number, current: number, extraTurns = 5): number {
  const seg = 360 / count;
  const target = (((-(index + 0.5) * seg) % 360) + 360) % 360;
  const base = ((current % 360) + 360) % 360;
  const delta = (target - base + 360) % 360;
  return current + extraTurns * 360 + delta;
}

export type SpinKind = 'animated' | 'instant' | null;

interface WheelProps {
  eligible: Challenge[];
  selectedId?: string;
  spinKind: SpinKind;
  reduceMotion: boolean;
  onSpin: (kind: Exclude<SpinKind, null>) => void;
  onDone: () => void;
}

export function Wheel({ eligible, selectedId, spinKind, reduceMotion, onSpin, onDone }: WheelProps) {
  const segments = useMemo(() => buildSegments(eligible), [eligible]);
  const [rotation, setRotation] = useState(0);
  const [animating, setAnimating] = useState(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    if (!selectedId) return;
    const matches = segments.map((s, i) => (s.id === selectedId ? i : -1)).filter((i) => i >= 0);
    if (matches.length === 0) return;
    const index = matches[randomIndex(matches.length, cryptoRng)];
    const animate = spinKind === 'animated' && !reduceMotion;
    setRotation((r) => rotationFor(index, segments.length, r, animate ? 5 : 0));
    if (spinKind === null) return; // wiederhergestellter Stand: Kind tippt selbst auf „Zur Aufgabe“
    if (!animate) {
      doneRef.current();
      return;
    }
    setAnimating(true);
    const timeout = window.setTimeout(() => {
      setAnimating(false);
      doneRef.current();
    }, SPIN_DURATION_MS);
    return () => window.clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  const seg = 360 / segments.length;
  const radius = 100;
  const spun = selectedId !== undefined;

  return (
    <div className="wheel-wrap">
      <div className="wheel-stage">
        <div className="wheel-pointer" aria-hidden="true" />
        <svg
          className={`wheel ${animating ? 'is-spinning' : ''}`}
          viewBox="-105 -105 210 210"
          style={{ transform: `rotate(${rotation}deg)`, transitionDuration: animating ? `${SPIN_DURATION_MS}ms` : '0ms' }}
          role="img"
          aria-label={`Glücksrad mit ${eligible.length} Aufgaben: ${eligible.map((c) => c.title).join(', ')}`}
        >
          {segments.map((c, i) => {
            const a0 = ((i * seg - 90) * Math.PI) / 180;
            const a1 = (((i + 1) * seg - 90) * Math.PI) / 180;
            const mid = (((i + 0.5) * seg - 90) * Math.PI) / 180;
            const large = seg > 180 ? 1 : 0;
            const d = `M0 0 L${radius * Math.cos(a0)} ${radius * Math.sin(a0)} A${radius} ${radius} 0 ${large} 1 ${radius * Math.cos(a1)} ${radius * Math.sin(a1)} Z`;
            const lx = 64 * Math.cos(mid);
            const ly = 64 * Math.sin(mid);
            return (
              <g key={`${c.id}-${i}`}>
                <path d={d} fill={COLORS[i % COLORS.length]} stroke="#0b1433" strokeWidth="3" />
                <text x={lx} y={ly} fontSize={segments.length > 6 ? 24 : 30} textAnchor="middle" dominantBaseline="central" transform={`rotate(${(i + 0.5) * seg} ${lx} ${ly})`}>
                  {c.icon}
                </text>
              </g>
            );
          })}
          <circle r="18" fill="#0b1433" stroke="#ffd43b" strokeWidth="4" />
        </svg>
      </div>

      <div className="wheel-actions">
        {!spun && (
          <>
            <button type="button" className="btn btn-primary btn-xl btn-block" onClick={() => onSpin('animated')}>
              <span aria-hidden="true">🎡</span> Rad drehen
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => onSpin('instant')}>
              Zufällig auswählen (ohne Animation)
            </button>
          </>
        )}
        {spun && animating && (
          <p className="wheel-status" role="status">
            Das Rad dreht sich …
          </p>
        )}
        {spun && !animating && spinKind === null && (
          <button type="button" className="btn btn-primary btn-xl btn-block" onClick={onDone}>
            Zur Aufgabe
          </button>
        )}
      </div>
    </div>
  );
}
