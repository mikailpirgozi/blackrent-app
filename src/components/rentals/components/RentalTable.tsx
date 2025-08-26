import React, { useCallback } from 'react';
import { MobileRentalRow } from '../MobileRentalRow';
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
  loadingProtocols: string[];
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
  loadingProtocols,
  VirtualizedRentalRow,
}) => {
  const theme = useTheme();

  return (
    <>
      {isMobile ? (
        /* MOBILNÝ KARTOVÝ DIZAJN PRE PRENÁJMY */
        <Box sx={{ 
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
          }
        }}>
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
                protocolStatusLoaded={protocolStatusMap[rental.id] !== undefined}
                onEdit={handleEdit}
                onOpenProtocolMenu={handleOpenProtocolMenu}
                onCheckProtocols={handleCheckProtocols}
                onDelete={(id) => handleDelete(id)}
              />
            );
          })}
        </Box>
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
                      {(rental.customerPhone || rental.customer?.phone) && (
                        <Typography variant="caption" sx={{ 
                          color: '#666',
                          fontSize: '0.7rem',
                          display: 'block',
                          mb: 0.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          📞 {rental.customerPhone || rental.customer?.phone}
                        </Typography>
                      )}
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
                        📅 {format(new Date(rental.startDate), 'd.M.yyyy HH:mm')}
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
                        📅 {format(new Date(rental.endDate), 'd.M.yyyy HH:mm')}
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
