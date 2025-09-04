import {
  Business as BusinessIcon,
  DirectionsCar as CarIcon,
  Check as CheckIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Typography,
} from '@mui/material';
import React from 'react';
import { formatDateTime } from '../../../utils/formatters';
import PriceDisplay from './PriceDisplay';

import type { Rental, Vehicle } from '../../../types';
import { MobileRentalRow } from '../MobileRentalRow';

interface RentalTableProps {
  paginatedRentals: Rental[];
  isMobile: boolean;
  handleEdit: (rental: Rental) => void;
  handleDelete: (id: string) => void;
  handleOpenProtocolMenu: (rental: Rental, type: 'handover' | 'return') => void;
  handleViewRental: (rental: Rental) => void;
  onScroll?: (event: { scrollOffset: number }) => void;
  // Helper functions now imported directly in child components
  // Desktop view props
  getVehicleByRental: (rental: Rental) => Vehicle | undefined;
  protocolStatusMap: Record<
    string,
    { hasHandoverProtocol: boolean; hasReturnProtocol: boolean }
  >;
  protocols: Record<string, { handover?: unknown; return?: unknown }>;
  filteredRentals: Rental[];
  desktopScrollRef: React.RefObject<HTMLDivElement>;
  mobileScrollRef: React.RefObject<HTMLDivElement>;
  isLoadingProtocolStatus: boolean;
  protocolStatusLoaded: boolean;
  handleCheckProtocols: (rental: Rental) => void;
  loadingProtocols: string[];
  VirtualizedRentalRow: React.ComponentType<unknown>;
}

