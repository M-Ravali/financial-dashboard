import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from 'recharts'

const SOCKET_URL = '${import.meta.env.VITE_API_URL}'
const TRACKED_STOCKS = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
const MAX_POINTS = 60

function Dashboard() {
  const [stocks, setStocks] = useState(() =>
    TRACKED_STOCKS.reduce((acc, symbol) => {
      acc[symbol] = {
        symbol,
        price: null,
        change: 0,
        percentChange: 0,
        timestamp: null,
      }
      return acc
    }, {})
  )

  const [history, setHistory] = useState(() =>
    TRACKED_STOCKS.reduce((acc, symbol) => {
      acc[symbol] = []
      return acc
    }, {})
  )

  const [selectedSymbol, setSelectedSymbol] = useState(TRACKED_STOCKS[0])
  const [alert, setAlert] = useState(null)

  const navigate = useNavigate()

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
    })

    socket.on('priceUpdate', (update) => {
      if (!TRACKED_STOCKS.includes(update.symbol)) return

      setStocks((prev) => ({
        ...prev,
        [update.symbol]: {
          ...prev[update.symbol],
          ...update,
        },
      }))

      setHistory((prev) => {
        const next = { ...prev }
        const existing = next[update.symbol] || []
        const point = {
          time: update.timestamp,
          price: update.price,
        }

        const updated = [...existing, point]
        if (updated.length > MAX_POINTS) {
          updated.shift()
        }

        next[update.symbol] = updated
        return next
      })
    })

    socket.on('priceAlert', (payload) => {
      if (!TRACKED_STOCKS.includes(payload.symbol)) return

      setAlert({
        symbol: payload.symbol,
        message: payload.message,
      })

      setTimeout(() => {
        setAlert(null)
      }, 8000)
    })

    return () => {
      socket.disconnect()
    }
  }, [])

  const chartData = useMemo(
    () => history[selectedSymbol] || [],
    [history, selectedSymbol]
  )

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 flex flex-col">
      {alert && (
        <div className="w-full bg-red-600/90 text-white text-sm px-4 py-2 flex items-center justify-center shadow-lg shadow-red-800/50">
          <span className="font-semibold mr-2">Price Alert:</span>
          <span>{alert.message}</span>
        </div>
      )}

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
              className="text-slate-200 hover:text-white font-medium border-b-2 border-transparent hover:border-indigo-500 transition"
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
              className="text-slate-300 hover:text-white border-b-2 border-transparent hover:border-indigo-500 transition"
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
        <section>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Live Market Overview
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Streaming real-time quotes from Finnhub for your watchlist.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-[2fr,3fr]">
          <div className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
              Watchlist
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {TRACKED_STOCKS.map((symbol) => {
                const s = stocks[symbol]
                const isActive = selectedSymbol === symbol
                const change = s?.change ?? 0
                const percentChange = s?.percentChange ?? 0

                const changeColor =
                  change > 0
                    ? 'text-emerald-400'
                    : change < 0
                    ? 'text-rose-400'
                    : 'text-slate-300'

                return (
                  <button
                    key={symbol}
                    type="button"
                    onClick={() => setSelectedSymbol(symbol)}
                    className={`flex flex-col items-start rounded-xl border px-4 py-3 text-left transition shadow-sm shadow-black/20 ${
                      isActive
                        ? 'border-indigo-500/70 bg-slate-900'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="flex w-full items-center justify-between">
                      <div>
                        <div className="text-sm font-semibold text-slate-100">
                          {symbol}
                        </div>
                        <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
                          US Equity
                        </div>
                      </div>
                      <div className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-300">
                        {s?.timestamp || '—'}
                      </div>
                    </div>

                    <div className="mt-3 flex w-full items-end justify-between">
                      <div className="text-lg font-semibold text-slate-50">
                        {s?.price != null ? `$${s.price.toFixed(2)}` : '—'}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <span className={changeColor}>
                          {change > 0 ? '+' : ''}
                          {s?.change != null ? change.toFixed(2) : '0.00'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            percentChange > 0
                              ? 'bg-emerald-500/10 text-emerald-300'
                              : percentChange < 0
                              ? 'bg-rose-500/10 text-rose-300'
                              : 'bg-slate-700/60 text-slate-200'
                          }`}
                        >
                          {percentChange > 0 ? '+' : ''}
                          {s?.percentChange != null
                            ? percentChange.toFixed(2)
                            : '0.00'}
                          %
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner shadow-black/40">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  {selectedSymbol} Price History
                </h2>
                <p className="text-[11px] text-slate-500">
                  Live line chart updating with each tick.
                </p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div>
                  Last price:{' '}
                  {stocks[selectedSymbol]?.price != null
                    ? `$${stocks[selectedSymbol].price.toFixed(2)}`
                    : '—'}
                </div>
                <div className="text-[10px]">
                  Points: {chartData.length}/{MAX_POINTS}
                </div>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2933" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#374151' }}
                    minTickGap={20}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    tickLine={false}
                    axisLine={{ stroke: '#374151' }}
                    width={48}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020617',
                      border: '1px solid #1f2937',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      fontSize: '0.75rem',
                    }}
                    labelStyle={{ color: '#9ca3af', marginBottom: 4 }}
                    itemStyle={{ color: '#e5e7eb' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Dashboard