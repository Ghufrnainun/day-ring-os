'use client';

import React, { useState, useEffect } from 'react';

const MobileCTA: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show after scrolling past hero section (approx 600px)
      setIsVisible(window.scrollY > 600);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-background/95 backdrop-blur-md border-t border-border md:hidden animate-fade-in">
      <a href="#cta" className="btn-primary w-full text-center py-3.5">
        Create your first day
      </a>
    </div>
  );
};

export default MobileCTA;
