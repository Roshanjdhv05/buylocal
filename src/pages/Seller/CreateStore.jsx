import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import { useAuth } from '../../context/AuthContext';
import { Upload, Store, MapPin, Phone, Truck, Image as ImageIcon } from 'lucide-react';

const CreateStore = () => {
    const { user, profile, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        phone: '',
        address: '',
        city: profile?.city || '',
        state: profile?.state || '',
        lat: profile?.lat || null,
        lng: profile?.lng || null,
        est_delivery_time: '30-45 mins',
    });

    const [banner, setBanner] = useState(null);
    const [bannerPreview, setBannerPreview] = useState(null);
    const [gallery, setGallery] = useState([]);
    const [galleryPreviews, setGalleryPreviews] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleBannerChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setBanner(file);
            setBannerPreview(URL.createObjectURL(file));
        }
    };

    const handleGalleryChange = (e) => {
        const files = Array.from(e.target.files);
        setGallery(prev => [...prev, ...files]);
        const previews = files.map(file => URL.createObjectURL(file));
        setGalleryPreviews(prev => [...prev, ...previews]);
    };

    const uploadFile = async (file, bucket) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await withTimeout(supabase.storage
            .from(bucket)
            .upload(filePath, file));

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from(bucket)
            .getPublicUrl(filePath);

        return publicUrl;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            console.log('CreateStore: Starting upload for user:', user.id);
            let bannerUrl = '';
            if (banner) {
                bannerUrl = await uploadFile(banner, 'banners');
            }

            const galleryUrls = [];
            for (const file of gallery) {
                const url = await uploadFile(file, 'store-gallery');
                galleryUrls.push(url);
            }

            console.log('CreateStore: Files uploaded, inserting store row...');
            const { error: storeError } = await withTimeout(supabase
                .from('stores')
                .insert([{
                    ...formData,
                    owner_id: user.id,
                    banner_url: bannerUrl,
                    gallery: galleryUrls
                }]));

            if (storeError) throw storeError;

            navigate('/seller/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) return <div className="loader-container"><div className="loader"></div></div>;

    return (
        <div className="create-store-container">
            <div className="form-header">
                <h1>Create Your Store</h1>
                <p>Start selling locally today</p>
            </div>

            <form onSubmit={handleSubmit} className="glass-card store-form">
                <section className="form-section">
                    <h3><Store size={20} /> Store Information</h3>
                    <div className="input-group">
                        <label>Store Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Fresh Mart"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>
                    <div className="input-group">
                        <label>Description</label>
                        <textarea
                            placeholder="Tell customers about your store..."
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>
                </section>

                <section className="form-section">
                    <h3><ImageIcon size={20} /> Visuals</h3>
                    <div className="upload-box banner-upload">
                        <label>Store Banner</label>
                        <div className="preview-container">
                            {bannerPreview ? (
                                <img src={bannerPreview} alt="Banner Preview" className="banner-preview" />
                            ) : (
                                <div className="upload-placeholder">
                                    <Upload size={40} />
                                    <p>Click to upload banner</p>
                                </div>
                            )}
                            <input type="file" accept="image/*" onChange={handleBannerChange} />
                        </div>
                    </div>

                    <div className="upload-box gallery-upload">
                        <label>Gallery (Products, Storefront, etc.)</label>
                        <div className="gallery-grid">
                            {galleryPreviews.map((url, i) => (
                                <img key={i} src={url} alt={`Gallery ${i}`} className="gallery-item-preview" />
                            ))}
                            <div className="upload-placeholder mini">
                                <Upload size={24} />
                                <input type="file" multiple accept="image/*,video/*" onChange={handleGalleryChange} />
                            </div>
                        </div>
                    </div>
                </section>

                <section className="form-section">
                    <h3><MapPin size={20} /> Location & Contact</h3>
                    <div className="grid-2">
                        <div className="input-group">
                            <label>Phone Number</label>
                            <div className="with-icon">
                                <Phone size={18} />
                                <input
                                    type="text"
                                    placeholder="Contact Number"
                                    required
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="input-group">
                            <label>Delivery Time</label>
                            <div className="with-icon">
                                <Truck size={18} />
                                <input
                                    type="text"
                                    placeholder="e.g. 20-30 mins"
                                    value={formData.est_delivery_time}
                                    onChange={(e) => setFormData({ ...formData, est_delivery_time: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    <div className="input-group">
                        <label>Full Address</label>
                        <textarea
                            placeholder="Street, Landmark, Area..."
                            required
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        />
                    </div>
                </section>

                {error && <p className="error-message">{error}</p>}

                <button type="submit" className="btn-primary submit-btn" disabled={loading}>
                    {loading ? 'Creating Store...' : 'Launch Store'}
                </button>
            </form>

            <style>{`
        .create-store-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 4rem 1rem;
        }
        .form-header { text-align: center; margin-bottom: 3rem; }
        .form-header h1 { font-size: 2.5rem; color: var(--text-main); }
        .form-header p { color: var(--text-muted); }

        .store-form { padding: 2.5rem; }
        .form-section { margin-bottom: 2.5rem; }
        .form-section h3 { 
          display: flex; 
          align-items: center; 
          gap: 0.5rem; 
          margin-bottom: 1.5rem; 
          color: var(--primary);
          font-size: 1.25rem;
        }

        .input-group { margin-bottom: 1.25rem; }
        .input-group label { display: block; margin-bottom: 0.5rem; font-weight: 500; color: var(--text-muted); font-size: 0.875rem; }
        
        .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .with-icon { position: relative; }
        .with-icon svg { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .with-icon input { padding-left: 3rem; }

        .upload-box { margin-bottom: 1.5rem; }
        .preview-container {
          position: relative;
          width: 100%;
          height: 200px;
          border: 2px dashed var(--border);
          border-radius: var(--radius-lg);
          overflow: hidden;
          cursor: pointer;
        }
        .preview-container input {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          opacity: 0; cursor: pointer;
        }
        .upload-placeholder {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-muted);
          gap: 0.5rem;
        }
        .banner-preview { width: 100%; height: 100%; object-fit: cover; }

        .gallery-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 1rem;
          margin-top: 0.5rem;
        }
        .gallery-item-preview {
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
          border-radius: var(--radius-md);
        }
        .upload-placeholder.mini {
          aspect-ratio: 1;
          border: 2px dashed var(--border);
          border-radius: var(--radius-md);
          position: relative;
        }
        .upload-placeholder.mini input {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer;
        }

        .submit-btn { width: 100%; margin-top: 1rem; padding: 1rem; font-size: 1.125rem; }
        .loader-container { height: 100vh; display: flex; align-items: center; justify-content: center; }
      `}</style>
        </div>
    );
};

export default CreateStore;
