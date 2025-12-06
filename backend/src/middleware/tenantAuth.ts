import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { CustomError } from './errorHandler';
import { AuthRequest } from './auth';

const prisma = new PrismaClient();

export interface TenantRequest extends AuthRequest {
  tenantId?: string;
}

export const requireTenant = async (
  req: TenantRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const tenantId = req.params.tenantId || req.body.tenantId || req.query.tenantId;

    if (!tenantId) {
      throw new CustomError('Tenant ID required', 400);
    }

    // Verify tenant exists and user has access (in a real app, check user-tenant relationship)
    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new CustomError('Tenant not found', 404);
    }

    if (!tenant.isActive) {
      throw new CustomError('Tenant is not active', 403);
    }

    req.tenantId = tenantId;
    next();
  } catch (error) {
    next(error);
  }
};

