import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { Package, AlertTriangle, Layers, ArrowRight } from 'lucide-react';

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
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading dashboard summary...</div>;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard Overview</h1>
          <p className="page-subtitle">Summary of your organization's inventory health</p>
        </div>
        <Link to="/products" className="btn btn-primary">
          Manage Products
          <ArrowRight size={16} />
        </Link>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: 'var(--primary-light)', color: 'var(--primary)' }}>
            <Package size={24} />
          </div>
          <div>
            <div className="stat-value">{summary?.total_products ?? 0}</div>
            <div className="stat-label">Total Products</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: '#f0fdf4', color: '#16a34a' }}>
            <Layers size={24} />
          </div>
          <div>
            <div className="stat-value">{summary?.total_quantity_on_hand ?? 0}</div>
            <div className="stat-label">Total Units on Hand</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ backgroundColor: summary?.low_stock_count > 0 ? 'var(--warning-light)' : '#f8fafc', color: summary?.low_stock_count > 0 ? 'var(--warning-text)' : 'var(--text-muted)' }}>
            <AlertTriangle size={24} />
          </div>
          <div>
            <div className="stat-value">{summary?.low_stock_count ?? 0}</div>
            <div className="stat-label">Low Stock Alerts</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="var(--warning)" />
            <span>Low Stock Items (Qty &le; Threshold)</span>
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
            Default Threshold: {summary?.default_low_stock_threshold ?? 5} units
          </span>
        </div>

        {summary?.low_stock_products?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: '500', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
              All stocks are healthy
            </div>
            No products are currently at or below their low stock threshold.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product Name</th>
                  <th>SKU</th>
                  <th>Quantity on Hand</th>
                  <th>Threshold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summary?.low_stock_products.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: '600' }}>{item.name}</td>
                    <td><code>{item.sku}</code></td>
                    <td style={{ fontWeight: '700', color: 'var(--danger-text)' }}>
                      {item.quantity_on_hand}
                    </td>
                    <td>{item.effective_threshold}</td>
                    <td>
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
