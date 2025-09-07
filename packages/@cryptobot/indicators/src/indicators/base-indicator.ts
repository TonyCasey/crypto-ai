import { IndicatorType, TimeFrame } from '@cryptobot/types';

export interface IndicatorInput {
  timestamp: Date;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface IndicatorResult {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export abstract class BaseIndicator {
  protected readonly type: IndicatorType;
  protected readonly symbol: string;
  protected readonly timeFrame: TimeFrame;
  protected readonly parameters: Record<string, any>;
  protected results: IndicatorResult[] = [];

  constructor(
    type: IndicatorType,
    symbol: string,
    timeFrame: TimeFrame,
    parameters: Record<string, any> = {}
  ) {
    this.type = type;
    this.symbol = symbol;
    this.timeFrame = timeFrame;
    this.parameters = parameters;
  }

  abstract calculate(inputs: IndicatorInput[]): IndicatorResult[];

  getType(): IndicatorType {
    return this.type;
  }

  getSymbol(): string {
    return this.symbol;
  }

  getTimeFrame(): TimeFrame {
    return this.timeFrame;
  }

  getParameters(): Record<string, any> {
    return { ...this.parameters };
  }

  getResults(): IndicatorResult[] {
    return [...this.results];
  }

  getLatestResult(): IndicatorResult | null {
    return this.results.length > 0 ? this.results[this.results.length - 1] : null;
  }

  protected validateInputs(inputs: IndicatorInput[], minLength: number = 1): void {
    if (!inputs || inputs.length < minLength) {
      throw new Error(`Insufficient data: need at least ${minLength} data points`);
    }
  }

  protected createResult(timestamp: Date, value: number, metadata?: Record<string, any>): IndicatorResult {
    return {
      timestamp,
      value,
      metadata,
    };
  }
}