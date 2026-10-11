import type { Rng } from './types';

/** Gleichverteilte Zufallszahl in [0, 1) aus crypto.getRandomValues. */
export const cryptoRng: Rng = () => {
  const buf = new Uint32Array(1);
  crypto.getRandomValues(buf);
  return buf[0] / 2 ** 32;
};

export function randomIndex(length: number, rng: Rng): number {
  return Math.min(length - 1, Math.floor(rng() * length));
}

export function createId(rng: Rng = cryptoRng): string {
  return Math.floor(rng() * 2 ** 32).toString(36) + Date.now().toString(36);
}
