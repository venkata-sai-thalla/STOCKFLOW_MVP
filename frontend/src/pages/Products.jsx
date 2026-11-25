import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Edit2, Trash2, Sliders, AlertCircle, CheckCircle, Package } from 'lucide-react';

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
      setError('Failed to fetch products.');
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
      setSuccessMsg(`Stock updated for ${adjustingProduct.name}.`);
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
      setSuccessMsg('Product deleted.');
      fetchProducts(search);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to delete product.');
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Inventory</h1>
          <p className="page-subtitle">Track, update, and manage inventory levels across your organization</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && !isFormOpen && !isAdjustOpen && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ marginBottom: '1.25rem', padding: '0.85rem 1.15rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            style={{ border: 'none', padding: '0.4rem', outline: 'none', background: 'transparent' }}
            placeholder="Search products by Name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th style={{ width: '26%' }}>Product Name</th>
              <th style={{ width: '15%' }}>SKU</th>
              <th style={{ width: '11%', textAlign: 'right' }}>Qty on Hand</th>
              <th style={{ width: '16%' }}>Stock Status</th>
              <th style={{ width: '11%', textAlign: 'right' }}>Selling Price</th>
              <th style={{ width: '10%', textAlign: 'right' }}>Cost Price</th>
              <th style={{ width: '11%', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                  Loading catalog...
                </td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                  <Package size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                  <div style={{ fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                    {search ? 'No matching products found' : 'No products in inventory yet'}
                  </div>
                  <div>{search ? 'Try adjusting your search query' : 'Click "Add Product" above to create your first item.'}</div>
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  {/* Column 1: Product Name & Description */}
                  <td>
                    <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '320px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '0.15rem' }}>
                        {p.description}
                      </div>
                    )}
                  </td>

                  {/* Column 2: SKU */}
                  <td>
                    <code className="sku-badge">{p.sku}</code>
                  </td>

                  {/* Column 3: Quantity on Hand */}
                  <td style={{ textAlign: 'right', fontWeight: 600, fontVariantNumeric: 'tabular-nums', fontSize: '0.925rem' }}>
                    {p.quantity_on_hand}
                  </td>

                  {/* Column 4: Stock Status */}
                  <td>
                    {p.is_low_stock ? (
                      <span className="badge badge-warning" title={`Threshold: ${p.effective_threshold}`}>
                        <AlertCircle size={13} /> Low Stock (&le; {p.effective_threshold})
                      </span>
                    ) : (
                      <span className="badge badge-success">
                        <CheckCircle size={13} /> In Stock
                      </span>
                    )}
                  </td>

                  {/* Column 5: Selling Price */}
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-main)' }}>
                    {p.selling_price !== null && p.selling_price !== undefined ? `$${parseFloat(p.selling_price).toFixed(2)}` : '—'}
                  </td>

                  {/* Column 6: Cost Price */}
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums', color: 'var(--text-muted)' }}>
                    {p.cost_price !== null && p.cost_price !== undefined ? `$${parseFloat(p.cost_price).toFixed(2)}` : '—'}
                  </td>

                  {/* Column 7: Actions */}
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleOpenAdjust(p)}
                        className="btn btn-secondary btn-sm"
                        title="Quick Stock Adjustment (+/-)"
                      >
                        <Sliders size={13} />
                        Adjust
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="btn btn-secondary btn-sm"
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

      {/* Product Create/Edit Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => setIsFormOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.35rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <form onSubmit={handleSaveProduct}>
              <div className="form-group">
                <label className="form-label">Product Name *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Ergonomic Office Chair"
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU (Unique Identifier) *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. CHR-ERG-01"
                />
                <div className="form-helper">Stock Keeping Unit must be unique within your organization.</div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Add product specifications or notes..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Quantity on Hand *</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    required
                    value={formData.quantity_on_hand}
                    onChange={(e) => setFormData({ ...formData, quantity_on_hand: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Low Stock Threshold</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    placeholder="Uses org default if empty"
                    value={formData.low_stock_threshold}
                    onChange={(e) => setFormData({ ...formData, low_stock_threshold: e.target.value })}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="form-group">
                  <label className="form-label">Selling Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.selling_price}
                    onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cost Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="0.00"
                    value={formData.cost_price}
                    onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="btn btn-secondary"
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
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700' }}>
                Adjust Stock: {adjustingProduct?.name}
              </h2>
              <button
                onClick={() => setIsAdjustOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.35rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Current stock on hand: <strong style={{ color: 'var(--text-main)' }}>{adjustingProduct?.quantity_on_hand}</strong> units.
            </p>

            <form onSubmit={handleSaveAdjust}>
              <div className="form-group">
                <label className="form-label">Stock Change (+/-)</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  value={adjustData.adjustment}
                  onChange={(e) => setAdjustData({ ...adjustData, adjustment: e.target.value })}
                  placeholder="e.g. +10 or -5"
                />
                <div className="form-helper">
                  Positive values add units to inventory; negative values deduct units.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Reason / Reference Note (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={adjustData.note}
                  onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
                  placeholder="e.g. Restocked batch #42, Damaged in transit"
                />
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Confirm Stock Change
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {isDeleteOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--danger-text)' }}>
                Delete Product
              </h2>
              <button
                onClick={() => setIsDeleteOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.35rem', color: 'var(--text-muted)' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', lineHeight: '1.5', marginBottom: '1.5rem', color: 'var(--text-main)' }}>
              Are you sure you want to permanently delete <strong>{deletingProduct?.name}</strong> (SKU: <code>{deletingProduct?.sku}</code>)?
              This action cannot be undone.
            </p>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setIsDeleteOpen(false)}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="btn btn-danger"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
