import React, { useState, useEffect } from 'react';
import { 
  X, Settings, Star, Plus, Trash2, Edit3, Save, ChevronUp, ChevronDown,
  Eye, EyeOff, GripVertical, Check, Package
} from 'lucide-react';

// ============================================
// ServiceSettings Modal
// Customize service packages, categories, favorites
// ============================================

const SUPABASE_URL = 'https://hjhllnczzfqsoekywjpq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqaGxsbmN6emZxc29la3l3anBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYwOTY1MDIsImV4cCI6MjA4MTQ1NjUwMn0.X-gdyOuSYd6MQ_wjUid3CCCl2oiUc43JD2swlNaap7M';

// API helpers
async function fetchData(table, options = '') {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}${options}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
  return res.json();
}

async function updateRow(table, id, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function insertRow(table, data) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  return res.json();
}

async function deleteRow(table, id) {
  await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    }
  });
}

export function ServiceSettings({ isOpen, onClose, onSave }) {
  const [activeTab, setActiveTab] = useState('packages');
  const [categories, setCategories] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingPackage, setEditingPackage] = useState(null);
  const [newPackage, setNewPackage] = useState({ name: '', category: '', base_price: '', base_hours: '' });
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Load data
  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cats, pkgs] = await Promise.all([
        fetchData('service_categories', '?order=sort_order'),
        fetchData('service_packages', '?order=sort_order')
      ]);
      setCategories(cats || []);
      setPackages(pkgs || []);
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
    setLoading(false);
  };

  // Toggle favorite
  const toggleFavorite = async (pkg) => {
    const updated = await updateRow('service_packages', pkg.id, { is_favorite: !pkg.is_favorite });
    if (updated && updated[0]) {
      setPackages(prev => prev.map(p => p.id === pkg.id ? updated[0] : p));
    }
  };

  // Toggle package active
  const togglePackageActive = async (pkg) => {
    const updated = await updateRow('service_packages', pkg.id, { is_active: !pkg.is_active });
    if (updated && updated[0]) {
      setPackages(prev => prev.map(p => p.id === pkg.id ? updated[0] : p));
    }
  };

  // Save package edit
  const savePackageEdit = async () => {
    if (!editingPackage) return;
    setSaving(true);
    const updated = await updateRow('service_packages', editingPackage.id, {
      name: editingPackage.name,
      category: editingPackage.category,
      base_price: parseFloat(editingPackage.base_price) || 0,
      base_hours: parseFloat(editingPackage.base_hours) || 1,
    });
    if (updated && updated[0]) {
      setPackages(prev => prev.map(p => p.id === editingPackage.id ? updated[0] : p));
    }
    setEditingPackage(null);
    setSaving(false);
  };

  // Add new custom package
  const addCustomPackage = async () => {
    if (!newPackage.name.trim() || !newPackage.category) return;
    setSaving(true);
    const result = await insertRow('service_packages', {
      name: newPackage.name,
      category: newPackage.category,
      base_price: parseFloat(newPackage.base_price) || 0,
      base_hours: parseFloat(newPackage.base_hours) || 1,
      is_custom: true,
      is_active: true,
      sort_order: 1000 + packages.length
    });
    if (result && result[0]) {
      setPackages(prev => [...prev, result[0]]);
    }
    setNewPackage({ name: '', category: '', base_price: '', base_hours: '' });
    setSaving(false);
  };

  // Delete custom package
  const deletePackage = async (pkg) => {
    if (!pkg.is_custom) {
      alert('Cannot delete system packages. You can hide them instead.');
      return;
    }
    if (!confirm(`Delete "${pkg.name}"?`)) return;
    await deleteRow('service_packages', pkg.id);
    setPackages(prev => prev.filter(p => p.id !== pkg.id));
  };

  // Move package up/down
  const movePackage = async (pkg, direction) => {
    const sameCat = packages.filter(p => p.category === pkg.category).sort((a, b) => a.sort_order - b.sort_order);
    const idx = sameCat.findIndex(p => p.id === pkg.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    if (swapIdx < 0 || swapIdx >= sameCat.length) return;
    
    const swapPkg = sameCat[swapIdx];
    const tempOrder = pkg.sort_order;
    
    await Promise.all([
      updateRow('service_packages', pkg.id, { sort_order: swapPkg.sort_order }),
      updateRow('service_packages', swapPkg.id, { sort_order: tempOrder })
    ]);
    
    setPackages(prev => prev.map(p => {
      if (p.id === pkg.id) return { ...p, sort_order: swapPkg.sort_order };
      if (p.id === swapPkg.id) return { ...p, sort_order: tempOrder };
      return p;
    }));
  };

  // Category settings
  const toggleCategoryCollapsed = async (cat) => {
    const updated = await updateRow('service_categories', cat.id, { 
      is_collapsed_default: !cat.is_collapsed_default 
    });
    if (updated && updated[0]) {
      setCategories(prev => prev.map(c => c.id === cat.id ? updated[0] : c));
    }
  };

  const toggleCategoryHidden = async (cat) => {
    const updated = await updateRow('service_categories', cat.id, { 
      is_hidden: !cat.is_hidden 
    });
    if (updated && updated[0]) {
      setCategories(prev => prev.map(c => c.id === cat.id ? updated[0] : c));
    }
  };

  const moveCategory = async (cat, direction) => {
    const sorted = [...categories].sort((a, b) => a.sort_order - b.sort_order);
    const idx = sorted.findIndex(c => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    
    const swapCat = sorted[swapIdx];
    const tempOrder = cat.sort_order;
    
    await Promise.all([
      updateRow('service_categories', cat.id, { sort_order: swapCat.sort_order }),
      updateRow('service_categories', swapCat.id, { sort_order: tempOrder })
    ]);
    
    setCategories(prev => prev.map(c => {
      if (c.id === cat.id) return { ...c, sort_order: swapCat.sort_order };
      if (c.id === swapCat.id) return { ...c, sort_order: tempOrder };
      return c;
    }));
  };

  // Filter packages
  const filteredPackages = selectedCategory === 'all' 
    ? packages 
    : selectedCategory === 'favorites'
      ? packages.filter(p => p.is_favorite)
      : selectedCategory === 'custom'
        ? packages.filter(p => p.is_custom)
        : packages.filter(p => p.category === selectedCategory);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-gray-500" />
            <h2 className="text-xl font-bold text-gray-900">Service Settings</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg">
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 flex-shrink-0">
          <button
            onClick={() => setActiveTab('packages')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'packages' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Packages
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'categories' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 text-sm font-medium ${
              activeTab === 'add' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Add Custom
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* PACKAGES TAB */}
              {activeTab === 'packages' && (
                <div className="space-y-4">
                  {/* Filter */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm text-gray-500">Filter:</span>
                    <button
                      onClick={() => setSelectedCategory('all')}
                      className={`px-3 py-1 text-sm rounded-full ${
                        selectedCategory === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setSelectedCategory('favorites')}
                      className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${
                        selectedCategory === 'favorites' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Star size={12} /> Favorites
                    </button>
                    <button
                      onClick={() => setSelectedCategory('custom')}
                      className={`px-3 py-1 text-sm rounded-full ${
                        selectedCategory === 'custom' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      Custom
                    </button>
                    {categories.sort((a, b) => a.sort_order - b.sort_order).map(cat => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-3 py-1 text-sm rounded-full capitalize ${
                          selectedCategory === cat.id ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {cat.name}
                      </button>
                    ))}
                  </div>

                  {/* Package List */}
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left w-10">⭐</th>
                          <th className="px-3 py-2 text-left">Name</th>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-right">Price</th>
                          <th className="px-3 py-2 text-right">Hours</th>
                          <th className="px-3 py-2 text-center">Active</th>
                          <th className="px-3 py-2 text-center w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {filteredPackages.sort((a, b) => a.sort_order - b.sort_order).map(pkg => (
                          <tr key={pkg.id} className={`${!pkg.is_active ? 'opacity-50 bg-gray-50' : ''}`}>
                            <td className="px-3 py-2">
                              <button onClick={() => toggleFavorite(pkg)}>
                                <Star 
                                  size={16} 
                                  className={pkg.is_favorite ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300'} 
                                />
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              {editingPackage?.id === pkg.id ? (
                                <input
                                  type="text"
                                  value={editingPackage.name}
                                  onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                                  className="w-full border rounded px-2 py-1 text-sm"
                                />
                              ) : (
                                <span className="flex items-center gap-1">
                                  {pkg.name}
                                  {pkg.is_custom && <span className="text-xs px-1 bg-green-100 text-green-700 rounded">custom</span>}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 capitalize">
                              {editingPackage?.id === pkg.id ? (
                                <select
                                  value={editingPackage.category}
                                  onChange={(e) => setEditingPackage({ ...editingPackage, category: e.target.value })}
                                  className="border rounded px-2 py-1 text-sm"
                                >
                                  {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                  ))}
                                </select>
                              ) : (
                                pkg.category
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {editingPackage?.id === pkg.id ? (
                                <input
                                  type="number"
                                  value={editingPackage.base_price}
                                  onChange={(e) => setEditingPackage({ ...editingPackage, base_price: e.target.value })}
                                  className="w-20 border rounded px-2 py-1 text-sm text-right"
                                />
                              ) : (
                                `$${parseFloat(pkg.base_price || 0).toFixed(2)}`
                              )}
                            </td>
                            <td className="px-3 py-2 text-right">
                              {editingPackage?.id === pkg.id ? (
                                <input
                                  type="number"
                                  step="0.5"
                                  value={editingPackage.base_hours}
                                  onChange={(e) => setEditingPackage({ ...editingPackage, base_hours: e.target.value })}
                                  className="w-16 border rounded px-2 py-1 text-sm text-right"
                                />
                              ) : (
                                `${parseFloat(pkg.base_hours || 0).toFixed(1)}h`
                              )}
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => togglePackageActive(pkg)}>
                                {pkg.is_active ? (
                                  <Eye size={16} className="text-green-600" />
                                ) : (
                                  <EyeOff size={16} className="text-gray-400" />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                {editingPackage?.id === pkg.id ? (
                                  <>
                                    <button 
                                      onClick={savePackageEdit}
                                      disabled={saving}
                                      className="p-1 text-green-600 hover:bg-green-50 rounded"
                                    >
                                      <Check size={14} />
                                    </button>
                                    <button 
                                      onClick={() => setEditingPackage(null)}
                                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                    >
                                      <X size={14} />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button 
                                      onClick={() => movePackage(pkg, 'up')}
                                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                    >
                                      <ChevronUp size={14} />
                                    </button>
                                    <button 
                                      onClick={() => movePackage(pkg, 'down')}
                                      className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                    >
                                      <ChevronDown size={14} />
                                    </button>
                                    <button 
                                      onClick={() => setEditingPackage({ ...pkg })}
                                      className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                    >
                                      <Edit3 size={14} />
                                    </button>
                                    {pkg.is_custom && (
                                      <button 
                                        onClick={() => deletePackage(pkg)}
                                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    )}
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* CATEGORIES TAB */}
              {activeTab === 'categories' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-500">
                    Manage category order, visibility, and default collapse state.
                  </p>
                  
                  <div className="border border-gray-200 rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="px-3 py-2 text-left">Category</th>
                          <th className="px-3 py-2 text-center">Collapsed by Default</th>
                          <th className="px-3 py-2 text-center">Visible</th>
                          <th className="px-3 py-2 text-center">Packages</th>
                          <th className="px-3 py-2 text-center w-24">Order</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {categories.sort((a, b) => a.sort_order - b.sort_order).map(cat => (
                          <tr key={cat.id} className={cat.is_hidden ? 'opacity-50 bg-gray-50' : ''}>
                            <td className="px-3 py-2 font-medium">{cat.name}</td>
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => toggleCategoryCollapsed(cat)}
                                className={`px-3 py-1 text-xs rounded-full ${
                                  cat.is_collapsed_default 
                                    ? 'bg-amber-100 text-amber-700' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {cat.is_collapsed_default ? 'Collapsed' : 'Expanded'}
                              </button>
                            </td>
                            <td className="px-3 py-2 text-center">
                              <button onClick={() => toggleCategoryHidden(cat)}>
                                {cat.is_hidden ? (
                                  <EyeOff size={16} className="text-gray-400 mx-auto" />
                                ) : (
                                  <Eye size={16} className="text-green-600 mx-auto" />
                                )}
                              </button>
                            </td>
                            <td className="px-3 py-2 text-center text-gray-500">
                              {packages.filter(p => p.category === cat.id).length}
                            </td>
                            <td className="px-3 py-2">
                              <div className="flex items-center justify-center gap-1">
                                <button 
                                  onClick={() => moveCategory(cat, 'up')}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                >
                                  <ChevronUp size={14} />
                                </button>
                                <button 
                                  onClick={() => moveCategory(cat, 'down')}
                                  className="p-1 text-gray-400 hover:bg-gray-100 rounded"
                                >
                                  <ChevronDown size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ADD CUSTOM TAB */}
              {activeTab === 'add' && (
                <div className="space-y-6">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-3">Add Custom Service</h3>
                    <p className="text-sm text-blue-700 mb-4">
                      Create reusable custom services that will be saved and available for all bookings.
                    </p>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="col-span-2">
                        <label className="block text-sm text-gray-700 mb-1">Service Name</label>
                        <input
                          type="text"
                          value={newPackage.name}
                          onChange={(e) => setNewPackage({ ...newPackage, name: e.target.value })}
                          placeholder="e.g., Transmission Flush"
                          className="w-full border rounded-lg px-3 py-2"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-700 mb-1">Category</label>
                        <select
                          value={newPackage.category}
                          onChange={(e) => setNewPackage({ ...newPackage, category: e.target.value })}
                          className="w-full border rounded-lg px-3 py-2"
                        >
                          <option value="">Select category...</option>
                          {categories.sort((a, b) => a.sort_order - b.sort_order).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Price ($)</label>
                          <input
                            type="number"
                            value={newPackage.base_price}
                            onChange={(e) => setNewPackage({ ...newPackage, base_price: e.target.value })}
                            placeholder="0.00"
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-700 mb-1">Hours</label>
                          <input
                            type="number"
                            step="0.5"
                            value={newPackage.base_hours}
                            onChange={(e) => setNewPackage({ ...newPackage, base_hours: e.target.value })}
                            placeholder="1.0"
                            className="w-full border rounded-lg px-3 py-2"
                          />
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={addCustomPackage}
                      disabled={!newPackage.name.trim() || !newPackage.category || saving}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium disabled:opacity-50 hover:bg-blue-700 flex items-center gap-2"
                    >
                      <Plus size={16} />
                      Add Service
                    </button>
                  </div>

                  {/* List of custom services */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-3">Your Custom Services</h3>
                    {packages.filter(p => p.is_custom).length === 0 ? (
                      <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
                        <Package size={24} className="mx-auto mb-2 opacity-50" />
                        <p>No custom services yet</p>
                      </div>
                    ) : (
                      <div className="border border-gray-200 rounded-lg divide-y divide-gray-100">
                        {packages.filter(p => p.is_custom).map(pkg => (
                          <div key={pkg.id} className="px-4 py-3 flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">{pkg.name}</div>
                              <div className="text-sm text-gray-500">
                                {pkg.category} • ${parseFloat(pkg.base_price || 0).toFixed(2)} • {parseFloat(pkg.base_hours || 0).toFixed(1)}h
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setEditingPackage({ ...pkg });
                                  setActiveTab('packages');
                                  setSelectedCategory('custom');
                                }}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                              >
                                <Edit3 size={16} />
                              </button>
                              <button
                                onClick={() => deletePackage(pkg)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={() => {
              onSave?.();
              onClose();
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceSettings;
