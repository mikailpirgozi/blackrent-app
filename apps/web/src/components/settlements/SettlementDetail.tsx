import { UnifiedIcon } from '../ui/UnifiedIcon';
import { UnifiedCard } from '../ui/UnifiedCard';
import { UnifiedButton } from '../ui/UnifiedButton';
import { UnifiedChip } from '../ui/UnifiedChip';
import { UnifiedTypography } from '../ui/UnifiedTypography';
import { Badge } from '../ui/badge';
import { Spinner } from '../ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { cn } from '../../lib/utils';
import { format, parseISO } from 'date-fns';
import { sk } from 'date-fns/locale';
import { useState } from 'react';

import { useAuth } from '../../context/AuthContext';
import { getAPI_BASE_URL } from '../../services/api';
import type { Settlement } from '../../types';
import { logger } from '@/utils/smartLogger';

interface SettlementDetailProps {
  settlement: Settlement;
  onClose: () => void;
}

export default function SettlementDetail({
  settlement,
  onClose,
}: SettlementDetailProps) {
  const { state } = useAuth();
  const [pdfLoading, setPdfLoading] = useState(false);

  // Open HTML in new window
  const handleOpenHtmlPreview = () => {
    const htmlContent = generateSettlementHtml();
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      newWindow.document.write(htmlContent);
      newWindow.document.close();
    }
  };

  // Generate complete HTML document
  const generateSettlementHtml = () => {
    return `
<!DOCTYPE html>
<html lang="sk">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Vyúčtovanie - ${settlement.company || 'N/A'}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', sans-serif;
      background: #f8fafc;
      padding: 20px;
      color: #1e293b;
      line-height: 1.6;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      padding: 30px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }
    
    .header {
      text-align: center;
      border-bottom: 3px solid #1e293b;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    
    .header h1 {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 8px;
    }
    
    .header .company {
      font-size: 20px;
      font-weight: 600;
      color: #475569;
      margin-bottom: 8px;
    }
    
    .header .period {
      font-size: 14px;
      color: #64748b;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    
    .stat-card {
      padding: 20px;
      border-radius: 8px;
      color: white;
      text-align: center;
    }
    
    .stat-card.income {
      background: linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%);
    }
    
    .stat-card.expenses {
      background: linear-gradient(135deg, #ec4899 0%, #ef4444 100%);
    }
    
    .stat-card.commission {
      background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
    }
    
    .stat-card.profit {
      background: linear-gradient(135deg, #10b981 0%, #14b8a6 100%);
    }
    
    .stat-card.loss {
      background: linear-gradient(135deg, #ef4444 0%, #ec4899 100%);
    }
    
    .stat-label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      opacity: 0.9;
      margin-bottom: 8px;
      font-weight: 600;
    }
    
    .stat-value {
      font-size: 28px;
      font-weight: 700;
    }
    
    .section {
      margin-bottom: 30px;
    }
    
    .section-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 12px;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
      margin-bottom: 20px;
    }
    
    thead {
      background: #f1f5f9;
    }
    
    th {
      padding: 10px 12px;
      text-align: left;
      font-weight: 600;
      color: #475569;
      border: 1px solid #e2e8f0;
    }
    
    th.text-right {
      text-align: right;
    }
    
    th.text-center {
      text-align: center;
    }
    
    td {
      padding: 10px 12px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }
    
    td.text-right {
      text-align: right;
    }
    
    td.text-center {
      text-align: center;
    }
    
    tbody tr:nth-child(even) {
      background: #f8fafc;
    }
    
    tbody tr:hover {
      background: #f1f5f9;
    }
    
    .total-row {
      background: #e2e8f0 !important;
      font-weight: 700;
    }
    
    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    
    .payment-badge {
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
    }
    
    .payment-indicator {
      display: inline-block;
      width: 10px;
      height: 10px;
      border-radius: 50%;
      margin-right: 6px;
    }
    
    .vehicle-info {
      line-height: 1.4;
    }
    
    .vehicle-name {
      font-weight: 600;
      color: #1e293b;
    }
    
    .vehicle-plate {
      font-size: 11px;
      color: #64748b;
    }
    
    .rental-date {
      font-weight: 600;
      color: #1e293b;
    }
    
    .rental-days {
      font-size: 11px;
      color: #64748b;
    }
    
    .price-positive {
      color: #10b981;
      font-weight: 600;
    }
    
    .price-negative {
      color: #ef4444;
      font-weight: 600;
    }
    
    .price-commission {
      color: #f59e0b;
      font-weight: 600;
    }
    
    .footer {
      text-align: center;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 12px;
      color: #64748b;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
        padding: 20px;
      }
      
      .stats-grid {
        page-break-inside: avoid;
      }
      
      table {
        page-break-inside: auto;
      }
      
      tr {
        page-break-inside: avoid;
        page-break-after: auto;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>VYÚČTOVANIE</h1>
      <div class="company">${settlement.company || 'N/A'}</div>
      <div class="period">
        Obdobie: ${format(
          settlement.period.from instanceof Date
            ? settlement.period.from
            : parseISO(settlement.period.from),
          'dd.MM.yyyy',
          { locale: sk }
        )} - ${format(
          settlement.period.to instanceof Date
            ? settlement.period.to
            : parseISO(settlement.period.to),
          'dd.MM.yyyy',
          { locale: sk }
        )}
      </div>
    </div>

    <!-- Financial Summary - List Format -->
    <div class="section" style="background: #f8fafc; padding: 20px; border-radius: 8px;">
      <h2 style="font-size: 18px; font-weight: 700; margin-bottom: 20px; color: #1e293b;">💰 Finančný prehľad</h2>
      
      <div style="background: white; border-radius: 8px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
        <!-- Income -->
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Prijaté príjmy (VRP + Hotovosť + Banka)</div>
            <div style="font-size: 20px; font-weight: 700; color: #1e293b;">${settlement.totalIncome.toFixed(2)}€</div>
          </div>
        </div>
        
        <!-- Commission -->
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">Celkové provízie (zo všetkých prenájmov)</div>
            <div style="font-size: 20px; font-weight: 700; color: #f59e0b;">${settlement.totalCommission.toFixed(2)}€</div>
          </div>
        </div>
        
        <!-- To/From Owner -->
        <div style="display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e2e8f0;">
          <div>
            <div style="font-size: 12px; color: #64748b; margin-bottom: 4px;">
              ${(settlement.totalToOwner || 0) >= 0 ? 'Vyplatiť majiteľovi' : 'Dostať od majiteľa'}
            </div>
            <div style="font-size: 20px; font-weight: 700; color: ${(settlement.totalToOwner || 0) >= 0 ? '#ef4444' : '#10b981'};">
              ${(settlement.totalToOwner || 0) >= 0 ? '+' : ''}${(settlement.totalToOwner || 0).toFixed(2)}€
            </div>
          </div>
        </div>
        
        <!-- Profit -->
        <div style="display: flex; justify-content: space-between; padding: 16px; background: linear-gradient(to right, #d1fae5, #a7f3d0); border-radius: 8px; margin-top: 8px;">
          <div>
            <div style="font-size: 12px; color: #065f46; margin-bottom: 4px; font-weight: 600;">Môj čistý zisk</div>
            <div style="font-size: 24px; font-weight: 700; color: #059669;">${settlement.profit.toFixed(2)}€</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Payment Methods -->
    <div class="section">
      <div class="section-title">📊 Prehľad podľa spôsobov platby</div>
      <table>
        <thead>
          <tr>
            <th>Spôsob platby</th>
            <th class="text-center">Počet</th>
            <th class="text-right">Cena (€)</th>
            <th class="text-right">Provízie (€)</th>
            <th class="text-right">Po odpočítaní (€)</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(paymentMethodStats)
            .map(
              ([method, stats]) => `
            <tr>
              <td>
                <span class="payment-indicator" style="background: ${getPaymentMethodColor(method)}"></span>
                ${getPaymentMethodLabel(method)}
              </td>
              <td class="text-center">${stats.count}</td>
              <td class="text-right">${stats.totalPrice.toFixed(2)}</td>
              <td class="text-right price-commission">${stats.totalCommission.toFixed(2)}</td>
              <td class="text-right price-positive">${stats.netAmount.toFixed(2)}</td>
            </tr>
          `
            )
            .join('')}
          <tr class="total-row">
            <td>SPOLU</td>
            <td class="text-center">${settlement.rentals?.length || 0}</td>
            <td class="text-right">${settlement.totalIncome.toFixed(2)}</td>
            <td class="text-right">${settlement.totalCommission.toFixed(2)}</td>
            <td class="text-right">${(settlement.totalIncome - settlement.totalCommission).toFixed(2)}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Rentals -->
    <div class="section">
      <div class="section-title">🚗 Prenájmy (${settlement.rentals?.length || 0})</div>
      <table>
        <thead>
          <tr>
            <th>Vozidlo</th>
            <th>Zákazník</th>
            <th>Dátum prenájmu</th>
            <th class="text-center">Platba</th>
            <th class="text-right">Cena (€)</th>
            <th class="text-right">Provízia (€)</th>
          </tr>
        </thead>
        <tbody>
          ${settlement.rentals
            .map(
              rental => `
            <tr>
              <td>
                <div class="vehicle-info">
                  <div class="vehicle-name">${rental.vehicle?.brand || ''} ${rental.vehicle?.model || ''}</div>
                  <div class="vehicle-plate">${rental.vehicle?.licensePlate || ''}</div>
                </div>
              </td>
              <td>${rental.customerName || ''}</td>
              <td>
                <div class="rental-date">${format(new Date(rental.startDate), 'dd.MM.yyyy', { locale: sk })} - ${format(new Date(rental.endDate), 'dd.MM.yyyy', { locale: sk })}</div>
                <div class="rental-days">${Math.max(1, Math.ceil((new Date(rental.endDate).getTime() - new Date(rental.startDate).getTime()) / (1000 * 60 * 60 * 24)))} dní</div>
              </td>
              <td class="text-center">
                <span class="payment-badge" style="background: ${getPaymentMethodColor(rental.paymentMethod)}">${getPaymentMethodLabel(rental.paymentMethod)}</span>
              </td>
              <td class="text-right">${rental.totalPrice.toFixed(2)}</td>
              <td class="text-right price-commission">${rental.commission.toFixed(2)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    <!-- Expenses -->
    ${
      settlement.expenses && settlement.expenses.length > 0
        ? `
    <div class="section">
      <div class="section-title">💰 Náklady ${settlement.company || 'N/A'} (${settlement.expenses?.length || 0})</div>
      <table>
        <thead>
          <tr>
            <th>Popis</th>
            <th>Kategória</th>
            <th class="text-right">Suma (€)</th>
          </tr>
        </thead>
        <tbody>
          ${settlement.expenses
            .map(
              expense => `
            <tr>
              <td>${expense.description}</td>
              <td><span class="badge">${expense.category}</span></td>
              <td class="text-right price-negative">${expense.amount.toFixed(2)}</td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>
    `
        : ''
    }

    <!-- Footer -->
    <div class="footer">
      <div>ID vyúčtovania: ${settlement.id.slice(-8).toUpperCase()}</div>
      <div>Vytvorené: ${format(new Date(), 'dd.MM.yyyy HH:mm', { locale: sk })}</div>
    </div>
  </div>
</body>
</html>
    `.trim();
  };

  // Počítame podľa spôsobov platby
  const rentalsByPaymentMethod = {
    cash: settlement.rentals.filter(r => r.paymentMethod === 'cash'),
    bank_transfer: settlement.rentals.filter(
      r => r.paymentMethod === 'bank_transfer'
    ),
    vrp: settlement.rentals.filter(r => r.paymentMethod === 'vrp'),
    direct_to_owner: settlement.rentals.filter(
      r => r.paymentMethod === 'direct_to_owner'
    ),
  };

  // Výpočty pre každý spôsob platby
  const paymentMethodStats = {
    cash: {
      count: rentalsByPaymentMethod.cash.length,
      totalPrice: rentalsByPaymentMethod.cash.reduce(
        (sum, r) => sum + r.totalPrice,
        0
      ),
      totalCommission: rentalsByPaymentMethod.cash.reduce(
        (sum, r) => sum + r.commission,
        0
      ),
      netAmount: rentalsByPaymentMethod.cash.reduce(
        (sum, r) => sum + r.totalPrice - r.commission,
        0
      ),
    },
    bank_transfer: {
      count: rentalsByPaymentMethod.bank_transfer.length,
      totalPrice: rentalsByPaymentMethod.bank_transfer.reduce(
        (sum, r) => sum + r.totalPrice,
        0
      ),
      totalCommission: rentalsByPaymentMethod.bank_transfer.reduce(
        (sum, r) => sum + r.commission,
        0
      ),
      netAmount: rentalsByPaymentMethod.bank_transfer.reduce(
        (sum, r) => sum + r.totalPrice - r.commission,
        0
      ),
    },
    vrp: {
      count: rentalsByPaymentMethod.vrp.length,
      totalPrice: rentalsByPaymentMethod.vrp.reduce(
        (sum, r) => sum + r.totalPrice,
        0
      ),
      totalCommission: rentalsByPaymentMethod.vrp.reduce(
        (sum, r) => sum + r.commission,
        0
      ),
      netAmount: rentalsByPaymentMethod.vrp.reduce(
        (sum, r) => sum + r.totalPrice - r.commission,
        0
      ),
    },
    direct_to_owner: {
      count: rentalsByPaymentMethod.direct_to_owner.length,
      totalPrice: rentalsByPaymentMethod.direct_to_owner.reduce(
        (sum, r) => sum + r.totalPrice,
        0
      ),
      totalCommission: rentalsByPaymentMethod.direct_to_owner.reduce(
        (sum, r) => sum + r.commission,
        0
      ),
      netAmount: rentalsByPaymentMethod.direct_to_owner.reduce(
        (sum, r) => sum + r.totalPrice - r.commission,
        0
      ),
    },
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash':
        return 'Hotovosť';
      case 'bank_transfer':
        return 'FA (Faktúra)';
      case 'vrp':
        return 'VRP';
      case 'direct_to_owner':
        return 'Majiteľ';
      default:
        return method;
    }
  };

  const getPaymentMethodColor = (method: string) => {
    switch (method) {
      case 'cash':
        return '#4caf50';
      case 'bank_transfer':
        return '#2196f3';
      case 'vrp':
        return '#ff9800';
      case 'direct_to_owner':
        return '#9e9e9e';
      default:
        return '#666';
    }
  };

  // Server PDF generovanie (rovnaký ako protokoly)
  const handleDownloadPDF = async () => {
    if (!state.token) {
      alert('Nie ste prihlásený');
      return;
    }

    setPdfLoading(true);
    try {
      const response = await fetch(
        `${getAPI_BASE_URL()}/settlements/${settlement.id}/pdf`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${state.token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ error: 'Neznáma chyba' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      // Získaj PDF blob
      const blob = await response.blob();

      // Vytvor download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Názov súboru
      const filename = `vyuctovanie_${settlement.company?.replace(/[^a-zA-Z0-9]/g, '_')}_${settlement.id.slice(-8)}.pdf`;
      link.download = filename;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      logger.debug('✅ PDF úspešne stiahnuté');
    } catch (error) {
      console.error('❌ Chyba pri sťahovaní PDF:', error);
      alert(
        `Chyba pri sťahovaní PDF: ${error instanceof Error ? error.message : 'Neznáma chyba'}`
      );
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Modern Header */}
      <UnifiedCard
        variant="elevated"
        className="shadow-lg bg-gradient-to-br from-slate-800 to-slate-900"
      >
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <UnifiedIcon name="assessment" size={32} className="text-white" />
              <div>
                <UnifiedTypography
                  variant="h4"
                  className="font-bold mb-1 text-white"
                >
                  Detail vyúčtovania
                </UnifiedTypography>
                <div className="flex items-center gap-2">
                  <UnifiedIcon
                    name="building"
                    size={18}
                    className="text-gray-300"
                  />
                  <UnifiedTypography variant="h6" className="text-gray-200">
                    {settlement.company || 'N/A'}
                  </UnifiedTypography>
                </div>
              </div>
            </div>

            <UnifiedButton
              variant="outline"
              startIcon={<UnifiedIcon name="close" size={20} />}
              onClick={onClose}
              className="text-white border-white hover:bg-white/10 hover:border-white"
            >
              Zavrieť
            </UnifiedButton>
          </div>

          <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2 w-fit">
            <UnifiedIcon name="calendar" size={18} className="text-gray-300" />
            <UnifiedTypography variant="body1" className="text-white">
              Obdobie:{' '}
              {format(
                settlement.period.from instanceof Date
                  ? settlement.period.from
                  : parseISO(settlement.period.from),
                'dd.MM.yyyy',
                { locale: sk }
              )}{' '}
              -{' '}
              {format(
                settlement.period.to instanceof Date
                  ? settlement.period.to
                  : parseISO(settlement.period.to),
                'dd.MM.yyyy',
                { locale: sk }
              )}
            </UnifiedTypography>
          </div>
        </div>
      </UnifiedCard>

      {/* Financial Summary - List Format */}
      <UnifiedCard variant="default" className="shadow-md bg-white">
        <div className="p-6 space-y-4">
          <UnifiedTypography
            variant="h6"
            className="font-bold text-slate-800 mb-4"
          >
            Finančný prehľad
          </UnifiedTypography>

          {/* Income */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <UnifiedIcon
                  name="creditCard"
                  size={20}
                  className="text-blue-600"
                />
              </div>
              <div>
                <UnifiedTypography
                  variant="body2"
                  className="text-slate-600 text-sm"
                >
                  Prijaté príjmy (VRP + Hotovosť + Banka)
                </UnifiedTypography>
                <UnifiedTypography
                  variant="h6"
                  className="font-bold text-slate-900"
                >
                  {settlement.totalIncome.toFixed(2)}€
                </UnifiedTypography>
              </div>
            </div>
          </div>

          {/* Commission */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                <UnifiedIcon
                  name="receipt"
                  size={20}
                  className="text-orange-600"
                />
              </div>
              <div>
                <UnifiedTypography
                  variant="body2"
                  className="text-slate-600 text-sm"
                >
                  Celkové provízie (zo všetkých prenájmov)
                </UnifiedTypography>
                <UnifiedTypography
                  variant="h6"
                  className="font-bold text-orange-600"
                >
                  {settlement.totalCommission.toFixed(2)}€
                </UnifiedTypography>
              </div>
            </div>
          </div>

          {/* To/From Owner */}
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center',
                  (settlement.totalToOwner || 0) >= 0
                    ? 'bg-red-100'
                    : 'bg-green-100'
                )}
              >
                <UnifiedIcon
                  name={
                    (settlement.totalToOwner || 0) >= 0
                      ? 'arrowUp'
                      : 'arrowDown'
                  }
                  size={20}
                  className={
                    (settlement.totalToOwner || 0) >= 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  }
                />
              </div>
              <div>
                <UnifiedTypography
                  variant="body2"
                  className="text-slate-600 text-sm"
                >
                  {(settlement.totalToOwner || 0) >= 0
                    ? 'Vyplatiť majiteľovi'
                    : 'Dostať od majiteľa'}
                </UnifiedTypography>
                <UnifiedTypography
                  variant="h6"
                  className={cn(
                    'font-bold',
                    (settlement.totalToOwner || 0) >= 0
                      ? 'text-red-600'
                      : 'text-green-600'
                  )}
                >
                  {(settlement.totalToOwner || 0) >= 0 ? '+' : ''}
                  {(settlement.totalToOwner || 0).toFixed(2)}€
                </UnifiedTypography>
              </div>
            </div>
          </div>

          {/* Profit */}
          <div className="flex items-center justify-between py-3 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg px-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-between">
                <UnifiedIcon
                  name="trendingUp"
                  size={20}
                  className="text-emerald-600"
                />
              </div>
              <div>
                <UnifiedTypography
                  variant="body2"
                  className="text-slate-600 text-sm font-semibold"
                >
                  Môj čistý zisk
                </UnifiedTypography>
                <UnifiedTypography
                  variant="h5"
                  className="font-bold text-emerald-600"
                >
                  {settlement.profit.toFixed(2)}€
                </UnifiedTypography>
              </div>
            </div>
          </div>
        </div>
      </UnifiedCard>

      {/* Payment Methods Overview - Compact */}
      <UnifiedCard variant="default" className="shadow-md bg-white">
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <UnifiedIcon name="payment" size={20} className="text-blue-600" />
            <UnifiedTypography
              variant="h6"
              className="font-semibold text-slate-800"
            >
              Prehľad podľa spôsobov platby
            </UnifiedTypography>
          </div>

          <div className="overflow-hidden rounded-lg border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead className="text-slate-700 font-semibold">
                    Spôsob platby
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold text-center">
                    Počet
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold text-right">
                    Cena (€)
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold text-right">
                    Provízie (€)
                  </TableHead>
                  <TableHead className="text-slate-700 font-semibold text-right">
                    Po odpočítaní (€)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(paymentMethodStats).map(([method, stats]) => (
                  <TableRow key={method} className="hover:bg-blue-50/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: getPaymentMethodColor(method),
                          }}
                        />
                        <UnifiedTypography
                          variant="body2"
                          className="font-semibold text-slate-800"
                        >
                          {getPaymentMethodLabel(method)}
                        </UnifiedTypography>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 font-semibold"
                      >
                        {stats.count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-slate-800">
                      {stats.totalPrice.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-orange-600">
                      {stats.totalCommission.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      {stats.netAmount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-slate-100 border-t-2 border-slate-300">
                  <TableCell className="font-bold text-slate-900">
                    SPOLU
                  </TableCell>
                  <TableCell className="text-center font-bold text-slate-900">
                    {settlement.rentals?.length || 0}
                  </TableCell>
                  <TableCell className="text-right font-bold text-slate-900">
                    {settlement.totalIncome.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-orange-700">
                    {settlement.totalCommission.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-700">
                    {(
                      settlement.totalIncome - settlement.totalCommission
                    ).toFixed(2)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </UnifiedCard>

      {/* Detailed Lists - Compact Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <UnifiedCard variant="default" className="shadow-md bg-white">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <UnifiedIcon name="car" size={20} className="text-green-600" />
                <UnifiedTypography
                  variant="h6"
                  className="font-semibold text-slate-800"
                >
                  Prenájmy ({settlement.rentals?.length || 0})
                </UnifiedTypography>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-green-50 z-10">
                    <TableRow>
                      <TableHead className="text-slate-700 font-semibold">
                        Vozidlo
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        Zákazník
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        Dátum prenájmu
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        Platba
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold text-right">
                        Cena (€)
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold text-right">
                        Provízia (€)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlement.rentals.map((rental, index) => (
                      <TableRow
                        key={rental.id}
                        className={cn(
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                          'hover:bg-green-50/50'
                        )}
                      >
                        <TableCell>
                          <UnifiedTypography
                            variant="body2"
                            className="font-semibold text-slate-800"
                          >
                            {rental.vehicle?.brand} {rental.vehicle?.model}
                          </UnifiedTypography>
                          <UnifiedTypography
                            variant="caption"
                            className="text-slate-500"
                          >
                            {rental.vehicle?.licensePlate}
                          </UnifiedTypography>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <UnifiedIcon
                              name="person"
                              size={14}
                              className="text-slate-400"
                            />
                            <UnifiedTypography
                              variant="body2"
                              className="text-slate-700"
                            >
                              {rental.customerName}
                            </UnifiedTypography>
                          </div>
                        </TableCell>
                        <TableCell>
                          <UnifiedTypography
                            variant="body2"
                            className="font-semibold text-slate-800"
                          >
                            {format(new Date(rental.startDate), 'dd.MM.yyyy', {
                              locale: sk,
                            })}{' '}
                            -{' '}
                            {format(new Date(rental.endDate), 'dd.MM.yyyy', {
                              locale: sk,
                            })}
                          </UnifiedTypography>
                          <UnifiedTypography
                            variant="caption"
                            className="text-slate-500"
                          >
                            {Math.max(
                              1,
                              Math.ceil(
                                (new Date(rental.endDate).getTime() -
                                  new Date(rental.startDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              )
                            )}{' '}
                            dní
                          </UnifiedTypography>
                        </TableCell>
                        <TableCell>
                          <UnifiedChip
                            label={getPaymentMethodLabel(rental.paymentMethod)}
                            className="h-7 px-2 text-xs font-semibold text-white"
                            style={{
                              backgroundColor: getPaymentMethodColor(
                                rental.paymentMethod
                              ),
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold text-slate-800">
                          {rental.totalPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-semibold text-orange-600">
                          {rental.commission.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </UnifiedCard>
        </div>

        <div>
          <UnifiedCard variant="default" className="shadow-md bg-white">
            <div className="p-4">
              <div className="flex items-center gap-2 mb-4">
                <UnifiedIcon name="euro" size={20} className="text-red-600" />
                <UnifiedTypography
                  variant="h6"
                  className="font-semibold text-slate-800"
                >
                  Náklady {settlement.company || 'N/A'} (
                  {settlement.expenses?.length || 0})
                </UnifiedTypography>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-200 max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-red-50 z-10">
                    <TableRow>
                      <TableHead className="text-slate-700 font-semibold">
                        Popis
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        Kategória
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold text-right">
                        Suma (€)
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlement.expenses.map((expense, index) => (
                      <TableRow
                        key={expense.id}
                        className={cn(
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50',
                          'hover:bg-red-50/50'
                        )}
                      >
                        <TableCell>
                          <UnifiedTypography
                            variant="body2"
                            className="font-semibold text-slate-800"
                          >
                            {expense.description}
                          </UnifiedTypography>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-800 font-semibold"
                          >
                            {expense.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-red-600">
                          {expense.amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </UnifiedCard>
        </div>
      </div>

      {/* Action Buttons - Compact */}
      <UnifiedCard variant="default" className="shadow-md bg-white">
        <div className="p-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <UnifiedButton
                variant="default"
                className="bg-gradient-to-br from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 px-6 py-2 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 text-white"
                startIcon={<UnifiedIcon name="eye" size={18} />}
                onClick={handleOpenHtmlPreview}
              >
                Zobraziť v HTML
              </UnifiedButton>

              <UnifiedButton
                variant="default"
                className="bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-6 py-2 font-semibold rounded-lg shadow-md hover:shadow-lg transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white"
                startIcon={
                  pdfLoading ? (
                    <Spinner size={18} />
                  ) : (
                    <UnifiedIcon name="fileText" size={18} />
                  )
                }
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
              >
                {pdfLoading ? 'Generujem...' : 'Stiahnuť PDF'}
              </UnifiedButton>
            </div>

            <UnifiedTypography
              variant="body2"
              className="italic text-center sm:text-right text-slate-500"
            >
              ID: {settlement.id.slice(-8).toUpperCase()}
            </UnifiedTypography>
          </div>
        </div>
      </UnifiedCard>
    </div>
  );
}
