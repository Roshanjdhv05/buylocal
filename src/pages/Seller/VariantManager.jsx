import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Edit3, Save, X, Image as ImageIcon, Check, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

const VariantManager = ({ formData, setFormData }) => {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [error, setError] = useState('');
    
    // Form state for current variant being added/edited
    const [currentVariant, setCurrentVariant] = useState({
        color: '',
        size: '',
        design: '',
        volume: '',
        price: '',
        marketPrice: '',
        stock: '',
        image: null,
        preview: null,
        sku: ''
    });

    const resetForm = () => {
        setCurrentVariant({
            color: '', size: '', design: '', volume: '',
            price: formData.onlinePrice || '',
            marketPrice: formData.marketPrice || '',
            stock: '',
            image: null,
            preview: null,
            sku: ''
        });
        setError('');
        setIsAdding(false);
        setEditingIndex(null);
    };

    const handleEdit = (index) => {
        setEditingIndex(index);
        setCurrentVariant(formData.variants[index]);
        setIsAdding(true);
        window.scrollTo({ top: document.querySelector('.variant-manager').offsetTop - 100, behavior: 'smooth' });
    };

    const handleDelete = (index) => {
        if (window.confirm('Are you sure you want to remove this variant?')) {
            const newVariants = formData.variants.filter((_, i) => i !== index);
            setFormData({ ...formData, variants: newVariants });
        }
    };

    const validateVariant = () => {
        if (!currentVariant.price || parseFloat(currentVariant.price) <= 0) {
            setError('Please enter a valid price');
            return false;
        }
        if (!currentVariant.stock || parseInt(currentVariant.stock) < 0) {
            setError('Please enter valid stock quantity');
            return false;
        }
        if (!currentVariant.color && !currentVariant.size && !currentVariant.design && !currentVariant.volume) {
            setError('Please provide at least one attribute (Color, Size, or Design)');
            return false;
        }

        // Check for duplicates
        const isDuplicate = formData.variants.some((v, idx) => {
            if (editingIndex !== null && idx === editingIndex) return false;
            return (
                (v.color || '') === (currentVariant.color || '') &&
                (v.size || '') === (currentVariant.size || '') &&
                (v.design || '') === (currentVariant.design || '') &&
                (v.volume || '') === (currentVariant.volume || '')
            );
        });

        if (isDuplicate) {
            setError('This attribute combination already exists');
            return false;
        }

        return true;
    };

    const saveVariant = () => {
        if (!validateVariant()) return;

        const newVariants = [...(formData.variants || [])];
        if (editingIndex !== null) {
            newVariants[editingIndex] = { ...currentVariant, id: currentVariant.id || crypto.randomUUID() };
        } else {
            newVariants.push({ ...currentVariant, id: crypto.randomUUID() });
        }

        setFormData({ ...formData, variants: newVariants });
        resetForm();
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (re) => {
                setCurrentVariant({ ...currentVariant, image: file, preview: re.target.result });
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="variant-manager">
            {/* Header / Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0 }}>Product Variations</h3>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="btn-mobile-footer primary" 
                        style={{ width: 'auto', padding: '10px 20px', borderRadius: '30px', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} /> Add Variant
                    </button>
                )}
            </div>

            {/* Variant List Table/Cards */}
            {formData.variants?.length > 0 && !isAdding && (
                <div className="variants-list" style={{ display: 'grid', gap: '1rem' }}>
                    {formData.variants.map((variant, idx) => (
                        <div key={variant.id || idx} className="add-product-card" style={{ padding: '12px', border: '1.5px solid #e2e8f0', borderRadius: '16px', position: 'relative' }}>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <div style={{ width: '70px', height: '70px', borderRadius: '12px', background: '#f8fafc', overflow: 'hidden', border: '1px solid #f1f5f9' }}>
                                    {variant.preview || variant.image ? (
                                        <img src={variant.preview || variant.image} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Variant" />
                                    ) : (
                                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <ImageIcon size={24} color="#94a3b8" />
                                        </div>
                                    )}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '4px' }}>
                                        {variant.color && <span className="tag-chip active" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>{variant.color}</span>}
                                        {variant.size && <span className="tag-chip active" style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#f0f9ff', color: '#0284c7' }}>{variant.size}</span>}
                                        {variant.design && <span className="tag-chip active" style={{ fontSize: '0.7rem', padding: '2px 8px', background: '#f5f3ff', color: '#7c3aed' }}>{variant.design}</span>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '800', fontSize: '1rem', color: '#1e293b' }}>₹{variant.price}</span>
                                            {variant.marketPrice && (
                                                <span style={{ fontSize: '0.7rem', color: '#94a3b8', textDecoration: 'line-through' }}>₹{variant.marketPrice}</span>
                                            )}
                                        </div>
                                        <span style={{ fontSize: '0.75rem', fontWeight: '600', color: variant.stock <= 5 ? '#ef4444' : '#64748b' }}>
                                            {variant.stock} units
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <button onClick={() => handleEdit(idx)} style={{ background: '#f1f5f9', border: 'none', padding: '8px', borderRadius: '8px', color: '#64748b' }}>
                                        <Edit3 size={16} />
                                    </button>
                                    <button onClick={() => handleDelete(idx)} style={{ background: '#fef2f2', border: 'none', padding: '8px', borderRadius: '8px', color: '#ef4444' }}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add/Edit Form Overlay/Inline */}
            {isAdding && (
                <div className="variant-form animate-in" style={{ background: '#ffffff', borderRadius: '20px', border: '2px solid var(--primary)', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '800' }}>
                            {editingIndex !== null ? 'Edit Variant' : 'New Variant'}
                        </h4>
                        <button onClick={resetForm} style={{ background: 'none', border: 'none', color: '#94a3b8' }}><X size={20} /></button>
                    </div>

                    {error && (
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: '#fef2f2', color: '#ef4444', padding: '10px', borderRadius: '10px', marginBottom: '1.5rem', fontSize: '0.85rem', fontWeight: '600' }}>
                            <AlertCircle size={16} /> {error}
                        </div>
                    )}

                    <div className="form-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group-mobile">
                            <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Color</label>
                            <input 
                                type="text" 
                                placeholder="e.g. Red" 
                                value={currentVariant.color} 
                                onChange={e => setCurrentVariant({ ...currentVariant, color: e.target.value })}
                            />
                        </div>
                        <div className="form-group-mobile">
                            <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Size / Volume</label>
                            <input 
                                type="text" 
                                placeholder="e.g. XL or 1 Ltr" 
                                value={currentVariant.size} 
                                onChange={e => setCurrentVariant({ ...currentVariant, size: e.target.value })}
                            />
                        </div>
                        <div className="form-group-mobile">
                            <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Design / Style</label>
                            <input 
                                type="text" 
                                placeholder="Optional" 
                                value={currentVariant.design} 
                                onChange={e => setCurrentVariant({ ...currentVariant, design: e.target.value })}
                            />
                        </div>
                        <div className="form-group-mobile">
                            <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>SKU (Optional)</label>
                            <input 
                                type="text" 
                                placeholder="Stock ID" 
                                value={currentVariant.sku} 
                                onChange={e => setCurrentVariant({ ...currentVariant, sku: e.target.value })}
                            />
                        </div>
                        <div className="form-group-mobile">
                            <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Price (Online) ₹ *</label>
                            <input 
                                type="number" 
                                placeholder="Final price" 
                                value={currentVariant.price} 
                                onChange={e => setCurrentVariant({ ...currentVariant, price: e.target.value })}
                            />
                        </div>
                        <div className="form-group-mobile">
                            <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>MRP (Market Price) ₹</label>
                            <input 
                                type="number" 
                                placeholder="Original price" 
                                value={currentVariant.marketPrice} 
                                onChange={e => setCurrentVariant({ ...currentVariant, marketPrice: e.target.value })}
                            />
                        </div>
                        <div className="form-group-mobile">
                            <label style={{ fontSize: '0.75rem', fontWeight: '700' }}>Stock Quantity *</label>
                            <input 
                                type="number" 
                                placeholder="Available units" 
                                value={currentVariant.stock} 
                                onChange={e => setCurrentVariant({ ...currentVariant, stock: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="image-upload-section" style={{ marginTop: '1rem' }}>
                        <label style={{ fontSize: '0.75rem', fontWeight: '700', marginBottom: '8px', display: 'block' }}>Variant Image *</label>
                        <div 
                            style={{ 
                                width: '100%', 
                                height: '120px', 
                                border: '2px dashed #e2e8f0', 
                                borderRadius: '15px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: 'pointer',
                                overflow: 'hidden',
                                position: 'relative'
                            }}
                            onClick={() => document.getElementById('variant-file-input').click()}
                        >
                            {currentVariant.preview ? (
                                <img src={currentVariant.preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Preview" />
                            ) : (
                                <div style={{ textAlign: 'center' }}>
                                    <ImageIcon size={32} color="#94a3b8" />
                                    <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0 0' }}>Click to upload photo</p>
                                </div>
                            )}
                            <input 
                                id="variant-file-input" 
                                type="file" 
                                accept="image/*" 
                                style={{ display: 'none' }} 
                                onChange={handleImageUpload}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '2rem' }}>
                        <button 
                            onClick={resetForm} 
                            className="btn-mobile-footer secondary" 
                            style={{ width: '40%' }}
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={saveVariant} 
                            className="btn-mobile-footer primary" 
                            style={{ flex: 1 }}
                        >
                            {editingIndex !== null ? 'Update Variant' : 'Add to List'}
                        </button>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!isAdding && (!formData.variants || formData.variants.length === 0) && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#f8fafc', borderRadius: '20px', border: '1.5px dashed #e2e8f0' }}>
                    <div style={{ background: 'white', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                        <Plus size={30} color="var(--primary)" />
                    </div>
                    <h4 style={{ margin: 0, color: '#1e293b' }}>No variants added</h4>
                    <p style={{ fontSize: '0.85rem', color: '#64748b', maxWidth: '240px', margin: '0.5rem auto 1.5rem auto' }}>
                        Each variant can have its own price, stock, and product photo.
                    </p>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="btn-mobile-footer primary" 
                        style={{ width: 'auto', padding: '10px 24px', borderRadius: '12px' }}
                    >
                        Create First Variant
                    </button>
                </div>
            )}
        </div>
    );
};

export default VariantManager;
