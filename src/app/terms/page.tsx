import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background relative flex flex-col">
      <Navbar />
      <main className="flex-grow pt-32 pb-20 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto">
          <h1 className="font-sans text-4xl sm:text-5xl font-medium text-foreground tracking-tight mb-8">
            Terms of Service
          </h1>
          <div className="prose prose-lg dark:prose-invert text-muted-foreground">
            <p className="lead text-xl text-foreground mb-8">
              By using Orbit, you agree to these terms. Please read them
              carefully.
            </p>

            <h2 className="text-2xl font-medium text-foreground mt-12 mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="mb-6">
              By accessing or using Orbit, you agree to be bound by these Terms
              of Service and all applicable laws and regulations.
            </p>

            <h2 className="text-2xl font-medium text-foreground mt-12 mb-4">
              2. Use License
            </h2>
            <p className="mb-6">
              Permission is granted to temporarily download one copy of the
              materials (information or software) on Orbit's website for
              personal, non-commercial transitory viewing only.
            </p>

            <h2 className="text-2xl font-medium text-foreground mt-12 mb-4">
              3. Disclaimer
            </h2>
            <p className="mb-6">
              The materials on Orbit's website are provided on an 'as is' basis.
              Orbit makes no warranties, expressed or implied, and hereby
              disclaims and negates all other warranties including, without
              limitation, implied warranties or conditions of merchantability,
              fitness for a particular purpose, or non-infringement of
              intellectual property or other violation of rights.
            </p>

            <h2 className="text-2xl font-medium text-foreground mt-12 mb-4">
              4. Limitations
            </h2>
            <p className="mb-6">
              In no event shall Orbit or its suppliers be liable for any damages
              (including, without limitation, damages for loss of data or
              profit, or due to business interruption) arising out of the use or
              inability to use the materials on Orbit's website.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
