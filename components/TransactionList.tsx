import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import {
  Trash2,
  ShoppingBag,
  Coffee,
  Home,
  Zap,
  Car,
  Film,
  Activity,
  GraduationCap,
  Plane,
  MoreHorizontal,
  Briefcase,
  Gift,
  TrendingUp,
  DollarSign,
  Search,
  X,
  Pencil
} from 'lucide-react';

import { CATEGORY_COLORS } from '../constants';

interface TransactionListProps {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (transaction: Transaction) => void;
  withSearch?: boolean;
}

const getCategoryIcon = (category: string) => {
  const size = 18;
  switch (category) {
    case 'Groceries': return <ShoppingBag size={size} />;
    case 'Food & Drink': return <Coffee size={size} />;
    case 'Housing': return <Home size={size} />;
    case 'Utilities': return <Zap size={size} />;
    case 'Transport': return <Car size={size} />;
    case 'Entertainment': return <Film size={size} />;
    case 'Health': return <Activity size={size} />;
    case 'Education': return <GraduationCap size={size} />;
    case 'Travel': return <Plane size={size} />;
    case 'Salary': return <Briefcase size={size} />;
    case 'Gift': return <Gift size={size} />;
    case 'Investment': return <TrendingUp size={size} />;
    case 'Other Income': return <DollarSign size={size} />;
    default: return <MoreHorizontal size={size} />;
  }
};

const formatLocalDate = (dateStr: string) => {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'long',
    day: 'numeric'
  });
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  onDelete,
  onEdit,
  withSearch = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = transactions.filter(t => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      t.description.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q) ||
      t.amount.toString().includes(q)
    );
  });

  const grouped = filtered.reduce((map, t) => {
    if (!map[t.date]) map[t.date] = [];
    map[t.date].push(t);
    return map;
  }, {} as Record<string, Transaction[]>);

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  // No transactions anywhere
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
        <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mb-4">
          <DollarSign className="text-slate-300" size={32} />
        </div>
        <h3 className="font-medium text-slate-900">No transactions found</h3>
        <p className="text-slate-500 text-sm mt-1">Tap the + button to add one.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20 sm:pb-0">

      {/* Search Bar */}
      {withSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-3 text-slate-400" size={18} />
          <input
            type="text"
            value={searchQuery}
            placeholder="Search by description, category, or amount…"
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-10 py-3 border rounded-xl shadow-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3 text-slate-400"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}

      {/* Search yields no results */}
      {withSearch && searchQuery && filtered.length === 0 && (
        <div className="text-center py-12">
          <Search size={22} className="text-slate-400 mx-auto mb-3" />
          <p className="font-medium text-slate-900">No matches found</p>
          <p className="text-slate-500 text-sm">Try a different keyword.</p>
        </div>
      )}

      {/* Transaction Groups */}
      {sortedDates.map(date => (
        <div key={date}>
          <div className="sticky top-0 bg-slate-50/90 py-2 mb-2 backdrop-blur-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">
              {formatLocalDate(date)}
            </h3>
            <div className="h-px bg-slate-200"></div>
          </div>

          <div className="bg-white border rounded-2xl shadow-sm overflow-hidden">
            {grouped[date].map(t => (
              <div
                key={t.id}
                className="flex justify-between items-center p-4 border-b last:border-b-0 hover:bg-slate-50 transition"
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white"
                    style={{
                      backgroundColor: CATEGORY_COLORS[t.category] || '#94a3b8'
                    }}
                  >
                    {getCategoryIcon(t.category)}
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900">{t.description}</p>
                    <p className="text-xs text-slate-500">{t.category}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`font-mono font-medium ${
                      t.type === TransactionType.INCOME
                        ? 'text-emerald-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {t.type === TransactionType.INCOME ? '+' : ''}$
                    {t.amount.toFixed(2)}
                  </span>

                  <button
                    onClick={() => onEdit(t)}
                    className="p-2 text-slate-300 hover:text-indigo-600 rounded-full"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => onDelete(t.id)}
                    className="p-2 text-slate-300 hover:text-rose-600 rounded-full"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
