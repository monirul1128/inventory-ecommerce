import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'

async function getDashboardData() {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
  const res = await fetch(`${baseUrl}/api/dashboard`, { cache: 'no-store' })
  if (!res.ok) return null
  return res.json()
}

export default async function DashboardPage() {
  const data = await getDashboardData()

  const kpis = [
    { label: 'আজকের বিক্রি', value: formatCurrency(data?.todayRevenue ?? 0), icon: '💰', color: 'text-green-600' },
    { label: 'আজকের লাভ', value: formatCurrency(data?.todayProfit ?? 0), icon: '📈', color: data?.todayProfit >= 0 ? 'text-blue-600' : 'text-red-600' },
    { label: 'মোট পণ্য', value: data?.totalProducts ?? 0, icon: '📦', color: 'text-amber-600' },
    { label: 'কম স্টক', value: data?.lowStockCount ?? 0, icon: '⚠️', color: 'text-orange-600' },
    { label: 'পেন্ডিং অর্ডার', value: data?.pendingOrdersCount ?? 0, icon: '🛍️', color: 'text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-amber-900">ড্যাশবোর্ড</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardHeader className="pb-1">
              <CardTitle className="text-xs text-gray-500">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{kpi.icon}</span>
                <span className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>⚠️</span> কম স্টক সতর্কতা
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.lowStockCount === 0 ? (
              <p className="text-gray-400 text-sm">সব পণ্যের পর্যাপ্ত স্টক আছে।</p>
            ) : (
              <p className="text-orange-600 font-medium">
                {data?.lowStockCount} টি পণ্যের স্টক কম!{' '}
                <a href="/admin/stock/low-alerts" className="underline text-amber-700 text-sm">বিস্তারিত দেখুন →</a>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Top Products Today */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>🏆</span> আজকের সেরা পণ্য
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.topProductsToday?.length ? (
              <p className="text-gray-400 text-sm">আজ কোনো বিক্রি নেই।</p>
            ) : (
              <div className="space-y-1">
                {data.topProductsToday.map((item: { product: { name: string }; qty: number; revenue: number }, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="text-gray-700">{item.product?.name}</span>
                    <div className="flex gap-2">
                      <Badge variant="secondary">{item.qty} টি</Badge>
                      <span className="text-green-600 font-medium">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span>📋 সাম্প্রতিক বিক্রয়</span>
            <a href="/admin/sales/history" className="text-xs text-amber-700 hover:underline">সব দেখুন →</a>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.recentSales?.length ? (
            <p className="text-gray-400 text-sm">আজ কোনো বিক্রি নেই।</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2 font-medium">চালান নং</th>
                    <th className="text-left py-2 font-medium">কাস্টমার</th>
                    <th className="text-left py-2 font-medium">মোট</th>
                    <th className="text-left py-2 font-medium">পেমেন্ট</th>
                    <th className="text-left py-2 font-medium">তারিখ</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentSales.map((sale: {
                    id: string
                    invoiceNo: string
                    customer?: { name: string }
                    total: number
                    paymentMethod: string
                    date: string
                  }) => (
                    <tr key={sale.id} className="border-b hover:bg-gray-50">
                      <td className="py-2">
                        <a href={`/admin/invoices/${sale.id}`} className="text-amber-700 hover:underline font-mono">
                          {sale.invoiceNo}
                        </a>
                      </td>
                      <td className="py-2">{sale.customer?.name || '—'}</td>
                      <td className="py-2 font-medium text-green-600">{formatCurrency(sale.total)}</td>
                      <td className="py-2">
                        <Badge variant={sale.paymentMethod === 'CREDIT' ? 'destructive' : 'default'}>
                          {sale.paymentMethod}
                        </Badge>
                      </td>
                      <td className="py-2 text-gray-500">{formatDate(sale.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
