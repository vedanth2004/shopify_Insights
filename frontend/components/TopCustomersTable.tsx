interface Customer {
  id: string
  email: string | null
  firstName?: string | null
  lastName?: string | null
  totalSpent: number
  ordersCount: number
}

interface TopCustomersTableProps {
  customers: Customer[]
}

export default function TopCustomersTable({ customers }: TopCustomersTableProps) {
  if (customers.length === 0) {
    return <p className="text-gray-500">No customer data available</p>
  }

  const getCustomerDisplayName = (customer: Customer): string => {
    // Try to get full name first
    const fullName = [customer.firstName, customer.lastName]
      .filter(Boolean)
      .join(' ')
      .trim()
    
    if (fullName) {
      return fullName
    }
    
    // Fall back to email if available
    if (customer.email) {
      return customer.email
    }
    
    // Last resort: show customer ID
    return `Customer #${customer.id.slice(-8)}`
  }

  const getCustomerSubtext = (customer: Customer): string | null => {
    // If we have a name, show email as subtext
    if ((customer.firstName || customer.lastName) && customer.email) {
      return customer.email
    }
    
    // If we only have email, don't show subtext (email is already the main text)
    if (customer.email && !customer.firstName && !customer.lastName) {
      return null
    }
    
    // If we have neither name nor email, show a helpful message
    if (!customer.email && !customer.firstName && !customer.lastName) {
      return 'Limited info (Basic plan restriction)'
    }
    
    return null
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gradient-to-r from-gray-50 to-gray-100/50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              Customer
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              Orders
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
              Total Spent
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {customers.map((customer, index) => {
            const displayName = getCustomerDisplayName(customer)
            const subtext = getCustomerSubtext(customer)
            
            return (
              <tr key={customer.id} className="transition-colors hover:bg-gray-50/50">
                <td className="whitespace-nowrap px-4 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-cyan-100 text-xs font-semibold text-primary-700">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">
                        {displayName}
                      </div>
                      {subtext && (
                        <div className="text-xs text-gray-500 mt-0.5">{subtext}</div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-4">
                  <span className="inline-flex items-center rounded-full bg-primary-100 px-2.5 py-0.5 text-sm font-medium text-primary-800">
                    {customer.ordersCount}
                  </span>
                </td>
                <td className="whitespace-nowrap px-4 py-4 text-sm font-bold text-gray-900">
                  ${customer.totalSpent.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

