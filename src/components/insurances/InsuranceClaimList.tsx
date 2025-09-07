import {
  Add as AddIcon,
  DirectionsCar as CarIcon,
  CheckCircle as CheckCircleIcon,
  ReportProblem as ClaimIcon,
  Close as CloseIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Error as ErrorIcon,
  Euro as EuroIcon,
  Event as EventIcon,
  FilterList as FilterListIcon,
  Schedule as ScheduleIcon,
  Search as SearchIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  Fab,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { format } from 'date-fns';
import { sk } from 'date-fns/locale';
import React, { useMemo, useState } from 'react';

import { useApp } from '../../context/AppContext';
import type { InsuranceClaim } from '../../types';

import InsuranceClaimForm from './InsuranceClaimForm';

const getIncidentTypeInfo = (type: string) => {
  switch (type) {
    case 'accident':
      return { label: 'Nehoda', color: '#d32f2f', bgColor: '#ffebee' };
    case 'theft':
      return { label: 'Krádež', color: '#7b1fa2', bgColor: '#f3e5f5' };
    case 'vandalism':
      return { label: 'Vandalizmus', color: '#f57c00', bgColor: '#fff3e0' };
    case 'weather':
      return { label: 'Počasie', color: '#1976d2', bgColor: '#e3f2fd' };
    default:
      return { label: 'Iné', color: '#616161', bgColor: '#f5f5f5' };
  }
};

const getStatusInfo = (status: string) => {
  switch (status) {
    case 'reported':
      return {
        label: 'Nahlásené',
        color: '#f57c00',
        bgColor: '#fff3e0',
        icon: <ScheduleIcon sx={{ fontSize: 14 }} />,
      };
    case 'investigating':
      return {
        label: 'Vyšetruje sa',
        color: '#1976d2',
        bgColor: '#e3f2fd',
        icon: <SearchIcon sx={{ fontSize: 14 }} />,
      };
    case 'approved':
      return {
        label: 'Schválené',
        color: '#388e3c',
        bgColor: '#e8f5e8',
        icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
      };
    case 'rejected':
      return {
        label: 'Zamietnuté',
        color: '#d32f2f',
        bgColor: '#ffebee',
        icon: <ErrorIcon sx={{ fontSize: 14 }} />,
      };
    case 'closed':
      return {
        label: 'Uzavreté',
        color: '#616161',
        bgColor: '#f5f5f5',
        icon: <CheckCircleIcon sx={{ fontSize: 14 }} />,
      };
    default:
      return {
        label: 'Neznáme',
        color: '#616161',
        bgColor: '#f5f5f5',
        icon: <WarningIcon sx={{ fontSize: 14 }} />,
      };
  }
};

export default function InsuranceClaimList() {
  const {
    state,
    createInsuranceClaim,
    updateInsuranceClaim,
    deleteInsuranceClaim,
  } = useApp();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));

  const [openDialog, setOpenDialog] = useState(false);
  const [editingClaim, setEditingClaim] = useState<InsuranceClaim | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(isMobile ? 5 : 10);

  // Get insurance claims from state
  const claims = state.insuranceClaims || [];

  // Filter claims
  const filteredClaims = useMemo(() => {
    const claims = state.insuranceClaims || [];
    return claims.filter(claim => {
      const matchesSearch =
        !searchQuery ||
        claim.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (claim.claimNumber &&
          claim.claimNumber
            .toLowerCase()
            .includes(searchQuery.toLowerCase())) ||
        (claim.location &&
          claim.location.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesVehicle =
        !filterVehicle || claim.vehicleId === filterVehicle;
      const matchesStatus = !filterStatus || claim.status === filterStatus;
      const matchesType = !filterType || claim.incidentType === filterType;

      return matchesSearch && matchesVehicle && matchesStatus && matchesType;
    });
  }, [
    state.insuranceClaims,
    searchQuery,
    filterVehicle,
    filterStatus,
    filterType,
  ]);

  // Paginated claims
  const paginatedClaims = useMemo(() => {
    const startIndex = page * rowsPerPage;
    return filteredClaims.slice(startIndex, startIndex + rowsPerPage);
  }, [filteredClaims, page, rowsPerPage]);

  const handleAdd = () => {
    setEditingClaim(null);
    setOpenDialog(true);
  };

  const handleEdit = (claim: InsuranceClaim) => {
    setEditingClaim(claim);
    setOpenDialog(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať túto poistnú udalosť?')) {
      try {
        await deleteInsuranceClaim(id);
      } catch (error) {
        alert('Chyba pri mazaní poistnej udalosti');
      }
    }
  };

  const handleSave = async (claimData: InsuranceClaim) => {
    try {
      if (editingClaim && editingClaim.id) {
        await updateInsuranceClaim(claimData);
      } else {
        await createInsuranceClaim(claimData);
      }
      setOpenDialog(false);
      setEditingClaim(null);
    } catch (error) {
      console.error('Chyba pri ukladaní poistnej udalosti:', error);
      alert(
        'Chyba pri ukladaní poistnej udalosti: ' +
          (error instanceof Error ? error.message : 'Neznáma chyba')
      );
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterVehicle('');
    setFilterStatus('');
    setFilterType('');
  };

  const hasActiveFilters =
    searchQuery || filterVehicle || filterStatus || filterType;

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (!state.insuranceClaims) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: 200,
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        p: { xs: 1, sm: 2, md: 3 },
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
      }}
    >
      {/* Responsive Header */}
      <Card
        sx={{
          mb: { xs: 2, sm: 3 },
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          borderRadius: { xs: 2, sm: 3 },
        }}
      >
        <CardContent
          sx={{
            background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
            color: 'white',
            p: { xs: 2, sm: 2.5, md: 3 },
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: isMobile ? 'flex-start' : 'center',
              flexDirection: isMobile ? 'column' : 'row',
              gap: { xs: 2, sm: 2 },
            }}
          >
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 1.5, sm: 2 },
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <ClaimIcon
                sx={{
                  fontSize: { xs: 24, sm: 28, md: 32 },
                  flexShrink: 0,
                }}
              />
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography
                  variant={isMobile ? 'h6' : isTablet ? 'h5' : 'h4'}
                  sx={{
                    fontWeight: 700,
                    mb: 0.5,
                    fontSize: {
                      xs: '1.1rem',
                      sm: '1.25rem',
                      md: '1.5rem',
                      lg: '2rem',
                    },
                    lineHeight: 1.2,
                  }}
                >
                  {isMobile ? 'Poistné udalosti' : 'Poistné udalosti'}
                </Typography>
                <Typography
                  variant={isMobile ? 'body2' : 'body1'}
                  sx={{
                    opacity: 0.9,
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                  }}
                >
                  {claims.length} udalostí celkom
                </Typography>
              </Box>
            </Box>

            {!isMobile && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                size={isTablet ? 'medium' : 'large'}
                sx={{
                  backgroundColor: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.3)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.3)',
                  },
                }}
              >
                Pridať udalosť
              </Button>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Responsive Statistics */}
      <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mb: { xs: 2, sm: 3 } }}>
        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)',
              color: 'white',
              minHeight: { xs: 80, sm: 100, md: 120 },
              borderRadius: { xs: 2, sm: 3 },
              transition: 'transform 0.2s ease-in-out',
              '&:hover': {
                transform: isMobile ? 'none' : 'translateY(-2px)',
              },
            }}
          >
            <CardContent
              sx={{
                p: { xs: 1.5, sm: 2, md: 2.5 },
                '&:last-child': { pb: { xs: 1.5, sm: 2, md: 2.5 } },
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: isMobile ? 'column' : 'row',
                  textAlign: isMobile ? 'center' : 'left',
                  gap: isMobile ? 1 : 0,
                }}
              >
                <Box sx={{ order: isMobile ? 2 : 1 }}>
                  <Typography
                    variant={
                      isMobile ? 'caption' : isTablet ? 'subtitle2' : 'h6'
                    }
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' },
                      letterSpacing: 0.5,
                      mb: { xs: 0.5, sm: 1 },
                    }}
                  >
                    CELKOM
                  </Typography>
                  <Typography
                    variant={isMobile ? 'h6' : isTablet ? 'h5' : 'h4'}
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.25rem', sm: '1.5rem', md: '2rem' },
                    }}
                  >
                    {claims.length}
                  </Typography>
                </Box>
                <ClaimIcon
                  sx={{
                    fontSize: { xs: 20, sm: 32, md: 40 },
                    opacity: 0.8,
                    order: isMobile ? 1 : 2,
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #2196f3 0%, #1976d2 100%)',
              color: 'white',
              minHeight: { xs: 100, sm: 120 },
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: { xs: 'column', sm: 'row' },
                  textAlign: { xs: 'center', sm: 'left' },
                  gap: { xs: 1, sm: 0 },
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '1.25rem' },
                    }}
                  >
                    VYŠETRUJE SA
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', sm: '2.125rem' },
                    }}
                  >
                    {claims.filter(c => c.status === 'investigating').length}
                  </Typography>
                </Box>
                <SearchIcon
                  sx={{
                    fontSize: { xs: 24, sm: 40 },
                    opacity: 0.8,
                    display: { xs: 'none', sm: 'block' },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #4caf50 0%, #388e3c 100%)',
              color: 'white',
              minHeight: { xs: 100, sm: 120 },
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: { xs: 'column', sm: 'row' },
                  textAlign: { xs: 'center', sm: 'left' },
                  gap: { xs: 1, sm: 0 },
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '1.25rem' },
                    }}
                  >
                    SCHVÁLENÉ
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', sm: '2.125rem' },
                    }}
                  >
                    {claims.filter(c => c.status === 'approved').length}
                  </Typography>
                </Box>
                <CheckCircleIcon
                  sx={{
                    fontSize: { xs: 24, sm: 40 },
                    opacity: 0.8,
                    display: { xs: 'none', sm: 'block' },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={6} sm={6} md={3}>
          <Card
            sx={{
              height: '100%',
              background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)',
              color: 'white',
              minHeight: { xs: 100, sm: 120 },
            }}
          >
            <CardContent sx={{ p: { xs: 1.5, sm: 2 } }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexDirection: { xs: 'column', sm: 'row' },
                  textAlign: { xs: 'center', sm: 'left' },
                  gap: { xs: 1, sm: 0 },
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      fontSize: { xs: '0.75rem', sm: '1.25rem' },
                    }}
                  >
                    ZAMIETNUTÉ
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      fontWeight: 700,
                      fontSize: { xs: '1.5rem', sm: '2.125rem' },
                    }}
                  >
                    {claims.filter(c => c.status === 'rejected').length}
                  </Typography>
                </Box>
                <ErrorIcon
                  sx={{
                    fontSize: { xs: 24, sm: 40 },
                    opacity: 0.8,
                    display: { xs: 'none', sm: 'block' },
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Search and Filters */}
      <Card sx={{ mb: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box
            sx={{
              display: 'flex',
              gap: { xs: 1, sm: 2 },
              mb: showFilters ? 2 : 0,
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { xs: 'stretch', sm: 'center' },
            }}
          >
            <TextField
              placeholder="Vyhľadať udalosť..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                ),
              }}
              sx={{
                flex: 1,
                minWidth: { xs: 'auto', sm: '250px' },
                mb: { xs: 1, sm: 0 },
              }}
              size="medium"
            />
            <Box
              sx={{
                display: 'flex',
                gap: 1,
                flexDirection: { xs: 'row', sm: 'row' },
                justifyContent: { xs: 'space-between', sm: 'flex-start' },
              }}
            >
              <Button
                variant={showFilters ? 'contained' : 'outlined'}
                startIcon={
                  <FilterListIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                }
                onClick={() => setShowFilters(!showFilters)}
                sx={{
                  whiteSpace: 'nowrap',
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                  px: { xs: 2, sm: 3 },
                  flex: { xs: 1, sm: 'none' },
                }}
                size="medium"
              >
                <Box
                  component="span"
                  sx={{ display: { xs: 'none', sm: 'inline' } }}
                >
                  Filtre{' '}
                  {hasActiveFilters &&
                    `(${[searchQuery, filterVehicle, filterStatus, filterType].filter(Boolean).length})`}
                </Box>
                <Box
                  component="span"
                  sx={{ display: { xs: 'inline', sm: 'none' } }}
                >
                  Filtre
                </Box>
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outlined"
                  startIcon={
                    <CloseIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
                  }
                  onClick={clearFilters}
                  sx={{
                    whiteSpace: 'nowrap',
                    fontSize: { xs: '0.875rem', sm: '1rem' },
                    px: { xs: 2, sm: 3 },
                    flex: { xs: 1, sm: 'none' },
                  }}
                  size="medium"
                >
                  <Box
                    component="span"
                    sx={{ display: { xs: 'none', sm: 'inline' } }}
                  >
                    Vyčistiť
                  </Box>
                  <Box
                    component="span"
                    sx={{ display: { xs: 'inline', sm: 'none' } }}
                  >
                    Reset
                  </Box>
                </Button>
              )}
            </Box>
          </Box>

          {showFilters && (
            <Grid container spacing={{ xs: 1, sm: 2 }}>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Vozidlo</InputLabel>
                  <Select
                    value={filterVehicle}
                    onChange={e => setFilterVehicle(e.target.value)}
                    label="Vozidlo"
                  >
                    <MenuItem value="">Všetky</MenuItem>
                    {state.vehicles?.map(vehicle => (
                      <MenuItem key={vehicle.id} value={vehicle.id}>
                        <Box
                          sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            fontSize: { xs: '0.875rem', sm: '1rem' },
                          }}
                        >
                          <span>
                            {vehicle.brand} {vehicle.model}
                          </span>
                          <Typography variant="caption" color="text.secondary">
                            {vehicle.licensePlate}
                          </Typography>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Stav</InputLabel>
                  <Select
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value)}
                    label="Stav"
                  >
                    <MenuItem value="">Všetky</MenuItem>
                    <MenuItem value="reported">Nahlásené</MenuItem>
                    <MenuItem value="investigating">Vyšetruje sa</MenuItem>
                    <MenuItem value="approved">Schválené</MenuItem>
                    <MenuItem value="rejected">Zamietnuté</MenuItem>
                    <MenuItem value="closed">Uzavreté</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Typ udalosti</InputLabel>
                  <Select
                    value={filterType}
                    onChange={e => setFilterType(e.target.value)}
                    label="Typ udalosti"
                  >
                    <MenuItem value="">Všetky</MenuItem>
                    <MenuItem value="accident">Nehoda</MenuItem>
                    <MenuItem value="theft">Krádež</MenuItem>
                    <MenuItem value="vandalism">Vandalizmus</MenuItem>
                    <MenuItem value="weather">Počasie</MenuItem>
                    <MenuItem value="other">Iné</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>

      {/* Claims Table/Cards */}
      {filteredClaims.length === 0 ? (
        <Card sx={{ textAlign: 'center', py: { xs: 4, sm: 6 } }}>
          <CardContent>
            <ClaimIcon
              sx={{
                fontSize: { xs: 48, sm: 64 },
                color: 'text.secondary',
                mb: 2,
              }}
            />
            <Typography
              variant="h6"
              sx={{ mb: 1, fontSize: { xs: '1rem', sm: '1.25rem' } }}
              color="text.secondary"
            >
              {hasActiveFilters ? 'Žiadne výsledky' : 'Žiadne poistné udalosti'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {hasActiveFilters
                ? 'Skúste zmeniť filter alebo vyhľadávací výraz'
                : 'Zatiaľ neboli vytvorené žiadne poistné udalosti'}
            </Typography>
            {!hasActiveFilters && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={handleAdd}
                size="medium"
              >
                Pridať prvú udalosť
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Desktop Table */}
          <Box sx={{ display: { xs: 'none', md: 'block' } }}>
            <TableContainer
              component={Paper}
              sx={{ boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>
                      Dátum udalosti
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Vozidlo</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Typ</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Popis</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Stav</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Škoda</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Akcie</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedClaims.map(claim => {
                    const vehicle = state.vehicles?.find(
                      v => v.id === claim.vehicleId
                    );
                    const typeInfo = getIncidentTypeInfo(claim.incidentType);
                    const statusInfo = getStatusInfo(claim.status);

                    return (
                      <TableRow key={claim.id} hover>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <EventIcon
                              sx={{ fontSize: 18, color: 'text.secondary' }}
                            />
                            {format(
                              new Date(claim.incidentDate),
                              'dd.MM.yyyy',
                              { locale: sk }
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <CarIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                            {vehicle
                              ? `${vehicle.brand} ${vehicle.model}`
                              : 'Neznáme vozidlo'}
                            <br />
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {vehicle?.licensePlate}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={typeInfo.label}
                            size="small"
                            sx={{
                              backgroundColor: typeInfo.bgColor,
                              color: typeInfo.color,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" sx={{ maxWidth: 200 }}>
                            {claim.description.length > 50
                              ? `${claim.description.substring(0, 50)}...`
                              : claim.description}
                          </Typography>
                          {claim.location && (
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              📍 {claim.location}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              backgroundColor: statusInfo.bgColor,
                              color: statusInfo.color,
                              fontWeight: 600,
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          {claim.estimatedDamage ? (
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 1,
                              }}
                            >
                              <EuroIcon
                                sx={{ fontSize: 16, color: 'text.secondary' }}
                              />
                              {claim.estimatedDamage.toLocaleString()} €
                            </Box>
                          ) : (
                            <Typography variant="body2" color="text.secondary">
                              -
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Upraviť">
                              <IconButton
                                size="small"
                                onClick={() => handleEdit(claim)}
                                sx={{ color: '#1976d2' }}
                              >
                                <EditIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Vymazať">
                              <IconButton
                                size="small"
                                onClick={() => handleDelete(claim.id)}
                                sx={{ color: '#d32f2f' }}
                              >
                                <DeleteIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: 'block', md: 'none' } }}>
            <Grid container spacing={2}>
              {paginatedClaims.map(claim => {
                const vehicle = state.vehicles?.find(
                  v => v.id === claim.vehicleId
                );
                const typeInfo = getIncidentTypeInfo(claim.incidentType);
                const statusInfo = getStatusInfo(claim.status);

                return (
                  <Grid item xs={12} key={claim.id}>
                    <Card
                      sx={{
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        border: '1px solid #e0e0e0',
                        '&:hover': {
                          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        },
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        {/* Header with date and actions */}
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            mb: 2,
                          }}
                        >
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                            }}
                          >
                            <EventIcon
                              sx={{ fontSize: 18, color: 'text.secondary' }}
                            />
                            <Typography variant="body2" fontWeight={600}>
                              {format(
                                new Date(claim.incidentDate),
                                'dd.MM.yyyy',
                                { locale: sk }
                              )}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <IconButton
                              size="small"
                              onClick={() => handleEdit(claim)}
                              sx={{ color: '#1976d2' }}
                            >
                              <EditIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(claim.id)}
                              sx={{ color: '#d32f2f' }}
                            >
                              <DeleteIcon sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Box>
                        </Box>

                        {/* Vehicle info */}
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                            mb: 2,
                          }}
                        >
                          <CarIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                          <Box>
                            <Typography variant="body2" fontWeight={600}>
                              {vehicle
                                ? `${vehicle.brand} ${vehicle.model}`
                                : 'Neznáme vozidlo'}
                            </Typography>
                            <Typography
                              variant="caption"
                              color="text.secondary"
                            >
                              {vehicle?.licensePlate}
                            </Typography>
                          </Box>
                        </Box>

                        {/* Type and Status */}
                        <Box
                          sx={{
                            display: 'flex',
                            gap: 1,
                            mb: 2,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Chip
                            label={typeInfo.label}
                            size="small"
                            sx={{
                              backgroundColor: typeInfo.bgColor,
                              color: typeInfo.color,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          />
                          <Chip
                            icon={statusInfo.icon}
                            label={statusInfo.label}
                            size="small"
                            sx={{
                              backgroundColor: statusInfo.bgColor,
                              color: statusInfo.color,
                              fontWeight: 600,
                              fontSize: '0.75rem',
                            }}
                          />
                        </Box>

                        {/* Description */}
                        <Typography
                          variant="body2"
                          sx={{ mb: 1, lineHeight: 1.4 }}
                        >
                          {claim.description}
                        </Typography>

                        {/* Location */}
                        {claim.location && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ mb: 2, display: 'block' }}
                          >
                            📍 {claim.location}
                          </Typography>
                        )}

                        {/* Damage amount */}
                        {claim.estimatedDamage && (
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mt: 1,
                            }}
                          >
                            <EuroIcon
                              sx={{ fontSize: 16, color: 'text.secondary' }}
                            />
                            <Typography
                              variant="body2"
                              fontWeight={600}
                              color="primary"
                            >
                              {claim.estimatedDamage.toLocaleString()} €
                            </Typography>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Box>

          <TablePagination
            component="div"
            count={filteredClaims.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            labelRowsPerPage="Riadkov na stránku:"
            labelDisplayedRows={({ from, to, count }) =>
              `${from}–${to} z ${count}`
            }
            sx={{
              mt: 2,
              '& .MuiTablePagination-toolbar': {
                fontSize: { xs: '0.875rem', sm: '1rem' },
                px: { xs: 1, sm: 2 },
              },
              '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows':
                {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
            }}
          />
        </>
      )}

      {/* Responsive Floating Action Button for Mobile */}
      {isMobile && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleAdd}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            background: 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #c62828 0%, #a00000 100%)',
            },
            zIndex: 1000,
            boxShadow: '0 4px 12px rgba(211, 47, 47, 0.3)',
          }}
        >
          <AddIcon />
        </Fab>
      )}

      {/* Responsive Insurance Claim Form Dialog */}
      {openDialog && (
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="lg"
          fullWidth
          fullScreen={isMobile}
          disableRestoreFocus
          keepMounted={false}
          sx={{
            '& .MuiDialog-paper': {
              borderRadius: isMobile ? 0 : { xs: 2, sm: 3 },
              margin: isMobile ? 0 : { xs: 1, sm: 2 },
            },
          }}
        >
          <InsuranceClaimForm
            claim={editingClaim}
            onSave={handleSave}
            onCancel={() => setOpenDialog(false)}
          />
        </Dialog>
      )}
    </Box>
  );
}
