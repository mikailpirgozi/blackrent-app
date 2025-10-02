/**
 * 🎨 UNIFIED DESIGN SYSTEM
 *
 * Centralizované exporty pre BlackRent unified komponenty
 * Zabezpečuje konzistentný dizajn v celej aplikácii
 */

// 🎨 Základné shadcn/ui komponenty
export { Button } from './button';
export { Input } from './input';
export { Label } from './label';
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card';
export { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './dialog';
export { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
export { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';
export { Badge } from './badge';
export { Avatar, AvatarFallback, AvatarImage } from './avatar';
export { Skeleton } from './skeleton';
export { Progress } from './progress';
export { Separator } from './separator';
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
export { Popover, PopoverContent, PopoverTrigger } from './popover';
export { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut } from './command';
export { ToggleGroup, ToggleGroupItem } from './toggle-group';
// export { Typography } from './typography';
export { Spinner } from './spinner';

// 🎨 Button komponenty
export {
  ErrorButton,
  PrimaryButton,
  SecondaryButton,
  SuccessButton,
  TextButton,
  UnifiedButton,
  WarningButton,
  type UnifiedButtonProps,
} from './UnifiedButton';

// 🎨 Card komponenty
export {
  CompactCard,
  DefaultCard,
  ElevatedCard,
  InteractiveCard,
  OutlinedCard,
  StatisticsCard,
  UnifiedCard,
  type CardVariant,
  type UnifiedCardProps,
} from './UnifiedCard';

// 🎨 Chip komponenty
export {
  ActiveChip,
  CancelledChip,
  CompactChip,
  CompletedChip,
  PendingChip,
  PriorityChip,
  RoleChip,
  StatusChip,
  TrendChip,
  UnifiedChip,
  type ChipVariant,
  type UnifiedChipProps,
} from './UnifiedChip';

// 🎨 Icon komponenty
export {
  ICONS,
  UnifiedIcon,
  type UnifiedIconProps,
} from './UnifiedIcon';

export type { IconName } from './icon-map';

// 🎨 Search komponenty
export {
  SearchField,
  UnifiedSearch,
  UnifiedSearchField,
  type SearchHistoryItem,
  type SearchSuggestion,
  type UnifiedSearchFieldProps,
} from './UnifiedSearchField';

// 🎨 Form komponenty
export {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  UnifiedForm,
  UnifiedFormField,
  UnifiedFormItem,
  UnifiedFormLabel,
  UnifiedFormControl,
  UnifiedFormDescription,
  UnifiedFormMessage,
  useFormContext,
  useUnifiedFormContext,
  type UnifiedFormFieldProps,
  type UnifiedFormItemProps,
  type UnifiedFormLabelProps,
  type UnifiedFormControlProps,
  type UnifiedFormDescriptionProps,
  type UnifiedFormMessageProps,
  type UnifiedFormProps,
} from './UnifiedForm';

// 🎨 TextField komponenty
export {
  TextField,
  UnifiedTextField,
  type UnifiedTextFieldProps,
} from './UnifiedTextField';

// 🎨 SelectField komponenty
export {
  SelectField,
  UnifiedSelectField,
  type SelectOption,
  type UnifiedSelectFieldProps,
} from './UnifiedSelectField';

// 🎨 DatePicker komponenty
export {
  DatePicker,
  DateTimePicker,
  TimePicker,
  UnifiedDatePicker,
  type UnifiedDatePickerProps,
} from './UnifiedDatePicker';

// 🎨 DataTable komponenty
export {
  DataGrid,
  DataTable,
  UnifiedDataTable,
  type DataTableColumn,
  type UnifiedDataTableProps,
} from './UnifiedDataTable';

// 🎨 Typography komponenty
export {
  Body1,
  Body2,
  Caption,
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  Overline,
  Subtitle1,
  Subtitle2,
  Typography,
  UnifiedTypography,
  type UnifiedTypographyProps,
} from './UnifiedTypography';

// 🎨 Dialog komponenty
export {
  DialogWithTrigger,
  UnifiedDialog,
  UnifiedDialogWithTrigger,
  type UnifiedDialogProps,
  type UnifiedDialogWithTriggerProps,
} from './UnifiedDialog';

// 🎨 Alert komponenty
export {
  Alert,
  AlertTitle,
  AlertDescription,
} from './alert';

// 🎨 Badge komponenty
export {
  badgeVariants,
  type BadgeProps,
} from './badge';

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
export const getDesignToken = (path: string): unknown => {
  const keys = path.split('.');
  let value: unknown = BLACKRENT_DESIGN_TOKENS;

  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = (value as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }

  return value;
};

// 🎨 Utility pre konzistentné štýlovanie
export const createUnifiedStyles = () => ({
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
