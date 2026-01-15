import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 border-t border-border bg-surface/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative w-7 h-7 transition-transform duration-200 group-hover:scale-110">
              <Image
                src="/logoNoBG.png"
                alt="Orbit Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="font-display font-bold text-foreground">
              Orbit
            </span>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              Terms
            </Link>
            <Link
              href="/contact"
              className="text-muted-foreground hover:text-foreground transition-colors link-underline"
            >
              Contact
            </Link>
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground">Preview is read-only.</p>
        </div>

        <div className="mt-8 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Orbit. Built for calm execution.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
