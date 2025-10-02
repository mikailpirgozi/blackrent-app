import { apiService } from '@/services/api';
import type { User } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../queryKeys';

// User interfaces
export interface UserFilters {
  role?: string;
  companyId?: string;
  status?: string;
  search?: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  companyId?: string;
  permissions?: string[];
}

export interface UpdateUserData {
  id: string;
  username?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: string;
  companyId?: string;
  permissions?: string[];
  isActive?: boolean;
}

export interface ChangePasswordData {
  id: string;
  currentPassword: string;
  newPassword: string;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: Record<string, number>;
  byCompany: Record<string, number>;
}

// GET users
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: queryKeys.users.list(filters as Record<string, unknown>),
    queryFn: () => apiService.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 minút - users sa nemenia často
    select: (data: User[]) => {
      if (!filters) return data;

      return data.filter(user => {
        if (filters.role && user.role !== filters.role) return false;
        if (filters.companyId && user.companyId !== filters.companyId)
          return false;
        if (filters.status && user.isActive !== (filters.status === 'active'))
          return false;
        if (filters.search) {
          const search = filters.search.toLowerCase();
          return (
            user.username.toLowerCase().includes(search) ||
            user.email.toLowerCase().includes(search) ||
            user.firstName?.toLowerCase().includes(search) ||
            user.lastName?.toLowerCase().includes(search)
          );
        }
        return true;
      });
    },
  });
}

// GET single user
export function useUser(id: string) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => apiService.getUser(id),
    enabled: !!id,
  });
}

// GET users by company
export function useUsersByCompany(companyId: string) {
  return useQuery({
    queryKey: queryKeys.users.byCompany(companyId),
    queryFn: () => apiService.getUsers({ companyId }),
    enabled: !!companyId,
    select: (data: User[]) => data.filter(user => user.companyId === companyId),
  });
}

// GET user stats
export function useUserStats() {
  return useQuery({
    queryKey: queryKeys.users.stats(),
    queryFn: () => apiService.getUserStats(),
    staleTime: 5 * 60 * 1000, // 5 minút
  });
}

// CREATE user
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: CreateUserData) => apiService.createUser(userData),
    onMutate: async newUser => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.users.all,
      });

      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      const optimisticUser = {
        id: `temp-${Date.now()}`,
        ...newUser,
        permissions: newUser.permissions?.map(p => ({ resource: p as any, actions: ['read'] as const })) || [],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as User;

      queryClient.setQueryData(queryKeys.users.lists(), (old: User[] = []) => [
        optimisticUser,
        ...old,
      ]);

      return { previousUsers };
    },
    onError: (_err, _newUser, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(
          queryKeys.users.lists(),
          context.previousUsers
        );
      }
    },
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(new CustomEvent('user-created', { detail: data }));
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });
    },
  });
}

// UPDATE user
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userData: UpdateUserData) => apiService.updateUser(userData),
    onMutate: async updatedUser => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.users.detail(updatedUser.id),
      });

      const previousUser = queryClient.getQueryData(
        queryKeys.users.detail(updatedUser.id)
      );

      // Update detail
      queryClient.setQueryData(
        queryKeys.users.detail(updatedUser.id),
        (old: User) => ({ ...old, ...updatedUser, updatedAt: new Date() })
      );

      // Update list
      queryClient.setQueryData(queryKeys.users.lists(), (old: User[] = []) =>
        old.map(u =>
          u.id === updatedUser.id
            ? { ...u, ...updatedUser, updatedAt: new Date() }
            : u
        )
      );

      return { previousUser };
    },
    onError: (_err, updatedUser, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(
          queryKeys.users.detail(updatedUser.id),
          context.previousUser
        );
      }
    },
    onSuccess: data => {
      // Trigger WebSocket notification
      window.dispatchEvent(new CustomEvent('user-updated', { detail: data }));
    },
    onSettled: (_, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables.id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.lists(),
      });
    },
  });
}

// DELETE user
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deleteUser(id),
    onMutate: async deletedId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.users.all,
      });

      const previousUsers = queryClient.getQueryData(queryKeys.users.lists());

      queryClient.setQueryData(queryKeys.users.lists(), (old: User[] = []) =>
        old.filter(u => u.id !== deletedId)
      );

      return { previousUsers };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previousUsers) {
        queryClient.setQueryData(
          queryKeys.users.lists(),
          context.previousUsers
        );
      }
    },
    onSuccess: (_, deletedId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('user-deleted', { detail: { id: deletedId } })
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.all,
      });
    },
  });
}

// CHANGE PASSWORD
export function useChangePassword() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (passwordData: ChangePasswordData) =>
      apiService.changeUserPassword(passwordData),
    onSuccess: (_, variables) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('user-password-changed', {
          detail: { id: variables.id },
        })
      );
    },
    onSettled: (_, _error, variables) => {
      // Invalidate user data to refresh any cached info
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables.id),
      });
    },
  });
}

// DEACTIVATE user
export function useDeactivateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiService.deactivateUser(id),
    onMutate: async userId => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.users.detail(userId),
      });

      const previousUser = queryClient.getQueryData(
        queryKeys.users.detail(userId)
      );

      // Optimistically update user status
      queryClient.setQueryData(queryKeys.users.detail(userId), (old: User) => ({
        ...old,
        isActive: false,
        updatedAt: new Date(),
      }));

      queryClient.setQueryData(queryKeys.users.lists(), (old: User[] = []) =>
        old.map(u =>
          u.id === userId ? { ...u, isActive: false, updatedAt: new Date() } : u
        )
      );

      return { previousUser };
    },
    onError: (_err, userId, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(
          queryKeys.users.detail(userId),
          context.previousUser
        );
      }
    },
    onSuccess: (_, userId) => {
      // Trigger WebSocket notification
      window.dispatchEvent(
        new CustomEvent('user-deactivated', { detail: { id: userId } })
      );
    },
    onSettled: (_, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.detail(variables),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.users.lists(),
      });
    },
  });
}
