import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const TermsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-700/[0.2] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
            <div className="relative z-10 flex flex-col flex-grow">
                <Header />
                <main className="flex-grow container mx-auto px-6 py-16">
                    <div className="max-w-4xl mx-auto text-slate-300">
                        <h1 className="text-4xl font-bold text-white mb-8">Terms of Service</h1>
                        <div className="space-y-6 text-slate-400">
                            <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                            <p>Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the GhostCode application (the "Service") operated by GhostCode, Inc. ("us", "we", or "our").</p>
                            
                            <h2 className="text-2xl font-semibold text-white pt-4">1. Acceptance of Terms</h2>
                            <p>By accessing or using the Service, you agree to be bound by these Terms. If you disagree with any part of the terms, then you may not access the Service. Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms. These Terms apply to all visitors, users, and others who access or use the Service.</p>
                            
                            <h2 className="text-2xl font-semibold text-white pt-4">2. Accounts</h2>
                            <p>When you create an account with us, you must provide us with information that is accurate, complete, and current at all times. Failure to do so constitutes a breach of the Terms, which may result in immediate termination of your account on our Service. You are responsible for safeguarding the password that you use to access the Service and for any activities or actions under your password, whether your password is with our Service or a third-party service.</p>
                            
                            <h2 className="text-2xl font-semibold text-white pt-4">3. Intellectual Property</h2>
                            <p>The Service and its original content, features, and functionality are and will remain the exclusive property of GhostCode, Inc. and its licensors. The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries. Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of GhostCode, Inc.</p>

                            <h2 className="text-2xl font-semibold text-white pt-4">4. Termination</h2>
                            <p>We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the Service will immediately cease. If you wish to terminate your account, you may simply discontinue using the Service.</p>

                            <h2 className="text-2xl font-semibold text-white pt-4">5. Limitation Of Liability</h2>
                            <p>In no event shall GhostCode, Inc., nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the Service.</p>

                            <h2 className="text-2xl font-semibold text-white pt-4">6. Changes</h2>
                            <p>We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material we will try to provide at least 30 days' notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.</p>
                            
                            <p className="mt-8 pt-6 border-t border-slate-700 italic text-slate-500">
                                Disclaimer: This is a template for Terms of Service. It is not legal advice. Please consult with a legal professional to create a document that is tailored to your specific business needs and complies with all applicable laws.
                            </p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default TermsPage;
