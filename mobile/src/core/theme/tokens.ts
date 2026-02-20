export const colors = {
  background: '#F4F8FF',
  surface: '#FFFFFF',
  primary: '#1F64F5',
  primarySoft: '#E8F0FF',
  text: '#132C47',
  textMuted: '#5F7691',
  border: '#D9E5F6',
  success: '#148A5A',
  warning: '#C28712',
  danger: '#CB3D43',
  offlineBanner: '#FFECC7',
} as const;

export const spacing = {
  xs: 6,
  sm: 10,
  md: 16,
  lg: 20,
  xl: 28,
} as const;

export const radius = {
  sm: 10,
  md: 16,
  lg: 22,
} as const;

export const typography = {
  title: 24,
  heading: 20,
  body: 16,
  caption: 14,
  button: 16,
} as const;

export const shadows = {
  card: {
    shadowColor: '#0A2A66',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
  },
} as const;
