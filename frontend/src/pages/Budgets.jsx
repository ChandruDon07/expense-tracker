import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, X, AlertCircle, Calendar, AlertTriangle } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CategoryIcon = ({ name, size = 16, className }) => {
  const IconComponent = Icons[name] || Icons.Tag;
  return <IconComponent size={size} className={className} />;
};

const Budgets = () => {
  const { user } = useAuth();
  const [budgets, setBudgets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  
  // Form states
  const [formData, setFormData] = useState({
    limitAmount: '',
    period: 'MONTHLY',
    startDate: '',
    endDate: '',
    categoryId: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [budRes, catRes] = await Promise.all([
        api.get('/api/budgets'),
        api.get('/api/categories')
      ]);
      setBudgets(budRes.data);
      setCategories(catRes.data.filter(c => c.type === 'EXPENSE'));
      
      // Default start/end dates (current month)
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
      
      setFormData(prev => ({
        ...prev,
        startDate: firstDay,
        endDate: lastDay
      }));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load budgets');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    setFormData({
      limitAmount: '',
      period: 'MONTHLY',
      startDate: firstDay,
      endDate: lastDay,
      categoryId: ''
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      const payload = {
        ...formData,
        limitAmount: parseFloat(formData.limitAmount),
        categoryId: formData.categoryId === '' ? null : parseInt(formData.categoryId)
      };

      await api.post('/api/budgets', payload);
      setModalOpen(false);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create budget limit.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this budget limit?')) return;
    try {
      await api.delete(`/api/budgets/${id}`);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete budget');
    }
  };

  const getProgressColor = (percent) => {
    if (percent >= 100) return 'bg-rose-500';
    if (percent >= 75) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Budgets</h1>
          <p className="text-sm text-muted-foreground mt-1">Establish spending limits to curb impulse buying habits</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl shadow-lg shadow-primary/10 text-sm font-semibold hover:bg-primary/95 transition-colors"
        >
          <Plus size={18} />
          <span>Set Budget</span>
        </motion.button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map((n) => (
            <div key={n} className="h-48 glass animate-pulse rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {budgets.map((b) => {
            const current = b.currentSpend || 0;
            const limit = b.limitAmount;
            const percent = Math.min((current / limit) * 100, 100);
            const exceeded = current > limit;

            return (
              <motion.div
                key={b.id}
                whileHover={{ y: -1 }}
                className="glass rounded-3xl p-6 border border-border/40 space-y-5 relative"
              >
                {/* Delete button */}
                <button
                  onClick={() => handleDelete(b.id)}
                  className="absolute top-5 right-5 p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-all"
                  title="Remove Budget"
                >
                  <Trash2 size={14} />
                </button>

                {/* Header row */}
                <div className="flex items-center gap-4">
                  <div 
                    className="p-3 rounded-2xl text-white shadow-inner"
                    style={{ backgroundColor: b.category?.color || '#3B82F6' }}
                  >
                    <CategoryIcon name={b.category?.icon || 'Wallet'} />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg leading-tight">
                      {b.category?.name || 'Global Overall Budget'}
                    </h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                      <Calendar size={12} />
                      <span>{b.startDate} to {b.endDate}</span>
                    </div>
                  </div>
                </div>

                {/* Spending Progress Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-bold text-foreground">
                      {percent.toFixed(0)}% Used
                    </span>
                  </div>
                  <div className="w-full bg-secondary/55 h-3.5 rounded-full overflow-hidden border border-border/20">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${percent}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${getProgressColor((current / limit) * 100)}`}
                    ></motion.div>
                  </div>
                </div>

                {/* Balance figures */}
                <div className="flex justify-between items-center pt-2 border-t border-border/20">
                  <div>
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Spent</span>
                    <p className={`text-base font-extrabold ${exceeded ? 'text-rose-500' : 'text-foreground'}`}>
                      {user?.preferredCurrency} {current.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Limit</span>
                    <p className="text-base font-extrabold text-foreground">
                      {user?.preferredCurrency} {limit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                </div>

                {/* Exceeded Warning Alert */}
                {exceeded && (
                  <div className="flex items-center gap-2 text-xs font-bold text-rose-500 bg-rose-500/10 p-2.5 rounded-xl border border-rose-500/20">
                    <AlertTriangle size={14} className="shrink-0" />
                    <span>Warning: Budget limit breached by {(current - limit).toFixed(2)} {user?.preferredCurrency}!</span>
                  </div>
                )}
              </motion.div>
            );
          })}

          {budgets.length === 0 && (
            <div className="col-span-full py-16 text-center text-muted-foreground glass rounded-3xl border border-border/40">
              <AlertTriangle size={48} className="mx-auto text-muted-foreground/35 mb-4" />
              <p className="text-base font-semibold">No budget limits defined</p>
              <p className="text-xs mt-1">Set a budget limit to track your spending categories.</p>
            </div>
          )}
        </div>
      )}

      {/* Set Budget Modal */}
      <AnimatePresence>
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass rounded-3xl p-8 max-w-md w-full border border-border/40 shadow-2xl relative"
            >
              <button
                onClick={() => setModalOpen(false)}
                className="absolute top-5 right-5 p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={18} />
              </button>

              <h2 className="text-xl font-bold text-foreground mb-6">
                Set Spending Budget
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Scope (Category)</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="">Global Wallet (Overall Budget)</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Limit Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.limitAmount}
                      onChange={(e) => setFormData({ ...formData, limitAmount: e.target.value })}
                      required
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Period</label>
                    <select
                      value={formData.period}
                      onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Start Date</label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">End Date</label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      required
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={submitLoading}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold shadow-lg shadow-primary/10 text-sm hover:bg-primary/95 transition-colors disabled:opacity-50"
                  >
                    {submitLoading ? 'Saving...' : 'Set Budget Limit'}
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Budgets;
