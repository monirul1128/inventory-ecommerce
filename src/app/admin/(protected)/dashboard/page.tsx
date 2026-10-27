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
    { label: 'আজকের বিক্রি', value: formatCurrency(data?.todayRevenue ?? 0), icon: '💰', color: 'text-green-600', subtitle: `${data?.todaySalesCount ?? 0} টি বিক্রয়` },
    { label: 'আজকের লাভ', value: formatCurrency(data?.todayProfit ?? 0), icon: '📈', color: data?.todayProfit >= 0 ? 'text-blue-600' : 'text-red-600', subtitle: 'আজকের মোট লাভ' },
    { label: 'মোট পণ্য', value: data?.totalProducts ?? 0, icon: '📦', color: 'text-amber-600', subtitle: 'স্টকে পণ্য' },
    { label: 'কম স্টক', value: data?.lowStockCount ?? 0, icon: '⚠️', color: 'text-orange-600', subtitle: 'সতর্কতা প্রয়োজন' },
    { label: 'পেন্ডিং অর্ডার', value: data?.pendingOrdersCount ?? 0, icon: '🛍️', color: 'text-purple-600', subtitle: 'প্রসেস করা বাকি' },
  ]

  const stats = [
    { label: 'মোট ক্যাটাগরি', value: data?.totalCategories ?? 0, icon: '🏷️' },
    { label: 'মোট সাপ্লায়ার', value: data?.totalSuppliers ?? 0, icon: '🏭' },
    { label: 'মোট কাস্টমার', value: data?.totalCustomers ?? 0, icon: '👥' },
    { label: 'মোট বিক্রয়', value: data?.totalSales ?? 0, icon: '💳' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-amber-900">ড্যাশবোর্ড</h1>
        <div className="text-sm text-gray-500">
          শেষ আপডেট: {new Date().toLocaleString('bn-BD')}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs text-gray-500">{kpi.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl">{kpi.icon}</span>
                <span className={`text-xl font-bold ${kpi.color}`}>{kpi.value}</span>
              </div>
              <p className="text-xs text-gray-400">{kpi.subtitle}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-100">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">{stat.icon}</span>
              <span className="text-2xl font-bold text-amber-900">{stat.value}</span>
            </div>
            <p className="text-xs text-gray-600">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>⚠️</span> কম স্টক সতর্কতা
              </span>
              <Badge variant={data?.lowStockCount > 0 ? 'destructive' : 'secondary'}>
                {data?.lowStockCount ?? 0} টি
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data?.lowStockCount === 0 ? (
              <div className="text-center py-4">
                <p className="text-green-600 font-medium mb-1">✅ সব পণ্যের পর্যাপ্ত স্টক আছে</p>
                <p className="text-xs text-gray-400">কোনো সতর্কতা নেই</p>
              </div>
            ) : (
              <div>
                <p className="text-orange-600 font-medium mb-2">
                  {data?.lowStockCount} টি পণ্যের স্টক কম!
                </p>
                <a href="/admin/stock/low-alerts" className="text-sm text-amber-700 hover:underline flex items-center gap-1">
                  বিস্তারিত দেখুন →
                </a>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>💵</span> আজকের আয়-ব্যয়
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                <span className="text-sm text-gray-600">মোট বিক্রয়</span>
                <span className="font-bold text-green-600">{formatCurrency(data?.todayRevenue ?? 0)}</span>
              </div>
              <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                <span className="text-sm text-gray-600">মোট লাভ</span>
                <span className={`font-bold ${data?.todayProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  {formatCurrency(data?.todayProfit ?? 0)}
                </span>
              </div>
              <div className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span className="text-sm text-gray-600">বিক্রয় সংখ্যা</span>
                <span className="font-bold text-gray-700">{data?.todaySalesCount ?? 0} টি</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Top Products Today */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <span>🏆</span> আজকের সেরা পণ্য
              </span>
              {data?.topProductsToday?.length > 0 && (
                <Badge variant="secondary">{data.topProductsToday.length} টি</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!data?.topProductsToday?.length ? (
              <div className="text-center py-4">
                <p className="text-gray-400 text-sm mb-1">📭 আজ কোনো বিক্রি নেই</p>
                <p className="text-xs text-gray-400">প্রথম বিক্রি যোগ করুন</p>
              </div>
            ) : (
              <div className="space-y-2">
                {data.topProductsToday.map((item: { product: { name: string }; qty: number; revenue: number }, i: number) => (
                  <div key={i} className="flex justify-between items-center p-2 hover:bg-amber-50 rounded transition-colors">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '🔹'}</span>
                      <span className="text-sm text-gray-700 font-medium">{item.product?.name}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <Badge variant="secondary" className="text-xs">{item.qty} টি</Badge>
                      <span className="text-green-600 font-bold text-sm">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <span>⚡</span> দ্রুত অ্যাকশন
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              <a href="/admin/sales/pos" className="p-3 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors border border-green-200">
                <div className="text-2xl mb-1">🛒</div>
                <div className="text-xs font-medium text-green-700">নতুন বিক্রয়</div>
              </a>
              <a href="/admin/products/add" className="p-3 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors border border-blue-200">
                <div className="text-2xl mb-1">📦</div>
                <div className="text-xs font-medium text-blue-700">পণ্য যোগ</div>
              </a>
              <a href="/admin/purchases/add" className="p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors border border-purple-200">
                <div className="text-2xl mb-1">🏭</div>
                <div className="text-xs font-medium text-purple-700">ক্রয় যোগ</div>
              </a>
              <a href="/admin/reports" className="p-3 bg-amber-50 hover:bg-amber-100 rounded-lg text-center transition-colors border border-amber-200">
                <div className="text-2xl mb-1">📊</div>
                <div className="text-xs font-medium text-amber-700">রিপোর্ট</div>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span>📋</span> সাম্প্রতিক বিক্রয়
            </span>
            <div className="flex gap-2">
              {data?.recentSales?.length > 0 && (
                <Badge variant="secondary">{data.recentSales.length} টি</Badge>
              )}
              <a href="/admin/sales/history" className="text-xs text-amber-700 hover:underline">সব দেখুন →</a>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!data?.recentSales?.length ? (
            <div className="text-center py-8">
              <p className="text-gray-400 mb-2">📭 আজ কোনো বিক্রি নেই</p>
              <a href="/admin/sales/pos" className="inline-block px-4 py-2 bg-amber-900 text-white rounded-lg text-sm hover:bg-amber-800">
                প্রথম বিক্রয় যোগ করুন →
              </a>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-gray-500">
                    <th className="text-left py-2 font-medium">চালান নং</th>
                    <th className="text-left py-2 font-medium">কাস্টমার</th>
                    <th className="text-right py-2 font-medium">মোট</th>
                    <th className="text-center py-2 font-medium">পেমেন্ট</th>
                    <th className="text-right py-2 font-medium">তারিখ</th>
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
                    <tr key={sale.id} className="border-b hover:bg-amber-50 transition-colors">
                      <td className="py-3">
                        <a href={`/admin/invoices/${sale.id}`} className="text-amber-700 hover:underline font-mono text-xs">
                          {sale.invoiceNo}
                        </a>
                      </td>
                      <td className="py-3">{sale.customer?.name || '—'}</td>
                      <td className="py-3 font-bold text-green-600 text-right">{formatCurrency(sale.total)}</td>
                      <td className="py-3 text-center">
                        <Badge variant={sale.paymentMethod === 'CREDIT' ? 'destructive' : 'default'} className="text-xs">
                          {sale.paymentMethod}
                        </Badge>
                      </td>
                      <td className="py-3 text-gray-500 text-xs text-right">{formatDate(sale.date)}</td>
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
