export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  amount: number;
  description: string;
  type: TransactionType;
  category: string;
  isAutoCategorized?: boolean;
}

export interface MonthlyStats {
  month: string; // YYYY-MM
  totalIncome: number;
  totalExpense: number;
  categoryBreakdown: { name: string; value: number; color: string }[];
}

export interface User {
  id: string;
  email: string;
  name: string;
}