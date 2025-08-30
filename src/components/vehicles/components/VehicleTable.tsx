import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  Speed as KmIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Typography,
  IconButton,
  Chip,
  Card,
  CardContent,
  Checkbox,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import React from 'react';

import { Vehicle } from '../../../types';
import {
  getStatusColor,
  getStatusBgColor,
  getStatusText,
  getStatusIcon,
} from '../../../utils/vehicles/vehicleHelpers';
import { Can } from '../../common/PermissionGuard';

interface VehicleTableProps {
  vehiclesToDisplay: Vehicle[];
  filteredVehicles: Vehicle[];
  displayedVehicles: number;
  hasMore: boolean;
  isLoadingMore: boolean;
  selectedVehicles: Set<string>;
  mobileScrollRef: React.RefObject<HTMLDivElement>;
  desktopScrollRef: React.RefObject<HTMLDivElement>;
  onScroll: (event: React.UIEvent<HTMLDivElement>) => void;
  onEdit: (vehicle: Vehicle) => void;
  onDelete: (vehicleId: string) => void;
  onVehicleSelect: (vehicleId: string, checked: boolean) => void;
  onLoadMore: () => void;
  onKmHistory?: (vehicle: Vehicle) => void; // 🚗 História kilometrov
}

const VehicleTable: React.FC<VehicleTableProps> = ({
  vehiclesToDisplay,
  filteredVehicles,
  displayedVehicles,
  hasMore,
  isLoadingMore,
  selectedVehicles,
  mobileScrollRef,
  desktopScrollRef,
  onScroll,
  onEdit,
  onDelete,
  onVehicleSelect,
  onLoadMore,
  onKmHistory,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <>
      {isMobile ? (
        /* MOBILE CARDS VIEW */
        <Card
          sx={{
            overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            <Box
              ref={mobileScrollRef}
              sx={{ maxHeight: '70vh', overflowY: 'auto' }}
              onScroll={onScroll}
            >
              {vehiclesToDisplay.map((vehicle, index) => (
                <Box
                  key={vehicle.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 0,
                    borderBottom:
                      index < vehiclesToDisplay.length - 1
                        ? '1px solid #e0e0e0'
                        : 'none',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    minHeight: 80,
                    cursor: 'pointer',
                  }}
                  onClick={() => onEdit(vehicle)}
                >
                  {/* ✅ NOVÉ: Checkbox pre výber vozidla */}
                  <Box
                    sx={{
                      width: 50,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: '1px solid #e0e0e0',
                      backgroundColor: '#fafafa',
                    }}
                  >
                    <Checkbox
                      size="small"
                      checked={selectedVehicles.has(vehicle.id)}
                      onChange={e => {
                        e.stopPropagation(); // Zabráni kliknutiu na celý riadok
                        onVehicleSelect(vehicle.id, e.target.checked);
                      }}
                      sx={{
                        p: 0.5,
                        '& .MuiSvgIcon-root': { fontSize: 18 },
                      }}
                    />
                  </Box>

                  {/* Vehicle Info - sticky left */}
                  <Box
                    sx={{
                      width: { xs: 140, sm: 160 },
                      maxWidth: { xs: 140, sm: 160 },
                      p: { xs: 1, sm: 1.5 },
                      borderRight: '2px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      backgroundColor: '#ffffff',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      overflow: 'hidden',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        fontSize: { xs: '0.75rem', sm: '0.8rem' },
                        color: '#1976d2',
                        lineHeight: 1.2,
                        wordWrap: 'break-word',
                        mb: { xs: 0.25, sm: 0.5 },
                      }}
                    >
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#666',
                        fontSize: { xs: '0.6rem', sm: '0.65rem' },
                        mb: { xs: 0.25, sm: 0.5 },
                        fontWeight: 600,
                      }}
                    >
                      {vehicle.licensePlate}
                    </Typography>
                    {vehicle.vin && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#888',
                          fontSize: { xs: '0.55rem', sm: '0.6rem' },
                          fontFamily: 'monospace',
                        }}
                      >
                        VIN: {vehicle.vin.slice(-6)}
                      </Typography>
                    )}
                    <Chip
                      size="small"
                      label={getStatusText(vehicle.status)}
                      icon={getStatusIcon(vehicle.status)}
                      sx={{
                        height: { xs: 18, sm: 20 },
                        fontSize: { xs: '0.55rem', sm: '0.6rem' },
                        bgcolor: getStatusBgColor(vehicle.status),
                        color: 'white',
                        fontWeight: 700,
                        minWidth: 'auto',
                        maxWidth: '100%',
                        overflow: 'hidden',
                        '& .MuiChip-icon': {
                          color: 'white',
                          fontSize: '0.8rem',
                        },
                      }}
                    />
                  </Box>

                  {/* Vehicle Details - scrollable right */}
                  <Box
                    sx={{
                      flex: 1,
                      p: { xs: 1, sm: 1.5 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      minWidth: 0,
                    }}
                  >
                    <Box sx={{ overflow: 'hidden' }}>
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                          color: '#333',
                          mb: { xs: 0.25, sm: 0.5 },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        🏢 {vehicle.company}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#666',
                          fontSize: { xs: '0.6rem', sm: '0.65rem' },
                          display: 'block',
                          mb: { xs: 0.25, sm: 0.5 },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        📊 Status: {getStatusText(vehicle.status)}
                      </Typography>
                    </Box>

                    {/* Mobile Action Buttons */}
                    <Box
                      sx={{
                        display: 'flex',
                        gap: { xs: 0.5, sm: 0.75 },
                        mt: { xs: 1, sm: 1.5 },
                        justifyContent: 'flex-start',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* Edit Button */}
                      <Can
                        update="vehicles"
                        context={{
                          resourceOwnerId: vehicle.assignedMechanicId,
                          resourceCompanyId: vehicle.ownerCompanyId,
                        }}
                      >
                        <IconButton
                          size="small"
                          title="Upraviť vozidlo"
                          onClick={e => {
                            e.stopPropagation();
                            onEdit(vehicle);
                          }}
                          sx={{
                            bgcolor: '#2196f3',
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': {
                              bgcolor: '#1976d2',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(33,150,243,0.4)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Can>

                      {/* Delete Button */}
                      <Can
                        delete="vehicles"
                        context={{
                          resourceOwnerId: vehicle.assignedMechanicId,
                          resourceCompanyId: vehicle.ownerCompanyId,
                        }}
                      >
                        <IconButton
                          size="small"
                          title="Zmazať vozidlo"
                          onClick={e => {
                            e.stopPropagation();
                            onDelete(vehicle.id);
                          }}
                          sx={{
                            bgcolor: '#f44336',
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': {
                              bgcolor: '#d32f2f',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(244,67,54,0.4)',
                            },
                            transition: 'all 0.2s ease',
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Can>
                    </Box>
                  </Box>
                </Box>
              ))}

              {/* 🚀 INFINITE SCROLL: Load More Button */}
              {hasMore && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    p: 3,
                    borderTop: '1px solid #e0e0e0',
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                    sx={{
                      minWidth: 200,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    {isLoadingMore
                      ? 'Načítavam...'
                      : `Načítať ďalších (${filteredVehicles.length - displayedVehicles} zostáva)`}
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      ) : (
        /* DESKTOP TABLE VIEW */
        <Card
          sx={{
            overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Desktop Header */}
            <Box
              sx={{
                display: 'flex',
                bgcolor: '#f8f9fa',
                borderBottom: '2px solid #e0e0e0',
                position: 'sticky',
                top: 0,
                zIndex: 100,
                minHeight: 56,
              }}
            >
              {/* Vozidlo column */}
              <Box
                sx={{
                  width: 200,
                  minWidth: 200,
                  p: 2,
                  borderRight: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: '#333' }}
                >
                  🚗 Vozidlo
                </Typography>
              </Box>

              {/* ŠPZ a VIN column */}
              <Box
                sx={{
                  width: 140,
                  minWidth: 140,
                  p: 2,
                  borderRight: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: '#333' }}
                >
                  📋 ŠPZ / VIN
                </Typography>
              </Box>

              {/* Firma column */}
              <Box
                sx={{
                  width: 150,
                  minWidth: 150,
                  p: 2,
                  borderRight: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: '#333' }}
                >
                  🏢 Firma
                </Typography>
              </Box>

              {/* Status column */}
              <Box
                sx={{
                  width: 140,
                  minWidth: 140,
                  p: 2,
                  borderRight: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: '#333' }}
                >
                  📊 Status
                </Typography>
              </Box>

              {/* Ceny column */}
              <Box
                sx={{
                  width: 200,
                  minWidth: 200,
                  p: 2,
                  borderRight: '1px solid #e0e0e0',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: '#333' }}
                >
                  💰 Ceny
                </Typography>
              </Box>

              {/* Akcie column */}
              <Box
                sx={{
                  width: 120,
                  minWidth: 120,
                  p: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: '#333' }}
                >
                  ⚡ Akcie
                </Typography>
              </Box>
            </Box>

            {/* Desktop Vehicle Rows */}
            <Box
              ref={desktopScrollRef}
              sx={{ maxHeight: '70vh', overflowY: 'auto' }}
              onScroll={onScroll}
            >
              {vehiclesToDisplay.map((vehicle, index) => (
                <Box
                  key={vehicle.id}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    p: 0,
                    borderBottom:
                      index < vehiclesToDisplay.length - 1
                        ? '1px solid #e0e0e0'
                        : 'none',
                    '&:hover': { backgroundColor: '#f8f9fa' },
                    minHeight: 72,
                    cursor: 'pointer',
                  }}
                  onClick={() => onEdit(vehicle)}
                >
                  {/* Vozidlo column */}
                  <Box
                    sx={{
                      width: 200,
                      minWidth: 200,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: 600,
                        color: '#1976d2',
                        mb: 0.5,
                      }}
                    >
                      {vehicle.brand} {vehicle.model}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color: '#666',
                        fontSize: '0.7rem',
                      }}
                    >
                      ID: {vehicle.id.slice(0, 8)}...
                    </Typography>
                  </Box>

                  {/* ŠPZ a VIN column */}
                  <Box
                    sx={{
                      width: 140,
                      minWidth: 140,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        color: '#333',
                        fontFamily: 'monospace',
                      }}
                    >
                      {vehicle.licensePlate}
                    </Typography>
                    {vehicle.vin && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#666',
                          fontFamily: 'monospace',
                          fontSize: '0.7rem',
                          mt: 0.5,
                        }}
                      >
                        VIN: {vehicle.vin.slice(-8)}
                      </Typography>
                    )}
                  </Box>

                  {/* Firma column */}
                  <Box
                    sx={{
                      width: 150,
                      minWidth: 150,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Typography
                      variant="body2"
                      sx={{
                        color: '#333',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {vehicle.company}
                    </Typography>
                  </Box>

                  {/* Status column */}
                  <Box
                    sx={{
                      width: 140,
                      minWidth: 140,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <Chip
                      size="small"
                      label={getStatusText(vehicle.status)}
                      icon={getStatusIcon(vehicle.status)}
                      sx={{
                        height: 24,
                        fontSize: '0.7rem',
                        bgcolor: getStatusBgColor(vehicle.status),
                        color: 'white',
                        fontWeight: 700,
                        '& .MuiChip-icon': {
                          color: 'white',
                          fontSize: '0.9rem',
                        },
                      }}
                    />
                  </Box>

                  {/* Ceny column */}
                  <Box
                    sx={{
                      width: 200,
                      minWidth: 200,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                    }}
                  >
                    {vehicle.pricing && vehicle.pricing.length > 0 ? (
                      <>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#666',
                            fontSize: '0.65rem',
                            mb: 0.25,
                          }}
                        >
                          1 deň:{' '}
                          {vehicle.pricing.find(
                            p => p.minDays === 0 && p.maxDays === 1
                          )?.pricePerDay || 0}
                          €
                        </Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            color: '#666',
                            fontSize: '0.65rem',
                          }}
                        >
                          7+ dní:{' '}
                          {vehicle.pricing.find(
                            p => p.minDays === 4 && p.maxDays === 7
                          )?.pricePerDay || 0}
                          €
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="caption" sx={{ color: '#999' }}>
                        Nezadané
                      </Typography>
                    )}
                  </Box>

                  {/* Akcie column */}
                  <Box
                    sx={{
                      width: 120,
                      minWidth: 120,
                      p: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 0.5,
                    }}
                  >
                    {/* Edit Button */}
                    <Can
                      update="vehicles"
                      context={{
                        resourceOwnerId: vehicle.assignedMechanicId,
                        resourceCompanyId: vehicle.ownerCompanyId,
                      }}
                    >
                      <IconButton
                        size="small"
                        title="Upraviť vozidlo"
                        onClick={e => {
                          e.stopPropagation();
                          onEdit(vehicle);
                        }}
                        sx={{
                          bgcolor: '#2196f3',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: '#1976d2',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(33,150,243,0.4)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Can>

                    {/* Km History Button */}
                    {onKmHistory && (
                      <IconButton
                        size="small"
                        title="História kilometrov"
                        onClick={e => {
                          e.stopPropagation();
                          onKmHistory(vehicle);
                        }}
                        sx={{
                          bgcolor: '#2196f3',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: '#1976d2',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(33,150,243,0.4)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <KmIcon fontSize="small" />
                      </IconButton>
                    )}

                    {/* History Button */}
                    <IconButton
                      size="small"
                      title="História vozidla"
                      onClick={e => {
                        e.stopPropagation();
                        // TODO: Implement history view
                      }}
                      sx={{
                        bgcolor: '#9c27b0',
                        color: 'white',
                        width: 28,
                        height: 28,
                        '&:hover': {
                          bgcolor: '#7b1fa2',
                          transform: 'scale(1.1)',
                          boxShadow: '0 4px 12px rgba(156,39,176,0.4)',
                        },
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <HistoryIcon fontSize="small" />
                    </IconButton>

                    {/* Delete Button */}
                    <Can
                      delete="vehicles"
                      context={{
                        resourceOwnerId: vehicle.assignedMechanicId,
                        resourceCompanyId: vehicle.ownerCompanyId,
                      }}
                    >
                      <IconButton
                        size="small"
                        title="Zmazať vozidlo"
                        onClick={e => {
                          e.stopPropagation();
                          onDelete(vehicle.id);
                        }}
                        sx={{
                          bgcolor: '#f44336',
                          color: 'white',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            bgcolor: '#d32f2f',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(244,67,54,0.4)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Can>
                  </Box>
                </Box>
              ))}

              {/* 🚀 INFINITE SCROLL: Load More Button */}
              {hasMore && (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    p: 3,
                    borderTop: '1px solid #e0e0e0',
                  }}
                >
                  <Button
                    variant="outlined"
                    onClick={onLoadMore}
                    disabled={isLoadingMore}
                    sx={{
                      minWidth: 200,
                      py: 1.5,
                      borderRadius: 3,
                      textTransform: 'none',
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    {isLoadingMore
                      ? 'Načítavam...'
                      : `Načítať ďalších (${filteredVehicles.length - displayedVehicles} zostáva)`}
                  </Button>
                </Box>
              )}
            </Box>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default VehicleTable;
