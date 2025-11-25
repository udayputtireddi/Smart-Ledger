import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType, User } from './types';

import { TransactionForm } from './components/TransactionForm';
import { TransactionList } from './components/TransactionList';
import { MonthlySummary } from './components/MonthlySummary';
import { LoginPage } from './components/LoginPage';
import { DataManagementModal } from './components/DataManagementModal';

import {
  LayoutDashboard,
  Wallet,
  Plus,
  ArrowRightLeft,
  LogOut,
  User as UserIcon,
  Database,
  Info
} from 'lucide-react';

// 🔥 FIREBASE IMPORTS
import { auth, db } from './firebase';
import {
  onAuthStateChanged,
  signOut
} from 'firebase/auth';
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';

type View = 'dashboard' | 'transactions';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);

  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // 🔥 NEW: Firebase Auth Session Listener
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          name: firebaseUser.email!.split("@")[0],
        });
      } else {
        setUser(null);
        setTransactions([]);
      }
    });

    return () => unsub();
  }, []);

  // 🔥 NEW: Real-Time Firestore Listener
  useEffect(() => {
    if (!user) return;

    const txRef = collection(db, "users", user.id, "transactions");
    const qTx = query(txRef, orderBy("date", "desc"));

    const unsub = onSnapshot(qTx, (snapshot) => {
      const list = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Transaction[];

      setTransactions(list);
    });

    return () => unsub();

  }, [user]);

  // 🔥 NEW: ADD Transaction (Firestore)
  const handleAddTransaction = async (
    description: string,
    amount: number,
    date: string,
    type: TransactionType,
    category: string
  ) => {
    if (!user) return;

    await addDoc(collection(db, "users", user.id, "transactions"), {
      description,
      amount,
      date,
      type,
      category,
      isAutoCategorized: true,
      createdAt: Date.now()
    });

    setIsAddModalOpen(false);
    showNotification("Transaction added successfully");
  };

  // 🔥 NEW: UPDATE Transaction
  const handleUpdateTransaction = async (updatedTx: Transaction) => {
    if (!user) return;

    const ref = doc(db, "users", user.id, "transactions", updatedTx.id);
    await updateDoc(ref, {
      description: updatedTx.description,
      amount: updatedTx.amount,
      date: updatedTx.date,
      type: updatedTx.type,
      category: updatedTx.category,
      isAutoCategorized: updatedTx.isAutoCategorized ?? false,
      updatedAt: Date.now(),
    });

    setIsAddModalOpen(false);
    setEditingTransaction(null);
    showNotification("Transaction updated");
  };

  // 🔥 NEW: DELETE Transaction
  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;

    if (window.confirm("Are you sure you want to delete this transaction?")) {
      await deleteDoc(doc(db, "users", user.id, "transactions", id));
      showNotification("Transaction deleted");
    }
  };

  // 🔥 Firebase LoginPage returns user data
  const handleLogin = (loggedIn: User) => {
    setUser(loggedIn);
  };

  // 🔥 NEW: Firebase Logout
  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setCurrentView("dashboard");
  };

  // Toast Auto-hide
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => setNotification(null), 3000);
    return () => clearTimeout(timer);
  }, [notification]);

  const showNotification = (txt: string) => setNotification(txt);

  // When no user is logged in, show login page
  if (!user) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-slate-900 text-white fixed h-full inset-y-0 z-20">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <div className="bg-indigo-500 p-1.5 rounded-lg">
              <Wallet size={20} className="text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">Smart Ledger</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              currentView === 'dashboard' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <LayoutDashboard size={18} className="mr-3" />
            Dashboard
          </button>
          
          <button
            onClick={() => setCurrentView('transactions')}
            className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              currentView === 'transactions' 
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' 
                : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <ArrowRightLeft size={18} className="mr-3" />
            Transactions
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-4">
           <button
             onClick={() => setIsAddModalOpen(true)}
             className="flex items-center justify-center w-full bg-indigo-500 hover:bg-indigo-400 text-white px-4 py-3 rounded-xl font-semibold transition-all shadow-lg"
          >
            <Plus size={18} className="mr-2" /> Add New
          </button>
          
          <div className="pt-2">
             <div className="flex items-center justify-between mb-3 px-1">
                <div className="flex items-center space-x-2 text-slate-400">
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-white">
                    <UserIcon size={14} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-white">{user.name}</span>
                  </div>
                </div>
                <button 
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-white transition-colors p-1"
                  title="Logout"
                >
                  <LogOut size={16} />
                </button>
             </div>
             
             <button 
               onClick={() => setIsDataModalOpen(true)}
               className="w-full flex items-center justify-center space-x-2 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg text-xs font-medium transition-all"
             >
                <Database size={14} />
                <span>Backup / Restore</span>
             </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:pl-64 flex flex-col min-h-screen relative">
        
        {/* Mobile Header */}
        <header className="lg:hidden bg-white border-b border-slate-200 sticky top-0 z-10 px-4 py-4 flex items-center justify-between">
           <div className="flex items-center space-x-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg">
              <Wallet size={18} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-900">Smart Ledger</span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setIsDataModalOpen(true)} className="text-slate-500">
              <Database size={20} />
            </button>
            <button onClick={handleLogout} className="text-slate-500">
              <LogOut size={20} />
            </button>
          </div>
        </header>

        {/* Toast Notification */}
        {notification && (
           <div className="fixed top-20 right-4 lg:top-8 lg:right-8 z-50 animate-in slide-in-from-right-10 fade-in duration-300">
              <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl flex items-center space-x-3">
                 <div className="bg-emerald-500 rounded-full p-1">
                    <Info size={12} className="text-white" />
                 </div>
                 <span className="text-sm font-medium">{notification}</span>
              </div>
           </div>
        )}

        <div className="flex-1 p-4 sm:p-8 max-w-6xl mx-auto w-full">
          {currentView === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
               <div className="mb-6">
                 <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
                 <p className="text-slate-500">Overview of your financial health</p>
               </div>
               <MonthlySummary transactions={transactions} />
               
               <div className="mt-8">
                  <div className="flex items-center justify-between mb-4">
                     <h2 className="text-lg font-bold text-slate-800">Recent Transactions</h2>
                     <button 
                       onClick={() => setCurrentView('transactions')}
                       className="text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                     >
                       View All
                     </button>
                  </div>
                  <TransactionList 
                    transactions={transactions.slice(0, 5)} 
                    onDelete={handleDeleteTransaction}
                    onEdit={(tx) => {
                      setEditingTransaction(tx);
                      setIsAddModalOpen(true);   // ← OPEN MODAL!
                    }}
 
                    withSearch={false} 
                  />
               </div>
            </div>
          )}

          {currentView === 'transactions' && (
             <div className="animate-in fade-in duration-500">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
                    <p className="text-slate-500">History of your income and expenses</p>
                  </div>
                  <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="lg:hidden bg-indigo-600 text-white p-2 rounded-full shadow-lg"
                  >
                    <Plus size={24} />
                  </button>
                </div>
                <TransactionList 
                  transactions={transactions} 
                  onDelete={handleDeleteTransaction}
                  onEdit={(tx) => {
                    setEditingTransaction(tx);
                    setIsAddModalOpen(true);
                  }}
                  withSearch={true}
                />
             </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-20 pb-safe">
        <div className="flex justify-around items-center p-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              currentView === 'dashboard' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <LayoutDashboard size={24} />
            <span className="text-[10px] font-medium mt-1">Dashboard</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex flex-col items-center justify-center -mt-8 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-lg shadow-indigo-600/30 border-4 border-slate-50"
          >
            <Plus size={28} />
          </button>

          <button
            onClick={() => setCurrentView('transactions')}
            className={`flex flex-col items-center p-2 rounded-xl transition-all ${
              currentView === 'transactions' ? 'text-indigo-600' : 'text-slate-400'
            }`}
          >
            <ArrowRightLeft size={24} />
            <span className="text-[10px] font-medium mt-1">Transactions</span>
          </button>
        </div>
      </nav>

      {/* Transaction Modal */}
      <TransactionForm 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAddTransaction={handleAddTransaction}
        onUpdateTransaction={handleUpdateTransaction}
        initialData={editingTransaction}
      />

      {/* Data Modal */}
      <DataManagementModal
        isOpen={isDataModalOpen}
        onClose={() => setIsDataModalOpen(false)}
        transactions={transactions}
        onImport={(data) => {
          console.log("Import disabled in Firestore mode");
          alert("Import is not available in cloud mode yet!");
        }}
      />

    </div>
  );
};

export default App;
