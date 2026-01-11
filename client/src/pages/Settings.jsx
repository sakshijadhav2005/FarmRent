import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from '../api';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { t } = useTranslation();
  const { user, login, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', mobile: '', location: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate('/login');
      return;
    }

    setForm({
      name: user.name || '',
      mobile: user.mobile || '',
      location: user.location || '',
      password: ''
    });
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');

    try {
      const res = await updateProfile(form);
      if (res.data && res.data.success) {
        // Update auth context
        const token = localStorage.getItem('token');
        login(res.data.data, token);
        setMessage('Profile updated successfully');
        setForm((f) => ({ ...f, password: '' }));
      } else {
        setMessage(res.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      console.error('Update profile error', err);
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-brand-text-light mb-1">{t('settings.profile') || 'Profile'}</h1>
      </div>

      <div className="bg-slate-900/80 backdrop-blur-lg rounded-2xl shadow-2xl border border-brand-primary/20 overflow-hidden">
        <div className="bg-brand-primary-darkest/50 px-6 py-5 border-b border-brand-primary/20">
          <h2 className="text-xl font-bold text-brand-text-light">Profile Information</h2>
          <p className="text-brand-text text-sm mt-0.5">Update your account details</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {message && (
            <div className="mb-4 p-3 bg-brand-primary/20 border-2 border-brand-primary/50 text-brand-primary-light rounded-lg font-medium flex items-center gap-2 text-sm">
              ✓ {message}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-brand-text font-semibold mb-2 text-sm">{t('auth.name')}</label>
              <input
                type="text"
                className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-brand-text font-semibold mb-2 text-sm">{t('auth.phone')}</label>
              <input
                type="tel"
                className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-brand-text font-semibold mb-2 text-sm">{t('equipment.location')}</label>
            <input
              type="text"
              className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition"
              placeholder="City, District"
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
            />
          </div>

          <div className="mb-6">
            <label className="block text-brand-text font-semibold mb-2 text-sm">{t('auth.password')}</label>
            <input
              type="password"
              className="w-full bg-slate-800/50 border-2 border-brand-primary/20 rounded-lg px-3 py-2 text-sm text-brand-text-light focus:outline-none focus:border-brand-secondary focus:ring-2 focus:ring-brand-secondary/50 transition"
              placeholder="Leave blank to keep current password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <p className="text-xs text-brand-text mt-1">Min 6 characters if updating</p>
          </div>

          <div className="flex justify-end gap-3 border-t border-brand-primary/20 pt-4">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 border-2 border-slate-600 text-brand-text font-semibold rounded-lg text-sm hover:bg-slate-700 transition"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-brand-primary hover:bg-brand-primary-dark text-white font-semibold rounded-lg text-sm transition disabled:bg-slate-700 disabled:text-brand-text disabled:cursor-not-allowed shadow-lg shadow-brand-primary/30 hover:shadow-xl hover:shadow-brand-primary/40"
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
