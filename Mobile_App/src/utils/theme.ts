import { DefaultTheme } from 'react-native-paper';
import { Theme } from '@react-navigation/native';

// Color palette for Blue Carbon MRV
const colors = {
  // Primary colors - Ocean/Water theme
  primary: '#006064',        // Deep teal
  primaryLight: '#428e92',   // Light teal
  primaryDark: '#00363a',    // Dark teal
  
  // Accent colors - Mangrove/Earth theme
  accent: '#4caf50',         // Green
  accentLight: '#80e27e',    // Light green
  accentDark: '#087f23',     // Dark green
  
  // Secondary colors
  secondary: '#ff7043',      // Coral orange
  secondaryLight: '#ffa270', // Light coral
  secondaryDark: '#c63f17',  // Dark coral
  
  // Status colors
  success: '#4caf50',
  warning: '#ff9800',
  error: '#f44336',
  info: '#2196f3',
  
  // Neutral colors
  background: '#f5f5f5',
  surface: '#ffffff',
  surfaceVariant: '#e3f2fd',
  
  // Text colors
  onPrimary: '#ffffff',
  onAccent: '#ffffff',
  onSecondary: '#ffffff',
  onBackground: '#212121',
  onSurface: '#212121',
  onError: '#ffffff',
  
  // Gray scale
  gray50: '#fafafa',
  gray100: '#f5f5f5',
  gray200: '#eeeeee',
  gray300: '#e0e0e0',
  gray400: '#bdbdbd',
  gray500: '#9e9e9e',
  gray600: '#757575',
  gray700: '#616161',
  gray800: '#424242',
  gray900: '#212121',
  
  // Transparent colors
  backdrop: 'rgba(0, 0, 0, 0.5)',
  overlay: 'rgba(0, 96, 100, 0.1)',
  
  // Map specific colors
  mapPolygon: 'rgba(76, 175, 80, 0.3)',
  mapPolygonBorder: '#4caf50',
  mapMarker: '#006064',
  
  // Status specific colors
  pending: '#ff9800',
  uploading: '#2196f3',
  completed: '#4caf50',
  failed: '#f44336',
};

// Typography
const typography = {
  fontFamily: 'System',
  fontWeights: {
    regular: '400',
    medium: '500',
    bold: '700',
  },
  sizes: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

// Spacing scale (in pixels)
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  '4xl': 64,
};

// Border radius scale
const borderRadius = {
  none: 0,
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

// Shadow presets
const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.23,
    shadowRadius: 2.62,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.30,
    shadowRadius: 4.65,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.44,
    shadowRadius: 10.32,
    elevation: 16,
  },
};

// React Native Paper theme
export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary,
    accent: colors.accent,
    background: colors.background,
    surface: colors.surface,
    error: colors.error,
    text: colors.onBackground,
    onSurface: colors.onSurface,
    disabled: colors.gray400,
    placeholder: colors.gray500,
    backdrop: colors.backdrop,
    notification: colors.accent,
  },
  // Custom additions
  custom: {
    colors,
    typography,
    spacing,
    borderRadius,
    shadows,
  },
};

// React Navigation theme
export const navigationTheme: Theme = {
  dark: false,
  colors: {
    primary: colors.primary,
    background: colors.background,
    card: colors.surface,
    text: colors.onBackground,
    border: colors.gray300,
    notification: colors.accent,
  },
};

// Role-based color mapping
export const roleColors = {
  admin: colors.primary,
  auditor: colors.secondary,
  developer: colors.accent,
  ngo_staff: colors.accent,
  panchayat_officer: colors.info,
};

// Status color mapping
export const statusColors = {
  draft: colors.gray500,
  active: colors.accent,
  pending: colors.warning,
  uploading: colors.info,
  completed: colors.success,
  failed: colors.error,
  suspended: colors.warning,
  archived: colors.gray600,
};

// Common style helpers
export const commonStyles = {
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  spaceBetween: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray300,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: typography.sizes.base,
  },
  errorText: {
    color: colors.error,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.fontWeights.bold as any,
    color: colors.onBackground,
  },
  sectionTitle: {
    fontSize: typography.sizes.base,
    fontWeight: typography.fontWeights.medium as any,
    color: colors.onBackground,
    marginVertical: spacing.sm,
  },
};

export type AppTheme = typeof theme;
export default theme;
