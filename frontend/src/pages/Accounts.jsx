import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Wallet, Trash2, Edit2, X, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Accounts = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({ name: '', type: 'CHECKING', balance: '', currency: 'USD' });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/accounts');
      setAccounts(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch accounts');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingAccount(null);
    setFormData({ name: '', type: 'CHECKING', balance: '0.00', currency: user?.preferredCurrency || 'USD' });
    setModalOpen(true);
  };

  const handleOpenEdit = (account) => {
    setEditingAccount(account);
    setFormData({
      name: account.name,
      type: account.type,
      balance: account.balance.toString(),
      currency: account.currency
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
        balance: parseFloat(formData.balance) || 0
      };

      if (editingAccount) {
        await api.put(`/api/accounts/${editingAccount.id}`, payload);
      } else {
        await api.post('/api/accounts', payload);
      }
      setModalOpen(false);
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Check inputs.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this account? All associated transactions will be impacted.')) return;
    try {
      await api.delete(`/api/accounts/${id}`);
      fetchAccounts();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete account');
    }
  };

  const getGradient = (type) => {
    switch (type) {
      case 'SAVINGS':
        return 'from-emerald-500 to-teal-600';
      case 'CREDIT_CARD':
        return 'from-rose-500 to-pink-600';
      case 'CHECKING':
        return 'from-blue-500 to-indigo-600';
      default:
        return 'from-violet-500 to-fuchsia-600';
    }
  };

  const netWorth = accounts.reduce((acc, curr) => acc + curr.balance, 0);

  return (
    <div className="space-y-8">
      {/* Title block */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Financial Accounts</h1>
          <p className="text-sm text-muted-foreground mt-1">Manage cash, banking connections, and card liabilities</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl shadow-lg shadow-primary/10 text-sm font-semibold hover:bg-primary/95 transition-colors"
        >
          <Plus size={18} />
          <span>Add Account</span>
        </motion.button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-44 glass animate-pulse rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <>
          {/* Net Worth Summary */}
          <div className="glass rounded-3xl p-6 border border-border/40 flex justify-between items-center">
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Total Net Worth</span>
              <h2 className="text-3xl font-extrabold text-foreground">
                {user?.preferredCurrency || 'USD'} {netWorth.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </h2>
            </div>
            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
              <Wallet size={24} />
            </div>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {accounts.map((acc) => (
              <motion.div
                key={acc.id}
                layoutId={`card-${acc.id}`}
                className={`relative overflow-hidden rounded-3xl p-6 text-white bg-gradient-to-br ${getGradient(acc.type)} shadow-xl`}
              >
                {/* Decorative circle */}
                <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-white/10 blur-xl"></div>
                
                <div className="flex justify-between items-start z-10 relative">
                  <div>
                    <span className="text-xs text-white/70 font-semibold tracking-wide uppercase">{acc.type}</span>
                    <h3 className="text-xl font-bold mt-0.5">{acc.name}</h3>
                  </div>
                  <div className="flex gap-1.5 bg-black/10 rounded-xl p-1 border border-white/10">
                    <button
                      onClick={() => handleOpenEdit(acc)}
                      className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                      title="Edit Account"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(acc.id)}
                      className="p-1.5 hover:bg-white/20 hover:text-rose-200 rounded-lg transition-colors"
                      title="Delete Account"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mt-12 z-10 relative">
                  <span className="text-xs text-white/70">Current Balance</span>
                  <p className="text-2xl font-black mt-0.5">
                    {acc.currency} {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </motion.div>
            ))}

            {accounts.length === 0 && (
              <div className="col-span-full py-16 text-center text-muted-foreground glass rounded-3xl border border-border/40">
                <Wallet size={48} className="mx-auto text-muted-foreground/35 mb-4" />
                <p className="text-base font-semibold">No accounts found</p>
                <p className="text-xs mt-1">Create a checking, savings or credit card account to get started.</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* Add / Edit account Modal */}
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
                {editingAccount ? 'Edit Account Details' : 'Connect New Account'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Account Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="e.g. Ally Checking"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Account Type</label>
                    <select
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="CHECKING">Checking</option>
                      <option value="SAVINGS">Savings</option>
                      <option value="CREDIT_CARD">Credit Card</option>
                      <option value="CASH">Cash</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Currency</label>
                    <input
                      type="text"
                      value={formData.currency}
                      onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                      required
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      placeholder="USD"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Current Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    required
                    className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="0.00"
                  />
                </div>

                <div className="pt-4">
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    type="submit"
                    disabled={submitLoading}
                    className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl font-bold shadow-lg shadow-primary/10 text-sm hover:bg-primary/95 transition-colors disabled:opacity-50"
                  >
                    {submitLoading ? 'Saving...' : 'Save Changes'}
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

export default Accounts;
