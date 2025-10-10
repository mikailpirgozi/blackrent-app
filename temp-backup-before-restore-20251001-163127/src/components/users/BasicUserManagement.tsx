import { UnifiedIcon } from '@/components/ui/UnifiedIcon';
import {
  Delete as DeleteIcon,
  Edit as EditIcon,
  PersonAdd as PersonAddIcon,
} from '@mui/icons-material';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import {
  useCreateUser,
  useDeleteUser,
  useUpdateUser,
  useUsers,
  type CreateUserData,
  type UpdateUserData,
} from '../../lib/react-query/hooks/useUsers';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

const BasicUserManagement: React.FC = () => {
  const theme = useTheme();
  const { state } = useAuth();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  // Helper function to safely format dates
  const formatDate = (
    dateValue: string | null | undefined,
    formatString: string,
    fallback: string = 'Neznámy'
  ) => {
    if (!dateValue) return fallback;
    try {
      const date = new Date(dateValue);
      if (isNaN(date.getTime())) return fallback;
      return format(date, formatString, { locale: sk });
    } catch (error) {
      return fallback;
    }
  };
  const [error, setError] = useState<string | null>(null);

  // React Query hooks
  const {
    data: usersData = [],
    isLoading: loading,
    refetch: refetchUsers,
  } = useUsers();

  const users = usersData as unknown as User[];

  // Mutations
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const deleteUserMutation = useDeleteUser();

  // Dialog states
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Investors for dropdown
  const [investors, setInvestors] = useState<Record<string, unknown>[]>([]);
  const [loadingInvestors, setLoadingInvestors] = useState(false);

  // Loading states - handled by React Query mutations

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
    linkedInvestorId: '',
    companyId: '',
  });

  // API Base URL helper
  const getApiBaseUrl = () => {
    if (process.env.NODE_ENV === 'production') {
      return 'https://blackrent-app-production-4d6f.up.railway.app/api';
    }
    const hostname = window.location.hostname;
    const protocol = window.location.protocol;
    return `${protocol}//${hostname}:3001/api`;
  };

  const getAuthToken = useCallback(() => {
    return (
      state.token ||
      localStorage.getItem('blackrent_token') ||
      sessionStorage.getItem('blackrent_token')
    );
  }, [state.token]);

  // loadUsers - React Query handles this now

  const loadInvestors = useCallback(async () => {
    try {
      setLoadingInvestors(true);
      const response = await fetch(
        `${getApiBaseUrl()}/auth/investors-with-shares`,
        {
          headers: {
            Authorization: `Bearer ${getAuthToken()}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        const investorsList = data.data || [];
        setInvestors(investorsList);
        console.log('📊 Loaded investors:', investorsList.length);

        // Nehlás chybu ak je zoznam prázdny - to je normálne
        if (investorsList.length === 0) {
          console.log(
            'ℹ️ No investors found - this is normal if none are configured'
          );
        }
      } else {
        console.warn(
          'Failed to load investors - response not ok:',
          response.status
        );
        setInvestors([]);
      }
    } catch (error) {
      console.warn('Error loading investors (non-critical):', error);
      setInvestors([]);
    } finally {
      setLoadingInvestors(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    refetchUsers();
    loadInvestors();
  }, [refetchUsers, loadInvestors]);

  const handleCreateUser = async () => {
    console.log('🚀 Starting user creation process...');
    console.log('📝 User form data:', userForm);

    // Validate required fields
    if (!userForm.username || !userForm.email || !userForm.password) {
      const missingFields = [];
      if (!userForm.username) missingFields.push('používateľské meno');
      if (!userForm.email) missingFields.push('email');
      if (!userForm.password) missingFields.push('heslo');

      const errorMsg = `Chýbajú povinné polia: ${missingFields.join(', ')}`;
      console.error('❌ Validation failed:', errorMsg);
      setError(errorMsg);
      return;
    }

    // Creating state is handled by React Query mutation
    setError(null);

    try {
      const createUserData: CreateUserData = {
        username: userForm.username,
        email: userForm.email,
        password: userForm.password,
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        role: userForm.role,
        companyId: userForm.companyId,
      };

      await createUserMutation.mutateAsync(createUserData);

      setUserDialogOpen(false);
      resetUserForm();
      setError(null);
      console.log('🎉 User creation process completed successfully!');
    } catch (error) {
      console.error('❌ User creation error:', error);
      setError('Chyba pri vytváraní používateľa');
    } finally {
      // Creating state is handled by React Query mutation
    }
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setUserForm({
      username: user.username,
      email: user.email,
      password: '', // Never pre-fill password
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      role: user.role,
      linkedInvestorId: '', // Pre edit dialog nepovoľujeme zmenu investora
      companyId:
        ((user as unknown as Record<string, unknown>).companyId as string) ||
        '',
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!selectedUser) return;

    try {
      const updateData: UpdateUserData = {
        id: selectedUser.id,
        username: userForm.username,
        email: userForm.email,
        firstName: userForm.firstName,
        lastName: userForm.lastName,
        role: userForm.role,
        companyId: userForm.companyId,
      };

      // Only include password if it's provided
      if (userForm.password) {
        (updateData as UpdateUserData & { password?: string }).password =
          userForm.password;
      }

      await updateUserMutation.mutateAsync(updateData);

      setEditDialogOpen(false);
      setSelectedUser(null);
      resetUserForm();
      setError(null);
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Chyba pri úprave používateľa');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await deleteUserMutation.mutateAsync(selectedUser.id);

      setDeleteDialogOpen(false);
      setSelectedUser(null);
      setError(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Chyba pri mazaní používateľa');
    }
  };

  const resetUserForm = () => {
    setUserForm({
      username: '',
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'user',
      linkedInvestorId: '',
      companyId: '',
    });
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'error';
      case 'manager':
        return 'warning';
      case 'employee':
        return 'info';
      default:
        return 'default';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrátor';
      case 'manager':
        return 'Manažér';
      case 'employee':
        return 'Zamestnanec';
      default:
        return 'Používateľ';
    }
  };

  // Mobile User Card Component
  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <Card sx={{ mb: 2, border: '1px solid', borderColor: 'divider' }}>
      <CardContent sx={{ p: 2 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}
          >
            <Avatar sx={{ width: 40, height: 40 }}>
              {user.firstName?.[0] || user.username[0].toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                sx={{ fontWeight: 600, lineHeight: 1.2 }}
              >
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.875rem' }}
              >
                @{user.username}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ fontSize: '0.875rem' }}
              >
                {user.email}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <Tooltip title="Upraviť">
              <IconButton size="small" onClick={() => handleEditUser(user)}>
                <UnifiedIcon name="edit" fontSize="small" />
              </IconButton>
            </Tooltip>
            {user.id !== state.user?.id && (
              <Tooltip title="Vymazať">
                <IconButton
                  size="small"
                  color="error"
                  onClick={() => {
                    setSelectedUser(user);
                    setDeleteDialogOpen(true);
                  }}
                >
                  <UnifiedIcon name="delete" fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        <Stack spacing={1.5}>
          <Box
            sx={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Chip
              size="small"
              label={getRoleLabel(user.role)}
              color={getRoleColor(user.role)}
              variant="outlined"
            />
            <Chip
              size="small"
              label={user.isActive ? 'Aktívny' : 'Neaktívny'}
              color={user.isActive ? 'success' : 'error'}
            />
          </Box>

          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 1,
              fontSize: '0.875rem',
            }}
          >
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', fontWeight: 500 }}
              >
                Posledné prihlásenie:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {formatDate(user.lastLogin, 'dd.MM.yyyy HH:mm', 'Nikdy')}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', fontWeight: 500 }}
              >
                Vytvorený:
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                {formatDate(user.createdAt, 'dd.MM.yyyy', 'Neznámy')}
              </Typography>
            </Box>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <Box
        sx={{
          p: { xs: 2, sm: 3 },
          backgroundColor: { xs: 'transparent', sm: 'background.paper' },
          borderRadius: { xs: 0, sm: 2 },
        }}
      >
        <Skeleton variant="text" width="60%" height={40} />
        {isMobile ? (
          // Mobile loading cards
          <Box sx={{ mt: 2 }}>
            {[1, 2, 3].map(i => (
              <Card key={i} sx={{ mb: 2 }}>
                <CardContent>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Skeleton variant="circular" width={40} height={40} />
                    <Box sx={{ flex: 1 }}>
                      <Skeleton variant="text" width="70%" />
                      <Skeleton variant="text" width="50%" />
                    </Box>
                  </Box>
                  <Skeleton variant="text" width="100%" />
                  <Skeleton variant="text" width="80%" />
                </CardContent>
              </Card>
            ))}
          </Box>
        ) : (
          // Desktop loading table
          <Skeleton variant="rectangular" height={400} sx={{ mt: 2 }} />
        )}
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3 },
        backgroundColor: { xs: 'transparent', sm: 'background.paper' },
        borderRadius: { xs: 0, sm: 2 },
        minHeight: { xs: 'calc(100vh - 200px)', sm: 'auto' },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: { xs: 2, sm: 3 },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          pb: { xs: 2, sm: 0 },
          borderBottom: { xs: '1px solid', sm: 'none' },
          borderColor: 'divider',
        }}
      >
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            color: '#1976d2',
            fontSize: { xs: '1.25rem', sm: '1.75rem', md: '2rem' },
            textAlign: { xs: 'center', sm: 'left' },
          }}
        >
          👥 Správa používateľov
        </Typography>
        <Button
          variant="contained"
          startIcon={<UnifiedIcon name="personAdd" fontSize={isMobile ? 'small' : 'medium'} />}
          onClick={() => setUserDialogOpen(true)}
          sx={{
            minWidth: { xs: '100%', sm: 'auto' },
            py: { xs: 1.5, sm: 1 },
            fontSize: { xs: '0.9rem', sm: '1rem' },
          }}
        >
          Pridať používateľa
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Users List - Responsive */}
      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Používatelia ({users.length})
          </Typography>

          {/* Sort users alphabetically by firstName, lastName, then username */}
          {(() => {
            const sortedUsers = [...users].sort((a, b) => {
              // Sort by firstName first
              const firstNameA = a.firstName || '';
              const firstNameB = b.firstName || '';
              const firstNameCompare = firstNameA.localeCompare(
                firstNameB,
                'sk'
              );
              if (firstNameCompare !== 0) return firstNameCompare;

              // Then by lastName
              const lastNameA = a.lastName || '';
              const lastNameB = b.lastName || '';
              const lastNameCompare = lastNameA.localeCompare(lastNameB, 'sk');
              if (lastNameCompare !== 0) return lastNameCompare;

              // Finally by username
              return a.username.localeCompare(b.username, 'sk');
            });

            return (
              <>
                {/* Mobile Card Layout */}
                {isMobile ? (
                  <Box
                    sx={{
                      maxHeight: 'calc(100vh - 300px)',
                      overflowY: 'auto',
                      pr: 1,
                    }}
                  >
                    {sortedUsers.length === 0 ? (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ textAlign: 'center', py: 4 }}
                      >
                        Žiadni používatelia
                      </Typography>
                    ) : (
                      sortedUsers.map(user => (
                        <UserCard key={user.id} user={user} />
                      ))
                    )}
                  </Box>
                ) : (
                  /* Desktop Table Layout */
                  <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
                    <Table sx={{ minWidth: isTablet ? 800 : 1000 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Používateľ</TableCell>
                          <TableCell>Email</TableCell>
                          <TableCell>Rola</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell>Posledné prihlásenie</TableCell>
                          <TableCell>Vytvorený</TableCell>
                          <TableCell>Akcie</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {sortedUsers.map(user => (
                          <TableRow key={user.id} hover>
                            <TableCell>
                              <Box
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1,
                                }}
                              >
                                <Avatar sx={{ width: 32, height: 32 }}>
                                  {user.firstName?.[0] ||
                                    user.username[0].toUpperCase()}
                                </Avatar>
                                <Box>
                                  <Typography
                                    variant="body2"
                                    sx={{ fontWeight: 500 }}
                                  >
                                    {user.firstName && user.lastName
                                      ? `${user.firstName} ${user.lastName}`
                                      : user.username}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {user.username}
                                  </Typography>
                                </Box>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{
                                  maxWidth: isTablet ? 150 : 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {user.email}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={getRoleLabel(user.role)}
                                color={getRoleColor(user.role)}
                                variant="outlined"
                              />
                            </TableCell>
                            <TableCell>
                              <Chip
                                size="small"
                                label={user.isActive ? 'Aktívny' : 'Neaktívny'}
                                color={user.isActive ? 'success' : 'error'}
                              />
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: '0.875rem' }}
                              >
                                {formatDate(
                                  user.lastLogin,
                                  isTablet ? 'dd.MM.yy' : 'dd.MM.yyyy HH:mm',
                                  'Nikdy'
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: '0.875rem' }}
                              >
                                {formatDate(
                                  user.createdAt,
                                  isTablet ? 'dd.MM.yy' : 'dd.MM.yyyy',
                                  'Neznámy'
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', gap: 0.5 }}>
                                <Tooltip title="Upraviť">
                                  <IconButton
                                    size="small"
                                    onClick={() => handleEditUser(user)}
                                  >
                                    <UnifiedIcon name="edit" />
                                  </IconButton>
                                </Tooltip>
                                {user.id !== state.user?.id && (
                                  <Tooltip title="Vymazať">
                                    <IconButton
                                      size="small"
                                      color="error"
                                      onClick={() => {
                                        setSelectedUser(user);
                                        setDeleteDialogOpen(true);
                                      }}
                                    >
                                      <UnifiedIcon name="delete" />
                                    </IconButton>
                                  </Tooltip>
                                )}
                              </Box>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog
        open={userDialogOpen}
        onClose={() => setUserDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            ...(isMobile && {
              m: 0,
              borderRadius: 0,
              maxHeight: '100vh',
            }),
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            borderBottom: isMobile ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          Pridať používateľa
        </DialogTitle>
        <DialogContent
          sx={{
            px: isMobile ? 2 : 3,
            py: isMobile ? 2 : 1,
          }}
        >
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Používateľské meno"
                value={userForm.username}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, username: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meno"
                value={userForm.firstName}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, firstName: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={userForm.lastName}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, lastName: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Heslo"
                type="password"
                value={userForm.password}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, password: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rola</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={e =>
                    setUserForm(prev => ({ ...prev, role: e.target.value }))
                  }
                  label="Rola"
                >
                  <MenuItem value="user">Používateľ</MenuItem>
                  <MenuItem value="employee">Zamestnanec</MenuItem>
                  <MenuItem value="manager">Manažér</MenuItem>
                  <MenuItem value="admin">Administrátor</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Priradenie k investorovi (voliteľné)</InputLabel>
                <Select
                  value={userForm.linkedInvestorId}
                  onChange={e =>
                    setUserForm(prev => ({
                      ...prev,
                      linkedInvestorId: e.target.value,
                    }))
                  }
                  label="Priradenie k investorovi (voliteľné)"
                  disabled={loadingInvestors}
                >
                  <MenuItem value="">
                    Žiadne priradenie - bežný používateľ
                  </MenuItem>
                  {investors.map(investor => (
                    <MenuItem
                      key={investor.id as string}
                      value={investor.id as string}
                    >
                      {investor.firstName as string}{' '}
                      {investor.lastName as string} - Podiely:{' '}
                      {(investor.companies as Record<string, unknown>[])
                        ?.map(
                          (c: Record<string, unknown>) =>
                            `${c.companyName as string} (${c.ownershipPercentage as number}%)`
                        )
                        .join(', ')}
                    </MenuItem>
                  ))}
                </Select>
                {loadingInvestors && (
                  <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <CircularProgress size={16} sx={{ mr: 1 }} />
                    <Typography variant="caption">
                      Načítavam investorov...
                    </Typography>
                  </Box>
                )}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            p: isMobile ? 2 : 1,
            gap: 1,
            flexDirection: isMobile ? 'column-reverse' : 'row',
            borderTop: isMobile ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Button
            onClick={() => {
              setUserDialogOpen(false);
              resetUserForm();
            }}
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? '100%' : 'auto' }}
          >
            Zrušiť
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateUser}
            disabled={createUserMutation.isPending}
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? '100%' : 'auto' }}
            startIcon={
              createUserMutation.isPending ? (
                <CircularProgress size={16} />
              ) : undefined
            }
          >
            {createUserMutation.isPending ? 'Vytváram...' : 'Vytvoriť'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: {
            ...(isMobile && {
              m: 0,
              borderRadius: 0,
              maxHeight: '100vh',
            }),
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
            borderBottom: isMobile ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          Upraviť používateľa
        </DialogTitle>
        <DialogContent
          sx={{
            px: isMobile ? 2 : 3,
            py: isMobile ? 2 : 1,
          }}
        >
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Používateľské meno"
                value={userForm.username}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, username: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={userForm.email}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, email: e.target.value }))
                }
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meno"
                value={userForm.firstName}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, firstName: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={userForm.lastName}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, lastName: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Nové heslo (nechajte prázdne pre zachovanie)"
                type="password"
                value={userForm.password}
                onChange={e =>
                  setUserForm(prev => ({ ...prev, password: e.target.value }))
                }
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Rola</InputLabel>
                <Select
                  value={userForm.role}
                  onChange={e =>
                    setUserForm(prev => ({ ...prev, role: e.target.value }))
                  }
                  label="Rola"
                >
                  <MenuItem value="user">Používateľ</MenuItem>
                  <MenuItem value="employee">Zamestnanec</MenuItem>
                  <MenuItem value="manager">Manažér</MenuItem>
                  <MenuItem value="admin">Administrátor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            p: isMobile ? 2 : 1,
            gap: 1,
            flexDirection: isMobile ? 'column-reverse' : 'row',
            borderTop: isMobile ? '1px solid' : 'none',
            borderColor: 'divider',
          }}
        >
          <Button
            onClick={() => {
              setEditDialogOpen(false);
              setSelectedUser(null);
              resetUserForm();
            }}
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? '100%' : 'auto' }}
          >
            Zrušiť
          </Button>
          <Button
            variant="contained"
            onClick={handleUpdateUser}
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? '100%' : 'auto' }}
          >
            Uložiť
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            ...(isMobile && {
              m: 2,
              borderRadius: 2,
            }),
          },
        }}
      >
        <DialogTitle
          sx={{
            pb: 1,
            fontSize: isMobile ? '1.25rem' : '1.5rem',
          }}
        >
          Potvrdiť vymazanie
        </DialogTitle>
        <DialogContent
          sx={{
            px: isMobile ? 2 : 3,
            py: isMobile ? 1 : 2,
          }}
        >
          <Typography sx={{ fontSize: isMobile ? '0.9rem' : '1rem' }}>
            Naozaj chcete vymazať používateľa{' '}
            <strong>{selectedUser?.username}</strong>? Táto akcia sa nedá vrátiť
            späť.
          </Typography>
        </DialogContent>
        <DialogActions
          sx={{
            p: isMobile ? 2 : 1,
            gap: 1,
            flexDirection: isMobile ? 'column-reverse' : 'row',
          }}
        >
          <Button
            onClick={() => {
              setDeleteDialogOpen(false);
              setSelectedUser(null);
            }}
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? '100%' : 'auto' }}
          >
            Zrušiť
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteUser}
            fullWidth={isMobile}
            sx={{ minWidth: isMobile ? '100%' : 'auto' }}
          >
            Vymazať
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BasicUserManagement;
