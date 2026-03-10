import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

const API_BASE = 'http://localhost:5000'

function Portfolio() {
  const [holdings, setHoldings] = useState([])
  const [prices, setPrices] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [buySymbol, setBuySymbol] = useState('')
  const [buyShares, setBuyShares] = useState('')
  const [buyLoading, setBuyLoading] = useState(false)
  const [buyMessage, setBuyMessage] = useState('')

  const navigate = useNavigate()

  const token = useMemo(() => localStorage.getItem('token'), [])

  useEffect(() => {
    if (!token) {
      navigate('/login')
      return
    }

    const fetchPortfolioAndPrices = async () => {
      setLoading(true)
      setError('')

      try {
        const profileRes = await axios.get(`${API_BASE}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        const portfolio = profileRes.data.portfolio || []
        setHoldings(portfolio)

        if (portfolio.length === 0) {
          setPrices({})
          return
        }

        const uniqueSymbols = [
          ...new Set(portfolio.map((p) => p.symbol.toUpperCase())),
        ]

        const priceResponses = await Promise.all(
          uniqueSymbols.map((symbol) =>
            axios
              .get(`${API_BASE}/api/stocks/${symbol}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              .then((res) => res.data)
          )
        )

        const nextPrices = {}
        priceResponses.forEach((p) => {
          nextPrices[p.symbol] = p.price
        })

        setPrices(nextPrices)
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
          'Failed to load portfolio'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }

    fetchPortfolioAndPrices()
  }, [navigate, token])

  const enrichedHoldings = useMemo(
    () =>
      holdings.map((h) => {
        const symbol = (h.symbol || '').toUpperCase()
        const currentPrice = prices[symbol]
        const currentValue =
          typeof currentPrice === 'number' && h.shares
            ? currentPrice * h.shares
            : null

        return {
          ...h,
          symbol,
          currentPrice,
          currentValue,
        }
      }),
    [holdings, prices]
  )

  const totalValue = useMemo(
    () =>
      enrichedHoldings.reduce(
        (sum, h) => sum + (h.currentValue != null ? h.currentValue : 0),
        0
      ),
    [enrichedHoldings]
  )

  const handleLogout = () => {
    localStorage.clear()
    navigate('/login')
  }

  const handleBuy = async (e) => {
    e.preventDefault()
    if (!token) {
      navigate('/login')
      return
    }

    setBuyLoading(true)
    setBuyMessage('')
    setError('')

    const symbol = buySymbol.trim().toUpperCase()
    const shares = Number(buyShares)

    if (!symbol || !shares || shares <= 0) {
      setError('Please enter a valid symbol and number of shares')
      setBuyLoading(false)
      return
    }

    try {
      const res = await axios.post(
        `${API_BASE}/api/stocks/buy`,
        { symbol, shares },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )

      setBuyMessage(res.data.message || 'Successfully bought stock')
      setBuySymbol('')
      setBuyShares('')

      const profileRes = await axios.get(`${API_BASE}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      const portfolio = profileRes.data.portfolio || []
      setHoldings(portfolio)

      const uniqueSymbols = [
        ...new Set(portfolio.map((p) => p.symbol.toUpperCase())),
      ]

      const priceResponses = await Promise.all(
        uniqueSymbols.map((s) =>
          axios
            .get(`${API_BASE}/api/stocks/${s}`, {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            })
            .then((r) => r.data)
        )
      )

      const nextPrices = {}
      priceResponses.forEach((p) => {
        nextPrices[p.symbol] = p.price
      })

      setPrices(nextPrices)
    } catch (err) {
      const msg =
        err.response?.data?.message ||
        err.response?.data?.error ||
        err.message ||
        'Error buying stock'
      setError(msg)
    } finally {
      setBuyLoading(false)
    }
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
              className="text-slate-200 hover:text-white font-medium border-b-2 border-transparent border-indigo-500 transition"
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
        <header>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Portfolio
          </h1>
          <p className="mt-1 text-xs text-slate-400">
            Overview of your current holdings and recent purchases.
          </p>
        </header>

        {error && (
          <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </div>
        )}

        {buyMessage && (
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {buyMessage}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[3fr,2fr]">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner shadow-black/40">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-100">
                  Holdings
                </h2>
                <p className="text-[11px] text-slate-500">
                  Synced with your recent buy activity.
                </p>
              </div>
              <div className="text-right text-xs text-slate-400">
                <div>Total Value</div>
                <div className="text-sm font-semibold text-slate-50">
                  {totalValue > 0 ? `$${totalValue.toFixed(2)}` : '—'}
                </div>
              </div>
            </div>

            {loading ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                Loading portfolio...
              </div>
            ) : enrichedHoldings.length === 0 ? (
              <div className="flex h-40 items-center justify-center text-sm text-slate-400">
                You do not own any stocks yet. Use the form on the right to buy
                your first position.
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-slate-800/80 bg-slate-950/60">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">Symbol</th>
                      <th className="px-4 py-2 font-medium text-right">
                        Shares
                      </th>
                      <th className="px-4 py-2 font-medium text-right">
                        Buy Price
                      </th>
                      <th className="px-4 py-2 font-medium text-right">
                        Current Value
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedHoldings.map((h, idx) => (
                      <tr
                        key={`${h.symbol}-${idx}`}
                        className={
                          idx % 2 === 0
                            ? 'bg-slate-950/40'
                            : 'bg-slate-900/40'
                        }
                      >
                        <td className="px-4 py-2 text-sm font-medium text-slate-100">
                          {h.symbol}
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-slate-200">
                          {h.shares}
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-slate-200">
                          {h.buyPrice != null
                            ? `$${h.buyPrice.toFixed(2)}`
                            : '—'}
                        </td>
                        <td className="px-4 py-2 text-right text-sm text-slate-100">
                          {h.currentValue != null
                            ? `$${h.currentValue.toFixed(2)}`
                            : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-inner shadow-black/40">
            <h2 className="text-sm font-semibold text-slate-100">
              Buy Stock
            </h2>
            <p className="mt-1 text-[11px] text-slate-500">
              Enter a stock symbol and number of shares to simulate a purchase.
            </p>

            <form onSubmit={handleBuy} className="mt-4 space-y-4 text-sm">
              <div className="space-y-1.5">
                <label
                  htmlFor="buy-symbol"
                  className="block text-xs font-medium text-slate-300"
                >
                  Symbol
                </label>
                <input
                  id="buy-symbol"
                  type="text"
                  value={buySymbol}
                  onChange={(e) => setBuySymbol(e.target.value.toUpperCase())}
                  placeholder="AAPL"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="buy-shares"
                  className="block text-xs font-medium text-slate-300"
                >
                  Shares
                </label>
                <input
                  id="buy-shares"
                  type="number"
                  min="1"
                  step="1"
                  value={buyShares}
                  onChange={(e) => setBuyShares(e.target.value)}
                  placeholder="10"
                  className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60"
                />
              </div>

              <button
                type="submit"
                disabled={buyLoading}
                className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/40 transition hover:bg-indigo-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {buyLoading ? 'Placing order...' : 'Buy'}
              </button>

              <p className="mt-2 text-[10px] text-slate-500">
                Prices are fetched live from Finnhub at the time of purchase and
                stored as your buy price.
              </p>
            </form>
          </div>
        </section>
      </main>
    </div>
  )
}

export default Portfolio