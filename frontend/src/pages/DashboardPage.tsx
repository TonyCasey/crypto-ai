import { useQuery } from '@tanstack/react-query'
import { apiService } from '@/services/api'
import { LoadingSpinner } from '@/components/LoadingSpinner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Activity, 
  Target, 
  BarChart3,
  Clock,
  CheckCircle
} from 'lucide-react'

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

  const successRate = metrics?.data?.successRate || 0
  const totalValue = portfolio?.data?.totalValue || 0

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Overview of your trading performance and portfolio status
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Portfolio Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +2.5% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Signals</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.data?.totalSignals || 0}</div>
            <p className="text-xs text-muted-foreground">
              +12 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Executed Trades</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.data?.executedTrades || 0}</div>
            <p className="text-xs text-muted-foreground">
              +3 from yesterday
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{successRate.toFixed(1)}%</div>
            <Progress value={successRate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Trading Signals */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Trading Signals
            </CardTitle>
            <CardDescription>
              Latest AI-generated trading signals and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentSignals?.data?.length > 0 ? (
              recentSignals.data.slice(0, 5).map((signal: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-full ${
                      signal.side === 'buy' ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}>
                      {signal.side === 'buy' ? 
                        <TrendingUp className="h-4 w-4" /> : 
                        <TrendingDown className="h-4 w-4" />
                      }
                    </div>
                    <div>
                      <p className="font-medium">{signal.symbol}</p>
                      <p className="text-sm text-muted-foreground">
                        {signal.side.toUpperCase()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge variant={signal.confidence?.value > 75 ? "default" : "secondary"}>
                      {signal.confidence?.value}% confidence
                    </Badge>
                    <p className="text-xs text-muted-foreground flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No recent signals</p>
                <p className="text-sm">AI analysis will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio Summary */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Portfolio Summary
            </CardTitle>
            <CardDescription>
              Current balances and asset distribution
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {portfolio?.data?.balances?.length > 0 ? (
              portfolio.data.balances.map((balance: any, index: number) => (
                <div key={index}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">
                          {balance.currency.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{balance.currency}</p>
                        <p className="text-sm text-muted-foreground">Available</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{parseFloat(balance.total).toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        {parseFloat(balance.available).toLocaleString()} available
                      </p>
                    </div>
                  </div>
                  {index < portfolio.data.balances.length - 1 && <Separator className="mt-4" />}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No balances found</p>
                <p className="text-sm">Connect an exchange to see your portfolio</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Quick Actions
          </CardTitle>
          <CardDescription>
            Common tasks and shortcuts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-blue-500/10">
                  <Activity className="h-4 w-4 text-blue-500" />
                </div>
                <div>
                  <p className="font-medium">Start Trading</p>
                  <p className="text-sm text-muted-foreground">Enable automated trading</p>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-green-500/10">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <p className="font-medium">View Analytics</p>
                  <p className="text-sm text-muted-foreground">Detailed performance metrics</p>
                </div>
              </div>
            </div>
            <div className="p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-center space-x-3">
                <div className="p-2 rounded-full bg-purple-500/10">
                  <Target className="h-4 w-4 text-purple-500" />
                </div>
                <div>
                  <p className="font-medium">Manage Strategies</p>
                  <p className="text-sm text-muted-foreground">Configure trading strategies</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}