import React, { useState } from 'react';
import api from '../api/api';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Save, User, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

const Settings = () => {
  const { user, setUser } = useAuth();
  
  // Initialize form states
  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phoneNumber: user?.phoneNumber || '',
    dateOfBirth: user?.dateOfBirth || '',
    gender: user?.gender || '',
    preferredCurrency: user?.preferredCurrency || 'USD',
    preferredLanguage: user?.preferredLanguage || 'en',
    timezone: user?.timezone || 'UTC'
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError(null);

    try {
      const payload = {
        ...formData,
        lastName: formData.lastName || null,
        phoneNumber: formData.phoneNumber || null,
        dateOfBirth: formData.dateOfBirth || null,
        gender: formData.gender || null
      };

      const res = await api.put('/api/users/profile', payload);
      setUser(res.data);
      localStorage.setItem('user', JSON.stringify(res.data));
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">User Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Configure profile details, localized preferences, and security settings</p>
      </div>

      {success && (
        <div className="flex items-center gap-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/25 p-4 text-sm text-emerald-600 dark:text-emerald-400">
          <CheckCircle2 size={18} />
          <span>Profile preferences saved successfully!</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 rounded-2xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Summary panel */}
        <div className="md:col-span-1 space-y-6">
          <div className="glass rounded-3xl p-6 border border-border/40 text-center space-y-4">
            <div className="relative inline-block">
              <div className="w-24 h-24 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-3xl shadow-inner mx-auto uppercase">
                {user?.firstName ? user.firstName.charAt(0) : <User size={36} />}
              </div>
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">{user?.firstName} {user?.lastName}</h2>
              <span className="text-xs text-muted-foreground">{user?.email}</span>
            </div>
            <div className="pt-2 border-t border-border/30">
              <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider block">Security Level</span>
              <div className="inline-flex items-center gap-1 text-xs text-emerald-500 bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1 rounded-full font-bold mt-1 uppercase">
                <Shield size={12} />
                <span>Enterprise User</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form panel */}
        <div className="md:col-span-2 glass rounded-3xl p-8 border border-border/40">
          <form onSubmit={handleSubmit} className="space-y-6">
            <h3 className="text-base font-bold text-foreground uppercase tracking-wide border-b border-border/30 pb-3">
              Profile Configuration
            </h3>

            {/* Names Row */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">First Name</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Last Name</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Phonenumber & DOB */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                />
              </div>
            </div>

            {/* Gender Row */}
            <div>
              <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <h3 className="text-base font-bold text-foreground uppercase tracking-wide border-b border-border/30 pb-3 pt-4">
              Localizations & Preferences
            </h3>

            {/* Preferences row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Preferred Currency</label>
                <select
                  value={formData.preferredCurrency}
                  onChange={(e) => setFormData({ ...formData, preferredCurrency: e.target.value })}
                  className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Language</label>
                <select
                  value={formData.preferredLanguage}
                  onChange={(e) => setFormData({ ...formData, preferredLanguage: e.target.value })}
                  className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="en">English (US)</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="hi">हिन्दी</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Timezone</label>
                <select
                  value={formData.timezone}
                  onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                  className="w-full bg-secondary/30 border border-border/60 rounded-xl px-4 py-2.5 text-sm text-foreground focus:ring-1 focus:ring-primary focus:outline-none"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">EST (New York)</option>
                  <option value="Asia/Kolkata">IST (India)</option>
                  <option value="Europe/London">GMT (London)</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={loading}
                className="flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-xl shadow-lg shadow-primary/10 text-sm font-bold hover:bg-primary/95 transition-colors disabled:opacity-50"
              >
                <Save size={16} />
                <span>{loading ? 'Saving preferences...' : 'Save Settings'}</span>
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Settings;
