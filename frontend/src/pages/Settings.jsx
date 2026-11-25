import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, Check, Settings as SettingsIcon } from 'lucide-react';

const Settings = () => {
  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const res = await api.get('/settings');
        setThreshold(res.data.default_low_stock_threshold);
      } catch (err) {
        setError('Failed to load settings.');
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSaving(true);

    try {
      const res = await api.put('/settings', {
        default_low_stock_threshold: parseInt(threshold, 10),
      });
      setThreshold(res.data.default_low_stock_threshold);
      setMessage('Settings updated successfully.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading settings...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Settings</h1>
          <p className="section-desc">Manage organization settings and default inventory thresholds</p>
        </div>
      </div>

      {message && (
        <div className="callout callout-success">
          <Check size={16} />
          <span>{message}</span>
        </div>
      )}
      {error && <div className="callout callout-danger">{error}</div>}

      <div className="panel" style={{ maxWidth: '600px' }}>
        <div className="panel-header">
          <div className="panel-title">
            <SettingsIcon size={16} color="var(--brand-primary)" />
            <span>Default Low Stock Threshold</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="field">
            <label className="field-label">DEFAULT LOW STOCK THRESHOLD (UNITS)</label>
            <input
              type="number"
              min="0"
              className="field-input"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              required
              style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', maxWidth: '160px' }}
            />
            <div className="field-helper" style={{ lineHeight: 1.5, marginTop: '0.5rem' }}>
              If a product does not have an individual threshold set, this default value is used to determine low stock on the dashboard and product catalog.
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ marginTop: '0.5rem' }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
