/**
 * TypeScript typy pre Email Management Dashboard
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

export interface EmailEntry {
  id: string;
  email_id: string;
  subject: string;
  sender: string;
  received_at: string;
  processed_at?: string;
  status: 'new' | 'processing' | 'processed' | 'rejected' | 'archived';
  action_taken?: string;
  confidence_score: number;
  error_message?: string;
  notes?: string;
  rental_id?: number;
  customer_name?: string;
  order_number?: string;
  processed_by_username?: string;
}

export interface EmailStats {
  today: {
    total: number;
    processed: number;
    rejected: number;
    pending: number;
  };
  weeklyTrend: Array<{
    date: string;
    total: number;
    processed: number;
    rejected: number;
  }>;
  topSenders: Array<{
    sender: string;
    count: number;
    processed_count: number;
  }>;
}

export interface EmailDetail {
  email: EmailEntry & {
    email_content?: string;
    email_html?: string;
    parsed_data?: any;
  };
  actions: Array<{
    id: string;
    action: string;
    username: string;
    notes?: string;
    created_at: string;
  }>;
}

export interface ImapStatus {
  running: boolean;
  enabled: boolean;
  timestamp: string;
  config: {
    host: string;
    user: string;
    enabled: boolean;
  };
}

export interface ArchivePagination {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface RejectDialogState {
  open: boolean;
  emailId: string | null;
  isRental?: boolean;
}

export interface ViewDialogState {
  open: boolean;
  email: EmailDetail | null;
}
