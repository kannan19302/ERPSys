import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
/**
 * Annotates NestJS controllers or handlers with the required RBAC permissions.
 * Example: @Permissions('finance.invoice.create')
 */
export const Permissions = (...permissions: string[]) => SetMetadata(PERMISSIONS_KEY, permissions);
