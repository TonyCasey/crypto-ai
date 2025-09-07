import { Router } from 'express';
import { body, query, validationResult } from 'express-validator';
import { prisma } from '@cryptobot/database';
import { AuthenticatedRequest } from '../middleware/auth-middleware';
import { TradingStrategyType } from '@cryptobot/types';

const router = Router();

// Get user strategies
router.get('/', [
  query('active').optional().isBoolean(),
], async (req: AuthenticatedRequest, res) => {
  try {
    const { active } = req.query;
    
    const strategies = await prisma.tradingStrategy.findMany({
      where: {
        userId: req.user!.id,
        ...(active !== undefined && { isActive: active === 'true' }),
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: strategies,
    });
  } catch (error) {
    console.error('Get strategies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get strategies',
    });
  }
});

// Create strategy
router.post('/', [
  body('name').isString().isLength({ min: 1, max: 100 }),
  body('type').isIn(Object.values(TradingStrategyType)),
  body('description').optional().isString().isLength({ max: 500 }),
  body('symbols').isArray().custom((symbols) => {
    return symbols.every((symbol: any) => typeof symbol === 'string');
  }),
  body('timeFrame').isIn(['1m', '5m', '15m', '30m', '1h', '4h', '12h', '1d', '1w', '1M']),
  body('parameters').isObject(),
  body('riskParameters').isObject(),
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const strategy = await prisma.tradingStrategy.create({
      data: {
        ...req.body,
        userId: req.user!.id,
      },
    });

    res.status(201).json({
      success: true,
      data: strategy,
    });
  } catch (error) {
    console.error('Create strategy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create strategy',
    });
  }
});

// Update strategy
router.put('/:id', [
  body('name').optional().isString().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().isLength({ max: 500 }),
  body('isActive').optional().isBoolean(),
  body('symbols').optional().isArray(),
  body('parameters').optional().isObject(),
  body('riskParameters').optional().isObject(),
], async (req: AuthenticatedRequest, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array(),
      });
    }

    const { id } = req.params;
    
    const strategy = await prisma.tradingStrategy.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found',
      });
    }

    const updatedStrategy = await prisma.tradingStrategy.update({
      where: { id },
      data: req.body,
    });

    res.json({
      success: true,
      data: updatedStrategy,
    });
  } catch (error) {
    console.error('Update strategy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update strategy',
    });
  }
});

// Delete strategy
router.delete('/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const strategy = await prisma.tradingStrategy.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found',
      });
    }

    await prisma.tradingStrategy.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Strategy deleted successfully',
    });
  } catch (error) {
    console.error('Delete strategy error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete strategy',
    });
  }
});

// Get strategy performance
router.get('/:id/performance', async (req: AuthenticatedRequest, res) => {
  try {
    const { id } = req.params;
    
    const strategy = await prisma.tradingStrategy.findFirst({
      where: {
        id,
        userId: req.user!.id,
      },
    });

    if (!strategy) {
      return res.status(404).json({
        success: false,
        error: 'Strategy not found',
      });
    }

    // Get signals and executions for this strategy
    const signals = await prisma.tradingSignal.findMany({
      where: { strategyId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const executions = await prisma.strategyExecution.findMany({
      where: { strategyId: id },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    // Calculate basic performance metrics
    const totalSignals = signals.length;
    const executedSignals = executions.filter(e => e.status === 'EXECUTED').length;
    const successRate = totalSignals > 0 ? (executedSignals / totalSignals) * 100 : 0;

    const performance = {
      totalSignals,
      executedSignals,
      successRate,
      recentSignals: signals.slice(0, 10),
      recentExecutions: executions.slice(0, 10),
    };

    res.json({
      success: true,
      data: performance,
    });
  } catch (error) {
    console.error('Get strategy performance error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get strategy performance',
    });
  }
});

export default router;