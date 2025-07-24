import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { ConfigService } from './config.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Status } from '@/documents/entities/status.entity';
import { Configuration } from '@/documents/entities/configuration.entity';
import { Repository } from 'typeorm';

@Controller('config')
export class ConfigController {
       @InjectRepository(Configuration)
           private configurationRepository: Repository<Configuration>
  constructor(
    private readonly ConfigService: ConfigService,
  ) {}


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

   @Post('add-credits')
  async addCredits(@Req() req,
    @Body() body: { credits: number },) {
    const userId = req.user?.id;
    const credits = body.credits;

    console.log('creadits recived', body)

    return await this.ConfigService.addCredits(userId, credits);
  }

  @Post('manage-credits')
  async manageCredits(@Body() body: { cutCreditsPerToken: number, minimumCreditsToSend: number }) {
    const minmessage = body.minimumCreditsToSend;
    const cutcredits = body.cutCreditsPerToken;


    return await this.ConfigService.manageCredits(minmessage, cutcredits);
  }

  @Get('get-credits')
  async getCredits() {

    return await this.ConfigService.getCredits();
  }



}



  
