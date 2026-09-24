import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getUsers } from '../../api/api'
import { Badge, EmptyState, Icon } from '../ui'

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    getUsers()
      .then(setUsers)
      .catch((e) => setError(e?.response?.data?.detail || 'Could not load users'))
  }, [])

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="page-enter mb-6">
        <p className="eyebrow">Administration</p>
        <h1 className="m-0 font-display text-3xl font-bold tracking-tight text-slate-100">Admin console</h1>
        <p className="mb-0 mt-2 text-sm text-slate-400">Manage access and review workspace activity.</p>
      </div>

      <section className="page-enter-delay panel overflow-hidden !p-0">
        <div className="flex items-center justify-between border-b border-white/10 p-5">
          <div>
            <p className="eyebrow">Users</p>
            <h2 className="m-0 font-display text-lg font-bold text-slate-100">Registered operators</h2>
          </div>
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-400/10 text-cyan-300">
            <Icon name="users" className="h-5 w-5" />
          </span>
        </div>

        {error ? (
          <p role="alert" className="p-5 text-sm text-rose-300">{error}</p>
        ) : !users.length ? (
          <EmptyState icon="users" title="No operators found" sub="Registered users will appear here." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="border-b border-white/10 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                <tr>
                  <th className="px-5 py-3">Name</th>
                  <th className="px-3 py-3">Email</th>
                  <th className="px-3 py-3">Role</th>
                  <th className="px-5 py-3">Scans</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, i) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: Math.min(i, 12) * 0.05, ease: [0.22, 1, 0.36, 1] }}
                    className="border-t border-white/10 hover:bg-cyan-400/5"
                  >
                    <td className="px-5 py-3 font-medium text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-to-br from-cyan-400 to-teal-500 text-[10px] font-bold text-[#03202b]">
                          {user.full_name.slice(0, 2).toUpperCase()}
                        </span>
                        {user.full_name}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-slate-400">{user.email}</td>
                    <td className="px-3 py-3">
                      <Badge tone={user.role === 'admin' ? 'violet' : 'cyan'}>{user.role}</Badge>
                    </td>
                    <td className="px-5 py-3 text-slate-200">{user.scan_count}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
