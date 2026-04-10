import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import './ImageLightbox.css';

const ImageLightbox = ({ images, currentIndex, onClose }) => {
    const [index, setIndex] = useState(currentIndex);
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const handleNext = useCallback((e) => {
        if (e) e.stopPropagation();
        setIndex((prev) => (prev + 1) % images.length);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, [images.length]);

    const handlePrev = useCallback((e) => {
        if (e) e.stopPropagation();
        setIndex((prev) => (prev - 1 + images.length) % images.length);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
    }, [images.length]);

    const handleZoomIn = (e) => {
        if (e) e.stopPropagation();
        setZoom(prev => Math.min(prev + 0.5, 4));
    };

    const handleZoomOut = (e) => {
        if (e) e.stopPropagation();
        setZoom(prev => Math.max(prev - 0.5, 1));
        if (zoom <= 1.5) setPosition({ x: 0, y: 0 });
    };

    const handleMouseDown = (e) => {
        if (zoom > 1) {
            setIsDragging(true);
            setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
        }
    };

    const handleMouseMove = (e) => {
        if (isDragging && zoom > 1) {
            setPosition({
                x: e.clientX - dragStart.x,
                y: e.clientY - dragStart.y
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    // Keyboard support
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowRight') handleNext();
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleNext, handlePrev, onClose]);

    // Prevent scrolling when lightbox is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, []);

    return (
        <div className="lightbox-overlay" onClick={onClose}>
            <div className="lightbox-controls">
                <div className="zoom-controls">
                    <button onClick={handleZoomOut} disabled={zoom <= 1}><ZoomOut size={20} /></button>
                    <button onClick={handleZoomIn} disabled={zoom >= 4}><ZoomIn size={20} /></button>
                    <button onClick={() => { setZoom(1); setPosition({ x: 0, y: 0 }); }}><Maximize size={20} /></button>
                </div>
                <button className="close-btn" onClick={onClose}><X size={24} /></button>
            </div>

            <div className="lightbox-content" onClick={(e) => e.stopPropagation()}>
                {images.length > 1 && (
                    <button className="nav-btn prev" onClick={handlePrev}>
                        <ChevronLeft size={36} />
                    </button>
                )}

                <div 
                    className={`image-container ${isDragging ? 'dragging' : ''}`}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <img 
                        src={images[index]} 
                        alt={`Lightbox product ${index}`}
                        style={{
                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})`,
                            cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default'
                        }}
                        draggable={false}
                    />
                </div>

                {images.length > 1 && (
                    <button className="nav-btn next" onClick={handleNext}>
                        <ChevronRight size={36} />
                    </button>
                )}
            </div>

            <div className="lightbox-footer">
                <span className="image-counter">{index + 1} / {images.length}</span>
            </div>
        </div>
    );
};

export default ImageLightbox;
