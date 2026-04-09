import React, { useEffect } from 'react';
import Navbar from '../../components/Navbar';
import './LegalStyles.css';

const Privacy = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    return (
        <div className="legal-page-container">
            <Navbar />
            <main className="legal-main-content">
                <header className="legal-header">
                    <h1>Privacy Policy</h1>
                    <p>Last updated: April 9, 2026</p>
                </header>

                <section className="legal-section">
                    <h2>1. Introduction to Digital Privacy</h2>
                    <p>
                        Our platform is deeply committed to ensuring the privacy and security of your personal data. 
                        As a local marketplace designed to connect community buyers directly with nearby sellers, understanding geographic and personal information is integral to how our platform functions. 
                        This Privacy Policy outlines systematically how we collect, use, process, and protect your information when you access or interact with our digital marketplace.
                    </p>
                    <p>
                        By choosing to use our services, you explicitly consent to the data practices described in this document. 
                        We aim for maximum transparency, so you are fully aware of what data we require, why we require it, and whom it might be shared with to enable your local shopping experience.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>2. Types of Data We Collect</h2>
                    <p>
                        To successfully operate a hyper-local e-commerce network, various data points must be aggregated. We categorize the information we collect into three primary segments:
                    </p>
                    <ul>
                        <li><strong>Personal Identification Data:</strong> This includes information you voluntarily provide upon registration, such as your full name, email address, profile pictures, and active phone numbers required for order delivery coordination.</li>
                        <li><strong>Precise Location Data:</strong> Because the platform strictly matches you with nearby independent sellers, we request permissions to collect GPS tracking and geocoordinates to personalize your feed. You can also manually add string-based addresses and zip codes.</li>
                        <li><strong>Usage and Device Information:</strong> We automatically collect metadata related to how you access the platform. This encompasses your IP address, browser type, operating system version, mobile device identifiers, crash logs, and the specific pages or storefronts you view during a session.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>3. Location Tracking and Usage</h2>
                    <p><strong>IMPORTANT: Locational Awareness is a Core Feature.</strong></p>
                    <p>
                        Unlike traditional global e-commerce, our platform is fundamentally driven by your physical proximity to stores. 
                        We utilize your location—whether granted passively via GPS or explicitly inputted as a saved address—specifically to filter and present stores capable of delivering to your immediate area or offering a realistic self-pickup range.
                    </p>
                    <p>
                        While you may browse without sharing location data, functionality will be crippled. Your location is actively cross-referenced against seller delivery radiuses. Although we continuously process this data to enhance application matching algorithms, we do not indiscriminately broadcast your exact coordinates strictly to third-party public tracking architectures. Your specific geocode is primarily utilized internally for matching capability.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>4. How We Utilize Your Data</h2>
                    <p>
                        Every piece of data we gather is dedicated toward making your interactions smoother, safer, and highly relevant. The information collected is used precisely for the following operational workflows:
                    </p>
                    <ul>
                        <li><strong>Location-Based Store Matching:</strong> Filtering product catalogs to guarantee what you see is actually purchasable within your vicinity.</li>
                        <li><strong>Order Processing and Fulfillment:</strong> Transmitting your required contact and address details efficiently to the specific seller processing your transaction.</li>
                        <li><strong>Vital Communication:</strong> Keeping you informed with critical push notifications regarding order status changes, account verifications, and direct queries from sellers.</li>
                        <li><strong>Platform Improvement:</strong> Aggregating massive usage metrics to resolve software bugs, improve UI elements, and expand geographic scaling intelligently without identifying you personally.</li>
                    </ul>
                </section>

                <section className="legal-section">
                    <h2>5. Data Sharing Protocols</h2>
                    <p>
                        As an intermediary platform linking you with independent local businesses, sharing certain information is mandatory regarding a successful commercial exchange. 
                        When you successfully checkout, we actively transmit your name, phone number, and delivery address to the respective seller so they can physically process and dispatch your ordered goods.
                    </p>
                    <p>
                        We operate entirely on a non-broker philosophy regarding your private information: <strong>We do not sell, rent, or lease your personal data to third-party marketing networks or data brokers.</strong> 
                        Outside of providing data directly to the sellers you actively patronize, we only share data with essential backend infrastructure services (such as our database hosting provider and push notification handlers) bound by strict confidentiality constraints, or when compelled by legitimate legal subpoenas from law enforcement entities.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>6. Data Storage and Security Practices</h2>
                    <p>
                        We employ modern, industry-standard security models to safeguard your sensitive information against unauthorized intrusion, alteration, or disclosure. 
                        Our databases run with end-to-end security configurations mapped over secure cloud architectures incorporating Row Level Security (RLS) to restrict user data visibility exclusively to authenticated, relevant parties.
                    </p>
                    <p>
                        While we strive for impenetrable defenses incorporating SSL encryptions and tokenized session controls, you must acknowledge that no methodology of transmitting information over the internet is technically infallible, and absolute security unfortunately cannot be guaranteed.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>7. Cookies and Tracking Technologies</h2>
                    <p>
                        We deploy "cookies" (small localized data text files sent to your browser) along with analogous technologies like web beacons and session storage tools to retain your user preferences. 
                        Cookies ensure you stay logged in seamlessly between visits, retrieve your shopping cart, and skip redundant geographical prompts after your first visit.
                    </p>
                    <p>
                        You retain full control over cookies through your web browser parameters and can command your browser to outright reject them; however, blocking essential operational cookies will disrupt significant elements of our platform's functionality.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>8. Your Rights Regarding Your Data</h2>
                    <p>
                        You maintain significant sovereignty over the data entrusted to our platform. You have the actionable right to access and review the personal information held within your user profile dashboard. 
                        You can autonomously update, modify, or correct inaccuracies associated with your account at any time.
                    </p>
                    <p>
                        Furthermore, you possess the right to outright deletion. You may submit a request to terminate your account and erase your primary identifiers from our active user roster, subject only to necessary data retentions enforcing previous transaction histories binding sellers' accounting obligations.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>9. Data Retention</h2>
                    <p>
                        We preserve your personal information solely for the duration indispensable to execute the functions sketched out within this Policy, unless an extended retention timeframe is legally commanded. 
                        Once your account is eradicated, passive residual data existing in automated backup archives will overwrite naturally without further processing.
                    </p>
                </section>

                <section className="legal-section">
                    <h2>10. Policy Updates</h2>
                    <p>
                        We hold the right to refresh and edit this Privacy Policy periodically as regulatory standards shift or our operational mechanisms advance. 
                        When comprehensive changes manifest, the "Last Updated" timestamp featured at the apex of this document will be amended prominently. Continued application usage after updates expresses an automated endorsement of the updated terms.
                    </p>
                </section>

                <div className="legal-contact-box">
                    <h3>Privacy Support Contact</h3>
                    <p>
                        Should you require clarification about our privacy safeguards, the data tracking mechanisms, or wish to invoke requests concerning your personal information, please navigate to our primary contact page to relay an inquiry to our administrative operations team.
                    </p>
                </div>
            </main>
        </div>
    );
};

export default Privacy;
