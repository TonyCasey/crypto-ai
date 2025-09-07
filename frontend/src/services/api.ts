import axios, { AxiosInstance, AxiosResponse } from 'axios'
import toast from 'react-hot-toast'

interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

class ApiService {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      timeout: 30000,
      withCredentials: true,
    })

    this.setupInterceptors()
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('token')
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => {
        return Promise.reject(error)
      }
    )

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        return response
      },
      (error) => {
        if (error.response?.status === 401) {
          // Clear token and redirect to login
          localStorage.removeItem('token')
          window.location.href = '/login'
        } else if (error.response?.status >= 500) {
          toast.error('Server error. Please try again later.')
        } else if (error.response?.data?.error) {
          toast.error(error.response.data.error)
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth methods
  async login(email: string, password: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/login', { email, password })
    return response.data
  }

  async register(email: string, username: string, password: string): Promise<ApiResponse> {
    const response = await this.client.post('/auth/register', { email, username, password })
    return response.data
  }

  async logout(): Promise<void> {
    await this.client.post('/auth/logout')
    localStorage.removeItem('token')
  }

  async getMe(): Promise<ApiResponse> {
    const response = await this.client.get('/auth/me')
    return response.data
  }

  // Trading methods
  async getTradingStatus(): Promise<ApiResponse> {
    const response = await this.client.get('/trading/status')
    return response.data
  }

  async startTrading(): Promise<ApiResponse> {
    const response = await this.client.post('/trading/start')
    return response.data
  }

  async stopTrading(): Promise<ApiResponse> {
    const response = await this.client.post('/trading/stop')
    return response.data
  }

  async getOrders(params?: { symbol?: string; status?: string }): Promise<ApiResponse> {
    const response = await this.client.get('/trading/orders', { params })
    return response.data
  }

  async placeOrder(orderData: any): Promise<ApiResponse> {
    const response = await this.client.post('/trading/orders', orderData)
    return response.data
  }

  async cancelOrder(orderId: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/trading/orders/${orderId}`)
    return response.data
  }

  async getSignals(params?: { symbol?: string; strategyId?: string; limit?: number }): Promise<ApiResponse> {
    const response = await this.client.get('/trading/signals', { params })
    return response.data
  }

  async getPerformance(params?: { period?: string; strategyId?: string }): Promise<ApiResponse> {
    const response = await this.client.get('/trading/performance', { params })
    return response.data
  }

  async getMetrics(): Promise<ApiResponse> {
    const response = await this.client.get('/trading/metrics')
    return response.data
  }

  // Strategy methods
  async getStrategies(params?: { active?: boolean }): Promise<ApiResponse> {
    const response = await this.client.get('/strategies', { params })
    return response.data
  }

  async createStrategy(strategyData: any): Promise<ApiResponse> {
    const response = await this.client.post('/strategies', strategyData)
    return response.data
  }

  async updateStrategy(id: string, strategyData: any): Promise<ApiResponse> {
    const response = await this.client.put(`/strategies/${id}`, strategyData)
    return response.data
  }

  async deleteStrategy(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/strategies/${id}`)
    return response.data
  }

  async getStrategyPerformance(id: string): Promise<ApiResponse> {
    const response = await this.client.get(`/strategies/${id}/performance`)
    return response.data
  }

  // Exchange methods
  async getExchanges(): Promise<ApiResponse> {
    const response = await this.client.get('/exchanges')
    return response.data
  }

  async createExchange(exchangeData: any): Promise<ApiResponse> {
    const response = await this.client.post('/exchanges', exchangeData)
    return response.data
  }

  async updateExchange(id: string, exchangeData: any): Promise<ApiResponse> {
    const response = await this.client.put(`/exchanges/${id}`, exchangeData)
    return response.data
  }

  async deleteExchange(id: string): Promise<ApiResponse> {
    const response = await this.client.delete(`/exchanges/${id}`)
    return response.data
  }

  async testExchange(id: string): Promise<ApiResponse> {
    const response = await this.client.post(`/exchanges/${id}/test`)
    return response.data
  }

  // Portfolio methods
  async getPortfolio(): Promise<ApiResponse> {
    const response = await this.client.get('/portfolio')
    return response.data
  }

  async getPositions(): Promise<ApiResponse> {
    const response = await this.client.get('/portfolio/positions')
    return response.data
  }

  async getPortfolioHistory(): Promise<ApiResponse> {
    const response = await this.client.get('/portfolio/history')
    return response.data
  }

  // Market data methods
  async getTicker(symbol: string): Promise<ApiResponse> {
    const response = await this.client.get(`/market-data/${symbol}/ticker`)
    return response.data
  }

  async getCandles(symbol: string, params?: { timeFrame?: string; limit?: number }): Promise<ApiResponse> {
    const response = await this.client.get(`/market-data/${symbol}/candles`, { params })
    return response.data
  }

  async getSymbols(): Promise<ApiResponse> {
    const response = await this.client.get('/market-data/symbols')
    return response.data
  }
}

export const apiService = new ApiService()
export default apiService