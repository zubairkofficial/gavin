import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { z } from 'zod';
import { StructuredOutputParser } from "langchain/output_parsers";

@Injectable()
export class GeminiServiceRegulation {
  private genAI: GoogleGenerativeAI;
  private regulationParser: StructuredOutputParser<any>;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is not set');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);

    // Define the schema for regulation output
    const regulationSchema = z.object({
      regulations: z.array(z.object({
        jurisdiction: z.string(),
        citation: z.string(),
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
    - Extract all regulatory provisions from the document
    - jurisdiction: Identify the governing jurisdiction
    - citation: The formal citation or reference number
    - section: The specific section or article number
    - subject_area: The main topic or area of regulation
    - summary: A concise summary of the regulation's requirements

    Document text:
    ${documentText}`;

    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      if (!text) {
        throw new Error('No response from Google Generative AI');
      }

      // Parse the response using the structured parser
      const parsedOutput = await this.regulationParser.parse(text);

      // Return the regulations array
      return (parsedOutput as any).regulations;

    } catch (error) {
      console.error('Google AI API Error:', error);
      throw new Error(`Failed to analyze regulations: ${error.message}`);
    }
  }
}