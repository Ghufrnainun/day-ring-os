import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, Cormorant_Garamond } from 'next/font/google';
import '@/app/globals.css';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Providers } from '@/components/providers';
import { ThemeProvider } from '@/components/theme-provider';
import { TimeProvider } from '@/components/providers/time-provider';

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
  title: {
    default: 'Orbit — Your Day, Under Control | Life & Finance OS',
    template: '%s | Orbit',
  },
  description:
    'Tasks, habits, and money — in one calm system. A planner-centric Life & Finance OS that puts today first. No gamification, no guilt.',
  keywords: [
    'productivity app',
    'task manager',
    'habit tracker',
    'finance tracker',
    'personal finance',
    'daily planner',
    'no gamification',
    'calm productivity',
  ],
  authors: [{ name: 'Orbit' }],
  creator: 'Orbit Team',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Orbit — Your Day, Under Control',
    description:
      'Tasks, habits, and money — in one calm system. A planner-centric Life & Finance OS that puts today first.',
    type: 'website',
    url: 'https://orbit.app',
    siteName: 'Orbit',
    locale: 'en_US',
    images: [
      {
        url: 'https://orbit.app/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Orbit - Life & Finance OS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Orbit — Your Day, Under Control',
    description: 'Tasks, habits, and money — in one calm system.',
    site: '@OrbitApp',
    creator: '@OrbitApp',
    images: ['https://orbit.app/og-image.png'],
  },
  manifest: '/manifest.json',
  icons: {
    icon: '/logoNoBG.png',
    shortcut: '/logoNoBG.png',
    apple: '/logoNoBG.png',
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
      suppressHydrationWarning
    >
      <body className="antialiased">
        <Providers>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <TimeProvider>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                {children}
              </TooltipProvider>
            </TimeProvider>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
