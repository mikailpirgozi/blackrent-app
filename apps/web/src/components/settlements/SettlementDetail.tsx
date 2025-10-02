import { UnifiedIcon } from '../ui/UnifiedIcon';
import { UnifiedCard, StatisticsCard } from '../ui/UnifiedCard';
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

      console.log('✅ PDF úspešne stiahnuté');
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
    <div >
      {/* Modern Header */}
      <UnifiedCard
        variant="elevated"
        className="mb-6 shadow-lg"
      >
        <div >
          <div >
            <div >
              <UnifiedIcon name="assessment" size={32} className="text-white" />
              <div>
                <UnifiedTypography
                  variant="h4"
                  className="font-bold mb-2 text-white"
                >
                  Detail vyúčtovania
                </UnifiedTypography>
                <div >
                  <UnifiedIcon name="building" size={20}  />
                  <UnifiedTypography
                    variant="h6"
                    className="text-white"
                  >
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

          <div >
            <UnifiedIcon name="calendar" size={18}  />
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

      {/* Financial Summary Cards */}
      <div >
        <StatisticsCard
          className="bg-gradient-to-br from-blue-400 to-cyan-400 text-white shadow-lg h-full"
        >
          <div className="flex items-center justify-between">
            <div>
              <UnifiedTypography
                variant="h6"
                className="font-semibold mb-2 text-white"
              >
                CELKOVÉ PRÍJMY
              </UnifiedTypography>
              <UnifiedTypography
                variant="h4"
                className="font-bold text-white"
              >
                {settlement.totalIncome.toFixed(2)}€
              </UnifiedTypography>
            </div>
            <UnifiedIcon name="creditCard" size={40} className="opacity-80" />
          </div>
        </StatisticsCard>

        <StatisticsCard
          className="bg-gradient-to-br from-pink-400 to-red-500 text-white shadow-lg h-full"
        >
          <div className="flex items-center justify-between">
            <div>
              <UnifiedTypography
                variant="h6"
                className="font-semibold mb-2 text-white"
              >
                CELKOVÉ NÁKLADY
              </UnifiedTypography>
              <UnifiedTypography
                variant="h4"
                className="font-bold text-white"
              >
                {settlement.totalExpenses.toFixed(2)}€
              </UnifiedTypography>
            </div>
            <UnifiedIcon name="euro" size={40} className="opacity-80" />
          </div>
        </StatisticsCard>

        <StatisticsCard
          className="bg-gradient-to-br from-yellow-300 to-orange-400 text-white shadow-lg h-full"
        >
          <div className="flex items-center justify-between">
            <div>
              <UnifiedTypography
                variant="h6"
                className="font-semibold mb-2 text-white"
              >
                CELKOVÉ PROVÍZIE
              </UnifiedTypography>
              <UnifiedTypography
                variant="h4"
                className="font-bold text-white"
              >
                {settlement.totalCommission.toFixed(2)}€
              </UnifiedTypography>
            </div>
            <UnifiedIcon name="receipt" size={40} className="opacity-80" />
          </div>
        </StatisticsCard>

        <StatisticsCard
          className={cn(
            "text-white shadow-lg h-full",
            settlement.profit >= 0
              ? "bg-gradient-to-br from-teal-300 to-pink-300"
              : "bg-gradient-to-br from-red-300 to-pink-300"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <UnifiedTypography
                variant="h6"
                className="font-semibold mb-2 text-white"
              >
                {settlement.profit >= 0 ? 'CELKOVÝ ZISK' : 'CELKOVÁ STRATA'}
              </UnifiedTypography>
              <UnifiedTypography
                variant="h4"
                className="font-bold text-white"
              >
                {settlement.profit.toFixed(2)}€
              </UnifiedTypography>
            </div>
            {settlement.profit >= 0 ? (
              <UnifiedIcon name="trendingUp" size={40}  />
            ) : (
              <UnifiedIcon name="trendingDown" size={40} className="opacity-80" />
            )}
          </div>
        </StatisticsCard>
      </div>

      {/* Payment Methods Overview */}
      <UnifiedCard
        variant="default"
        className="mb-6 shadow-md"
      >
        <div >
          <div >
            <UnifiedIcon name="payment" size={24}  />
            <UnifiedTypography
              variant="h6"
              className="font-semibold text-blue-600"
            >
              Prehľad podľa spôsobov platby
            </UnifiedTypography>
          </div>

          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow >
                  <TableHead >Spôsob platby</TableHead>
                  <TableHead >Počet prenájmov</TableHead>
                  <TableHead >Celková cena (€)</TableHead>
                  <TableHead >Provízie (€)</TableHead>
                  <TableHead className="text-right font-semibold text-blue-600">
                    Po odpočítaní provízií (€)
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(paymentMethodStats).map(([method, stats]) => (
                  <TableRow
                    key={method}
                    className="hover:bg-blue-50/50"
                  >
                    <TableCell>
                      <div >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: getPaymentMethodColor(method) }}
                        />
                        <UnifiedTypography
                          variant="body2"
                          className="font-semibold"
                        >
                          {getPaymentMethodLabel(method)}
                        </UnifiedTypography>
                      </div>
                    </TableCell>
                    <TableCell >
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800"
                      >
                        {stats.count}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
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
                <TableRow >
                  <TableCell >SPOLU</TableCell>
                  <TableCell className="text-center font-bold">
                    {settlement.rentals?.length || 0}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {settlement.totalIncome.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {settlement.totalCommission.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-bold">
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

      {/* Detailed Lists */}
      <div >
        <div >
          <UnifiedCard
            variant="default"
            className="shadow-md h-fit"
          >
            <div >
              <div >
                <UnifiedIcon name="car" size={24}  />
                <UnifiedTypography
                  variant="h6"
                  className="font-semibold text-green-600"
                >
                  Prenájmy ({settlement.rentals?.length || 0})
                </UnifiedTypography>
              </div>

              <div className="overflow-hidden rounded-lg border max-h-[600px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-green-50 z-10">
                    <TableRow>
                      <TableHead >Vozidlo</TableHead>
                      <TableHead >Zákazník</TableHead>
                      <TableHead >Dátum prenájmu</TableHead>
                      <TableHead >Platba</TableHead>
                      <TableHead >Cena (€)</TableHead>
                      <TableHead className="text-right font-semibold">Provízia (€)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlement.rentals.map((rental, index) => (
                      <TableRow
                        key={rental.id}
                        className={cn(
                          index % 2 === 0 ? "bg-transparent" : "bg-gray-50/50",
                          "hover:bg-green-50/50"
                        )}
                      >
                        <TableCell>
                          <UnifiedTypography
                            variant="body2"
                            className="font-semibold"
                          >
                            {rental.vehicle?.brand} {rental.vehicle?.model}
                          </UnifiedTypography>
                          <UnifiedTypography
                            variant="caption"
                            color="textSecondary"
                          >
                            {rental.vehicle?.licensePlate}
                          </UnifiedTypography>
                        </TableCell>
                        <TableCell>
                          <div >
                            <UnifiedIcon
                              name="person"
                              size={16}
                              className="text-muted-foreground"
                            />
                            <UnifiedTypography variant="body2">
                              {rental.customerName}
                            </UnifiedTypography>
                          </div>
                        </TableCell>
                        <TableCell>
                          <UnifiedTypography
                            variant="body2"
                            className="font-semibold"
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
                            color="textSecondary"
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
                            className="h-8 px-3 text-sm font-semibold text-white" 
                            style={{
                              backgroundColor: getPaymentMethodColor(
                                rental.paymentMethod
                              ),
                            }}
                          />
                        </TableCell>
                        <TableCell className="text-right font-semibold">
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

        <div >
          <UnifiedCard
            variant="default"
            className="shadow-md h-fit"
          >
            <div >
              <div >
                <UnifiedIcon name="euro" size={24}  />
                <UnifiedTypography
                  variant="h6"
                  className="font-semibold text-red-600"
                >
                  Náklady {settlement.company || 'N/A'} (
                  {settlement.expenses?.length || 0})
                </UnifiedTypography>
              </div>

              <div className="overflow-hidden rounded-lg border max-h-[400px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-red-50 z-10">
                    <TableRow>
                      <TableHead >Popis</TableHead>
                      <TableHead >Kategória</TableHead>
                      <TableHead className="text-right font-semibold">Suma (€)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {settlement.expenses.map((expense, index) => (
                      <TableRow
                        key={expense.id}
                        className={cn(
                          index % 2 === 0 ? "bg-transparent" : "bg-gray-50/50",
                          "hover:bg-red-50/50"
                        )}
                      >
                        <TableCell>
                          <UnifiedTypography
                            variant="body2"
                            className="font-semibold"
                          >
                            {expense.description}
                          </UnifiedTypography>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-gray-100 text-gray-800"
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

      {/* Action Buttons */}
      <UnifiedCard
        variant="default"
        className="shadow-md"
      >
        <div >
          <div >
            <UnifiedButton
              variant="default"
              className="bg-gradient-to-br from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 px-8 py-3 text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed text-white"
              startIcon={
                pdfLoading ? (
                  <Spinner size={20} />
                ) : (
                  <UnifiedIcon name="fileText" size={20} />
                )
              }
              onClick={handleDownloadPDF}
              disabled={pdfLoading}
            >
              {pdfLoading ? 'Generujem PDF...' : 'Stiahnuť PDF'}
            </UnifiedButton>

            <UnifiedTypography
              variant="body2"
              color="textSecondary"
              className="italic text-center sm:text-right"
            >
              ID vyúčtovania: {settlement.id.slice(-8).toUpperCase()}
            </UnifiedTypography>
          </div>
        </div>
      </UnifiedCard>
    </div>
  );
}
