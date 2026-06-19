import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabase';
import { Search, Filter, Eye, MessageCircle, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';

const AdminSupport = () => {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [adminNote, setAdminNote] = useState('');

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('support_tickets')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                if (error.code === '42P01') {
                    console.warn("Table support_tickets not found. Please run the migration script.");
                    setTickets([]);
                } else {
                    throw error;
                }
            } else {
                setTickets(data || []);
            }
        } catch (error) {
            console.error('Error fetching tickets:', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (status) => {
        if (!selectedTicket) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ status: status })
                .eq('id', selectedTicket.id);

            if (error) throw error;
            
            setSelectedTicket({ ...selectedTicket, status });
            setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, status } : t));
        } catch (error) {
            alert('Failed to update status: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleSaveNote = async () => {
        if (!selectedTicket) return;
        setUpdating(true);
        try {
            const { error } = await supabase
                .from('support_tickets')
                .update({ admin_notes: adminNote })
                .eq('id', selectedTicket.id);

            if (error) throw error;
            
            setSelectedTicket({ ...selectedTicket, admin_notes: adminNote });
            setTickets(tickets.map(t => t.id === selectedTicket.id ? { ...t, admin_notes: adminNote } : t));
            alert('Admin note saved.');
        } catch (error) {
            alert('Failed to save note: ' + error.message);
        } finally {
            setUpdating(false);
        }
    };

    const handleDeleteTicket = async (id) => {
        if (!window.confirm("Are you sure you want to delete this ticket?")) return;
        try {
            const { error } = await supabase
                .from('support_tickets')
                .delete()
                .eq('id', id);
            
            if (error) throw error;
            setTickets(tickets.filter(t => t.id !== id));
            setSelectedTicket(null);
        } catch (error) {
            alert('Failed to delete ticket: ' + error.message);
        }
    };

    const filteredTickets = tickets.filter(t => {
        const matchesSearch = t.ticket_id?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              t.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                              t.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = filterCategory === 'All' || t.category === filterCategory;
        const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
        return matchesSearch && matchesCategory && matchesStatus;
    });

    const getStatusColor = (status) => {
        switch(status) {
            case 'Open': return '#ef4444';
            case 'In Progress': return '#f59e0b';
            case 'Resolved': return '#10b981';
            case 'Closed': return '#6b7280';
            default: return '#6b7280';
        }
    };

    if (loading) return <div className="admin-loading"><LoadingSpinner /><p>Loading Support Tickets...</p></div>;

    if (selectedTicket) {
        return (
            <div className="ticket-detail-view" style={{ padding: '20px', background: 'white', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h2>Ticket Details: {selectedTicket.ticket_id}</h2>
                    <button onClick={() => setSelectedTicket(null)} className="btn-secondary" style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: '6px', background: '#f9f9f9' }}>Back to List</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
                    <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                        <h3>User Information</h3>
                        <p><strong>Name:</strong> {selectedTicket.name}</p>
                        <p><strong>Email:</strong> {selectedTicket.email}</p>
                        <p><strong>Mobile:</strong> {selectedTicket.mobile || 'N/A'}</p>
                        <p><strong>User Type:</strong> <span style={{ textTransform: 'capitalize' }}>{selectedTicket.user_type}</span></p>
                    </div>
                    <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                        <h3>Ticket Information</h3>
                        <p><strong>Category:</strong> {selectedTicket.category}</p>
                        <p><strong>Issue Type:</strong> {selectedTicket.issue_type}</p>
                        <p><strong>Status:</strong> <span style={{ color: getStatusColor(selectedTicket.status), fontWeight: 'bold' }}>{selectedTicket.status}</span></p>
                        <p><strong>Date:</strong> {new Date(selectedTicket.created_at).toLocaleString()}</p>
                    </div>
                </div>

                <div style={{ border: '1px solid #eee', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
                    <h3>Issue Description</h3>
                    <h4 style={{ margin: '10px 0', color: '#2c1840' }}>Subject: {selectedTicket.subject}</h4>
                    {selectedTicket.store_name && <p><strong>Store Name:</strong> {selectedTicket.store_name}</p>}
                    {selectedTicket.order_id && <p><strong>Order ID:</strong> {selectedTicket.order_id}</p>}
                    <div style={{ background: '#f5f5f5', padding: '15px', borderRadius: '6px', marginTop: '10px', whiteSpace: 'pre-wrap' }}>
                        {selectedTicket.description}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                    <div style={{ flex: 1, border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                        <h3>Admin Actions</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                            <button onClick={() => handleUpdateStatus('In Progress')} disabled={updating} style={{ padding: '8px 12px', background: '#f59e0b', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Mark In Progress</button>
                            <button onClick={() => handleUpdateStatus('Resolved')} disabled={updating} style={{ padding: '8px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Mark Resolved</button>
                            <button onClick={() => handleUpdateStatus('Closed')} disabled={updating} style={{ padding: '8px 12px', background: '#6b7280', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>Close Ticket</button>
                            <button onClick={() => handleDeleteTicket(selectedTicket.id)} style={{ padding: '8px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginLeft: 'auto' }}>Delete</button>
                        </div>
                    </div>
                    
                    <div style={{ flex: 1, border: '1px solid #eee', padding: '20px', borderRadius: '8px' }}>
                        <h3>Internal Notes</h3>
                        <textarea 
                            style={{ width: '100%', minHeight: '100px', padding: '10px', marginTop: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                            value={adminNote !== '' ? adminNote : (selectedTicket.admin_notes || '')}
                            onChange={(e) => setAdminNote(e.target.value)}
                            placeholder="Add internal admin notes here..."
                        />
                        <button onClick={handleSaveNote} disabled={updating} style={{ padding: '8px 15px', background: '#2c1840', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', marginTop: '10px' }}>
                            {updating ? 'Saving...' : 'Save Note'}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-support-container">
            <div className="stats-cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '30px' }}>
                <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div className="stat-info">
                        <span style={{ color: '#666' }}>Total Tickets</span>
                        <h3 style={{ fontSize: '24px', margin: '10px 0' }}>{tickets.length}</h3>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div className="stat-info">
                        <span style={{ color: '#666' }}>Open</span>
                        <h3 style={{ fontSize: '24px', margin: '10px 0', color: '#ef4444' }}>{tickets.filter(t => t.status === 'Open').length}</h3>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div className="stat-info">
                        <span style={{ color: '#666' }}>In Progress</span>
                        <h3 style={{ fontSize: '24px', margin: '10px 0', color: '#f59e0b' }}>{tickets.filter(t => t.status === 'In Progress').length}</h3>
                    </div>
                </div>
                <div className="stat-card" style={{ background: 'white', padding: '20px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                    <div className="stat-info">
                        <span style={{ color: '#666' }}>Resolved/Closed</span>
                        <h3 style={{ fontSize: '24px', margin: '10px 0', color: '#10b981' }}>{tickets.filter(t => ['Resolved', 'Closed'].includes(t.status)).length}</h3>
                    </div>
                </div>
            </div>

            <div className="admin-controls" style={{ display: 'flex', gap: '15px', marginBottom: '20px', background: 'white', padding: '15px', borderRadius: '12px', alignItems: 'center' }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#f5f5f5', padding: '8px 15px', borderRadius: '8px' }}>
                    <Search size={18} color="#666" style={{ marginRight: '10px' }} />
                    <input 
                        type="text" 
                        placeholder="Search by ID, name, email..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%' }}
                    />
                </div>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <Filter size={18} color="#666" />
                    <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}>
                        <option value="All">All Categories</option>
                        <option value="Buyer Support">Buyer Support</option>
                        <option value="Seller Support">Seller Support</option>
                        <option value="Other Support">Other Support</option>
                    </select>
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #ddd' }}>
                        <option value="All">All Statuses</option>
                        <option value="Open">Open</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Resolved">Resolved</option>
                        <option value="Closed">Closed</option>
                    </select>
                </div>
            </div>

            <div style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                            <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 600 }}>Ticket ID</th>
                            <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 600 }}>User</th>
                            <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 600 }}>Category</th>
                            <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 600 }}>Subject</th>
                            <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 600 }}>Date</th>
                            <th style={{ padding: '15px 20px', color: '#475569', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTickets.length > 0 ? (
                            filteredTickets.map(ticket => (
                                <tr key={ticket.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '15px 20px', fontWeight: '500' }}>{ticket.ticket_id}</td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <div>{ticket.name}</div>
                                        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>{ticket.user_type}</div>
                                    </td>
                                    <td style={{ padding: '15px 20px' }}>{ticket.category}</td>
                                    <td style={{ padding: '15px 20px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ticket.subject}</td>
                                    <td style={{ padding: '15px 20px' }}>
                                        <span style={{ 
                                            padding: '4px 10px', 
                                            borderRadius: '20px', 
                                            fontSize: '0.85rem', 
                                            fontWeight: '600',
                                            background: getStatusColor(ticket.status) + '20',
                                            color: getStatusColor(ticket.status)
                                        }}>
                                            {ticket.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '15px 20px', fontSize: '0.9rem', color: '#64748b' }}>
                                        {new Date(ticket.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '15px 20px', textAlign: 'right' }}>
                                        <button 
                                            onClick={() => {
                                                setSelectedTicket(ticket);
                                                setAdminNote(ticket.admin_notes || '');
                                            }} 
                                            style={{ background: 'none', border: 'none', color: '#8c5a9e', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                                        >
                                            <Eye size={18} /> View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                                    No support tickets found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminSupport;
