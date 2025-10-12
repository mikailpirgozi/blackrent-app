/**
 * ===================================================================
 * LEASING FORM - Smart formulár s real-time výpočtami
 * ===================================================================
 */

import { useEffect, useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Calculator,
  Loader2,
  Plus,
  X,
  Calendar as CalendarIcon,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  useCreateLeasing,
  useLeasing,
  useUpdateLeasing,
} from '@/lib/react-query/hooks/useLeasings';
import { useVehicles } from '@/lib/react-query/hooks/useVehicles';
import { solveLeasingData } from '@/utils/leasing/LeasingSolver';
import {
  DEFAULT_PENALTY_RATES,
  type LoanCategory,
  type PaymentType,
} from '@/types/leasing-types';
import { toast } from 'sonner';
import { format, parse, isValid } from 'date-fns';
import { sk } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/smartLogger';

// Zod schema pre validáciu
const leasingFormSchema = z.object({
  vehicleId: z.string().min(1, 'Vozidlo je povinné'),
  leasingCompany: z.string().min(1, 'Leasingová spoločnosť je povinná'),
  loanCategory: z.enum(['autoúver', 'operatívny_leasing', 'pôžička']),
  paymentType: z.enum(['anuita', 'lineárne', 'len_úrok']),

  initialLoanAmount: z
    .number({ required_error: 'Výška úveru je povinná' })
    .positive('Musí byť kladné číslo'),
  totalInstallments: z
    .number({ required_error: 'Počet splátok je povinný' })
    .int()
    .positive(),
  firstPaymentDate: z.string().min(1, 'Dátum prvej splátky je povinný'),
  lastPaymentDate: z.string().optional(), // Vypočítané alebo zadané
  monthlyFee: z.number().nonnegative().default(0),
  processingFee: z.number().nonnegative().default(0),

  interestRate: z.number().nonnegative().optional(),
  rpmn: z.number().nonnegative().optional(),
  monthlyPayment: z.number().nonnegative().optional(), // ✅ FIX: Changed from positive() to nonnegative() - allow 0

  earlyRepaymentPenalty: z.number().nonnegative().default(0),
  earlyRepaymentPenaltyType: z
    .enum(['percent_principal', 'fixed_amount'])
    .default('percent_principal'),

  acquisitionPriceWithoutVAT: z.number().positive().optional(),
  acquisitionPriceWithVAT: z.number().positive().optional(),
  isNonDeductible: z.boolean().default(false),
});

type LeasingFormData = z.infer<typeof leasingFormSchema>;

interface LeasingFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  leasingId?: string;
}

