import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save, Check } from 'lucide-react';

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
      setMessage('Organization settings saved.');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading organization settings...</div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Organization Settings</h1>
          <p className="page-subtitle">Configure organization-level defaults and replenishment triggers</p>
        </div>
      </div>

      {message && (
        <div className="alert alert-success">
          <Check size={16} />
          <span>{message}</span>
        </div>
      )}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ maxWidth: '580px' }}>
        <div className="card-title">Default Replenishment Threshold</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Global Low Stock Threshold (Units)</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              required
            />
            <div className="form-helper">
              When a product does not have an individual threshold defined, this default value is used across the dashboard and inventory catalog to trigger low stock warnings.
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
            style={{ marginTop: '0.5rem' }}
          >
            <Save size={15} />
            <span>{saving ? 'Saving changes...' : 'Save Settings'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
