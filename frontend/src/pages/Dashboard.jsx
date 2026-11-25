import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { ArrowUpRight, CheckCircle2, AlertCircle, Package, Layers } from 'lucide-react';

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
      <div style={{ padding: '5rem 0', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        Loading dashboard summary...
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Dashboard</h1>
          <p className="section-desc">Overview of your inventory counts and low-stock warnings</p>
        </div>
        <Link to="/products" className="btn btn-primary">
          <span>Manage Products</span>
          <ArrowUpRight size={16} />
        </Link>
      </div>

      {error && <div className="callout callout-danger">{error}</div>}

      <div className="bento-grid">
        <div className="bento-card">
          <div className="bento-header">
            <span className="bento-title">TOTAL PRODUCTS</span>
            <div className="bento-icon"><Package size={16} /></div>
          </div>
          <div className="bento-value">{summary?.total_products ?? 0}</div>
          <div className="bento-meta">Products in catalog</div>
        </div>

        <div className="bento-card">
          <div className="bento-header">
            <span className="bento-title">TOTAL QUANTITY</span>
            <div className="bento-icon" style={{ color: '#06b6d4' }}><Layers size={16} /></div>
          </div>
          <div className="bento-value">{summary?.total_quantity_on_hand ?? 0}</div>
          <div className="bento-meta">Total units in stock</div>
        </div>

        <div className="bento-card" style={{ borderColor: summary?.low_stock_count > 0 ? 'rgba(245, 158, 11, 0.4)' : 'var(--border-subtle)' }}>
          <div className="bento-header">
            <span className="bento-title" style={{ color: summary?.low_stock_count > 0 ? '#f59e0b' : 'var(--text-tertiary)' }}>
              LOW STOCK ITEMS
            </span>
            <div className="bento-icon" style={{ color: summary?.low_stock_count > 0 ? '#f59e0b' : 'var(--text-tertiary)' }}>
              <AlertCircle size={16} />
            </div>
          </div>
          <div className="bento-value" style={{ color: summary?.low_stock_count > 0 ? '#fcd34d' : 'var(--text-pure)' }}>
            {summary?.low_stock_count ?? 0}
          </div>
          <div className="bento-meta">Units &le; threshold (Org default: {summary?.default_low_stock_threshold ?? 5})</div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div className="panel-title">
            <AlertCircle size={16} color="var(--brand-primary)" />
            <span>Low Stock Items</span>
          </div>
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            QUANTITY &le; THRESHOLD
          </span>
        </div>

        {summary?.low_stock_products?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
            <CheckCircle2 size={36} color="#10b981" style={{ margin: '0 auto 0.75rem', opacity: 0.9 }} />
            <div style={{ fontWeight: 600, color: 'var(--text-pure)', fontSize: '0.95rem', marginBottom: '0.25rem' }}>
              All inventory levels are healthy
            </div>
            <div style={{ color: 'var(--text-secondary)', fontSize: '0.825rem' }}>
              No products are currently at or below their low stock threshold.
            </div>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="desktop-table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '40%' }}>Product Name</th>
                    <th style={{ width: '22%' }}>SKU</th>
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
                        <span className="status-pill warning">Low Stock</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards View */}
            <div className="mobile-cards-wrap">
              {summary?.low_stock_products.map((item) => (
                <div key={item.id} className="mobile-product-card">
                  <div className="mobile-card-header">
                    <div>
                      <div style={{ fontWeight: 600, color: 'var(--text-pure)' }}>{item.name}</div>
                      <span className="mono-sku" style={{ marginTop: '0.25rem' }}>{item.sku}</span>
                    </div>
                    <span className="status-pill warning">Low Stock</span>
                  </div>
                  <div className="mobile-card-grid">
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.725rem' }}>ON HAND</span>
                      <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fca5a5' }}>
                        {item.quantity_on_hand} units
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-tertiary)', fontSize: '0.725rem' }}>THRESHOLD</span>
                      <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                        {item.effective_threshold} units
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
