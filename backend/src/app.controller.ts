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

  @Post('set-systemprompt')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set or update system prompt for a user' })
  @ApiResponse({
    status: 200,
    description: 'System prompt set successfully',
  })
  async setSystemPrompt(
    @Req() req: any,
    @Body() body: { prompt: string }
  ) {
    let systemPrompt = await this.configurationRepository.find({
    });
    // console.log('System prompt:', systemPrompt);
    // if(systemPrompt) {
    //   console.log('System prompt already exists for user:', req.user.id);
    // }else{
    //   console.log('Creating new system prompt for user:', req.user.id);
    // }

    if (systemPrompt.length > 0) {
      // console.log('we are in if');
     const existingPrompt = systemPrompt[0]; // Get the first prompt since we only need one
        existingPrompt.prompt = body.prompt;
        await this.configurationRepository.save(existingPrompt);
        return {
            message: 'System prompt updated successfully',
            systemPrompt: existingPrompt
        };
    } else {
      // console.log('we are in else');
      const newPrompt = this.configurationRepository.create({
            prompt: body.prompt
        });
        const savedPrompt = await this.configurationRepository.save(newPrompt);
        return {
            message: 'System prompt created successfully',
            systemPrompt: savedPrompt
        };
    }
  }

  @Get('get-prompt')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system prompt for the authenticated user' })
  @ApiResponse({
    status: 200,
    description: 'System prompt retrieved successfully',
  })
  async getSystemPrompt(@Req() req: any) {
    // console.log('Fetching system prompt for user:', req.user.id);
    const systemPrompt = await this.configurationRepository.find({
    });

    if (systemPrompt.length === 0) {
      return {
        message: 'No system prompt found for this user',
        systemPrompt: null
      };
    }

    return {
      message: 'System prompt retrieved successfully',
      systemPrompt
    };
  }
}
