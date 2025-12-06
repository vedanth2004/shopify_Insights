'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'
import { tenantAPI } from '@/lib/api'
import { setAuthToken } from '@/lib/api'
import toast from 'react-hot-toast'

interface Tenant {
  id: string
  storeName: string
  storeUrl: string
  isActive: boolean
  createdAt: string
  _count: {
    customers: number
    orders: number
    products: number
  }
}

export default function StoresPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [formData, setFormData] = useState({
    storeName: '',
    storeUrl: '',
    apiKey: '',
    apiSecret: '',
    accessToken: '',
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (session && (session as any).accessToken) {
      setAuthToken((session as any).accessToken)
      loadTenants()
    }
  }, [status, session, router])

  const loadTenants = async () => {
    try {
      const response = await tenantAPI.getAll()
      if (response.data.success) {
        setTenants(response.data.data)
      }
    } catch (error: any) {
      toast.error('Failed to load stores')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const response = await tenantAPI.create(formData)
      if (response.data.success) {
        toast.success('Store added successfully!')
        setShowAddForm(false)
        setFormData({
          storeName: '',
          storeUrl: '',
          apiKey: '',
          apiSecret: '',
          accessToken: '',
        })
        loadTenants()
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to add store')
      console.error(error)
    }
  }

  const handleSync = async (tenantId: string) => {
    try {
      await tenantAPI.sync(tenantId)
      toast.success('Sync initiated')
    } catch (error: any) {
      toast.error('Failed to sync')
      console.error(error)
    }
  }

  const handleDelete = async (tenantId: string, storeName: string) => {
    if (!confirm(`Are you sure you want to delete "${storeName}"? This will permanently delete all associated data (customers, orders, products). This action cannot be undone.`)) {
      return
    }

    try {
      await tenantAPI.delete(tenantId)
      toast.success('Store deleted successfully')
      loadTenants()
    } catch (error: any) {
      toast.error(error.response?.data?.error?.message || 'Failed to delete store')
      console.error(error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-cyan-50/20">
      <nav className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-600 to-cyan-500 shadow-lg">
                  <span className="text-lg font-bold text-white">SI</span>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-cyan-600 bg-clip-text text-transparent">
                  ShopifyInsights
                </h1>
              </Link>
              <div className="hidden sm:flex sm:space-x-1">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Dashboard
                </Link>
                <Link
                  href="/dashboard/stores"
                  className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-gray-900 transition-colors hover:bg-gray-100"
                >
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Stores
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-3 rounded-lg bg-gray-100 px-3 py-2">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary-500 to-cyan-500 flex items-center justify-center">
                  <span className="text-sm font-semibold text-white">
                    {session?.user?.email?.charAt(0).toUpperCase()}
                  </span>
                </div>
                <span className="text-sm font-medium text-gray-700">{session?.user?.email}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900">Stores</h1>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="rounded-md bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            {showAddForm ? 'Cancel' : 'Add Store'}
          </button>
        </div>

        {showAddForm && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow">
            <h2 className="mb-4 text-xl font-bold text-gray-900">Add Shopify Store</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="storeName" className="block text-sm font-medium text-gray-700">
                  Store Name
                </label>
                <input
                  id="storeName"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={formData.storeName}
                  onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="storeUrl" className="block text-sm font-medium text-gray-700">
                  Store URL (e.g., your-store.myshopify.com)
                </label>
                <input
                  id="storeUrl"
                  type="text"
                  required
                  placeholder="your-store.myshopify.com"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={formData.storeUrl}
                  onChange={(e) => setFormData({ ...formData, storeUrl: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="apiKey" className="block text-sm font-medium text-gray-700">
                  API Key
                </label>
                <input
                  id="apiKey"
                  type="text"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={formData.apiKey}
                  onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="apiSecret" className="block text-sm font-medium text-gray-700">
                  API Secret
                </label>
                <input
                  id="apiSecret"
                  type="password"
                  required
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={formData.apiSecret}
                  onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                />
              </div>
              <div>
                <label htmlFor="accessToken" className="block text-sm font-medium text-gray-700">
                  Access Token (Optional)
                </label>
                <input
                  id="accessToken"
                  type="password"
                  className="mt-1 block w-full rounded-lg border border-gray-300 bg-gray-50 px-4 py-2.5 text-sm transition-all focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                  value={formData.accessToken}
                  onChange={(e) => setFormData({ ...formData, accessToken: e.target.value })}
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-r from-primary-600 to-cyan-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
              >
                Add Store
              </button>
            </form>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tenants.map((tenant) => (
            <div key={tenant.id} className="group relative overflow-hidden rounded-xl bg-white p-6 shadow-soft transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{tenant.storeName}</h3>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      tenant.isActive
                        ? 'bg-success-100 text-success-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {tenant.isActive ? '✓ Active' : 'Inactive'}
                  </span>
                </div>
                <p className="mb-4 text-sm font-medium text-gray-600">{tenant.storeUrl}</p>
                <div className="mb-4 grid grid-cols-3 gap-3 rounded-lg bg-gray-50 p-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {tenant._count.customers}
                    </div>
                    <div className="text-xs font-medium text-gray-500">Customers</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{tenant._count.orders}</div>
                    <div className="text-xs font-medium text-gray-500">Orders</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">{tenant._count.products}</div>
                    <div className="text-xs font-medium text-gray-500">Products</div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleSync(tenant.id)}
                    className="flex-1 rounded-lg bg-gradient-to-r from-primary-600 to-cyan-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
                  >
                    Sync Now
                  </button>
                  <button
                    onClick={() => handleDelete(tenant.id, tenant.storeName)}
                    className="rounded-lg bg-red-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:bg-red-600 hover:shadow-xl hover:scale-105"
                    title="Delete store"
                    aria-label="Delete store"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {tenants.length === 0 && (
          <div className="rounded-lg bg-white p-12 text-center shadow">
            <p className="text-gray-600">No stores added yet. Add your first store to get started.</p>
          </div>
        )}
      </main>
    </div>
  )
}

