import React, { useState, useEffect } from 'react';
import { api } from '../utils/api';
import { Settings, Save, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export default function ConfigPanel() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const fetchConfig = async () => {
    try {
      const data = await api.get('/admin/config');
      setConfig(data);
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load configuration settings.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    try {
      await api.put('/admin/config', config);
      setMessage({ type: 'success', text: 'Global configuration settings updated.' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to save configuration.' });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field, val) => {
    setConfig(prev => ({ ...prev, [field]: val }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold">System Configuration</h2>
        <p className="text-sm text-slate-400">Manage late cutoff parameters, threshold limits, and notification alerts</p>
      </div>

      {message.text && (
        <div className={`p-4 rounded-xl flex items-start space-x-2 border text-sm ${
          message.type === 'success' 
            ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-400' 
            : 'bg-rose-950/20 border-rose-900/40 text-rose-400'
        }`}>
          {message.type === 'success' ? (
            <CheckCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Rules Section */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Settings className="h-4.5 w-4.5 text-blue-400" />
            <span>Attendance Rules Configuration</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Late Cutoff Time
              </label>
              <input
                type="time"
                step="1"
                required
                value={config?.late_cutoff_time || '09:15:00'}
                onChange={(e) => handleChange('late_cutoff_time', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                Marks checked-in student as "Late" if scan occurs past this boundary.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Absenteeism Threshold (%)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="100"
                required
                value={config?.absenteeism_threshold || 75.00}
                onChange={(e) => handleChange('absenteeism_threshold', parseFloat(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                Flags warning alerts on dashboard if aggregate attendance drops below.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Parent Notification Time
              </label>
              <input
                type="time"
                step="1"
                required
                value={config?.parent_notification_time || '09:30:00'}
                onChange={(e) => handleChange('parent_notification_time', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
              />
              <p className="text-[10px] text-slate-500 mt-1.5 leading-relaxed">
                Daily cutoff time when parental alert triggers for unchecked-in students.
              </p>
            </div>
          </div>
        </div>

        {/* Messaging Gateway Section */}
        <div className="glass-card rounded-2xl p-6 space-y-6">
          <h3 className="text-base font-bold text-slate-200 border-b border-slate-800 pb-3 flex items-center space-x-2">
            <Settings className="h-4.5 w-4.5 text-blue-400" />
            <span>Alerts & Google Sheet Gateway</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Resend API Key
              </label>
              <input
                type="password"
                value={config?.resend_api_key || ''}
                onChange={(e) => handleChange('resend_api_key', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="re_xxxxxxxxxxxxxxxxxxxxxxxx"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Sender Email Address
              </label>
              <input
                type="text"
                value={config?.email_from_address || ''}
                onChange={(e) => handleChange('email_from_address', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="onboarding@resend.dev"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Google Sheet Sync URL
              </label>
              <input
                type="text"
                value={config?.google_sheet_url || ''}
                onChange={(e) => handleChange('google_sheet_url', e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900/80 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm"
                placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center space-x-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold rounded-xl text-sm transition-all shadow-lg shadow-blue-500/10 cursor-pointer disabled:opacity-50"
        >
          <Save className="h-4.5 w-4.5" />
          <span>{saving ? 'Saving Settings...' : 'Save Configuration'}</span>
        </button>
      </form>
    </div>
  );
}
