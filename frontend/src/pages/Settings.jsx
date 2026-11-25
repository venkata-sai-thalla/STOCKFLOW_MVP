import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Save } from 'lucide-react';

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
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading organization settings...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Organization Settings</h1>
          <p className="page-subtitle">Configure organization-wide defaults and thresholds</p>
        </div>
      </div>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-title">Low Stock Threshold Configuration</div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Default Low Stock Threshold</label>
            <input
              type="number"
              min="0"
              className="form-input"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              required
            />
            <div className="form-helper">
              If a product does not have its own threshold explicitly configured, this organization default value is used to trigger low-stock alerts on the dashboard and product catalog.
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Settings;
