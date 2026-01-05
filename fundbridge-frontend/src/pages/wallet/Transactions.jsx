import { useEffect, useMemo, useState } from 'react'
import { jsPDF } from 'jspdf'
import { fetchTransactions } from '../../api/walletApi'
import { API_STATUS, CURRENCY_FORMATTER } from '../../utils/constants'
import Loader from '../../components/common/Loader'
import { useAuth } from '../../context/AuthContext'

const statusToneMap = {
  COMPLETED: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  PENDING: 'bg-amber-50 text-amber-700 border border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border border-rose-200',
  default: 'bg-slate-50 text-slate-700 border border-slate-200',
}

const typeToneMap = {
  CREDIT: 'text-emerald-700 bg-emerald-50 border border-emerald-200',
  DEBIT: 'text-rose-700 bg-rose-50 border border-rose-200',
  default: 'text-slate-700 bg-slate-50 border border-slate-200',
}

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A'

const formatPdfDate = (value) =>
  value
    ? new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'N/A'

const PDF_NUMBER_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})

const formatPdfAmount = (amount) => {
  const safeAmount = Number.isFinite(Number(amount)) ? Number(amount) : 0
  return PDF_NUMBER_FORMATTER.format(safeAmount)
}

const Transactions = () => {
  const [transactions, setTransactions] = useState([])
  const [status, setStatus] = useState(API_STATUS.loading)
  const [filters, setFilters] = useState({
    query: '',
    type: 'ALL',
    state: 'ALL',
    startDate: '',
    endDate: '',
  })
  const { user, bootstrapping } = useAuth()

  const load = async () => {
    if (!user?.id) {
      setStatus(API_STATUS.error)
      return
    }
    setStatus(API_STATUS.loading)
    try {
      const response = await fetchTransactions({ userId: user?.id })
      setTransactions(response || [])
      setStatus(API_STATUS.success)
    } catch (error) {
      console.error(error)
      setStatus(API_STATUS.error)
    }
  }

  useEffect(() => {
    if (bootstrapping || !user?.id) {
      return
    }
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bootstrapping, user?.id])

  const filteredTransactions = useMemo(() => {
    return (transactions || []).filter((tx) => {
      const matchesQuery =
        filters.query.trim().length === 0 ||
        (tx.id && String(tx.id).toLowerCase().includes(filters.query.toLowerCase())) ||
        (tx.type && tx.type.toLowerCase().includes(filters.query.toLowerCase()))

      const matchesType = filters.type === 'ALL' || tx.type === filters.type
      const matchesState = filters.state === 'ALL' || tx.status === filters.state

      const createdAt = tx.createdAt ? new Date(tx.createdAt) : null
      const startOk =
        !filters.startDate || (createdAt && createdAt >= new Date(filters.startDate))
      const endOk = !filters.endDate || (createdAt && createdAt <= new Date(filters.endDate))

      return matchesQuery && matchesType && matchesState && startOk && endOk
    })
  }, [filters.endDate, filters.query, filters.startDate, filters.state, filters.type, transactions])

  const typeOptions = useMemo(() => {
    const set = new Set(transactions.map((tx) => tx.type).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [transactions])

  const statusOptions = useMemo(() => {
    const set = new Set(transactions.map((tx) => tx.status).filter(Boolean))
    return ['ALL', ...Array.from(set)]
  }, [transactions])

  const buildFilterSummary = () => {
    const parts = []
    if (filters.query) {
      parts.push(`Query: ${filters.query}`)
    }
    if (filters.type && filters.type !== 'ALL') {
      parts.push(`Type: ${filters.type}`)
    }
    if (filters.state && filters.state !== 'ALL') {
      parts.push(`Status: ${filters.state}`)
    }
    if (filters.startDate) {
      parts.push(`From: ${filters.startDate}`)
    }
    if (filters.endDate) {
      parts.push(`To: ${filters.endDate}`)
    }
    if (!parts.length) {
      return 'Filters: None'
    }
    return `Filters: ${parts.join(' | ')}`
  }

  const handleExportPdf = () => {
    if (!filteredTransactions.length) {
      return
    }
    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' })
    const margin = 40
    const pageWidth = doc.internal.pageSize.getWidth()
    const pageHeight = doc.internal.pageSize.getHeight()
    const headerTop = margin
    const lineHeight = 18

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(18)
    doc.text('Transaction Report', margin, headerTop + 5)

    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    const generatedLine = `Generated: ${formatPdfDate(new Date())}`
    doc.text(generatedLine, margin, headerTop + 25)

    const filterSummary = buildFilterSummary()
    const maxTextWidth = pageWidth - margin * 2
    const filterLines = doc.splitTextToSize(filterSummary, maxTextWidth)
    doc.text(filterLines, margin, headerTop + 40)

    let y = headerTop + 40 + filterLines.length * lineHeight + 10

    const baseWidths = [70, 120, 120, 140, 90]
    const remainingWidth = pageWidth - margin * 2 - baseWidths.reduce((sum, width) => sum + width, 0)
    const columns = [
      { label: 'ID', width: baseWidths[0], align: 'left' },
      { label: 'Type', width: baseWidths[1], align: 'left' },
      { label: 'Status', width: baseWidths[2], align: 'left' },
      { label: 'Amount', width: baseWidths[3], align: 'right' },
      { label: 'Currency', width: baseWidths[4], align: 'left' },
      { label: 'Date', width: Math.max(remainingWidth, 180), align: 'left' },
    ]

    const drawHeader = () => {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      let x = margin
      columns.forEach((col) => {
        const textX = col.align === 'right' ? x + col.width : x
        doc.text(col.label, textX, y, { align: col.align })
        x += col.width
      })
      doc.setFont('helvetica', 'normal')
      y += lineHeight
      doc.setDrawColor(226, 232, 240)
      doc.line(margin, y - 10, pageWidth - margin, y - 10)
    }

    const addPageIfNeeded = () => {
      if (y + lineHeight > pageHeight - margin) {
        doc.addPage()
        y = margin
        drawHeader()
      }
    }

    drawHeader()

    filteredTransactions.forEach((tx) => {
      addPageIfNeeded()
      let x = margin
      const row = [
        tx.id ? String(tx.id) : 'N/A',
        tx.type || 'N/A',
        tx.status || 'N/A',
        formatPdfAmount(tx.amount),
        tx.currency || 'N/A',
        formatPdfDate(tx.createdAt),
      ]
      row.forEach((cell, index) => {
        const column = columns[index]
        const cellText = cell == null ? '' : String(cell)
        const textX = column.align === 'right' ? x + column.width : x
        doc.text(cellText, textX, y, { align: column.align })
        x += column.width
      })
      y += lineHeight
    })

    doc.save('transaction-report.pdf')
  }

  if (bootstrapping || status === API_STATUS.loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader />
      </div>
    )
  }

  if (status === API_STATUS.error) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-rose-400/30 bg-rose-50 px-6 py-5 text-rose-800 shadow">
        <p className="text-[0.7rem] uppercase tracking-[0.18em] text-rose-600">Transactions</p>
        <p className="mt-2 text-lg font-semibold">Unable to load transactions</p>
        <button
          type="button"
          onClick={load}
          className="mt-4 inline-flex items-center justify-center rounded-xl bg-rose-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-rose-600 focus:outline-none focus:ring-2 focus:ring-rose-200"
        >
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm md:px-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[0.75rem] uppercase tracking-[0.18em] text-slate-500">
              Transactions
            </p>
            <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
              {filteredTransactions.length} results
            </h1>
            <p className="text-sm text-slate-600">
              Filter and inspect your wallet activity. Click a row for details.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={load}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-[1px] hover:border-indigo-200 hover:text-indigo-800 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={!filteredTransactions.length}
              className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-indigo-300"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1.2fr,1fr,1fr,1fr]">
          <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
            <input
              type="search"
              placeholder="Search by ID or type"
              value={filters.query}
              onChange={(e) => setFilters((prev) => ({ ...prev, query: e.target.value }))}
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
          <select
            value={filters.type}
            onChange={(e) => setFilters((prev) => ({ ...prev, type: e.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {typeOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'ALL' ? 'All types' : option}
              </option>
            ))}
          </select>
          <select
            value={filters.state}
            onChange={(e) => setFilters((prev) => ({ ...prev, state: e.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
          >
            {statusOptions.map((option) => (
              <option key={option} value={option}>
                {option === 'ALL' ? 'All statuses' : option}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <div className="flex flex-col text-xs text-slate-600">
              <label className="font-semibold" htmlFor="startDate">
                From
              </label>
              <input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
            <div className="flex flex-col text-xs text-slate-600">
              <label className="font-semibold" htmlFor="endDate">
                To
              </label>
              <input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="rounded border border-slate-200 px-2 py-1 text-sm text-slate-800 focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {filteredTransactions.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Currency
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{tx.id}</td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${typeToneMap[tx.type] || typeToneMap.default}`}
                      >
                        {tx.type || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-800">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusToneMap[tx.status] || statusToneMap.default}`}
                      >
                        {tx.status || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      {CURRENCY_FORMATTER.format(tx.amount || 0)}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700">{tx.currency || 'N/A'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">
                      {formatDate(tx.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-2 py-10 text-center text-slate-600">
            <p className="text-lg font-semibold text-slate-900">No transactions yet</p>
            <p className="text-sm">
              Fund your wallet or repay a loan to see activity appear here.
            </p>
          </div>
        )}
      </section>
    </div>
  )
}

export default Transactions
