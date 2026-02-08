import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Eye, Upload, Check, Info, Plus, CloudUpload, X } from 'lucide-react';
import './DashboardStyles.css'; // Re-use dashboard styles + new specific styles

const AddProduct = ({ onBack }) => {
    const [formData, setFormData] = useState({
        name: '',
        category: '',
        ageGroup: '',
        sizes: [],
        deliveryTime: '3-5',
        codEnabled: true,
        description: '',
        onlinePrice: '',
        marketPrice: '',
        images: []
    });

    const [availableSizes] = useState(['XS', 'S', 'M', 'L', 'XL', 'XXL']);

    const handleSizeToggle = (size) => {
        setFormData(prev => ({
            ...prev,
            sizes: prev.sizes.includes(size)
                ? prev.sizes.filter(s => s !== size)
                : [...prev.sizes, size]
        }));
    };

    const handleImageUpload = (e) => {
        if (e.target.files) {
            const newImages = Array.from(e.target.files).map(file => URL.createObjectURL(file));
            setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
        }
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
            {/* Top Header */}
            <header className="add-product-header">
                <div className="header-left">
                    <button className="btn-back" onClick={onBack}>
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1>Add New Product</h1>
                        <span className="auto-save-text">Draft auto-saved 2 mins ago</span>
                    </div>
                </div>
                <div className="header-right">
                    <button className="btn-secondary">Preview</button>
                    <button className="btn-primary">Save Product</button>
                </div>
            </header>

            <div className="add-product-container">
                {/* Basic Information */}
                <section className="add-product-section">
                    <div className="section-title">
                        <Info size={18} className="text-purple-600" />
                        <h2>Basic Information</h2>
                    </div>

                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Product Name</label>
                            <input
                                type="text"
                                placeholder="e.g. Slim Fit Linen Shirt"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select
                                value={formData.category}
                                onChange={e => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="">Select Category</option>
                                <option value="clothing">Clothing</option>
                                <option value="electronics">Electronics</option>
                                <option value="home">Home & Living</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Available Sizes</label>
                            <div className="size-selector">
                                {availableSizes.map(size => (
                                    <button
                                        key={size}
                                        className={`size-btn ${formData.sizes.includes(size) ? 'active' : ''}`}
                                        onClick={() => handleSizeToggle(size)}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Age Group</label>
                            <select
                                value={formData.ageGroup}
                                onChange={e => setFormData({ ...formData, ageGroup: e.target.value })}
                            >
                                <option value="">Select Age Group</option>
                                <option value="adult">Adult</option>
                                <option value="kids">Kids</option>
                                <option value="teen">Teen</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Standard Delivery Time</label>
                            <div className="input-with-suffix">
                                <input
                                    type="text"
                                    placeholder="e.g. 3-5"
                                    value={formData.deliveryTime}
                                    onChange={e => setFormData({ ...formData, deliveryTime: e.target.value })}
                                />
                                <span>Days</span>
                            </div>
                        </div>

                        <div className="form-group full-width cod-group">
                            <div className="cod-label">
                                <span>Cash on Delivery</span>
                                <small>Allow customers to pay at doorstep</small>
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
                </section>

                {/* Product Description */}
                <section className="add-product-section">
                    <div className="section-title">
                        <div className="icon-box bg-blue-100 text-blue-600">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><line x1="10" y1="9" x2="8" y2="9" /></svg>
                        </div>
                        <h2>Product Description</h2>
                    </div>

                    <div className="form-group full-width">
                        <label>Full Description</label>
                        <textarea
                            rows="6"
                            placeholder="Enter detailed product information..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        ></textarea>
                        <div className="char-count">{formData.description.length} / 1000</div>
                        <p className="help-text">Describe the material, fit, style, and care instructions to help buyers decide.</p>
                    </div>
                </section>

                {/* Pricing & Savings */}
                <section className="add-product-section pricing-row">
                    <div className="pricing-inputs">
                        <div className="form-group">
                            <label>Online Price (BuyLocal)</label>
                            <div className="input-prefix">
                                <span>$</span>
                                <input
                                    type="number"
                                    value={formData.onlinePrice}
                                    onChange={e => setFormData({ ...formData, onlinePrice: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Offline/Market Price</label>
                            <div className="input-prefix">
                                <span>$</span>
                                <input
                                    type="number"
                                    value={formData.marketPrice}
                                    onChange={e => setFormData({ ...formData, marketPrice: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="summary-box">
                        <div className="summary-header">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" /><circle cx="12" cy="5" r="2" /><path d="M12 7v4" /><line x1="8" y1="16" x2="8" y2="16" /><line x1="16" y1="16" x2="16" y2="16" /></svg>
                            <h3>Summary & Savings</h3>
                        </div>
                        <div className="summary-row">
                            <span>Buyer Savings</span>
                            <span className="green-text">-${savings.toFixed(2)} ({savingsPercent}%)</span>
                        </div>
                        <div className="summary-row">
                            <span>Marketplace Fee (5%)</span>
                            <span>-${platformFee.toFixed(2)}</span>
                        </div>
                        <div className="summary-total">
                            <span>You Earn (Estimated)</span>
                            <span className="purple-text">${netEarnings.toFixed(2)}</span>
                        </div>
                    </div>
                </section>

                {/* Product Images */}
                <section className="add-product-section">
                    <div className="section-title">
                        <div className="icon-box bg-purple-100 text-purple-600">
                            <Upload size={16} />
                        </div>
                        <h2>Product Images</h2>
                    </div>

                    <div className="upload-area">
                        <div className="upload-placeholder">
                            <div className="cloud-icon">
                                <CloudUpload size={32} />
                            </div>
                            <h4>Click or drag images here to upload</h4>
                            <p>PNG, JPG, or WEBP up to 10MB each</p>
                            <input type="file" multiple onChange={handleImageUpload} className="hidden-file-input" />
                        </div>
                    </div>

                    <div className="image-previews">
                        {formData.images.map((img, idx) => (
                            <div key={idx} className="preview-card">
                                <img src={img} alt={`Preview ${idx}`} />
                                {idx === 0 && <span className="primary-tag">PRIMARY</span>}
                            </div>
                        ))}
                        <div className="add-more-card">
                            <Plus size={24} />
                            <input type="file" onChange={handleImageUpload} className="hidden-overlay" />
                        </div>
                    </div>
                </section>
            </div>

            {/* Bottom Bar */}
            <div className="add-product-footer">
                <button className="btn-text text-red-500">Discard Changes</button>
                <div className="footer-actions">
                    <button className="btn-secondary">Save as Draft</button>
                    <button className="btn-primary">Add Product</button>
                </div>
            </div>
        </div>
    );
};

export default AddProduct;
