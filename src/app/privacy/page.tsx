import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-sans text-4xl sm:text-5xl font-medium text-foreground tracking-tight mb-8">
            Privacy Policy
          </h1>
          <div className="prose prose-lg dark:prose-invert text-muted-foreground">
            <p className="lead text-xl text-foreground mb-8">
              At Orbit, we prioritize your privacy and data security. This
              policy outlines how we handle your information.
            </p>

            <h2 className="text-2xl font-medium text-foreground mt-12 mb-4">
              1. Information We Collect
            </h2>
            <p className="mb-6">
              We collect minimal information necessary to provide our services,
              such as your email address when you create an account. Usage data
              is collected anonymously to improve the application experience.
            </p>

            <h2 className="text-2xl font-medium text-foreground mt-12 mb-4">
              2. How We Use Your Data
            </h2>
            <p className="mb-2">Your data is used solely for:</p>
            <ul className="list-disc pl-6 mb-6 space-y-2">
              <li>Providing and maintaining the Orbit service</li>
              <li>Notifying you about changes to our service</li>
              <li>Allowing you to participate in interactive features</li>
              <li>Customer support</li>
            </ul>

            <h2 className="text-2xl font-medium text-foreground mt-12 mb-4">
              3. Data Storage
            </h2>
            <p className="mb-6">
              All data is encrypted at rest and in transit. We use
              industry-standard security measures to protect your personal
              information.
            </p>

            <h2 className="text-2xl font-medium text-foreground mt-12 mb-4">
              4. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy, please
              contact us at support@orbit.co.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
