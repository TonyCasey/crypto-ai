import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';

const router: Router = Router();

// Get market data (public endpoint)
router.get('/:symbol/ticker', [
  query('exchange').optional().isIn(['coinbase_pro', 'simulator']),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { symbol } = req.params;
    const { exchange = 'simulator' } = req.query;

    // Mock ticker data - in production, this would fetch from actual exchanges
    const mockTicker = {
      symbol,
      price: { value: (Math.random() * 50000 + 40000).toFixed(2), currency: 'USD' },
      bidPrice: { value: (Math.random() * 50000 + 39900).toFixed(2), currency: 'USD' },
      askPrice: { value: (Math.random() * 50000 + 40100).toFixed(2), currency: 'USD' },
      volume24h: { value: (Math.random() * 10000).toFixed(2), currency: symbol!.split('-')[0] },
      change24h: { value: (Math.random() - 0.5) * 10 },
      high24h: { value: (Math.random() * 52000 + 40000).toFixed(2), currency: 'USD' },
      low24h: { value: (Math.random() * 48000 + 38000).toFixed(2), currency: 'USD' },
      timestamp: new Date(),
    };

    return res.json({
      success: true,
      data: mockTicker,
    });
  } catch (error) {
    console.error('Get ticker error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get ticker data',
    });
  }
});

// Get candle data
router.get('/:symbol/candles', [
  query('timeFrame').optional().isIn(['1m', '5m', '15m', '1h', '4h', '1d']),
  query('limit').optional().isInt({ min: 1, max: 200 }),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { symbol } = req.params;
    const { timeFrame = '1h', limit = 100 } = req.query;

    // Generate mock candle data
    const now = new Date();
    const candles = Array.from({ length: parseInt(limit as string) }, (_, i) => {
      const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000)); // 1 hour intervals
      const basePrice = 45000 + Math.random() * 10000;
      const open = basePrice + (Math.random() - 0.5) * 1000;
      const close = open + (Math.random() - 0.5) * 500;
      const high = Math.max(open, close) + Math.random() * 200;
      const low = Math.min(open, close) - Math.random() * 200;

      return {
        timestamp,
        open: { value: open.toFixed(2), currency: 'USD' },
        high: { value: high.toFixed(2), currency: 'USD' },
        low: { value: low.toFixed(2), currency: 'USD' },
        close: { value: close.toFixed(2), currency: 'USD' },
        volume: { value: (Math.random() * 100).toFixed(2), currency: symbol!.split('-')[0] },
        timeFrame,
      };
    }).reverse();

    return res.json({
      success: true,
      data: {
        symbol,
        timeFrame,
        candles,
        timestamp: new Date(),
      },
    });
  } catch (error) {
    console.error('Get candles error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get candle data',
    });
  }
});

// Get supported symbols
router.get('/symbols', async (req: Request, res: Response) => {
  try {
    const symbols = [
      {
        symbol: 'BTC-USD',
        baseCurrency: 'BTC',
        quoteCurrency: 'USD',
        isActive: true,
      },
      {
        symbol: 'ETH-USD',
        baseCurrency: 'ETH',
        quoteCurrency: 'USD',
        isActive: true,
      },
      {
        symbol: 'ADA-USD',
        baseCurrency: 'ADA',
        quoteCurrency: 'USD',
        isActive: true,
      },
    ];

    return res.json({
      success: true,
      data: symbols,
    });
  } catch (error) {
    console.error('Get symbols error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get symbols',
    });
  }
});

export default router;