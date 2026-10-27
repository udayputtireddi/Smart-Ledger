import { aiRequest } from './aiClient';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';
import { TransactionType } from '../types';
export async function categorizeTransaction(description: string, amount: number, type: TransactionType): Promise<string> {
  const income = type === TransactionType.INCOME;
  const fallback = income ? 'Other Income' : 'Miscellaneous';
  try {
    const result = await aiRequest<{ category: string }>('categorize', { description, amount, type });
    return (income ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).includes(result.category) ? result.category : fallback;
  } catch { return fallback; }
}
