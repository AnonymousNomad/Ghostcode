import React from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const PrivacyPolicyPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-900 flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full bg-grid-slate-700/[0.2] [mask-image:linear-gradient(to_bottom,white_20%,transparent_100%)]"></div>
            <div className="relative z-10 flex flex-col flex-grow">
                <Header />
                <main className="flex-grow container mx-auto px-6 py-16">
                    <div className="max-w-4xl mx-auto text-slate-300">
                        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
                        <div className="space-y-6 text-slate-400">
                             <p>Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                             <p>GhostCode, Inc. ("us", "we", or "our") operates the GhostCode application (the "Service"). This page informs you of our policies regarding the collection, use, and disclosure of personal data when you use our Service and the choices you have associated with that data.</p>
                            
                            <h2 className="text-2xl font-semibold text-white pt-4">1. Information Collection and Use</h2>
                            <p>We collect several different types of information for various purposes to provide and improve our Service to you. This may include, but is not limited to, email address, name, usage data, and cookies.</p>
                            
                            <h2 className="text-2xl font-semibold text-white pt-4">2. Use of Data</h2>
                            <p>GhostCode, Inc. uses the collected data for various purposes: to provide and maintain the Service, to notify you about changes to our Service, to allow you to participate in interactive features of our Service when you choose to do so, to provide customer care and support, and to monitor the usage of the Service.</p>
                            
                            <h2 className="text-2xl font-semibold text-white pt-4">3. Data Security</h2>
                            <p>The security of your data is important to us, but remember that no method of transmission over the Internet or method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your Personal Data, we cannot guarantee its absolute security.</p>

                            <h2 className="text-2xl font-semibold text-white pt-4">4. Service Providers</h2>
                            <p>We may employ third-party companies and individuals to facilitate our Service ("Service Providers"), to provide the Service on our behalf, to perform Service-related services, or to assist us in analyzing how our Service is used. These third parties have access to your Personal Data only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.</p>
                            
                            <h2 className="text-2xl font-semibold text-white pt-4">5. Children's Privacy</h2>
                            <p>Our Service does not address anyone under the age of 18 ("Children"). We do not knowingly collect personally identifiable information from anyone under the age of 18. If you are a parent or guardian and you are aware that your Children has provided us with Personal Data, please contact us.</p>
                            
                            <h2 className="text-2xl font-semibold text-white pt-4">6. Changes to This Privacy Policy</h2>
                            <p>We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page. You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are effective when they are posted on this page.</p>

                             <p className="mt-8 pt-6 border-t border-slate-700 italic text-slate-500">
                                Disclaimer: This is a template for a Privacy Policy. It is not legal advice. Please consult with a legal professional to ensure your policy is compliant with all relevant regulations like GDPR, CCPA, etc., and is tailored to your data practices.
                            </p>
                        </div>
                    </div>
                </main>
                <Footer />
            </div>
        </div>
    );
};

export default PrivacyPolicyPage;
