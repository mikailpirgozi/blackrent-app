/**
 * 🎨 UNIFIED DESIGN SYSTEM
 * 
 * Centralizované exporty pre BlackRent unified komponenty
 * Zabezpečuje konzistentný dizajn v celej aplikácii
 */

// 🎨 Button komponenty
export {
  UnifiedButton,
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  WarningButton,
  ErrorButton,
  TextButton,
  type UnifiedButtonProps,
} from './UnifiedButton';

// 🎨 Card komponenty
export {
  UnifiedCard,
  DefaultCard,
  ElevatedCard,
  OutlinedCard,
  InteractiveCard,
  StatisticsCard,
  CompactCard,
  type UnifiedCardProps,
  type CardVariant,
} from './UnifiedCard';

// 🎨 Chip komponenty
export {
  UnifiedChip,
  StatusChip,
  PriorityChip,
  TrendChip,
  RoleChip,
  CompactChip,
  PendingChip,
  ActiveChip,
  CompletedChip,
  CancelledChip,
  type UnifiedChipProps,
  type ChipVariant,
} from './UnifiedChip';

// 🎨 Design system constants
export const BLACKRENT_DESIGN_TOKENS = {
  colors: {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#2e7d32',
    warning: '#ed6c02',
    error: '#d32f2f',
    info: '#0288d1',
    neutral: '#6b7280',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
  },
  shadows: {
    sm: '0 1px 4px rgba(0,0,0,0.06)',
    md: '0 2px 8px rgba(0,0,0,0.08)',
    lg: '0 4px 16px rgba(0,0,0,0.12)',
    xl: '0 6px 20px rgba(0,0,0,0.15)',
  },
  transitions: {
    fast: '0.15s cubic-bezier(0.4, 0, 0.2, 1)',
    normal: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  },
} as const;

// 🎨 Design system helper functions
export const getDesignToken = (path: string) => {
  const keys = path.split('.');
  let value: any = BLACKRENT_DESIGN_TOKENS;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value;
};

// 🎨 Utility pre konzistentné štýlovanie
export const createUnifiedStyles = (theme: any) => ({
  // Konzistentné button štýly
  button: {
    borderRadius: BLACKRENT_DESIGN_TOKENS.borderRadius.md,
    textTransform: 'none' as const,
    fontWeight: 600,
    transition: BLACKRENT_DESIGN_TOKENS.transitions.normal,
  },
  
  // Konzistentné card štýly
  card: {
    borderRadius: BLACKRENT_DESIGN_TOKENS.borderRadius.lg,
    boxShadow: BLACKRENT_DESIGN_TOKENS.shadows.md,
    transition: BLACKRENT_DESIGN_TOKENS.transitions.normal,
  },
  
  // Konzistentné chip štýly
  chip: {
    borderRadius: BLACKRENT_DESIGN_TOKENS.borderRadius.md,
    fontWeight: 600,
    transition: BLACKRENT_DESIGN_TOKENS.transitions.normal,
  },
});

