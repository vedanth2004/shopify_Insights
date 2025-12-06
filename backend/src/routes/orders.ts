import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenantAuth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get orders for a tenant
router.get('/tenant/:tenantId', requireTenant, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { page = '1', limit = '50', startDate, endDate } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { tenantId };
    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        where.orderDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.orderDate.lte = new Date(endDate as string);
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { orderDate: 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          lineItems: {
            take: 5,
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      success: true,
      data: orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;

