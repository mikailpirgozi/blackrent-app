/**
 * ===================================================================
 * LEASING DETAIL - Detail drawer/sheet pre leasing
 * ===================================================================
 */

import { useState } from 'react';
import { Edit, Trash2, AlertCircle } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useLeasing,
  useDeleteLeasing,
} from '@/lib/react-query/hooks/useLeasings';
import { PaymentScheduleTable } from './PaymentScheduleTable';
import { EarlyRepaymentCard } from './EarlyRepaymentCard';
import { LeasingDocuments } from './LeasingDocuments';
import { LeasingForm } from './LeasingForm';

interface LeasingDetailProps {
  leasingId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LeasingDetail({
  leasingId,
  open,
  onOpenChange,
}: LeasingDetailProps) {
  const { data, isLoading } = useLeasing(leasingId);
  const deleteMutation = useDeleteLeasing();
  const [activeTab, setActiveTab] = useState('overview');
  const [editFormOpen, setEditFormOpen] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm('Naozaj chceš zmazať tento leasing?')) return;

    await deleteMutation.mutateAsync(leasingId);
    onOpenChange(false);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditFormOpen(true);
  };

  const handleEditSuccess = () => {
    setEditFormOpen(false);
    // React Query automaticky refetchne dáta
  };

  const formatMoney = (amount: number | string) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return `${num.toFixed(2)} €`;
  };
  const formatDate = (date: Date | string) =>
    new Date(date).toLocaleDateString('sk-SK');

  if (isLoading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Načítavam...</SheetTitle>
            <SheetDescription>Načítavam detail leasingu</SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!data) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent className="w-full sm:max-w-3xl">
          <SheetHeader>
            <SheetTitle>Chyba</SheetTitle>
            <SheetDescription>Leasing sa nepodarilo načítať</SheetDescription>
          </SheetHeader>
          <p className="mt-6 text-center text-muted-foreground">
            Leasing nenájdený
          </p>
        </SheetContent>
      </Sheet>
    );
  }

  const { leasing, paymentSchedule, documents } = data;
  const progress = (leasing.paidInstallments / leasing.totalInstallments) * 100;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <div>
              <SheetTitle>{leasing.leasingCompany}</SheetTitle>
              <SheetDescription className="text-sm text-muted-foreground">
                {leasing.loanCategory} • {leasing.paymentType}
              </SheetDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handleEdit}
                title="Upraviť leasing"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Prehľad</TabsTrigger>
            <TabsTrigger value="schedule">Kalendár</TabsTrigger>
            <TabsTrigger value="documents">Dokumenty</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Financial Overview Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Finančný prehľad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Progress splácania
                    </span>
                    <span className="font-medium">{progress.toFixed(1)}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{leasing.paidInstallments} uhradených</span>
                    <span>{leasing.remainingInstallments} zostáva</span>
                  </div>
                </div>

                {/* Financial Details */}
                <div className="grid gap-3 pt-4 border-t">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Aktuálny zostatok:
                    </span>
                    <span className="text-sm font-semibold">
                      {formatMoney(leasing.currentBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Mesačná splátka:
                    </span>
                    <span className="text-sm font-semibold">
                      {formatMoney(leasing.totalMonthlyPayment || 0)}
                    </span>
                  </div>
                  {leasing.interestRate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Úroková sadzba:
                      </span>
                      <span className="text-sm font-medium">
                        {leasing.interestRate}% p.a.
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Počet splátok:
                    </span>
                    <span className="text-sm font-medium">
                      {leasing.totalInstallments}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">
                      Prvá splátka:
                    </span>
                    <span className="text-sm font-medium">
                      {formatDate(leasing.firstPaymentDate)}
                    </span>
                  </div>
                  {leasing.lastPaidDate && (
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        Posledná úhrada:
                      </span>
                      <span className="text-sm font-medium">
                        {formatDate(leasing.lastPaidDate)}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Early Repayment Calculator */}
            <EarlyRepaymentCard leasing={leasing} />

            {/* Vehicle Info */}
            {(leasing.acquisitionPriceWithVAT ||
              leasing.acquisitionPriceWithoutVAT) && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Nadobúdacia cena</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {leasing.acquisitionPriceWithoutVAT && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Bez DPH:</span>
                      <span className="font-medium">
                        {formatMoney(leasing.acquisitionPriceWithoutVAT)}
                      </span>
                    </div>
                  )}
                  {leasing.acquisitionPriceWithVAT && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">S DPH:</span>
                      <span className="font-medium">
                        {formatMoney(leasing.acquisitionPriceWithVAT)}
                      </span>
                    </div>
                  )}
                  {leasing.isNonDeductible && (
                    <div className="flex items-center gap-2 text-sm text-amber-600 pt-2 border-t">
                      <AlertCircle className="h-4 w-4" />
                      <span>Neodpočtové vozidlo</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* SCHEDULE TAB */}
          <TabsContent value="schedule" className="mt-6">
            <PaymentScheduleTable
              leasingId={leasingId}
              schedule={paymentSchedule}
            />
          </TabsContent>

          {/* DOCUMENTS TAB */}
          <TabsContent value="documents" className="mt-6">
            <LeasingDocuments leasingId={leasingId} documents={documents} />
          </TabsContent>
        </Tabs>
      </SheetContent>

      {/* EDIT FORM DIALOG */}
      <LeasingForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        onSuccess={handleEditSuccess}
        leasingId={leasingId}
      />
    </Sheet>
  );
}
