export const CYLINDER = {
  radius: 350,
  columns: 12,
  columnsMobile: 8,
  fov: 38,
  posterWidth: 90,
  posterHeight: 122,
  gapY: 28,
  tileRepeats: 11,
} as const;

export const NAVIGATION = {
  dragSensitivityX: 0.0012,
  dragSensitivityY: 0.15,
  momentumX: 0.0008,
  momentumY: 0.12,
  damping: 0.975,
  wheelSpeed: 0.004,
  edgeZone: 0.85,
  edgeDriftSpeed: 0.08,
  dragThreshold: 4,
} as const;

export const MODAL = {
  tiltMax: 14,
  tiltLerp: 0.045,
  glareLerp: 0.04,
  glareMaxOpacity: 0.2,
  backdropColor: 'rgba(0,0,0,0.45)',
  blurAmount: '24px',
  // Mobile
  heightMobile: '85vh',
  maxWidthMobile: '95vw',
} as const;

export const ANIMATION = {
  fadeInDelay: 0.02,
  fadeInSpeed: 4,
  modalFadeDuration: 0.5,
  modalEasing: [0.25, 0.1, 0.25, 1] as const,
  metadataDelay: 0.25,
} as const;

export const THEME = {
  background: '#E7E7E7',
  textPrimary: 'rgba(26,26,26,0.85)',
  textSecondary: 'rgba(26,26,26,0.5)',
  textMuted: 'rgba(26,26,26,0.35)',
  textHint: 'rgba(26,26,26,0.25)',
} as const;