export function LeasingForm({
  open,
  onOpenChange,
  onSuccess,
  leasingId,
}: LeasingFormProps) {
  const [calculated, setCalculated] = useState<{
    monthlyPayment?: number;
    interestRate?: number;
    totalMonthlyPayment?: number;
    rpmn?: number;
    effectiveLoanAmount?: number;
  }>({});
  const [customCompanies, setCustomCompanies] = useState<string[]>([]);
  const [customPenaltyRates, setCustomPenaltyRates] = useState<
    Record<string, number>
  >({});
  const [newCompanyInput, setNewCompanyInput] = useState('');
  const [newCompanyPenalty, setNewCompanyPenalty] = useState<number>(3);
  const [vehicleSearchOpen, setVehicleSearchOpen] = useState(false);
  const [companySearchOpen, setCompanySearchOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<string>('');
  const [selectedCompany, setSelectedCompany] = useState<string>('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [lastDateCalendarOpen, setLastDateCalendarOpen] = useState(false);

  // 🎯 Track previous input values - na detekciu zmeny vstupných parametrov
  const prevInputs = useRef<{
    initialLoanAmount?: number;
    totalInstallments?: number;
    processingFee?: number;
    monthlyFee?: number;
    paymentType?: PaymentType;
    interestRate?: number; // 🔥 PRIDANÉ
    monthlyPayment?: number; // 🔥 PRIDANÉ
  }>({});

  const { data: vehicles } = useVehicles();
  const { data: existingLeasing } = useLeasing(leasingId);
  const createMutation = useCreateLeasing();
  const updateMutation = useUpdateLeasing(leasingId || '');

  // Zoraď vozidlá podľa abecedy
  const sortedVehicles =
    vehicles?.slice().sort((a, b) => {
      const nameA = `${a.brand} ${a.model}`.toLowerCase();
      const nameB = `${b.brand} ${b.model}`.toLowerCase();
      return nameA.localeCompare(nameB);
    }) || [];

  // Kombinácia default + custom spoločností
  const allCompanies = [
    'ČSOB Leasing',
    'Cofidis',
    'Home Credit',
    'UniCredit Leasing',
    'VB Leasing',
    'ČSOB',
    'Tatra banka',
    'Slovenská sporiteľňa',
    'VÚB banka',
    'Poštová banka',
    'mBank',
    ...customCompanies,
  ].sort((a, b) => a.localeCompare(b));

  const form = useForm<LeasingFormData>({
    resolver: zodResolver(leasingFormSchema) as any,
    defaultValues: {
      vehicleId: '',
      leasingCompany: '',
      paymentType: 'anuita',
      loanCategory: 'autoúver',
      initialLoanAmount: undefined,
      totalInstallments: 48,
      firstPaymentDate: '',
      lastPaymentDate: '',
      monthlyFee: 0,
      processingFee: 0,
      interestRate: undefined,
      monthlyPayment: undefined,
      rpmn: undefined,
      earlyRepaymentPenalty: 0,
      earlyRepaymentPenaltyType: 'percent_principal',
      acquisitionPriceWithoutVAT: undefined,
      acquisitionPriceWithVAT: undefined,
      isNonDeductible: false,
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = form;

  // Watch form values pre real-time výpočty
  const watchedValues = watch();

  // Load existing leasing data for edit mode
  useEffect(() => {
    if (leasingId && existingLeasing?.leasing && open) {
      const l = existingLeasing.leasing;

      // Parse numeric strings to numbers
      const parseNum = (
        val: string | number | undefined
      ): number | undefined =>
        typeof val === 'string' ? parseFloat(val) : val;

      setValue('vehicleId', l.vehicleId);
      setValue('leasingCompany', l.leasingCompany);
      setValue('loanCategory', l.loanCategory as LoanCategory);
      setValue('paymentType', l.paymentType as PaymentType);
      const loanAmount = parseNum(l.initialLoanAmount);
      if (loanAmount !== undefined) {
        setValue('initialLoanAmount', loanAmount);
      }
      setValue('totalInstallments', l.totalInstallments);
      setValue(
        'firstPaymentDate',
        l.firstPaymentDate
          ? format(new Date(l.firstPaymentDate), 'yyyy-MM-dd')
          : ''
      );
      setValue(
        'lastPaymentDate',
        l.lastPaymentDate
          ? format(new Date(l.lastPaymentDate), 'yyyy-MM-dd')
          : ''
      );
      setValue('monthlyFee', parseNum(l.monthlyFee) || 0);
      setValue('processingFee', parseNum(l.processingFee) || 0);
      setValue('interestRate', parseNum(l.interestRate) || undefined);
      setValue('monthlyPayment', parseNum(l.monthlyPayment) || undefined);
      setValue('rpmn', parseNum(l.rpmn) || undefined);
      setValue('earlyRepaymentPenalty', parseNum(l.earlyRepaymentPenalty) || 0);
      setValue(
        'earlyRepaymentPenaltyType',
        (l.earlyRepaymentPenaltyType as 'percent_principal' | 'fixed_amount') ||
          'percent_principal'
      );
      setValue(
        'acquisitionPriceWithoutVAT',
        parseNum(l.acquisitionPriceWithoutVAT) || undefined
      );
      setValue(
        'acquisitionPriceWithVAT',
        parseNum(l.acquisitionPriceWithVAT) || undefined
      );
      setValue('isNonDeductible', l.isNonDeductible || false);

      setSelectedVehicle(l.vehicleId);
      setSelectedCompany(l.leasingCompany);

      logger.debug('✅ Leasing data loaded for editing:', l.id);
    }
  }, [leasingId, existingLeasing, open, setValue]);

  // Real-time výpočty a automatické vyplnenie polí
  useEffect(() => {
    const {
      initialLoanAmount,
      interestRate,
      monthlyPayment,
      totalInstallments,
      paymentType,
      monthlyFee,
      processingFee,
    } = watchedValues;

    if (initialLoanAmount && totalInstallments && paymentType) {
      // 🔍 Detekuj zmenu vstupných parametrov (vrátane úroku a splátky)
      const inputsChanged =
        prevInputs.current.initialLoanAmount !== initialLoanAmount ||
        prevInputs.current.totalInstallments !== totalInstallments ||
        prevInputs.current.processingFee !== processingFee ||
        prevInputs.current.monthlyFee !== monthlyFee ||
        prevInputs.current.paymentType !== paymentType ||
        prevInputs.current.interestRate !== interestRate ||
        prevInputs.current.monthlyPayment !== monthlyPayment;

      // ✅ FIX: Ak sa vstupy nezmenili, nepokračuj (zabráni nekonečnému loopu)
      if (!inputsChanged) {
        return;
      }

      // Ulož aktuálne hodnoty pre ďalšie porovnanie
      prevInputs.current = {
        initialLoanAmount,
        totalInstallments,
        processingFee: processingFee || 0,
        monthlyFee: monthlyFee || 0,
        paymentType: paymentType as PaymentType,
        interestRate: interestRate,
        monthlyPayment: monthlyPayment,
      };

      try {
        // 🔥 POUŽIŤ reálne hodnoty z formulára (nie undefined)
        // Solver automaticky dopočíta chýbajúce hodnoty
        const result = solveLeasingData({
          loanAmount: initialLoanAmount,
          processingFee: processingFee || 0,
          interestRate: interestRate, // 🔥 Použiť reálnu hodnotu
          monthlyPayment: monthlyPayment, // 🔥 Použiť reálnu hodnotu
          totalInstallments,
          paymentType: paymentType as PaymentType,
          monthlyFee: monthlyFee || 0,
        });

        if (result.canCalculate) {
          setCalculated({
            monthlyPayment: result.monthlyPayment,
            interestRate: result.interestRate,
            totalMonthlyPayment: result.totalMonthlyPayment,
            rpmn: result.rpmn,
            effectiveLoanAmount: result.effectiveLoanAmount,
          });

          // 🎯 AUTO-FILL: Automaticky vyplň vypočítané hodnoty (len raz pri zmene vstupov)

          // Úroková sadzba
          if (result.interestRate && !isNaN(result.interestRate)) {
            const newRate = Number(result.interestRate.toFixed(3));
            setValue('interestRate', newRate, { shouldValidate: false });
          }

          // Mesačná splátka
          if (result.monthlyPayment && !isNaN(result.monthlyPayment)) {
            const newPayment = Number(result.monthlyPayment.toFixed(2));
            setValue('monthlyPayment', newPayment, { shouldValidate: false });
          }

          // RPMN
          if (result.rpmn && !isNaN(result.rpmn)) {
            const newRpmn = Number(result.rpmn.toFixed(3));
            setValue('rpmn', newRpmn, { shouldValidate: false });
          }
        }
      } catch (error) {
        console.error('Calculation error:', error);
      }
    }
    // ✅ FIX: Sleduj VŠETKY polia ktoré ovplyvňujú výpočet
  }, [
    watchedValues.initialLoanAmount,
    watchedValues.totalInstallments,
    watchedValues.processingFee,
    watchedValues.monthlyFee,
    watchedValues.paymentType,
    watchedValues.interestRate, // 🔥 PRIDANÉ: Sleduj aj zmeny úroku
    watchedValues.monthlyPayment, // 🔥 PRIDANÉ: Sleduj aj zmeny splátky
    setValue,
  ]);

  // Auto-fill penalty rate pri zmene spoločnosti
  useEffect(() => {
    const company = selectedCompany;
    if (company) {
      // Najprv skús custom rates, potom default
      const penaltyRate =
        customPenaltyRates[company] || DEFAULT_PENALTY_RATES[company] || 0;
      setValue('earlyRepaymentPenalty', penaltyRate);
    }
  }, [selectedCompany, customPenaltyRates, setValue]);

  // Auto-calculate DPH
  useEffect(() => {
    const priceWithoutVAT = watchedValues.acquisitionPriceWithoutVAT;
    const isNonDeductible = watchedValues.isNonDeductible;

    // Ak je neodpočtové, nevypočítavaj DPH
    if (isNonDeductible) {
      setValue('acquisitionPriceWithVAT', undefined);
      return;
    }

    // Vypočítaj DPH automaticky (23%)
    if (priceWithoutVAT && priceWithoutVAT > 0) {
      const priceWithVAT = priceWithoutVAT * 1.23;
      setValue('acquisitionPriceWithVAT', Math.round(priceWithVAT * 100) / 100);
    }
  }, [
    watchedValues.acquisitionPriceWithoutVAT,
    watchedValues.isNonDeductible,
    setValue,
  ]);

  // Auto-calculate last payment date
  useEffect(() => {
    const { firstPaymentDate, totalInstallments, lastPaymentDate } =
      watchedValues;

    // Ak je zadaný lastPaymentDate, vypočítaj totalInstallments
    if (lastPaymentDate && firstPaymentDate && !totalInstallments) {
      const firstDate = new Date(firstPaymentDate);
      const lastDate = new Date(lastPaymentDate);

      const monthsDiff =
        (lastDate.getFullYear() - firstDate.getFullYear()) * 12 +
        (lastDate.getMonth() - firstDate.getMonth()) +
        1;

      if (monthsDiff > 0) {
        setValue('totalInstallments', monthsDiff);
      }
      return;
    }

    // Ak sú zadané firstPaymentDate a totalInstallments, vypočítaj lastPaymentDate
    if (firstPaymentDate && totalInstallments && totalInstallments > 0) {
      const firstDate = new Date(firstPaymentDate);
      const lastDate = new Date(firstDate);
      lastDate.setMonth(lastDate.getMonth() + totalInstallments - 1);

      setValue('lastPaymentDate', format(lastDate, 'yyyy-MM-dd'));
    }
  }, [
    watchedValues.firstPaymentDate,
    watchedValues.totalInstallments,
    watchedValues.lastPaymentDate,
    setValue,
  ]);

  // Handler pre pridanie novej spoločnosti
  const handleAddCompany = () => {
    if (
      newCompanyInput.trim() &&
      !allCompanies.includes(newCompanyInput.trim())
    ) {
      const companyName = newCompanyInput.trim();

      // Pridaj spoločnosť
      setCustomCompanies([...customCompanies, companyName]);

      // Ulož penalty rate
      setCustomPenaltyRates({
        ...customPenaltyRates,
        [companyName]: newCompanyPenalty,
      });

      // Vyber túto spoločnosť
      setSelectedCompany(companyName);
      setValue('leasingCompany', companyName);
      setValue('earlyRepaymentPenalty', newCompanyPenalty);

      // Reset form
      setNewCompanyInput('');
      setNewCompanyPenalty(3);
      setCompanySearchOpen(false);
    }
  };

  // Handler pre zmazanie custom spoločnosti
  const handleRemoveCompany = (company: string) => {
    setCustomCompanies(customCompanies.filter(c => c !== company));

    // Zmaž aj penalty rate
    const newRates = { ...customPenaltyRates };
    delete newRates[company];
    setCustomPenaltyRates(newRates);

    if (selectedCompany === company) {
      setSelectedCompany('');
      setValue('leasingCompany', '');
    }
  };

  const onSubmit = async (data: LeasingFormData) => {
    try {
      // 🔧 FIX: Filter out undefined/NaN values and use calculated values
      const input = {
        ...data,
        // Použij vypočítané hodnoty ak neboli zadané, ale len ak nie sú NaN
        interestRate:
          data.interestRate ||
          (calculated.interestRate && !isNaN(calculated.interestRate)
            ? calculated.interestRate
            : undefined),
        monthlyPayment:
          data.monthlyPayment ||
          (calculated.monthlyPayment && !isNaN(calculated.monthlyPayment)
            ? calculated.monthlyPayment
            : undefined),
        totalMonthlyPayment:
          calculated.totalMonthlyPayment &&
          !isNaN(calculated.totalMonthlyPayment)
            ? calculated.totalMonthlyPayment
            : undefined,
        rpmn:
          calculated.rpmn && !isNaN(calculated.rpmn)
            ? calculated.rpmn
            : undefined,
      };

      logger.debug('📝 Submitting leasing data:', input);

      if (leasingId) {
        await updateMutation.mutateAsync({ ...input, id: leasingId });
        toast.success('Leasing úspešne aktualizovaný');
      } else {
        const result = await createMutation.mutateAsync(input);
        logger.debug('✅ Leasing created:', result);
        toast.success('Leasing úspešne vytvorený');
      }

      onSuccess?.();
    } catch (error) {
      console.error('❌ Error creating leasing:', error);
      toast.error(
        error instanceof Error ? error.message : 'Chyba pri ukladaní leasingu'
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {leasingId ? 'Upraviť leasing' : 'Nový leasing'}
          </DialogTitle>
          <DialogDescription>
            Vyplň údaje o leasingu. Systém automaticky vypočíta chybajúce
            hodnoty.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit as any)}
          className="space-y-6 py-4"
        >
          {/* ZÁKLADNÉ INFORMÁCIE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Základné informácie</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Vozidlo - Searchable Combobox */}
              <div className="space-y-2">
                <Label>Vozidlo *</Label>
                <Popover
                  open={vehicleSearchOpen}
                  onOpenChange={setVehicleSearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        'w-full justify-between',
                        !selectedVehicle && 'text-muted-foreground'
                      )}
                    >
                      {selectedVehicle
                        ? (() => {
                            const vehicle = sortedVehicles.find(
                              v => v.id === selectedVehicle
                            );
                            return vehicle
                              ? `${vehicle.brand} ${vehicle.model} - ${vehicle.licensePlate}`
                              : 'Vyber vozidlo';
                          })()
                        : 'Vyber vozidlo'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput placeholder="Hľadať vozidlo..." />
                      <CommandList>
                        <CommandEmpty>Žiadne vozidlo nenájdené.</CommandEmpty>
                        <CommandGroup>
                          {sortedVehicles.map(vehicle => (
                            <CommandItem
                              key={vehicle.id}
                              value={`${vehicle.brand} ${vehicle.model} ${vehicle.licensePlate}`}
                              onSelect={() => {
                                setSelectedVehicle(vehicle.id);
                                setValue('vehicleId', vehicle.id);
                                setVehicleSearchOpen(false);
                              }}
                            >
                              {vehicle.brand} {vehicle.model} -{' '}
                              {vehicle.licensePlate}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.vehicleId && (
                  <p className="text-sm text-destructive">
                    {errors.vehicleId.message}
                  </p>
                )}
              </div>

              {/* Leasingová spoločnosť - Searchable + Add/Remove */}
              <div className="space-y-2">
                <Label>Leasingová spoločnosť *</Label>
                <Popover
                  open={companySearchOpen}
                  onOpenChange={setCompanySearchOpen}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className={cn(
                        'w-full justify-between',
                        !selectedCompany && 'text-muted-foreground'
                      )}
                    >
                      {selectedCompany || 'Vyber alebo pridaj spoločnosť'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0">
                    <Command>
                      <CommandInput
                        placeholder="Hľadať spoločnosť..."
                        value={newCompanyInput}
                        onValueChange={setNewCompanyInput}
                      />
                      <CommandList>
                        <CommandEmpty>
                          <div className="p-4 space-y-3">
                            <p className="text-sm text-muted-foreground text-center">
                              Spoločnosť nenájdená
                            </p>

                            {/* Input pre penalty % */}
                            <div className="space-y-2">
                              <Label
                                htmlFor="newCompanyPenalty"
                                className="text-xs"
                              >
                                Pokuta za predčasné splatenie (%)
                              </Label>
                              <Input
                                id="newCompanyPenalty"
                                type="number"
                                step="0.01"
                                value={newCompanyPenalty}
                                onChange={e =>
                                  setNewCompanyPenalty(
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="3"
                                className="h-8"
                              />
                            </div>

                            <Button
                              size="sm"
                              className="w-full"
                              onClick={handleAddCompany}
                              disabled={!newCompanyInput.trim()}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Pridať "{newCompanyInput}" (
                              {newCompanyPenalty || 0}% pokuta)
                            </Button>
                          </div>
                        </CommandEmpty>
                        <CommandGroup>
                          {allCompanies.map(company => {
                            const isCustom = customCompanies.includes(company);
                            return (
                              <CommandItem
                                key={company}
                                value={company}
                                onSelect={() => {
                                  setSelectedCompany(company);
                                  setValue('leasingCompany', company);
                                  setCompanySearchOpen(false);
                                }}
                                className="flex items-center justify-between"
                              >
                                <span>{company}</span>
                                {isCustom && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={e => {
                                      e.stopPropagation();
                                      handleRemoveCompany(company);
                                    }}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                )}
                              </CommandItem>
                            );
                          })}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.leasingCompany && (
                  <p className="text-sm text-destructive">
                    {errors.leasingCompany.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Kategória úveru */}
                <div className="space-y-2">
                  <Label>Kategória úveru *</Label>
                  <RadioGroup
                    defaultValue="autoúver"
                    onValueChange={value =>
                      setValue('loanCategory', value as LoanCategory)
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="autoúver" id="cat1" />
                      <Label htmlFor="cat1" className="font-normal">
                        Autoúver
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="operatívny_leasing" id="cat2" />
                      <Label htmlFor="cat2" className="font-normal">
                        Operatívny leasing
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="pôžička" id="cat3" />
                      <Label htmlFor="cat3" className="font-normal">
                        Pôžička
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* Typ splácania */}
                <div className="space-y-2">
                  <Label>Typ splácania *</Label>
                  <RadioGroup
                    defaultValue="anuita"
                    onValueChange={value =>
                      setValue('paymentType', value as PaymentType)
                    }
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="anuita" id="pay1" />
                      <Label htmlFor="pay1" className="font-normal">
                        Anuita (predvolené)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="lineárne" id="pay2" />
                      <Label htmlFor="pay2" className="font-normal">
                        Lineárne
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="len_úrok" id="pay3" />
                      <Label htmlFor="pay3" className="font-normal">
                        Len úrok
                      </Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* FINANČNÉ ÚDAJE */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Finančné údaje</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="initialLoanAmount">Výška úveru * (€)</Label>
                  <Input
                    id="initialLoanAmount"
                    type="number"
                    step="0.01"
                    placeholder="25000"
                    {...register('initialLoanAmount', { valueAsNumber: true })}
                  />
                  {errors.initialLoanAmount && (
                    <p className="text-sm text-destructive">
                      {errors.initialLoanAmount.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="processingFee">
                    Poplatok za spracovanie úveru (€)
                  </Label>
                  <Input
                    id="processingFee"
                    type="number"
                    step="0.01"
                    placeholder="0"
                    {...register('processingFee', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Jednorazový poplatok (ovplyvňuje RPMN)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyFee">Mesačný poplatok (€)</Label>
                  <Input
                    id="monthlyFee"
                    type="number"
                    step="0.01"
                    placeholder="15"
                    {...register('monthlyFee', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opakujúci sa každý mesiac
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interestRate">Úroková sadzba (% p.a.)</Label>
                  <Input
                    id="interestRate"
                    type="number"
                    step="0.001"
                    placeholder="4.5"
                    {...register('interestRate', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-vypočítané - aktualizuje sa pri zmene údajov
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="monthlyPayment">Mesačná splátka (€)</Label>
                  <Input
                    id="monthlyPayment"
                    type="number"
                    step="0.01"
                    placeholder="520"
                    {...register('monthlyPayment', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-vypočítané - aktualizuje sa pri zmene údajov
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="rpmn">RPMN (% p.a.)</Label>
                  <Input
                    id="rpmn"
                    type="number"
                    step="0.001"
                    placeholder="5.2"
                    {...register('rpmn', { valueAsNumber: true })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Auto-vypočítané - aktualizuje sa pri zmene údajov
                  </p>
                </div>
              </div>

              {/* Real-time calculation preview */}
              {calculated.totalMonthlyPayment &&
                !isNaN(calculated.totalMonthlyPayment) && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2 mb-3">
                      <Calculator className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                        Vypočítané hodnoty:
                      </span>
                    </div>
                    <div className="grid gap-2 text-sm">
                      {/* Efektívna výška úveru (ak je processing fee) */}
                      {calculated.effectiveLoanAmount &&
                        !isNaN(calculated.effectiveLoanAmount) &&
                        calculated.effectiveLoanAmount >
                          (watchedValues.initialLoanAmount || 0) && (
                          <div className="flex justify-between bg-blue-100 dark:bg-blue-900 p-2 rounded">
                            <span className="text-blue-700 dark:text-blue-300">
                              Efektívna výška úveru:
                            </span>
                            <span className="font-bold text-blue-900 dark:text-blue-100">
                              {calculated.effectiveLoanAmount.toFixed(2)} €
                            </span>
                          </div>
                        )}

                      {calculated.monthlyPayment &&
                        !isNaN(calculated.monthlyPayment) &&
                        !watchedValues.monthlyPayment && (
                          <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">
                              Mesačná splátka:
                            </span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                              {calculated.monthlyPayment.toFixed(2)} €
                            </span>
                          </div>
                        )}
                      {calculated.interestRate &&
                        !isNaN(calculated.interestRate) &&
                        !watchedValues.interestRate && (
                          <div className="flex justify-between">
                            <span className="text-blue-700 dark:text-blue-300">
                              Úroková sadzba:
                            </span>
                            <span className="font-semibold text-blue-900 dark:text-blue-100">
                              {calculated.interestRate.toFixed(3)}% p.a.
                            </span>
                          </div>
                        )}

                      {/* RPMN - VŽDY zobraz ak je vypočítané */}
                      {calculated.rpmn && !isNaN(calculated.rpmn) && (
                        <div className="flex justify-between bg-amber-100 dark:bg-amber-900 p-2 rounded">
                          <span className="text-amber-700 dark:text-amber-300 font-medium">
                            RPMN:
                          </span>
                          <span className="font-bold text-amber-900 dark:text-amber-100">
                            {calculated.rpmn.toFixed(3)}% p.a.
                          </span>
                        </div>
                      )}

                      <Separator className="my-1" />
                      <div className="flex justify-between">
                        <span className="text-blue-700 dark:text-blue-300">
                          Celková mesačná splátka:
                        </span>
                        <span className="font-bold text-lg text-blue-900 dark:text-blue-100">
                          {calculated.totalMonthlyPayment.toFixed(2)} €
                        </span>
                      </div>
                    </div>

                    {/* Info text */}
                    {calculated.rpmn &&
                      !isNaN(calculated.rpmn) &&
                      calculated.rpmn > (watchedValues.interestRate || 0) && (
                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                          💡 RPMN je vyššie ako úrok kvôli poplatkom
                        </p>
                      )}
                  </div>
                )}
            </CardContent>
          </Card>

          {/* SPLÁTKY */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Splátky</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Dátum prvej splátky */}
                <div className="space-y-2">
                  <Label>Dátum prvej splátky *</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={
                        watchedValues.firstPaymentDate
                          ? format(
                              new Date(watchedValues.firstPaymentDate),
                              'dd.MM.yyyy'
                            )
                          : ''
                      }
                      onChange={e => {
                        const value = e.target.value;
                        const formats = [
                          'dd.MM.yyyy',
                          'd.M.yyyy',
                          'dd/MM/yyyy',
                          'd/M/yyyy',
                          'yyyy-MM-dd',
                        ];

                        for (const formatStr of formats) {
                          try {
                            const parsedDate = parse(
                              value,
                              formatStr,
                              new Date()
                            );
                            if (isValid(parsedDate)) {
                              setValue(
                                'firstPaymentDate',
                                format(parsedDate, 'yyyy-MM-dd')
                              );
                              return;
                            }
                          } catch {
                            // Continue to next format
                          }
                        }
                      }}
                      placeholder="dd.mm.rrrr"
                      className="flex-1"
                    />
                    <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            watchedValues.firstPaymentDate
                              ? new Date(watchedValues.firstPaymentDate)
                              : undefined
                          }
                          onSelect={date => {
                            if (date) {
                              setValue(
                                'firstPaymentDate',
                                format(date, 'yyyy-MM-dd')
                              );
                              setCalendarOpen(false);
                            }
                          }}
                          locale={sk}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  {errors.firstPaymentDate && (
                    <p className="text-sm text-destructive">
                      {errors.firstPaymentDate.message}
                    </p>
                  )}
                </div>

                {/* Počet splátok */}
                <div className="space-y-2">
                  <Label htmlFor="totalInstallments">Počet splátok *</Label>
                  <Input
                    id="totalInstallments"
                    type="number"
                    placeholder="48"
                    {...register('totalInstallments', { valueAsNumber: true })}
                  />
                  {errors.totalInstallments && (
                    <p className="text-sm text-destructive">
                      {errors.totalInstallments.message}
                    </p>
                  )}
                </div>

                {/* Dátum poslednej splátky */}
                <div className="space-y-2">
                  <Label>Dátum poslednej splátky</Label>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={
                        watchedValues.lastPaymentDate
                          ? format(
                              new Date(watchedValues.lastPaymentDate),
                              'dd.MM.yyyy'
                            )
                          : ''
                      }
                      onChange={e => {
                        const value = e.target.value;
                        const formats = [
                          'dd.MM.yyyy',
                          'd.M.yyyy',
                          'dd/MM/yyyy',
                          'd/M/yyyy',
                          'yyyy-MM-dd',
                        ];

                        for (const formatStr of formats) {
                          try {
                            const parsedDate = parse(
                              value,
                              formatStr,
                              new Date()
                            );
                            if (isValid(parsedDate)) {
                              setValue(
                                'lastPaymentDate',
                                format(parsedDate, 'yyyy-MM-dd')
                              );
                              return;
                            }
                          } catch {
                            // Continue to next format
                          }
                        }
                      }}
                      placeholder="dd.mm.rrrr"
                      className="flex-1"
                    />
                    <Popover
                      open={lastDateCalendarOpen}
                      onOpenChange={setLastDateCalendarOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="shrink-0"
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={
                            watchedValues.lastPaymentDate
                              ? new Date(watchedValues.lastPaymentDate)
                              : undefined
                          }
                          onSelect={date => {
                            if (date) {
                              setValue(
                                'lastPaymentDate',
                                format(date, 'yyyy-MM-dd')
                              );
                              setLastDateCalendarOpen(false);
                            }
                          }}
                          locale={sk}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Auto-vypočítané alebo manuálne
                  </p>
                </div>
              </div>

              {/* Info box - zobrazí sa keď sú vyplnené dátumy */}
              {watchedValues.firstPaymentDate &&
                watchedValues.lastPaymentDate && (
                  <div className="p-3 bg-muted rounded-lg text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Prvá splátka:
                      </span>
                      <span className="font-medium">
                        {format(
                          new Date(watchedValues.firstPaymentDate),
                          'dd.MM.yyyy',
                          { locale: sk }
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">
                        Posledná splátka:
                      </span>
                      <span className="font-medium">
                        {format(
                          new Date(watchedValues.lastPaymentDate),
                          'dd.MM.yyyy',
                          { locale: sk }
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-muted-foreground">
                        Počet splátok:
                      </span>
                      <span className="font-semibold">
                        {watchedValues.totalInstallments}
                      </span>
                    </div>
                  </div>
                )}
            </CardContent>
          </Card>

          {/* PREDČASNÉ SPLATENIE - READ-ONLY (priradené ku spoločnosti) */}
          {watchedValues.earlyRepaymentPenalty !== undefined &&
            watchedValues.earlyRepaymentPenalty > 0 && (
              <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    Predčasné splatenie
                    <span className="text-xs font-normal text-muted-foreground">
                      (automaticky nastavené)
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-sm">
                    <span className="text-muted-foreground">
                      Pokuta za predčasné splatenie:
                    </span>
                    <span className="ml-2 font-semibold text-amber-900 dark:text-amber-100">
                      {watchedValues.earlyRepaymentPenalty}% z istiny
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Táto hodnota je automaticky priradená ku spoločnosti{' '}
                    {selectedCompany}
                  </p>
                </CardContent>
              </Card>
            )}

          {/* NADOBÚDACIA CENA (voliteľné) */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Nadobúdacia cena (voliteľné)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Checkbox NAHOR */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isNonDeductible"
                  checked={watchedValues.isNonDeductible}
                  onCheckedChange={checked =>
                    setValue('isNonDeductible', checked as boolean)
                  }
                />
                <Label htmlFor="isNonDeductible" className="font-normal">
                  Neodpočtové vozidlo
                </Label>
              </div>

              <div
                className={cn(
                  'grid gap-4',
                  watchedValues.isNonDeductible ? 'grid-cols-1' : 'grid-cols-2'
                )}
              >
                <div className="space-y-2">
                  <Label htmlFor="acquisitionPriceWithoutVAT">
                    Cena bez DPH (€)
                  </Label>
                  <Input
                    id="acquisitionPriceWithoutVAT"
                    type="number"
                    step="0.01"
                    placeholder="21000"
                    {...register('acquisitionPriceWithoutVAT', {
                      valueAsNumber: true,
                    })}
                  />
                </div>

                {/* Cena S DPH - iba ak NIE je neodpočtové */}
                {!watchedValues.isNonDeductible && (
                  <div className="space-y-2">
                    <Label htmlFor="acquisitionPriceWithVAT">
                      Cena s DPH (€)
                    </Label>
                    <Input
                      id="acquisitionPriceWithVAT"
                      type="number"
                      step="0.01"
                      placeholder="25830"
                      value={
                        watchedValues.acquisitionPriceWithVAT?.toFixed(2) || ''
                      }
                      readOnly
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">
                      Automaticky vypočítané (DPH 23%)
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* ACTIONS */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Zrušiť
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {leasingId ? 'Uložiť zmeny' : 'Vytvoriť leasing'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