export const RentalTable: React.FC<RentalTableProps> = ({
  paginatedRentals,
  isMobile,
  handleEdit,
  handleDelete,
  handleOpenProtocolMenu,
  // handleViewRental,
  // onScroll,
  // Desktop view props
  getVehicleByRental,
  protocolStatusMap,
  protocols,
  filteredRentals,
  desktopScrollRef,
  // mobileScrollRef,
  isLoadingProtocolStatus,
  protocolStatusLoaded,
  handleCheckProtocols,
  loadingProtocols,
  // VirtualizedRentalRow,
}) => {
  // const theme = useTheme();

  // 🗑️ DELETE CONFIRMATION DIALOG STATE
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [rentalToDelete, setRentalToDelete] = React.useState<Rental | null>(
    null
  );

  // 🗑️ DELETE HANDLERS
  const handleDeleteClick = (rental: Rental) => {
    setRentalToDelete(rental);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (rentalToDelete) {
      handleDelete(rentalToDelete.id);
      setDeleteDialogOpen(false);
      setRentalToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRentalToDelete(null);
  };

  return (
    <>
      {isMobile ? (
        /* MOBILNÝ KARTOVÝ DIZAJN PRE PRENÁJMY */
        <Box
          sx={{
            mx: 1, // Rovnaký margin ako ostatné komponenty
            py: 2,
            minHeight: '60vh',
            maxHeight: '80vh',
            overflow: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              background: '#f1f1f1',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              background: '#888',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb:hover': {
              background: '#555',
            },
          }}
        >
          {filteredRentals.map((rental, index) => {
            // ⚡ BACKGROUND PROTOCOL STATUS - rovnaká logika ako desktop verzia
            const backgroundStatus = protocolStatusMap[rental.id];
            const fallbackProtocols = protocols[rental.id];

            const hasHandover = backgroundStatus
              ? backgroundStatus.hasHandoverProtocol
              : !!fallbackProtocols?.handover;
            const hasReturn = backgroundStatus
              ? backgroundStatus.hasReturnProtocol
              : !!fallbackProtocols?.return;

            return (
              <MobileRentalRow
                key={rental.id}
                rental={rental}
                vehicle={getVehicleByRental(rental)}
                index={index}
                totalRentals={filteredRentals.length}
                hasHandover={hasHandover}
                hasReturn={hasReturn}
                isLoadingProtocolStatus={loadingProtocols.includes(rental.id)}
                protocolStatusLoaded={
                  protocolStatusMap[rental.id] !== undefined
                }
                onEdit={handleEdit}
                onOpenProtocolMenu={handleOpenProtocolMenu}
                onCheckProtocols={handleCheckProtocols}
                onDelete={id => {
                  const rental = filteredRentals.find(r => r.id === id);
                  if (rental) handleDeleteClick(rental);
                }}
              />
            );
          })}
        </Box>
      ) : (
        /* DESKTOP BOOKING.COM STYLE PRENÁJMY */
        <Card
          sx={{
            overflow: 'hidden',
            boxShadow: '0 6px 20px rgba(0,0,0,0.1)',
            borderRadius: 3,
          }}
        >
          <CardContent sx={{ p: 0 }}>
            {/* Desktop sticky header */}
            <Box
              sx={{
                display: 'flex',
                borderBottom: '3px solid #e0e0e0',
                backgroundColor:
                  'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                background: '#f8f9fa',
                position: 'sticky',
                top: 0,
                zIndex: 1000,
              }}
            >
              <Box
                sx={{
                  width: 280,
                  maxWidth: 280,
                  p: 2,
                  borderRight: '2px solid #e0e0e0',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 700, color: '#1976d2', fontSize: '1rem' }}
                >
                  🚗 Vozidlo & Status
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 200,
                  maxWidth: 200,
                  p: 2,
                  borderRight: '1px solid #e0e0e0',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}
                >
                  👤 Zákazník
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 180,
                  maxWidth: 180,
                  p: 2,
                  borderRight: '1px solid #e0e0e0',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}
                >
                  📅 Obdobie
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 220,
                  maxWidth: 220,
                  p: 2,
                  borderRight: '1px solid #e0e0e0',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}
                >
                  💰 Cena
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 220,
                  maxWidth: 220,
                  p: 2,
                  borderRight: '1px solid #e0e0e0',
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                  overflow: 'hidden',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}
                >
                  📋 Protokoly
                </Typography>
              </Box>
              <Box
                sx={{
                  width: 80,
                  maxWidth: 80,
                  p: 2,
                  textAlign: 'center',
                  backgroundColor: '#f8f9fa',
                }}
              >
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}
                >
                  ⚡ Akcie
                </Typography>
              </Box>
            </Box>

            {/* 🎯 UNIFIED: Desktop scrollable container */}
            <Box
              ref={desktopScrollRef}
              sx={{
                minHeight: '60vh', // Flexibilná výška namiesto fixnej
                maxHeight: '75vh', // Maximum aby sa neroztiahlo príliš
                overflowY: 'auto',
                overflowX: 'hidden',
                position: 'relative',
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  background: '#f1f1f1',
                },
                '&::-webkit-scrollbar-thumb': {
                  background: '#888',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb:hover': {
                  background: '#555',
                },
              }}
            >
              {(paginatedRentals || []).map((rental, index) => {
                const vehicle = getVehicleByRental(rental);

                // 🔄 NOVÉ: Detekcia flexibilného prenájmu
                const isFlexible = rental.isFlexible || false;

                // ⚡ BACKGROUND PROTOCOL STATUS - použije background loaded data alebo fallback na starý systém
                const backgroundStatus = protocolStatusMap[rental.id];
                const fallbackProtocols = protocols[rental.id];

                const hasHandover = backgroundStatus
                  ? backgroundStatus.hasHandoverProtocol
                  : !!fallbackProtocols?.handover;
                const hasReturn = backgroundStatus
                  ? backgroundStatus.hasReturnProtocol
                  : !!fallbackProtocols?.return;

                return (
                  <Box
                    key={rental.id}
                    data-rental-item={`rental-${index}`} // 🎯 For item-based infinite scroll
                    sx={{
                      display: 'flex',
                      borderBottom:
                        index < filteredRentals.length - 1
                          ? '1px solid #e0e0e0'
                          : 'none',
                      '&:hover': {
                        backgroundColor: isFlexible
                          ? '#fff3e0'
                          : 'rgba(0,0,0,0.04)',
                        transform: 'scale(1.002)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      },
                      minHeight: 65,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      // 🎨 Čisté pozadie + flexibilné prenájmy
                      backgroundColor: isFlexible ? '#fff8f0' : 'transparent',
                      borderLeft: isFlexible ? '4px solid #ff9800' : 'none',
                      position: 'relative',
                    }}
                    onClick={() => {
                      // console.log('🔥 CARD CLICKED FOR EDIT:', rental.id);
                      handleEdit(rental);
                    }}
                  >
                    {/* Vozidlo & Status - sticky left - FIXED WIDTH */}
                    <Box
                      sx={{
                        width: 280, // FIXED WIDTH instead of minWidth
                        maxWidth: 280,
                        p: 1.5,
                        borderRight: '2px solid #e0e0e0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        backgroundColor: '#ffffff',
                        position: 'sticky',
                        left: 0,
                        zIndex: 10,
                        boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                        overflow: 'hidden', // Prevent overflow
                      }}
                    >
                      {/* 🚗 NÁZOV VOZIDLA HORE - VÝRAZNEJŠÍ */}
                      <Typography
                        variant="h6"
                        sx={{
                          fontWeight: 700,
                          fontSize: '1.1rem',
                          color: '#1976d2',
                          mb: 0.25,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2,
                        }}
                      >
                        {vehicle?.brand} {vehicle?.model}
                      </Typography>
                      {/* 🏷️ ŠPZ POD TÝM - MENŠIE */}
                      <Typography
                        variant="body2"
                        sx={{
                          color: '#666',
                          fontSize: '0.8rem',
                          mb: 0.25,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <CarIcon fontSize="small" sx={{ fontSize: '0.9rem' }} />
                        {vehicle?.licensePlate || 'N/A'}
                      </Typography>
                      {/* 🏢 FIRMA - VŽDY VIDITEĽNÁ */}
                      {vehicle?.company && (
                        <Typography
                          variant="body2"
                          sx={{
                            color: '#ff9800',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 0.5,
                            mb: 0.25,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <BusinessIcon fontSize="small" />
                          {vehicle.company}
                        </Typography>
                      )}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.5,
                          alignItems: 'flex-start',
                        }}
                      >
                        <Chip
                          size="small"
                          label={
                            rental.status === 'active'
                              ? 'AKTÍVNY'
                              : rental.status === 'finished'
                                ? 'UKONČENÝ'
                                : rental.status === 'pending'
                                  ? 'ČAKAJÚCI'
                                  : 'NOVÝ'
                          }
                          sx={{
                            height: 22,
                            fontSize: '0.65rem',
                            bgcolor:
                              rental.status === 'active'
                                ? '#4caf50'
                                : rental.status === 'finished'
                                  ? '#2196f3'
                                  : rental.status === 'pending'
                                    ? '#ff9800'
                                    : '#757575',
                            color: 'white',
                            fontWeight: 500,
                            opacity: 0.9,
                          }}
                        />
                        {/* 🔄 FLEXIBILNÝ PRENÁJOM INDIKÁTOR */}
                        {isFlexible && (
                          <Chip
                            size="small"
                            label="FLEXIBILNÝ"
                            sx={{
                              height: 20,
                              fontSize: '0.6rem',
                              bgcolor: '#ff9800',
                              color: 'white',
                              fontWeight: 500,
                              opacity: 0.9,
                            }}
                          />
                        )}
                      </Box>
                    </Box>

                    {/* 👤 ZÁKAZNÍK - INŠPIROVANÉ MOBILNÝM DIZAJNOM */}
                    <Box
                      sx={{
                        width: 200,
                        maxWidth: 200,
                        p: 1.5,
                        borderRight: '1px solid #e0e0e0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        textAlign: 'left',
                        overflow: 'hidden',
                      }}
                    >
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.9rem',
                          color: '#333',
                          mb: 0.25,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.75,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <Box
                          sx={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            bgcolor: '#4caf50',
                            flexShrink: 0,
                          }}
                        />
                        {rental.customerName}
                      </Typography>

                      {/* 📞 TELEFÓN A EMAIL - KOMPAKTNE */}
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 0.25,
                        }}
                      >
                        {(rental.customerPhone || rental.customer?.phone) && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#666',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <PhoneIcon
                              fontSize="small"
                              sx={{ fontSize: '0.9rem' }}
                            />
                            {rental.customerPhone || rental.customer?.phone}
                          </Typography>
                        )}

                        {(rental.customerEmail || rental.customer?.email) && (
                          <Typography
                            variant="body2"
                            sx={{
                              color: '#666',
                              fontSize: '0.75rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 0.5,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            <EmailIcon
                              fontSize="small"
                              sx={{ fontSize: '0.9rem' }}
                            />
                            {rental.customerEmail ||
                              rental.customer?.email ||
                              'N/A'}
                          </Typography>
                        )}
                      </Box>
                    </Box>

                    {/* Obdobie - FIXED WIDTH */}
                    <Box
                      sx={{
                        width: 180,
                        maxWidth: 180,
                        p: 1.5,
                        borderRight: '1px solid #e0e0e0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        textAlign: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: '#333',
                          mb: 0.25,
                        }}
                      >
                        📅 {formatDateTime(rental.startDate)}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#666',
                          fontSize: '0.7rem',
                          mb: 0.25,
                        }}
                      >
                        ↓
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          color: '#333',
                        }}
                      >
                        📅 {formatDateTime(rental.endDate)}
                      </Typography>
                    </Box>

                    {/* Cena - FIXED WIDTH */}
                    <Box
                      sx={{
                        width: 220,
                        maxWidth: 220,
                        p: 1.5,
                        borderRight: '1px solid #e0e0e0',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        textAlign: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <PriceDisplay
                        rental={rental}
                        variant="compact"
                        showExtraKm={true}
                      />
                      <Chip
                        size="small"
                        label={rental.paid ? 'UHRADENÉ' : 'NEUHRADENÉ'}
                        sx={{
                          height: 20,
                          fontSize: '0.6rem',
                          bgcolor: rental.paid ? '#4caf50' : '#f44336',
                          color: 'white',
                          fontWeight: 700,
                        }}
                      />
                    </Box>

                    {/* 📋 PROTOKOLY - INŠPIROVANÉ MOBILNÝM DIZAJNOM */}
                    <Box
                      sx={{
                        width: 220,
                        maxWidth: 220,
                        p: 1.5,
                        borderRight: '1px solid #e0e0e0',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        flexDirection: 'column',
                        gap: 1,
                        overflow: 'hidden',
                      }}
                    >
                      {/* 🔧 PROTOKOL TLAČIDLÁ - ŠTÝL AKO V MOBILE */}
                      <Box
                        sx={{
                          display: 'flex',
                          gap: 0.75,
                          width: '100%',
                        }}
                      >
                        <Button
                          variant={hasHandover ? 'contained' : 'outlined'}
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenProtocolMenu(rental, 'handover');
                          }}
                          startIcon={
                            hasHandover ? <CheckIcon /> : <ScheduleIcon />
                          }
                          sx={{
                            flex: 1,
                            height: 32,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            minWidth: 0,
                            px: 0.75,
                            bgcolor: hasHandover ? '#4caf50' : 'transparent',
                            borderColor: hasHandover ? '#4caf50' : '#ff9800',
                            color: hasHandover ? 'white' : '#ff9800',
                            '&:hover': {
                              bgcolor: hasHandover
                                ? '#388e3c'
                                : 'rgba(255,152,0,0.1)',
                              transform: 'scale(1.02)',
                              boxShadow: hasHandover
                                ? '0 4px 12px rgba(76,175,80,0.3)'
                                : '0 4px 12px rgba(255,152,0,0.2)',
                            },
                            transition: 'all 0.2s ease',
                            '& .MuiButton-startIcon': {
                              marginRight: '4px',
                              marginLeft: 0,
                            },
                          }}
                        >
                          {hasHandover ? 'Odovz.' : 'Odovzdať'}
                        </Button>

                        <Button
                          variant={hasReturn ? 'contained' : 'outlined'}
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleOpenProtocolMenu(rental, 'return');
                          }}
                          startIcon={
                            hasReturn ? <CheckIcon /> : <ScheduleIcon />
                          }
                          sx={{
                            flex: 1,
                            height: 32,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            minWidth: 0,
                            px: 0.75,
                            bgcolor: hasReturn ? '#4caf50' : 'transparent',
                            borderColor: hasReturn ? '#4caf50' : '#ff9800',
                            color: hasReturn ? 'white' : '#ff9800',
                            '&:hover': {
                              bgcolor: hasReturn
                                ? '#388e3c'
                                : 'rgba(255,152,0,0.1)',
                              transform: 'scale(1.02)',
                              boxShadow: hasReturn
                                ? '0 4px 12px rgba(76,175,80,0.3)'
                                : '0 4px 12px rgba(255,152,0,0.2)',
                            },
                            transition: 'all 0.2s ease',
                            '& .MuiButton-startIcon': {
                              marginRight: '4px',
                              marginLeft: 0,
                            },
                          }}
                        >
                          {hasReturn ? 'Prevz.' : 'Prevziať'}
                        </Button>
                      </Box>

                      {/* STATUS TEXT */}
                      <Typography
                        variant="caption"
                        sx={{
                          color: '#666',
                          fontSize: '0.7rem',
                          textAlign: 'center',
                          lineHeight: 1.2,
                        }}
                      >
                        {hasHandover && hasReturn
                          ? '✅ Kompletné'
                          : hasHandover
                            ? '🚗→ Odovzdané'
                            : hasReturn
                              ? '←🚗 Vrátené'
                              : '⏳ Čaká'}
                      </Typography>

                      {/* PROTOCOL CHECK BUTTON */}
                      {isLoadingProtocolStatus ? (
                        <Button
                          variant="outlined"
                          size="small"
                          disabled
                          sx={{
                            borderColor: '#ff9800',
                            color: '#ff9800',
                            fontSize: '0.65rem',
                            height: 26,
                            minWidth: 0,
                            px: 1,
                          }}
                        >
                          Načítavam...
                        </Button>
                      ) : !protocolStatusLoaded ? (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={e => {
                            e.stopPropagation();
                            handleCheckProtocols(rental);
                          }}
                          sx={{
                            borderColor: '#2196f3',
                            color: '#2196f3',
                            fontSize: '0.65rem',
                            height: 26,
                            minWidth: 0,
                            px: 1,
                            '&:hover': {
                              bgcolor: 'rgba(33,150,243,0.1)',
                            },
                          }}
                        >
                          Skontrolovať
                        </Button>
                      ) : null}
                    </Box>

                    {/* Akcie */}
                    <Box
                      sx={{
                        width: 80,
                        maxWidth: 80,
                        p: 1,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: 1,
                        flexDirection: 'column',
                      }}
                    >
                      <IconButton
                        size="small"
                        title="Upraviť prenájom"
                        onClick={e => {
                          e.stopPropagation();
                          handleEdit(rental);
                        }}
                        sx={{
                          bgcolor: '#2196f3',
                          color: 'white',
                          '&:hover': {
                            bgcolor: '#1976d2',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(33,150,243,0.4)',
                          },
                          '&:active': {
                            transform: 'scale(0.95)',
                          },
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Zmazať prenájom"
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteClick(rental);
                        }}
                        sx={{
                          bgcolor: '#f44336',
                          color: 'white',
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
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </CardContent>
        </Card>
      )}

      {/* 🗑️ DELETE CONFIRMATION DIALOG */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          ⚠️ Potvrdenie zmazania
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            Naozaj chcete zmazať prenájom pre zákazníka{' '}
            <strong>{rentalToDelete?.customerName}</strong>?
            <br />
            <br />
            Vozidlo:{' '}
            <strong>
              {rentalToDelete
                ? getVehicleByRental(rentalToDelete)?.licensePlate
                : 'N/A'}
            </strong>
            <br />
            Obdobie:{' '}
            <strong>
              {rentalToDelete && formatDateTime(rentalToDelete.startDate)} -{' '}
              {rentalToDelete && formatDateTime(rentalToDelete.endDate)}
            </strong>
            <br />
            <br />
            <span style={{ color: '#f44336', fontWeight: 600 }}>
              Táto akcia sa nedá vrátiť späť!
            </span>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleDeleteCancel}
            variant="outlined"
            sx={{
              borderColor: '#666',
              color: '#666',
              '&:hover': {
                borderColor: '#333',
                bgcolor: 'rgba(0,0,0,0.04)',
              },
            }}
          >
            Zrušiť
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            variant="contained"
            sx={{
              bgcolor: '#f44336',
              '&:hover': {
                bgcolor: '#d32f2f',
              },
            }}
            autoFocus
          >
            Zmazať prenájom
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
