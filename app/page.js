'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { ArrowRight, Sparkles, MessageCircle, Calendar, Check, Zap, Share2, Copy, Twitter, Facebook, Linkedin, Send, Flame, Shield, Globe, Mic, Bot, ChevronRight, Star } from 'lucide-react'

const NICHES = [
  { id: 'fitness', label: 'Fitness / Weight loss', emoji: '💪' },
  { id: 'nutrition', label: 'Nutrition coach', emoji: '🥗' },
  { id: 'business', label: 'Business / Make money', emoji: '💰' },
  { id: 'mindset', label: 'Mindset / Life coach', emoji: '🧠' },
  { id: 'course', label: 'Course creator', emoji: '🎓' },
  { id: 'agency', label: 'Agency / B2B', emoji: '📈' },
  { id: 'yoga', label: 'Yoga / Wellness', emoji: '🧘' },
  { id: 'therapist', label: 'Therapist / Healer', emoji: '✨' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center btn-primary glow-coral"><Flame className="w-5 h-5" /></div>
      <span className="font-display font-bold text-xl tracking-tight">DMForge</span>
    </div>
  )
}

function Nav({ onTry }) {
  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0B0B1A]/70 border-b border-[#2A2A55]/40">
      <div className="max-w-7xl mx-auto px-5 h-16 flex items-center justify-between">
        <Logo />
        <nav className="hidden md:flex items-center gap-7 text-sm text-[#A0A0C8]">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#why" className="hover:text-white">Why DMForge</a>
          <a href="#pricing" className="hover:text-white">Pricing</a>
          <a href="/vs/setsmart" className="hover:text-white">vs SetSmart</a>
          <a href="#faq" className="hover:text-white">FAQ</a>
        </nav>
        <Button onClick={onTry} className="btn-primary border-0 font-semibold">Try it free <ArrowRight className="w-4 h-4 ml-1" /></Button>
      </div>
    </header>
  )
}

function TypingDots() {
  return <span className="inline-flex gap-1 items-center"><span className="w-1.5 h-1.5 bg-[#A0A0C8] rounded-full typing-dot" /><span className="w-1.5 h-1.5 bg-[#A0A0C8] rounded-full typing-dot" /><span className="w-1.5 h-1.5 bg-[#A0A0C8] rounded-full typing-dot" /></span>
}

