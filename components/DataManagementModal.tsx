import React, { useRef, useState } from 'react';
import { Download, Upload, X, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { Transaction, User } from '../types';

import { db } from '../firebase';
import {
  collection,
  deleteDoc,
  doc,
  writeBatch
} from "firebase/firestore";

interface DataManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  user: User; // 🔥 NEW
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({ 
  isOpen, 
  onClose, 
  transactions,
  user
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  if (!isOpen) return null;

  // ---------------------------------------------
  // EXPORT DATA
  // ---------------------------------------------
  const handleExport = () => {
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileName = `smart-ledger-backup-${new Date().toISOString().split('T')[0]}.json`;

    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileName);
    linkElement.click();
  };

  // ---------------------------------------------
  // FIRESTORE IMPORT (OPTION A — FULL REPLACE)
  // ---------------------------------------------
  const handleImport = async (importedData: Transaction[]) => {
    setIsImporting(true);
    setImportError(null);

    try {
      const userTxCollection = collection(db, "users", user.id, "transactions");

      // STEP 1 — Delete all existing documents
      const deleteBatch = writeBatch(db);
      transactions.forEach((t) => {
        deleteBatch.delete(doc(db, "users", user.id, "transactions", t.id));
      });
      await deleteBatch.commit();

      // STEP 2 — Write imported documents (with batching)
      const chunks = [];
      const chunkSize = 400; // Under Firestore limit of 500 ops

      for (let i = 0; i < importedData.length; i += chunkSize) {
        chunks.push(importedData.slice(i, i + chunkSize));
      }

      for (const chunk of chunks) {
        const batch = writeBatch(db);

        chunk.forEach(tx => {
          const docRef = doc(collection(db, "users", user.id, "transactions"));
          const cleanTx = {
            description: tx.description,
            amount: tx.amount,
            date: tx.date,
            type: tx.type,
            category: tx.category,
            isAutoCategorized: !!tx.isAutoCategorized
          };
          batch.set(docRef, cleanTx);
        });

        await batch.commit();
      }

      // Success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

    } catch (err) {
      console.error(err);
      setImportError("Failed to import. Make sure this is a valid backup file.");
    } finally {
      setIsImporting(false);
    }
  };

  // ---------------------------------------------
  // FILE READER
  // ---------------------------------------------
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsedData = JSON.parse(content);

        if (!Array.isArray(parsedData)) {
          throw new Error("Invalid format");
        }

        // Basic validation
        if (parsedData.length > 0) {
          const item = parsedData[0];
          if (!item.description || !item.amount || !item.date) {
            throw new Error("Invalid transaction schema");
          }
        }

        handleImport(parsedData);

      } catch (err) {
        console.error(err);
        setImportError("Invalid backup file.");
      }
    };

    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <h2 className="text-lg font-semibold text-slate-800">Data Management</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Warning Banner */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start space-x-3">
            <AlertTriangle className="text-blue-500 mt-0.5" size={20} />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Cloud Backup / Restore</p>
              <p className="opacity-90">
                Importing a backup will <strong>replace all your current transactions</strong>.
              </p>
            </div>
          </div>

          {/* Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Export */}
            <button
              onClick={handleExport}
              className="group flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-xl hover:bg-indigo-50 transition-all"
            >
              <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110">
                <Download size={24} />
              </div>
              <h3 className="font-semibold text-slate-900">Backup Data</h3>
              <p className="text-xs text-slate-500 mt-1">Download full history</p>
            </button>

            {/* Import */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="group flex flex-col items-center justify-center p-6 border-2 border-slate-100 rounded-xl hover:bg-emerald-50 transition-all"
            >
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden"
                accept=".json"
                onChange={handleFileChange}
              />

              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110">
                {isImporting ? <Loader2 className="animate-spin" size={24} /> : <Upload size={24} />}
              </div>

              <h3 className="font-semibold text-slate-900">Restore Data</h3>
              <p className="text-xs text-slate-500 mt-1">Replace all transactions</p>
            </button>
          </div>

          {/* Errors */}
          {importError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg flex items-center">
              <AlertTriangle size={16} className="mr-2" />
              {importError}
            </div>
          )}

          {/* Success */}
          {showSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm rounded-lg flex items-center">
              <Check size={16} className="mr-2" />
              Data restored successfully!
            </div>
          )}

          <p className="text-center text-xs text-slate-400">
            {transactions.length} transactions currently stored
          </p>

        </div>
      </div>
    </div>
  );
};
