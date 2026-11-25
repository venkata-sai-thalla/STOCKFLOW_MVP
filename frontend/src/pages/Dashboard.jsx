import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowUpRight, ShieldCheck, AlertCircle, Sparkles, Layers, Box } from 'lucide-react';

const Dashboard = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/summary');
      setSummary(res.data);
    } catch (err) {
      setError('Failed to connect to telemetry stream.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '6rem 0', textAlign: 'center', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
        STREAMING INVENTORY TELEMETRY...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Telemetry & System Health</h1>
          <p className="section-desc">Real-time inventory levels, aggregate volume, and active replenishment flags</p>
        </div>
        <Link to="/products" className="btn btn-primary">
          <span>Manage Stock</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>

      {error && <div className="callout callout-danger">{error}</div>}

      <div className="bento-grid">
        <div className="bento-card">
          <div className="bento-header">
            <span className="bento-title">ACTIVE SKUS</span>
            <div className="bento-icon"><Box size={16} /></div>
          </div>
          <div className="bento-value">{summary?.total_products ?? 0}</div>
          <div className="bento-meta">Configured product items</div>
        </div>

        <div className="bento-card">
          <div className="bento-header">
            <span className="bento-title">AGGREGATE VOLUME</span>
            <div className="bento-icon" style={{ color: '#06b6d4' }}><Layers size={16} /></div>
          </div>
          <div className="bento-value">{summary?.total_quantity_on_hand ?? 0}</div>
          <div className="bento-meta">Physical units counted on hand</div>
        </div>

        <div className="bento-card" style={{ borderColor: summary?.low_stock_count > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)' }}>
          <div className="bento-header">
            <span className="bento-title" style={{ color: summary?.low_stock_count > 0 ? '#f59e0b' : 'var(--text-tertiary)' }}>
              REPLENISHMENT FLAGS
            </span>
            <div className="bento-icon" style={{ color: summary?.low_stock_count > 0 ? '#f59e0b' : 'var(--text-tertiary)' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="bento-value" style={{ color: summary?.low_stock_count > 0 ? '#fcd34d' : 'var(--text-pure)' }}>
            {summary?.low_stock_count ?? 0}
          </div>
          <div className="bento-meta">Items &le; threshold (Org default: {summary?.default_low_stock_threshold ?? 5})</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <Sparkles size={16} color="var(--brand-primary)" />
            <span>Low-Stock Replenishment Queue</span>
          </div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            AUTO-FILTER: QTY &le; THRESHOLD
          </span>
        </div>

        {summary?.low_stock_products?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <ShieldCheck size={40} color="#10b981" style={{ margin: '0 auto 0.85rem', opacity: 0.9 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-pure)', fontSize: '1rem', marginBottom: '0.25rem' }}>
              All Inventory Stocks Nominal
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Zero products require restock at the moment.
            </div>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>Product Entity</th>
                  <th style={{ width: '22%' }}>SKU Code</th>
                  <th style={{ width: '14%', textAlign: 'right' }}>On Hand</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Threshold</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary?.low_stock_products.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-pure)' }}>{item.name}</div>
                    </td>
                    <td>
                      <span className="mono-sku">{item.sku}</span>
                    </td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: '#fca5a5', fontFamily: 'var(--font-mono)' }}>
                      {item.quantity_on_hand}
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {item.effective_threshold}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="status-pill warning">REPLENISH</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