function ChatSimulator({ agent, onSave }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [state, setState] = useState({ step: 0, qualified: false, booked: false, bookedSlot: null, tags: [] })
  const scrollRef = useRef(null)

  useEffect(() => { scrollRef.current?.scrollTo({ top: 1e9, behavior: 'smooth' }) }, [messages, busy])

  useEffect(() => {
    // seed intro
    if (!agent) return
    setMessages([])
    setState({ step: 0, qualified: false, booked: false, bookedSlot: null, tags: [] })
    ;(async () => {
      setBusy(true)
      try {
        const res = await fetch('/api/agent/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ agentId: agent.id, messages: [] }) })
        const data = await res.json()
        setMessages([{ role: 'assistant', content: data.reply }])
      } catch (e) { toast.error('Failed to start chat') }
      finally { setBusy(false) }
    })()
  }, [agent?.id])

  async function send() {
    if (!input.trim() || busy) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMsgs = [...messages, userMsg]
    setMessages(newMsgs)
    setInput('')
    setBusy(true)
    try {
      const res = await fetch('/api/agent/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ agentId: agent.id, messages: newMsgs }) })
      const data = await res.json()
      setMessages([...newMsgs, { role: 'assistant', content: data.reply }])
      if (data.state) setState(data.state)
    } catch (e) { toast.error('Network error'); }
    finally { setBusy(false) }
  }

  async function saveAndShare() {
    setBusy(true)
    try {
      const res = await fetch('/api/result/save', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ agentId: agent.id, transcript: messages, state }) })
      const data = await res.json()
      if (data.id) {
        const url = `${window.location.origin}/r/${data.id}`
        await navigator.clipboard.writeText(url).catch(()=>{})
        toast.success('Saved! Share link copied to clipboard.')
        window.open(`/r/${data.id}`, '_blank')
      }
    } finally { setBusy(false) }
    onSave?.()
  }

  return (
    <Card className="bg-[#161630] border-[#2A2A55] p-0 overflow-hidden flex flex-col h-[640px] w-full max-w-md mx-auto glow-purple">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#2A2A55] bg-gradient-to-r from-[#FF4D6D]/10 to-[#6B5BFF]/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4D6D] to-[#6B5BFF] flex items-center justify-center font-bold">{agent?.agentName?.[0]?.toUpperCase() || 'C'}</div>
        <div className="flex-1">
          <div className="font-semibold text-sm">{agent?.agentName || 'Coach'} • <span className="text-[#34D399] text-xs">AI active</span></div>
          <div className="text-xs text-[#A0A0C8]">Instagram DM • Live simulator</div>
        </div>
        <div className="flex flex-col gap-1 items-end text-[10px]">
          {state.qualified && <Badge className="bg-[#34D399]/20 text-[#34D399] border-0">Qualified</Badge>}
          {state.booked && <Badge className="bg-[#6B5BFF]/20 text-[#6B5BFF] border-0">Booked</Badge>}
        </div>
      </div>
      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0B0B1A]/40">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[78%] px-3.5 py-2 rounded-2xl text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-[#6B5BFF] text-white rounded-br-md' : 'bg-[#1F1F42] text-[#F5F5FA] rounded-bl-md'}`}>{m.content}</div>
          </div>
        ))}
        {busy && <div className="flex justify-start"><div className="bg-[#1F1F42] rounded-2xl px-4 py-3 rounded-bl-md"><TypingDots /></div></div>}
        {messages.length === 0 && !busy && <div className="text-center text-[#A0A0C8] text-sm py-10">Building your AI setter…</div>}
      </div>
      {/* Footer */}
      <div className="border-t border-[#2A2A55] p-3 bg-[#161630]">
        {state.booked ? (
          <Button onClick={saveAndShare} disabled={busy} className="btn-primary border-0 w-full font-semibold"><Share2 className="w-4 h-4 mr-2" /> Save & share result</Button>
        ) : (
          <div className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && send()} placeholder="Reply as the lead…" className="bg-[#0B0B1A] border-[#2A2A55] text-white" disabled={busy} />
            <Button onClick={send} disabled={busy || !input.trim()} className="btn-primary border-0"><Send className="w-4 h-4" /></Button>
          </div>
        )}
        {!state.booked && messages.length > 2 && (
          <button onClick={saveAndShare} className="text-xs text-[#A0A0C8] hover:text-white mt-2 inline-flex items-center gap-1"><Share2 className="w-3 h-3" /> Save & share this transcript</button>
        )}
      </div>
    </Card>
  )
}

