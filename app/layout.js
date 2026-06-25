import './globals.css'
import { Providers } from './providers'
import { Inter, Space_Grotesk } from 'next/font/google'

const inter = Inter({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const display = Space_Grotesk({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: ['500','600','700'] })

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://dmforge.app'),
  title: 'DMForge — Build, test & ship AI DM setters in 60 seconds',
  description: 'The fastest way to build, test and deploy an AI appointment setter for Instagram, WhatsApp, Messenger, web and SMS. Test your agent live before connecting any account. Free forever tier — no credit card.',
  openGraph: {
    title: 'DMForge — AI DM setters you can actually test before you trust them',
    description: 'Build and live-test an AI appointment setter in 60 seconds. Flat pricing, multi-channel, open prompt.',
    type: 'website',
    siteName: 'DMForge',
  },
  twitter: { card: 'summary_large_image', title: 'DMForge — AI DM setters in 60 seconds', description: 'Build, test and ship a DM appointment setter in 60 seconds. Free forever tier.' },
  alternates: { canonical: '/' },
  icons: { icon: '/favicon.ico' },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable} dark`}>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
      </head>
      <body className="font-body bg-[#0B0B1A] text-[#F5F5FA] antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
