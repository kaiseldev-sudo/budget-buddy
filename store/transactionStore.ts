import { create } from 'zustand';
import { Transaction, Category, Budget } from '@/types/database';
import { supabase } from '@/lib/supabase';
import { notificationService } from '@/lib/notifications';

interface TransactionState {
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  loading: boolean;
  fetchTransactions: () => Promise<void>;
  fetchCategories: () => Promise<void>;
  fetchBudgets: () => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'user_id' | 'created_at'>) => Promise<{ error?: string }>;
  deleteTransaction: (id: string) => Promise<{ error?: string }>;
  addBudget: (budget: Omit<Budget, 'id' | 'user_id' | 'created_at'>) => Promise<{ error?: string }>;
  updateBudget: (id: string, budget: Partial<Budget>) => Promise<{ error?: string }>;
  deleteBudget: (id: string) => Promise<{ error?: string }>;
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  categories: [],
  budgets: [],
  loading: false,

  fetchCategories: async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        // If categories table doesn't exist, use default categories
        const defaultCategories = [
          { id: '1', name: 'Salary', color: '#10B981', icon: '💰', type: 'income' as const, created_at: new Date().toISOString() },
          { id: '2', name: 'Freelance', color: '#3B82F6', icon: '💼', type: 'income' as const, created_at: new Date().toISOString() },
          { id: '3', name: 'Investment', color: '#8B5CF6', icon: '📈', type: 'income' as const, created_at: new Date().toISOString() },
          { id: '4', name: 'Gift', color: '#F59E0B', icon: '🎁', type: 'income' as const, created_at: new Date().toISOString() },
          { id: '5', name: 'Food & Dining', color: '#EF4444', icon: '🍕', type: 'expense' as const, created_at: new Date().toISOString() },
          { id: '6', name: 'Transportation', color: '#06B6D4', icon: '🚗', type: 'expense' as const, created_at: new Date().toISOString() },
          { id: '7', name: 'Shopping', color: '#EC4899', icon: '🛍️', type: 'expense' as const, created_at: new Date().toISOString() },
          { id: '8', name: 'Entertainment', color: '#F97316', icon: '🎬', type: 'expense' as const, created_at: new Date().toISOString() },
          { id: '9', name: 'Bills & Utilities', color: '#6B7280', icon: '⚡', type: 'expense' as const, created_at: new Date().toISOString() },
          { id: '10', name: 'Healthcare', color: '#DC2626', icon: '🏥', type: 'expense' as const, created_at: new Date().toISOString() },
          { id: '11', name: 'Education', color: '#7C3AED', icon: '📚', type: 'expense' as const, created_at: new Date().toISOString() },
          { id: '12', name: 'Travel', color: '#059669', icon: '✈️', type: 'expense' as const, created_at: new Date().toISOString() },
        ];
        set({ categories: defaultCategories });
        return;
      }
      set({ categories: data || [] });
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  },

  fetchTransactions: async () => {
    set({ loading: true });
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          category:categories(*)
        `)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        // If transactions table doesn't exist, use empty array
        set({ transactions: [] });
        return;
      }
      set({ transactions: data || [] });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      set({ transactions: [] });
    } finally {
      set({ loading: false });
    }
  },

  addTransaction: async (transaction) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'User not authenticated' };

      const { data, error } = await supabase
        .from('transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select(`
          *,
          category:categories(*)
        `)
        .single();

      if (error) return { error: error.message };

      // Send notification for new transaction
      if (data) {
        await notificationService.notifyTransactionAdded(data);
      }

      // Refresh transactions
      get().fetchTransactions();
      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  },

  deleteTransaction: async (id: string) => {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) return { error: error.message };

      // Refresh transactions
      get().fetchTransactions();
      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  },

  fetchBudgets: async () => {
    try {
      const { data, error } = await supabase
        .from('budgets')
        .select(`
          *,
          category:categories(*)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching budgets:', error);
        set({ budgets: [] });
        return;
      }
      set({ budgets: data || [] });
    } catch (error) {
      console.error('Error fetching budgets:', error);
      set({ budgets: [] });
    }
  },

  addBudget: async (budget) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { error: 'User not authenticated' };

      const { data, error } = await supabase
        .from('budgets')
        .insert([{ ...budget, user_id: user.id }])
        .select(`
          *,
          category:categories(*)
        `)
        .single();

      if (error) return { error: error.message };

      // Send notification for new budget
      if (data) {
        await notificationService.notifyBudgetCreated(data);
      }

      // Refresh budgets
      get().fetchBudgets();
      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  },

  updateBudget: async (id: string, budget) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .update(budget)
        .eq('id', id);

      if (error) return { error: error.message };

      // Refresh budgets
      get().fetchBudgets();
      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  },

  deleteBudget: async (id: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) return { error: error.message };

      // Refresh budgets
      get().fetchBudgets();
      return {};
    } catch (error) {
      return { error: 'An unexpected error occurred' };
    }
  },
}));