function Wizard({ onCreated }) {
  const [step, setStep] = useState(0)
  const [niche, setNiche] = useState('fitness')
  const [agentName, setAgentName] = useState('Sarah')
  const [offer, setOffer] = useState('12-week 1:1 transformation coaching, $1,500. We work on training, nutrition and mindset weekly with check-ins.')
  const [audience, setAudience] = useState('Busy women 28-45 wanting to lose 5-20kg and keep it off without restrictive diets.')
  const [qualification, setQualification] = useState('Goal in kg, timeline, daily time commitment, budget readiness, biggest blocker')
  const [tone, setTone] = useState('warm, casual, direct, encouraging — like a friend who happens to be a pro coach')
  const [busy, setBusy] = useState(false)

  async function build() {
    setBusy(true)
    try {
      const res = await fetch('/api/agent/create', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ niche, offer, audience, qualification, tone, agentName }) })
      const data = await res.json()
      if (data.id) { toast.success('Your AI setter is live!'); onCreated(data) }
      else toast.error(data.error || 'Failed')
    } catch (e) { toast.error('Failed to build') } finally { setBusy(false) }
  }

  return (
    <Card className="bg-[#161630] border-[#2A2A55] p-6 w-full max-w-xl mx-auto">
      <div className="flex items-center gap-2 text-xs text-[#A0A0C8] mb-4">
        {['Niche','Offer','Qualify','Tone'].map((s,i) => (
          <div key={s} className={`flex items-center gap-2 ${i === step ? 'text-white' : ''}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold ${i <= step ? 'bg-[#FF4D6D] text-white' : 'bg-[#2A2A55]'}`}>{i+1}</div>
            <span>{s}</span>
            {i < 3 && <ChevronRight className="w-3 h-3 opacity-50" />}
          </div>
        ))}
      </div>

      {step === 0 && (
        <div>
          <h3 className="font-display text-2xl font-bold mb-2">What's your niche?</h3>
          <p className="text-[#A0A0C8] text-sm mb-4">We'll tune the AI's qualification script to your industry.</p>
          <div className="grid grid-cols-2 gap-2 mb-4">
            {NICHES.map(n => (
              <button key={n.id} onClick={() => setNiche(n.label)} className={`text-left px-3 py-3 rounded-lg border text-sm transition ${niche === n.label ? 'border-[#FF4D6D] bg-[#FF4D6D]/10' : 'border-[#2A2A55] hover:border-[#6B5BFF]'}`}>
              <span className="mr-2">{n.emoji}</span>{n.label}</button>
            ))}
          </div>
          <Input value={agentName} onChange={e=>setAgentName(e.target.value)} placeholder="Your name (how it signs)" className="bg-[#0B0B1A] border-[#2A2A55] mb-3" />
          <Button onClick={()=>setStep(1)} className="btn-primary border-0 w-full font-semibold">Next <ArrowRight className="w-4 h-4 ml-1" /></Button>
        </div>
      )}
      {step === 1 && (
        <div>
          <h3 className="font-display text-2xl font-bold mb-2">What do you sell?</h3>
          <p className="text-[#A0A0C8] text-sm mb-4">One paragraph. Price, what they get, length.</p>
          <Textarea value={offer} onChange={e=>setOffer(e.target.value)} rows={4} className="bg-[#0B0B1A] border-[#2A2A55] mb-3" />
          <Textarea value={audience} onChange={e=>setAudience(e.target.value)} rows={3} placeholder="Ideal client…" className="bg-[#0B0B1A] border-[#2A2A55] mb-3" />
          <div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(0)} className="bg-transparent border-[#2A2A55]">Back</Button><Button onClick={()=>setStep(2)} className="btn-primary border-0 flex-1 font-semibold">Next <ArrowRight className="w-4 h-4 ml-1" /></Button></div>
        </div>
      )}
      {step === 2 && (
        <div>
          <h3 className="font-display text-2xl font-bold mb-2">What must they answer?</h3>
          <p className="text-[#A0A0C8] text-sm mb-4">List the qualification criteria, comma-separated.</p>
          <Textarea value={qualification} onChange={e=>setQualification(e.target.value)} rows={4} className="bg-[#0B0B1A] border-[#2A2A55] mb-3" />
          <div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(1)} className="bg-transparent border-[#2A2A55]">Back</Button><Button onClick={()=>setStep(3)} className="btn-primary border-0 flex-1 font-semibold">Next <ArrowRight className="w-4 h-4 ml-1" /></Button></div>
        </div>
      )}
      {step === 3 && (
        <div>
          <h3 className="font-display text-2xl font-bold mb-2">How do you talk?</h3>
          <p className="text-[#A0A0C8] text-sm mb-4">A line on tone. The AI will mimic this voice.</p>
          <Textarea value={tone} onChange={e=>setTone(e.target.value)} rows={3} className="bg-[#0B0B1A] border-[#2A2A55] mb-3" />
          <div className="flex gap-2"><Button variant="outline" onClick={()=>setStep(2)} className="bg-transparent border-[#2A2A55]">Back</Button><Button onClick={build} disabled={busy} className="btn-primary border-0 flex-1 font-semibold">{busy ? 'Forging…' : <><Sparkles className="w-4 h-4 mr-2" /> Build my AI setter</>}</Button></div>
        </div>
      )}
    </Card>
  )
}

