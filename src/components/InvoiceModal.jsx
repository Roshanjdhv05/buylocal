import React from 'react';
import { BarChart, ChevronLeft } from 'lucide-react';

const InvoiceModal = ({ order, store, onClose }) => {
    if (!order || !store) return null;

    const calculateGST = (amount) => {
        const taxable = (amount * 100) / 118;
        const igst = amount - taxable;
        return { taxable: taxable.toFixed(2), igst: igst.toFixed(2), total: amount.toFixed(2) };
    };

    const handlePrintInvoice = () => {
        window.print();
    };

    const orderId = order.display_id || order.id.slice(0, 8).toUpperCase();

    return (
        <div className="invoice-modal-overlay" onClick={onClose}>
            <div className="invoice-modal-content" onClick={e => e.stopPropagation()}>
                <div className="invoice-actions no-print">
                    <button className="btn-print" onClick={handlePrintInvoice}><BarChart size={18} /> Download PDF</button>
                    <button className="btn-close" onClick={onClose}><ChevronLeft size={18} /> Back</button>
                </div>

                <div className="invoice-document" id="printable-invoice">
                    <div className="invoice-main-title">Tax Invoice</div>

                    <div className="invoice-top-section">
                        <div className="sold-by">
                            <p><strong>Sold By:</strong> {store.name} ,</p>
                            <p className="ship-from">Ship-from Address:</p>
                            <p className="store-addr-small">{store.address}, {store.city}, {store.state}</p>
                            <p className="gstin"><strong>GSTIN -</strong> {store.gst_number || 'N/A'}</p>
                        </div>
                        <div className="qr-box">
                            <div className="invoice-num-box">
                                Invoice Number # {orderId}
                            </div>
                        </div>
                    </div>

                    <div className="invoice-meta-section">
                        <div className="order-details-col">
                            <p><strong>Order ID:</strong> {orderId}</p>
                            <p><strong>Order Date:</strong> {new Date(order.created_at).toLocaleDateString()}</p>
                            <p><strong>Invoice Date:</strong> {new Date().toLocaleDateString()}</p>
                        </div>
                        <div className="billing-address-col">
                            <p><strong>Billing Address</strong></p>
                            <p>{order.buyer?.username || 'Customer'}</p>
                            <p>{order.shipping_address || 'Address not provided'}</p>
                            <p>Phone: {order.contact_number || 'xxxxxxxxxx'}</p>
                        </div>
                    </div>

                    <table className="tax-invoice-table">
                        <thead>
                            <tr>
                                <th>Description</th>
                                <th className="qty">Qty</th>
                                <th className="rate">Gross Amount ₹</th>
                                <th className="discount">Discount</th>
                                <th className="taxable">Taxable value ₹</th>
                                <th className="igst">IGST ₹</th>
                                <th className="total-col">Total ₹</th>
                            </tr>
                        </thead>
                        <tbody>
                            {order.items?.map((item, i) => {
                                const amount = (item.online_price || item.price) * item.quantity;
                                const { taxable, igst, total } = calculateGST(amount);
                                return (
                                    <tr key={i}>
                                        <td>
                                            <div className="item-name-sac">SAC: 998599</div>
                                            <div className="item-full-name">{item.name}</div>
                                            <div className="igst-rate">IGST: 18.0 %</div>
                                        </td>
                                        <td className="qty">{item.quantity}</td>
                                        <td className="rate">{amount.toFixed(2)}</td>
                                        <td className="discount">0.00</td>
                                        <td className="taxable">{taxable}</td>
                                        <td className="igst">{igst}</td>
                                        <td className="total-col">{total}</td>
                                    </tr>
                                );
                            })}
                            <tr className="table-total-row">
                                <td><strong>Total</strong></td>
                                <td className="qty">{order.items?.reduce((acc, item) => acc + (item.quantity || 1), 0)}</td>
                                <td className="rate">{order.items?.reduce((acc, item) => acc + ((item.online_price || item.price) * (item.quantity || 1)), 0).toFixed(2)}</td>
                                <td className="discount">0.00</td>
                                <td className="taxable">{calculateGST(order.items?.reduce((acc, item) => acc + ((item.online_price || item.price) * (item.quantity || 1)), 0)).taxable}</td>
                                <td className="igst">{calculateGST(order.items?.reduce((acc, item) => acc + ((item.online_price || item.price) * (item.quantity || 1)), 0)).igst}</td>
                                <td className="total-col">{order.items?.reduce((acc, item) => acc + ((item.online_price || item.price) * (item.quantity || 1)), 0).toFixed(2)}</td>
                            </tr>
                        </tbody>
                    </table>

                    <div className="grand-total-section">
                        <div className="grand-total-label">Grand Total</div>
                        <div className="grand-total-value">₹ {order.total_amount.toFixed(2)}</div>
                    </div>

                    <div className="invoice-signature-section">
                        <p className="store-signature-name">{store.name}</p>
                    </div>
                </div>

                <style>{`
                    .invoice-modal-overlay {
                        position: fixed;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: rgba(0, 0, 0, 0.7);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        z-index: 9999;
                    }
                    .invoice-modal-content {
                        background: white;
                        width: 90%;
                        max-width: 900px;
                        max-height: 90vh;
                        overflow-y: auto;
                        border-radius: 8px;
                        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
                    }
                    .invoice-actions {
                        display: flex;
                        justify-content: flex-end;
                        gap: 1rem;
                        padding: 1rem 2rem;
                        background: #f8fafc;
                        border-bottom: 1px solid #e2e8f0;
                        position: sticky;
                        top: 0;
                        z-index: 10;
                    }
                    .btn-print { background: #1e293b; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; display: flex; alignItems: center; gap: 0.5rem; }
                    .btn-close { background: white; border: 1px solid #e2e8f0; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; }

                    .invoice-document {
                        padding: 2rem 3rem;
                        color: #000;
                        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                        line-height: 1.4;
                    }
                    .invoice-main-title {
                        text-align: center;
                        font-size: 1.5rem;
                        font-weight: bold;
                        margin-bottom: 1.5rem;
                    }
                    .invoice-top-section {
                        display: flex;
                        justify-content: space-between;
                        margin-bottom: 1.5rem;
                    }
                    .sold-by p { margin: 0; font-size: 0.9rem; }
                    .ship-from { font-style: italic; margin-top: 2px !important; }
                    .gstin { margin-top: 10px !important; }
                    
                    .qr-box { text-align: right; }
                    .invoice-num-box {
                        border: 1px dashed #000;
                        padding: 5px 10px;
                        font-size: 0.85rem;
                        display: inline-block;
                    }

                    .invoice-meta-section {
                        display: flex;
                        justify-content: space-between;
                        border-top: 1px solid #000;
                        padding-top: 1rem;
                        margin-bottom: 1.5rem;
                        gap: 2rem;
                    }
                    .order-details-col p, .billing-address-col p { margin: 0; font-size: 0.9rem; }
                    .billing-address-col { max-width: 300px; }

                    .tax-invoice-table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 2rem;
                        border-top: 1px solid #000;
                        border-bottom: 1px solid #000;
                    }
                    .tax-invoice-table th {
                        font-size: 0.8rem;
                        padding: 8px;
                        text-align: left;
                        border-bottom: 1px solid #000;
                    }
                    .tax-invoice-table td {
                        padding: 8px;
                        font-size: 0.85rem;
                        vertical-align: top;
                    }
                    .qty, .rate, .discount, .taxable, .igst, .total-col { text-align: right !important; }
                    
                    .item-name-sac { font-size: 0.75rem; }
                    .item-full-name { font-weight: bold; margin: 2px 0; }
                    .igst-rate { font-size: 0.7rem; color: #444; border-top: 1px solid #ddd; display: inline-block; padding-top: 2px; }

                    .table-total-row { border-top: 1px solid #000; }
                    
                    .grand-total-section {
                        display: flex;
                        justify-content: flex-end;
                        gap: 4rem;
                        margin-top: 1.5rem;
                        padding-bottom: 2rem;
                    }
                    .grand-total-label { font-size: 1.2rem; font-weight: bold; }
                    .grand-total-value { font-size: 1.2rem; font-weight: bold; }

                    .invoice-signature-section {
                        text-align: right;
                        margin-top: 2rem;
                    }
                    .store-signature-name { font-weight: bold; margin-bottom: 0; }

                    @media print {
                        body * { visibility: hidden; }
                        .invoice-modal-overlay, .invoice-modal-content, #printable-invoice, #printable-invoice * {
                            visibility: visible !important;
                        }
                        .invoice-modal-overlay { position: absolute; top: 0; left: 0; overflow: visible; background: white; width: 100%; }
                        .invoice-modal-content { box-shadow: none; width: 100%; max-width: none; overflow: visible; }
                        .no-print { display: none !important; }
                        .invoice-document { padding: 0.5cm; }
                        @page { margin: 1cm; }
                    }
                `}</style>
            </div>
        </div>
    );
};

export default InvoiceModal;
