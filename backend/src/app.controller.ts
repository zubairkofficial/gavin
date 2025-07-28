import { Body, Controller, Delete, Get, Param, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { JWTUser } from './auth/decorators/jwtUser.decorator';
import { Public } from './auth/decorators/public.decorator';
import { Roles } from './auth/decorators/roles.decorator';
import { JWTPayload, UserRole } from './common/types';
import { TasksService, CronJobInfo } from './tasks.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from './documents/entities/status.entity';
import { Repository } from 'typeorm';
import { Crons } from './cron.entity';
import { Configuration } from './documents/entities/configuration.entity';

let isProcessing = false;

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService ,
     private readonly tasksService: TasksService,
     @InjectRepository(Status)
         private StatusRepository: Repository<Status>,
     @InjectRepository(Crons)
         private cronRepository: Repository<Crons>,
     @InjectRepository(Configuration)
         private configurationRepository: Repository<Configuration>,
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

    if(isProcessing === true){
      return { message: 'Task is already running in background' };
    }
     isProcessing = true

     this.tasksService.scrape().then(() => {
        isProcessing = false}); 
  
    return { message: 'Task started successfully' };
  }

  @Post('add')
   async  addJob(@Body() body: { name: string; cron: string }) {

    const data = await this.cronRepository.findOne({ where: { jobName: body.name } });
    if(data){
      const error ={
        error : `job already exist with name ${body.name}`,
        staus : 'flase'
      } 
      return error
    }
     const cron = new Crons();
     cron.cronExpresion = body.cron;
     cron.jobName = body.name;
     
     const crons = await this.cronRepository.save(cron);
     console.log(crons);

      return this.tasksService.addCronJob(body.name, body.cron);
    }

  @Get('jobs')
  getJobs(): CronJobInfo[] {
    return this.tasksService.getCronJobs();
  }

  @Delete(':name')
    deleteJob(@Param('name') name: string) {
      return this.tasksService.deleteCronJob(name);
    }

}