function FeaturesGrid() {
  const features = [
    { icon: <Zap className="w-5 h-5" />, title: '60-second setup', body: 'No Meta approval, no Instagram login required to start. Build and live-test in under a minute.' },
    { icon: <MessageCircle className="w-5 h-5" />, title: 'Live test simulator', body: 'Chat with your AI before you connect anything. Tweak the prompt in plain English until it sells like you.' },
    { icon: <Globe className="w-5 h-5" />, title: 'Multi-channel from day one', body: 'Instagram, WhatsApp, Messenger, website widget, SMS and email. One agent, every inbox.' },
    { icon: <Calendar className="w-5 h-5" />, title: 'In-chat booking', body: 'Calendly, Cal.com, GHL, iClosed. The agent shares real slots and books in the conversation — no links to paste.' },
    { icon: <Mic className="w-5 h-5" />, title: 'Your voice, cloned', body: 'Optional ElevenLabs voice clone for natural audio replies that sound exactly like you.' },
    { icon: <Shield className="w-5 h-5" />, title: 'Open prompt', body: 'See the full prompt your AI uses. Edit any line, any time. No black box.' },
    { icon: <Share2 className="w-5 h-5" />, title: 'Viral share links', body: 'Every transcript gets a branded /r/[id] page. Show off the calls your AI booked while you slept.' },
    { icon: <Bot className="w-5 h-5" />, title: 'Plain-English tuning', body: 'Say "be more direct" or "ask about budget on turn 3". The AI rewrites itself.' },
  ]
  return (
    <section id="features" className="max-w-7xl mx-auto px-5 py-24">
      <div className="text-center mb-14">
        <p className="text-[#FF4D6D] text-sm font-semibold uppercase tracking-widest mb-3">Features</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold">Everything a $99/mo setter does. <span className="grad-text">Plus the parts they got wrong.</span></h2>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((f,i) => (
          <Card key={i} className="bg-[#161630] border-[#2A2A55] p-5 hover:border-[#FF4D6D]/60 transition">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FF4D6D] to-[#6B5BFF] flex items-center justify-center mb-3">{f.icon}</div>
            <h3 className="font-display font-bold text-lg mb-1">{f.title}</h3>
            <p className="text-sm text-[#A0A0C8]">{f.body}</p>
          </Card>
        ))}
      </div>
    </section>
  )
}

