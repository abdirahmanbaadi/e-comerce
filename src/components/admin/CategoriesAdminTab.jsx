import { useCallback, useEffect, useState } from 'react';
import { apiUrl } from '../../utils/data';
import { showTopFloatNotification } from '../../utils/notifications';

const EMPTY_FORM = { name: '', description: '', image: '', order: 0, active: true };

export default function CategoriesAdminTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const token = () => localStorage.getItem('token');
  const authHeaders = () => ({
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token()}`,
  });

  const loadCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(apiUrl('/api/categories/all'), { headers: authHeaders() });
      const data = await res.json();
      if (data.success) setCategories(data.categories || []);
    } catch {
      showTopFloatNotification('Failed to load categories.', 'danger');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const resetForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (cat) => {
    setEditingId(cat.id);
    setForm({
      name: cat.name || '',
      description: cat.description || '',
      image: cat.image || '',
      order: cat.order || 0,
      active: cat.active !== false,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showTopFloatNotification('Category name is required.', 'danger');
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? apiUrl(`/api/categories/${editingId}`)
        : apiUrl('/api/categories');
      const res = await fetch(url, {
        method: editingId ? 'PUT' : 'POST',
        headers: authHeaders(),
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification(editingId ? 'Category updated.' : 'Category created.');
        resetForm();
        loadCategories();
      } else {
        showTopFloatNotification(data.message || 'Save failed.', 'danger');
      }
    } catch {
      showTopFloatNotification('Could not save category.', 'danger');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this category?')) return;
    try {
      const res = await fetch(apiUrl(`/api/categories/${id}`), {
        method: 'DELETE',
        headers: authHeaders(),
      });
      const data = await res.json();
      if (data.success) {
        showTopFloatNotification('Category deleted.');
        loadCategories();
      }
    } catch {
      showTopFloatNotification('Delete failed.', 'danger');
    }
  };

  return (
    <div className="admin-card p-4">
      <h3 className="card-title mb-4">
        <i className="fa-solid fa-layer-group me-2" />
        Product Categories
      </h3>

      <form className="row g-3 mb-4" onSubmit={handleSubmit}>
        <div className="col-md-4">
          <label className="admin-form-label">Name</label>
          <input
            className="admin-input w-100"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Living Room"
          />
        </div>
        <div className="col-md-4">
          <label className="admin-form-label">Image path (optional)</label>
          <input
            className="admin-input w-100"
            value={form.image}
            onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
            placeholder="living-room/hero.png"
          />
        </div>
        <div className="col-md-2">
          <label className="admin-form-label">Sort order</label>
          <input
            type="number"
            className="admin-input w-100"
            value={form.order}
            onChange={(e) => setForm((f) => ({ ...f, order: Number(e.target.value) }))}
          />
        </div>
        <div className="col-md-2 d-flex align-items-end">
          <label className="d-flex align-items-center gap-2 mb-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active
          </label>
        </div>
        <div className="col-12">
          <label className="admin-form-label">Description</label>
          <textarea
            className="admin-input w-100"
            rows={2}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
          />
        </div>
        <div className="col-12 d-flex gap-2">
          <button type="submit" className="admin-btn admin-btn--primary" disabled={saving}>
            {saving ? 'Saving…' : editingId ? 'Update Category' : 'Add Category'}
          </button>
          {editingId && (
            <button type="button" className="admin-btn admin-btn--secondary" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {loading ? (
        <p className="text-muted">Loading categories…</p>
      ) : (
        <div className="table-responsive">
          <table className="admin-table w-100">
            <thead>
              <tr>
                <th>Name</th>
                <th>Slug</th>
                <th>Order</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">
                    No categories yet.
                  </td>
                </tr>
              )}
              {categories.map((cat) => (
                <tr key={cat.id}>
                  <td className="fw-bold">{cat.name}</td>
                  <td>{cat.slug}</td>
                  <td>{cat.order}</td>
                  <td>
                    <span className={`badge-status ${cat.active ? 'instock' : 'outofstock'}`}>
                      {cat.active ? 'Active' : 'Hidden'}
                    </span>
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-success me-2"
                      onClick={() => handleEdit(cat)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(cat.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
