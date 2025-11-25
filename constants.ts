export const EXPENSE_CATEGORIES = [
  'Food & Drink',
  'Groceries',
  'Transport',
  'Shopping',
  'Utilities',
  'Housing',
  'Entertainment',
  'Health',
  'Education',
  'Travel',
  'Miscellaneous'
];

export const INCOME_CATEGORIES = [
  'Salary',
  'Freelance',
  'Investment',
  'Gift',
  'Other Income'
];

// Centralized keys to ensure data persistence across updates
export const STORAGE_KEYS = {
  USERS: 'smart-ledger-users',
  CURRENT_USER: 'smart-ledger-current-user',
  DATA_PREFIX: 'smart-ledger-data-'
};

// Keys used in previous versions, used for migration/recovery
export const LEGACY_KEYS = {
  USERS_SIMPLE: 'users', 
  DATA_ORPHAN: 'smart-ledger-data' // Data stored before multi-user support
};

// Consistent coloring for categories across the app
export const CATEGORY_COLORS: Record<string, string> = {
  'Food & Drink': '#f87171', // red-400
  'Groceries': '#fb923c', // orange-400
  'Transport': '#facc15', // yellow-400
  'Shopping': '#a78bfa', // violet-400
  'Utilities': '#60a5fa', // blue-400
  'Housing': '#2dd4bf', // teal-400
  'Entertainment': '#e879f9', // fuchsia-400
  'Health': '#fb7185', // rose-400
  'Education': '#818cf8', // indigo-400
  'Travel': '#34d399', // emerald-400
  'Miscellaneous': '#94a3b8', // slate-400
  'Salary': '#22c55e', // green-500
  'Freelance': '#10b981', // emerald-500
  'Investment': '#0ea5e9', // sky-500
  'Gift': '#d946ef', // fuchsia-500
  'Other Income': '#64748b' // slate-500
};

export const CHART_COLORS = [
  '#3b82f6', // blue-500
  '#ef4444', // red-500
  '#10b981', // emerald-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
  '#6366f1', // indigo-500
  '#84cc16', // lime-500
];