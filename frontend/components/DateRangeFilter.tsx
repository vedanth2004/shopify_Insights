'use client'

import { useState, useEffect } from 'react'

interface DateRangeFilterProps {
  startDate?: string
  endDate?: string
  onChange: (startDate?: string, endDate?: string) => void
}

export default function DateRangeFilter({ startDate, endDate, onChange }: DateRangeFilterProps) {
  const [localStartDate, setLocalStartDate] = useState(startDate || '')
  const [localEndDate, setLocalEndDate] = useState(endDate || '')

  // Sync local state with props
  useEffect(() => {
    setLocalStartDate(startDate || '')
    setLocalEndDate(endDate || '')
  }, [startDate, endDate])

  const handleApply = () => {
    onChange(localStartDate || undefined, localEndDate || undefined)
  }

  const handleClear = () => {
    setLocalStartDate('')
    setLocalEndDate('')
    onChange(undefined, undefined)
  }

  const hasActiveFilter = startDate || endDate;

  return (
    <div className={`rounded-xl bg-white p-5 shadow-soft ${hasActiveFilter ? 'ring-2 ring-primary-500/20' : ''}`}>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center space-x-2">
          <label htmlFor="startDate" className="text-sm font-semibold text-gray-700">
            Start Date:
          </label>
          <input
            id="startDate"
            type="date"
            value={localStartDate}
            onChange={(e) => setLocalStartDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="flex items-center space-x-2">
          <label htmlFor="endDate" className="text-sm font-semibold text-gray-700">
            End Date:
          </label>
          <input
            id="endDate"
            type="date"
            value={localEndDate}
            min={localStartDate || undefined}
            onChange={(e) => setLocalEndDate(e.target.value)}
            className="rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleApply}
            disabled={!localStartDate && !localEndDate}
            className="rounded-lg bg-gradient-to-r from-primary-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Apply
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={!hasActiveFilter}
            className="rounded-lg bg-gray-200 px-5 py-2 text-sm font-semibold text-gray-700 transition-all hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
        {hasActiveFilter && (
          <div className="ml-auto flex items-center space-x-2 rounded-lg bg-primary-50 px-3 py-1.5">
            <span className="text-xs font-medium text-primary-700">
              Filter active: {startDate} {endDate && `to ${endDate}`}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

