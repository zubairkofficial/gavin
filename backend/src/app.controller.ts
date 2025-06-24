import { Controller, Get, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JWTUser } from './auth/decorators/jwtUser.decorator';
import { Public } from './auth/decorators/public.decorator';
import { Roles } from './auth/decorators/roles.decorator';
import { JWTPayload, UserRole } from './common/types';
import { TasksService } from './tasks.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from './documents/entities/status.entity';
import { Repository } from 'typeorm';

let isProcessing = false;

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService ,
     private readonly tasksService: TasksService,
     @InjectRepository(Status)
         private StatusRepository: Repository<Status>,
  ) {

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

   
  //   const statusList: Status[] = await this.StatusRepository.find({ where: { isScraping: true } });
  // if (statusList.length > 0) {
  //   return { message: 'Task is already running in background' };
  // }

  // const status = this.StatusRepository.create({ isScraping: true });
  // await this.StatusRepository.save(status);
    if(isProcessing === true){
      return { message: 'Task is already running in background' };
    }
     isProcessing = true

     this.tasksService.scrape().then(() => {
        isProcessing = false}); 
  
    return { message: 'Task started successfully' };
  }
  

}
