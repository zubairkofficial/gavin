import { User } from '@/auth/entities/user.entity';
import { Configuration } from '@/documents/entities/configuration.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ConfigService {

    @InjectRepository(User)
    private usersRepository: Repository<User>;
    @InjectRepository(Configuration)
      private configurationRepository: Repository<Configuration>;

    constructor(

    ) { }


    async addCredits(userId: string, credits: number) {
        // Get user from repository
        const user = await this.usersRepository.findOne({
            where: {
                id: userId
            }
        });

        if (!user) {
            throw new Error('User not found');
        }

        // Update credits field
        const updatedCredits = (user.credits || 0) + credits;

        // Update user with new credits
        const updatedUser = await this.usersRepository.update(userId, {
            credits: updatedCredits
        });

        return {
            message: 'Credits added successfully',
            userId: userId,
            previousCredits: user.credits || 0,
            addedCredits: credits,
            totalCredits: updatedCredits,
            user: updatedUser
        };
    }


     async manageCredits(minmessage: number, cutcredits: number) {
    // Check if configuration data exists
    const existingConfig = await this.configurationRepository.find();

    if (existingConfig) {
      console.log(existingConfig)
    }

    if (existingConfig) {
      // Update existing configuration
      // const updatedConfig = await this.configurationRepository.update( {
      //   minTokens : minmessage,
      //   cutCredits : cutcredits 
      // });

      //   const data = new Configuration()
      //  data.minTokens = minmessage
      //    data.cutCredits = cutcredits

      const existingPrompt = existingConfig[0]; // Get the first prompt since we only need one
      existingPrompt.minTokens = minmessage;
      existingPrompt.cutCredits = cutcredits;
      const updatedConfig = await this.configurationRepository.save(existingPrompt);

      //  const updatedConfig =  await this.configurationRepository.update(
      //   data)




      return {
        message: 'Configuration updated successfully',
        configuration: updatedConfig,
        action: 'updated'
      };
    } else {
      // Create new configuration
      const newConfig = await this.configurationRepository.create({
        minTokens: minmessage,
        cutCredits: cutcredits
      });

      return {
        message: 'Configuration created successfully',
        configuration: newConfig,
        action: 'created'
      };
    }
  }


  async getCredits(): Promise<{ minMessages: number, cutCredits: number }> {
    // Get user from repository
    const data = await this.configurationRepository.find();

    if (!data || data.length === 0) {
      throw new Error('we dont have any configuration data');
    }

    return {
      minMessages: data[0].minTokens || 0, // Assuming minTokens is the field for credits
      cutCredits: data[0].cutCredits || 0 // Assuming cutCredits is the field for credits deduction
    };
  }
}
