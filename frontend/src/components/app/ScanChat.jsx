import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { chatAboutScan } from '../../api/api'
import { Icon } from '../ui'

export default function ScanChat({ scanId }) {
  const [messages, setMessages] = useState([])
  const [question, setQuestion] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setMessages([])
    setQuestion('')
    setError('')
  }, [scanId])

  const ask = async (value = question) => {
    const text = value.trim()
    if (!text || loading) return
    setMessages((current) => [...current, { role: 'user', text }])
    setQuestion('')
    setError('')
    setLoading(true)
    try {
      const { reply } = await chatAboutScan(scanId, text)
      setMessages((current) => [...current, { role: 'assistant', text: reply }])
    } catch (requestError) {
      setError(requestError?.response?.data?.detail || 'The scan assistant is unavailable. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="glass mt-5 rounded-3xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="m-0 flex items-center gap-2 text-xs font-bold text-cyan-300">
            <Icon name="chat" className="h-4 w-4" />
            Scan assistant
          </p>
          <p className="mb-0 mt-1 text-[10px] text-slate-400">Ask about this scan's targets and priorities.</p>
        </div>
        <button
          type="button"
          onClick={() => ask('Summarize this scan for the operator.')}
          disabled={loading}
          className="action-secondary px-2.5 py-1.5 text-[10px]"
        >
          Summarize scan
        </button>
      </div>

      {messages.length > 0 && (
        <div className="mt-4 max-h-60 space-y-2 overflow-y-auto">
          {messages.map((item, index) => (
            <motion.div
              key={`${item.role}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
              className={`rounded-xl px-3 py-2.5 text-xs leading-6 ${
                item.role === 'user'
                  ? 'ml-6 bg-gradient-to-r from-teal-500 to-cyan-400 text-[#03202b] font-medium'
                  : 'mr-3 border border-white/10 bg-white/[.04] text-slate-200'
              }`}
            >
              {item.text}
            </motion.div>
          ))}
        </div>
      )}

      {loading && (
        <p className="mb-0 mt-3 flex items-center gap-2 text-[10px] font-semibold text-cyan-300">
          <span className="flex gap-1">
            <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300" />
            <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:120ms]" />
            <i className="h-1.5 w-1.5 animate-bounce rounded-full bg-cyan-300 [animation-delay:240ms]" />
          </span>
          Preparing a scan-grounded answer…
        </p>
      )}
      {error && (
        <p role="alert" className="mb-0 mt-3 rounded-xl border border-rose-300/25 bg-rose-400/10 p-2.5 text-[10px] text-rose-200">
          {error}
        </p>
      )}

      <form className="mt-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); ask() }}>
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={1000}
          className="field-input min-w-0 flex-1 !py-2.5 text-xs"
          placeholder="e.g. What requires review first?"
          aria-label="Question about this scan"
        />
        <button disabled={loading || !question.trim()} className="action px-4 !py-2.5 text-xs">
          <Icon name="send" className="h-3.5 w-3.5" />
          Ask
        </button>
      </form>
    </section>
  )
}
