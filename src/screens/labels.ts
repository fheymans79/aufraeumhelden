import type { Mode } from '../domain/types';

export const MODE_LABEL: Record<Mode, string> = {
  solo: 'Allein',
  coop: 'Gemeinsam',
  'competition-turn': 'Wettkampf – abwechselnd',
  'competition-simultaneous': 'Wettkampf – gleichzeitig',
};
