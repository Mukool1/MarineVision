import { useEffect, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { queryScanChat, summarizeScanChat } from '../api/api'
import Icon from './Icon'

const toChatPayload = (scan) => {
  if (!scan) return {}
  const summary = scan.summary || {}
  return {
    total_count: summary.total_objects ?? scan.total_count ?? 0,
    counts: summary.by_label || scan.counts || {},
    detections: (scan.detections || []).map(item => ({
      label: item.label,
      severity: item.severity,
      confidence: item.confidence,
    })),
    location: scan.location,
    depth_m: scan.depth_m,
  }
}

const prompts = [
  'How severe is this scan?',
  'What should the cleanup crew do first?',
  'Summarize debris types found.',
]

export default function MarineChatbot({ currentScanData, open, onOpenChange }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [summarizedFor, setSummarizedFor] = useState(null)
  const endRef = useRef(null)
  const scanId = currentScanData?.scan_id

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading, open])

  useEffect(() => {
    if (!open || !scanId || summarizedFor === scanId) return
    handleAutoSummarize()
  }, [open, scanId])

  const handleAutoSummarize = async () => {
    setLoading(true)
    try {
      const res = await summarizeScanChat(toChatPayload(currentScanData))
      setMessages([{ sender: 'bot', text: res.summary }])
      setSummarizedFor(scanId || 'none')
    } catch {
      setMessages([{ sender: 'bot', text: 'I could not generate a scan summary yet. Ask a question, or run a scan first.' }])
      setSummarizedFor(scanId || 'none')
    }
    setLoading(false)
  }

  const handleSend = async (preset) => {
    const text = (preset ?? input).trim()
    if (!text || loading) return
    setMessages(prev => [...prev, { sender: 'user', text }])
    setInput('')
    setLoading(true)
    try {
      const res = await queryScanChat(toChatPayload(currentScanData), text)
      setMessages(prev => [...prev, { sender: 'bot', text: res.response }])
    } catch {
      setMessages(prev => [...prev, { sender: 'bot', text: 'The AI assistant could not connect. Confirm the backend is running and GEMINI_API_KEY is set.' }])
    }
    setLoading(false)
  }

  return (
    <div className="fixed bottom-5 right-5 z-40">
      {!open ? (
        <button onClick={() => onOpenChange(true)} className="action animate-pulseGlow gap-2 rounded-full px-5 py-3 shadow-glow">
          <Icon name="spark" className="h-4 w-4" />
          AI Scan Assistant
        </button>
      ) : (
        <section className="flex h-[min(640px,calc(100vh-5rem))] w-[min(420px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-3xl border border-cyan-200/20 bg-[#071824]/95 shadow-2xl shadow-cyan-950/40 backdrop-blur-2xl">
          <header className="flex items-center justify-between border-b border-cyan-200/10 bg-gradient-to-r from-cyan-500/20 to-teal-500/10 px-4 py-3.5">
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-2xl bg-cyan-400/20 text-cyan-200"><Icon name="chat" className="h-4 w-4" /></span>
              <div>
                <p className="m-0 font-display text-sm font-bold text-white">MarineVision AI</p>
                <p className="m-0 text-[10px] text-cyan-200/70">{scanId ? 'Grounded in current scan' : 'General marine assistant'}</p>
              </div>
            </div>
            <button onClick={() => onOpenChange(false)} className="grid h-8 w-8 place-items-center rounded-xl text-cyan-100/80 hover:bg-white/10" aria-label="Close assistant">✕</button>
          </header>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !loading && (
              <div className="rounded-2xl border border-cyan-200/10 bg-white/5 p-4 text-sm text-cyan-50/80">
                Ask about debris types, severity, or cleanup next steps. If a scan is open, I will use those detections.
              </div>
            )}
            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-6 ${msg.sender === 'user' ? 'rounded-br-md bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950' : 'rounded-bl-md border border-cyan-200/10 bg-white/10 text-cyan-50'}`}>
                  {msg.sender === 'bot' ? <div className="chat-markdown"><ReactMarkdown>{msg.text}</ReactMarkdown></div> : msg.text}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-[12px] text-cyan-200/80">
                <span className="flex gap-1">
                  <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
                  <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:120ms]" />
                  <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:240ms]" />
                </span>
                Analyzing marine data…
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-cyan-200/10 p-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {prompts.map(item => (
                <button key={item} type="button" onClick={() => handleSend(item)} className="rounded-full border border-cyan-200/15 px-2.5 py-1 text-[10px] text-cyan-100/80 hover:bg-white/10">{item}</button>
              ))}
            </div>
            {scanId && (
              <button type="button" onClick={handleAutoSummarize} className="mb-2 w-full rounded-xl bg-cyan-400/10 py-1.5 text-[11px] font-bold text-cyan-200 hover:bg-cyan-400/20">
                Re-summarize current scan
              </button>
            )}
            <form className="flex gap-2" onSubmit={event => { event.preventDefault(); handleSend() }}>
              <input
                value={input}
                onChange={event => setInput(event.target.value)}
                placeholder="Ask about detected debris…"
                className="min-w-0 flex-1 rounded-xl border border-cyan-200/15 bg-white/5 px-3 py-2.5 text-sm text-white outline-none placeholder:text-cyan-200/40 focus:border-cyan-300/50"
              />
              <button disabled={loading || !input.trim()} className="action px-3 py-2 text-xs">Send</button>
            </form>
          </div>
        </section>
      )}
    </div>
  )
}
