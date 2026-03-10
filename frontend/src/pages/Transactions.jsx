import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = '${import.meta.env.VITE_API_URL}'

function Transactions() {
  const [transactions, setTransactions] = useState([])
  const [summary, setSummary] = useState({ totalBought: 0, totalSold: 0, totalTransactions: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const navigate = useNavigate()

  const token = useMemo(() => localStorage.getItem('token'), [])

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const fetchData = async () => {
      setLoading(true)
      setError('')

      try {
        const headers = { Authorization: `Bearer ${token}` }

        const [transRes, summaryRes] = await Promise.all([
          axios.get(`${API_BASE}/api/transactions`, { headers }),
          axios.get(`${API_BASE}/api/transactions/summary`, { headers }),
        ])

        setTransactions(transRes.data)
        setSummary(summaryRes.data)
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.clear()
          navigate('/login')
          return
        }
        const msg =
          err.response?.data?.message ||
          err.response?.data?.error ||
          err.message ||
          'Failed to load transactions'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [navigate, token])

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return '—'
    const d = new Date(dateStr)
    return d.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-xl bg-indigo-500 flex items-center justify-center text-xs font-bold">
              FD
            </div>
            <span className="text-sm font-semibold tracking-tight text-slate-100">
              Financial Dashboard
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link
              to="/dashboard"
              className="text-slate-300 hover:text-white border-b-2 border-transparent hover:border-indigo-500 transition"
            >
              Dashboard
            </Link>
            <Link
              to="/portfolio"
              className="text-slate-300 hover:text-white border-b-2 border-transparent hover:border-indigo-500 transition"
            >
              Portfolio
            </Link>
            <Link
              to="/transactions"
              className="text-slate-200 hover:text-white font-medium border-b-2 border-transparent border-indigo-500 transition"
            >
              Transactions
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="ml-3 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-red-500 hover:text-red-200 hover:bg-red-900/40 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="flex-1 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Transaction History
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            View your buy and sell activity with summary totals.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {/* Summary row */}
        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner shadow-black/40">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Bought
            </div>
            <div className="mt-1 text-xl font-semibold text-emerald-400">
              ${Number(summary.totalBought).toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner shadow-black/40">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Sold
            </div>
            <div className="mt-1 text-xl font-semibold text-rose-400">
              ${Number(summary.totalSold).toFixed(2)}
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner shadow-black/40">
            <div className="text-xs font-medium uppercase tracking-wider text-slate-500">
              Total Transactions
            </div>
            <div className="mt-1 text-xl font-semibold text-slate-100">
              {summary.totalTransactions}
            </div>
          </div>
        </section>

        {/* Transactions table */}
        <section className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner shadow-black/40">
          <div className="mb-3">
            <h2 className="text-sm font-semibold text-slate-100">
              All Transactions
            </h2>
            <p className="text-[11px] text-slate-500">
              Last 50 transactions, newest first.
            </p>
          </div>

          {loading ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              Loading transactions...
            </div>
          ) : transactions.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-slate-400">
              No transactions yet.
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400">
                  <tr>
                    <th className="px-4 py-2 font-medium">Symbol</th>
                    <th className="px-4 py-2 font-medium">Type</th>
                    <th className="px-4 py-2 font-medium text-right">
                      Shares
                    </th>
                    <th className="px-4 py-2 font-medium text-right">
                      Price
                    </th>
                    <th className="px-4 py-2 font-medium text-right">
                      Total
                    </th>
                    <th className="px-4 py-2 font-medium">Date</th>
                    <th className="px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map((t, idx) => (
                    <tr
                      key={t._id || idx}
                      className={
                        idx % 2 === 0
                          ? 'bg-slate-950/40'
                          : 'bg-slate-900/40'
                      }
                    >
                      <td className="px-4 py-2 text-sm font-medium text-slate-100">
                        {t.symbol}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            t.type === 'BUY'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : 'bg-rose-500/20 text-rose-400'
                          }`}
                        >
                          {t.type}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-slate-200">
                        {t.shares}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-slate-200">
                        {t.price != null ? `$${t.price.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-right text-sm text-slate-100">
                        {t.total != null ? `$${t.total.toFixed(2)}` : '—'}
                      </td>
                      <td className="px-4 py-2 text-sm text-slate-400">
                        {formatDate(t.createdAt)}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`text-[10px] font-medium ${
                            t.status === 'COMPLETED'
                              ? 'text-emerald-400'
                              : t.status === 'PENDING'
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {t.status || 'COMPLETED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}

export default Transactions
