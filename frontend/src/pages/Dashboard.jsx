import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/api';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Percent, 
  CheckCircle2, 
  XCircle,
  Activity,
  UserCheck,
  Calendar,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft
} from 'lucide-react';
import * as Icons from 'lucide-react';

const CategoryIcon = ({ name, size = 14, className }) => {
  const IconComponent = Icons[name] || Icons.Tag;
  return <IconComponent size={size} className={className} />;
};

const Dashboard = () => {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState('Checking...');
  const [apiDelay, setApiDelay] = useState(null);
  
  // Dashboard data states
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkBackendSystem = async () => {
      const startTime = Date.now();
      try {
        await api.get('/api/auth/me');
        setDbStatus('Connected');
        setApiDelay(`${Date.now() - startTime}ms`);
      } catch (err) {
        setDbStatus('Disconnected');
        setApiDelay('N/A');
      }
    };

    const fetchDashboardData = async () => {
      try {
        const [accRes, txRes] = await Promise.all([
          api.get('/api/accounts'),
          api.get('/api/transactions')
        ]);
        setAccounts(accRes.data);
        setTransactions(txRes.data);
      } catch (err) {
        console.error('Failed to load dashboard metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    checkBackendSystem();
    fetchDashboardData();
  }, []);

  // 1. Calculate KPIs
  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthTransactions = transactions.filter(tx => {
    const txDate = new Date(tx.transactionDate);
    return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
  });

  const monthlyIncome = thisMonthTransactions
    .filter(tx => tx.type === 'INCOME')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const monthlyExpenses = thisMonthTransactions
    .filter(tx => tx.type === 'EXPENSE')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const savingsRate = monthlyIncome > 0 
    ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 
    : 0;

  // 2. Generate Chart Data (Last 6 Months Trend)
  const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = [];
    
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mIdx = d.getMonth();
      const yr = d.getFullYear();
      
      const mTransactions = transactions.filter(tx => {
        const txDate = new Date(tx.transactionDate);
        return txDate.getMonth() === mIdx && txDate.getFullYear() === yr;
      });

      const inc = mTransactions.filter(tx => tx.type === 'INCOME').reduce((sum, tx) => sum + tx.amount, 0);
      const exp = mTransactions.filter(tx => tx.type === 'EXPENSE').reduce((sum, tx) => sum + tx.amount, 0);

      data.push({
        name: months[mIdx],
        Income: inc,
        Expense: exp
      });
    }

    // Default placeholder trend if no transactions exist
    if (transactions.length === 0) {
      return [
        { name: 'Jan', Income: 0, Expense: 0 },
        { name: 'Feb', Income: 0, Expense: 0 },
        { name: 'Mar', Income: 0, Expense: 0 },
        { name: 'Apr', Income: 0, Expense: 0 },
        { name: 'May', Income: 0, Expense: 0 },
        { name: 'Jun', Income: 0, Expense: 0 }
      ];
    }

    return data;
  };

  const chartData = generateChartData();
  const recentTransactions = transactions.slice(0, 4);

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Hello, {user?.firstName || 'User'}!
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Here is a breakdown of your personal finances today.
          </p>
        </div>
        
        {/* Connection status badges */}
        <div className="flex flex-wrap gap-2.5">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
            <Activity size={14} className="animate-pulse" />
            <span>API: Active</span>
          </div>
          <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold border ${
            dbStatus === 'Connected' 
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400' 
              : 'bg-amber-500/10 border-amber-500/25 text-amber-600'
          }`}>
            {dbStatus === 'Connected' ? <CheckCircle2 size={14} /> : <XCircle size={14} />}
            <span>Database: {dbStatus}</span>
          </div>
          {apiDelay && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-semibold">
              <UserCheck size={14} />
              <span>Ping: {apiDelay}</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { name: 'Total Balance', value: `${user?.preferredCurrency || 'USD'} ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, change: 'Current net holdings', icon: Wallet, color: 'text-primary bg-primary/10 border-primary/25' },
          { name: 'Monthly Income', value: `${user?.preferredCurrency || 'USD'} ${monthlyIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, change: 'Income logged this month', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/25' },
          { name: 'Monthly Expenses', value: `${user?.preferredCurrency || 'USD'} ${monthlyExpenses.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, change: 'Expenses logged this month', icon: TrendingDown, color: 'text-rose-500 bg-rose-500/10 border-rose-500/25' },
          { name: 'Savings Rate', value: `${savingsRate.toFixed(1)}%`, change: 'Net saving velocity', icon: Percent, color: 'text-amber-500 bg-amber-500/10 border-amber-500/25' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <motion.div
              key={kpi.name}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="glass rounded-2xl p-6 border border-border/40 hover:scale-[1.01] transition-transform"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{kpi.name}</span>
                <div className={`p-2 rounded-xl border ${kpi.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-2xl font-black text-foreground tracking-tight">{kpi.value}</span>
                <span className="block text-[10px] text-muted-foreground mt-1.5 font-medium">{kpi.change}</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts & Recent Transactions Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Trend Area Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-3xl p-6 border border-border/40 lg:col-span-2 flex flex-col justify-between"
        >
          <div className="mb-6">
            <h2 className="text-lg font-bold text-foreground">Cash Flow Overview</h2>
            <p className="text-xs text-muted-foreground">Historical trend mapping of Income vs Expenses</p>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(16, 185, 129)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="rgb(16, 185, 129)" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="rgb(244, 63, 94)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="rgb(244, 63, 94)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156, 163, 175, 0.15)" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    background: 'rgba(255, 255, 255, 0.8)', 
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                    color: '#1f2937'
                  }}
                />
                <Area type="monotone" dataKey="Income" stroke="rgb(16, 185, 129)" strokeWidth={2} fillOpacity={1} fill="url(#colorIncome)" />
                <Area type="monotone" dataKey="Expense" stroke="rgb(244, 63, 94)" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Recent Transactions List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass rounded-3xl p-6 border border-border/40 flex flex-col justify-between"
        >
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">Recent Transactions</h2>
              <p className="text-xs text-muted-foreground">Your last 4 ledger changes</p>
            </div>
            
            <div className="divide-y divide-border/20">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex justify-between items-center py-3.5 first:pt-0 last:pb-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl text-white shadow-inner`}
                         style={{ backgroundColor: tx.category?.color || '#3B82F6' }}
                    >
                      <CategoryIcon name={tx.category?.icon || 'Wallet'} size={14} />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground max-w-[120px] truncate">{tx.description || 'N/A'}</h4>
                      <div className="flex items-center gap-1 text-[10px] text-muted-foreground mt-0.5">
                        <Calendar size={10} />
                        <span>{tx.transactionDate}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-black ${
                      tx.type === 'INCOME' ? 'text-emerald-500' : tx.type === 'EXPENSE' ? 'text-rose-500' : 'text-blue-500'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                      {tx.amount.toFixed(2)}
                    </span>
                    <span className="block text-[9px] text-muted-foreground uppercase font-bold tracking-wider">{tx.account?.name}</span>
                  </div>
                </div>
              ))}

              {recentTransactions.length === 0 && (
                <div className="py-16 text-center text-xs text-muted-foreground">
                  No transactions logged yet.
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground text-center">
              Active currency is set to {user?.preferredCurrency || 'USD'}
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
