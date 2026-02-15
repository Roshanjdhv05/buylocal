import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Home, ShoppingBag } from 'lucide-react';

const ProductNotFound = () => {
    const navigate = useNavigate();

    return (
        <div className="product-not-found-page">
            <div className="not-found-container container">
                <div className="not-found-content">
                    <div className="icon-wrapper">
                        <ShoppingBag size={64} color="#94a3b8" />
                        <div className="x-mark">×</div>
                    </div>

                    <h1>Product Not Found</h1>
                    <p>We couldn't find the product you're looking for. It might have been removed or the link might be incorrect.</p>

                    <div className="not-found-actions">
                        <button className="btn-outline-purple" onClick={() => navigate(-1)}>
                            <ArrowLeft size={20} /> Go Back
                        </button>
                        <button className="btn-solid-purple" onClick={() => navigate('/')}>
                            <Home size={20} /> Back to Home
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                .product-not-found-page {
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    background: #fdfdfd;
                    padding: 2rem;
                }
                .not-found-content {
                    text-align: center;
                    max-width: 480px;
                    background: white;
                    padding: 3rem 2rem;
                    border-radius: 24px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.04);
                    border: 1px solid #f1f5f9;
                }
                .icon-wrapper {
                    position: relative;
                    width: fit-content;
                    margin: 0 auto 2rem;
                }
                .x-mark {
                    position: absolute;
                    bottom: -5px;
                    right: -5px;
                    background: #ef4444;
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 18px;
                    font-weight: bold;
                    border: 3px solid white;
                }
                h1 {
                    font-size: 1.75rem;
                    font-weight: 900;
                    color: #0f172a;
                    margin-bottom: 1rem;
                }
                p {
                    color: #64748b;
                    line-height: 1.6;
                    margin-bottom: 2.5rem;
                }
                .not-found-actions {
                    display: flex;
                    gap: 1rem;
                    flex-direction: column;
                }
                @media (min-width: 640px) {
                    .not-found-actions {
                        flex-direction: row;
                        justify-content: center;
                    }
                }
                .btn-solid-purple {
                    background: #7c3aed;
                    color: white;
                    border: none;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .btn-solid-purple:hover {
                    background: #6d28d9;
                    transform: translateY(-2px);
                }
                .btn-outline-purple {
                    background: white;
                    color: #7c3aed;
                    border: 2px solid #7c3aed;
                    padding: 0.75rem 1.5rem;
                    border-radius: 12px;
                    font-weight: 700;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    cursor: pointer;
                    transition: 0.2s;
                }
                .btn-outline-purple:hover {
                    background: #f5f3ff;
                    transform: translateY(-2px);
                }
            `}</style>
        </div>
    );
};

export default ProductNotFound;
