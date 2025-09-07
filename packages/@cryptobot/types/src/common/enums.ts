export enum OrderSide {
  BUY = 'buy',
  SELL = 'sell',
}

export enum OrderType {
  MARKET = 'market',
  LIMIT = 'limit',
  STOP = 'stop',
  STOP_LIMIT = 'stop_limit',
}

export enum OrderStatus {
  PENDING = 'pending',
  OPEN = 'open',
  FILLED = 'filled',
  CANCELLED = 'cancelled',
  REJECTED = 'rejected',
  EXPIRED = 'expired',
}

export enum TimeFrame {
  MINUTE_1 = '1m',
  MINUTE_5 = '5m',
  MINUTE_15 = '15m',
  MINUTE_30 = '30m',
  HOUR_1 = '1h',
  HOUR_4 = '4h',
  HOUR_12 = '12h',
  DAY_1 = '1d',
  WEEK_1 = '1w',
  MONTH_1 = '1M',
}

export enum TradingPairStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  DELISTED = 'delisted',
}

export enum IndicatorType {
  SMA = 'SMA',
  EMA = 'EMA',
  RSI = 'RSI',
  MACD = 'MACD',
  BOLLINGER_BANDS = 'BOLLINGER_BANDS',
  STOCHASTIC = 'STOCHASTIC',
  WILLIAMS_R = 'WILLIAMS_R',
  ATR = 'ATR',
  VOLUME = 'VOLUME',
}

export enum TradingStrategyType {
  SIMPLE_MOVING_AVERAGE = 'SIMPLE_MOVING_AVERAGE',
  RSI_OVERSOLD_OVERBOUGHT = 'RSI_OVERSOLD_OVERBOUGHT',
  MACD_CROSSOVER = 'MACD_CROSSOVER',
  BOLLINGER_BANDS_SQUEEZE = 'BOLLINGER_BANDS_SQUEEZE',
  MEAN_REVERSION = 'MEAN_REVERSION',
  MOMENTUM = 'MOMENTUM',
  CUSTOM = 'CUSTOM',
}

export enum ExchangeType {
  COINBASE_PRO = 'coinbase_pro',
  BITTREX = 'bittrex',
  BINANCE = 'binance',
  KRAKEN = 'kraken',
  SIMULATOR = 'simulator',
}

export enum SafetyCheckType {
  POSITION_SIZE = 'POSITION_SIZE',
  DAILY_LOSS_LIMIT = 'DAILY_LOSS_LIMIT',
  DRAWDOWN_LIMIT = 'DRAWDOWN_LIMIT',
  CORRELATION_CHECK = 'CORRELATION_CHECK',
  VOLATILITY_CHECK = 'VOLATILITY_CHECK',
  LIQUIDITY_CHECK = 'LIQUIDITY_CHECK',
}