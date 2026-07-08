import './globals.css'
import { Providers } from './providers'
import { SupportChat } from '@/components/support-chat'
import { IBM_Plex_Sans, Fraunces } from 'next/font/google'
import { getBaseUrl } from '@/lib/baseUrl'

const baseUrl = getBaseUrl()

const body = IBM_Plex_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap', weight: ['400','500','600'] })
const display = Fraunces({ subsets: ['latin'], variable: '--font-display', display: 'swap', weight: ['500','600','700'], style: ['normal'] })

export const metadata = {
  metadataBase: new URL(baseUrl),
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
    <html lang="en" className={`${body.variable} ${display.variable} dark`}>
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          '@context':'https://schema.org','@graph':[
            {'@type':'Organization','@id':baseUrl+'/#org','name':'DMForge','url':baseUrl,'logo':baseUrl+'/favicon.ico','sameAs':[]},
            {'@type':'WebSite','@id':baseUrl+'/#site','url':baseUrl,'name':'DMForge','publisher':{'@id':baseUrl+'/#org'}},
            {'@type':'SoftwareApplication','name':'DMForge','operatingSystem':'Web','applicationCategory':'BusinessApplication','description':'Build, test and ship an AI DM appointment setter in 60 seconds. Free forever tier.','offers':[{'@type':'Offer','price':'0','priceCurrency':'USD','name':'Free'},{'@type':'Offer','price':'39','priceCurrency':'USD','name':'Pro Monthly'},{'@type':'Offer','price':'390','priceCurrency':'USD','name':'Pro Annual'},{'@type':'Offer','price':'199','priceCurrency':'USD','name':'Agency'}],'aggregateRating':{'@type':'AggregateRating','ratingValue':'4.9','reviewCount':'500'}},
          ]
        })}} />
      </head>
      <body className="font-body bg-[#0B0B1A] text-[#F5F5FA] antialiased">
        <Providers>{children}</Providers>
        <SupportChat />
      </body>
    </html>
  )
}
