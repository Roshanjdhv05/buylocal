import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Tag, ChevronLeft, ChevronRight, Store, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { getLocalizedName } from '../utils/productTranslations';

const ProductCard = ({ product }) => {
  const { t, i18n } = useTranslation();
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
      className={`luxury-product-card ${(product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 0) ? 'out-of-stock-card' : ''}`}
      onClick={handleProductClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="luxury-card-image-wrap">
        <img src={images[currentImageIndex]} alt={product.name} className="luxury-product-img" />
        
        {/* Badges */}
        <div className="luxury-badges-top">
          {product.is_new && <div className="luxury-badge new-badge">NEW</div>}
          {(product.stock_quantity !== null && product.stock_quantity !== undefined && product.stock_quantity <= 0) && (
            <div className="luxury-badge out-of-stock-badge">OUT OF STOCK</div>
          )}
        </div>

        <button
          className={`luxury-wishlist-btn ${isLiked ? 'liked' : ''}`}
          onClick={handleToggleWishlist}
          disabled={wishlistLoading}
        >
          <Heart size={18} fill={isLiked ? "currentColor" : "none"} strokeWidth={1.5} />
        </button>

        {images.length > 1 && isHovered && (
          <div className="luxury-img-controls">
            <button className="img-nav-btn" onClick={prevImage}><ChevronLeft size={16} /></button>
            <button className="img-nav-btn" onClick={nextImage}><ChevronRight size={16} /></button>
          </div>
        )}
      </div>

      <div className="luxury-product-info">
        <div className="luxury-product-header">
          <h3 className="luxury-product-name">{getLocalizedName(product.name, i18n.language)}</h3>
          <p className="luxury-product-subtitle">{product.subtitle || product.category || 'Curated Piece'}</p>
        </div>

        <div className="luxury-price-row">
          <span className="luxury-current-price">₹{product.online_price || product.price}</span>
          {product.mrp && product.mrp > (product.online_price || product.price) && (
            <span className="luxury-old-price">₹{product.mrp}</span>
          )}
        </div>
        
        <div className="luxury-card-footer">
          <div className="luxury-card-store">
            <Store size={10} />
            <span>{product.storeName || 'Boutique'}</span>
          </div>
          {rating.count > 0 && (
            <div className="luxury-card-rating">
              <Star size={10} fill="#facc15" color="#facc15" />
              <span>{rating.avg}</span>
            </div>
          )}
        </div>
      </div>      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600&family=Inter:wght@400;500;600&display=swap');

        .luxury-product-card {
          position: relative;
          background: transparent;
          display: flex;
          flex-direction: column;
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 12px;
          overflow: hidden;
          width: 100%;
        }

        .luxury-card-image-wrap {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          background: #fdfcfb;
          border-radius: 12px;
          margin-bottom: 0.5rem;
          border: 1px solid #f1f1f1;
        }

        @media (min-width: 1024px) {
            .luxury-card-image-wrap {
                aspect-ratio: 0.9;
            }
        }

        .luxury-product-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.6s ease;
        }
        .luxury-product-card:hover .luxury-product-img { transform: scale(1.05); }

        .luxury-badges-top {
          position: absolute;
          top: 8px;
          left: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          z-index: 2;
        }
        .luxury-badge {
          font-size: 0.55rem;
          font-weight: 700;
          padding: 3px 6px;
          border-radius: 4px;
          letter-spacing: 0.05em;
        }
        .new-badge { background: #7d4e33; color: white; }
        .out-of-stock-badge { background: #ef4444; color: white; }

        .luxury-wishlist-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: white;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7d4e33;
          box-shadow: 0 2px 8px rgba(0,0,0,0.05);
          cursor: pointer;
          z-index: 5;
          transition: all 0.2s ease;
        }
        .luxury-wishlist-btn.liked { background: #fef2f2; color: #ef4444; }
        
        .luxury-img-controls {
          position: absolute;
          inset: 0;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 8px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .luxury-card-image-wrap:hover .luxury-img-controls { opacity: 1; }
        .img-nav-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255,255,255,0.8);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #7d4e33;
          cursor: pointer;
        }

        .luxury-product-info {
          padding: 0 2px;
        }
        .luxury-product-name {
          font-family: 'Playfair Display', serif;
          font-size: 0.85rem;
          color: #2c241e;
          margin: 0;
          font-weight: 600;
          line-height: 1.2;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .luxury-product-subtitle {
          font-size: 0.6rem;
          color: #8b8b8b;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin: 1px 0 4px 0;
        }
        .luxury-price-row {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 4px;
        }
        .luxury-current-price {
          font-weight: 700;
          color: #7d4e33;
          font-size: 0.85rem;
        }
        .luxury-old-price {
          font-size: 0.7rem;
          color: #bcbcbc;
          text-decoration: line-through;
        }

        .luxury-card-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          opacity: 0.8;
          margin-top: 4px;
        }
        .luxury-card-store, .luxury-card-rating {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.6rem;
          color: #8b8b8b;
        }

        @media (max-width: 640px) {
            .luxury-product-name { font-size: 0.8rem; }
            .luxury-current-price { font-size: 0.8rem; }
            .luxury-card-image-wrap { border-radius: 8px; }
        }
      `}</style>
    </div>
  );
};

export default ProductCard;
