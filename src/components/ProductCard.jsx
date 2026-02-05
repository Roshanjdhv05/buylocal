import React, { useState, useEffect } from 'react';
import { ShoppingCart, MapPin, Tag, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useNavigate } from 'react-router-dom';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const productImages = product.images || product.image_urls || [];
  const images = productImages.length > 0
    ? productImages
    : ['https://via.placeholder.com/300x300?text=No+Image'];

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
      className="product-card glass-card"
      onClick={() => navigate(`/product/${product.id}`)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ cursor: 'pointer' }}
    >
      <div className="product-badge">
        <Tag size={12} /> {product.category}
      </div>

      <div className="product-image">
        <img src={images[currentImageIndex]} alt={product.name} />

        {images.length > 1 && (
          <>
            <button className="slider-btn prev" onClick={prevImage}>
              <ChevronLeft size={16} />
            </button>
            <button className="slider-btn next" onClick={nextImage}>
              <ChevronRight size={16} />
            </button>
            <div className="slider-dots">
              {images.map((_, idx) => (
                <span key={idx} className={`dot ${idx === currentImageIndex ? 'active' : ''}`}></span>
              ))}
            </div>
          </>
        )}
      </div>

      <div className="product-content">
        <div className="product-header">
          <h3 className="product-title">{product.name}</h3>
          <span className="product-price">₹{product.online_price}</span>
        </div>

        <p className="product-store">
          <MapPin size={14} /> {product.storeName}
          {product.distance !== Infinity && (
            <span className="distance-label"> &bull; {product.distance.toFixed(1)} km</span>
          )}
        </p>

        {product.offline_price && (
          <p className="offline-note">Offline Price: ₹{product.offline_price}</p>
        )}

        <button className="btn-primary add-to-cart" onClick={handleAddToCart}>
          <ShoppingCart size={18} /> Add to Cart
        </button>
      </div>

      <style>{`
        .product-card {
          position: relative;
          background: white;
          overflow: hidden;
          transition: var(--transition);
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .product-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
        }

        .product-badge {
          position: absolute;
          top: 1rem;
          left: 1rem;
          z-index: 2;
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(4px);
          padding: 0.25rem 0.75rem;
          border-radius: 99px;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--primary);
          display: flex;
          align-items: center;
          gap: 0.25rem;
          box-shadow: var(--shadow-sm);
        }

        .product-image {
          width: 100%;
          aspect-ratio: 1;
          overflow: hidden;
          background: #f1f5f9;
          position: relative;
        }
        .product-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          transition: transform 0.5s ease;
        }
        /* Only scale on hover if not interacting with slider */
        .product-card:hover .product-image img {
          transform: scale(1.05);
        }

        /* Slider Controls */
        .slider-btn {
            position: absolute;
            top: 50%;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.8);
            border: none;
            border-radius: 50%;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            opacity: 0;
            transition: 0.2s;
            z-index: 5;
            color: #333;
        }
        .product-card:hover .slider-btn { opacity: 1; }
        .slider-btn:hover { background: white; color: black; }
        .slider-btn.prev { left: 10px; }
        .slider-btn.next { right: 10px; }

        .slider-dots {
            position: absolute;
            bottom: 10px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: center;
            gap: 4px;
            z-index: 5;
        }
        .dot {
            width: 6px;
            height: 6px;
            background: rgba(255, 255, 255, 0.5);
            border-radius: 50%;
            transition: 0.2s;
        }
        .dot.active { background: white; width: 8px; height: 8px; }

        .product-content {
          padding: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          flex: 1;
        }

        .product-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 0.5rem;
        }
        .product-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: var(--text-main);
          margin: 0;
          line-height: 1.2;
        }
        .product-price {
          font-size: 1.25rem;
          font-weight: 800;
          color: var(--primary);
        }

        .product-store {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.875rem;
          color: var(--text-muted);
          margin: 0;
        }
        .distance-label {
          color: var(--success);
          font-weight: 600;
        }

        .offline-note {
          font-size: 0.8125rem;
          color: var(--text-muted);
          font-style: italic;
          margin: 0;
        }

        .add-to-cart {
          width: 100%;
          margin-top: auto;
          padding: 0.625rem;
          font-size: 0.9375rem;
        }
      `}</style>
    </div>
  );
};

export default ProductCard;
