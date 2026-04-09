import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import './LegalStyles.css';

const Refunds = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="legal-page-container">
            <Navbar />
            <main className="legal-main-content">
                <header className="legal-header">
                    <h1>Cancellation & Refund Policy</h1>
                    <p>Last updated: April 9, 2026</p>
                </header>

                <section className="legal-section">
                    <h2>1. Platform Disclaimer</h2>
                    <p><strong>Please read this section very carefully:</strong></p>
                    <p>
                        Our application strictly operates as an intermediary marketplace connecting buyers to local independent stores. 
                        <strong>We do not manage, process, hold, or dictate financial refunds on behalf of either the buyer or the seller.</strong>
                    </p>
                    <p>
                        All physical transactions, returns, and refund requests are directly managed between the buyer and the local seller according to that specific seller's individual store policies. 
                        Because most local transactions execute via Cash on Delivery or external direct payment interfaces handled by the store, any return of funds or exchanging of products occurs entirely offline via direct coordination with the merchant. 
                        The platform bears zero responsibility for settling refund disputes.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>2. Order Cancellation Rules</h2>
                    <h3>2.1 Buyer-Initiated Cancellations</h3>
                    <p>
                        As a buyer, you have the immediate capability to cancel an order directly through your dashboard interface exclusively while the order maintains a "Pending" status. 
                        A "Pending" status indicates that the digital request has been dispatched to the seller, but no active operational commitment to fulfill the order has begun.
                    </p>
                    <p>
                        Once an order status shifts to "Accepted", "Dispatched", or any status signaling preparation, the digital cancellation button is administratively locked. 
                        From this moment, canceling the purchase requires direct communication with the seller via phone or message. The seller must consent to manually aborting the dispatched order.
                    </p>
                    
                    <h3>2.2 Seller-Initiated Cancellations</h3>
                    <p>
                        Local sellers retain the absolute right to cancel your order after receiving it for several operational reasons. 
                        Typical scenarios include abrupt inventory shortages, catastrophic logistical delays avoiding feasible delivery, pricing errors, or suspicion of fraudulent buyer activity. 
                        If a seller cancels your accepted or pending order, your dashboard will reflect a "Cancelled" status updating you immediately.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>3. Conditions for Possible Refunds</h2>
                    <p>
                        Because refund rules are intrinsically drafted by the individual business owners offering the products, the conditions determining validity shift from store to store. 
                        We highly urge all buyers to proactively check the specific refund procedures, policies, and timelines explicitly stated on a seller's profile or contact them directly before finalizing bulk purchases.
                    </p>
                    <p>
                        Typically, within a local retail paradigm, you might successfully negotiate a refund directly with a seller under the following catastrophic conditions (subject exclusively to seller approval):
                    </p>
                    <ul>
                        <li>Receiving a product radically different from the explicit digital listing.</li>
                        <li>Receiving goods that are severely defective, mechanically broken, or structurally damaged upon the precise moment of delivery.</li>
                        <li>The receipt of expired or severely compromised perishable goods compromising health safety.</li>
                        <li>If prepaid, the definitive failure of the seller to deliver the goods after a protracted margin beyond the estimated delivery timeframe.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>4. Generally Non-Refundable Scenarios</h2>
                    <p>
                        Conversely, there are universally established scenarios where local merchants conventionally decline processing any refund structures or item returns. 
                        While subject to the merchant, buyers should expect that refunds are predominantly prohibited involving:
                    </p>
                    <ul>
                        <li><strong>A Change of Mind:</strong> Arbitrarily deciding subsequent to delivery that the requested item is no longer aesthetically pleasing or required.</li>
                        <li><strong>Wrong Orders:</strong> Accidentally buying the wrong model, flavor, or variation due strictly to buyer negligence.</li>
                        <li><strong>Used or Tampered Goods:</strong> Items displaying any degree of usage, structural manipulation, missing peripheral components, or ruptured proprietary packaging seals.</li>
                        <li><strong>Custom Goods:</strong> Any item explicitly manufactured, tailored, or personalized specifically targeting the initial buyer's parameters.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>5. Resolving Disputes</h2>
                    <p>
                        If a buyer requests a return and the seller denies the refund based on their independent store policies, the platform provides no tribunal mechanism to enforce a financial override. 
                        We do not act as an arbitration agency. 
                    </p>
                    <p>
                        If you believe a store is aggressively operating a scam or continuously failing to deliver goods to local peers, we ask that you immediately report the storefront directly to our support agents. 
                        While we undeniably cannot refund your money due to our intermediary constraints, we can unilaterally deploy platform suspension protocols against malicious sellers violating consumer trust, shielding future victims.
                    </p>
                </section>

                <div className="legal-contact-box">
                    <h3>Dispute Guidance</h3>
                    <p>
                        Before buying a high-value item locally, please actively inquire the merchant about their specific return guarantees regarding the item. 
                        To report a severely non-compliant local store operating fraudulently, please escalate a ticket directly through our contact portal.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Refunds;
