import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import './LegalStyles.css';

const Terms = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="legal-page-container">
            <Navbar />
            <main className="legal-main-content">
                <header className="legal-header">
                    <h1>Terms & Conditions</h1>
                    <p>Last updated: April 9, 2026</p>
                </header>

                <section className="legal-section">
                    <h2>1. Introduction and Acceptance of Terms</h2>
                    <p>
                        Welcome to our local marketplace platform (the "Platform" or "Service"). 
                        These Terms and Conditions ("Terms") govern your access to and use of our website, applications, and services. 
                        By registering for an account, accessing the Platform, or using any of our Services, you agree to be bound by these Terms and our Privacy Policy. 
                        If you do not agree to these Terms, you must not access or use out Platform.
                    </p>
                    <p>
                        Our Platform serves strictly as a digital marketplace to connect local buyers with independent local sellers. 
                        These terms apply equally to all users of the Platform, including but not limited to buyers, sellers, merchants, and casual visitors.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>2. Platform Role & Limitations</h2>
                    <p>
                        We act strictly as an intermediary technology platform. We do not own, sell, resell, provide, control, manage, offer, deliver, or supply any products or related logistic services listed on the Platform. 
                        When buyers make a purchase, they are entering into a direct, binding contract with the independent seller.
                    </p>
                    <p>
                        Because we are solely a facilitator, we do not verify the quality, safety, legality, or exact specifications of the items offered by sellers, nor do we guarantee the ability of sellers to complete a sale or the capability of buyers to complete a purchase. Any disputes regarding the product, delivery timeline, or fulfillment must be resolved directly between the buyer and the seller.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>3. User Accounts</h2>
                    <h3>3.1 Registration</h3>
                    <p>
                        To use certain features of the Platform (such as setting up a store or making purchases), you must register for an account. 
                        You agree to provide accurate, current, and complete information during the registration process and to keep this information up to date at all times.
                    </p>
                    <h3>3.2 Account Responsibilities</h3>
                    <p>
                        You are solely responsible for maintaining the confidentiality of your account credentials (including passwords) and for all activities that occur under your account. 
                        You must immediately notify us of any unauthorized use or suspected security breach of your account. We will not be liable for any loss or damage arising from your failure to safeguard your account.
                    </p>
                    <h3>3.3 Account Termination or Suspension</h3>
                    <p>
                        We reserve the right, at our sole discretion, to suspend or terminate your account, restrict your access to the Platform, or remove content without prior notice, if we believe you have violated these Terms, engaged in fraudulent activities, or acting in a manner detrimental to the platform or other users.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>4. Buyer Obligations</h2>
                    <p>
                        As a buyer participating in our local marketplace, you agree to specific obligations to ensure smooth transactions. 
                        You must set your location accurately within the application, as the stores displayed to you are heavily reliant on your chosen geolocation to ensure feasible order fulfillment.
                    </p>
                    <p>
                        By placing an order on the Platform, you make a binding offer to purchase the specified items from the seller. 
                        You agree to process orders only with honest intentions and refrain from placing frivolous, fake, or test orders that disrupt local businesses. 
                        You must provide valid contact and delivery information and ensure you are available during the agreed order fulfillment times.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>5. Seller Obligations</h2>
                    <p>
                        If you register as a seller, your responsibilities demand the highest level of transparency and professionalism. 
                        You must upload accurate listings, clearly indicating real-time inventory, factual product descriptions, correct images, and transparent pricing.
                    </p>
                    <p>
                        You are entirely responsible for fulfilling accepted orders within the reasonable timeframe expected by local buyers. 
                        You must honor the prices published on your digital storefront and communicate honestly with buyers regarding delays, stock shortages, or order cancellations. 
                        Sellers are strictly forbidden from listing prohibited items, engaging in price gouging, or treating buyers with unprofessional behavior.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>6. Order Flow and Fulfillment</h2>
                    <p>
                        The standard order lifecycle is managed primarily by the seller. When a buyer places an order, the request remains in a 'Pending' status. 
                        The seller has the explicit right to accept or reject this order based on their current inventory capacity. 
                        Only when a seller actively accepts the order does the fulfillment process begin. 
                        Sellers hold the physical goods and determine the specific dispatch and delivery protocols according to their local setup. 
                        Our Platform simply routes the order data; we do not control the drivers, packaging, or the delivery mechanism.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>7. Payment Terms</h2>
                    <p>
                        The standard payment framework depends on the options enabled by individual local sellers. 
                        Our platform accommodates varying methods, primarily including Cash on Delivery (COD) scenarios where payment is settled physically between the buyer and the seller or their delivery agent.
                    </p>
                    <p>
                        Where online payments are facilitated interface-side, third-party payment gateways are utilized. The transaction is fundamentally between the buyer and the seller business. As the intermediary platform, we are merely processing the digital hand-off. Any direct issues regarding chargebacks, failed physical transfers, or incorrect amounts must be negotiated directly with the seller.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>8. Cancellation and Refunds</h2>
                    <p>
                        Order cancellations and refunds are subject to our comprehensive Cancellation & Refund Policy. 
                        Buyers possess the capability to cancel orders via the platform interface only if the order remains in a 'Pending' status. 
                        Once a seller accepts an order, it becomes locked into the fulfillment cycle.
                    </p>
                    <p>
                        Because we are only an intermediary, we do not handle or issue refunds directly. If a dispute or refund scenario arises after order acceptance, it must be resolved completely offline directly between the buyer and the seller. For specific conditions, please refer to our dedicated Cancellation & Refund Policy page.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>9. Prohibited Activities</h2>
                    <p>
                        To maintain a safe local community, users are strictly forbidden to engage in certain malicious actions. You may not use the Platform to:
                    </p>
                    <ul>
                        <li>Engage in any illegal, fraudulent, or deceptive practices.</li>
                        <li>Upload or list prohibited items including illicit drugs, hazardous materials, or stolen goods.</li>
                        <li>Create spam accounts, place fake orders, or harass other local users.</li>
                        <li>Attempt to hack, scrape, or otherwise interfere with the backend algorithms or data systems of the Platform.</li>
                        <li>Bypass the security measures and access control rules implemented for fair usage.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>10. Limitation of Liability</h2>
                    <p>
                        To the fullest extent allowable by applicable law, the Platform, its creators, affiliates, and employees shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages arising out of your utilization of our Service. 
                    </p>
                    <p>
                        Because we function strictly as a digital link between you and local businesses, we bear no liability relating to product liability, personal injury, property damage, food poisoning, poor product quality, delivery accidents, or any commercial dispute arising between a buyer and a seller. The Platform is provided on an "as is" and "as available" basis without any warranties of any kind.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>11. Indemnification</h2>
                    <p>
                        You agree to indemnify, defend, and hold harmless the Platform, its operators, officers, directors, and agents from and against all claims, liabilities, damages, losses, expenses, and legal fees, arising out of or in any way connected with your access to or use of the Service, your violation of these Terms, or your infringement of any third party rights (including intellectual property or consumer rights).
                    </p>
                </section>

                <section className="legal-section">
                    <h2>12. Modification of Terms</h2>
                    <p>
                        We reserve the broad right to modify, amend, or replace these Terms at any time at our sole discretion. 
                        When significant shifts in policy occur, we will endeavor to provide noticeable warnings on our website or through integrated app notifications. 
                        Your continued use of the Platform subsequent to such changes constitutes your explicit acceptance of the newly revised Terms.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>13. Governing Law</h2>
                    <p>
                        These Terms and any non-contractual disputes linked to them shall be governed by, and construed fairly in accordance with the prevalent laws of the jurisdiction in which the central business operations of the Platform are rooted, without regard to principles of conflicts of laws. 
                        Both parties implicitly submit to the exclusive jurisdiction of the competent courts attached to our operational base.
                    </p>
                </section>

                <div className="legal-contact-box">
                    <h3>Contact Us</h3>
                    <p>
                        If you have any questions or concerns specifically regarding these Terms & Conditions, or if you wish to report malicious user abuse crossing these terms, please contact our administrative support team using the platform's primary contact portals.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Terms;
