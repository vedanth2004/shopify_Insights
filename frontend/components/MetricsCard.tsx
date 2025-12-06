interface MetricsCardProps {
  title: string
  value: string
  icon: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export default function MetricsCard({ title, value, icon, trend }: MetricsCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-xl bg-white shadow-soft transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50/50 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      <div className="relative p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
            {trend && (
              <div className="mt-2 flex items-center">
                <span className={`text-sm font-medium ${
                  trend.isPositive ? 'text-success-600' : 'text-red-600'
                }`}>
                  {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
                </span>
                <span className="ml-2 text-xs text-gray-500">vs last period</span>
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-cyan-500 shadow-lg">
              <span className="text-2xl">{icon}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

