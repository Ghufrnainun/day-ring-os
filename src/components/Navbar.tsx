import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

const Navbar: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Preview', href: '#preview' },
    { name: 'How it works', href: '#how-it-works' },
    { name: 'Modules', href: '#modules' },
    { name: 'FAQ', href: '#faq' },
  ];

  const scrollToSection = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.header
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="fixed top-0 left-0 right-0 z-50 flex justify-center px-4 pt-4"
    >
      <nav
        className={cn(
          'flex items-center justify-between gap-6 px-4 sm:px-6 py-3 rounded-full transition-all duration-300',
          'bg-background/70 backdrop-blur-xl border border-border/50 shadow-lg',
          isScrolled && 'bg-background/85 shadow-xl'
        )}
        style={{
          maxWidth: '800px',
          width: '100%',
        }}
      >
        {/* Brand */}
        <a href="#" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <div className="w-3.5 h-3.5 border-2 border-primary-foreground rounded-full" />
          </div>
          <span className="font-display font-bold text-lg text-primary">Orbit</span>
        </a>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => scrollToSection(e, link.href)}
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* CTA */}
        <div className="hidden md:block flex-shrink-0">
          <a
            href="#cta"
            onClick={(e) => scrollToSection(e, '#cta')}
            className="inline-flex items-center justify-center px-5 py-2 text-sm font-medium rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 btn-press hover-glow"
          >
            Create your first day
          </a>
        </div>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-foreground p-2 transition-transform duration-200 hover:scale-110 active:scale-95"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute top-20 left-4 right-4 md:hidden bg-background/80 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl overflow-hidden"
          >
            <div className="px-4 py-4 space-y-2">
              {navLinks.map((link, index) => (
                <motion.a
                  key={link.href}
                  href={link.href}
                  onClick={(e) => scrollToSection(e, link.href)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="block px-3 py-2.5 text-base font-medium text-foreground hover:bg-primary/10 rounded-xl transition-colors"
                >
                  {link.name}
                </motion.a>
              ))}
              <div className="pt-2">
                <a
                  href="#cta"
                  onClick={(e) => scrollToSection(e, '#cta')}
                  className="inline-flex items-center justify-center w-full px-5 py-2.5 text-sm font-medium rounded-full bg-primary text-primary-foreground btn-press"
                >
                  Create your first day
                </a>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Navbar;
