import React from 'react';
import { Download, X } from 'lucide-react';
import { Transaction } from '../types';

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  isOpen, onClose, transactions
}) => {
  if (!isOpen) return null;

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(transactions, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `smart-ledger-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={onClose} />
      <div role="dialog" aria-modal="true" aria-labelledby="data-management-title"
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-slate-50">
          <h2 id="data-management-title" className="text-lg font-semibold">Data Management</h2>
          <button onClick={onClose} aria-label="Close" className="p-1"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-6">
          <button onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 p-6 border-2 rounded-xl hover:bg-indigo-50">
            <Download size={24} /> Back up transactions
          </button>
          <p className="text-sm text-slate-600">
            Restore is temporarily unavailable while we add safeguards against data loss.
            You can still download your current transactions.
          </p>
          <p className="text-center text-xs text-slate-400">{transactions.length} transactions loaded</p>
        </div>
      </div>
    </div>
  );
};

