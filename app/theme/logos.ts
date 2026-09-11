import type { ImageSourcePropType } from 'react-native';

import type { TeamId } from '@/state/useGameStore';

/**
 * Metro loest nur statische require-Pfade auf, deshalb die ausgeschriebene Map.
 * Die Dateien erzeugt `scripts/build_logos.py` aus den Originalen: 512x512,
 * freigestellt, transparenter Hintergrund.
 */
export const TEAM_LOGOS: Record<TeamId, ImageSourcePropType> = {
  closedai: require('../assets/logos/closedai.png'),
  antithropic: require('../assets/logos/antithropic.png'),
  grek: require('../assets/logos/grek.png'),
  shallowseek: require('../assets/logos/shallowseek.png'),
};
