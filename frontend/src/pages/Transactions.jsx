import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Search, Filter, Trash2, Edit2, X, AlertCircle, 
  ArrowUpRight, ArrowDownLeft, ArrowRightLeft, Tag, Calendar, Wallet 
} from 'lucide-react';
import * as Icons from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CategoryIcon = ({ name, size = 15, className }) => {
  const IconComponent = Icons[name] || Icons.Tag;
  return <IconComponent size={size} className={className} />;
};

const Transactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('ALL');
  const [filterAccount, setFilterAccount] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // Form states
  const [formData, setFormData] = useState({
    amount: '',
    type: 'EXPENSE',
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
    categoryId: '',
    accountId: '',
    transferToAccountId: '',
    receiptUrl: ''
  });
  const [submitLoading, setSubmitLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    try {
      const [txRes, accRes, catRes] = await Promise.all([
        api.get('/api/transactions'),
        api.get('/api/accounts'),
        api.get('/api/categories')
      ]);
      setTransactions(txRes.data);
      setAccounts(accRes.data);
      setCategories(catRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ledger details');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingTransaction(null);
    setFormData({
      amount: '',
      type: 'EXPENSE',
      description: '',
      transactionDate: new Date().toISOString().split('T')[0],
      categoryId: categories.length > 0 ? categories[0].id.toString() : '',
      accountId: accounts.length > 0 ? accounts[0].id.toString() : '',
      transferToAccountId: '',
      receiptUrl: ''
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (tx) => {
    setEditingTransaction(tx);
    setFormData({
      amount: tx.amount.toString(),
      type: tx.type,
      description: tx.description || '',
      transactionDate: tx.transactionDate,
      categoryId: tx.category?.id ? tx.category.id.toString() : '',
      accountId: tx.account?.id ? tx.account.id.toString() : '',
      transferToAccountId: tx.transferToAccount?.id ? tx.transferToAccount.id.toString() : '',
      receiptUrl: tx.receiptUrl || ''
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
        amount: parseFloat(formData.amount),
        categoryId: formData.type === 'TRANSFER' ? null : parseInt(formData.categoryId) || null,
        accountId: parseInt(formData.accountId),
        transferToAccountId: formData.type === 'TRANSFER' ? parseInt(formData.transferToAccountId) || null : null
      };

      if (editingTransaction) {
        await api.put(`/api/transactions/${editingTransaction.id}`, payload);
      } else {
        await api.post('/api/transactions', payload);
      }
      setModalOpen(false);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Check details.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this transaction? This will reverse the account balance update.')) return;
    try {
      await api.delete(`/api/transactions/${id}`);
      fetchInitialData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete transaction');
    }
  };

  // Filter logic
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || tx.type === filterType;
    const matchesAccount = filterAccount === 'ALL' || tx.account?.id.toString() === filterAccount || tx.transferToAccount?.id.toString() === filterAccount;
    const matchesCategory = filterCategory === 'ALL' || tx.category?.id.toString() === filterCategory;
    return matchesSearch && matchesType && matchesAccount && matchesCategory;
  });

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-1">Audit log of cash inflows, outflows, and asset movements</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl shadow-lg shadow-primary/10 text-sm font-semibold hover:bg-primary/95 transition-colors"
        >
          <Plus size={18} />
          <span>Log Transaction</span>
        </motion.button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and Search Panel */}
      <div className="glass rounded-3xl p-5 border border-border/40 grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-4 top-3 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-secondary/30 border border-border/60 rounded-xl pl-11 pr-4 py-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          />
        </div>

        {/* Filter Type */}
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground shrink-0" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full bg-secondary/30 border border-border/60 rounded-xl px-3 py-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="ALL">All Flows</option>
            <option value="EXPENSE">Expenses</option>
            <option value="INCOME">Income</option>
            <option value="TRANSFER">Transfers</option>
          </select>
        </div>

        {/* Filter Account */}
        <div className="flex items-center gap-2">
          <Wallet size={14} className="text-muted-foreground shrink-0" />
          <select
            value={filterAccount}
            onChange={(e) => setFilterAccount(e.target.value)}
            className="w-full bg-secondary/30 border border-border/60 rounded-xl px-3 py-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="ALL">All Accounts</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>{acc.name}</option>
            ))}
          </select>
        </div>

        {/* Filter Category */}
        <div className="flex items-center gap-2">
          <Tag size={14} className="text-muted-foreground shrink-0" />
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-secondary/30 border border-border/60 rounded-xl px-3 py-2.5 text-xs text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      {loading ? (
        <div className="h-64 glass animate-pulse rounded-3xl"></div>
      ) : (
        <div className="glass rounded-3xl border border-border/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-secondary/20 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <th className="py-4 px-6">Flow</th>
                  <th className="py-4 px-6">Date</th>
                  <th className="py-4 px-6">Description</th>
                  <th className="py-4 px-6">Category</th>
                  <th className="py-4 px-6">Account</th>
                  <th className="py-4 px-6 text-right">Amount</th>
                  <th className="py-4 px-6 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20 text-sm text-foreground">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-secondary/15 transition-colors">
                    {/* Flow icon */}
                    <td className="py-4 px-6">
                      {tx.type === 'INCOME' && (
                        <div className="p-2 w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                          <ArrowDownLeft size={16} />
                        </div>
                      )}
                      {tx.type === 'EXPENSE' && (
                        <div className="p-2 w-8 h-8 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center">
                          <ArrowUpRight size={16} />
                        </div>
                      )}
                      {tx.type === 'TRANSFER' && (
                        <div className="p-2 w-8 h-8 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center">
                          <ArrowRightLeft size={16} />
                        </div>
                      )}
                    </td>

                    {/* Date */}
                    <td className="py-4 px-6 font-medium whitespace-nowrap text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={13} />
                        <span>{tx.transactionDate}</span>
                      </div>
                    </td>

                    {/* Description */}
                    <td className="py-4 px-6 font-semibold max-w-xs truncate">{tx.description || 'N/A'}</td>

                    {/* Category */}
                    <td className="py-4 px-6">
                      {tx.category ? (
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-inner"
                             style={{ backgroundColor: tx.category.color || '#6366F1' }}
                        >
                          <CategoryIcon name={tx.category.icon} size={12} />
                          <span>{tx.category.name}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground px-2.5 py-1 bg-secondary rounded-full border border-border/40">
                          Transfer
                        </span>
                      )}
                    </td>

                    {/* Account mapping */}
                    <td className="py-4 px-6">
                      <div className="text-xs font-bold text-foreground">
                        {tx.type === 'TRANSFER' ? (
                          <div className="flex items-center gap-1">
                            <span className="text-muted-foreground">{tx.account?.name}</span>
                            <span className="text-primary font-black">→</span>
                            <span>{tx.transferToAccount?.name}</span>
                          </div>
                        ) : (
                          <span>{tx.account?.name}</span>
                        )}
                      </div>
                    </td>

                    {/* Amount */}
                    <td className={`py-4 px-6 text-right font-black ${
                      tx.type === 'INCOME' ? 'text-emerald-500' : tx.type === 'EXPENSE' ? 'text-rose-500' : 'text-blue-500'
                    }`}>
                      {tx.type === 'INCOME' ? '+' : tx.type === 'EXPENSE' ? '-' : ''}
                      {tx.account?.currency || 'USD'} {tx.amount.toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className="py-4 px-6">
                      <div className="flex gap-2 justify-center">
                        <button
                          onClick={() => handleOpenEdit(tx)}
                          className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan="7" className="py-16 text-center text-muted-foreground font-semibold">
                      No matching transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
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
                {editingTransaction ? 'Edit Transaction Details' : 'Log New Transaction'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Type mapping */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Flow Type</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['EXPENSE', 'INCOME', 'TRANSFER'].map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, type: t })}
                        className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                          formData.type === t ? 'bg-primary text-primary-foreground border-transparent' : 'hover:bg-secondary border-border/40 text-muted-foreground'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amount and Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      required
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Date</label>
                    <input
                      type="date"
                      value={formData.transactionDate}
                      onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                      required
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    />
                  </div>
                </div>

                {/* Account Selection */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
                      {formData.type === 'TRANSFER' ? 'From Account' : 'Account'}
                    </label>
                    <select
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      required
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">Select Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({acc.currency} {acc.balance.toFixed(2)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Account (Only for Transfers) */}
                {formData.type === 'TRANSFER' && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">To Account</label>
                    <select
                      value={formData.transferToAccountId}
                      onChange={(e) => setFormData({ ...formData, transferToAccountId: e.target.value })}
                      required
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">Select Target Account</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Category Selection (Not for Transfers) */}
                {formData.type !== 'TRANSFER' && (
                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Category</label>
                    <select
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      required
                      className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    >
                      <option value="">Select Category</option>
                      {categories.filter(c => c.type === formData.type).map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Description</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="e.g. Weekly Groceries"
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

export default Transactions;
