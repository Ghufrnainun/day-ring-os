import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, Cormorant_Garamond } from 'next/font/google';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-space-grotesk',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
});

export const metadata: Metadata = {
  title: 'Orbit — Your Day, Under Control | Life & Finance OS',
  description:
    'Tasks, habits, and money — in one calm system. A planner-centric Life & Finance OS that puts today first. No gamification, no guilt.',
  authors: [{ name: 'Orbit' }],
  openGraph: {
    title: 'Orbit — Your Day, Under Control',
    description:
      'Tasks, habits, and money — in one calm system. A planner-centric Life & Finance OS that puts today first.',
    type: 'website',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@OrbitApp',
    images: ['https://lovable.dev/opengraph-image-p98pqg.png'],
  },
};

export const viewport: Viewport = {
  themeColor: '#F6F1E8',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${spaceGrotesk.variable} ${cormorant.variable}`}
    >
      <body className="antialiased">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          {children}
        </TooltipProvider>
      </body>
    </html>
  );
}
