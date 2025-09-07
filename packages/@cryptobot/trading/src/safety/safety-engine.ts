import { TradingSignal, Order, SafetyCheckType } from '@cryptobot/types';

export interface SafetyCheck {
  type: SafetyCheckType;
  isValid: boolean;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface SafetyValidationContext {
  activeOrders: Order[];
  dailyTrades: number;
  maxDailyTrades: number;
  portfolioValue?: number;
  currentDrawdown?: number;
}

export interface SafetyValidationResult {
  isValid: boolean;
  checks: SafetyCheck[];
  reasons: string[];
}

export class SafetyEngine {
  private readonly maxPositionSize: number = 0.1; // 10% of portfolio
  private readonly maxDailyLoss: number = 0.05; // 5% daily loss limit
  private readonly maxDrawdown: number = 0.2; // 20% max drawdown
  private readonly minLiquidity: number = 1000; // Minimum daily volume in USD
  private readonly maxCorrelation: number = 0.8; // Maximum correlation between positions

  async validateSignal(
    signal: TradingSignal,
    context: SafetyValidationContext
  ): Promise<SafetyValidationResult> {
    const checks: SafetyCheck[] = [];

    // Perform all safety checks
    checks.push(this.checkPositionSize(signal, context));
    checks.push(this.checkDailyTradeLimit(context));
    checks.push(this.checkDrawdownLimit(context));
    checks.push(this.checkSignalConfidence(signal));
    checks.push(this.checkOrderConflicts(signal, context));

    // Determine overall validity
    const criticalFailures = checks.filter(check => !check.isValid && check.severity === 'critical');
    const highSeverityFailures = checks.filter(check => !check.isValid && check.severity === 'high');

    const isValid = criticalFailures.length === 0 && highSeverityFailures.length === 0;
    const reasons = checks
      .filter(check => !check.isValid)
      .map(check => check.message);

    return {
      isValid,
      checks,
      reasons,
    };
  }

  private checkPositionSize(signal: TradingSignal, context: SafetyValidationContext): SafetyCheck {
    // This is a simplified check - in reality, you'd calculate based on actual portfolio value
    const portfolioValue = context.portfolioValue || 10000; // Default for demo
    
    // Extract position size from signal (this would need to be calculated properly)
    const estimatedOrderValue = 1000; // Simplified - would calculate from signal
    const positionSizeRatio = estimatedOrderValue / portfolioValue;

    const isValid = positionSizeRatio <= this.maxPositionSize;
    
    return {
      type: SafetyCheckType.POSITION_SIZE,
      isValid,
      message: isValid 
        ? `Position size ${(positionSizeRatio * 100).toFixed(2)}% within limit` 
        : `Position size ${(positionSizeRatio * 100).toFixed(2)}% exceeds maximum ${this.maxPositionSize * 100}%`,
      severity: isValid ? 'low' : 'high',
    };
  }

  private checkDailyTradeLimit(context: SafetyValidationContext): SafetyCheck {
    const isValid = context.dailyTrades < context.maxDailyTrades;
    
    return {
      type: SafetyCheckType.DAILY_LOSS_LIMIT,
      isValid,
      message: isValid 
        ? `Daily trades ${context.dailyTrades}/${context.maxDailyTrades} within limit` 
        : `Daily trade limit exceeded: ${context.dailyTrades}/${context.maxDailyTrades}`,
      severity: isValid ? 'low' : 'medium',
    };
  }

  private checkDrawdownLimit(context: SafetyValidationContext): SafetyCheck {
    const currentDrawdown = context.currentDrawdown || 0;
    const isValid = currentDrawdown <= this.maxDrawdown;
    
    return {
      type: SafetyCheckType.DRAWDOWN_LIMIT,
      isValid,
      message: isValid 
        ? `Drawdown ${(currentDrawdown * 100).toFixed(2)}% within limit` 
        : `Drawdown ${(currentDrawdown * 100).toFixed(2)}% exceeds maximum ${this.maxDrawdown * 100}%`,
      severity: isValid ? 'low' : 'critical',
    };
  }

