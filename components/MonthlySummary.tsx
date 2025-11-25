import React, { useMemo, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, XAxis, YAxis, CartesianGrid, Area, AreaChart } from 'recharts';
import { CATEGORY_COLORS } from '../constants';
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, DollarSign } from 'lucide-react';

interface MonthlySummaryProps {
  transactions: Transaction[];
}

export const MonthlySummary: React.FC<MonthlySummaryProps> = ({ transactions }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const monthlyTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getMonth() === month && tDate.getFullYear() === year;
    });
  }, [transactions, month, year]);

  const stats = useMemo(() => {
    let income = 0;
    let expense = 0;
    const expenseCategories: Record<string, number> = {};

    monthlyTransactions.forEach(t => {
      if (t.type === TransactionType.INCOME) {
        income += t.amount;
      } else {
        expense += t.amount;
        expenseCategories[t.category] = (expenseCategories[t.category] || 0) + t.amount;
      }
    });

    const categoryData = Object.entries(expenseCategories)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Savings rate calculation
    const savings = income - expense;
    const savingsRate = income > 0 ? (savings / income) * 100 : 0;

    return { income, expense, balance: savings, savingsRate, categoryData };
  }, [monthlyTransactions]);

  // Daily Trend Data Calculation
  const dailyData = useMemo(() => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const data = new Array(daysInMonth).fill(0).map((_, i) => ({
      day: i + 1,
      name: `${i + 1}`,
      income: 0,
      expense: 0,
      fullDate: new Date(year, month, i + 1).toISOString().split('T')[0]
    }));

    monthlyTransactions.forEach(t => {
      const day = new Date(t.date).getDate();
      if (day >= 1 && day <= daysInMonth) {
        if (t.type === TransactionType.INCOME) {
          data[day - 1].income += t.amount;
        } else {
          data[day - 1].expense += t.amount;
        }
      }
    });
    return data;
  }, [monthlyTransactions, year, month]);

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="space-y-6 pb-20 sm:pb-0">
      
      {/* Date Navigator */}
      <div className="flex items-center justify-between bg-white px-4 py-3 rounded-xl shadow-sm border border-slate-100">
        <button onClick={handlePrevMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ChevronLeft size={20} />
        </button>
        <h2 className="text-lg font-bold text-slate-800">{monthName}</h2>
        <button onClick={handleNextMonth} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Hero Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Cash Flow Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <DollarSign size={80} />
          </div>
          <div className="relative z-10">
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Net Balance</p>
            <h3 className={`text-3xl font-bold mt-2 font-mono ${stats.balance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
              {stats.balance < 0 ? '-' : ''}${Math.abs(stats.balance).toLocaleString()}
            </h3>
            <p className="text-sm text-slate-400 mt-2">
              {stats.savingsRate > 0 ? `Saved ${stats.savingsRate.toFixed(1)}% of income` : 'Expenses exceeded income'}
            </p>
          </div>
        </div>

        {/* Income Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wider mb-1 flex items-center">
              <TrendingUp size={14} className="mr-1" /> Income
            </p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono">${stats.income.toLocaleString()}</h3>
          </div>
          <div className="h-10 w-10 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500">
            <DollarSign size={20} />
          </div>
        </div>

        {/* Expense Card */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between">
          <div>
             <p className="text-xs font-semibold text-rose-500 uppercase tracking-wider mb-1 flex items-center">
              <TrendingDown size={14} className="mr-1" /> Spending
            </p>
            <h3 className="text-2xl font-bold text-slate-900 font-mono">${stats.expense.toLocaleString()}</h3>
          </div>
           <div className="h-10 w-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500">
            <TrendingDown size={20} />
          </div>
        </div>
      </div>

      {monthlyTransactions.length > 0 ? (
        <>
            {/* Daily Trend Chart */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                <h3 className="text-base font-bold text-slate-800 mb-6">Daily Financial Trend</h3>
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart
                            data={dailyData}
                            margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 11}} 
                                interval={2} // Show every 3rd day to avoid clutter
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fill: '#94a3b8', fontSize: 11}} 
                                tickFormatter={(val) => `$${val}`}
                            />
                            <RechartsTooltip
                                formatter={(value: number) => [`$${value.toFixed(2)}`, '']}
                                contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="income" 
                                stroke="#10b981" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorIncome)" 
                                name="Income"
                            />
                            <Area 
                                type="monotone" 
                                dataKey="expense" 
                                stroke="#f43f5e" 
                                strokeWidth={2}
                                fillOpacity={1} 
                                fill="url(#colorExpense)" 
                                name="Expense"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Spending Breakdown Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[26rem] flex flex-col">
                    <h3 className="text-base font-bold text-slate-800 mb-2">Spending Distribution</h3>
                    {stats.categoryData.length > 0 ? (
                        <div className="flex-1 min-h-0">
                           <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats.categoryData}
                                cx="50%"
                                cy="50%"
                                innerRadius={80}
                                outerRadius={110}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                              >
                                {stats.categoryData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[entry.name] || '#94a3b8'} />
                                ))}
                              </Pie>
                              <RechartsTooltip 
                                formatter={(value: number) => `$${value.toFixed(2)}`}
                                contentStyle={{ borderRadius: '0.75rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-slate-400">
                            No expenses recorded
                        </div>
                    )}
                </div>

                {/* Category List with Progress Bars */}
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-[26rem] flex flex-col">
                   <h3 className="text-base font-bold text-slate-800 mb-6">Top Spending Categories</h3>
                   <div className="flex-1 overflow-y-auto pr-2 space-y-5 custom-scrollbar">
                      {stats.categoryData.length > 0 ? (
                          stats.categoryData.map((cat) => {
                              const percentage = stats.expense > 0 ? (cat.value / stats.expense) * 100 : 0;
                              return (
                                 <div key={cat.name}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <div className="flex items-center">
                                            <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: CATEGORY_COLORS[cat.name] || '#94a3b8' }}></div>
                                            <span className="text-sm font-medium text-slate-700">{cat.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-slate-900 block">${cat.value.toLocaleString()}</span>
                                            <span className="text-xs text-slate-400 font-mono">{percentage.toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{ 
                                                width: `${percentage}%`, 
                                                backgroundColor: CATEGORY_COLORS[cat.name] || '#94a3b8' 
                                            }}
                                        ></div>
                                    </div>
                                 </div>
                              );
                          })
                      ) : (
                          <div className="h-full flex items-center justify-center text-slate-400">
                              No data available
                          </div>
                      )}
                   </div>
                </div>
            </div>
        </>
      ) : (
        <div className="text-center py-20 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <p className="text-slate-500 font-medium">No data for {monthName}</p>
          <p className="text-sm text-slate-400 mt-1">Transactions you add will appear here.</p>
        </div>
      )}
    </div>
  );
};