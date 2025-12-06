'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { tenantAPI, insightsAPI } from '@/lib/api'
import { setAuthToken } from '@/lib/api'
import toast from 'react-hot-toast'
import MetricsCard from './MetricsCard'
import RevenueChart from './RevenueChart'
import TopCustomersTable from './TopCustomersTable'
import TopProductsTable from './TopProductsTable'
import DateRangeFilter from './DateRangeFilter'

interface Tenant {
  id: string
  storeName: string
  storeUrl: string
  _count: {
    customers: number
    orders: number
    products: number
  }
}

interface DashboardData {
  metrics: {
    totalCustomers: number
    totalOrders: number
    totalRevenue: number
  }
  topCustomers: any[]
  topProducts: any[]
  revenueTrend: Array<{
    date: string
    orders: number
    revenue: number
  }>
}

export default function DashboardContent() {
  const { data: session } = useSession()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [selectedTenant, setSelectedTenant] = useState<string>('')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState<{ startDate?: string; endDate?: string }>({})

  useEffect(() => {
    if (session && (session as any).accessToken) {
      setAuthToken((session as any).accessToken)
      loadTenants()
    }
  }, [session])

  useEffect(() => {
    if (selectedTenant) {
      loadDashboardData()
    }
  }, [selectedTenant, dateRange])

  const loadTenants = async () => {
    try {
      const response = await tenantAPI.getAll()
      if (response.data.success) {
        setTenants(response.data.data)
        if (response.data.data.length > 0 && !selectedTenant) {
          setSelectedTenant(response.data.data[0].id)
        }
      }
    } catch (error: any) {
      toast.error('Failed to load stores')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const loadDashboardData = async () => {
    if (!selectedTenant) return

    try {
      const response = await insightsAPI.getDashboard(selectedTenant, dateRange)
      if (response.data.success) {
        setDashboardData(response.data.data)
      }
    } catch (error: any) {
      toast.error('Failed to load dashboard data')
      console.error(error)
    }
  }

  const handleSync = async () => {
    if (!selectedTenant) return

    try {
      await tenantAPI.sync(selectedTenant)
      toast.success('Sync initiated. Data will update shortly.')
      setTimeout(loadDashboardData, 2000)
    } catch (error: any) {
      toast.error('Failed to sync')
      console.error(error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (tenants.length === 0) {
    return (
      <div className="rounded-lg bg-white p-8 text-center shadow">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">No Stores Found</h2>
        <p className="mb-6 text-gray-600">Add your first Shopify store to get started.</p>
        <a
          href="/dashboard/stores"
          className="inline-block rounded-md bg-primary-600 px-6 py-3 text-sm font-medium text-white hover:bg-primary-700"
        >
          Add Store
        </a>
      </div>
    )
  }

  const currentTenant = tenants.find((t) => t.id === selectedTenant)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">Monitor your Shopify store performance</p>
        </div>
      </div>

      {/* Tenant Selector */}
      <div className="flex items-center justify-between rounded-xl bg-white p-6 shadow-soft">
        <div className="flex items-center space-x-4">
          <label htmlFor="tenant" className="text-sm font-semibold text-gray-700">
            Store:
          </label>
          <select
            id="tenant"
            value={selectedTenant}
            onChange={(e) => setSelectedTenant(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 shadow-sm transition-all focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            {tenants.map((tenant) => (
              <option key={tenant.id} value={tenant.id}>
                {tenant.storeName} ({tenant.storeUrl})
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={handleSync}
          className="group flex items-center space-x-2 rounded-lg bg-gradient-to-r from-primary-600 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Sync Data</span>
        </button>
      </div>

      {/* Date Range Filter */}
      <DateRangeFilter
        startDate={dateRange.startDate}
        endDate={dateRange.endDate}
        onChange={(startDate, endDate) => setDateRange({ startDate, endDate })}
      />

      {/* Metrics Cards */}
      {dashboardData && (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <MetricsCard
              title="Total Customers"
              value={dashboardData.metrics.totalCustomers.toLocaleString()}
              icon="👥"
            />
            <MetricsCard
              title="Total Orders"
              value={dashboardData.metrics.totalOrders.toLocaleString()}
              icon="📦"
            />
            <MetricsCard
              title="Total Revenue"
              value={`$${dashboardData.metrics.totalRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}`}
              icon="💰"
            />
          </div>

          {/* Revenue Chart */}
          <div className="rounded-xl bg-white p-6 shadow-soft">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Revenue Trend</h2>
                <p className="mt-1 text-sm text-gray-600">Revenue and orders over time</p>
              </div>
            </div>
            <RevenueChart data={dashboardData.revenueTrend} />
          </div>

          {/* Top Customers and Products */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <div className="rounded-xl bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Top 5 Customers</h2>
                  <p className="mt-1 text-sm text-gray-600">By total spending</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                  <span className="text-xl">👥</span>
                </div>
              </div>
              <TopCustomersTable customers={dashboardData.topCustomers} />
            </div>

            <div className="rounded-xl bg-white p-6 shadow-soft">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Top 5 Products</h2>
                  <p className="mt-1 text-sm text-gray-600">By revenue generated</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-100">
                  <span className="text-xl">📦</span>
                </div>
              </div>
              <TopProductsTable products={dashboardData.topProducts} />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