function WhyBetter() {
  const rows = [
    ['Live test before connecting', 'Yes — in 60 seconds', 'No — only after Meta connection'],
    ['Free forever tier', 'Yes — no card required', '7-day trial, card required'],
    ['Pricing model', 'Flat $39/mo, all-in', '$99/mo + per-message'],
    ['Channels', 'IG, WA, Messenger, Web, SMS, Email', 'IG, WhatsApp, Messenger'],
    ['Open prompt editing', 'Full visibility, line-by-line', 'Black-box prompt'],
    ['Public share links', 'Every result has /r/[id]', 'No'],
    ['Setup time', 'Under 60 seconds', '15-30 minutes'],
  ]
  return (
    <section id="why" className="max-w-6xl mx-auto px-5 py-24">
      <div className="text-center mb-12">
        <p className="text-[#FF4D6D] text-sm font-semibold uppercase tracking-widest mb-3">Why DMForge</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold">DMForge <span className="grad-text">vs SetSmart</span></h2>
        <p className="text-[#A0A0C8] mt-3">An honest, point-by-point comparison.</p>
      </div>
      <Card className="bg-[#161630] border-[#2A2A55] overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[#1F1F42]"><tr><th className="text-left p-4"></th><th className="text-left p-4 text-[#FF4D6D]">DMForge</th><th className="text-left p-4 text-[#A0A0C8]">SetSmart</th></tr></thead>
          <tbody>
            {rows.map((r,i) => (
              <tr key={i} className="border-t border-[#2A2A55]">
                <td className="p-4 font-medium">{r[0]}</td>
                <td className="p-4 text-[#34D399]">{r[1]}</td>
                <td className="p-4 text-[#A0A0C8]">{r[2]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="text-center mt-6"><a href="/vs/setsmart" className="text-[#FF4D6D] hover:underline">Read the full DMForge vs SetSmart breakdown →</a></p>
    </section>
  )
}

function Pricing({ onTry }) {
  const [busy, setBusy] = useState(null)
  async function checkout(planKey) {
    const email = window.prompt('Enter your email to start your subscription (test mode — use Stripe test card 4242 4242 4242 4242):')
    if (!email) return
    setBusy(planKey)
    try {
      const res = await fetch('/api/billing/checkout', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email, planKey }) })
      const data = await res.json()
      if (data.url) window.location.href = data.url
      else toast.error(data.error || 'Checkout failed')
    } catch (e) { toast.error('Network error') }
    finally { setBusy(null) }
  }
  async function portal() {
    const email = window.prompt('Enter the email you used at checkout to manage billing:')
    if (!email) return
    const res = await fetch('/api/billing/portal', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ email }) })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else toast.error(data.error || 'Could not open portal')
  }
  return (
    <section id="pricing" className="max-w-6xl mx-auto px-5 py-24">
      <div className="text-center mb-12">
        <p className="text-[#FF4D6D] text-sm font-semibold uppercase tracking-widest mb-3">Pricing</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold">Flat pricing. <span className="grad-text">Zero surprises.</span></h2>
        <p className="text-[#A0A0C8] mt-3">No per-message charges, ever. Cancel any time.</p>
      </div>
      <div className="grid md:grid-cols-3 gap-5">
        <Card className="bg-[#161630] border-[#2A2A55] p-7">
          <h3 className="font-display text-2xl font-bold">Free</h3>
          <p className="text-[#A0A0C8] mb-5">For trying it out properly.</p>
          <div className="text-4xl font-display font-bold mb-1">$0</div>
          <div className="text-[#A0A0C8] mb-6">forever • no card</div>
          <Button onClick={onTry} className="w-full bg-[#1F1F42] hover:bg-[#2A2A55] border-0">Start free</Button>
          <ul className="mt-6 space-y-2 text-sm text-[#A0A0C8]"><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />1 AI setter</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />Unlimited live simulator</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />50 real conversations / mo</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />Public share links</li></ul>
        </Card>
        <Card className="bg-gradient-to-br from-[#FF4D6D]/10 to-[#6B5BFF]/10 border-[#FF4D6D] p-7 relative glow-coral">
          <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF4D6D] text-white border-0">Most popular</Badge>
          <h3 className="font-display text-2xl font-bold">Pro</h3>
          <p className="text-[#A0A0C8] mb-5">For coaches running real ads.</p>
          <div className="text-4xl font-display font-bold mb-1">$39<span className="text-base text-[#A0A0C8] font-normal">/mo</span></div>
          <div className="text-[#A0A0C8] mb-6">or $390/yr (save $78)</div>
          <Button onClick={() => checkout('pro_monthly')} disabled={busy==='pro_monthly'} className="btn-primary border-0 w-full font-semibold">{busy==='pro_monthly' ? 'Loading…' : 'Get Pro monthly'}</Button>
          <Button onClick={() => checkout('pro_annual')} disabled={busy==='pro_annual'} variant="outline" className="bg-transparent border-[#FF4D6D]/50 hover:bg-[#FF4D6D]/10 w-full font-semibold mt-2">{busy==='pro_annual' ? 'Loading…' : 'Pay annually — save $78'}</Button>
          <ul className="mt-6 space-y-2 text-sm"><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />Unlimited AI setters</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />5,000 real conversations / mo</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />Instagram, WhatsApp, Messenger</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />Web widget + SMS + email</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />Calendly / Cal.com / GHL booking</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />ElevenLabs voice clone</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />REST API + webhooks + MCP</li></ul>
        </Card>
        <Card className="bg-[#161630] border-[#2A2A55] p-7">
          <h3 className="font-display text-2xl font-bold">Agency</h3>
          <p className="text-[#A0A0C8] mb-5">For running it for clients.</p>
          <div className="text-4xl font-display font-bold mb-1">$199<span className="text-base text-[#A0A0C8] font-normal">/mo</span></div>
          <div className="text-[#A0A0C8] mb-6">10 client workspaces</div>
          <Button onClick={() => checkout('agency')} disabled={busy==='agency'} className="w-full bg-[#1F1F42] hover:bg-[#2A2A55] border-0">{busy==='agency' ? 'Loading…' : 'Get Agency'}</Button>
          <ul className="mt-6 space-y-2 text-sm text-[#A0A0C8]"><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />10 full client workspaces</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />Whitelabel + custom domain</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />Impersonate any client</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />Bring your own keys (BYOK)</li><li className="flex gap-2"><Check className="w-4 h-4 text-[#34D399] mt-0.5" />Priority onboarding</li></ul>
        </Card>
      </div>
      <p className="text-center mt-6 text-xs text-[#A0A0C8]">No commitment • Cancel any time • 30-day money-back guarantee • <button onClick={portal} className="underline hover:text-white">Manage existing subscription →</button></p>
    </section>
  )
}

