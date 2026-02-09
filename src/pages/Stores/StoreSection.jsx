
import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { ArrowLeft, Store } from 'lucide-react';
import Navbar from '../../components/Navbar';
import ProductCard from '../../components/ProductCard';

const StoreSection = () => {
    const { storeId, sectionName } = useParams();
    const [store, setStore] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const decodedSectionName = decodeURIComponent(sectionName);
    const sectionRefs = useRef({});

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch store details
                const { data: storeData, error: storeError } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('id', storeId)
                    .single();

                if (storeError) throw storeError;
                setStore(storeData);

                // Fetch ALL products for this store
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('*')
                    .eq('store_id', storeId);

                if (productsError) throw productsError;
                setProducts(productsData || []);
            } catch (error) {
                console.error('Error fetching section data:', error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [storeId]);

    // Scroll to section on load
    useEffect(() => {
        if (!loading && products.length > 0 && decodedSectionName) {
            const sectionId = `section-${decodedSectionName.replace(/\s+/g, '-').toLowerCase()}`;
            const element = document.getElementById(sectionId);
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 100);
            }
        }
    }, [loading, products, decodedSectionName]);

    if (loading) return <div className="loader-container"><div className="loader"></div></div>;
    if (!store) return <div className="error-container">Store not found</div>;

    // Group products by section
    const groupedProducts = products.reduce((acc, product) => {
        const sec = product.section?.trim() || 'General Collection';
        if (!acc[sec]) acc[sec] = [];
        acc[sec].push(product);
        return acc;
    }, {});

    const sortedSections = Object.entries(groupedProducts).sort(([a], [b]) => {
        if (a === 'General Collection') return 1;
        if (b === 'General Collection') return -1;
        return a.localeCompare(b);
    });

    return (
        <div className="store-section-page">
            <Navbar />

            <div className="container" style={{ marginTop: '80px', paddingBottom: '4rem' }}>
                <div className="section-header-simple" style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <Link to={`/store/${storeId}`} className="back-btn" style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        width: '40px', height: '40px', borderRadius: '50%',
                        background: '#f1f5f9', color: '#64748b', transition: '0.2s'
                    }}>
                        <ArrowLeft size={20} />
                    </Link>
                    <div>
                        <h1 style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e293b', lineHeight: '1.2' }}>{store.name}</h1>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
                            <Store size={14} />
                            <span>Full Collection</span>
                            <span>•</span>
                            <span>{products.length} Items</span>
                        </div>
                    </div>
                </div>

                {sortedSections.map(([secName, secProducts]) => (
                    <div
                        key={secName}
                        id={`section-${secName.replace(/\s+/g, '-').toLowerCase()}`}
                        className="store-section-block"
                        style={{ marginBottom: '3rem' }}
                    >
                        <h2 style={{
                            fontSize: '1.4rem',
                            fontWeight: '700',
                            color: '#334155',
                            marginBottom: '1.5rem',
                            paddingBottom: '0.5rem',
                            borderBottom: '2px solid #f1f5f9',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'baseline'
                        }}>
                            {secName}
                            <span style={{ fontSize: '0.9rem', color: '#94a3b8', fontWeight: '500' }}>{secProducts.length} items</span>
                        </h2>

                        <div className="products-grid-section">
                            {secProducts.map(product => (
                                <ProductCard key={product.id} product={{ ...product, storeName: store.name }} />
                            ))}
                        </div>
                    </div>
                ))}

                {products.length === 0 && (
                    <div className="empty-state" style={{ textAlign: 'center', padding: '4rem 0', color: '#94a3b8' }}>
                        <p>No products found in this store.</p>
                    </div>
                )}
            </div>

            <style>{`
                .products-grid-section {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
                    gap: 1.5rem;
                }

                @media (max-width: 768px) {
                    .products-grid-section {
                        grid-template-columns: repeat(2, 1fr);
                        gap: 1rem;
                    }
                }
            `}</style>
        </div>
    );
};

export default StoreSection;
