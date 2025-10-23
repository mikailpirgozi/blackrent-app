import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/services/api';
import type {
  BankAccount,
  CreateBankAccountRequest,
  CreatePaymentOrderRequest,
  PaymentOrder,
  UpdateBankAccountRequest,
  UpdatePaymentStatusRequest,
} from '@/types/payment-order.types';

// ============================================================================
// PAYMENT ORDERS
// ============================================================================

/**
 * Hook pre vytvorenie platobného príkazu
 */
export const useCreatePaymentOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreatePaymentOrderRequest) => {
      // ✅ api.post() už vracia unwrapnuté data.data
      const paymentOrder = await api.post<PaymentOrder>(
        '/payment-orders',
        data as unknown as Record<string, unknown>
      );
      return paymentOrder;
    },
    onSuccess: data => {
      // Invaliduj cache pre tento rental
      queryClient.invalidateQueries({
        queryKey: ['payment-orders', data.rentalId],
      });
    },
  });
};

/**
 * Hook pre načítanie platobných príkazov pre rental
 */
export const usePaymentOrdersByRental = (rentalId: string) => {
  return useQuery({
    queryKey: ['payment-orders', rentalId],
    queryFn: async () => {
      // ✅ api.get() už vracia unwrapnuté data.data
      const paymentOrders = await api.get<PaymentOrder[]>(
        `/payment-orders/rental/${rentalId}`
      );
      return paymentOrders;
    },
    enabled: !!rentalId,
  });
};

/**
 * Hook pre načítanie konkrétneho platobného príkazu
 */
export const usePaymentOrder = (id: string) => {
  return useQuery({
    queryKey: ['payment-order', id],
    queryFn: async () => {
      // ✅ api.get() už vracia unwrapnuté data.data
      const paymentOrder = await api.get<PaymentOrder>(`/payment-orders/${id}`);
      return paymentOrder;
    },
    enabled: !!id,
  });
};

/**
 * Hook pre aktualizáciu statusu platby
 */
export const useUpdatePaymentStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdatePaymentStatusRequest;
    }) => {
      // ✅ api.patch() už vracia unwrapnuté data.data
      const paymentOrder = await api.patch<PaymentOrder>(
        `/payment-orders/${id}/status`,
        data as unknown as Record<string, unknown>
      );
      return paymentOrder;
    },
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['payment-order', data.id] });
      queryClient.invalidateQueries({
        queryKey: ['payment-orders', data.rentalId],
      });
    },
  });
};

// ============================================================================
// BANK ACCOUNTS
// ============================================================================

/**
 * Hook pre načítanie všetkých bankových účtov
 */
export const useBankAccounts = () => {
  return useQuery({
    queryKey: ['bank-accounts'],
    queryFn: async () => {
      try {
        // ✅ api.get() už vracia data.data, nie celý response
        const accounts = await api.get<BankAccount[]>(
          '/payment-orders/bank-accounts'
        );

        console.log('✅ Bank accounts loaded:', accounts?.length || 0);

        return accounts || [];
      } catch (error) {
        console.error('❌ Error fetching bank accounts:', error);
        throw error;
      }
    },
  });
};

/**
 * Hook pre načítanie aktívnych bankových účtov
 */
export const useActiveBankAccounts = () => {
  return useQuery({
    queryKey: ['bank-accounts', 'active'],
    queryFn: async () => {
      // ✅ api.get() už vracia data.data, nie celý response
      const accounts = await api.get<BankAccount[]>(
        '/payment-orders/bank-accounts/active'
      );
      return accounts || [];
    },
  });
};

/**
 * Hook pre vytvorenie bankového účtu
 */
export const useCreateBankAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBankAccountRequest) => {
      // ✅ api.post() už vracia unwrapnuté data.data
      const bankAccount = await api.post<BankAccount>(
        '/payment-orders/bank-accounts',
        data as unknown as Record<string, unknown>
      );
      return bankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
};

/**
 * Hook pre aktualizáciu bankového účtu
 */
export const useUpdateBankAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateBankAccountRequest;
    }) => {
      // ✅ api.patch() už vracia unwrapnuté data.data
      const bankAccount = await api.patch<BankAccount>(
        `/payment-orders/bank-accounts/${id}`,
        data as unknown as Record<string, unknown>
      );
      return bankAccount;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
};

/**
 * Hook pre vymazanie bankového účtu
 */
export const useDeleteBankAccount = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/payment-orders/bank-accounts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bank-accounts'] });
    },
  });
};
