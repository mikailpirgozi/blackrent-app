/**
 * Email Archive Tab Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import {
  Archive,
  Trash2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// shadcn/ui components
import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Typography } from '@/components/ui/typography';

import { useEmailApi } from '../hooks/useEmailApi';
import type {
  ArchivePagination,
  EmailDetail,
  EmailEntry,
} from '../types/email-types';
import { truncateText } from '../utils/email-formatters';

import { EmailDetailDialog } from './dialogs/EmailDetailDialog';
import { StatusChip } from './StatusChip';

interface EmailArchiveTabProps {
  senderFilter: string;
}

export const EmailArchiveTab: React.FC<EmailArchiveTabProps> = ({
  senderFilter,
}) => {
  // Responsive breakpoints using Tailwind classes
  // md: 768px, sm: 640px, xs: 0px

  // State
  const [archivedEmails, setArchivedEmails] = useState<EmailEntry[]>([]);
  const [archiveLoading, setArchiveLoading] = useState(false);
  const [archivePagination, setArchivePagination] = useState<ArchivePagination>(
    {
      total: 0,
      limit: 20,
      offset: 0,
      hasMore: false,
    }
  );
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());

  // Dialogs
  const [viewDialog, setViewDialog] = useState<{
    open: boolean;
    email: EmailDetail | null;
  }>({
    open: false,
    email: null,
  });

  // API Hook
  const {
    actionLoading,
    // error,
    // success,
    // setError,
    // setSuccess,
    viewEmailDetail,
    fetchArchivedEmails,
    bulkArchiveEmails,
    autoArchiveOldEmails,
    unarchiveEmail,
    clearHistoricalEmails,
  } = useEmailApi();

  const loadArchivedEmails = useCallback(
    async (offset = 0) => {
      try {
        setArchiveLoading(true);
        const result = await fetchArchivedEmails(offset, senderFilter);
        setArchivedEmails(result.emails);
        setArchivePagination(result.pagination);
      } catch (err) {
        // Error handled by hook
      } finally {
        setArchiveLoading(false);
      }
    },
    [fetchArchivedEmails, senderFilter]
  );

  // Load archived emails when filter changes
  useEffect(() => {
    loadArchivedEmails(0);
  }, [senderFilter, loadArchivedEmails]);

  const handleViewEmail = async (emailId: string) => {
    const emailDetail = await viewEmailDetail(emailId);
    if (emailDetail) {
      setViewDialog({ open: true, email: emailDetail });
    }
  };

  const handleUnarchiveEmail = async (emailId: string) => {
    const success = await unarchiveEmail(emailId);
    if (success) {
      await loadArchivedEmails(archivePagination.offset);
    }
  };

  const handleBulkArchive = async () => {
    const success = await bulkArchiveEmails(Array.from(selectedEmails));
    if (success) {
      setSelectedEmails(new Set());
      await loadArchivedEmails(archivePagination.offset);
    }
  };

  const handleAutoArchive = async () => {
    const success = await autoArchiveOldEmails();
    if (success) {
      await loadArchivedEmails(0);
    }
  };

  const handleClearHistorical = async () => {
    const success = await clearHistoricalEmails();
    if (success) {
      await loadArchivedEmails(0);
    }
  };

  const handlePageChange = (page: number) => {
    const newOffset = (page - 1) * archivePagination.limit;
    loadArchivedEmails(newOffset);
  };

  return (
    <>
      <Card>
        <CardContent>
          <div className="flex justify-between items-start md:items-center mb-6 flex-col md:flex-row gap-4">
            <Typography variant="h6" className="mb-0">
              📁 Archív emailov ({archivePagination.total})
            </Typography>
            <div className="flex gap-2 flex-wrap justify-center md:justify-end">
              <Button
                variant="outline"
                onClick={() => loadArchivedEmails(0)}
                disabled={archiveLoading}
                className="text-sm"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Obnoviť
              </Button>
              <Button
                variant="outline"
                onClick={handleAutoArchive}
                disabled={actionLoading === 'auto-archive'}
                className="text-sm text-orange-600 border-orange-600 hover:bg-orange-50"
              >
                {actionLoading === 'auto-archive' ? (
                  <Spinner className="w-4 h-4 mr-1" />
                ) : (
                  <Archive className="w-4 h-4 mr-1" />
                )}
                Auto-archív
              </Button>
              <Button
                variant="outline"
                onClick={handleClearHistorical}
                disabled={actionLoading === 'clear-historical'}
                className="text-sm text-red-600 border-red-600 hover:bg-red-50"
              >
                {actionLoading === 'clear-historical' ? (
                  <Spinner className="w-4 h-4 mr-1" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-1" />
                )}
                Vymazať historické
              </Button>
              {selectedEmails.size > 0 && (
                <Button
                  variant="default"
                  onClick={handleBulkArchive}
                  disabled={actionLoading === 'bulk-archive'}
                  className="text-sm"
                >
                  {actionLoading === 'bulk-archive' ? (
                    <Spinner className="w-4 h-4 mr-1" />
                  ) : (
                    <Archive className="w-4 h-4 mr-1" />
                  )}
                  Archivovať ({selectedEmails.size})
                </Button>
              )}
            </div>
          </div>

          {archiveLoading ? (
            <div className="flex justify-center p-8">
              <Spinner />
            </div>
          ) : archivedEmails.length === 0 ? (
            <div className="text-center py-12">
              <Archive className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <Typography variant="h6" className="mb-2">
                Archív je prázdny
              </Typography>
              <Typography variant="body2" className="text-muted-foreground">
                Žiadne emaily nie sú archivované. Schválené a zamietnuté emaily
                sa automaticky archivujú po 30 dňoch.
              </Typography>
            </div>
          ) : (
            <>
              {/* Mobile View - Card List */}
              <div className="md:hidden space-y-4">
                {archivedEmails.map(email => (
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
                          {...(email.action_taken && { actionTaken: email.action_taken })}
                        />
                      </div>

                      {/* Sender and Date */}
                      <div className="flex justify-between items-center mb-4">
                        <div className="flex items-center gap-2">
                          <Avatar className="w-6 h-6 text-xs bg-muted text-muted-foreground">
                            {email.sender.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography
                            variant="body2"
                            className="text-muted-foreground text-sm"
                          >
                            {truncateText(email.sender, 25)}
                          </Typography>
                        </div>
                        <Typography variant="caption" className="text-muted-foreground">
                          {new Date(email.received_at).toLocaleDateString('sk')}
                        </Typography>
                      </div>

                      {/* Order Number */}
                      {email.order_number && (
                        <div className="mb-4">
                          <Badge
                            variant="outline"
                            className="text-xs"
                          >
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

                        <Button
                          size="sm"
                          onClick={() => handleUnarchiveEmail(email.id)}
                          disabled={actionLoading === email.id}
                          variant="outline"
                          className="min-w-auto text-xs text-green-600 border-green-600 hover:bg-green-50"
                        >
                          {actionLoading === email.id ? (
                            <Spinner className="w-4 h-4 mr-1" />
                          ) : (
                            <RefreshCw className="w-4 h-4 mr-1" />
                          )}
                          Obnoviť
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
                      <TableHead className="min-w-[120px]">Archivované</TableHead>
                      <TableHead className="min-w-[100px]">Status</TableHead>
                      <TableHead className="min-w-[120px]">Objednávka</TableHead>
                      <TableHead className="min-w-[150px]">Akcie</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {archivedEmails.map(email => (
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
                            {...(email.action_taken && { actionTaken: email.action_taken })}
                          />
                        </TableCell>
                        <TableCell>
                          {email.order_number ? (
                            <Badge
                              variant="outline"
                              className="text-xs"
                            >
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

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleUnarchiveEmail(email.id)}
                                  disabled={actionLoading === email.id}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                >
                                  {actionLoading === email.id ? (
                                    <Spinner className="h-4 w-4" />
                                  ) : (
                                    <RefreshCw className="h-4 w-4" />
                                  )}
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Obnoviť z archívu</p>
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
              {archivePagination.total > archivePagination.limit && (
                <div className="flex justify-center mt-4">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            const currentPage = Math.floor(archivePagination.offset / archivePagination.limit) + 1;
                            if (currentPage > 1) handlePageChange(currentPage - 1);
                          }}
                          className={Math.floor(archivePagination.offset / archivePagination.limit) + 1 <= 1 ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: Math.ceil(archivePagination.total / archivePagination.limit) }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              handlePageChange(page);
                            }}
                            isActive={Math.floor(archivePagination.offset / archivePagination.limit) + 1 === page}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
                      <PaginationItem>
                        <PaginationNext 
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            const currentPage = Math.floor(archivePagination.offset / archivePagination.limit) + 1;
                            const totalPages = Math.ceil(archivePagination.total / archivePagination.limit);
                            if (currentPage < totalPages) handlePageChange(currentPage + 1);
                          }}
                          className={Math.floor(archivePagination.offset / archivePagination.limit) + 1 >= Math.ceil(archivePagination.total / archivePagination.limit) ? 'pointer-events-none opacity-50' : ''}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog */}
      <EmailDetailDialog
        open={viewDialog.open}
        email={viewDialog.email}
        onClose={() => setViewDialog({ open: false, email: null })}
      />
    </>
  );
};