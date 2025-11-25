import React, { useState, useEffect } from 'react';
import { Plus, Loader2, X, Calendar, DollarSign, AlignLeft, Save } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { categorizeTransaction } from '../services/geminiService';

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTransaction: (
    description: string,
    amount: number,
    date: string,
    type: TransactionType,
    category: string
  ) => void;
  onUpdateTransaction: (transaction: Transaction) => void;
  initialData?: Transaction | null;
}

const getLocalDateString = () => {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

export const TransactionForm: React.FC<TransactionFormProps> = ({
  isOpen,
  onClose,
  onAddTransaction,
  onUpdateTransaction,
  initialData
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getLocalDateString());
  const [type, setType] = useState<TransactionType>(TransactionType.EXPENSE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setDescription(initialData.description);
      setAmount(initialData.amount.toString());
      setDate(initialData.date);
      setType(initialData.type);
    } else if (isOpen) {
      setDescription('');
      setAmount('');
      setDate(getLocalDateString());
      setType(TransactionType.EXPENSE);
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description || !amount) return;

    setIsSubmitting(true);

    try {
      const parsedAmount = parseFloat(amount);

      if (initialData) {
        onUpdateTransaction({
          ...initialData,
          description,
          amount: parsedAmount,
          date,
          type,
          category:
            type !== initialData.type
              ? type === TransactionType.INCOME
                ? "Other Income"
                : "Miscellaneous"
              : initialData.category
        });
      } else {
        const category = await categorizeTransaction(description, parsedAmount, type);
        onAddTransaction(description, parsedAmount, date, type, category);
      }

      onClose();
    } catch (err) {
      console.error("Transaction save error", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <h2 className="text-lg font-semibold text-slate-800">
            {initialData ? "Edit Transaction" : "New Transaction"}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Toggle Income/Expense */}
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setType(TransactionType.EXPENSE)}
              className={`py-2.5 rounded-lg text-sm font-medium ${
                type === TransactionType.EXPENSE
                  ? "bg-white text-rose-600 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500"
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => setType(TransactionType.INCOME)}
              className={`py-2.5 rounded-lg text-sm font-medium ${
                type === TransactionType.INCOME
                  ? "bg-white text-emerald-600 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500"
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">
              Amount
            </label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                step="0.01"
                className="w-full pl-9 pr-4 py-3 border rounded-xl text-lg font-mono"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">
              Description
            </label>
            <div className="relative">
              <AlignLeft className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border rounded-xl"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1 ml-1">
              Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 text-slate-400" size={18} />
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-9 pr-4 py-3 border rounded-xl"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className={`w-full flex items-center justify-center py-3.5 rounded-xl text-white font-semibold shadow-lg ${
              type === TransactionType.EXPENSE
                ? "bg-rose-600 hover:bg-rose-700"
                : "bg-emerald-600 hover:bg-emerald-700"
            }`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                <span className="ml-2">Processing...</span>
              </>
            ) : (
              <>
                {initialData ? <Save size={20} /> : <Plus size={20} />}
                <span className="ml-2">
                  {initialData ? "Save Changes" : "Add Transaction"}
                </span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
