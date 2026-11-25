import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Edit3, Trash2, ArrowUpDown, ShieldAlert, CheckCircle2, Box } from 'lucide-react';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selected product & form data
  const [editingProduct, setEditingProduct] = useState(null);
  const [adjustingProduct, setAdjustingProduct] = useState(null);
  const [deletingProduct, setDeletingProduct] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    quantity_on_hand: 0,
    cost_price: '',
    selling_price: '',
    low_stock_threshold: '',
  });

  const [adjustData, setAdjustData] = useState({
    adjustment: 0,
    note: '',
  });

  const fetchProducts = async (searchTerm = '') => {
    try {
      setLoading(true);
      const url = searchTerm ? `/products?search=${encodeURIComponent(searchTerm)}` : '/products';
      const res = await api.get(url);
      setProducts(res.data);
    } catch (err) {
      setError('Failed to fetch inventory catalog.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchProducts(search);
    }, 250);
    return () => clearTimeout(delayDebounceFn);
  }, [search]);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      sku: '',
      description: '',
      quantity_on_hand: 0,
      cost_price: '',
      selling_price: '',
      low_stock_threshold: '',
    });
    setError('');
    setIsFormOpen(true);
  };

  const handleOpenEdit = (p) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      description: p.description || '',
      quantity_on_hand: p.quantity_on_hand,
      cost_price: p.cost_price !== null && p.cost_price !== undefined ? p.cost_price : '',
      selling_price: p.selling_price !== null && p.selling_price !== undefined ? p.selling_price : '',
      low_stock_threshold: p.low_stock_threshold !== null && p.low_stock_threshold !== undefined ? p.low_stock_threshold : '',
    });
    setError('');
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: formData.name.trim(),
      sku: formData.sku.trim(),
      description: formData.description ? formData.description.trim() : null,
      quantity_on_hand: parseInt(formData.quantity_on_hand, 10) || 0,
      cost_price: formData.cost_price !== '' ? parseFloat(formData.cost_price) : null,
      selling_price: formData.selling_price !== '' ? parseFloat(formData.selling_price) : null,
      low_stock_threshold: formData.low_stock_threshold !== '' ? parseInt(formData.low_stock_threshold, 10) : null,
    };

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, payload);
        setSuccessMsg('Product specification updated.');
      } else {
        await api.post('/products', payload);
        setSuccessMsg('New SKU successfully cataloged.');
      }
      setIsFormOpen(false);
      fetchProducts(search);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to persist product.');
    }
  };

  const handleOpenAdjust = (p) => {
    setAdjustingProduct(p);
    setAdjustData({ adjustment: 0, note: '' });
    setError('');
    setIsAdjustOpen(true);
  };

  const handleSaveAdjust = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post(`/products/${adjustingProduct.id}/adjust-stock`, {
        adjustment: parseInt(adjustData.adjustment, 10),
        note: adjustData.note ? adjustData.note.trim() : null,
      });
      setIsAdjustOpen(false);
      setSuccessMsg(`Inventory count updated for ${adjustingProduct.name}.`);
      fetchProducts(search);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to modify stock.');
    }
  };

  const handleOpenDelete = (p) => {
    setDeletingProduct(p);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    try {
      await api.delete(`/products/${deletingProduct.id}`);
      setIsDeleteOpen(false);
      setSuccessMsg('Product purged from catalog.');
      fetchProducts(search);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to delete product.');
    }
  };

  return (
    <div className="fade-in">
      <div className="section-header">
        <div>
          <h1 className="section-title">Inventory Catalog</h1>
          <p className="section-desc">Manage physical inventory counts, SKU codes, pricing, and individual threshold policies</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          <span>New Product</span>
        </button>
      </div>

      {successMsg && <div className="callout callout-success">{successMsg}</div>}
      {error && !isFormOpen && !isAdjustOpen && <div className="callout callout-danger">{error}</div>}

      <div className="panel">
        <div className="panel-header" style={{ padding: '0.85rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, maxWidth: '420px' }}>
            <Search size={16} color="var(--text-tertiary)" />
            <input
              type="text"
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-pure)',
                outline: 'none',
                width: '100%',
                fontSize: '0.85rem',
                fontFamily: 'inherit'
              }}
              placeholder="Filter by product title or SKU identifier..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            COUNT: {products.length} ENTITIES
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '28%' }}>Product Name</th>
                <th style={{ width: '16%' }}>SKU Identifier</th>
                <th style={{ width: '12%', textAlign: 'right' }}>On Hand</th>
                <th style={{ width: '15%' }}>Condition</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Selling ($)</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Cost ($)</th>
                <th style={{ width: '9%', textAlign: 'right' }}>Operations</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    SYNCHRONIZING ENTITY DATA...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                    <Box size={38} color="var(--text-tertiary)" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <div style={{ color: 'var(--text-pure)', fontWeight: 600, fontSize: '0.95rem' }}>
                      {search ? 'Zero query matches found' : 'No catalog items registered'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {search ? 'Try checking for typographical errors.' : 'Create a product to populate your inventory.'}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-pure)' }}>{p.name}</div>
                      {p.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.15rem' }}>
                          {p.description}
                        </div>
                      )}
                    </td>

                    <td>
                      <span className="mono-sku">{p.sku}</span>
                    </td>

                    <td style={{ textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: '0.9rem', color: p.is_low_stock ? '#fca5a5' : 'var(--text-pure)' }}>
                      {p.quantity_on_hand}
                    </td>

                    <td>
                      {p.is_low_stock ? (
                        <span className="status-pill warning" title={`Threshold: ${p.effective_threshold}`}>
                          <ShieldAlert size={12} /> LOW STOCK (&le;{p.effective_threshold})
                        </span>
                      ) : (
                        <span className="status-pill success">
                          <CheckCircle2 size={12} /> NOMINAL
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {p.selling_price !== null && p.selling_price !== undefined ? parseFloat(p.selling_price).toFixed(2) : '—'}
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      {p.cost_price !== null && p.cost_price !== undefined ? parseFloat(p.cost_price).toFixed(2) : '—'}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="btn btn-ghost btn-sm"
                          title="Stock Count Increment/Decrement"
                        >
                          <ArrowUpDown size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="btn btn-ghost btn-sm"
                          title="Edit Product"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(p)}
                          className="btn btn-danger btn-sm"
                          title="Purge Product"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Product Create/Edit Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-dialog-header">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-pure)' }}>
                {editingProduct ? 'Edit Product Entity' : 'New Product Registration'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--text-tertiary)' }}
              >
                &times;
              </button>
            </div>

            {error && <div className="callout callout-danger" style={{ margin: '1rem 1.5rem 0' }}>{error}</div>}

            <form onSubmit={handleSaveProduct}>
              <div className="modal-dialog-body">
                <div className="field">
                  <label className="field-label">PRODUCT TITLE *</label>
                  <input
                    type="text"
                    className="field-input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ergonomic Keyboard Stand"
                  />
                </div>

                <div className="field">
                  <label className="field-label">SKU IDENTIFIER *</label>
                  <input
                    type="text"
                    className="field-input"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. EKS-BLK-01"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                  <div className="field-helper">Unique stock identifier within your organization.</div>
                </div>

                <div className="field">
                  <label className="field-label">DESCRIPTION (OPTIONAL)</label>
                  <textarea
                    className="field-textarea"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add specifications or inventory batch references..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="field">
                    <label className="field-label">STARTING QUANTITY *</label>
                    <input
                      type="number"
                      min="0"
                      className="field-input"
                      required
                      value={formData.quantity_on_hand}
                      onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">CUSTOM THRESHOLD</label>
                    <input
                      type="number"
                      min="0"
                      className="field-input"
                      placeholder="Default if empty"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="field">
                    <label className="field-label">SELLING PRICE ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="field-input"
                      placeholder="0.00"
                      value={formData.selling_price}
                      onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div className="field">
                    <label className="field-label">UNIT COST ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="field-input"
                      placeholder="0.00"
                      value={formData.cost_price}
                      onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-dialog-footer">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingProduct ? 'Commit Changes' : 'Register SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {isAdjustOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-dialog-header">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-pure)' }}>
                Adjust Count: {adjustingProduct?.name}
              </h2>
              <button
                onClick={() => setIsAdjustOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--text-tertiary)' }}
              >
                &times;
              </button>
            </div>

            {error && <div className="callout callout-danger" style={{ margin: '1rem 1.5rem 0' }}>{error}</div>}

            <form onSubmit={handleSaveAdjust}>
              <div className="modal-dialog-body">
                <div style={{ background: 'var(--bg-surface-subtle)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current on-hand inventory:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399', fontSize: '1rem' }}>
                    {adjustingProduct?.quantity_on_hand} units
                  </span>
                </div>

                <div className="field">
                  <label className="field-label">UNITS ADJUSTMENT (+/-)</label>
                  <input
                    type="number"
                    className="field-input"
                    required
                    value={adjustData.adjustment}
                    onChange={(e) => setAdjustData({ ...adjustData, adjustment: e.target.value })}
                    placeholder="e.g. +10 or -5"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                  <div className="field-helper">Enter positive integers to restock or negative integers to write off.</div>
                </div>

                <div className="field">
                  <label className="field-label">AUDIT REASON (OPTIONAL)</label>
                  <input
                    type="text"
                    className="field-input"
                    value={adjustData.note}
                    onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
                    placeholder="e.g. Inbound shipment #812, Damaged inventory"
                  />
                </div>
              </div>

              <div className="modal-dialog-footer">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Apply Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-dialog-header">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>
                Confirm SKU Purge
              </h2>
              <button
                onClick={() => setIsDeleteOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--text-tertiary)' }}
              >
                &times;
              </button>
            </div>

            <div className="modal-dialog-body">
              <p style={{ fontSize: '0.875rem', lineHeight: 1.6, color: 'var(--text-secondary)' }}>
                Are you sure you want to permanently delete <strong style={{ color: 'var(--text-pure)' }}>{deletingProduct?.name}</strong> (<span className="mono-sku">{deletingProduct?.sku}</span>)?
                This action is irreversible and purges all recorded stock on hand.
              </p>
            </div>

            <div className="modal-dialog-footer">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="btn btn-ghost"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-danger"
              >
                Purge Record
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
