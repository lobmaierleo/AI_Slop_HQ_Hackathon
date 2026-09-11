export const THEME = {
  colors: {
    primary: '#FF5C00',
    primaryLight: '#FFF0E6',
    success: '#00C853',
    successLight: '#E3F9EB',
    error: '#FF3D00',
    errorLight: '#FFE9E3',
    background: '#F8F8FA',
    card: '#FFFFFF',
    glassBackground: 'rgba(255, 255, 255, 0.75)',
    glassBorder: 'rgba(255, 255, 255, 0.4)',
    text: '#1A1A1E',
    textMuted: '#8E8E93',
    hairline: 'rgba(0, 0, 0, 0.06)',
    /** Typo und Flaechen, die auf einer Farbflaeche liegen. */
    onAccent: '#FFFFFF',
    /** Track des Segmented Controls. */
    track: '#ECECEF',
  },
  radius: {
    sm: 14,
    md: 20,
    lg: 28,
    pill: 9999,
  },
  spacing: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
  },
  /** Freiraum unter Inhalten, damit die schwebende Tab-Bar nichts verdeckt. */
  tabBarClearance: 120,
} as const;

export type Theme = typeof THEME;
