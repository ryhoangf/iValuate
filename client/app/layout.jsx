import { Geist } from 'next/font/google'
import './globals.css'
import AppProviders from '@/components/AppProviders'

const geist = Geist({ subsets: ["latin"] });

export const metadata = {
  title: 'iValuate',
  description: 'Smart product price valuation and forecasting',
  icons: {
    icon: '/favicon-32.png',
    apple: '/apple-touch-icon.png',
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
