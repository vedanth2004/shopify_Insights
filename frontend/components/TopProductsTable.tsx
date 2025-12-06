interface Product {
  id: string
  title: string
  totalSales: number
  totalRevenue: number
}

interface TopProductsTableProps {
  products: Product[]
}

export default function TopProductsTable({ products }: TopProductsTableProps) {
  if (products.length === 0) {
    return <p className="text-gray-500">No product data available</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              Product
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              Sales
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              Revenue
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {products.map((product, index) => (
            <tr key={product.id} className="transition-colors hover:bg-gray-50/50">
              <td className="px-4 py-4">
                <div className="flex items-center space-x-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-success-100 to-teal-100 text-xs font-semibold text-success-700">
                    {index + 1}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{product.title}</span>
                </div>
              </td>
              <td className="whitespace-nowrap px-4 py-4">
                <span className="inline-flex items-center rounded-full bg-success-100 px-2.5 py-0.5 text-sm font-medium text-success-800">
                  {product.totalSales}
                </span>
              </td>
              <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-gray-900">
                ${product.totalRevenue.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

