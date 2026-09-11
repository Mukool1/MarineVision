import { useEffect, useState } from 'react'
import { chatAboutScan } from '../api/api'

export default function ScanChat({ scanId }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { setMessages([]); setQuestion(''); setError('') }, [scanId])
  const ask = async (value = question) => {
    const text = value.trim()
    if (!text || loading) return
    setMessages(current => [...current, { role: 'user', text }]); setQuestion(''); setError(''); setLoading(true)
    try { const { reply } = await chatAboutScan(scanId, text); setMessages(current => [...current, { role: 'assistant', text: reply }]) }
    catch (requestError) { setError(requestError?.response?.data?.detail || 'The scan assistant is unavailable. Please try again.') }
    finally { setLoading(false) }
  }
  return <section className="mt-5 rounded-xl border border-[#b9dce6] bg-[#f2fafc] p-4"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="m-0 text-xs font-bold text-[#075987]">Scan assistant</p><p className="mb-0 mt-1 text-[10px] text-slate-500">Ask about this scan's targets and priorities.</p></div><button type="button" onClick={() => ask('Summarize this scan for the operator.')} disabled={loading} className="action-secondary border-[#b9dce6] bg-white px-2.5 py-1.5 text-[10px] text-[#075987]">Summarize scan</button></div>{messages.length > 0 && <div className="mt-3 max-h-52 space-y-2 overflow-y-auto">{messages.map((item, index) => <div key={`${item.role}-${index}`} className={`rounded-lg px-3 py-2 text-xs leading-5 ${item.role === 'user' ? 'ml-6 bg-[#075987] text-white' : 'mr-3 bg-white text-[#24484a]'}`}>{item.text}</div>)}</div>}{loading && <p className="mb-0 mt-3 text-[10px] font-semibold text-[#075987]">Preparing a scan-grounded answer...</p>}{error && <p role="alert" className="mb-0 mt-3 rounded-lg bg-rose-50 p-2 text-[10px] text-rose-700">{error}</p>}<form className="mt-3 flex gap-2" onSubmit={event => { event.preventDefault(); ask() }}><input value={question} onChange={event => setQuestion(event.target.value)} maxLength={1000} className="field-input min-w-0 flex-1 py-2 text-xs" placeholder="e.g. What requires review first?" aria-label="Question about this scan" /><button disabled={loading || !question.trim()} className="action px-3 py-2 text-xs">Ask</button></form></section>
}
