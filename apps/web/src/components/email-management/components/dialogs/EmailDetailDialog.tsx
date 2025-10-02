/**
 * Email Detail Dialog Component
 * Extrahované z pôvodného EmailManagementDashboard.tsx
 */

// Lucide icons (replacing MUI icons)
import { 
  Mail as EmailIcon, 
  Calendar, 
  MapPin, 
  Car, 
  User, 
  Phone, 
  CreditCard,
  Euro,
  Clock,
  FileText
} from 'lucide-react';

// shadcn/ui components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Typography } from '@/components/ui/typography';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMediaQuery } from '@/hooks/use-media-query';

import type { EmailDetail } from '../../types/email-types';
import { StatusChip } from '../StatusChip';

interface EmailDetailDialogProps {
  open: boolean;
  email: EmailDetail | null;
  onClose: () => void;
}

// Helper funkcie pre formátovanie dát
// const formatCurrency = (amount: number | string): string => {
//   const num = typeof amount === 'string' ? parseFloat(amount) : amount;
//   if (isNaN(num)) return '0 €';
//   return `${num.toLocaleString('sk-SK')} €`;
// };

// const formatDate = (dateString: string): string => {
//   if (!dateString || dateString.trim() === '') return 'N/A';
  
//   try {
//     // Pokus o rôzne formáty dátumu
//     let date: Date;
    
//     // Ak je to v formáte DD.MM.YYYY
//     if (dateString.includes('.')) {
//       const parts = dateString.split('.');
//       if (parts.length === 3) {
//         date = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
//       } else {
//         date = new Date(dateString);
//       }
//     } else {
//       date = new Date(dateString);
//     }
    
//     if (isNaN(date.getTime())) {
//       return dateString; // Vráť pôvodný string ak sa nepodarilo parsovať
//     }
    
//     // Použiť toLocaleString pre správne zobrazenie dátumu a času
//     return date.toLocaleString('sk-SK', {
//       day: '2-digit',
//       month: '2-digit', 
//       year: 'numeric',
//       hour: '2-digit',
//       minute: '2-digit',
//       hour12: false
//     });
//   } catch {
//     return dateString;
//   }
// };

