export interface User {
  id: string;
  email: string;
  full_name: string;
  created_at: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
  type: 'income' | 'expense';
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  description: string;
  date: string;
  receipt_url?: string;
  created_at: string;
  category?: Category;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string;
  amount: number;
  period: 'daily' | 'weekly' | 'monthly';
  start_date: string;
  end_date?: string;
  is_active: boolean;
  created_at: string;
  category?: Category;
}

export interface Reminder {
  id: string;
  user_id: string;
  title: string;
  description: string;
  due_date: string;
  is_recurring: boolean;
  frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  is_completed: boolean;
  created_at: string;
}