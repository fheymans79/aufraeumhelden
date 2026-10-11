import { describe, expect, it } from 'vitest';
import { buildSegments, rotationFor } from '../../components/Wheel';
import { CHALLENGES } from '../../data/challenges.de';

/** Welches Segment steht nach Drehung `rotation` (im Uhrzeigersinn) oben am Zeiger? */
function segmentAtPointer(rotation: number, count: number): number {
  const angle = (((-rotation % 360) + 360) % 360);
  return Math.floor(angle / (360 / count));
}

describe('Glücksrad', () => {
  it('hat mindestens 4 Segmente und zeigt jede Aufgabe gleich oft', () => {
    expect(buildSegments(CHALLENGES.slice(0, 1)).map((c) => c.id)).toEqual(['blocks', 'blocks', 'blocks', 'blocks']);
    const three = buildSegments(CHALLENGES.slice(0, 3));
    expect(three).toHaveLength(6);
    expect(buildSegments(CHALLENGES)).toHaveLength(8);
  });

  it('Endposition passt zum vorher gezogenen Ergebnis', () => {
    for (const count of [4, 6, 8]) {
      let current = 0;
      for (let i = 0; i < count; i++) {
        const next = rotationFor(i, count, current);
        expect(next).toBeGreaterThan(current + 5 * 360 - 1);
        expect(segmentAtPointer(next, count)).toBe(i);
        current = next;
      }
    }
  });
});
