import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'

export function DashboardPage() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['trading-metrics'],
    queryFn: () => apiService.getMetrics(),
  })

  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => apiService.getPortfolio(),
  })

  const { data: recentSignals, isLoading: signalsLoading } = useQuery({
    queryKey: ['recent-signals'],
    queryFn: () => apiService.getSignals({ limit: 5 }),
  })

  if (metricsLoading || portfolioLoading || signalsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600">Overview of your trading performance</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="metric-card">
          <div className="metric-card-content">
            <div className="metric-card-stats">
              <div className="metric-card-stat">
                <p className="metric-card-value">${portfolio?.data?.totalValue?.toLocaleString() || '0'}</p>
                <p className="metric-card-label">Total Portfolio Value</p>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-content">
            <div className="metric-card-stats">
              <div className="metric-card-stat">
                <p className="metric-card-value">{metrics?.data?.totalSignals || 0}</p>
                <p className="metric-card-label">Total Signals</p>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-content">
            <div className="metric-card-stats">
              <div className="metric-card-stat">
                <p className="metric-card-value">{metrics?.data?.executedTrades || 0}</p>
                <p className="metric-card-label">Executed Trades</p>
              </div>
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-card-content">
            <div className="metric-card-stats">
              <div className="metric-card-stat">
                <p className="metric-card-value">{metrics?.data?.successRate?.toFixed(1) || 0}%</p>
                <p className="metric-card-label">Success Rate</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Signals */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Recent Trading Signals</h3>
          </div>
          <div className="card-content">
            {recentSignals?.data?.length > 0 ? (
              <div className="space-y-4">
                {recentSignals.data.slice(0, 5).map((signal: any, index: number) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium">{signal.symbol}</p>
                      <p className="text-sm text-gray-500">
                        {signal.side.toUpperCase()} • {signal.confidence.value}% confidence
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-900">{signal.reason}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(signal.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No recent signals</p>
            )}
          </div>
        </div>

        {/* Portfolio Summary */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium">Portfolio Summary</h3>
          </div>
          <div className="card-content">
            {portfolio?.data?.balances?.length > 0 ? (
              <div className="space-y-4">
                {portfolio.data.balances.map((balance: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{balance.currency}</p>
                      <p className="text-sm text-gray-500">Available</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{parseFloat(balance.total).toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{parseFloat(balance.available).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No balances found</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}