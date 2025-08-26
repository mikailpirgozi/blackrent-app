/**
 * Email Management Module Exports
 */

// Main Layout Component
export { default as EmailManagementLayout } from './EmailManagementLayout';

// Individual Tab Components
export { EmailHistoryTab } from './components/EmailHistoryTab';
export { PendingRentalsTab } from './components/PendingRentalsTab';
export { EmailArchiveTab } from './components/EmailArchiveTab';

// Reusable UI Components
export { EmailStatsCards } from './components/EmailStatsCards';
export { ImapStatusCard } from './components/ImapStatusCard';
export { EmailFilters } from './components/EmailFilters';
export { StatusChip } from './components/StatusChip';

// Dialogs
export { EmailDetailDialog } from './components/dialogs/EmailDetailDialog';
export { RejectDialog } from './components/dialogs/RejectDialog';

// Hooks
export { useEmailApi } from './hooks/useEmailApi';
export { useImapStatus } from './hooks/useImapStatus';
export { usePendingRentals } from './hooks/usePendingRentals';

// Types
export * from './types/email-types';

// Utils
export * from './utils/email-constants';
export * from './utils/email-formatters';
