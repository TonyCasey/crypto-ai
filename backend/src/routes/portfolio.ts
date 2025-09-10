import { Router, Request, Response } from 'express';
import { prisma } from '@cryptobot/database';
import { AuthenticatedRequest } from '../middleware/auth-middleware';

const router: Router = Router();

// Get user portfolio
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const portfolio = await prisma.portfolio.findFirst({
      where: {
        userId: req.user!.id,
      },
      include: {
        balances: true,
      },
    });

    if (!portfolio) {
      // Create default portfolio if none exists
      const newPortfolio = await prisma.portfolio.create({
        data: {
          userId: req.user!.id,
          totalValue: 0,
          availableBalance: 0,
          lockedBalance: 0,
          balances: {
            create: {
              currency: 'USD',
              total: 10000, // Demo balance
              available: 10000,
              locked: 0,
            },
          },
        },
        include: {
          balances: true,
        },
      });

      return res.json({
        success: true,
        data: newPortfolio,
      });
    }

    return res.json({
      success: true,
      data: portfolio,
    });
  } catch (error) {
    console.error('Get portfolio error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get portfolio',
    });
  }
});

// Get positions
router.get('/positions', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const positions = await prisma.position.findMany({
      where: {
        exchangeConfig: {
          userId: req.user!.id,
        },
      },
      include: {
        exchangeConfig: {
          select: {
            name: true,
            type: true,
          },
        },
        tradingPair: {
          select: {
            baseCurrency: true,
            quoteCurrency: true,
          },
        },
      },
    });

    return res.json({
      success: true,
      data: positions,
    });
  } catch (error) {
    console.error('Get positions error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get positions',
    });
  }
});

// Get portfolio history
router.get('/history', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // This is simplified - in a real app you'd store portfolio snapshots
    const orders = await prisma.order.findMany({
      where: {
        exchangeConfig: {
          userId: req.user!.id,
        },
        status: 'FILLED',
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        symbol: true,
        side: true,
        size: true,
        price: true,
        fees: true,
        createdAt: true,
      },
    });

    // Calculate running totals (simplified)
    let runningTotal = 10000; // Starting balance
    const history = orders.reverse().map((order: any) => {
      const orderValue = parseFloat(order.size.toString()) * parseFloat(order.price?.toString() || '0');
      const fees = parseFloat(order.fees.toString());
      
      if (order.side === 'BUY') {
        runningTotal -= (orderValue + fees);
      } else {
        runningTotal += (orderValue - fees);
      }

      return {
        timestamp: order.createdAt,
        totalValue: runningTotal,
        change: order.side === 'BUY' ? -(orderValue + fees) : (orderValue - fees),
        order: {
          symbol: order.symbol,
          side: order.side,
          size: order.size.toString(),
          price: order.price?.toString(),
        },
      };
    }).reverse();

    return res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    console.error('Get portfolio history error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get portfolio history',
    });
  }
});

export default router;