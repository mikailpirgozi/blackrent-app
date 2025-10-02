/**
 * Email Archive Tab Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import {
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Pagination,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React, { useCallback, useEffect, useState } from 'react';

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
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));

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
      } catch {
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
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems={isMobile ? 'flex-start' : 'center'}
            mb={3}
            flexDirection={isMobile ? 'column' : 'row'}
            gap={isMobile ? 2 : 0}
          >
            <Typography variant="h6" gutterBottom={isMobile}>
              📁 Archív emailov ({archivePagination.total})
            </Typography>
            <Box
              display="flex"
              gap={1}
              flexWrap="wrap"
              justifyContent={isMobile ? 'center' : 'flex-end'}
            >
              <Button
                variant="outlined"
                onClick={() => loadArchivedEmails(0)}
                disabled={archiveLoading}
                startIcon={<RefreshIcon />}
                size={isSmallMobile ? 'small' : 'medium'}
              >
                {isExtraSmall ? 'Obnoviť' : 'Obnoviť'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleAutoArchive}
                disabled={actionLoading === 'auto-archive'}
                startIcon={
                  actionLoading === 'auto-archive' ? (
                    <CircularProgress size={16} />
                  ) : (
                    <ArchiveIcon />
                  )
                }
                color="warning"
                size={isSmallMobile ? 'small' : 'medium'}
              >
                {isExtraSmall ? 'Auto' : 'Auto-archív'}
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearHistorical}
                disabled={actionLoading === 'clear-historical'}
                startIcon={
                  actionLoading === 'clear-historical' ? (
                    <CircularProgress size={16} />
                  ) : (
                    <DeleteIcon />
                  )
                }
                color="error"
                size={isSmallMobile ? 'small' : 'medium'}
              >
                {isExtraSmall ? 'Vymazať' : 'Vymazať historické'}
              </Button>
              {selectedEmails.size > 0 && (
                <Button
                  variant="contained"
                  onClick={handleBulkArchive}
                  disabled={actionLoading === 'bulk-archive'}
                  startIcon={
                    actionLoading === 'bulk-archive' ? (
                      <CircularProgress size={16} />
                    ) : (
                      <ArchiveIcon />
                    )
                  }
                  color="primary"
                  size={isSmallMobile ? 'small' : 'medium'}
                >
                  {isExtraSmall
                    ? `Archív (${selectedEmails.size})`
                    : `Archivovať (${selectedEmails.size})`}
                </Button>
              )}
            </Box>
          </Box>

          {archiveLoading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <CircularProgress />
            </Box>
          ) : archivedEmails.length === 0 ? (
            <Box textAlign="center" py={6}>
              <ArchiveIcon fontSize="large" color="disabled" sx={{ mb: 2 }} />
              <Typography variant="h6" gutterBottom>
                Archív je prázdny
              </Typography>
              <Typography variant="body2" color="textSecondary">
                Žiadne emaily nie sú archivované. Schválené a zamietnuté emaily
                sa automaticky archivujú po 30 dňoch.
              </Typography>
            </Box>
          ) : (
            <>
              {/* Mobile View - Card List */}
              {isMobile ? (
                <Stack spacing={2}>
                  {archivedEmails.map(email => (
                    <Card
                      key={email.id}
                      variant="outlined"
                      sx={{
                        border: '1px solid',
                        borderColor: 'divider',
                        '&:hover': {
                          borderColor: 'primary.main',
                          boxShadow: 1,
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        {/* Header - Subject and Status */}
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="flex-start"
                          mb={1}
                        >
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              flex: 1,
                              mr: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                            }}
                          >
                            {email.subject}
                          </Typography>
                          <StatusChip
                            status={email.status}
                            actionTaken={email.action_taken}
                          />
                        </Box>

                        {/* Sender and Date */}
                        <Box
                          display="flex"
                          justifyContent="space-between"
                          alignItems="center"
                          mb={2}
                        >
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              sx={{
                                width: 24,
                                height: 24,
                                fontSize: '0.75rem',
                                bgcolor: 'grey.500',
                              }}
                            >
                              {email.sender.charAt(0).toUpperCase()}
                            </Avatar>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{ fontSize: '0.875rem' }}
                            >
                              {truncateText(email.sender, 25)}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(email.received_at).toLocaleDateString(
                              'sk'
                            )}
                          </Typography>
                        </Box>

                        {/* Order Number */}
                        {email.order_number && (
                          <Box mb={2}>
                            <Chip
                              label={`📋 ${email.order_number}`}
                              size="small"
                              variant="outlined"
                              sx={{ fontSize: '0.75rem' }}
                            />
                          </Box>
                        )}

                        {/* Actions */}
                        <Box display="flex" gap={1} flexWrap="wrap">
                          <Button
                            size="small"
                            startIcon={<ViewIcon />}
                            onClick={() => handleViewEmail(email.id)}
                            variant="outlined"
                            sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                          >
                            Detail
                          </Button>

                          <Button
                            size="small"
                            startIcon={
                              actionLoading === email.id ? (
                                <CircularProgress size={16} />
                              ) : (
                                <RefreshIcon />
                              )
                            }
                            onClick={() => handleUnarchiveEmail(email.id)}
                            disabled={actionLoading === email.id}
                            color="success"
                            variant="outlined"
                            sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                          >
                            Obnoviť
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </Stack>
              ) : (
                /* Desktop View - Table */
                <TableContainer
                  component={Paper}
                  elevation={0}
                  sx={{ overflowX: 'auto' }}
                >
                  <Table stickyHeader>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ minWidth: 200 }}>Predmet</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>
                          Odosielateľ
                        </TableCell>
                        <TableCell sx={{ minWidth: 120 }}>
                          Archivované
                        </TableCell>
                        <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                        <TableCell sx={{ minWidth: 120 }}>Objednávka</TableCell>
                        <TableCell sx={{ minWidth: 150 }}>Akcie</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {archivedEmails.map(email => (
                        <TableRow key={email.id} hover>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 250,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                              }}
                            >
                              {email.subject}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ maxWidth: 150 }}
                              noWrap
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
                              actionTaken={email.action_taken}
                            />
                          </TableCell>
                          <TableCell>
                            {email.order_number ? (
                              <Chip
                                label={email.order_number}
                                size="small"
                                variant="outlined"
                              />
                            ) : (
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
                                -
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell>
                            <Box display="flex" gap={1} flexWrap="wrap">
                              <Tooltip title="Zobraziť detail">
                                <IconButton
                                  size="small"
                                  onClick={() => handleViewEmail(email.id)}
                                >
                                  <ViewIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="Obnoviť z archívu">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() =>
                                      handleUnarchiveEmail(email.id)
                                    }
                                    disabled={actionLoading === email.id}
                                    color="success"
                                  >
                                    {actionLoading === email.id ? (
                                      <CircularProgress size={20} />
                                    ) : (
                                      <RefreshIcon />
                                    )}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Pagination */}
              {archivePagination.total > archivePagination.limit && (
                <Box display="flex" justifyContent="center" mt={2}>
                  <Pagination
                    count={Math.ceil(
                      archivePagination.total / archivePagination.limit
                    )}
                    page={
                      Math.floor(
                        archivePagination.offset / archivePagination.limit
                      ) + 1
                    }
                    onChange={(_, page) => handlePageChange(page)}
                    color="primary"
                  />
                </Box>
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
