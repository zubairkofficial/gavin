import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import { z } from 'zod';
import { StructuredOutputParser } from "langchain/output_parsers";

@Injectable()
export class OpenAIServiceRegulation {
  private openai: OpenAI;
  private regulationParser: StructuredOutputParser<any>;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    }
    this.openai = new OpenAI({ apiKey });

    // Define the schema for regulation output
    const regulationSchema = z.object({
      regulations: z.array(z.object({
        jurisdiction: z.string(),
        citation: z.string(),
        title: z.string(),
        section: z.string(),
        subject_area: z.string(),
        summary: z.string()
      }))
    });

    this.regulationParser = StructuredOutputParser.fromZodSchema(regulationSchema);
  }

  async analyzeRegulations(documentText: string) {
    const formatInstructions = this.regulationParser.getFormatInstructions();

    const prompt = `
    Analyze the following regulatory document and extract structured information.
    
    ${formatInstructions}

    Additional requirements:
    - Extract key regulatory information from the document
    - jurisdiction: The governing jurisdiction/authority
    - citation: The formal legal citation or reference number
    - title: The official title of the regulation
    - section: Specific section or article numbers
    - subject_area: The primary subject matter or domain
    - summary: A concise summary of the key requirements

    Document text:
    ${documentText}`;

    try {
      const completion = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
      });

      const text = completion.choices[0].message.content;
      if (!text) {
        throw new Error('No response from OpenAI');
      }

      // Parse the response using the structured parser
      const parsedOutput = await this.regulationParser.parse(text);

      // Return the regulations array
      return (parsedOutput as any).regulations;

    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error(`Failed to analyze regulations: ${error.message}`);
    }
  }
}