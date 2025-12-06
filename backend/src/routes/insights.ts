import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenantAuth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get dashboard insights for a tenant
router.get('/tenant/:tenantId/dashboard', requireTenant, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.orderDate = {};
      if (startDate) {
        // Set to start of day
        const start = new Date(startDate as string);
        start.setHours(0, 0, 0, 0);
        dateFilter.orderDate.gte = start;
      }
      if (endDate) {
        // Set to end of day to include the full day
        const end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
        dateFilter.orderDate.lte = end;
      }
    }

    // Total metrics
    const [totalCustomers, totalOrders, totalRevenue, topCustomers] = await Promise.all([
      prisma.customer.count({ where: { tenantId } }),
      prisma.order.count({
        where: {
          tenantId,
          ...dateFilter,
        },
      }),
      prisma.order.aggregate({
        where: {
          tenantId,
          ...dateFilter,
        },
        _sum: {
          totalPrice: true,
        },
      }),
      prisma.customer.findMany({
        where: { tenantId },
        orderBy: { totalSpent: 'desc' },
        take: 5,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          totalSpent: true,
          ordersCount: true,
        },
      }),
    ]);

    // Orders by date (for chart)
    const ordersByDate = await prisma.order.groupBy({
      by: ['orderDate'],
      where: {
        tenantId,
        ...dateFilter,
      },
      _count: {
        id: true,
      },
      _sum: {
        totalPrice: true,
      },
      orderBy: {
        orderDate: 'asc',
      },
    });

    // Revenue trend
    const revenueByDate = ordersByDate.map((item) => ({
      date: item.orderDate.toISOString().split('T')[0],
      orders: item._count.id,
      revenue: item._sum.totalPrice || 0,
    }));

    // Product performance
    const topProducts = await prisma.product.findMany({
      where: { tenantId },
      orderBy: { totalRevenue: 'desc' },
      take: 5,
      select: {
        id: true,
        title: true,
        totalSales: true,
        totalRevenue: true,
      },
    });

    res.json({
      success: true,
      data: {
        metrics: {
          totalCustomers,
          totalOrders,
          totalRevenue: totalRevenue._sum.totalPrice || 0,
        },
        topCustomers,
        topProducts,
        revenueTrend: revenueByDate,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

