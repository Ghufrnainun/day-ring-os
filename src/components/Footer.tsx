import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-12 border-t border-border bg-surface/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <div className="w-3 h-3 border-2 border-primary-foreground rounded-full" />
            </div>
            <span className="font-display font-bold text-foreground">Orbit</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm">
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Privacy
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Terms
            </a>
            <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
              Contact
            </a>
          </div>

          {/* Note */}
          <p className="text-xs text-muted-foreground">
            Preview is read-only.
          </p>
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
