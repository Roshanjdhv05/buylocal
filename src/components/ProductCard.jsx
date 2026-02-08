import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart, Tag, ChevronLeft, ChevronRight, Store, Star } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../context/AuthContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
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
    if (!user) return navigate('/login');
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

  return (
    <div
      className="product-card"
      onClick={() => navigate(`/product/${product.id}`)}
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
          border-radius: var(--radius-lg);
          overflow: hidden;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          border: 1px solid #f1f5f9;
          height: 100%;
        }
        .product-card:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-lg);
          border-color: transparent;
        }

        .card-badges {
            position: absolute;
            top: 1rem;
            left: 1rem;
            right: 1rem;
            display: flex;
            justify-content: space-between;
            z-index: 10;
        }
        .badge-category {
            background: rgba(255,255,255,0.9);
            backdrop-filter: blur(4px);
            padding: 0.25rem 0.6rem;
            border-radius: 4px;
            font-size: 0.7rem;
            font-weight: 700;
            text-transform: uppercase;
            color: var(--primary);
            letter-spacing: 0.5px;
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
        }
        .badge-wishlist:hover { color: var(--secondary); border-color: var(--secondary); }
        .badge-wishlist.liked {
            background: #fef2f2;
            color: #ef4444;
            border-color: #fecaca;
        }

        .product-image {
          width: 100%;
          height: 200px;
          background: #f8fafc;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .product-image img {
          width: 85%;
          height: 85%;
          object-fit: contain;
          transition: transform 0.5s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        }
        .product-card:hover .product-image img { transform: scale(1.08); }

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
        }
        .slider-btn.prev { left: 8px; }
        .slider-btn.next { right: 8px; }
        .slider-dots {
            position: absolute;
            bottom: 10px;
            left: 0; right: 0;
            display: flex;
            justify-content: center;
            gap: 4px;
            z-index: 5;
        }
        .dot {
            width: 6px; height: 6px;
            background: rgba(0,0,0,0.2);
            border-radius: 50%;
        }
        .dot.active { background: var(--primary); }

        .product-content {
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex-grow: 1;
        }

        .store-info {
            display: flex;
            align-items: center;
            gap: 0.35rem;
            color: var(--text-muted);
            font-size: 0.75rem;
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
          margin-bottom: 0.25rem;
        }

        .price-row {
            display: flex;
            align-items: baseline;
            gap: 0.5rem;
            margin-bottom: 0.75rem;
        }
        .current-price {
            font-size: 1.25rem;
            font-weight: 800;
            color: var(--primary);
        }
        .original-price {
            font-size: 0.875rem;
            color: var(--text-muted);
            text-decoration: line-through;
        }

        .btn-add-cart {
            width: 100%;
            background: var(--primary);
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: var(--radius-md);
            font-weight: 600;
            font-size: 0.9rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: var(--transition);
        }
        .btn-add-cart:hover {
            background: var(--primary-hover);
            transform: translateY(-2px);
            box-shadow: 0 4px 6px -1px rgba(99, 102, 241, 0.4);
        }

        .rating-badge-card {
            display: flex;
            align-items: center;
            gap: 2px;
            background: #fffbeb;
            color: #d97706;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.65rem;
            font-weight: 700;
            border: 1px solid #fde68a;
            margin-left: auto;
        }
      `}</style>
    </div>
  );
};

export default ProductCard;
