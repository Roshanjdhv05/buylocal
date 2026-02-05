import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { supabase, withTimeout } from '../../services/supabase';
import {
    ShoppingCart, MapPin, Tag, ArrowLeft, Store,
    Star, ShieldCheck, Truck, RefreshCcw, Package, ChevronRight, ChevronLeft
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';

const ProductDetails = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState(null);
    const [store, setStore] = useState(null);
    const [relatedProducts, setRelatedProducts] = useState([]);
    const [activeMedia, setActiveMedia] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        window.scrollTo(0, 0);
        fetchProductDetails();
    }, [productId]);

    const fetchProductDetails = async () => {
        try {
            setLoading(true);
            // Fetch current product
            const { data: productData, error: productError } = await withTimeout(supabase
                .from('products')
                .select('*')
                .eq('id', productId)
                .single());

            if (productError) throw productError;
            setProduct(productData);

            // Fetch store info
            const { data: storeData } = await withTimeout(supabase
                .from('stores')
                .select('*')
                .eq('id', productData.store_id)
                .single());
            setStore(storeData);

            // Fetch related products (same category)
            const { data: relatedData } = await withTimeout(supabase
                .from('products')
                .select('*')
                .eq('category', productData.category)
                .neq('id', productId)
                .limit(4));

            // Add distance/store info to related products
            const relatedWithInfo = relatedData?.map(p => ({
                ...p,
                storeName: storeData?.name,
                distance: Infinity // In a real scenario, we'd calculate this
            })) || [];

            setRelatedProducts(relatedWithInfo);

        } catch (error) {
            console.error('Error fetching details:', error.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (!product) return <div className="error-container">Product not found.</div>;

    const mediaUrls = product.images || product.image_urls || [];
    const mainMedia = mediaUrls[activeMedia];
    const isMainVideo = mainMedia?.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || mainMedia?.includes('/video');

    const nextMedia = () => setActiveMedia((prev) => (prev + 1) % mediaUrls.length);
    const prevMedia = () => setActiveMedia((prev) => (prev - 1 + mediaUrls.length) % mediaUrls.length);

    return (
        <div className="product-details-wrapper">
            <Navbar />

            <main className="container product-main">
                <button className="back-btn" onClick={() => navigate(-1)}>
                    <ArrowLeft size={18} /> Back to Collection
                </button>

                <div className="product-grid-layout">
                    {/* MEDIA GALLERY */}
                    <div className="product-visuals">
                        <div className="main-media-box glass-card">
                            {isMainVideo ? (
                                <video src={mainMedia} autoPlay muted loop playsInline className="visual-display" />
                            ) : (
                                <img src={mainMedia || 'https://via.placeholder.com/600'} alt={product.name} className="visual-display" />
                            )}

                            {mediaUrls.length > 1 && (
                                <>
                                    <button className="visual-slider-btn prev" onClick={prevMedia}>
                                        <ChevronLeft size={24} />
                                    </button>
                                    <button className="visual-slider-btn next" onClick={nextMedia}>
                                        <ChevronRight size={24} />
                                    </button>
                                </>
                            )}
                        </div>

                        {mediaUrls.length > 1 && (
                            <div className="media-thumbnails">
                                {mediaUrls.map((url, idx) => {
                                    const isVid = url.toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || url.includes('/video');
                                    return (
                                        <div
                                            key={idx}
                                            className={`thumb-box ${activeMedia === idx ? 'active' : ''}`}
                                            onClick={() => setActiveMedia(idx)}
                                        >
                                            {isVid ? (
                                                <video src={url} className="thumb-media" />
                                            ) : (
                                                <img src={url} className="thumb-media" />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* PRODUCT INFO */}
                    <div className="product-info-panel">
                        <div className="brand-badge-mini">
                            <Tag size={12} /> {product.category}
                        </div>

                        <h1 className="p-title">{product.name}</h1>

                        <div className="p-price-row">
                            <span className="p-curr">₹{Number(product.online_price).toLocaleString()}</span>
                            {product.offline_price && (
                                <span className="p-prev">₹{Number(product.offline_price).toLocaleString()}</span>
                            )}
                        </div>

                        <p className="p-desc">{product.description || 'No description available for this luxury piece.'}</p>

                        <div className="p-actions">
                            <button className="btn-add-main">
                                <ShoppingCart size={20} /> Add to Sanctuary Cart
                            </button>
                        </div>

                        {/* STORE INFO CARLET */}
                        {store && (
                            <Link to={`/store/${store.id}`} className="store-card-mini glass-card">
                                <div className="s-icon"><Store size={20} /></div>
                                <div className="s-txt">
                                    <label>Crafted & Curated By</label>
                                    <h3>{store.name}</h3>
                                </div>
                                <ChevronRight size={18} className="s-arrow" />
                            </Link>
                        )}

                        <div className="p-features-grid">
                            <div className="f-item">
                                <ShieldCheck size={18} />
                                <span>Authentic Gaurantee</span>
                            </div>
                            <div className="f-item">
                                <Truck size={18} />
                                <span>White-Glove Delivery</span>
                            </div>
                            <div className="f-item">
                                <RefreshCcw size={18} />
                                <span>7-Day Return Sanctuary</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* RELATED PRODUCTS */}
                {relatedProducts.length > 0 && (
                    <section className="related-section">
                        <div className="section-header-luxury">
                            <div>
                                <h2>Related Masterpieces</h2>
                                <p className="sub-header">Complementary pieces curated just for you</p>
                            </div>
                        </div>
                        <div className="related-grid-luxury">
                            {relatedProducts.map(p => (
                                <ProductCard key={p.id} product={p} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            <style>{`
                .product-details-wrapper { background: #fff; min-height: 100vh; padding-bottom: 5rem; color: #1a1a1a; font-family: 'Inter', sans-serif; }
                .product-main { padding-top: 2rem; }
                
                .back-btn { background: none; border: none; display: flex; align-items: center; gap: 0.6rem; font-weight: 600; color: #64748b; cursor: pointer; margin-bottom: 2rem; transition: 0.3s; }
                .back-btn:hover { color: #1a1a1a; transform: translateX(-5px); }

                .product-grid-layout { display: grid; grid-template-columns: 1.2fr 1fr; gap: 4rem; margin-bottom: 6rem; }

                /* VISUALS */
                .main-media-box { aspect-ratio: 1; border-radius: 32px; overflow: hidden; background: #f8fafc; margin-bottom: 1.5rem; position: relative; }
                .visual-display { width: 100%; height: 100%; object-fit: cover; }
                
                .visual-slider-btn { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(255,255,255,0.7); backdrop-filter: blur(5px); width: 48px; height: 48px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: none; cursor: pointer; transition: 0.3s; opacity: 0; }
                .main-media-box:hover .visual-slider-btn { opacity: 1; }
                .visual-slider-btn:hover { background: white; transform: translateY(-50%) scale(1.1); }
                .visual-slider-btn.prev { left: 20px; }
                .visual-slider-btn.next { right: 20px; }

                .media-thumbnails { display: flex; gap: 1rem; overflow-x: auto; scrollbar-width: none; }
                .thumb-box { width: 80px; height: 80px; border-radius: 12px; overflow: hidden; cursor: pointer; border: 2px solid transparent; flex-shrink: 0; transition: 0.3s; opacity: 0.7; }
                .thumb-box.active { border-color: #2563eb; opacity: 1; transform: scale(1.05); }
                .thumb-media { width: 100%; height: 100%; object-fit: cover; }

                /* INFO PANEL */
                .brand-badge-mini { background: #eff6ff; color: #2563eb; padding: 0.4rem 0.8rem; border-radius: 30px; display: inline-flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; margin-bottom: 1.5rem; }
                .p-title { font-size: 3rem; font-weight: 800; letter-spacing: -0.03em; margin-bottom: 1rem; line-height: 1; text-transform: capitalize; }
                .p-price-row { display: flex; align-items: center; gap: 1.5rem; margin-bottom: 2rem; }
                .p-curr { font-size: 2rem; font-weight: 800; color: #1a1a1a; }
                .p-prev { font-size: 1.2rem; color: #94a3b8; text-decoration: line-through; }
                
                .p-desc { font-size: 1.15rem; line-height: 1.7; color: #475569; margin-bottom: 2.5rem; max-width: 500px; }

                .btn-add-main { width: 100%; background: #1a1a1a; color: white; border: none; padding: 1.2rem; border-radius: 16px; font-size: 1.1rem; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 0.8rem; cursor: pointer; transition: 0.3s; margin-bottom: 2rem; }
                .btn-add-main:hover { background: #000; transform: translateY(-3px); box-shadow: 0 10px 25px rgba(0,0,0,0.2); }

                .store-card-mini { display: flex; align-items: center; gap: 1.2rem; padding: 1.2rem; border-radius: 20px; text-decoration: none; color: inherit; transition: 0.3s; margin-bottom: 2.5rem; }
                .store-card-mini:hover { background: #f1f5f9; transform: translateX(5px); }
                .s-icon { width: 44px; height: 44px; background: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #2563eb; }
                .s-txt label { font-size: 0.7rem; text-transform: uppercase; font-weight: 700; color: #64748b; letter-spacing: 0.05em; margin-bottom: 0.2rem; display: block; }
                .s-txt h3 { font-size: 1.1rem; font-weight: 700; }
                .s-arrow { margin-left: auto; color: #cbd5e1; }

                .p-features-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
                .f-item { text-align: center; border-radius: 16px; padding: 1rem; background: #f8fafc; display: flex; flex-direction: column; align-items: center; gap: 0.6rem; color: #64748b; }
                .f-item span { font-size: 0.75rem; font-weight: 600; line-height: 1.3; }

                /* RELATED SECTION */
                .related-section { border-top: 1px solid #f1f5f9; padding-top: 5rem; }
                .related-grid-luxury { display: grid; grid-template-columns: repeat(4, 1fr); gap: 2rem; }

                @media (max-width: 1024px) {
                    .product-grid-layout { grid-template-columns: 1fr; gap: 3rem; }
                    .p-title { font-size: 2.5rem; }
                    .related-grid-luxury { grid-template-columns: repeat(2, 1fr); }
                }

                @media (max-width: 640px) {
                    .p-features-grid { grid-template-columns: 1fr; }
                    .related-grid-luxury { grid-template-columns: 1fr; }
                }
            `}</style>
        </div>
    );
};

export default ProductDetails;