function Faq() {
  const faqs = [
    ['Do I really not need a credit card?', 'Right. Free forever tier, no card. You can build an agent, run unlimited simulations and post up to 50 real conversations per month without paying us a cent.'],
    ['How is this different from SetSmart, ManyChat, Chatfuel?', "Most are flow-builders or charge per-message. We're AI-native with flat pricing and you can live-test the agent before connecting any account."],
    ['Will Instagram ban me?', 'No — we connect through official Meta Business APIs, like every other approved partner. No scraping, no risk.'],
    ['Can I take over a conversation?', 'Yes — one-tap pause, jump in, and the AI hands the thread to you. Resume the AI whenever.'],
    ['Which AI powers the agent?', 'Gemini 2.5 Flash by default — the fastest, cheapest, capable model. Pro accounts can switch to Claude or GPT in one click.'],
    ['Can I cancel any time?', 'One click in the billing portal. No emails, no "are you sure?" loops.'],
  ]
  return (
    <section id="faq" className="max-w-3xl mx-auto px-5 py-24">
      <div className="text-center mb-10">
        <h2 className="font-display text-4xl md:text-5xl font-bold">Frequently asked</h2>
      </div>
      <div className="space-y-3">
        {faqs.map((f,i) => (
          <details key={i} className="bg-[#161630] border border-[#2A2A55] rounded-xl p-5 group">
            <summary className="font-semibold cursor-pointer flex justify-between items-center">{f[0]}<ChevronRight className="w-4 h-4 group-open:rotate-90 transition" /></summary>
            <p className="mt-3 text-[#A0A0C8] text-sm">{f[1]}</p>
          </details>
        ))}
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="border-t border-[#2A2A55]/60 mt-16">
      <div className="max-w-7xl mx-auto px-5 py-12 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <Logo />
          <p className="text-[#A0A0C8] mt-3">AI DM setters you can actually test before you trust them.</p>
        </div>
        <div>
          <p className="font-semibold mb-3">Product</p>
          <ul className="space-y-2 text-[#A0A0C8]"><li><a href="#features">Features</a></li><li><a href="#pricing">Pricing</a></li><li><a href="#faq">FAQ</a></li></ul>
        </div>
        <div>
          <p className="font-semibold mb-3">Compare</p>
          <ul className="space-y-2 text-[#A0A0C8]"><li><a href="/vs/setsmart">vs SetSmart</a></li><li><a href="/vs/manychat">vs ManyChat</a></li><li><a href="/vs/chatfuel">vs Chatfuel</a></li><li><a href="/vs/gohighlevel">vs GoHighLevel</a></li></ul>
        </div>
        <div>
          <p className="font-semibold mb-3">Company</p>
          <ul className="space-y-2 text-[#A0A0C8]"><li><a href="#">About</a></li><li><a href="#">Contact</a></li><li><a href="#">Privacy</a></li><li><a href="#">Terms</a></li></ul>
        </div>
      </div>
      <div className="text-center text-xs text-[#A0A0C8] pb-8">© 2025 DMForge • Built for coaches who close on calls.</div>
    </footer>
  )
}

