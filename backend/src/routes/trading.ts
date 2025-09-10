import { Router, Request, Response } from 'express';
import { body, query, validationResult } from 'express-validator';
import { AuthenticatedRequest } from '../middleware/auth-middleware';
import { TradingService } from '../services/trading-service';

const router: Router = Router();
let tradingService: TradingService;

// Initialize trading service
const initializeTradingService = () => {
  if (!tradingService) {
    tradingService = new TradingService();
  }
  return tradingService;
};

// Get trading status
router.get('/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = initializeTradingService();
    const status = await service.getStatus();

    return res.json({
      success: true,
      data: status,
    });
  } catch (error) {
    console.error('Get trading status error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get trading status',
    });
  }
});

// Start trading
router.post('/start', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = initializeTradingService();
    await service.start();

    return res.json({
      success: true,
      message: 'Trading started successfully',
    });
  } catch (error) {
    console.error('Start trading error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to start trading',
    });
  }
});

// Stop trading
router.post('/stop', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = initializeTradingService();
    await service.stop();

    return res.json({
      success: true,
      message: 'Trading stopped successfully',
    });
  } catch (error) {
    console.error('Stop trading error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to stop trading',
    });
  }
});

// Get active orders
router.get('/orders', [
  query('symbol').optional().isString(),
  query('status').optional().isIn(['pending', 'open', 'filled', 'cancelled', 'rejected', 'expired']),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const service = initializeTradingService();
    const { symbol, status } = req.query;

    const orders = await service.getOrders({
      userId: req.user!.id,
      symbol: symbol as string,
      status: status as any,
    });

    return res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get orders',
    });
  }
});

// Place manual order
router.post('/orders', [
  body('symbol').isString().notEmpty(),
  body('side').isIn(['buy', 'sell']),
  body('type').isIn(['market', 'limit', 'stop', 'stop_limit']),
  body('size').isNumeric(),
  body('price').optional().isNumeric(),
  body('exchangeType').isIn(['coinbase_pro', 'bittrex', 'binance', 'kraken', 'simulator']),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const service = initializeTradingService();
    const orderRequest = {
      ...req.body,
      userId: req.user!.id,
    };

    const result = await service.placeManualOrder(orderRequest);

    if (result.success) {
      return res.status(201).json({
        success: true,
        data: result.data,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Place order error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to place order',
    });
  }
});

// Cancel order
router.delete('/orders/:orderId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const service = initializeTradingService();

    const result = await service.cancelOrder(orderId!, req.user!.id);

    if (result.success) {
      return res.json({
        success: true,
        message: 'Order cancelled successfully',
      });
    } else {
      return res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to cancel order',
    });
  }
});

// Get trading signals
router.get('/signals', [
  query('symbol').optional().isString(),
  query('strategyId').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const service = initializeTradingService();
    const { symbol, strategyId, limit } = req.query;

    const signals = await service.getSignals({
      userId: req.user!.id,
      symbol: symbol as string,
      strategyId: strategyId as string,
      limit: parseInt(limit as string) || 50,
    });

    return res.json({
      success: true,
      data: signals,
    });
  } catch (error) {
    console.error('Get signals error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get trading signals',
    });
  }
});

// Get trading performance
router.get('/performance', [
  query('period').optional().isIn(['1d', '7d', '30d', '90d', '1y', 'all']),
  query('strategyId').optional().isString(),
], async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const service = initializeTradingService();
    const { period, strategyId } = req.query;

    const performance = await service.getPerformance({
      userId: req.user!.id,
      period: (period as string) || '30d',
      strategyId: strategyId as string,
    });

    return res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Get performance error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get trading performance',
    });
  }
});

// Get trading metrics
router.get('/metrics', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const service = initializeTradingService();
    const metrics = await service.getMetrics(req.user!.id);

    return res.json({
      success: true,
      data: metrics,
    });
  } catch (error) {
    console.error('Get metrics error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get trading metrics',
    });
  }
});

export default router;