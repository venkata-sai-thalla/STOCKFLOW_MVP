import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, Check, Shield } from 'lucide-react';

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
        setError('Failed to query organization settings.');
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
      setMessage('Policy successfully updated and deployed.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update policy.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
        QUERYING TENANT POLICIES...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Organization Policy</h1>
          <p className="section-desc">Manage tenant-level operational rules, automated restock thresholds, and alert parameters</p>
        </div>
      </div>

      {message && (
        <div className="callout callout-success">
          <Check size={16} />
          <span>{message}</span>
        </div>
      )}
      {error && <div className="callout callout-danger">{error}</div>}

      <div className="panel" style={{ maxWidth: '640px' }}>
        <div className="panel-header">
          <div className="panel-title">
            <Shield size={16} color="var(--brand-primary)" />
            <span>Default Low-Stock Replenishment Rule</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.75rem' }}>
          <div className="field">
            <label className="field-label">GLOBAL THRESHOLD (UNITS ON HAND)</label>
            <input
              type="number"
              min="0"
              className="field-input"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              required
              style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', maxWidth: '180px' }}
            />
            <div className="field-helper" style={{ lineHeight: 1.6, marginTop: '0.65rem' }}>
              Whenever an active inventory SKU does not declare an individual threshold, this tenant-wide baseline triggers dashboard telemetry warnings and low-stock indicators.
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ marginTop: '0.5rem' }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving...' : 'Deploy Policy'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
