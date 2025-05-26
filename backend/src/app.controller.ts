import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JWTUser } from './auth/decorators/jwtUser.decorator';
import { Public } from './auth/decorators/public.decorator';
import { Roles } from './auth/decorators/roles.decorator';
import { JWTPayload, UserRole } from './common/types';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get Hello' })
  @ApiResponse({
    status: 200,
    description: 'Greetings!',
    schema: {
      type: 'string',
      example: 'Hello World!',
    },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/protected')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Hello' })
  @ApiResponse({
    status: 200,
    description: 'Greetings!',
    schema: {
      type: 'string',
      example: 'Hello user!',
    },
  })
  getProtectedHello(@JWTUser() JWTPayload: JWTPayload): string {
    return this.appService.getHello(JWTPayload);
  }

  @Get('/admin-protected')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Hello' })
  @ApiResponse({
    status: 200,
    description: 'Greetings!',
    schema: {
      type: 'string',
      example: 'Hello admin!',
    },
  })
  getAdminProtectedHello(@JWTUser() JWTPayload: JWTPayload): string {
    return this.appService.getHello(JWTPayload);
  }
}
