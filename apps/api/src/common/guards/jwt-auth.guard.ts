import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { verifyToken } from '@unerp/auth';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedException('Token is required');
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      throw new UnauthorizedException('Invalid or expired authentication token');
    }

    // Attach decoded token payload (contains tenantId and userId) to the request object
    request.user = decoded;
    return true;
  }
}
