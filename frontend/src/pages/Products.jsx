import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Plus, Search, Edit2, Trash2, Sliders, AlertCircle, CheckCircle } from 'lucide-react';

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
    }, 300);
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
      cost_price: p.cost_price !== null ? p.cost_price : '',
      selling_price: p.selling_price !== null ? p.selling_price : '',
      low_stock_threshold: p.low_stock_threshold !== null ? p.low_stock_threshold : '',
    });
    setError('');
    setIsFormOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    setError('');

    const payload = {
      name: formData.name,
      sku: formData.sku,
      description: formData.description || null,
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
        note: adjustData.note || null,
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
      setSuccessMsg('Product deleted.');
      fetchProducts(search);
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      setError('Failed to delete product.');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Products & Inventory</h1>
          <p className="page-subtitle">Track, update and control stock across your catalog</p>
        </div>
        <button onClick={handleOpenCreate} className="btn btn-primary">
          <Plus size={16} />
          Add Product
        </button>
      </div>

      {successMsg && <div className="alert alert-success">{successMsg}</div>}
      {error && !isFormOpen && !isAdjustOpen && <div className="alert alert-danger">{error}</div>}

      <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Search size={18} color="var(--text-muted)" />
          <input
            type="text"
            className="form-input"
            style={{ border: 'none', padding: '0.4rem', outline: 'none' }}
            placeholder="Search by product name or SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>SKU</th>
              <th>Qty on Hand</th>
              <th>Status</th>
              <th>Selling Price</th>
              <th>Cost Price</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>Loading products...</td>
              </tr>
            ) : products.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
                  No products found. Click "Add Product" to create your first item.
                </td>
              </tr>
            ) : (
              products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: '600' }}>{p.name}</div>
                    {p.description && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', maxWidth: '240px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {p.description}
                      </div>
                    )}
                  </td>
                  <td><code>{p.sku}</code></td>
                  <td style={{ fontWeight: '600' }}>{p.quantity_on_hand}</td>
                  <td>
                    {p.is_low_stock ? (
                      <span className="badge badge-warning">
                        <AlertCircle size={12} /> Low Stock (&le; {p.effective_threshold})
                      </span>
                    ) : (
                      <span className="badge badge-success">
                        <CheckCircle size={12} /> In Stock
                      </span>
                    )}
                  </td>
                  <td>{p.selling_price !== null ? `$${parseFloat(p.selling_price).toFixed(2)}` : '—'}</td>
                  <td>{p.cost_price !== null ? `$${parseFloat(p.cost_price).toFixed(2)}` : '—'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleOpenAdjust(p)}
                        className="btn btn-secondary btn-sm"
                        title="Adjust Stock (+/-)"
                      >
                        <Sliders size={14} />
                        Adjust
                      </button>
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="btn btn-secondary btn-sm"
                        title="Edit Product"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(p)}
                        className="btn btn-danger btn-sm"
                        title="Delete Product"
                      >
                        <Trash2 size={14} />
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
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
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
                  placeholder="e.g. Wireless Mouse"
                />
              </div>

              <div className="form-group">
                <label className="form-label">SKU (Unique per Org) *</label>
                <input
                  type="text"
                  className="form-input"
                  required
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="e.g. WM-100"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <textarea
                  className="form-textarea"
                  rows="2"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Short description..."
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
                    placeholder="Leave empty for org default"
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
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            {error && <div className="alert alert-danger">{error}</div>}

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Current stock: <strong>{adjustingProduct?.quantity_on_hand}</strong> units.
            </p>

            <form onSubmit={handleSaveAdjust}>
              <div className="form-group">
                <label className="form-label">Units to Add or Subtract (+/-)</label>
                <input
                  type="number"
                  className="form-input"
                  required
                  value={adjustData.adjustment}
                  onChange={(e) => setAdjustData({ ...adjustData, adjustment: e.target.value })}
                  placeholder="e.g. 10 or -5"
                />
                <div className="form-helper">
                  Use positive numbers to add stock, negative to reduce.
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Note / Reason (Optional)</label>
                <input
                  type="text"
                  className="form-input"
                  value={adjustData.note}
                  onChange={(e) => setAdjustData({ ...adjustData, note: e.target.value })}
                  placeholder="e.g. Supplier delivery, damaged goods"
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
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {isDeleteOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'var(--danger-text)' }}>
                Delete Product
              </h2>
              <button
                onClick={() => setIsDeleteOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                &times;
              </button>
            </div>

            <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              Are you sure you want to delete <strong>{deletingProduct?.name}</strong> (SKU: {deletingProduct?.sku})?
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
                Yes, Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
