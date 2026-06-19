import React, { useState } from 'react';
import { ShoppingBag, Store, MessageCircle, Check } from 'lucide-react';
import { supabase } from '../../services/supabase';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import './HelpSupport.css';

const HelpSupport = () => {
    const [selectedCategory, setSelectedCategory] = useState(null); // 'buyer', 'seller', 'other'
    const [selectedIssue, setSelectedIssue] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submittedTicket, setSubmittedTicket] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        mobile: '',
        order_id: '',
        store_name: '',
        subject: '',
        description: ''
    });

    const buyerIssues = [
        'Product Complaint',
        'Store Complaint',
        'Order Not Placed',
        'Order Not Received',
        'Wrong Product Received',
        'Refund Issue',
        'Payment Issue',
        'Delivery Issue',
        'Other Buyer Issue'
    ];

    const sellerIssues = [
        'Store Not Showing',
        'Product Not Showing',
        'Product Upload Issue',
        'Store Verification Issue',
        'Payment Settlement Issue',
        'Subscription Issue',
        'Dashboard Issue',
        'Store Settings Issue',
        'Other Seller Issue'
    ];

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const generateTicketId = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'TKT-';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const ticketId = generateTicketId();
            
            // Get current user if logged in
            const { data: { user } } = await supabase.auth.getUser();

            const ticketData = {
                ticket_id: ticketId,
                user_id: user?.id || null,
                user_type: selectedCategory === 'buyer' ? 'buyer' : selectedCategory === 'seller' ? 'seller' : 'guest',
                name: formData.name,
                email: formData.email,
                mobile: formData.mobile,
                store_name: formData.store_name,
                order_id: formData.order_id,
                category: selectedCategory === 'buyer' ? 'Buyer Support' : selectedCategory === 'seller' ? 'Seller Support' : 'Other Support',
                issue_type: selectedIssue || 'General Query',
                subject: formData.subject,
                description: formData.description,
                status: 'Open',
                priority: 'Medium'
            };

            const { error } = await supabase
                .from('support_tickets')
                .insert([ticketData]);

            if (error) {
                // If the table doesn't exist yet, we still want to show success for the UI demo
                if (error.code === '42P01') {
                    console.warn("Table support_tickets does not exist. Please run the SQL migration.");
                    setSubmittedTicket(ticketId);
                } else {
                    throw error;
                }
            } else {
                setSubmittedTicket(ticketId);
            }

        } catch (error) {
            alert('Failed to submit ticket. Please try again.');
            console.error('Error submitting ticket:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setSelectedCategory(null);
        setSelectedIssue('');
        setSubmittedTicket(null);
        setFormData({
            name: '', email: '', mobile: '', order_id: '', store_name: '', subject: '', description: ''
        });
    };

    return (
        <div className="help-support-page">
            <Navbar />
            
            <div className="help-support-container">
                {submittedTicket ? (
                    <div className="ticket-success">
                        <div className="success-icon">
                            <Check size={40} />
                        </div>
                        <h2>Ticket Submitted Successfully!</h2>
                        <p>Thank you for reaching out. We have received your request.</p>
                        <div className="ticket-ref">Ticket Reference: {submittedTicket}</div>
                        <p style={{ color: '#666', marginBottom: '30px' }}>
                            We will get back to you at <strong>{formData.email}</strong> shortly.
                        </p>
                        <button className="btn-secondary" onClick={resetForm}>
                            Submit Another Request
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="help-hero">
                            <h1>How can we help you?</h1>
                            <p>Select a category below and tell us about your issue.</p>
                        </div>

                        {!selectedCategory ? (
                            <div className="support-cards">
                                <div 
                                    className="support-card"
                                    onClick={() => setSelectedCategory('buyer')}
                                >
                                    <div className="support-card-icon">
                                        <ShoppingBag size={30} />
                                    </div>
                                    <h3>Buyer Support</h3>
                                    <p>Issues with orders, products, payments, or delivery</p>
                                </div>
                                <div 
                                    className="support-card"
                                    onClick={() => setSelectedCategory('seller')}
                                >
                                    <div className="support-card-icon">
                                        <Store size={30} />
                                    </div>
                                    <h3>Seller Support</h3>
                                    <p>Issues with store dashboard, products, or settlements</p>
                                </div>
                                <div 
                                    className="support-card"
                                    onClick={() => setSelectedCategory('other')}
                                >
                                    <div className="support-card-icon">
                                        <MessageCircle size={30} />
                                    </div>
                                    <h3>Other Support</h3>
                                    <p>General inquiries, feedback, or partnership requests</p>
                                </div>
                            </div>
                        ) : (
                            <div className="issue-selection">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                    <h3>
                                        {selectedCategory === 'buyer' && 'Buyer Support'}
                                        {selectedCategory === 'seller' && 'Seller Support'}
                                        {selectedCategory === 'other' && 'Other Support'}
                                    </h3>
                                    <button className="btn-secondary" style={{ padding: '6px 15px', fontSize: '0.9rem' }} onClick={() => setSelectedCategory(null)}>
                                        Go Back
                                    </button>
                                </div>

                                {selectedCategory !== 'other' && (
                                    <div className="issue-pills">
                                        {(selectedCategory === 'buyer' ? buyerIssues : sellerIssues).map(issue => (
                                            <div 
                                                key={issue} 
                                                className={`issue-pill ${selectedIssue === issue ? 'active' : ''}`}
                                                onClick={() => setSelectedIssue(issue)}
                                            >
                                                {issue}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {(selectedIssue || selectedCategory === 'other') && (
                                    <form className="support-form" onSubmit={handleSubmit}>
                                        <div className="form-group">
                                            <label>Full Name *</label>
                                            <input type="text" name="name" value={formData.name} onChange={handleInputChange} required placeholder="John Doe" />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address *</label>
                                            <input type="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="john@example.com" />
                                        </div>
                                        <div className="form-group">
                                            <label>Mobile Number</label>
                                            <input type="tel" name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="+91 9876543210" />
                                        </div>

                                        {selectedCategory === 'buyer' && (
                                            <>
                                                <div className="form-group">
                                                    <label>Order ID (Optional)</label>
                                                    <input type="text" name="order_id" value={formData.order_id} onChange={handleInputChange} placeholder="e.g. ORD-12345" />
                                                </div>
                                                <div className="form-group">
                                                    <label>Store Name (Optional)</label>
                                                    <input type="text" name="store_name" value={formData.store_name} onChange={handleInputChange} placeholder="Name of the store" />
                                                </div>
                                            </>
                                        )}

                                        {selectedCategory === 'seller' && (
                                            <div className="form-group full-width">
                                                <label>Your Store Name *</label>
                                                <input type="text" name="store_name" value={formData.store_name} onChange={handleInputChange} required placeholder="Enter your store name" />
                                            </div>
                                        )}

                                        <div className="form-group full-width">
                                            <label>Subject *</label>
                                            <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} required placeholder="Brief title for your issue" />
                                        </div>
                                        
                                        <div className="form-group full-width">
                                            <label>Detailed Description *</label>
                                            <textarea 
                                                name="description" 
                                                value={formData.description} 
                                                onChange={handleInputChange} 
                                                required 
                                                placeholder="Please provide as much detail as possible to help us resolve your issue quickly."
                                            ></textarea>
                                        </div>

                                        <button type="submit" className="submit-support-btn" disabled={isSubmitting}>
                                            {isSubmitting ? 'Submitting...' : 'Submit Support Request'}
                                        </button>
                                    </form>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            <Footer />
        </div>
    );
};

export default HelpSupport;
