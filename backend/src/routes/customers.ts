import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate } from '../middleware/auth';
import { requireTenant } from '../middleware/tenantAuth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authenticate);

// Get customers for a tenant
router.get('/tenant/:tenantId', requireTenant, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const { page = '1', limit = '50', search } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { tenantId };
    if (search) {
      where.OR = [
        { email: { contains: search as string, mode: 'insensitive' } },
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { totalSpent: 'desc' },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          totalSpent: true,
          ordersCount: true,
          createdAt: true,
        },
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
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

// Get top customers
router.get('/tenant/:tenantId/top', requireTenant, async (req, res, next) => {
  try {
    const { tenantId } = req.params;
    const limit = parseInt(req.query.limit as string) || 5;

    const customers = await prisma.customer.findMany({
      where: { tenantId },
      orderBy: { totalSpent: 'desc' },
      take: limit,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        totalSpent: true,
        ordersCount: true,
      },
    });

    res.json({
      success: true,
      data: customers,
    });
  } catch (error) {
    next(error);
  }
});

export default router;

