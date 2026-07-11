import React, { useEffect, useState } from 'react';
import api from '../api/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, X, AlertCircle, HelpCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

const CategoryIcon = ({ name, size = 20, className }) => {
  const IconComponent = Icons[name] || Icons.Tag;
  return <IconComponent size={size} className={className} />;
};

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  
  // Form states
  const [formData, setFormData] = useState({ name: '', type: 'EXPENSE', color: '#8B5CF6', icon: 'Tag' });
  const [submitLoading, setSubmitLoading] = useState(false);

  // Common icons for selections
  const availableIcons = [
    'Tag', 'TrendingUp', 'LineChart', 'Utensils', 'Home', 'Zap', 
    'Play', 'Car', 'ShoppingBag', 'Briefcase', 'HeartPulse', 'Gift', 
    'GraduationCap', 'Plane', 'Smartphone', 'Key', 'FileText'
  ];

  const availableColors = [
    '#10B981', '#059669', '#3B82F6', '#2563EB', '#F59E0B', 
    '#D97706', '#EC4899', '#D946EF', '#8B5CF6', '#14B8A6',
    '#EF4444', '#6366F1', '#475569'
  ];

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/categories');
      setCategories(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch categories');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingCategory(null);
    setFormData({ name: '', type: 'EXPENSE', color: '#8B5CF6', icon: 'Tag' });
    setModalOpen(true);
  };

  const handleOpenEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type,
      color: category.color || '#8B5CF6',
      icon: category.icon || 'Tag'
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitLoading(true);
    setError(null);
    try {
      if (editingCategory) {
        await api.put(`/api/categories/${editingCategory.id}`, formData);
      } else {
        await api.post('/api/categories', formData);
      }
      setModalOpen(false);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed. Check inputs.');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this custom category?')) return;
    try {
      await api.delete(`/api/categories/${id}`);
      fetchCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete category');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure expense and income classification categories</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleOpenCreate}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2.5 rounded-2xl shadow-lg shadow-primary/10 text-sm font-semibold hover:bg-primary/95 transition-colors"
        >
          <Plus size={18} />
          <span>New Category</span>
        </motion.button>
      </div>

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-28 glass animate-pulse rounded-3xl"></div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {categories.map((cat) => (
            <motion.div
              key={cat.id}
              whileHover={{ y: -2 }}
              className="glass rounded-3xl p-5 border border-border/40 flex items-center justify-between relative group"
            >
              <div className="flex items-center gap-4">
                <div 
                  className="p-3.5 rounded-2xl text-white shadow-inner"
                  style={{ backgroundColor: cat.color || '#6366F1' }}
                >
                  <CategoryIcon name={cat.icon} />
                </div>
                <div className="space-y-0.5">
                  <h3 className="font-bold text-foreground text-base leading-tight">{cat.name}</h3>
                  <span className={`inline-block text-[10px] font-bold uppercase tracking-wider ${
                    cat.type === 'INCOME' ? 'text-emerald-500' : 'text-rose-500'
                  }`}>
                    {cat.type}
                  </span>
                </div>
              </div>

              {/* Action buttons - hidden for system categories */}
              {!cat.isSystem ? (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-background/90 rounded-xl p-1 border border-border/50 shadow-sm absolute right-4">
                  <button
                    onClick={() => handleOpenEdit(cat)}
                    className="p-1.5 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit Category"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(cat.id)}
                    className="p-1.5 hover:bg-destructive/10 rounded-lg text-muted-foreground hover:text-destructive transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ) : (
                <span className="text-[10px] text-muted-foreground font-semibold px-2 py-0.5 bg-secondary/50 rounded-lg border border-border/40">
                  Default
                </span>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Form */}
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
                {editingCategory ? 'Edit Custom Category' : 'Create Custom Category'}
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Category Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                    placeholder="e.g. Subscriptions"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Flow Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  >
                    <option value="EXPENSE">Expense</option>
                    <option value="INCOME">Income</option>
                  </select>
                </div>

                {/* Color selection */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Category Color</label>
                  <div className="flex flex-wrap gap-2.5">
                    {availableColors.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, color })}
                        className={`w-6 h-6 rounded-full border transition-all ${
                          formData.color === color ? 'ring-2 ring-primary ring-offset-2 border-transparent scale-110' : 'border-black/10'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon Selection */}
                <div>
                  <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Category Icon</label>
                  <div className="grid grid-cols-6 gap-2 max-h-40 overflow-y-auto p-1.5 border border-border/60 rounded-xl bg-secondary/15">
                    {availableIcons.map((icon) => (
                      <button
                        key={icon}
                        type="button"
                        onClick={() => setFormData({ ...formData, icon })}
                        className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                          formData.icon === icon ? 'bg-primary text-primary-foreground border-transparent scale-105' : 'hover:bg-secondary border-border/40 text-muted-foreground'
                        }`}
                      >
                        <CategoryIcon name={icon} size={16} />
                      </button>
                    ))}
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

export default Categories;
