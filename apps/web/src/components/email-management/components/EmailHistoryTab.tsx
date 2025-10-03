/**
 * Email History Tab Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import { CheckCircle, Archive, Trash2, X, Eye } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// shadcn/ui components
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Typography } from '@/components/ui/typography';

import { useEmailApi } from '../hooks/useEmailApi';
import type { EmailDetail, EmailEntry } from '../types/email-types';
// import { PAGE_SIZE } from '../utils/email-constants';
import { truncateText } from '../utils/email-formatters';

import { EmailDetailDialog } from './dialogs/EmailDetailDialog';
import { RejectDialog } from './dialogs/RejectDialog';
import { StatusChip } from './StatusChip';
import { logger } from '@/utils/smartLogger';

interface EmailHistoryTabProps {
  statusFilter: string;
  senderFilter: string;
}

export const EmailHistoryTab: React.FC<EmailHistoryTabProps> = ({
  statusFilter,
  senderFilter,
}) => {
  // Responsive breakpoints using Tailwind classes
  // md: 768px, sm: 640px, xs: 0px

  // State
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);

  // Dialogs
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    email: EmailDetail | null;
  }>({
    open: false,
    email: null,
  });
  const [rejectDialog, setRejectDialog] = useState<{
    open: boolean;
    emailId: string | null;
  }>({
    open: false,
    emailId: null,
  });
  const [rejectReason, setRejectReason] = useState('');

  // API Hook
  const {
    loading,
    actionLoading,
    // error,
    // success,
    // setError,
    // setSuccess,
    fetchEmails,
    viewEmailDetail,
    approveEmail,
    rejectEmail,
    archiveEmail,
    deleteEmail,
  } = useEmailApi();

  const loadEmails = useCallback(async () => {
    try {
      const result = await fetchEmails(currentPage, statusFilter, senderFilter);
      setEmails(result.emails);
      setTotalEmails(result.totalEmails);
      setTotalPages(result.totalPages);
    } catch (_err) {
      // Error handled by hook
    }
  }, [fetchEmails, currentPage, statusFilter, senderFilter]);

  // Load emails when filters or page change
  useEffect(() => {
    logger.debug('🚀 EMAIL HISTORY TAB useEffect triggered', {
      currentPage,
      statusFilter,
      senderFilter,
    });

    loadEmails();
  }, [currentPage, statusFilter, senderFilter, loadEmails]);

  const handleViewEmail = async (emailId: string) => {
    const emailDetail = await viewEmailDetail(emailId);
    if (emailDetail) {
      setViewDialog({ open: true, email: emailDetail });
    }
  };

  const handleApproveEmail = async (emailId: string) => {
    const success = await approveEmail(emailId);
    if (success) {
      await loadEmails();
    }
  };

  const handleRejectEmail = async () => {
    if (!rejectDialog.emailId) return;

    const success = await rejectEmail(rejectDialog.emailId, rejectReason);
    if (success) {
      await loadEmails();
      setRejectDialog({ open: false, emailId: null });
      setRejectReason('');
    }
  };

  const handleArchiveEmail = async (emailId: string) => {
    const success = await archiveEmail(emailId);
    if (success) {
      await loadEmails();
    }
  };

  const handleDeleteEmail = async (emailId: string) => {
    const success = await deleteEmail(emailId);
    if (success) {
      await loadEmails();
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <div className="flex justify-center p-6">
            <Spinner />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" className="mb-4">
            📋 Emaily ({totalEmails} celkom)
          </Typography>

          {/* Mobile View - Card List */}
          <div className="md:hidden space-y-4">
            {emails.map(email => (
              <Card
                key={email.id}
                className="border border-border hover:border-primary hover:shadow-sm transition-all"
              >
                <CardContent className="p-4">
                  {/* Header - Subject and Status */}
                  <div className="flex justify-between items-start mb-2">
                    <Typography
                      variant="subtitle2"
                      className="font-semibold flex-1 mr-2 overflow-hidden text-ellipsis line-clamp-2"
                    >
                      {email.subject}
                    </Typography>
                    <StatusChip
                      status={email.status}
                      {...(email.action_taken && {
                        actionTaken: email.action_taken,
                      })}
                    />
                  </div>

                  {/* Sender and Date */}
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6 text-xs bg-primary text-primary-foreground">
                        {email.sender.charAt(0).toUpperCase()}
                      </Avatar>
                      <Typography
                        variant="body2"
                        className="text-muted-foreground text-sm"
                      >
                        {truncateText(email.sender, 25)}
                      </Typography>
                    </div>
                    <Typography
                      variant="caption"
                      className="text-muted-foreground"
                    >
                      {new Date(email.received_at).toLocaleDateString('sk')}
                    </Typography>
                  </div>

                  {/* Order Number */}
                  {email.order_number && (
                    <div className="mb-4">
                      <Badge variant="outline" className="text-xs">
                        📋 {email.order_number}
                      </Badge>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      size="sm"
                      onClick={() => handleViewEmail(email.id)}
                      variant="outline"
                      className="min-w-auto text-xs"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Detail
                    </Button>

                    {email.status === 'new' && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => handleApproveEmail(email.id)}
                          disabled={actionLoading === email.id}
                          variant="outline"
                          className="min-w-auto text-xs text-green-600 border-green-600 hover:bg-green-50"
                        >
                          {actionLoading === email.id ? (
                            <Spinner className="w-4 h-4 mr-1" />
                          ) : (
                            <CheckCircle className="w-4 h-4 mr-1" />
                          )}
                          Schváliť
                        </Button>
                        <Button
                          size="sm"
                          onClick={() =>
                            setRejectDialog({ open: true, emailId: email.id })
                          }
                          variant="outline"
                          className="min-w-auto text-xs text-red-600 border-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Zamietnuť
                        </Button>
                      </>
                    )}

                    <Button
                      size="sm"
                      onClick={() => handleArchiveEmail(email.id)}
                      disabled={actionLoading === email.id}
                      variant="outline"
                      className="min-w-auto text-xs"
                    >
                      {actionLoading === email.id ? (
                        <Spinner className="w-4 h-4 mr-1" />
                      ) : (
                        <Archive className="w-4 h-4 mr-1" />
                      )}
                      Archív
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop View - Table */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[200px]">Predmet</TableHead>
                  <TableHead className="min-w-[150px]">Odosielateľ</TableHead>
                  <TableHead className="min-w-[120px]">Prijaté</TableHead>
                  <TableHead className="min-w-[100px]">Status</TableHead>
                  <TableHead className="min-w-[120px]">Objednávka</TableHead>
                  <TableHead className="min-w-[200px]">Akcie</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {emails.map(email => (
                  <TableRow key={email.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Typography
                        variant="body2"
                        className="max-w-[250px] overflow-hidden text-ellipsis line-clamp-2"
                      >
                        {email.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        className="max-w-[150px] truncate"
                      >
                        {email.sender}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {new Date(email.received_at).toLocaleString('sk')}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <StatusChip
                        status={email.status}
                        {...(email.action_taken && {
                          actionTaken: email.action_taken,
                        })}
                      />
                    </TableCell>
                    <TableCell>
                      {email.order_number ? (
                        <Badge variant="outline" className="text-xs">
                          {email.order_number}
                        </Badge>
                      ) : (
                        <Typography
                          variant="body2"
                          className="text-muted-foreground"
                        >
                          -
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleViewEmail(email.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Zobraziť detail</p>
                          </TooltipContent>
                        </Tooltip>

                        {email.status === 'new' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleApproveEmail(email.id)}
                                disabled={actionLoading === email.id}
                                className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              >
                                {actionLoading === email.id ? (
                                  <Spinner className="h-4 w-4" />
                                ) : (
                                  <CheckCircle className="h-4 w-4" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Schváliť</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        {email.status === 'new' && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setRejectDialog({
                                    open: true,
                                    emailId: email.id,
                                  })
                                }
                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Zamietnuť</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleArchiveEmail(email.id)}
                              disabled={actionLoading === email.id}
                              className="h-8 w-8 p-0"
                            >
                              {actionLoading === email.id ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <Archive className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Archivovať</p>
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteEmail(email.id)}
                              disabled={actionLoading === email.id}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              {actionLoading === email.id ? (
                                <Spinner className="h-4 w-4" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Zmazať</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
                      }
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    page => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                          isActive={currentPage === page}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={e => {
                        e.preventDefault();
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage >= totalPages
                          ? 'pointer-events-none opacity-50'
                          : ''
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <EmailDetailDialog
        open={viewDialog.open}
        email={viewDialog.email}
        onClose={() => setViewDialog({ open: false, email: null })}
      />

      <RejectDialog
        open={rejectDialog.open}
        reason={rejectReason}
        onReasonChange={setRejectReason}
        onConfirm={handleRejectEmail}
        onCancel={() => {
          setRejectDialog({ open: false, emailId: null });
          setRejectReason('');
        }}
      />
    </>
  );
};
