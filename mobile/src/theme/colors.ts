export const colors = {
  // Brand Foundation
  primary: '#12372A',         // Deep Forest Green
  primaryDark: '#0A2018',     // Pressed/Active Forest Green
  primaryLight: '#1C4E3C',    // Hover/Tinted Forest Green
  secondary: '#E8F3EC',       // Soft Mint
  secondaryDark: '#D4E9DC',   // Pressed Soft Mint
  surface: '#FFFFFF',         // Pure White
  surfaceElevated: '#F8FAFC', // Subtle Off-White for cards & backgrounds
  
  // Typography
  textPrimary: '#1F2937',     // Charcoal
  textSecondary: '#64748B',   // Slate Gray
  primaryText: '#1F2937',     // Charcoal (alias)
  secondaryText: '#64748B',   // Slate Gray (alias)
  textMuted: '#94A3B8',       // Light Slate Gray
  textInverse: '#FFFFFF',     // White on dark buttons
  
  // Borders & Dividers
  borderSubtle: '#E2E8F0',    // Clean subtle border
  borderFocus: '#12372A',     // Active focus border
  borderError: '#EF4444',     // Validation error border
  borderSuccess: '#16A34A',   // Success border
  
  // Feedback & Status
  success: '#16A34A',
  successBackground: '#F0FDF4',
  error: '#DC2626',
  errorBackground: '#FEF2F2',
  warning: '#F59E0B',
  warningBackground: '#FFFBEB',
  info: '#0EA5E9',
  infoBackground: '#F0F9FF',
  
  // Health Feature Accents
  healthActivity: '#0EA5E9',
  healthSleep: '#8B5CF6',
  healthNutrition: '#F97316',
  healthWater: '#06B6D4',
  healthVitals: '#E11D48',
  healthGoals: '#16A34A',
} as const;

export type ColorType = typeof colors;

