/**
 * Konštanty pre Email Management Dashboard
 */

export const PAGE_SIZE = 20;

export const ARCHIVE_PAGINATION_LIMIT = 20;

export const STATUS_OPTIONS = [
  { value: '', label: 'Všetky' },
  { value: 'new', label: 'Nové' },
  { value: 'processed', label: 'Spracované' },
  { value: 'rejected', label: 'Zamietnuté' },
  { value: 'archived', label: 'Archivované' },
] as const;

export const BREAKPOINTS = {
  EXTRA_SMALL: 400,
  SMALL_MOBILE: 'sm',
  TABLET: 'md',
  DESKTOP: 'lg',
} as const;

export const AUTO_ARCHIVE_DAYS = 30;

export const AUTO_ARCHIVE_STATUSES = ['processed', 'rejected'] as const;
