import { Geist } from 'next/font/google'
import './globals.css'
import AppProviders from '@/components/AppProviders'

const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: 'IVAluate',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      { 
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.className} font-sans antialiased`} suppressHydrationWarning>
        <AppProviders>{children}</AppProviders>
        {/* <Analytics /> */} 
      </body>
    </html>
  );
}
