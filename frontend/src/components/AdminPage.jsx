import { useEffect, useState } from 'react'
import { getUsers } from '../api/api'

export default function AdminPage() {
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')
  useEffect(() => { getUsers().then(setUsers).catch(e => setError(e?.response?.data?.detail || 'Could not load users')) }, [])
  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="page-enter mb-6">
        <h1 className="m-0 text-3xl font-extrabold tracking-tight text-ink">Administration</h1>
        <p className="mb-0 mt-2 text-sm text-muted">Manage access and review workspace activity.</p>
      </div>
      <section className="page-enter-delay panel overflow-hidden p-0">
        <div className="border-b border-line p-5">
          <p className="eyebrow">Users</p>
          <h2 className="m-0 font-display text-lg font-bold text-ink">Registered operators</h2>
        </div>
        {error ? <p className="p-5 text-sm text-rose-400">{error}</p> : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead className="text-[10px] uppercase tracking-wider text-muted">
                <tr><th className="px-5 py-3">Name</th><th className="px-3 py-3">Email</th><th className="px-3 py-3">Role</th><th className="px-5 py-3">Scans</th></tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-t border-line">
                    <td className="px-5 py-3 font-medium text-ink">{user.full_name}</td>
                    <td className="px-3 py-3 text-muted">{user.email}</td>
                    <td className="px-3 py-3"><span className="rounded-full bg-cyan-400/15 px-2 py-1 text-xs font-bold text-cyan">{user.role}</span></td>
                    <td className="px-5 py-3">{user.scan_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}
