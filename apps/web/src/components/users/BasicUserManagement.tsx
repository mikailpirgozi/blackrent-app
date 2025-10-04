import {
  Trash2 as DeleteIcon,
  Edit as EditIcon,
  UserPlus as PersonAddIcon,
} from 'lucide-react';
import {
  Alert,
  AlertDescription,
  Avatar,
  Button,
  Card,
  CardContent,
  Badge,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  Typography,
} from '../ui';
import { useMobile } from '../../hooks/use-mobile';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useCallback, useEffect, useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { logger } from '@/utils/smartLogger';
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
  const { state } = useAuth();
  const isMobile = useMobile();

  // 🔄 REÁLNE RIEŠENIE: Tracking posledného prihlásenia cez localStorage
  // Implementujeme fallback tracking kým backend nepodporuje lastLogin

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
    } catch (_error) {
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
  
  // Companies for dropdown
  const [companies, setCompanies] = useState<Record<string, unknown>[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);

  // Loading states - handled by React Query mutations

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'user',
    linkedInvestorId: 'none',
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
        logger.debug('📊 Loaded investors:', investorsList.length);

        // Nehlás chybu ak je zoznam prázdny - to je normálne
        if (investorsList.length === 0) {
          logger.debug(
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
    } catch (_error) {
      console.warn('Error loading investors (non-critical):', error);
      setInvestors([]);
    } finally {
      setLoadingInvestors(false);
    }
  }, [getAuthToken]);

  const loadCompanies = useCallback(async () => {
    try {
      setLoadingCompanies(true);
      const response = await fetch(`${getApiBaseUrl()}/companies`, {
        headers: {
          Authorization: `Bearer ${getAuthToken()}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const companiesList = data.data || data || [];
        setCompanies(companiesList);
        logger.debug('🏢 Loaded companies:', companiesList.length);
      } else {
        console.warn('Failed to load companies:', response.status);
        setCompanies([]);
      }
    } catch (error) {
      console.warn('Error loading companies:', error);
      setCompanies([]);
    } finally {
      setLoadingCompanies(false);
    }
  }, [getAuthToken]);

  useEffect(() => {
    refetchUsers();
    loadInvestors();
    loadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Track prihlásenie aktuálneho používateľa
  useEffect(() => {
    if (state.user?.username) {
      const now = new Date().toISOString();
      const storageKey = `user_last_login_${state.user.username}`;
      localStorage.setItem(storageKey, now);
      logger.debug('📝 Tracked login for user:', {
        username: state.user.username,
        timestamp: now,
      });
    }
  }, [state.user?.username]);

  const handleCreateUser = async () => {
    logger.debug('🚀 Starting user creation process...');
    logger.debug('📝 User form data:', userForm);

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
      logger.debug('🎉 User creation process completed successfully!');
    } catch (_error) {
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
      linkedInvestorId: 'none', // Pre edit dialog nepovoľujeme zmenu investora
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
    } catch (_error) {
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
    } catch (_error) {
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
      linkedInvestorId: 'none',
      companyId: '',
    });
  };

  // const getRoleColor = (role: string) => {
  //   switch (role) {
  //     case 'admin':
  //       return 'destructive'; // Červená pre admin
  //     case 'manager':
  //       return 'default'; // Modrá pre manažéra
  //     case 'employee':
  //       return 'secondary'; // Šedá pre zamestnanca
  //     case 'user':
  //       return 'outline'; // Biela s border pre bežného používateľa
  //     default:
  //       return 'outline';
  //   }
  // };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'employee':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'user':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
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

  // Funkcia na detekciu online statusu (reálna implementácia)
  const isUserOnline = (user: User) => {
    if (!user.isActive) return false;

    // Ak je to aktuálny používateľ, je určite online
    if (user.username === state.user?.username) {
      return true;
    }

    // Pre ostatných používateľov skontroluj localStorage tracking
    const lastLoginData = getRealLastLogin(user);
    if (!lastLoginData) return false;

    const lastLogin = new Date(lastLoginData);
    const now = new Date();
    const diffInMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);

    // Online ak sa prihlásil v posledných 30 minútach
    return diffInMinutes <= 30;
  };

  // Funkcia na získanie reálneho posledného prihlásenia z localStorage
  const getRealLastLogin = (user: User) => {
    // Najprv skús backend dáta
    if (user.lastLogin) {
      return user.lastLogin;
    }

    // Fallback: localStorage tracking
    const storageKey = `user_last_login_${user.username}`;
    const storedLogin = localStorage.getItem(storageKey);

    if (storedLogin) {
      return storedLogin;
    }

    // Ak je to aktuálny používateľ, použij aktuálny čas
    if (user.username === state.user?.username) {
      const now = new Date().toISOString();
      localStorage.setItem(storageKey, now);
      return now;
    }

    return null;
  };

  // Funkcia na formátovanie posledného prihlásenia
  const formatLastLogin = (user: User) => {
    const lastLoginData = getRealLastLogin(user);

    if (!lastLoginData) {
      return user.isActive ? 'Nedávno' : 'Nikdy';
    }

    try {
      const lastLogin = new Date(lastLoginData);

      if (isNaN(lastLogin.getTime())) {
        return 'Neznámy dátum';
      }

      const now = new Date();
      const diffInMinutes = (now.getTime() - lastLogin.getTime()) / (1000 * 60);

      if (diffInMinutes < 1) return 'Práve teraz';
      if (diffInMinutes < 60) return `Pred ${Math.round(diffInMinutes)} min`;
      if (diffInMinutes < 1440)
        return `Pred ${Math.round(diffInMinutes / 60)} hod`;
      if (diffInMinutes < 10080)
        return `Pred ${Math.round(diffInMinutes / 1440)} dňami`;

      return formatDate(lastLoginData, 'dd.MM.yyyy HH:mm', 'Neznámy');
    } catch (_error) {
      return 'Chyba dát';
    }
  };

  // Mobile User Card Component
  const UserCard: React.FC<{ user: User }> = ({ user }) => (
    <Card className="mb-2 border">
      <CardContent className="p-2">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <Avatar className="h-10 w-10">
                {user.firstName?.[0] ||
                  user.username?.[0]?.toUpperCase() ||
                  '?'}
              </Avatar>
              {/* Online status indicator */}
              {isUserOnline(user) && (
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full shadow-lg animate-pulse"></div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Typography className="font-semibold leading-tight mb-2">
                {user.firstName && user.lastName
                  ? `${user.firstName} ${user.lastName}`
                  : user.username}
              </Typography>
              <Typography className="text-sm text-muted-foreground">
                {user.email}
              </Typography>
            </div>
          </div>
          <div className="flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                  >
                    <EditIcon className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upraviť</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            {user.id !== state.user?.id && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedUser(user);
                        setDeleteDialogOpen(true);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <DeleteIcon className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Vymazať</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <div className="space-y-4">
          {/* Používateľské meno v samostatnej sekcii */}
          <div className="bg-gray-50 p-3 rounded-md border-l-4 border-blue-500">
            <Typography className="text-xs text-muted-foreground mb-2 font-medium">
              Používateľské meno:
            </Typography>
            <Typography className="text-sm font-mono bg-white px-2 py-1 rounded border">
              @{user.username}
            </Typography>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            <Badge
              variant="outline"
              className={`text-xs ${getRoleBadgeStyle(user.role)}`}
            >
              {getRoleLabel(user.role)}
            </Badge>
            <Badge
              variant={user.isActive ? 'default' : 'destructive'}
              className="text-xs"
            >
              {user.isActive ? 'Aktívny' : 'Neaktívny'}
            </Badge>
            {isUserOnline(user) && (
              <Badge
                variant="outline"
                className="text-xs bg-green-100 text-green-800 border-green-200"
              >
                🟢 Online
              </Badge>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <Typography className="block font-medium text-muted-foreground text-xs">
                Posledné prihlásenie:
              </Typography>
              <Typography className="text-sm">
                {formatLastLogin(user)}
              </Typography>
            </div>
            <div>
              <Typography className="block font-medium text-muted-foreground text-xs">
                Vytvorený:
              </Typography>
              <Typography className="text-sm">
                {formatDate(user.createdAt, 'dd.MM.yyyy', 'Neznámy')}
              </Typography>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div
        className={`p-4 ${isMobile ? 'bg-transparent' : 'bg-background'} rounded-lg min-h-[calc(100vh-200px)]`}
      >
        <Skeleton className="h-10 w-3/5 mb-6" />
        {isMobile ? (
          // Mobile loading cards
          <div className="mt-2">
            {[1, 2, 3].map(i => (
              <Card key={i} className="mb-2">
                <CardContent>
                  <div className="flex items-center gap-3 mb-2">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-3 w-4/5" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          // Desktop loading table
          <Skeleton className="h-96 mt-2" />
        )}
      </div>
    );
  }

  return (
    <div
      className={`p-4 ${isMobile ? 'bg-transparent' : 'bg-background'} rounded-lg min-h-[calc(100vh-200px)]`}
    >
      {/* Header */}
      <div
        className={`flex justify-between items-center mb-6 ${isMobile ? 'flex-col gap-4 pb-4 border-b' : 'flex-row'}`}
      >
        <Typography
          variant="h4"
          className={`font-bold text-primary ${isMobile ? 'text-xl text-center' : 'text-2xl text-left'}`}
        >
          👥 Správa používateľov
        </Typography>
        <Button
          onClick={() => setUserDialogOpen(true)}
          className={`${isMobile ? 'w-full py-3 text-sm' : 'py-2 text-base'}`}
        >
          <PersonAddIcon
            className={`${isMobile ? 'h-4 w-4' : 'h-5 w-5'} mr-2`}
          />
          Pridať používateľa
        </Button>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users List - Responsive */}
      <Card>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Typography variant="h6">Používatelia ({users.length})</Typography>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Online: {users.filter(isUserOnline).length}</span>
              </div>
              <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                📊 Reálne dáta
              </div>
            </div>
          </div>

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
                  <div className="max-h-[calc(100vh-300px)] overflow-y-auto pr-2">
                    {sortedUsers.length === 0 ? (
                      <Typography
                        variant="body2"
                        className="text-center py-8 text-muted-foreground"
                      >
                        Žiadni používatelia
                      </Typography>
                    ) : (
                      sortedUsers.map(user => (
                        <UserCard key={user.id} user={user} />
                      ))
                    )}
                  </div>
                ) : (
                  /* Desktop Table Layout */
                  <div className="overflow-x-auto">
                    <Table className="min-w-[800px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Používateľ</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Rola</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Posledné prihlásenie</TableHead>
                          <TableHead>Vytvorený</TableHead>
                          <TableHead>Akcie</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedUsers.map(user => (
                          <TableRow key={user.id} className="hover:bg-muted/50">
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="relative">
                                  <Avatar className="h-8 w-8">
                                    {(user.firstName?.[0] ||
                                      user.username?.[0]?.toUpperCase()) ??
                                      '?'}
                                  </Avatar>
                                  {/* Online status indicator */}
                                  {isUserOnline(user) && (
                                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full shadow-lg"></div>
                                  )}
                                </div>
                                <div>
                                  <Typography
                                    variant="body2"
                                    className="font-medium"
                                  >
                                    {user.firstName && user.lastName
                                      ? `${user.firstName} ${user.lastName}`
                                      : user.username}
                                  </Typography>
                                  <Typography
                                    variant="caption"
                                    className="text-muted-foreground font-mono block mt-1"
                                  >
                                    @{user.username}
                                  </Typography>
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Typography
                                variant="body2"
                                className="max-w-[200px] truncate"
                              >
                                {user.email}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getRoleBadgeStyle(user.role)}`}
                                >
                                  {getRoleLabel(user.role)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-wrap gap-1">
                                <Badge
                                  variant={
                                    user.isActive ? 'default' : 'destructive'
                                  }
                                  className="text-xs"
                                >
                                  {user.isActive ? 'Aktívny' : 'Neaktívny'}
                                </Badge>
                                {isUserOnline(user) && (
                                  <Badge
                                    variant="outline"
                                    className="text-xs bg-green-100 text-green-800 border-green-200"
                                  >
                                    🟢 Online
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" className="text-sm">
                                {formatLastLogin(user)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" className="text-sm">
                                {formatDate(
                                  user.createdAt,
                                  'dd.MM.yyyy',
                                  'Neznámy'
                                )}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1">
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditUser(user)}
                                      >
                                        <EditIcon className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      <p>Upraviť</p>
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                {user.id !== state.user?.id && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => {
                                            setSelectedUser(user);
                                            setDeleteDialogOpen(true);
                                          }}
                                          className="text-destructive hover:text-destructive"
                                        >
                                          <DeleteIcon className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>Vymazať</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={userDialogOpen} onOpenChange={setUserDialogOpen}>
        <DialogContent
          className={`${isMobile ? 'max-w-full h-full overflow-y-auto' : 'max-w-md'}`}
        >
          <DialogHeader>
            <DialogTitle className={isMobile ? 'text-xl' : 'text-2xl'}>
              Pridať používateľa
            </DialogTitle>
            <DialogDescription>
              Vyplňte údaje pre nového používateľa. Všetky polia označené
              hviezdičkou sú povinné.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="username">Používateľské meno</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, username: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={userForm.email}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="firstName">Meno</Label>
                <Input
                  id="firstName"
                  value={userForm.firstName}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="lastName">Priezvisko</Label>
                <Input
                  id="lastName"
                  value={userForm.lastName}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="password">Heslo</Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, password: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Rola</Label>
                <Select
                  value={userForm.role}
                  onValueChange={value =>
                    setUserForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte rolu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investor">💼 Investor (Read-only)</SelectItem>
                    <SelectItem value="employee">👤 Zamestnanec</SelectItem>
                    <SelectItem value="mechanic">🔧 Mechanik</SelectItem>
                    <SelectItem value="sales_rep">💰 Obchodník</SelectItem>
                    <SelectItem value="temp_worker">⏱️ Brigádnik</SelectItem>
                    <SelectItem value="company_admin">🏢 Admin Firmy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

              <div>
                <Label htmlFor="company">
                  Platforma/Firma *
                </Label>
                <Select
                  value={userForm.companyId}
                  onValueChange={value =>
                    setUserForm(prev => ({
                      ...prev,
                      companyId: value,
                    }))
                  }
                  disabled={loadingCompanies}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte platformu" />
                  </SelectTrigger>
                  <SelectContent>
                    {companies.map(company => (
                      <SelectItem
                        key={company.id as string}
                        value={company.id as string}
                      >
                        🏢 {company.name as string}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Typography className="text-xs text-muted-foreground mt-1">
                  {userForm.role === 'investor' && 'Pre investora vyberte hlavnú platformu'}
                  {userForm.role === 'company_admin' && 'Admin bude mať plné práva v tejto firme'}
                  {userForm.role === 'employee' && 'Zamestnanec bude patriť k tejto firme'}
                </Typography>
                {loadingCompanies && (
                  <div className="flex items-center mt-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                    <Typography className="text-sm text-muted-foreground">
                      Načítavam platformy...
                    </Typography>
                  </div>
                )}
              </div>

              {userForm.role === 'investor' && (
                <div>
                  <Label htmlFor="investor">
                    Priradenie k investorovi (voliteľné)
                  </Label>
                  <Select
                    value={userForm.linkedInvestorId}
                    onValueChange={value =>
                      setUserForm(prev => ({
                        ...prev,
                        linkedInvestorId: value,
                      }))
                    }
                    disabled={loadingInvestors}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Vyberte investora" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">
                        Žiadne priradenie - bežný používateľ
                      </SelectItem>
                      {investors.length > 0 ? (
                        investors.map(investor => (
                          <SelectItem
                            key={investor.id as string}
                            value={investor.id as string}
                          >
                            💼 {investor.firstName as string}{' '}
                            {investor.lastName as string}
                            {(investor.companies as Record<string, unknown>[])?.length > 0 && 
                              ` - Podiely: ${(investor.companies as Record<string, unknown>[])
                                ?.map(
                                  (c: Record<string, unknown>) =>
                                    `${c.companyName as string} (${c.ownershipPercentage as number}%)`
                                )
                                .join(', ')}`
                            }
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          Žiadni investori v databáze
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {loadingInvestors && (
                    <div className="flex items-center mt-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                      <Typography className="text-sm text-muted-foreground">
                        Načítavam investorov...
                      </Typography>
                    </div>
                  )}
                  {!loadingInvestors && investors.length === 0 && (
                    <Typography className="text-xs text-amber-600 mt-1">
                      ⚠️ Žiadni investori nenájdení. Vytvorte investorov v sekcii "Databáza vozidiel" → Firmy → Investori.
                    </Typography>
                  )}
                </div>
              )}
          </div>
          <DialogFooter
            className={`${isMobile ? 'flex-col-reverse gap-2' : 'flex-row gap-2'}`}
          >
            <Button
              variant="outline"
              onClick={() => {
                setUserDialogOpen(false);
                resetUserForm();
              }}
              className={isMobile ? 'w-full' : ''}
            >
              Zrušiť
            </Button>
            <Button
              onClick={handleCreateUser}
              disabled={createUserMutation.isPending}
              className={isMobile ? 'w-full' : ''}
            >
              {createUserMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Vytváram...
                </>
              ) : (
                'Vytvoriť'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent
          className={`${isMobile ? 'max-w-full h-full overflow-y-auto' : 'max-w-md'}`}
        >
          <DialogHeader>
            <DialogTitle className={isMobile ? 'text-xl' : 'text-2xl'}>
              Upraviť používateľa
            </DialogTitle>
            <DialogDescription>
              Upravte údaje používateľa {selectedUser?.username}. Nechajte pole
              hesla prázdne pre zachovanie aktuálneho hesla.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-username">Používateľské meno</Label>
                <Input
                  id="edit-username"
                  value={userForm.username}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, username: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  type="email"
                  value={userForm.email}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, email: e.target.value }))
                  }
                  required
                />
              </div>
              <div>
                <Label htmlFor="edit-firstName">Meno</Label>
                <Input
                  id="edit-firstName"
                  value={userForm.firstName}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-lastName">Priezvisko</Label>
                <Input
                  id="edit-lastName"
                  value={userForm.lastName}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, lastName: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-password">
                  Nové heslo (nechajte prázdne pre zachovanie)
                </Label>
                <Input
                  id="edit-password"
                  type="password"
                  value={userForm.password}
                  onChange={(
                    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
                  ) =>
                    setUserForm(prev => ({ ...prev, password: e.target.value }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Rola</Label>
                <Select
                  value={userForm.role}
                  onValueChange={value =>
                    setUserForm(prev => ({ ...prev, role: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Vyberte rolu" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investor">💼 Investor (Read-only)</SelectItem>
                    <SelectItem value="employee">👤 Zamestnanec</SelectItem>
                    <SelectItem value="mechanic">🔧 Mechanik</SelectItem>
                    <SelectItem value="sales_rep">💰 Obchodník</SelectItem>
                    <SelectItem value="temp_worker">⏱️ Brigádnik</SelectItem>
                    <SelectItem value="company_admin">🏢 Admin Firmy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Company Selector in Edit */}
            <div>
              <Label htmlFor="edit-company">
                Platforma/Firma *
              </Label>
              <Select
                value={userForm.companyId}
                onValueChange={value =>
                  setUserForm(prev => ({
                    ...prev,
                    companyId: value,
                  }))
                }
                disabled={loadingCompanies}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Vyberte platformu" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem
                      key={company.id as string}
                      value={company.id as string}
                    >
                      🏢 {company.name as string}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter
            className={`${isMobile ? 'flex-col-reverse gap-2' : 'flex-row gap-2'}`}
          >
            <Button
              variant="outline"
              onClick={() => {
                setEditDialogOpen(false);
                setSelectedUser(null);
                resetUserForm();
              }}
              className={isMobile ? 'w-full' : ''}
            >
              Zrušiť
            </Button>
            <Button
              onClick={handleUpdateUser}
              className={isMobile ? 'w-full' : ''}
            >
              Uložiť
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className={isMobile ? 'text-xl' : 'text-2xl'}>
              Potvrdiť vymazanie
            </DialogTitle>
            <DialogDescription>
              Táto akcia je nevratná. Používateľ {selectedUser?.username} bude
              trvalo vymazaný zo systému.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Typography className={isMobile ? 'text-sm' : 'text-base'}>
              Naozaj chcete vymazať používateľa{' '}
              <strong>{selectedUser?.username}</strong>? Táto akcia sa nedá
              vrátiť späť.
            </Typography>
          </div>
          <DialogFooter
            className={`${isMobile ? 'flex-col-reverse gap-2' : 'flex-row gap-2'}`}
          >
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSelectedUser(null);
              }}
              className={isMobile ? 'w-full' : ''}
            >
              Zrušiť
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteUser}
              className={isMobile ? 'w-full' : ''}
            >
              Vymazať
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BasicUserManagement;
