import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Upload, Check, Info, Plus, CloudUpload, X, Tag, ChevronRight } from 'lucide-react';

import './DashboardStyles.css'; // Re-use dashboard styles + new specific styles

const AddProduct = ({ onBack, onAdd, uploading, sections = [], initialData = null }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        ageGroup: 'Adults',
        sizes: [],
        deliveryTime: '2-3',
        codEnabled: true,
        description: '',
        onlinePrice: '',
        marketPrice: '',
        deliveryCharges: '0',
        images: [],
        section: ''
    });

    const [step, setStep] = useState(1);
    const [summaryExpanded, setSummaryExpanded] = useState(true);

    useEffect(() => {
        if (initialData) {
            setFormData({
                id: initialData.id,
                name: initialData.name || '',
                category: initialData.category || '',
                ageGroup: initialData.age_group || 'Adults',
                sizes: initialData.sizes || [],
                deliveryTime: initialData.delivery_time || '2-3',
                codEnabled: initialData.cod_available ?? true,
                description: initialData.description || '',
                onlinePrice: initialData.online_price || '',
                marketPrice: initialData.offline_price || '',
                deliveryCharges: initialData.delivery_charges || '0',
                images: initialData.images || [],
                section: initialData.section || ''
            });
        }
    }, [initialData]);

    const [customSize, setCustomSize] = useState('');
    const [availableSizes] = useState(['XS', 'S', 'M', 'L', 'XL', 'XXL']);

    const handleSizeToggle = (size) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size]
        }));
    };

    const handleAddCustomSize = (e) => {
        if (e) e.preventDefault();
        if (customSize.trim() && !formData.sizes.includes(customSize.trim())) {
            setFormData(prev => ({
                ...prev,
                sizes: [...prev.sizes, customSize.trim()]
            }));
            setCustomSize('');
        }
    };

    const handleImageUpload = (e) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            const newImages = files.map(file => URL.createObjectURL(file));
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
        }
    };

    const removeImage = (index) => {
        setFormData(prev => ({
            ...prev,
            images: prev.images.filter((_, i) => i !== index)
        }));
    };

    const nextStep = () => {
        if (step < 4) setStep(step + 1);
        window.scrollTo(0, 0);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
        else onBack();
        window.scrollTo(0, 0);
    };

    // Calculations
    const online = parseFloat(formData.onlinePrice) || 0;
    const market = parseFloat(formData.marketPrice) || 0;
    const savings = market > online ? market - online : 0;
    const savingsPercent = market > 0 ? Math.round((savings / market) * 100) : 0;
    const platformFee = online * 0.05; // 5% fee example
    const netEarnings = online - platformFee;


    return (
        <div className="add-product-page">
            {/* Sticky Header */}
            <header className="add-product-header">
                <div className="header-inner">
                    <button className="btn-back" onClick={prevStep} style={{ background: 'none', border: 'none', padding: '4px', display: 'flex' }}>
                        <ArrowLeft size={22} />
                    </button>
                    <div>
                        <h1>{initialData ? 'Edit Product' : 'Add New Product'}</h1>
                        <span className="auto-save-text">Draft auto-saved 2 mins ago</span>
                    </div>
                </div>
                <div className="step-indicator-wrapper">
                    <div className="step-progress-bar">
                        {[1, 2, 3, 4].map(s => (
                            <div
                                key={s}
                                className="step-progress-fill"
                                style={{
                                    width: '25%',
                                    background: s <= step ? 'var(--primary)' : '#f1f5f9',
                                    borderRadius: '10px'
                                }}
                            ></div>
                        ))}
                    </div>
                </div>
            </header>

            <main className="add-product-container">
                {step === 1 && (
                    <div className="step-view">
                        <div className="step-headline">
                            <span>Step 1 of 4</span>
                            <h2>Basic Information</h2>
                        </div>

                        <div className="add-product-card">
                            <div className="form-group-mobile">
                                <label>Product Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Slim Fit Linen Shirt"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="form-group-mobile">
                                <label>Category</label>
                                <input
                                    type="text"
                                    placeholder="Select Category or type new..."
                                    value={formData.category}
                                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                                />
                            </div>

                            <div className="form-group-mobile">
                                <label>Store Section / Collection</label>
                                <select
                                    value={formData.section}
                                    onChange={e => setFormData({ ...formData, section: e.target.value })}
                                >
                                    <option value="">No Section (General Collection)</option>
                                    {sections.map(sec => (
                                        <option key={sec.id} value={sec.name}>{sec.name}</option>
                                    ))}
                                </select>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                    Default: General Collection. Helps in organizing your shop.
                                </p>
                            </div>

                            <div className="form-group-mobile">
                                <label>Available Sizes</label>
                                <div className="size-chips">
                                    {availableSizes.map(size => (
                                        <button
                                            key={size}
                                            type="button"
                                            className={`size-chip ${formData.sizes.includes(size) ? 'active' : ''}`}
                                            onClick={() => handleSizeToggle(size)}
                                        >
                                            {size}
                                        </button>
                                    ))}
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                                    <input
                                        type="text"
                                        placeholder="Add custom (e.g. 42, US 10)"
                                        value={customSize}
                                        onChange={(e) => setCustomSize(e.target.value)}
                                        style={{ height: '48px' }}
                                    />
                                    <button
                                        onClick={handleAddCustomSize}
                                        className="size-chip"
                                        style={{ height: '48px', minWidth: '80px', background: '#f8fafc' }}
                                    >
                                        Add
                                    </button>
                                </div>
                            </div>

                            <div className="form-group-mobile">
                                <label>Age Group</label>
                                <div className="size-chips">
                                    {['Adults', 'Kids', 'Teens'].map(age => (
                                        <button
                                            key={age}
                                            type="button"
                                            className={`size-chip ${formData.ageGroup === age ? 'active' : ''}`}
                                            onClick={() => setFormData({ ...formData, ageGroup: age })}
                                            style={{ flex: 1 }}
                                        >
                                            {age}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="add-product-card" style={{ background: '#f0f9ff', border: '1px solid #bae6fd', display: 'flex', gap: '12px' }}>
                            <Info size={18} color="#0369a1" />
                            <p style={{ fontSize: '0.8rem', color: '#0369a1', lineHeight: '1.4' }}>
                                <strong>Pro Tip:</strong> Using clear product names helps buyers find your items faster in search results.
                            </p>
                        </div>
                    </div>
                )}

                {step === 2 && (
                    <div className="step-view">
                        <div className="step-headline">
                            <span>Step 2 of 4</span>
                            <h2>Delivery Details</h2>
                        </div>

                        <div className="add-product-card">
                            <div className="form-group-mobile">
                                <label>Standard Delivery Time</label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <input
                                        type="text"
                                        placeholder="e.g. 3"
                                        value={formData.deliveryTime.split(' ')[0]}
                                        onChange={e => setFormData({ ...formData, deliveryTime: `${e.target.value} Days` })}
                                        style={{ flex: 2 }}
                                    />
                                    <select style={{ flex: 1, height: '48px' }}>
                                        <option>Days</option>
                                        <option>Hours</option>
                                    </select>
                                </div>
                            </div>

                            <div className="toggle-group-mobile">
                                <div className="toggle-info">
                                    <h4>Cash on Delivery</h4>
                                    <p>Allow customers to pay at doorstep</p>
                                </div>
                                <label className="switch">
                                    <input
                                        type="checkbox"
                                        checked={formData.codEnabled}
                                        onChange={e => setFormData({ ...formData, codEnabled: e.target.checked })}
                                    />
                                    <span className="slider round"></span>
                                </label>
                            </div>
                        </div>

                        <div className="add-product-card">
                            <div className="form-group-mobile" style={{ marginBottom: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                                    <label style={{ margin: 0 }}>Product Description</label>
                                    <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{formData.description.length} / 1000</span>
                                </div>
                                <textarea
                                    rows="8"
                                    placeholder="Describe your product features, materials, and unique selling points..."
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                ></textarea>
                                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem', fontStyle: 'italic' }}>
                                    Pro-tip: Clear descriptions increase sales by up to 30%.
                                </p>
                            </div>
                        </div>

                        <div className="add-product-card" style={{ background: '#f5f3ff', border: '1px solid #ddd6fe', display: 'flex', gap: '12px' }}>
                            <div style={{ background: 'white', padding: '4px', borderRadius: '50%', display: 'flex' }}>
                                <Info size={14} color="var(--primary)" />
                            </div>
                            <p style={{ fontSize: '0.8rem', color: '#5b21b6', lineHeight: '1.4' }}>
                                Make sure to include information about shipping areas and any restrictions in your description.
                            </p>
                        </div>
                    </div>
                )}

                {step === 3 && (
                    <div className="step-view">
                        <div className="step-headline">
                            <span>Step 3 of 4</span>
                            <h2>Pricing & Earnings</h2>
                        </div>

                        <div className="add-product-card">
                            <div className="form-group-mobile">
                                <label>Online Price ($)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#64748b' }}>$</span>
                                    <input
                                        type="number"
                                        className="price-input"
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={formData.onlinePrice}
                                        onChange={e => setFormData({ ...formData, onlinePrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group-mobile">
                                <label>Offline Price (₹)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#64748b' }}>₹</span>
                                    <input
                                        type="number"
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={formData.marketPrice}
                                        onChange={e => setFormData({ ...formData, marketPrice: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group-mobile" style={{ marginBottom: 0 }}>
                                <label>Delivery Charges (₹)</label>
                                <div style={{ position: 'relative' }}>
                                    <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontWeight: '700', color: '#64748b' }}>₹</span>
                                    <input
                                        type="number"
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={formData.deliveryCharges}
                                        onChange={e => setFormData({ ...formData, deliveryCharges: e.target.value })}
                                    />
                                </div>
                                <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.5rem' }}>
                                    Recommended: ₹20 - ₹149 for your region.
                                </p>
                            </div>
                        </div>

                        <div className="summary-card-mobile">
                            <div className="summary-card-header" onClick={() => setSummaryExpanded(!summaryExpanded)}>
                                <h3><Plus size={18} className="text-blue-500" /> Summary & Savings</h3>
                                <ChevronRight size={18} style={{ transform: summaryExpanded ? 'rotate(90deg)' : 'none', transition: '0.2s' }} />
                            </div>
                            {summaryExpanded && (
                                <div className="summary-content">
                                    <div className="summary-row">
                                        <span>Buyer Savings</span>
                                        <span style={{ color: '#22c55e', fontWeight: '700' }}>₹{savings.toFixed(2)} ({savingsPercent}%)</span>
                                    </div>
                                    <div className="summary-row">
                                        <span>Marketplace Fee (5%)</span>
                                        <span>- ₹{platformFee.toFixed(2)}</span>
                                    </div>
                                    <div className="summary-total">
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: '700', fontSize: '0.95rem' }}>You Earn (Estimated)</span>
                                            <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Credited within 3-5 days</span>
                                        </div>
                                        <div style={{ textAlign: 'right' }}>
                                            <strong>₹{(online * 83).toFixed(2)}</strong>
                                            <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>PER UNIT</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                        <p style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#64748b', padding: '1rem' }}>
                            <Info size={14} flexShrink={0} />
                            Increasing your offline price slightly could offset the marketplace fee while keeping buyer savings high.
                        </p>
                    </div>
                )}

                {step === 4 && (
                    <div className="step-view">
                        <div className="step-headline">
                            <span>Step 4 of 4</span>
                            <h2>Product Images</h2>
                        </div>

                        <div className="add-product-card">
                            <label className="image-upload-zone">
                                <div className="upload-icon-circle">
                                    <CloudUpload size={24} />
                                </div>
                                <div>
                                    <h4 style={{ fontSize: '1rem', fontWeight: '800', marginBottom: '0.25rem' }}>Upload Photos</h4>
                                    <p style={{ fontSize: '0.7rem', color: '#94a3b8' }}>PNG, JPG, WEBP up to 10MB</p>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '0.5rem' }}>
                                    <div className="btn-mobile-footer primary" style={{ height: '40px', padding: '0 1rem', fontSize: '0.9rem', width: 'auto' }}>
                                        Gallery
                                    </div>
                                    <div className="btn-mobile-footer secondary" style={{ height: '40px', padding: '0 1rem', fontSize: '0.9rem', width: 'auto' }}>
                                        Camera
                                    </div>
                                </div>
                                <input type="file" multiple onChange={handleImageUpload} style={{ display: 'none' }} />
                            </label>

                            {formData.images.length > 0 && (
                                <div style={{ marginTop: '1.5rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                        <h4 style={{ fontSize: '0.85rem', fontWeight: '800' }}>Uploaded Images ({formData.images.length})</h4>
                                        <button style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '700', background: 'none', border: 'none' }}>Rearrange</button>
                                    </div>
                                    <div className="uploaded-images-slider">
                                        {formData.images.map((img, idx) => (
                                            <div key={idx} className="image-preview-card">
                                                <img src={img} alt={`Preview ${idx}`} />
                                                <button className="remove-image-btn" onClick={() => removeImage(idx)} style={{ background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <X size={12} />
                                                </button>
                                                {idx === 0 && (
                                                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'var(--primary)', color: 'white', fontSize: '0.6rem', fontWeight: '800', textAlign: 'center', padding: '2px 0' }}>
                                                        COVER
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="add-product-card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h4 style={{ fontSize: '0.95rem', fontWeight: '800' }}>Review Summary</h4>
                                <button onClick={() => setStep(1)} style={{ background: 'none', border: 'none', color: 'var(--primary)', fontWeight: '700', fontSize: '0.85rem' }}>Edit</button>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', background: '#f8fafc', padding: '12px', borderRadius: '12px' }}>
                                <div style={{ width: '60px', height: '60px', borderRadius: '8px', background: 'white', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                                    {formData.images[0] ? <img src={formData.images[0]} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Review preview" /> : <div style={{ width: '100%', height: '100%', background: '#f1f5f9' }} />}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h5 style={{ fontSize: '0.9rem', fontWeight: '800', marginBottom: '2px' }}>{formData.name || 'Untitled Product'}</h5>
                                    <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginBottom: '4px' }}>Category: {formData.category || 'Not Set'}</div>
                                    <div style={{ fontSize: '0.9rem', fontWeight: '800', color: 'var(--primary)' }}>${formData.onlinePrice || '0'}</div>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Inventory</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{formData.sizes.length || 1} Variations</div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.65rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: '800' }}>Shipping</div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: '700' }}>{formData.deliveryCharges === '0' ? 'Free Local Delivery' : `₹${formData.deliveryCharges}`}</div>
                                </div>
                            </div>

                            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '1rem', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                {formData.description}
                            </p>
                        </div>

                        <p style={{ display: 'flex', gap: '8px', fontSize: '0.75rem', color: '#64748b', padding: '1rem' }}>
                            <Info size={14} flexShrink={0} />
                            By clicking "Add Product", you agree to our Seller Guidelines and confirm that you have the right to sell this item.
                        </p>
                    </div>
                )}
            </main>

            {/* Sticky Bottom Bar */}
            <footer className="add-product-footer-mobile">
                <button className="btn-mobile-footer secondary" onClick={prevStep}>
                    {step === 1 ? 'Save Draft' : 'Back'}
                </button>
                {step < 4 ? (
                    <button className="btn-mobile-footer primary" onClick={nextStep}>
                        Next Step
                    </button>
                ) : (
                    <button
                        className="btn-mobile-footer primary"
                        onClick={() => onAdd(formData)}
                        disabled={uploading}
                    >
                        {uploading ? 'Adding...' : 'Add Product'}
                    </button>
                )}
            </footer>

        </div>
    );

};


export default AddProduct;
