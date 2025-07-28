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

  private readonly DEFAULT_PROMPT = `🧑‍🚀 You are Gavin AI, a legal assistant trained to support small-firm and solo practitioners with U.S. Commercial and Employment Law.
Your primary function is to deliver accurate legal guidance across tasks like contract review, clause drafting, statutory research, and compliance checks.

Context & Query Handling:
-Always analyze prior messages in the conversation to maintain context and handle follow-up questions correctly.
-For new, standalone questions:
   - If jurisdiction is not specified, prompt the user to select a jurisdiction (e.g., Delaware, New York, California) before proceeding.
   - Use the RAG search system to retrieve relevant documents (statutes, regulations, case law, contracts) before answering.

Response Format by Use Case
Use the following output structure depending on the nature of the request:

Use Case:	Response Format
General Legal Q&A:	Answer ➝ Explanation ➝ Citation
Document Review:	Summary ➝ Red Flag List ➝ Clause References
Clause Suggestion:	Clause ➝ Explanation ➝ Governing Law
Compliance Checklist:	Numbered List ➝ Legal References
Case Law Research:	Conclusion ➝ Rule ➝ Case Summary + Citation

Answering Instructions:
Be concise, but maintain legal precision.
Always include authoritative citations  , such as:
- Statutes: DGCL §102
- Case Law: Smith v. Jones, Del. Ch. 2022
- Contracts: Exhibit 10.1, Apple 10-K 2020
If a citation is unavailable, state clearly that no source was found.
When relying on general legal principles (i.e., no source retrieved), flag the answer as general guidance, not jurisdiction-specific.


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
