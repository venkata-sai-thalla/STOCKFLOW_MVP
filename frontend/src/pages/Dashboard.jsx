import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Package, AlertTriangle, Layers, ArrowRight, CheckCircle2 } from 'lucide-react';

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
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading dashboard metrics...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Real-time status of your catalog, stock levels, and replenishment alerts</p>
        </div>
        <Link to="/products" className="btn btn-primary">
          <span>Manage Products</span>
          <ArrowRight size={15} />
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Package size={22} />
          </div>
          <div>
            <div className="stat-value">{summary?.total_products ?? 0}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--success-light)', color: 'var(--success)' }}>
            <Layers size={22} />
          </div>
          <div>
            <div className="stat-value">{summary?.total_quantity_on_hand ?? 0}</div>
            <div className="stat-label">Total Units on Hand</div>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              backgroundColor: summary?.low_stock_count > 0 ? 'var(--warning-light)' : 'var(--bg-subtle)',
              color: summary?.low_stock_count > 0 ? 'var(--warning-text)' : 'var(--text-muted)',
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="stat-value">{summary?.low_stock_count ?? 0}</div>
            <div className="stat-label">Low Stock Alerts</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertTriangle size={18} color="var(--warning)" />
            <span>Low Stock Items (Qty &le; Threshold)</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            Org Default Threshold: <strong>{summary?.default_low_stock_threshold ?? 5}</strong> units
          </span>
        </div>

        {summary?.low_stock_products?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
            <CheckCircle2 size={36} color="var(--success)" style={{ margin: '0 auto 0.75rem', opacity: 0.8 }} />
            <div style={{ fontSize: '1rem', fontWeight: '600', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              All Inventory Healthy
            </div>
            <div>No products are currently at or below their low stock threshold.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '38%' }}>Product Name</th>
                  <th style={{ width: '22%' }}>SKU</th>
                  <th style={{ width: '15%', textAlign: 'right' }}>Qty on Hand</th>
                  <th style={{ width: '13%', textAlign: 'right' }}>Threshold</th>
                  <th style={{ width: '12%', textAlign: 'right' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary?.low_stock_products.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-main)' }}>{item.name}</td>
                    <td><code className="sku-badge">{item.sku}</code></td>
                    <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--danger-text)', fontVariantNumeric: 'tabular-nums' }}>
                      {item.quantity_on_hand}
                    </td>
                    <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                      {item.effective_threshold}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-warning">Low Stock</span>
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