  private checkSignalConfidence(signal: TradingSignal): SafetyCheck {
    const minConfidence = 60; // Minimum confidence threshold
    const isValid = signal.confidence.value >= minConfidence;
    
    return {
      type: SafetyCheckType.VOLATILITY_CHECK, // Using this as a proxy for signal quality
      isValid,
      message: isValid 
        ? `Signal confidence ${signal.confidence.value}% acceptable` 
        : `Signal confidence ${signal.confidence.value}% below minimum ${minConfidence}%`,
      severity: isValid ? 'low' : 'medium',
    };
  }

  private checkOrderConflicts(signal: TradingSignal, context: SafetyValidationContext): SafetyCheck {
    // Check for conflicting orders on the same symbol
    const conflictingOrders = context.activeOrders.filter(order => 
      order.symbol === signal.symbol && 
      order.status === 'open' &&
      order.side !== signal.side
    );

    const isValid = conflictingOrders.length === 0;
    
    return {
      type: SafetyCheckType.CORRELATION_CHECK,
      isValid,
      message: isValid 
        ? `No conflicting orders found for ${signal.symbol}` 
        : `Found ${conflictingOrders.length} conflicting orders for ${signal.symbol}`,
      severity: isValid ? 'low' : 'high',
    };
  }

  // Emergency stop methods
  async emergencyStop(): Promise<void> {
    // This would trigger emergency procedures
    console.log('Emergency stop triggered!');
    // In a real implementation, this would:
    // 1. Cancel all open orders
    // 2. Close all positions
    // 3. Send alerts
    // 4. Log the emergency event
  }

  async checkVolatility(symbol: string, threshold: number = 0.05): Promise<boolean> {
    // Simplified volatility check
    // In reality, this would analyze recent price movements
    const randomVolatility = Math.random() * 0.1; // Simulated volatility
    return randomVolatility <= threshold;
  }

  async checkLiquidity(symbol: string): Promise<boolean> {
    // Simplified liquidity check
    // In reality, this would check order book depth and recent volume
    const simulatedVolume = Math.random() * 10000; // Simulated daily volume
    return simulatedVolume >= this.minLiquidity;
  }

  async checkMarketHours(): Promise<boolean> {
    // Crypto markets are 24/7, but you might want to avoid trading during low liquidity periods
    const hour = new Date().getHours();
    // Avoid trading during typically low liquidity hours (example)
    return !(hour >= 2 && hour <= 6); // Avoid 2 AM - 6 AM UTC
  }

  // Risk scoring
  calculateRiskScore(signal: TradingSignal, context: SafetyValidationContext): number {
    let riskScore = 0;

    // Base risk from signal strength (inverse relationship)
    riskScore += (1 - signal.strength) * 30;

    // Risk from confidence (inverse relationship)
    riskScore += (100 - signal.confidence.value) * 0.5;

    // Risk from active positions
    riskScore += context.activeOrders.length * 5;

    // Risk from drawdown
    if (context.currentDrawdown) {
      riskScore += context.currentDrawdown * 100;
    }

    return Math.min(100, Math.max(0, riskScore));
  }

  // Utility methods for position sizing based on risk
  calculateSafePositionSize(
    portfolioValue: number,
    riskPerTrade: number,
    stopLossDistance: number
  ): number {
    if (stopLossDistance <= 0) return 0;
    
    const riskAmount = portfolioValue * (riskPerTrade / 100);
    return riskAmount / stopLossDistance;
  }

  // Kelly Criterion for position sizing
  calculateKellyPositionSize(winRate: number, averageWin: number, averageLoss: number): number {
    if (averageLoss <= 0) return 0;
    
    const b = averageWin / averageLoss; // Payoff ratio
    const p = winRate / 100; // Win probability
    const q = 1 - p; // Loss probability
    
    const kellyPercent = (b * p - q) / b;
    
    // Cap at 25% for safety
    return Math.max(0, Math.min(0.25, kellyPercent));
  }
}