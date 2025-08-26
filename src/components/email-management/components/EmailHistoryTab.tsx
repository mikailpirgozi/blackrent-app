/**
 * Email History Tab Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Archive as ArchiveIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { EmailEntry, EmailDetail } from '../types/email-types';
import { useEmailApi } from '../hooks/useEmailApi';
import { StatusChip } from './StatusChip';
import { EmailDetailDialog } from './dialogs/EmailDetailDialog';
import { RejectDialog } from './dialogs/RejectDialog';
import { PAGE_SIZE } from '../utils/email-constants';
import { truncateText } from '../utils/email-formatters';

interface EmailHistoryTabProps {
  statusFilter: string;
  senderFilter: string;
}

export const EmailHistoryTab: React.FC<EmailHistoryTabProps> = ({
  statusFilter,
  senderFilter,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isSmallMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isExtraSmall = useMediaQuery(theme.breakpoints.down(400));

  // State
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalEmails, setTotalEmails] = useState(0);
  
  // Dialogs
  const [viewDialog, setViewDialog] = useState<{ open: boolean; email: EmailDetail | null }>({
    open: false,
    email: null
  });
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean; emailId: string | null }>({
    open: false,
    emailId: null
  });
  const [rejectReason, setRejectReason] = useState('');

  // API Hook
  const {
    loading,
    actionLoading,
    error,
    success,
    setError,
    setSuccess,
    fetchEmails,
    viewEmailDetail,
    approveEmail,
    rejectEmail,
    archiveEmail,
    deleteEmail,
  } = useEmailApi();

  // Load emails when filters or page change
  useEffect(() => {
    console.log('🚀 EMAIL HISTORY TAB useEffect triggered', {
      currentPage,
      statusFilter, 
      senderFilter
    });
    
    loadEmails();
  }, [currentPage, statusFilter, senderFilter]);

  const loadEmails = async () => {
    try {
      const result = await fetchEmails(currentPage, statusFilter, senderFilter);
      setEmails(result.emails);
      setTotalEmails(result.totalEmails);
      setTotalPages(result.totalPages);
    } catch (err) {
      // Error handled by hook
    }
  };

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
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📋 Emaily ({totalEmails} celkom)
          </Typography>
          
          {/* Mobile View - Card List */}
          {isMobile ? (
            <Stack spacing={2}>
              {emails.map((email) => (
                <Card key={email.id} variant="outlined" sx={{ 
                  border: '1px solid',
                  borderColor: 'divider',
                  '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: 1
                  }
                }}>
                  <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                    {/* Header - Subject and Status */}
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
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
                      <StatusChip status={email.status} actionTaken={email.action_taken} />
                    </Box>

                    {/* Sender and Date */}
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'primary.main' }}>
                          {email.sender.charAt(0).toUpperCase()}
                        </Avatar>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.875rem' }}>
                          {truncateText(email.sender, 25)}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(email.received_at).toLocaleDateString('sk')}
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
                      
                      {email.status === 'new' && (
                        <>
                          <Button
                            size="small"
                            startIcon={actionLoading === email.id ? <CircularProgress size={16} /> : <ApproveIcon />}
                            onClick={() => handleApproveEmail(email.id)}
                            disabled={actionLoading === email.id}
                            color="success"
                            variant="outlined"
                            sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                          >
                            Schváliť
                          </Button>
                          <Button
                            size="small"
                            startIcon={<RejectIcon />}
                            onClick={() => setRejectDialog({ open: true, emailId: email.id })}
                            color="error"
                            variant="outlined"
                            sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                          >
                            Zamietnuť
                          </Button>
                        </>
                      )}

                      <Button
                        size="small"
                        startIcon={actionLoading === email.id ? <CircularProgress size={16} /> : <ArchiveIcon />}
                        onClick={() => handleArchiveEmail(email.id)}
                        disabled={actionLoading === email.id}
                        variant="outlined"
                        sx={{ minWidth: 'auto', fontSize: '0.75rem' }}
                      >
                        Archív
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          ) : (
            /* Desktop View - Table */
            <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ minWidth: 200 }}>Predmet</TableCell>
                    <TableCell sx={{ minWidth: 150 }}>Odosielateľ</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Prijaté</TableCell>
                    <TableCell sx={{ minWidth: 100 }}>Status</TableCell>
                    <TableCell sx={{ minWidth: 120 }}>Objednávka</TableCell>
                    <TableCell sx={{ minWidth: 200 }}>Akcie</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {emails.map((email) => (
                    <TableRow key={email.id} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ 
                          maxWidth: 250,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                        }}>
                          {email.subject}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 150 }} noWrap>
                          {email.sender}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(email.received_at).toLocaleString('sk')}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip status={email.status} actionTaken={email.action_taken} />
                      </TableCell>
                      <TableCell>
                        {email.order_number ? (
                          <Chip
                            label={email.order_number}
                            size="small"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
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
                          
                          {email.status === 'new' && (
                            <Tooltip title="Schváliť">
                              <span>
                                <IconButton
                                  size="small"
                                  onClick={() => handleApproveEmail(email.id)}
                                  disabled={actionLoading === email.id}
                                  color="success"
                                >
                                  {actionLoading === email.id ? (
                                    <CircularProgress size={20} />
                                  ) : (
                                    <ApproveIcon />
                                  )}
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {email.status === 'new' && (
                            <Tooltip title="Zamietnuť">
                              <IconButton
                                size="small"
                                onClick={() => setRejectDialog({ open: true, emailId: email.id })}
                                color="error"
                              >
                                <RejectIcon />
                              </IconButton>
                            </Tooltip>
                          )}

                          <Tooltip title="Archivovať">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleArchiveEmail(email.id)}
                                disabled={actionLoading === email.id}
                              >
                                {actionLoading === email.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <ArchiveIcon />
                                )}
                              </IconButton>
                            </span>
                          </Tooltip>

                          <Tooltip title="Zmazať">
                            <span>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteEmail(email.id)}
                                disabled={actionLoading === email.id}
                                color="error"
                              >
                                {actionLoading === email.id ? (
                                  <CircularProgress size={20} />
                                ) : (
                                  <DeleteIcon />
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
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" mt={2}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_, page) => setCurrentPage(page)}
                color="primary"
              />
            </Box>
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