function App() {
  const [agent, setAgent] = useState(null)
  const heroRef = useRef(null)
  const scrollToBuilder = () => { heroRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }

  return (
    <div>
      <Nav onTry={scrollToBuilder} />

      {/* HERO */}
      <section ref={heroRef} className="grad-bg relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-5 pt-16 pb-20 grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1F1F42] border border-[#2A2A55] text-xs text-[#A0A0C8] mb-6">
              <span className="w-2 h-2 rounded-full bg-[#34D399] animate-pulse" /> 500+ coaches built their setter this week
            </div>
            <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.03] tracking-tight">
              Build, test &amp; ship an <span className="grad-text">AI DM setter</span> in 60 seconds.
            </h1>
            <p className="text-lg text-[#A0A0C8] mt-6 max-w-xl">
              Replies to your Instagram DMs, qualifies your leads, books your sales calls. <span className="text-white">Test it live right here</span> before you connect anything. No card, no Meta approval.
            </p>
            <div className="flex flex-wrap gap-3 mt-8">
              <div className="flex items-center gap-2 text-sm text-[#A0A0C8]"><Check className="w-4 h-4 text-[#34D399]" /> Free forever tier</div>
              <div className="flex items-center gap-2 text-sm text-[#A0A0C8]"><Check className="w-4 h-4 text-[#34D399]" /> Flat pricing</div>
              <div className="flex items-center gap-2 text-sm text-[#A0A0C8]"><Check className="w-4 h-4 text-[#34D399]" /> 6 channels included</div>
            </div>
            <div className="mt-8 flex items-center gap-3">
              <div className="flex -space-x-2">
                {['F','S','A','M','T'].map((c,i) => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0B0B1A] bg-gradient-to-br from-[#FF4D6D] to-[#6B5BFF] flex items-center justify-center text-xs font-bold">{c}</div>)}
              </div>
              <div className="flex items-center gap-1 text-sm"><Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" /><Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" /><Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" /><Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" /><Star className="w-4 h-4 fill-[#FBBF24] text-[#FBBF24]" /><span className="ml-2 text-[#A0A0C8]">4.9 • first 500 coaches</span></div>
            </div>
          </div>

          {/* Right column: wizard or simulator */}
          <div>
            {!agent ? <Wizard onCreated={setAgent} /> : <ChatSimulator agent={agent} onSave={() => {}} />}
            {agent && <div className="text-center mt-4"><button onClick={() => setAgent(null)} className="text-sm text-[#A0A0C8] hover:text-white">↻ Build a different agent</button></div>}
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="border-y border-[#2A2A55]/60 py-6">
        <div className="max-w-7xl mx-auto px-5 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-[#A0A0C8] text-sm">
          <span>Trusted by coaches who run on:</span>
          <span className="font-semibold text-white">Instagram</span>
          <span className="font-semibold text-white">WhatsApp</span>
          <span className="font-semibold text-white">Messenger</span>
          <span className="font-semibold text-white">Calendly</span>
          <span className="font-semibold text-white">GoHighLevel</span>
          <span className="font-semibold text-white">iClosed</span>
          <span className="font-semibold text-white">Zapier</span>
        </div>
      </section>

      <FeaturesGrid />
      <WhyBetter />
      <Pricing onTry={scrollToBuilder} />
      <Faq />

      {/* Final CTA */}
      <section className="max-w-5xl mx-auto px-5 py-24 text-center">
        <Card className="bg-gradient-to-br from-[#FF4D6D]/15 to-[#6B5BFF]/15 border-[#FF4D6D]/40 p-12 glow-coral">
          <h2 className="font-display text-4xl md:text-5xl font-bold">Stop losing leads at 11pm.</h2>
          <p className="text-[#A0A0C8] mt-3 max-w-xl mx-auto">Forge your AI setter in the next 60 seconds. Live-test it right now. No credit card, no Meta hoops.</p>
          <Button onClick={scrollToBuilder} className="btn-primary border-0 mt-6 font-semibold px-8 h-12">Build my AI setter <ArrowRight className="w-4 h-4 ml-2" /></Button>
        </Card>
      </section>

      <Footer />
    </div>
  )
}

export default App
