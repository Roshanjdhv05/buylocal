import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Tag, ChevronLeft, ChevronRight, Store, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [rating, setRating] = useState({ avg: 0, count: 0 });

  useEffect(() => {
    if (user) {
      checkWishlistStatus();
    }
    fetchRating();
  }, [user, product.id]);

  const fetchRating = async () => {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', product.id);

      if (data && data.length > 0) {
        const avg = data.reduce((acc, r) => acc + r.rating, 0) / data.length;
        setRating({ avg: avg.toFixed(1), count: data.length });
      }
    } catch (err) {
      console.error('Error fetching rating:', err);
    }
  };

  const checkWishlistStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('wishlist')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', product.id)
        .single();

      if (data) setIsLiked(true);
      if (error && error.code !== 'PGRST116') throw error;
    } catch (error) {
      console.error('Error checking wishlist:', error.message);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.stopPropagation();
    if (!user) return navigate('/login', { state: { from: location } });
    if (wishlistLoading) return;

    setWishlistLoading(true);
    try {
      if (isLiked) {
        const { error } = await supabase
          .from('wishlist')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id);
        if (error) throw error;
        setIsLiked(false);
      } else {
        const { error } = await supabase
          .from('wishlist')
          .insert([{ user_id: user.id, product_id: product.id }]);
        if (error) throw error;
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Wishlist action failed:', error.message);
      alert('Fail to update wishlist');
    } finally {
      setWishlistLoading(false);
    }
  };

  // Handle image arrays or single strings
  const getImages = () => {
    if (Array.isArray(product.images) && product.images.length > 0) return product.images;
    if (Array.isArray(product.image_urls) && product.image_urls.length > 0) return product.image_urls;
    if (typeof product.image === 'string') return [product.image];
    return ['https://via.placeholder.com/300x300?text=No+Image'];
  };

  const images = getImages();

  useEffect(() => {
    let interval;
    if (isHovered && images.length > 1) {
      interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
      }, 1200);
    } else if (!isHovered) {
      setCurrentImageIndex(0); // Reset to cover image when not hovering
    }
    return () => clearInterval(interval);
  }, [isHovered, images.length]);



  const handleAddToCart = (e) => {
    e.stopPropagation();
    if (!user) {
      return navigate('/login', { state: { from: location } });
    }
    addToCart(product);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const handleProductClick = async () => {
    try {
      // Increment views_count in background
      await supabase.rpc('increment_product_views', { product_id: product.id });
    } catch (err) {
      // Fallback to manual update if RPC is missing
      try {
        const currentViews = product.views_count || 0;
        await supabase
          .from('products')
          .update({ views_count: currentViews + 1 })
          .eq('id', product.id);
      } catch (innerErr) {
        console.warn('Could not increment views:', innerErr.message);
      }
    }
    navigate(`/product/${product.id}`);
  };

  return (
    <div
      className="product-card"
      onClick={handleProductClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="card-badges">
        <div className="badge-category">{product.category || 'Product'}</div>
        <button
          className={`badge-wishlist ${isLiked ? 'liked' : ''}`}
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
        >
          <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="product-image">
        <img src={images[currentImageIndex]} alt={product.name} />

        {images.length > 1 && isHovered && (
          <>
            <button className="slider-btn prev" onClick={prevImage}><ChevronLeft size={16} /></button>
            <button className="slider-btn next" onClick={nextImage}><ChevronRight size={16} /></button>
            <div className="slider-dots">
              {images.map((_, idx) => (
                <span key={idx} className={`dot ${idx === currentImageIndex ? 'active' : ''}`}></span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="product-content">
        <div className="store-info">
          <Store size={12} className="store-icon" />
          <span className="store-name">{product.storeName || 'Local Store'}</span>
          {rating.count > 0 && (
            <span className="rating-badge-card">
              <Star size={10} fill="currentColor" /> {rating.avg}
            </span>
          )}
          {product.distance && product.distance !== Infinity && (
            <span className="store-dist">• {product.distance.toFixed(1)}km away</span>
          )}
        </div>

        <h3 className="product-title">{product.name}</h3>

        <div className="price-row">
          <span className="current-price">₹{product.online_price || product.price}</span>
          {product.mrp && <span className="original-price">₹{product.mrp}</span>}
        </div>

        <button className="btn-add-cart" onClick={handleAddToCart}>
          <ShoppingCart size={16} /> Add to Cart
        </button>
      </div>

      <style>{`
        .product-card {
          position: relative;
          background: white;
          border-radius: 16px;
          overflow: hidden;
          transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s;
          display: flex;
          flex-direction: column;
          border: 1px solid #f1f5f9;
          height: 100%;
        }
        .product-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
          border-color: var(--primary);
        }

        .card-badges {
            position: absolute;
            top: 0.75rem;
            left: 0.75rem;
            right: 0.75rem;
            display: flex;
            justify-content: space-between;
            z-index: 10;
        }
        .badge-category {
            background: rgba(255,255,255,0.95);
            backdrop-filter: blur(8px);
            padding: 0.3rem 0.75rem;
            border-radius: 6px;
            font-size: 0.65rem;
            font-weight: 800;
            text-transform: uppercase;
            color: var(--text-main);
            letter-spacing: 0.5px;
            box-shadow: var(--shadow-sm);
        }
        .badge-wishlist {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            background: white;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 1px solid var(--border);
            color: var(--text-muted);
            transition: var(--transition);
            box-shadow: var(--shadow-sm);
        }
        .badge-wishlist:hover { color: var(--secondary); border-color: var(--secondary); transform: scale(1.1); }
        .badge-wishlist.liked {
            background: #fef2f2;
            color: #ef4444;
            border-color: #fecaca;
        }

        .product-image {
          width: 100%;
          aspect-ratio: 1;
          background: #f8fafc;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .product-card:hover .product-image img { transform: scale(1.1); }

        /* Slider Controls */
        .slider-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.9);
            border: 1px solid var(--border);
            border-radius: 50%;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            z-index: 5;
            color: var(--text-main);
            box-shadow: var(--shadow-sm);
        }
        .slider-btn.prev { left: 8px; }
        .slider-btn.next { right: 8px; }
        .slider-dots {
            position: absolute;
            bottom: 12px;
            left: 0; right: 0;
            display: flex;
            justify-content: center;
            gap: 4px;
            z-index: 5;
        }
        .dot {
            width: 5px; height: 5px;
            background: rgba(255,255,255,0.5);
            border-radius: 50%;
            transition: 0.3s;
        }
        .dot.active { background: white; width: 12px; border-radius: 10px; }

        .product-content {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          flex-grow: 1;
        }

        .store-info {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            color: var(--text-muted);
            font-size: 0.75rem;
            margin-bottom: 0.25rem;
        }
        .store-icon { color: var(--primary); opacity: 0.8; }
        .store-dist { opacity: 0.7; }

        .product-title {
          font-size: 1rem;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-bottom: 0.1rem;
        }

        .price-row {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }
        .current-price {
            font-size: 1.2rem;
            font-weight: 800;
            color: var(--text-main);
        }
        .original-price {
            font-size: 0.8rem;
            color: var(--text-muted);
            text-decoration: line-through;
        }

        .btn-add-cart {
            width: 100%;
            background: #0f172a;
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: 10px;
            font-weight: 700;
            font-size: 0.85rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: all 0.3s ease;
            margin-top: auto;
        }
        .btn-add-cart:hover {
            background: var(--primary);
            transform: scale(1.02);
            box-shadow: 0 10px 15px -3px rgba(99, 102, 241, 0.4);
        }

        .rating-badge-card {
            display: flex;
            align-items: center;
            gap: 3px;
            background: #fffbeb;
            color: #d97706;
            padding: 2px 8px;
            border-radius: 6px;
            font-size: 0.7rem;
            font-weight: 800;
            border: 1px solid #fde68a;
            margin-left: auto;
        }

        @media (max-width: 640px) {
            .product-card { border-radius: 12px; }
            .product-content { padding: 0.85rem; }
            .product-title { font-size: 0.95rem; }
            .current-price { font-size: 1.1rem; }
            .store-info { font-size: 0.7rem; }
            .badge-category { font-size: 0.6rem; padding: 0.2rem 0.5rem; }
            .btn-add-cart { padding: 0.65rem; font-size: 0.8rem; border-radius: 8px; }
        }

      `}</style>
    </div>
  );
};

export default ProductCard;
