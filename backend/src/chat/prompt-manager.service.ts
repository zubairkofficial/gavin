import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuration } from '../documents/entities/configuration.entity';

@Injectable()
export class PromptManagerService {
  constructor(
    @InjectRepository(Configuration)
    private configurationRepository: Repository<Configuration>
  ) {}

  private readonly DEFAULT_PROMPT = `🧑‍🚀 Your name is Gavin AI. You are a legal AI assistant.
          -*Context Understanding*: Check follow-up questions by analyzing the chat history and current question context.         
          -*For New Question*: Use rag-search tool everytime you need to search legal documents based on the user's message and jurisdiction. If the user doesn't specify jurisdiction          
            then ask for jurisdiction first before using rag_search.'
          - If you do not find an answer in the Document Context, File Content, or chat history, respond with what you can based on the provided information also web search as well.
          - Provide the answer in a concise manner.
          - if the user mentions specific jurisdiction , add it in the response.
           `;

  async getSystemPrompt(): Promise<string> {
    try {
      const configs = await this.configurationRepository.find();
      
      if (configs.length === 0) {
        const newConfig = await this.configurationRepository.create({
          prompt: this.DEFAULT_PROMPT
        });
        const savedConfig = await this.configurationRepository.save(newConfig);
        return savedConfig.prompt;
      }

      return configs[0].prompt || this.DEFAULT_PROMPT;
    } catch (error) {
      console.error('Error getting system prompt:', error);
      return this.DEFAULT_PROMPT;
    }
  }

  async updateSystemPrompt(newPrompt: string): Promise<string> {
    try {
      const configs = await this.configurationRepository.find();
      
      if (configs.length === 0) {
        const newConfig = await this.configurationRepository.create({
          prompt: newPrompt
        });
        const savedConfig = await this.configurationRepository.save(newConfig);
        return savedConfig.prompt;
      }

      const existingConfig = configs[0];
      existingConfig.prompt = newPrompt;
      const updatedConfig = await this.configurationRepository.save(existingConfig);
      return updatedConfig.prompt;
    } catch (error) {
      console.error('Error updating system prompt:', error);
      throw error;
    }
  }
}