const formatPhoneNumber = (phone: string): string => {
  // Formátovanie slovenského telefónneho čísla
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('421')) {
    return `+421 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
  }
  return phone;
};

const renderParsedData = (parsedData: Record<string, unknown>): React.ReactNode => {
  if (!parsedData || typeof parsedData !== 'object') return null;

  // Type-safe helper pre získanie string hodnoty
  const getStringValue = (value: unknown): string => {
    if (value === null || value === undefined) return '';
    const str = String(value).trim();
    return str === '' ? '' : str;
  };

  // Helper pre kontrolu či má hodnota obsah
  const hasValue = (value: unknown): boolean => {
    if (value === null || value === undefined) return false;
    const str = String(value).trim();
    return str !== '' && str !== 'null' && str !== 'undefined';
  };

  // Type guard pre array
  const isArray = (value: unknown): value is unknown[] => {
    return Array.isArray(value);
  };

  // Type-safe helper pre získanie number hodnoty
  const getNumberValue = (value: unknown): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Vylepšená funkcia pre formátovanie dátumu objednávky (bez času)
  const formatOrderDate = (dateString: string): string => {
    if (!dateString || dateString.trim() === '') return 'N/A';
    
    try {
      let date: Date;
      
      if (dateString?.includes('.')) {
        const parts = dateString.split('.');
        if (parts.length === 3) {
          date = new Date(parseInt(parts[2] || '0'), parseInt(parts[1] || '1') - 1, parseInt(parts[0] || '1'));
        } else {
          date = new Date(dateString);
        }
      } else {
        date = new Date(dateString || '');
      }
      
      if (isNaN(date.getTime())) {
        return dateString;
      }
      
      // Len dátum bez času
      return date.toLocaleDateString('sk-SK', {
        day: '2-digit',
        month: '2-digit', 
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      {/* Zjednodušená štruktúra - všetko v jednom Card */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Ľavý stĺpec - Základné informácie */}
            <div className="space-y-4">
              
              {/* Objednávka */}
              {(hasValue(parsedData.orderNumber) || hasValue(parsedData.orderDate)) && (
                <div className="space-y-2">
                  <Typography variant="h6" className="flex items-center gap-2 text-base font-semibold">
                    <FileText className="h-4 w-4" />
                    Objednávka
                  </Typography>
                  <div className="space-y-2 pl-6">
                    {hasValue(parsedData.orderNumber) && (
                      <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-muted-foreground">Číslo:</Typography>
                        <Badge variant="outline" className="font-mono text-xs">
                          {getStringValue(parsedData.orderNumber)}
                        </Badge>
                      </div>
                    )}
                    {hasValue(parsedData.orderDate) && (
                      <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-muted-foreground">Dátum:</Typography>
                        <Typography variant="body2" className="font-medium">
                          {formatOrderDate(getStringValue(parsedData.orderDate))}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Vozidlo */}
              {(hasValue(parsedData.vehicleName) || hasValue(parsedData.vehicleCode) || getNumberValue(parsedData.vehiclePrice) > 0) && (
                <div className="space-y-2">
                  <Typography variant="h6" className="flex items-center gap-2 text-base font-semibold">
                    <Car className="h-4 w-4" />
                    Vozidlo
                  </Typography>
                  <div className="space-y-2 pl-6">
                    {hasValue(parsedData.vehicleName) && (
                      <div>
                        <Typography variant="body2" className="text-muted-foreground mb-1">Model:</Typography>
                        <Typography variant="body2" className="font-medium">
                          {getStringValue(parsedData.vehicleName)}
                        </Typography>
                      </div>
                    )}
                    {hasValue(parsedData.vehicleCode) && (
                      <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-muted-foreground">Kód:</Typography>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {getStringValue(parsedData.vehicleCode)}
                        </Badge>
                      </div>
                    )}
                    {getNumberValue(parsedData.vehiclePrice) > 0 && (
                      <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-muted-foreground">Cena/deň:</Typography>
                        <Typography variant="body2" className="font-medium flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {getNumberValue(parsedData.vehiclePrice).toLocaleString('sk-SK')}
                        </Typography>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Rezervácia */}
              <div className="space-y-2">
                <Typography variant="h6" className="flex items-center gap-2 text-base font-semibold">
                  <Calendar className="h-4 w-4" />
                  Rezervácia
                </Typography>
                <div className="space-y-2 pl-6">
                  {hasValue(parsedData.reservationTime) && (
                    <div>
                      <Typography variant="body2" className="text-muted-foreground mb-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Čas:
                      </Typography>
                      <div className="bg-muted/50 p-2 rounded text-xs">
                        <Typography variant="body2" className="whitespace-pre-line font-medium">
                          {getStringValue(parsedData.reservationTime)}
                        </Typography>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Typography variant="body2" className="text-muted-foreground text-xs">Prevzatie:</Typography>
                      <Typography variant="body2" className="font-medium text-sm">
                        {hasValue(parsedData.pickupPlace) 
                          ? getStringValue(parsedData.pickupPlace)
                          : <span className="text-muted-foreground italic">N/A</span>
                        }
                      </Typography>
                    </div>
                    <div>
                      <Typography variant="body2" className="text-muted-foreground text-xs">Vrátenie:</Typography>
                      <Typography variant="body2" className="font-medium text-sm">
                        {hasValue(parsedData.returnPlace) 
                          ? getStringValue(parsedData.returnPlace)
                          : <span className="text-muted-foreground italic">N/A</span>
                        }
                      </Typography>
                    </div>
                  </div>
                  {hasValue(parsedData.dailyKilometers) && (
                    <div className="flex justify-between items-center">
                      <Typography variant="body2" className="text-muted-foreground">Denné km:</Typography>
                      <Typography variant="body2" className="font-medium">
                        {getStringValue(parsedData.dailyKilometers)} km
                      </Typography>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Pravý stĺpec - Zákazník a Financie */}
            <div className="space-y-4">
              
              {/* Zákazník */}
              {(hasValue(parsedData.customerName) || hasValue(parsedData.customerEmail) || hasValue(parsedData.customerPhone) || hasValue(parsedData.customerAddress)) && (
                <div className="space-y-2">
                  <Typography variant="h6" className="flex items-center gap-2 text-base font-semibold">
                    <User className="h-4 w-4" />
                    Zákazník
                  </Typography>
                  <div className="space-y-2 pl-6">
                    {hasValue(parsedData.customerName) && (
                      <div>
                        <Typography variant="body2" className="text-muted-foreground mb-1">Meno/Spoločnosť:</Typography>
                        <Typography variant="body2" className="font-medium">
                          {getStringValue(parsedData.customerName)}
                        </Typography>
                      </div>
                    )}
                    {hasValue(parsedData.customerEmail) && (
                      <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-muted-foreground">Email:</Typography>
                        <Typography variant="body2" className="font-medium text-blue-600 text-xs">
                          {getStringValue(parsedData.customerEmail)}
                        </Typography>
                      </div>
                    )}
                    {hasValue(parsedData.customerPhone) && (
                      <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-muted-foreground flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          Telefón:
                        </Typography>
                        <Typography variant="body2" className="font-medium">
                          {formatPhoneNumber(getStringValue(parsedData.customerPhone))}
                        </Typography>
                      </div>
                    )}
                    {hasValue(parsedData.customerAddress) && (
                      <div>
                        <Typography variant="body2" className="text-muted-foreground mb-1 flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          Adresa:
                        </Typography>
                        <div className="bg-muted/30 p-2 rounded-md">
                          <Typography variant="body2" className="whitespace-pre-line text-xs">
                            {getStringValue(parsedData.customerAddress)}
                          </Typography>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Financie */}
              {(getNumberValue(parsedData.deposit) > 0 || getNumberValue(parsedData.vehicleTotalAmount) > 0 || hasValue(parsedData.paymentMethod)) && (
                <div className="space-y-2">
                  <Typography variant="h6" className="flex items-center gap-2 text-base font-semibold">
                    <CreditCard className="h-4 w-4" />
                    Financie
                  </Typography>
                  <div className="space-y-2 pl-6">
                    {getNumberValue(parsedData.deposit) > 0 && (
                      <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-muted-foreground">Záloha:</Typography>
                        <Typography variant="body2" className="font-medium flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {getNumberValue(parsedData.deposit).toLocaleString('sk-SK')}
                        </Typography>
                      </div>
                    )}
                    {getNumberValue(parsedData.vehicleTotalAmount) > 0 && (
                      <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-muted-foreground">Celková suma:</Typography>
                        <Typography variant="body2" className="font-medium flex items-center gap-1">
                          <Euro className="h-3 w-3" />
                          {getNumberValue(parsedData.vehicleTotalAmount).toLocaleString('sk-SK')}
                        </Typography>
                      </div>
                    )}
                    {hasValue(parsedData.paymentMethod) && (
                      <div className="flex justify-between items-center">
                        <Typography variant="body2" className="text-muted-foreground">Platba:</Typography>
                        <Badge variant="outline" className="text-xs">
                          {getStringValue(parsedData.paymentMethod)}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Dodatočné informácie - len ak existujú */}
          {(() => {
            const additionalServices = parsedData.additionalServices as unknown[] | undefined;
            const hasAdditionalServices = additionalServices && isArray(additionalServices) && additionalServices.length > 0;
            const hasAdditionalInfo = hasValue(parsedData.returnConditions) || hasValue(parsedData.insuranceInfo) || hasValue(parsedData.notes) || hasAdditionalServices;
            
            return hasAdditionalInfo && (
              <div className="mt-6 pt-4 border-t">
                <Typography variant="h6" className="flex items-center gap-2 text-base font-semibold mb-3">
                  <FileText className="h-4 w-4" />
                  Dodatočné informácie
                </Typography>
                <div className="space-y-3">
                  {hasValue(parsedData.returnConditions) && (
                    <div>
                      <Typography variant="body2" className="text-muted-foreground mb-1">Podmienky vrátenia:</Typography>
                      <div className="bg-muted/30 p-2 rounded-md">
                        <Typography variant="body2" className="whitespace-pre-line text-xs">
                          {getStringValue(parsedData.returnConditions)}
                        </Typography>
                      </div>
                    </div>
                  )}
                  {hasValue(parsedData.insuranceInfo) && (
                    <div>
                      <Typography variant="body2" className="text-muted-foreground mb-1">Poistné informácie:</Typography>
                      <div className="bg-muted/30 p-2 rounded-md">
                        <Typography variant="body2" className="whitespace-pre-line text-xs">
                          {getStringValue(parsedData.insuranceInfo)}
                        </Typography>
                      </div>
                    </div>
                  )}
                  {hasValue(parsedData.notes) && (
                    <div>
                      <Typography variant="body2" className="text-muted-foreground mb-1">Poznámky:</Typography>
                      <div className="bg-muted/30 p-2 rounded-md">
                        <Typography variant="body2" className="whitespace-pre-line text-xs">
                          {getStringValue(parsedData.notes)}
                        </Typography>
                      </div>
                    </div>
                  )}
                  {hasAdditionalServices && isArray(additionalServices) && (
                    <div>
                      <Typography variant="body2" className="text-muted-foreground mb-1">Dodatočné služby:</Typography>
                      <div className="flex flex-wrap gap-2">
                        {additionalServices.map((service: unknown, index: number) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {String(service)}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>
    </div>
  );
};

export const EmailDetailDialog: React.FC<EmailDetailDialogProps> = ({
  open,
  email,
  onClose,
}) => {
  const isExtraSmall = useMediaQuery('(max-width: 400px)');
  const isSmallMobile = useMediaQuery('(max-width: 640px)');
  const isTablet = useMediaQuery('(min-width: 640px) and (max-width: 768px)');

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className={`${isSmallMobile ? 'h-screen max-h-screen rounded-none' : 'max-w-4xl max-h-[90vh]'} ${isTablet ? 'mx-4' : 'mx-8'} flex flex-col`}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className={`${isExtraSmall ? 'text-lg p-4' : ''}`}>
            <div className="flex items-center gap-2">
              <EmailIcon className={isExtraSmall ? 'h-5 w-5' : 'h-6 w-6'} />
              <Typography variant={isExtraSmall ? 'h6' : 'h5'} className="inline">
                {isExtraSmall ? 'Detail' : 'Detail Emailu'}
              </Typography>
            </div>
          </DialogTitle>
          <DialogDescription>
            Zobrazenie detailov emailu vrátane obsahu a histórie akcií
          </DialogDescription>
        </DialogHeader>
        
        <div className={`${isExtraSmall ? 'p-4' : 'p-6'} space-y-6 flex-1 overflow-y-auto`}>
          {email && (
            <>
              {/* Základné informácie o emaile */}
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    <div>
                      <Typography
                        variant={isExtraSmall ? 'subtitle1' : 'h6'}
                        className={`mb-2 ${isExtraSmall ? 'text-base' : ''} break-words`}
                      >
                        {email.email.subject}
                      </Typography>
                      <Typography
                        variant="body2"
                        className={`text-muted-foreground ${isExtraSmall ? 'text-sm' : ''} break-words`}
                      >
                        Od: {email.email.sender} |{' '}
                        {new Date(email.email.received_at).toLocaleString('sk')}
                      </Typography>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <StatusChip
                        status={email.email.status}
                        {...(email.email.action_taken && { actionTaken: email.email.action_taken })}
                      />
                      {email.email.order_number && (
                        <Badge variant="outline" className="font-mono">
                          📋 {email.email.order_number}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Parsované údaje - hlavná časť */}
              {email.email.parsed_data && (
                <div>
                  <Typography variant="h6" className="mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Detaily objednávky
                  </Typography>
                  {renderParsedData(email.email.parsed_data)}
                </div>
              )}

              {/* História akcií */}
              {email.actions && email.actions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">História akcií</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {email.actions.map(action => (
                        <div
                          key={action.id}
                          className="flex justify-between items-start py-2 border-b border-border last:border-b-0"
                        >
                          <div className="flex-1">
                            <Typography variant="body2" className="font-medium">
                              {action.action}
                            </Typography>
                            {action.notes && (
                              <Typography variant="caption" className="text-muted-foreground">
                                {action.notes}
                              </Typography>
                            )}
                            <Typography variant="caption" className="text-muted-foreground block">
                              {action.username}
                            </Typography>
                          </div>
                          <Typography variant="caption" className="text-muted-foreground">
                            {new Date(action.created_at).toLocaleString('sk')}
                          </Typography>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Surový obsah emailu - len ak nie sú parsované dáta */}
              {email.email.email_content && !email.email.parsed_data && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Obsah emailu</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 max-h-64 overflow-auto border rounded-md bg-muted/50">
                      <Typography variant="body2" className="whitespace-pre-wrap text-sm">
                        {email.email.email_content.length > 2000 
                          ? email.email.email_content.substring(0, 2000) + '...'
                          : email.email.email_content
                        }
                      </Typography>
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>
        
        <DialogFooter className="flex-shrink-0">
          <Button onClick={onClose}>Zatvoriť</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};