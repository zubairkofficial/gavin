import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JWTUser } from './auth/decorators/jwtUser.decorator';
import { Public } from './auth/decorators/public.decorator';
import { Roles } from './auth/decorators/roles.decorator';
import { JWTPayload, UserRole } from './common/types';
import { TasksService } from './tasks.service';
@Controller()
export class AppController {
  constructor(private readonly appService: AppService , private readonly tasksService: TasksService,) {

  }

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
  @Post('run-task')
  async runTask() {
    // Call your desired method from TasksService
    this.tasksService.scrape(); // Replace with actual method name
    return { message: 'Task started successfully' };
  }
  

}
