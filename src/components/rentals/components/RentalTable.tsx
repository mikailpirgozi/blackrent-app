import React, { useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Chip,
  Fade,
  CircularProgress,
  useTheme
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as HandoverIcon,
  AssignmentReturn as ReturnIcon,
  Visibility as ViewIcon,
  PhotoLibrary as GalleryIcon,
  PictureAsPdf as PdfIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import { Rental } from '../../../types';
import { FixedSizeList as List } from 'react-window';
import {
  formatCurrency,
  formatDate,
  getStatusColor,
  getStatusLabel,
  getPaymentMethodLabel
} from '../../../utils/rentalHelpers';

interface RentalTableProps {
  paginatedRentals: Rental[];
  isMobile: boolean;
  handleEdit: (rental: Rental) => void;
  handleDelete: (id: string) => void;
  handleCreateHandover: (rental: Rental) => void;
  handleCreateReturn: (rental: Rental) => void;
  handleOpenProtocolMenu: (rental: Rental, type: 'handover' | 'return') => void;
  handleViewRental: (rental: Rental) => void;
  onScroll?: (event: { scrollOffset: number }) => void;
  // Helper functions now imported directly in child components
  // Desktop view props
  getVehicleByRental: (rental: Rental) => any;
  protocolStatusMap: Record<string, { hasHandoverProtocol: boolean; hasReturnProtocol: boolean }>;
  protocols: Record<string, { handover?: any; return?: any }>;
  getStatusIndicator: (rental: Rental) => { color: string; label: string };
  filteredRentals: Rental[];
  desktopScrollRef: React.RefObject<HTMLDivElement>;
  mobileScrollRef: React.RefObject<HTMLDivElement>;
  isLoadingProtocolStatus: boolean;
  protocolStatusLoaded: boolean;
  handleCheckProtocols: (rental: Rental) => void;
  VirtualizedRentalRow: any;
}

export const RentalTable: React.FC<RentalTableProps> = ({
  paginatedRentals,
  isMobile,
  handleEdit,
  handleDelete,
  handleCreateHandover,
  handleCreateReturn,
  handleOpenProtocolMenu,
  handleViewRental,
  onScroll,
  // Desktop view props
  getVehicleByRental,
  protocolStatusMap,
  protocols,
  getStatusIndicator,
  filteredRentals,
  desktopScrollRef,
  mobileScrollRef,
  isLoadingProtocolStatus,
  protocolStatusLoaded,
  handleCheckProtocols,
  VirtualizedRentalRow,
}) => {
  const theme = useTheme();

  return (
    <>
      {isMobile ? (
        /* MOBILNÝ BOOKING.COM STYLE PRENÁJMY */
        <Card sx={{ overflow: 'hidden', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: 2 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Mobilný sticky header */}
            <Box sx={{ 
              display: 'flex',
              borderBottom: '2px solid #e0e0e0',
              backgroundColor: '#f8f9fa',
              position: 'sticky',
              top: 0,
              zIndex: 1000
            }}>
              <Box sx={{ 
                width: { xs: 120, sm: 140 },
                maxWidth: { xs: 120, sm: 140 },
                p: { xs: 1, sm: 1.5 },
                borderRight: '2px solid #e0e0e0',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 700, 
                  color: '#1976d2', 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  🚗 Prenájmy
                </Typography>
              </Box>
              <Box sx={{ 
                flex: 1,
                p: { xs: 1, sm: 1.5 },
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle2" sx={{ 
                  fontWeight: 700, 
                  color: '#666', 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}>
                  📅 Detaily & Status
                </Typography>
              </Box>
            </Box>

            {/* 🚀 VIRTUALIZED Mobilné prenájmy rows - pre performance */}
            <Box 
              ref={mobileScrollRef} 
              sx={{ 
                minHeight: '60vh', // Flexibilná výška namiesto fixnej
                maxHeight: '70vh', // Maximum aby sa neroztiahlo príliš
                width: '100%',
                overflow: 'auto' // Povoliť scrollovanie
              }}
            >
              <List
                height={typeof window !== 'undefined' ? Math.min(window.innerHeight * 0.6, 600) : 600} // Dynamická výška založená na veľkosti okna
                width="100%"
                itemCount={(paginatedRentals || []).length}
                itemSize={160}
                itemData={paginatedRentals || []}
                onScroll={({ scrollOffset }) => {
                  // 🎯 UNIFIED: Use the new unified scroll handler
                  if ((window as any).__unifiedRentalScrollHandler) {
                    (window as any).__unifiedRentalScrollHandler({ scrollOffset });
                  }
                  // Also call custom onScroll if provided
                  if (onScroll) {
                    onScroll({ scrollOffset });
                  }
                }}
              >
                {VirtualizedRentalRow}
              </List>
            </Box>
            
            {/* FALLBACK: Tradičný rendering pre debug */}
            <Box sx={{ display: 'none' }}>
              {(paginatedRentals || []).slice(0, 5).map((rental, index) => {
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
                     sx={{ 
                       display: 'flex',
                       borderBottom: index < filteredRentals.length - 1 ? '1px solid #e0e0e0' : 'none',
                       '&:hover': { 
                         backgroundColor: isFlexible ? '#fff3e0' : 'rgba(0,0,0,0.04)' 
                       },
                       minHeight: 80,
                       cursor: 'pointer',
                       // 🎨 Čisté pozadie + flexibilné prenájmy
                       backgroundColor: isFlexible ? '#fff8f0' : 'transparent',
                       borderLeft: isFlexible ? '4px solid #ff9800' : 'none',
                       position: 'relative',
                       transition: 'all 0.2s ease'
                     }}
                     onClick={() => {
          console.log('🔥 CARD CLICKED FOR EDIT:', rental.id);
          handleEdit(rental);
        }}
                   >
                    {/* Vozidlo info - sticky left - RESPONSIVE */}
                    <Box sx={{ 
                      width: { xs: 120, sm: 140 },
                      maxWidth: { xs: 120, sm: 140 },
                      p: { xs: 1, sm: 1.5 },
                      borderRight: '2px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      backgroundColor: '#ffffff',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      overflow: 'hidden'
                    }}>
                      {/* 🎨 STATUS INDIKÁTOR + VOZIDLO */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.5,
                        mb: { xs: 0.25, sm: 0.5 }
                      }}>
                        <Box sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: getStatusIndicator(rental).color,
                          flexShrink: 0,
                          border: '2px solid white',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)'
                        }} />
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 600, 
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                          color: '#1976d2',
                          lineHeight: 1.2,
                          wordWrap: 'break-word'
                        }}>
                          {vehicle?.brand} {vehicle?.model}
                        </Typography>
                      </Box>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: { xs: '0.6rem', sm: '0.65rem' },
                        mb: { xs: 0.25, sm: 0.5 },
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {vehicle?.licensePlate}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                        <Chip
                          size="small"
                          label={rental.status === 'active' ? 'AKTÍVNY' : 
                                 rental.status === 'finished' ? 'DOKONČENÝ' : 
                                 rental.status === 'pending' ? 'ČAKAJÚCI' : 'NOVÝ'}
                          sx={{
                            height: { xs: 18, sm: 20 },
                            fontSize: { xs: '0.55rem', sm: '0.6rem' },
                            bgcolor: rental.status === 'active' ? '#4caf50' :
                                    rental.status === 'finished' ? '#2196f3' :
                                    rental.status === 'pending' ? '#ff9800' : '#666',
                            color: 'white',
                            fontWeight: 700,
                            minWidth: 'auto',
                            maxWidth: '100%',
                            overflow: 'hidden'
                          }}
                        />
                        {/* 🔄 NOVÉ: Flexibilný prenájom indikátor */}
                        {isFlexible && (
                          <Chip
                            size="small"
                            label="FLEXIBILNÝ"
                            sx={{
                              height: { xs: 16, sm: 18 },
                              fontSize: { xs: '0.5rem', sm: '0.55rem' },
                              bgcolor: '#ff9800',
                              color: 'white',
                              fontWeight: 700,
                              minWidth: 'auto',
                              maxWidth: '100%',
                              overflow: 'hidden'
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    {/* Detaily prenájmu - scrollable right - RESPONSIVE */}
                    <Box sx={{ 
                      flex: 1,
                      p: { xs: 1, sm: 1.5 },
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      overflow: 'hidden',
                      minWidth: 0 // Allow shrinking
                    }}>
                      <Box sx={{ overflow: 'hidden' }}>
                        <Typography variant="subtitle2" sx={{ 
                          fontWeight: 600,
                          fontSize: { xs: '0.75rem', sm: '0.8rem' },
                          color: '#333',
                          mb: { xs: 0.25, sm: 0.5 },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          👤 {rental.customerName}
                        </Typography>
                        <Typography variant="caption" sx={{ 
                          color: '#666',
                          fontSize: { xs: '0.6rem', sm: '0.65rem' },
                          display: 'block',
                          mb: { xs: 0.25, sm: 0.5 },
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          📅 {format(new Date(rental.startDate), 'd.M.yy')} - {format(new Date(rental.endDate), 'd.M.yy')}
                        </Typography>
                        <Box>
                          <Typography variant="caption" sx={{ 
                            color: '#4caf50',
                            fontSize: { xs: '0.65rem', sm: '0.7rem' },
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            💰 {rental.totalPrice?.toFixed(2)}€
                          </Typography>
                          {rental.extraKmCharge && rental.extraKmCharge > 0 && (
                            <Typography variant="caption" sx={{ 
                              display: 'block',
                              fontSize: '0.6rem',
                              color: '#ff9800',
                              fontWeight: 600,
                              mt: 0.25
                            }}>
                              +{rental.extraKmCharge.toFixed(2)}€ extra km
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 0.25, sm: 0.5 }, 
                        mt: { xs: 0.5, sm: 1 }, 
                        justifyContent: 'flex-start',
                        flexWrap: 'wrap'
                      }}>
                        <Fade in timeout={600}>
                          <Chip
                            size="small"
                            label="🚗→"
                            title={hasHandover ? 'Kliknite pre zobrazenie protokolu' : 'Protokol neexistuje'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasHandover) {
                                // Open handover protocol menu only if exists
                                handleOpenProtocolMenu(rental, 'handover');
                              }
                              // Do nothing if protocol doesn't exist
                            }}
                            sx={{
                              height: { xs: 32, sm: 28 },
                              fontSize: { xs: '0.8rem', sm: '0.75rem' },
                              bgcolor: hasHandover ? '#4caf50' : '#ccc',
                              color: 'white',
                              fontWeight: 700,
                              minWidth: { xs: 44, sm: 42 },
                              maxWidth: { xs: 60, sm: 60 },
                              cursor: hasHandover ? 'pointer' : 'default',
                              borderRadius: { xs: 2, sm: 2.5 },
                              boxShadow: hasHandover ? '0 2px 8px rgba(76,175,80,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                              transform: hasHandover ? 'scale(1)' : 'scale(0.95)',
                              opacity: hasHandover ? 1 : 0.7,
                              '&:hover': hasHandover ? {
                                bgcolor: '#388e3c',
                                transform: 'scale(1.1)',
                                boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                                animation: 'bounce 0.6s ease'
                              } : {
                                transform: 'scale(0.98)',
                                opacity: 0.8
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '@keyframes bounce': {
                                '0%, 20%, 60%, 100%': { transform: 'scale(1.1)' },
                                '40%': { transform: 'scale(1.15)' },
                                '80%': { transform: 'scale(1.05)' }
                              }
                            }}
                          />
                        </Fade>
                        <Fade in timeout={800}>
                          <Chip
                            size="small"
                            label="←🚗"
                            title={hasReturn ? 'Kliknite pre zobrazenie protokolu' : 'Protokol neexistuje'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasReturn) {
                                // Open return protocol menu only if exists
                                handleOpenProtocolMenu(rental, 'return');
                              }
                              // Do nothing if protocol doesn't exist
                            }}
                            sx={{
                              height: { xs: 32, sm: 28 },
                              fontSize: { xs: '0.8rem', sm: '0.75rem' },
                              bgcolor: hasReturn ? '#4caf50' : '#ccc',
                              color: 'white',
                              fontWeight: 700,
                              minWidth: { xs: 44, sm: 42 },
                              maxWidth: { xs: 60, sm: 60 },
                              cursor: hasReturn ? 'pointer' : 'default',
                              borderRadius: { xs: 2, sm: 2.5 },
                              boxShadow: hasReturn ? '0 2px 8px rgba(76,175,80,0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
                              transform: hasReturn ? 'scale(1)' : 'scale(0.95)',
                              opacity: hasReturn ? 1 : 0.7,
                              '&:hover': hasReturn ? {
                                bgcolor: '#388e3c',
                                transform: 'scale(1.1)',
                                boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                                animation: 'bounce 0.6s ease'
                              } : {
                                transform: 'scale(0.98)',
                                opacity: 0.8
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '@keyframes bounce': {
                                '0%, 20%, 60%, 100%': { transform: 'scale(1.1)' },
                                '40%': { transform: 'scale(1.15)' },
                                '80%': { transform: 'scale(1.05)' }
                              }
                            }}
                          />
                        </Fade>
                        {/* ⚡ SMART PROTOCOL CHECK BUTTON - zobrazuje sa len ak je potrebné */}
                        {isLoadingProtocolStatus ? (
                          <Chip
                            size="small"
                            label="⏳"
                            title="Načítavam protocol status..."
                            sx={{
                              height: { xs: 32, sm: 28 },
                              fontSize: { xs: '0.8rem', sm: '0.75rem' },
                              bgcolor: '#ff9800',
                              color: 'white',
                              fontWeight: 700,
                              minWidth: { xs: 44, sm: 42 },
                              maxWidth: { xs: 60, sm: 60 },
                              borderRadius: { xs: 2, sm: 2.5 },
                              boxShadow: '0 2px 8px rgba(255,152,0,0.3)',
                              animation: 'pulse 2s infinite'
                            }}
                          />
                        ) : (
                          !protocolStatusLoaded && (
                            <Chip
                              size="small"
                              label="🔍"
                              title="Skontrolovať protokoly"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCheckProtocols(rental);
                              }}
                              sx={{
                                height: { xs: 32, sm: 28 },
                                fontSize: { xs: '0.8rem', sm: '0.75rem' },
                                bgcolor: '#9c27b0',
                                color: 'white',
                                fontWeight: 700,
                                minWidth: { xs: 44, sm: 42 },
                                maxWidth: { xs: 60, sm: 60 },
                                cursor: 'pointer',
                                borderRadius: { xs: 2, sm: 2.5 },
                                boxShadow: '0 2px 8px rgba(156,39,176,0.3)',
                                '&:hover': {
                                  bgcolor: '#7b1fa2',
                                  transform: 'scale(1.1)',
                                  boxShadow: '0 4px 12px rgba(156,39,176,0.4)'
                                },
                                transition: 'all 0.2s ease'
                              }}
                            />
                          )
                        )}
                        
                        <Chip
                          size="small"
                          label={rental.paid ? '💰' : '⏰'}
                          title={rental.paid ? 'Uhradené' : 'Neuhradené'}
                          sx={{
                            height: { xs: 32, sm: 28 },
                            fontSize: { xs: '0.8rem', sm: '0.75rem' },
                            bgcolor: rental.paid ? '#4caf50' : '#f44336',
                            color: 'white',
                            fontWeight: 700,
                            minWidth: { xs: 44, sm: 42 },
                            maxWidth: { xs: 60, sm: 60 },
                            borderRadius: { xs: 2, sm: 2.5 },
                            boxShadow: rental.paid ? '0 2px 8px rgba(76,175,80,0.3)' : '0 2px 8px rgba(244,67,54,0.3)'
                          }}
                        />
                      </Box>
                      
                      {/* Mobile Action Buttons Row */}
                      <Box sx={{ 
                        display: 'flex', 
                        gap: { xs: 0.5, sm: 0.75 }, 
                        mt: { xs: 1, sm: 1.5 }, 
                        justifyContent: 'flex-start',
                        flexWrap: 'wrap'
                      }}>
                        {/* Edit Rental Button */}
                        <IconButton
                          size="small"
                          title="Upraviť prenájom"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEdit(rental);
                          }}
                          sx={{ 
                            bgcolor: '#2196f3', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: '#1976d2',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(33,150,243,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        
                        {/* Create/View Handover Protocol Button */}
                        <IconButton
                          size="small"
                          title={hasHandover ? "Zobraziť odovzdávací protokol" : "Vytvoriť odovzdávací protokol"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasHandover) {
                              handleOpenProtocolMenu(rental, 'handover');
                            } else {
                              handleCreateHandover(rental);
                            }
                          }}
                          sx={{ 
                            bgcolor: hasHandover ? '#4caf50' : '#ff9800', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: hasHandover ? '#388e3c' : '#f57c00',
                              transform: 'scale(1.1)',
                              boxShadow: hasHandover ? '0 4px 12px rgba(76,175,80,0.4)' : '0 4px 12px rgba(255,152,0,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <HandoverIcon fontSize="small" />
                        </IconButton>
                        
                        {/* Create/View Return Protocol Button */}
                        <IconButton
                          size="small"
                          title={hasReturn ? "Zobraziť preberací protokol" : "Vytvoriť preberací protokol"}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (hasReturn) {
                              handleOpenProtocolMenu(rental, 'return');
                            } else {
                              handleCreateReturn(rental);
                            }
                          }}
                          sx={{ 
                            bgcolor: hasReturn ? '#2196f3' : '#4caf50', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: hasReturn ? '#1976d2' : '#388e3c',
                              transform: 'scale(1.1)',
                              boxShadow: hasReturn ? '0 4px 12px rgba(33,150,243,0.4)' : '0 4px 12px rgba(76,175,80,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <ReturnIcon fontSize="small" />
                        </IconButton>
                        
                        {/* Delete Rental Button */}
                        <IconButton
                          size="small"
                          title="Zmazať prenájom"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(rental.id);
                          }}
                          sx={{ 
                            bgcolor: '#f44336', 
                            color: 'white',
                            width: { xs: 36, sm: 32 },
                            height: { xs: 36, sm: 32 },
                            '&:hover': { 
                              bgcolor: '#d32f2f',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(244,67,54,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
            
            {/* END OF FALLBACK - original mobile rendering disabled */}
          </CardContent>
        </Card>
      ) : (
        /* DESKTOP BOOKING.COM STYLE PRENÁJMY */
        <Card sx={{ overflow: 'hidden', boxShadow: '0 6px 20px rgba(0,0,0,0.1)', borderRadius: 3 }}>
          <CardContent sx={{ p: 0 }}>
            {/* Desktop sticky header */}
            <Box sx={{ 
              display: 'flex',
              borderBottom: '3px solid #e0e0e0',
              backgroundColor: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              background: '#f8f9fa',
              position: 'sticky',
              top: 0,
              zIndex: 1000
            }}>
              <Box sx={{ 
                width: 260,
                maxWidth: 260,
                p: 2,
                borderRight: '2px solid #e0e0e0',
                backgroundColor: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                boxShadow: '2px 0 4px rgba(0,0,0,0.1)',
                overflow: 'hidden'
              }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1976d2', fontSize: '1rem' }}>
                  🚗 Vozidlo & Status
                </Typography>
              </Box>
              <Box sx={{ 
                width: 180,
                maxWidth: 180,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>
                  👤 Zákazník
                </Typography>
              </Box>
              <Box sx={{ 
                width: 160,
                maxWidth: 160,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>
                  📅 Obdobie
                </Typography>
              </Box>
              <Box sx={{ 
                width: 120,
                maxWidth: 120,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>
                  💰 Cena
                </Typography>
              </Box>
              <Box sx={{ 
                width: 140,
                maxWidth: 140,
                p: 2,
                borderRight: '1px solid #e0e0e0',
                textAlign: 'center',
                backgroundColor: '#f8f9fa',
                overflow: 'hidden'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>
                  📋 Protokoly
                </Typography>
              </Box>
              <Box sx={{ 
                width: 180,
                maxWidth: 180,
                p: 2,
                textAlign: 'center',
                backgroundColor: '#f8f9fa'
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#666', fontSize: '0.9rem' }}>
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
                      borderBottom: index < filteredRentals.length - 1 ? '1px solid #e0e0e0' : 'none',
                      '&:hover': { 
                        backgroundColor: isFlexible ? '#fff3e0' : 'rgba(0,0,0,0.04)',
                        transform: 'scale(1.002)',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      },
                      minHeight: 80,
                      transition: 'all 0.2s ease',
                      cursor: 'pointer',
                      // 🎨 Čisté pozadie + flexibilné prenájmy
                      backgroundColor: isFlexible ? '#fff8f0' : 'transparent',
                      borderLeft: isFlexible ? '4px solid #ff9800' : 'none',
                      position: 'relative'
                    }}
                    onClick={() => {
          console.log('🔥 CARD CLICKED FOR EDIT:', rental.id);
          handleEdit(rental);
        }}
                  >
                    {/* Vozidlo & Status - sticky left - FIXED WIDTH */}
                    <Box sx={{ 
                      width: 260, // FIXED WIDTH instead of minWidth
                      maxWidth: 260,
                      p: 2,
                      borderRight: '2px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      backgroundColor: '#ffffff',
                      position: 'sticky',
                      left: 0,
                      zIndex: 10,
                      boxShadow: '2px 0 4px rgba(0,0,0,0.05)',
                      overflow: 'hidden' // Prevent overflow
                    }}>
                      {/* 🎨 STATUS INDIKÁTOR + VOZIDLO - DESKTOP */}
                      <Box sx={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 0.75,
                        mb: 0.5
                      }}>
                        <Box sx={{
                          width: 14,
                          height: 14,
                          borderRadius: '50%',
                          backgroundColor: getStatusIndicator(rental).color,
                          flexShrink: 0,
                          border: '2px solid white',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
                        }} />
                        <Typography variant="h6" sx={{ 
                          fontWeight: 700, 
                          fontSize: '1rem',
                          color: '#1976d2',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          lineHeight: 1.2
                        }}>
                          {vehicle?.brand} {vehicle?.model}
                        </Typography>
                      </Box>
                      <Typography variant="body2" sx={{ 
                        color: '#666',
                        fontSize: '0.8rem',
                        mb: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        📋 {vehicle?.licensePlate} • 🏢 {vehicle?.company}
                      </Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
                        <Chip
                          size="small"
                          label={rental.status === 'active' ? 'AKTÍVNY' : 
                                 rental.status === 'finished' ? 'DOKONČENÝ' : 
                                 rental.status === 'pending' ? 'ČAKAJÚCI' : 'NOVÝ'}
                          sx={{
                            height: 24,
                            fontSize: '0.7rem',
                            bgcolor: rental.status === 'active' ? '#4caf50' :
                                    rental.status === 'finished' ? '#2196f3' :
                                    rental.status === 'pending' ? '#ff9800' : '#666',
                            color: 'white',
                            fontWeight: 700
                          }}
                        />
                        {/* 🔄 NOVÉ: Flexibilný prenájom indikátor */}
                        {isFlexible && (
                          <Chip
                            size="small"
                            label="FLEXIBILNÝ"
                            sx={{
                              height: 22,
                              fontSize: '0.65rem',
                              bgcolor: '#ff9800',
                              color: 'white',
                              fontWeight: 700
                            }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    {/* Zákazník - FIXED WIDTH */}
                    <Box sx={{ 
                      width: 180,
                      maxWidth: 180,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'left',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="subtitle1" sx={{ 
                        fontWeight: 600,
                        fontSize: '0.9rem',
                        color: '#333',
                        mb: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        👤 {rental.customerName}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: '0.75rem',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        📧 {rental.customerEmail || 'N/A'}
                      </Typography>
                    </Box>

                    {/* Obdobie - FIXED WIDTH */}
                    <Box sx={{ 
                      width: 160,
                      maxWidth: 160,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: '#333',
                        mb: 0.5
                      }}>
                        📅 {format(new Date(rental.startDate), 'd.M.yyyy')}
                      </Typography>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: '0.7rem',
                        mb: 0.5
                      }}>
                        ↓
                      </Typography>
                      <Typography variant="body2" sx={{ 
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        color: '#333'
                      }}>
                        📅 {format(new Date(rental.endDate), 'd.M.yyyy')}
                      </Typography>
                    </Box>

                    {/* Cena - FIXED WIDTH */}
                    <Box sx={{ 
                      width: 120,
                      maxWidth: 120,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      textAlign: 'center',
                      overflow: 'hidden'
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        color: '#4caf50',
                        mb: 0.5
                      }}>
                        {rental.totalPrice?.toFixed(2)}€
                        {rental.extraKmCharge && rental.extraKmCharge > 0 && (
                          <Typography component="span" variant="caption" sx={{ 
                            display: 'block',
                            fontSize: '0.7rem',
                            color: '#ff9800',
                            fontWeight: 600
                          }}>
                            +{rental.extraKmCharge.toFixed(2)}€ extra km
                          </Typography>
                        )}
                      </Typography>
                      <Chip
                        size="small"
                        label={rental.paid ? 'UHRADENÉ' : 'NEUHRADENÉ'}
                        sx={{
                          height: 20,
                          fontSize: '0.6rem',
                          bgcolor: rental.paid ? '#4caf50' : '#f44336',
                          color: 'white',
                          fontWeight: 700
                        }}
                      />
                    </Box>

                    {/* Protokoly - FIXED WIDTH */}
                    <Box sx={{ 
                      width: 140,
                      maxWidth: 140,
                      p: 2,
                      borderRight: '1px solid #e0e0e0',
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 1.5,
                      flexDirection: 'column',
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Fade in timeout={600}>
                          <Chip
                            size="small"
                            label="🚗→"
                            title={hasHandover ? 'Kliknite pre zobrazenie protokolu' : 'Protokol neexistuje'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasHandover) {
                                handleOpenProtocolMenu(rental, 'handover');
                              }
                              // Do nothing if protocol doesn't exist
                            }}
                            sx={{
                              height: 28,
                              width: 42,
                              fontSize: '0.8rem',
                              bgcolor: hasHandover ? '#4caf50' : '#ccc',
                              color: 'white',
                              fontWeight: 700,
                              cursor: hasHandover ? 'pointer' : 'default',
                              transform: hasHandover ? 'scale(1)' : 'scale(0.95)',
                              opacity: hasHandover ? 1 : 0.7,
                              '&:hover': hasHandover ? {
                                bgcolor: '#388e3c',
                                transform: 'scale(1.15)',
                                boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                                animation: 'pulse 0.8s ease'
                              } : {
                                transform: 'scale(0.98)',
                                opacity: 0.8
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '@keyframes pulse': {
                                '0%': { transform: 'scale(1.15)' },
                                '50%': { transform: 'scale(1.25)' },
                                '100%': { transform: 'scale(1.15)' }
                              }
                            }}
                          />
                        </Fade>
                        <Fade in timeout={800}>
                          <Chip
                            size="small"
                            label="←🚗"
                            title={hasReturn ? 'Kliknite pre zobrazenie protokolu' : 'Protokol neexistuje'}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (hasReturn) {
                                handleOpenProtocolMenu(rental, 'return');
                              }
                              // Do nothing if protocol doesn't exist
                            }}
                            sx={{
                              height: 28,
                              width: 42,
                              fontSize: '0.8rem',
                              bgcolor: hasReturn ? '#4caf50' : '#ccc',
                              color: 'white',
                              fontWeight: 700,
                              cursor: hasReturn ? 'pointer' : 'default',
                              transform: hasReturn ? 'scale(1)' : 'scale(0.95)',
                              opacity: hasReturn ? 1 : 0.7,
                              '&:hover': hasReturn ? {
                                bgcolor: '#388e3c',
                                transform: 'scale(1.15)',
                                boxShadow: '0 4px 12px rgba(76,175,80,0.4)',
                                animation: 'pulse 0.8s ease'
                              } : {
                                transform: 'scale(0.98)',
                                opacity: 0.8
                              },
                              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                              '@keyframes pulse': {
                                '0%': { transform: 'scale(1.15)' },
                                '50%': { transform: 'scale(1.25)' },
                                '100%': { transform: 'scale(1.15)' }
                              }
                            }}
                          />
                        </Fade>
                      </Box>
                      <Typography variant="caption" sx={{ 
                        color: '#666',
                        fontSize: '0.7rem',
                        textAlign: 'center'
                      }}>
                        {hasHandover && hasReturn ? '✅ Kompletné' : 
                         hasHandover ? '🚗→ Odovzdané' : 
                         hasReturn ? '←🚗 Vrátené' : '⏳ Čaká'}
                      </Typography>
                      
                      {/* Protocol Check Button - in protocols column */}
                      {isLoadingProtocolStatus ? (
                        <IconButton
                          size="small"
                          title="Načítavam protocol status..."
                          disabled
                          sx={{ 
                            bgcolor: '#ff9800', 
                            color: 'white',
                            width: 28,
                            height: 28,
                            mt: 0.5,
                            animation: 'pulse 2s infinite'
                          }}
                        >
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      ) : (!protocolStatusLoaded && (
                        <IconButton
                          size="small"
                          title="Skontrolovať protokoly"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCheckProtocols(rental);
                          }}
                          sx={{ 
                            bgcolor: '#9c27b0', 
                            color: 'white',
                            width: 28,
                            height: 28,
                            mt: 0.5,
                            '&:hover': { 
                              bgcolor: '#7b1fa2',
                              transform: 'scale(1.1)',
                              boxShadow: '0 4px 12px rgba(156,39,176,0.4)'
                            },
                            transition: 'all 0.2s ease'
                          }}
                        >
                          <SearchIcon fontSize="small" />
                        </IconButton>
                      ))}
                    </Box>

                    {/* Akcie */}
                    <Box sx={{ 
                      width: 180,
                      maxWidth: 180,
                      p: 2,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      gap: 1.5,
                      flexWrap: 'wrap'
                    }}>
                      <IconButton
                        size="small"
                        title="Upraviť prenájom"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(rental);
                        }}
                        sx={{ 
                          bgcolor: '#2196f3', 
                          color: 'white',
                          '&:hover': { 
                            bgcolor: '#1976d2',
                            transform: 'scale(1.05)',
                            boxShadow: '0 4px 12px rgba(33,150,243,0.4)'
                          },
                          '&:active': {
                            transform: 'scale(0.95)',
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title={hasHandover ? "Zobraziť odovzdávací protokol" : "Vytvoriť odovzdávací protokol"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasHandover) {
                            handleOpenProtocolMenu(rental, 'handover');
                          } else {
                            handleCreateHandover(rental);
                          }
                        }}
                        sx={{ 
                          bgcolor: hasHandover ? '#4caf50' : '#ff9800', 
                          color: 'white',
                          '&:hover': { 
                            bgcolor: hasHandover ? '#388e3c' : '#f57c00',
                            transform: 'scale(1.05)',
                            boxShadow: hasHandover ? '0 4px 12px rgba(76,175,80,0.4)' : '0 4px 12px rgba(255,152,0,0.4)'
                          },
                          '&:active': {
                            transform: 'scale(0.95)',
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <HandoverIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title={hasReturn ? "Zobraziť vrátny protokol" : "Vytvoriť vrátny protokol"}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (hasReturn) {
                            handleOpenProtocolMenu(rental, 'return');
                          } else {
                            handleCreateReturn(rental);
                          }
                        }}
                        sx={{ 
                          bgcolor: hasReturn ? '#2196f3' : '#4caf50', 
                          color: 'white',
                          '&:hover': { 
                            bgcolor: hasReturn ? '#1976d2' : '#388e3c',
                            transform: 'scale(1.1)',
                            boxShadow: hasReturn ? '0 4px 12px rgba(33,150,243,0.4)' : '0 4px 12px rgba(76,175,80,0.4)'
                          },
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <ReturnIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        title="Zmazať prenájom"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(rental.id);
                        }}
                        sx={{ 
                          bgcolor: '#f44336', 
                          color: 'white',
                          '&:hover': { 
                            bgcolor: '#d32f2f',
                            transform: 'scale(1.1)',
                            boxShadow: '0 4px 12px rgba(244,67,54,0.4)'
                          },
                          transition: 'all 0.2s ease'
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
    </>
  );
};
