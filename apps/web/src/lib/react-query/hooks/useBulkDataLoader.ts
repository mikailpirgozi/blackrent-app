import { apiService } from '@/services/api';
import type {
  Company,
  Customer,
  Expense,
  Insurance,
  InsuranceClaim,
  Insurer,
  Rental,
  Settlement,
  Vehicle,
} from '@/types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';
import { logger } from '@/utils/smartLogger';

interface BulkData {
  vehicles: Vehicle[];
  rentals: Rental[];
  customers: Customer[];
  companies: Company[];
  insurers: Insurer[];
  expenses: Expense[];
  insurances: Insurance[];
  settlements: Settlement[];
  insuranceClaims: InsuranceClaim[];
}

/**
 * Hook pre načítanie BULK dát a ich rozdelenie do per-entity cache
 * BULK endpoint používame len ako transport, cache je per-entity
 */
export function useBulkDataLoader() {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: queryKeys.bulk.all,
    queryFn: async () => {
      logger.debug('🚀 Loading BULK data as transport...');
      const startTime = Date.now();

      // Načítať BULK dáta
      const bulkData = (await apiService.getBulkData()) as BulkData;

      logger.debug('📦 BULK data loaded, splitting into per-entity cache...');

      // Rozdeliť dáta do per-entity cache
      // Vehicles
      bulkData.vehicles?.forEach(vehicle => {
        queryClient.setQueryData(
          queryKeys.vehicles.detail(vehicle.id),
          vehicle
        );
      });
      queryClient.setQueryData(
        queryKeys.vehicles.lists(),
        bulkData.vehicles || []
      );

      // Rentals
      bulkData.rentals?.forEach(rental => {
        queryClient.setQueryData(queryKeys.rentals.detail(rental.id), rental);
      });
      queryClient.setQueryData(
        queryKeys.rentals.lists(),
        bulkData.rentals || []
      );

      // Customers
      bulkData.customers?.forEach(customer => {
        queryClient.setQueryData(
          queryKeys.customers.detail(customer.id),
          customer
        );
      });
      queryClient.setQueryData(
        queryKeys.customers.lists(),
        bulkData.customers || []
      );

      // Companies
      bulkData.companies?.forEach(company => {
        queryClient.setQueryData(['companies', 'detail', company.id], company);
      });
      queryClient.setQueryData(
        queryKeys.companies.list(),
        bulkData.companies || []
      );

      // Insurers
      bulkData.insurers?.forEach(insurer => {
        queryClient.setQueryData(['insurers', 'detail', insurer.id], insurer);
      });
      queryClient.setQueryData(
        queryKeys.insurers.list(),
        bulkData.insurers || []
      );

      // Expenses
      bulkData.expenses?.forEach(expense => {
        queryClient.setQueryData(['expenses', 'detail', expense.id], expense);
      });
      queryClient.setQueryData(['expenses', 'list'], bulkData.expenses || []);

      // Insurances
      bulkData.insurances?.forEach(insurance => {
        queryClient.setQueryData(
          queryKeys.insurances.detail(insurance.id),
          insurance
        );
      });
      queryClient.setQueryData(
        queryKeys.insurances.lists(),
        bulkData.insurances || []
      );

      // Settlements
      bulkData.settlements?.forEach(settlement => {
        queryClient.setQueryData(
          queryKeys.settlements.detail(settlement.id),
          settlement
        );
      });
      queryClient.setQueryData(
        queryKeys.settlements.list(),
        bulkData.settlements || []
      );

      // Insurance Claims
      bulkData.insuranceClaims?.forEach(claim => {
        queryClient.setQueryData(
          queryKeys.insuranceClaims.detail(claim.id),
          claim
        );
      });
      queryClient.setQueryData(
        queryKeys.insuranceClaims.lists(),
        bulkData.insuranceClaims || []
      );

      const endTime = Date.now();
      logger.debug(`✅ Per-entity cache populated in ${endTime - startTime}ms`);
      logger.debug('📊 Cache stats:', {
        vehicles: bulkData.vehicles?.length || 0,
        rentals: bulkData.rentals?.length || 0,
        customers: bulkData.customers?.length || 0,
        companies: bulkData.companies?.length || 0,
        insurers: bulkData.insurers?.length || 0,
        expenses: bulkData.expenses?.length || 0,
        insurances: bulkData.insurances?.length || 0,
        settlements: bulkData.settlements?.length || 0,
        insuranceClaims: bulkData.insuranceClaims?.length || 0,
      });

      return bulkData;
    },
    staleTime: 0, // ✅ FIX: 0s pre okamžité updates (bolo 5 min)
    gcTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
}

/**
 * Hook pre invalidáciu konkrétnej entity v cache
 */
export function useInvalidateEntity() {
  const queryClient = useQueryClient();

  return {
    invalidateVehicle: (id: string) => {
      logger.debug(`🔄 Invalidating vehicle cache: ${id}`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.vehicles.lists(),
      });
    },

    invalidateRental: (id: string) => {
      logger.debug(`🔄 Invalidating rental cache: ${id}`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.rentals.lists(),
      });
    },

    invalidateCustomer: (id: string) => {
      logger.debug(`🔄 Invalidating customer cache: ${id}`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.customers.lists(),
      });
    },

    invalidateInsurance: (id: string) => {
      logger.debug(`🔄 Invalidating insurance cache: ${id}`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.insurances.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.insurances.lists(),
      });
      // Invalidate vehicle-specific insurance cache
      queryClient.invalidateQueries({
        queryKey: queryKeys.insurances.all,
      });
    },

    invalidateExpense: (id: string) => {
      logger.debug(`🔄 Invalidating expense cache: ${id}`);
      queryClient.invalidateQueries({
        queryKey: ['expenses', 'detail', id],
      });
      queryClient.invalidateQueries({
        queryKey: ['expenses', 'list'],
      });
    },

    invalidateSettlement: (id: string) => {
      logger.debug(`🔄 Invalidating settlement cache: ${id}`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.settlements.list(),
      });
    },

    invalidateInsuranceClaim: (id: string) => {
      logger.debug(`🔄 Invalidating insurance claim cache: ${id}`);
      queryClient.invalidateQueries({
        queryKey: queryKeys.insuranceClaims.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.insuranceClaims.lists(),
      });
    },
  };
}
