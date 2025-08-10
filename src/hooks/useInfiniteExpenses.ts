import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { Expense } from '../types';
import { logger } from '../utils/smartLogger';

interface ExpenseFilters {
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  vehicleId?: string;
  rentalId?: string;
}

interface UseInfiniteExpensesReturn {
  expenses: Expense[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  totalCount: number;
  currentPage: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadMore: () => void;
  refresh: () => void;
  updateFilters: (filters: ExpenseFilters) => void;
}

const ITEMS_PER_PAGE = 50;

export function useInfiniteExpenses(initialFilters: ExpenseFilters = {}): UseInfiniteExpensesReturn {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<ExpenseFilters>(initialFilters);
  const [initialLoad, setInitialLoad] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Prevent duplicate requests
  const loadingRef = useRef(false);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const loadExpenses = useCallback(async (page: number, isNewSearch: boolean = false) => {
    if (loadingRef.current) {
      console.log('⏸️ Load already in progress, skipping...');
      return;
    }
    
    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      logger.info(`🔄 Loading expenses - Page ${page}`, { filters: filtersRef.current });
      
      // 🚀 Server-side search with pagination
      const result = await apiService.getExpensesPaginated({
        page,
        limit: ITEMS_PER_PAGE,
        search: searchTerm,
        ...filtersRef.current
      });

      const newExpenses = result.expenses;
      
      // Validate response
      if (!result || !Array.isArray(newExpenses)) {
        throw new Error('Invalid response format');
      }
      
      setExpenses(prev => {
        // If new search, replace all. Otherwise append.
        const updatedExpenses = isNewSearch ? newExpenses : [...prev, ...newExpenses];
        
        // Remove duplicates based on expense ID
        const uniqueExpenses = Array.from(
          new Map(updatedExpenses.map(expense => [expense.id, expense])).values()
        );
        
        return uniqueExpenses;
      });
      
      setTotalCount(result.pagination.totalItems);
      setHasMore(result.pagination.hasMore);
      setCurrentPage(result.pagination.currentPage);
      
      logger.info(`✅ Loaded ${newExpenses.length} expenses (${result.pagination.totalItems} total)`);
      
    } catch (err: any) {
      const errorMessage = err.message || 'Chyba pri načítavaní výdavkov';
      setError(errorMessage);
      logger.error('❌ Failed to load expenses', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
      if (initialLoad) {
        setInitialLoad(false);
      }
    }
  }, [initialLoad, searchTerm]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore && !initialLoad) {
      console.log(`📚 Load more triggered - Page ${currentPage + 1}, hasMore: ${hasMore}, loading: ${loading}`);
      loadExpenses(currentPage + 1, false);
    } else {
      console.log(`⏸️ Load more skipped - loading: ${loading}, hasMore: ${hasMore}, initialLoad: ${initialLoad}`);
    }
  }, [loading, hasMore, currentPage, loadExpenses, initialLoad]);

  const refresh = useCallback(() => {
    setExpenses([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    loadExpenses(1, true);
  }, [loadExpenses]);

  const updateFilters = useCallback((newFilters: ExpenseFilters) => {
    logger.info('🔍 Updating filters', { newFilters });
    setFilters(newFilters);
    setExpenses([]);
    setCurrentPage(1);
    setHasMore(true);
    setError(null);
    // Load will be triggered by useEffect
  }, []);

  // Initial load
  useEffect(() => {
    if (initialLoad) {
      setInitialLoad(false);
      loadExpenses(1, true);
    }
  }, []);

  // Filter changes
  useEffect(() => {
    if (!initialLoad) {
      // Debounce filter changes to avoid rapid re-fetching
      const timer = setTimeout(() => {
        loadExpenses(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters]);

  // Search term changes - trigger new search
  useEffect(() => {
    if (!initialLoad) {
      // Reset pagination and load new results
      setCurrentPage(1);
      setExpenses([]);
      setHasMore(true);
      // Debounce search to avoid rapid API calls
      const timer = setTimeout(() => {
        loadExpenses(1, true);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchTerm]);

  // Debug logging
  useEffect(() => {
    logger.debug('📊 Infinite expenses state', {
      expensesCount: expenses.length,
      totalCount,
      currentPage,
      hasMore,
      loading,
      error
    });
  }, [expenses.length, totalCount, currentPage, hasMore, loading, error]);

  return {
    expenses,
    loading,
    error,
    hasMore,
    totalCount,
    currentPage,
    searchTerm,
    setSearchTerm,
    loadMore,
    refresh,
    updateFilters
  };
}