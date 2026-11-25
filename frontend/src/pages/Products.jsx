import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Edit2, Trash2, ArrowUpDown, AlertCircle, CheckCircle2, Package } from 'lucide-react';

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
      setError('Failed to load products.');
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
        setSuccessMsg('Product updated successfully.');
      } else {
        await api.post('/products', payload);
        setSuccessMsg('Product created successfully.');
      }
      setIsFormOpen(false);
      fetchProducts(search);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save product.');
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
      setSuccessMsg(`Stock adjusted for ${adjustingProduct.name}.`);
      fetchProducts(search);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to adjust stock.');
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
      setSuccessMsg('Product deleted successfully.');
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
          <h1 className="section-title">Products</h1>
          <p className="section-desc">Manage your products, track quantities on hand, and adjust inventory</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          <span>Add Product</span>
        </button>
      </div>

      {successMsg && <div className="callout callout-success">{successMsg}</div>}
      {error && !isFormOpen && !isAdjustOpen && <div className="callout callout-danger">{error}</div>}

      <div className="panel">
        <div className="panel-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flex: 1, minWidth: '220px', maxWidth: '420px' }}>
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
              placeholder="Search by product name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
            TOTAL: {products.length} PRODUCTS
          </div>
        </div>

        {/* Desktop Data Table: Perfectly fitted column widths */}
        <div className="desktop-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '27%' }}>Product Name</th>
                <th style={{ width: '15%' }}>SKU</th>
                <th style={{ width: '11%', textAlign: 'right' }}>Quantity</th>
                <th style={{ width: '15%' }}>Status</th>
                <th style={{ width: '11%', textAlign: 'right' }}>Selling Price</th>
                <th style={{ width: '10%', textAlign: 'right' }}>Cost Price</th>
                <th style={{ width: '11%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-tertiary)' }}>
                    Loading products...
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                    <Package size={36} color="var(--text-tertiary)" style={{ margin: '0 auto 0.75rem', opacity: 0.5 }} />
                    <div style={{ color: 'var(--text-pure)', fontWeight: 600, fontSize: '0.95rem' }}>
                      {search ? 'No matching products found' : 'No products yet'}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                      {search ? 'Try checking your search terms.' : 'Click "Add Product" to create your first item.'}
                    </div>
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-pure)' }}>{p.name}</div>
                      {p.description && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.15rem' }}>
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
                        <span className="status-pill warning" title={`Low stock threshold: ${p.effective_threshold}`}>
                          <AlertCircle size={12} /> Low Stock (&le;{p.effective_threshold})
                        </span>
                      ) : (
                        <span className="status-pill success">
                          <CheckCircle2 size={12} /> In Stock
                        </span>
                      )}
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {p.selling_price !== null && p.selling_price !== undefined ? `$${parseFloat(p.selling_price).toFixed(2)}` : '—'}
                    </td>

                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      {p.cost_price !== null && p.cost_price !== undefined ? `$${parseFloat(p.cost_price).toFixed(2)}` : '—'}
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.35rem', justifyContent: 'flex-end' }}>
                        <button
                          onClick={() => handleOpenAdjust(p)}
                          className="btn btn-ghost btn-sm"
                          title="Adjust Stock (+/-)"
                        >
                          <ArrowUpDown size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenEdit(p)}
                          className="btn btn-ghost btn-sm"
                          title="Edit Product"
                        >
                          <Edit2 size={13} />
                        </button>
                        <button
                          onClick={() => handleOpenDelete(p)}
                          className="btn btn-danger btn-sm"
                          title="Delete Product"
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

        {/* Mobile Product Cards (Active on narrow viewports like 390px) */}
        <div className="mobile-cards-wrap">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-tertiary)' }}>
              Loading products...
            </div>
          ) : products.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <Package size={32} color="var(--text-tertiary)" style={{ margin: '0 auto 0.5rem', opacity: 0.5 }} />
              <div style={{ color: 'var(--text-pure)', fontWeight: 600, fontSize: '0.9rem' }}>
                {search ? 'No products match search' : 'No products found'}
              </div>
            </div>
          ) : (
            products.map((p) => (
              <div key={p.id} className="mobile-product-card">
                <div className="mobile-card-header">
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-pure)', fontSize: '0.95rem' }}>{p.name}</div>
                    <span className="mono-sku" style={{ marginTop: '0.25rem' }}>{p.sku}</span>
                  </div>
                  <div>
                    {p.is_low_stock ? (
                      <span className="status-pill warning">
                        Low Stock (&le;{p.effective_threshold})
                      </span>
                    ) : (
                      <span className="status-pill success">
                        In Stock
                      </span>
                    )}
                  </div>
                </div>

                <div className="mobile-card-grid">
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.725rem' }}>ON HAND</span>
                    <div style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', color: p.is_low_stock ? '#fca5a5' : 'var(--text-pure)' }}>
                      {p.quantity_on_hand} units
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.725rem' }}>THRESHOLD</span>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
                      {p.effective_threshold} units
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.725rem' }}>SELLING PRICE</span>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                      {p.selling_price !== null && p.selling_price !== undefined ? `$${parseFloat(p.selling_price).toFixed(2)}` : '—'}
                    </div>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-tertiary)', fontSize: '0.725rem' }}>COST PRICE</span>
                    <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>
                      {p.cost_price !== null && p.cost_price !== undefined ? `$${parseFloat(p.cost_price).toFixed(2)}` : '—'}
                    </div>
                  </div>
                </div>

                <div className="mobile-card-actions">
                  <button
                    onClick={() => handleOpenAdjust(p)}
                    className="btn btn-ghost btn-sm"
                  >
                    <ArrowUpDown size={13} />
                    <span>Adjust</span>
                  </button>
                  <button
                    onClick={() => handleOpenEdit(p)}
                    className="btn btn-ghost btn-sm"
                  >
                    <Edit2 size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleOpenDelete(p)}
                    className="btn btn-danger btn-sm"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Product Create/Edit Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-dialog-header">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-pure)' }}>
                {editingProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--text-tertiary)' }}
              >
                &times;
              </button>
            </div>

            {error && <div className="callout callout-danger" style={{ margin: '1rem 1.35rem 0' }}>{error}</div>}

            <form onSubmit={handleSaveProduct}>
              <div className="modal-dialog-body">
                <div className="field">
                  <label className="field-label">Product Name *</label>
                  <input
                    type="text"
                    className="field-input"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ergonomic Keyboard"
                  />
                </div>

                <div className="field">
                  <label className="field-label">SKU (Unique Code) *</label>
                  <input
                    type="text"
                    className="field-input"
                    required
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    placeholder="e.g. KB-ERG-01"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                  <div className="field-helper">SKU must be unique in your organization.</div>
                </div>

                <div className="field">
                  <label className="field-label">Description (Optional)</label>
                  <textarea
                    className="field-textarea"
                    rows="2"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Add notes, specifications, or details..."
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="field">
                    <label className="field-label">Quantity on Hand *</label>
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
                    <label className="field-label">Low Stock Threshold</label>
                    <input
                      type="number"
                      min="0"
                      className="field-input"
                      placeholder="Uses org default if empty"
                      value={formData.low_stock_threshold}
                      onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                  <div className="field">
                    <label className="field-label">Selling Price ($)</label>
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
                    <label className="field-label">Cost Price ($)</label>
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
                  {editingProduct ? 'Save Changes' : 'Create Product'}
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
                Adjust Stock: {adjustingProduct?.name}
              </h2>
              <button
                onClick={() => setIsAdjustOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.4rem', color: 'var(--text-tertiary)' }}
              >
                &times;
              </button>
            </div>

            {error && <div className="callout callout-danger" style={{ margin: '1rem 1.35rem 0' }}>{error}</div>}

            <form onSubmit={handleSaveAdjust}>
              <div className="modal-dialog-body">
                <div style={{ background: 'var(--bg-surface-subtle)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', marginBottom: '1.15rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current stock on hand:</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399', fontSize: '1rem' }}>
                    {adjustingProduct?.quantity_on_hand} units
                  </span>
                </div>

                <div className="field">
                  <label className="field-label">Change Quantity (+/-)</label>
                  <input
                    type="number"
                    className="field-input"
                    required
                    value={adjustData.adjustment}
                    onChange={(e) => setAdjustData({ ...adjustData, adjustment: e.target.value })}
                    placeholder="e.g. +10 or -5"
                    style={{ fontFamily: 'var(--font-mono)' }}
                  />
                  <div className="field-helper">Positive values add units; negative values deduct units.</div>
                </div>

                <div className="field">
                  <label className="field-label">Reason / Note (Optional)</label>
                  <input
                    type="text"
                    className="field-input"
                    value={adjustData.note}
                    onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
                    placeholder="e.g. Supplier delivery, Damaged stock"
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
                  Save Stock Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Dialog */}
      {isDeleteOpen && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-dialog-header">
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fca5a5' }}>
                Delete Product
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
                Are you sure you want to delete <strong style={{ color: 'var(--text-pure)' }}>{deletingProduct?.name}</strong> (SKU: <span className="mono-sku">{deletingProduct?.sku}</span>)?
                This action cannot be undone.
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
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
