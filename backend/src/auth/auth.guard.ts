import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { JWTPayload } from '../common/types';
import { DataSource } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private reflector: Reflector,
    @Inject(DataSource) 
    private readonly dataSource: DataSource
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const request: Request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload: JWTPayload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get('JWT_SECRET'),
      });

      // 💡 We're assigning the payload to the request object here
      // so that we can access it in our route handlers
      request['user'] = payload;

      const user = await this.dataSource.getRepository(User).findOne({
        where: {
          id: payload.id,
          isActive: true
        }
      })
      
      if (!user) {
        throw new UnauthorizedException();
      }

      const roles: string[] = this.reflector.getAllAndOverride('roles', [
        context.getHandler(),
        context.getClass(),
      ]);
      if (!roles || !roles.length) {
        return true;
      }

      const hasRole = !!payload?.role && roles.includes(payload.role);
      if (!payload?.role || !hasRole) {
        throw new ForbiddenException('You do not have permission (Roles)');
      }
      return true;
    } catch {
      throw new UnauthorizedException();
    }
  }

  private extractTokenFromHeader(request: Request): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
